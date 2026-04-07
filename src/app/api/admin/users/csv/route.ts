import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { hashPassword } from '@/lib/password';
import { logAudit } from '@/lib/audit';
import { parse } from 'csv-parse/sync';
import iconv from 'iconv-lite';

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) return Response.json({ error: '権限がありません' }, { status: 403 });

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
        return Response.json({ error: 'ファイルが必要です' }, { status: 400 });
    }

    const bytes = await (file as Blob).arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    let text = '';
    try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch (e) {
        text = iconv.decode(buffer, 'CP932');
    }

    let records: Record<string, string>[];
    try {
        records = parse(text, { 
            columns: true, 
            skip_empty_lines: true, 
            trim: true, 
            bom: true,
            relax_column_count: true 
        });
    } catch (err) {
        return Response.json({ error: 'CSV解析失敗。正しい形式で保存されているか確認してください。' }, { status: 400 });
    }

    const headerMap: Record<string, string> = {
        '社員番号': 'employee_number',
        '氏名': 'name',
        'メールアドレス': 'email',
        '権限': 'role',
        '役員区分': 'union_role',
        '支部役員': 'union_role_branch',
        '職務': 'job_title',
        '雇用区分': 'employment_type',
        '店舗コード': 'store_code',
        '生年月日': 'birthday',
        'パスワード': 'password',
        '削除': 'is_deleted'
    };

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const sendUpdate = (data: any) => {
                controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
            };

            try {
                let successCount = 0;
                const errors: { row: number; message: string }[] = [];

                // Master data fetch
                let storeMap = new Map();
                let existingEmpNumbers = new Set<string>();
                try {
                    const stores = await query('SELECT id, code FROM stores');
                    stores.forEach((s: any) => storeMap.set(String(s.code).trim().padStart(3, '0'), s.id));
                    const existingUsers = await query('SELECT employee_number FROM users');
                    existingUsers.forEach((u: any) => existingEmpNumbers.add(String(u.employee_number).trim()));
                } catch (e: any) {
                    sendUpdate({ error: 'DB接続エラーです' });
                    controller.close();
                    return;
                }

                const commonHeaderMap: Record<string, string> = {
                    '社員番号': 'employee_number', '社員コード': 'employee_number',
                    '氏名': 'name', '名前': 'name',
                    'メールアドレス': 'email', 'メール': 'email',
                    '権限': 'role', 'ロール': 'role',
                    '役員区分': 'union_role', '役職区分': 'union_role', '役員': 'union_role',
                    '支部役員': 'union_role_branch', '店舗役員': 'union_role_branch',
                    '職務': 'job_title', '役職': 'job_title',
                    '雇用区分': 'employment_type', '雇用': 'employment_type',
                    '店舗コード': 'store_code', '店舗番号': 'store_code', 'ストアコード': 'store_code', '店舗': 'store_code',
                    '生年月日': 'birthday', '誕生日': 'birthday',
                    'パスワード': 'password',
                    '削除': 'is_deleted', 'ユーザー削除': 'is_deleted'
                };

                // Pre-normalize all records with the expanded headerMap
                const normalizedRecords = records.map(rawRow => {
                    const row: Record<string, string> = {};
                    for (const [key, val] of Object.entries(rawRow)) {
                        const k = key.trim();
                        const normalizedKey = commonHeaderMap[k] || headerMap[k] || k;
                        row[normalizedKey] = val;
                    }
                    return row;
                });

                // Password Caching
                const passwordCache = new Map<string, string>();
                const uniquePasswords = new Set<string>();
                for (const row of normalizedRecords) {
                    const pw = row.password?.trim();
                    if (pw) uniquePasswords.add(pw);
                    const bd = row.birthday?.trim();
                    if (bd && !bd.includes('#') && bd.length >= 8) {
                        const clean = bd.replace(/[\/\.]/g, '-');
                        const parts = clean.split('-');
                        if (parts.length === 3) uniquePasswords.add(`${parts[0]}${parts[1].padStart(2, '0')}${parts[2].padStart(2, '0')}`);
                    }
                }
                
                if (uniquePasswords.size > 0) {
                    const pws = Array.from(uniquePasswords);
                    const hashEntries = await Promise.all(pws.map(async (pw) => [pw, await hashPassword(pw)] as const));
                    for (const [pw, hash] of hashEntries) passwordCache.set(pw, hash);
                }

                // Chunk processing
                const chunkSize = 100;
                for (let i = 0; i < normalizedRecords.length; i += chunkSize) {
                    const chunk = normalizedRecords.slice(i, i + chunkSize);
                    const cols = { emp_nums: [], names: [], emails: [], roles: [], union_roles: [], union_role_branches: [], emp_types: [], job_titles: [], birthdays: [], store_ids: [], pw_hashes: [] } as any;
                    const delete_nums: string[] = [];

                    for (let j = 0; j < chunk.length; j++) {
                        const rowNum = i + j + 2;
                        const row = chunk[j];
                        let { employee_number, name, email, role, union_role, union_role_branch, job_title, employment_type, store_code, birthday, password, is_deleted } = row;
                        
                        if (!employee_number || (!name && is_deleted !== '1')) {
                            errors.push({ row: rowNum, message: '社員番号または氏名が不足しています' });
                            continue;
                        }
                        
                        employee_number = String(employee_number).trim();
                        if (/^\d+$/.test(employee_number)) {
                            employee_number = employee_number.padStart(6, '0');
                        }

                        if (is_deleted === '1') {
                            delete_nums.push(employee_number);
                            continue;
                        }

                        name = name ? name.replace(/[\s\u3000]+/g, '') : '';
                        
                        let cleanBirthday = null;
                        if (birthday && typeof birthday === 'string' && !birthday.includes('#')) {
                            const temp = birthday.trim().replace(/[\/\.]/g, '-');
                            const bparts = temp.split('-');
                            if (bparts.length === 3) {
                                const y = bparts[0].trim();
                                const m = bparts[1].trim().padStart(2, '0');
                                const d = bparts[2].trim().padStart(2, '0');
                                if (y.length === 4 && !isNaN(Number(y)) && !isNaN(Number(m)) && !isNaN(Number(d))) {
                                    cleanBirthday = `${y}-${m}-${d}`;
                                }
                            }
                        }

                        const isUpdate = existingEmpNumbers.has(employee_number);
                        const rawPw = password?.trim();
                        const pwHash = rawPw ? (passwordCache.get(rawPw) || (await hashPassword(rawPw))) : '';

                        if (!isUpdate && !pwHash && !cleanBirthday) {
                            errors.push({ row: rowNum, message: '新規登録にはパスワードが必要です' });
                            continue;
                        }

                        let storeId = null;
                        if (store_code) {
                            const sCode = String(store_code).trim().padStart(3, '0');
                            storeId = storeMap.get(sCode) || storeMap.get(String(store_code).trim()) || null;
                        }

                        cols.emp_nums.push(employee_number);
                        cols.names.push(name);
                        cols.emails.push(email || null);
                        cols.roles.push(role || 'GENERAL');
                        cols.union_roles.push(union_role || null);
                        const cleanBranch = (union_role_branch === '0' || union_role_branch === '00') ? null : (union_role_branch || null);
                        cols.union_role_branches.push(cleanBranch);
                        cols.emp_types.push(employment_type || '10');
                        cols.job_titles.push(job_title || null);
                        cols.birthdays.push(cleanBirthday);
                        cols.store_ids.push(storeId);
                        cols.pw_hashes.push(pwHash);
                    }

                    if (cols.emp_nums.length > 0) {
                        try {
                            await query(`
                                INSERT INTO users (employee_number, name, email, role, union_role, union_role_branch, employment_type, job_title, birthday, store_id, password_hash, is_active, must_change_pw)
                                SELECT * FROM UNNEST($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::text[], $9::text[], $10::int[], $11::text[], $12::boolean[], $13::boolean[])
                                AS r(employee_number, name, email, role, union_role, union_role_branch, employment_type, job_title, birthday, store_id, password_hash, is_active, must_change_pw)
                                ON CONFLICT (employee_number) DO UPDATE SET 
                                    name=EXCLUDED.name, role=EXCLUDED.role,
                                    email=COALESCE(EXCLUDED.email, users.email), 
                                    union_role=COALESCE(EXCLUDED.union_role, users.union_role), 
                                    union_role_branch=COALESCE(EXCLUDED.union_role_branch, users.union_role_branch), 
                                    employment_type=COALESCE(EXCLUDED.employment_type, users.employment_type), 
                                    job_title=COALESCE(EXCLUDED.job_title, users.job_title), 
                                    birthday=COALESCE(EXCLUDED.birthday, users.birthday), 
                                    store_id=COALESCE(EXCLUDED.store_id, users.store_id), 
                                    password_hash=(CASE WHEN EXCLUDED.password_hash = '' THEN users.password_hash ELSE EXCLUDED.password_hash END), 
                                    updated_at=NOW()`,
                                [cols.emp_nums, cols.names, cols.emails, cols.roles, cols.union_roles, cols.union_role_branches, cols.emp_types, cols.job_titles, cols.birthdays, cols.store_ids, cols.pw_hashes, new Array(cols.emp_nums.length).fill(true), new Array(cols.emp_nums.length).fill(true)]
                            );
                            successCount += cols.emp_nums.length;
                        } catch (e: any) {
                            console.error('[CSV Batch Insert Error, Fallback to Individual]', e);
                            for (let k = 0; k < cols.emp_nums.length; k++) {
                                try {
                                    await query(`
                                        INSERT INTO users (employee_number, name, email, role, union_role, union_role_branch, employment_type, job_title, birthday, store_id, password_hash, is_active, must_change_pw)
                                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE, TRUE)
                                        ON CONFLICT (employee_number) DO UPDATE SET 
                                            name=EXCLUDED.name, role=EXCLUDED.role,
                                            email=COALESCE(EXCLUDED.email, users.email), 
                                            union_role=COALESCE(EXCLUDED.union_role, users.union_role), 
                                            union_role_branch=COALESCE(EXCLUDED.union_role_branch, users.union_role_branch), 
                                            employment_type=COALESCE(EXCLUDED.employment_type, users.employment_type), 
                                            job_title=COALESCE(EXCLUDED.job_title, users.job_title), 
                                            birthday=COALESCE(EXCLUDED.birthday, users.birthday), 
                                            store_id=COALESCE(EXCLUDED.store_id, users.store_id), 
                                            password_hash=(CASE WHEN EXCLUDED.password_hash = '' THEN users.password_hash ELSE EXCLUDED.password_hash END), 
                                            updated_at=NOW()`,
                                        [cols.emp_nums[k], cols.names[k], cols.emails[k], cols.roles[k], cols.union_roles[k], cols.union_role_branches[k], cols.emp_types[k], cols.job_titles[k], cols.birthdays[k], cols.store_ids[k], cols.pw_hashes[k]]
                                    );
                                    successCount++;
                                } catch (rowErr: any) {
                                    errors.push({ row: i + k + 2, message: rowErr.message });
                                }
                            }
                        }
                    }

                    if (delete_nums.length > 0) {
                        try {
                            await query(`DELETE FROM users WHERE employee_number = ANY($1)`, [delete_nums]);
                            successCount += delete_nums.length;
                        } catch (e: any) {
                            console.warn('[CSV Batch Delete Error, Fallback to Individual]', e);
                            for (const empNum of delete_nums) {
                                try {
                                    await query(`DELETE FROM users WHERE employee_number = $1`, [empNum]);
                                    successCount++;
                                } catch (rowErr: any) {
                                    const rowInChunk = chunk.findIndex(r => {
                                        let code = String(r.employee_number || '').trim();
                                        if (/^\d+$/.test(code)) code = code.padStart(6, '0');
                                        return code === empNum;
                                    });
                                    const rowNum = (rowInChunk !== -1) ? (i + rowInChunk + 2) : i;
                                    let msg = '削除に失敗しました';
                                    if (rowErr.message.includes('foreign key constraint')) {
                                        msg = '関連データ（掲示板や問い合わせ等）があるため削除できません。無効化（有効：0）を検討してください。';
                                    }
                                    errors.push({ row: rowNum, message: msg });
                                }
                            }
                        }
                    }

                    sendUpdate({ type: 'progress', current: Math.min(i + chunkSize, normalizedRecords.length) });
                }

                await logAudit(user, 'USER_CSV_IMPORT', 'users', undefined, { success: successCount, errors: errors.length });
                sendUpdate({ type: 'result', data: { success: successCount, errors } });
            } catch (fatal: any) {
                console.error('[CSV Import Fatal]', fatal);
                sendUpdate({ error: '取り込み中に致命的なエラーが発生しました: ' + fatal.message });
            } finally {
                controller.close();
            }
        }
    });

    return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson' } });
}
