import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin, getAreaGroupId, canAccessStore } from '@/lib/rbac';
import { hashPassword } from '@/lib/password';
import { logAudit } from '@/lib/audit';

const createUserSchema = z.object({
    employeeNumber: z.string().min(1, '社員番号を入力してください').max(20, '社員番号は20文字以内で入力してください'),
    name: z.string().min(1, '氏名を入力してください').max(100, '氏名は100文字以内で入力してください'),
    email: z.string().email('正しいメールアドレスを入力してください').nullable().optional().or(z.literal('')).transform(v => (!v ? null : v)),
    role: z.enum(['GENERAL', 'STORE_ADMIN', 'HQ_ADMIN']).default('GENERAL'),
    storeId: z.number().int().nullable().optional(),
    employmentType: z.string().min(1, '雇用区分を選択してください'),
    unionRole: z.string().min(1, '役員区分を選択してください'),
    unionRoleBranch: z.string().nullable().optional().or(z.literal('')).transform(v => (!v || v === '0' || v === '00' ? null : v)),
    jobTitle: z.string().max(50, '職務は50文字以内で入力してください').nullable().optional().or(z.literal('')).transform(v => (!v ? null : v)),
    birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '生年月日の形式（YYYY-MM-DD）が正しくありません').nullable().optional().or(z.literal('')).transform(v => (!v ? null : v)),
    password: z.string().min(4, 'パスワードは4文字以上で入力してください').nullable().optional().or(z.literal('')).transform(v => (!v ? null : v)),
    isActive: z.boolean().default(true),
});

export async function GET(request: Request) {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) return Response.json({ error: '権限がありません' }, { status: 403 });

    const url = new URL(request.url);
    const search = url.searchParams.get('search') ?? '';
    const storeId = url.searchParams.get('storeId');
    const groupId = url.searchParams.get('groupId');
    const unionRole = url.searchParams.get('unionRole');
    const unionRoleBranch = url.searchParams.get('unionRoleBranch');
    const employmentType = url.searchParams.get('employmentType');
    const isOfficer = url.searchParams.get('isOfficer') === 'true';
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 1000);
    const offset = parseInt(url.searchParams.get('offset') ?? '0');

    const conditions: string[] = ['1=1'];
    const vals: unknown[] = [];
    let idx = 1;

    // STORE_ADMIN can only see own store, unless they are Area Admins
    if (user.role === 'STORE_ADMIN') {
        const areaGroupId = getAreaGroupId(user.unionRole);
        if (areaGroupId) {
            // エリア担当：自エリアの店舗 or 自店舗のユーザー
            if (storeId === 'hq') {
                conditions.push(`u.store_id IS NULL AND 1=0`); // エリア担当は本部を見れない仕様とする
            } else if (storeId) {
                // requested specific store
                conditions.push(`u.store_id = $${idx++}`);
                vals.push(parseInt(storeId));
                // must also enforce that this store is in their area or is their own store
                conditions.push(`(u.store_id = $${idx} OR EXISTS (SELECT 1 FROM stores s2 WHERE s2.id = u.store_id AND s2.group_id = $${idx+1}))`);
                vals.push(user.storeId ?? -1);
                vals.push(areaGroupId);
                idx += 2;
            } else if (groupId) {
                conditions.push(`EXISTS (SELECT 1 FROM stores s2 WHERE s2.id = u.store_id AND s2.group_id = $${idx++})`);
                vals.push(parseInt(groupId));
                // enforce area
                conditions.push(`$${idx - 1} = $${idx++}`);
                vals.push(areaGroupId);
            } else {
                // all permitted users
                conditions.push(`(u.store_id = $${idx} OR EXISTS (SELECT 1 FROM stores s2 WHERE s2.id = u.store_id AND s2.group_id = $${idx+1}))`);
                vals.push(user.storeId ?? -1);
                vals.push(areaGroupId);
                idx += 2;
            }
        } else {
            // 普通の支部長・一般（自店舗のみ）
            conditions.push(`u.store_id = $${idx++}`);
            vals.push(user.storeId ?? -1);
        }
    } else {
        if (storeId === 'hq') {
            conditions.push(`u.store_id IS NULL`);
        } else if (storeId) {
            conditions.push(`u.store_id = $${idx++}`);
            vals.push(parseInt(storeId));
        } else if (groupId) {
            conditions.push(`EXISTS (SELECT 1 FROM stores s2 WHERE s2.id = u.store_id AND s2.group_id = $${idx++})`);
            vals.push(parseInt(groupId));
        }
    }
    
    if (unionRole) {
        conditions.push(`u.union_role = $${idx++}`);
        vals.push(unionRole);
    }
    
    if (unionRoleBranch) {
        conditions.push(`u.union_role_branch = $${idx++}`);
        vals.push(unionRoleBranch);
    }
    
    if (employmentType) {
        conditions.push(`u.employment_type = $${idx++}`);
        vals.push(employmentType);
    }

    if (isOfficer) {
        // Filter for any of the known officer codes in either role field
        const OFFICER_CODES = ['11', '14', '19', '31', '32', '33', '34', '35'];
        conditions.push(`(u.union_role = ANY($${idx}) OR u.union_role_branch = ANY($${idx}))`);
        vals.push(OFFICER_CODES);
        idx++;
    }

    if (search) {
        conditions.push(`(u.name ILIKE $${idx} OR u.employee_number ILIKE $${idx})`);
        vals.push(`%${search}%`);
        idx++;
    }

    const rows = await query<Record<string, unknown>>(
        `SELECT u.id, u.employee_number, u.name, u.email, u.role, u.store_id,
            s.name as store_name, u.employment_type, u.union_role, u.union_role_branch, u.job_title, u.birthday, u.is_active, u.must_change_pw,
            u.last_login_at, u.created_at, u.updated_at,
            (COALESCE(mj.is_non_union, FALSE) OR COALESCE(me.is_non_union, FALSE) OR COALESCE(mu.is_non_union, FALSE) OR COALESCE(mb.is_non_union, FALSE)) as is_non_union
     FROM users u
     LEFT JOIN stores s ON s.id = u.store_id
     LEFT JOIN master_data mj ON mj.category = 'job_title' AND mj.code = u.job_title
     LEFT JOIN master_data me ON me.category = 'employment_type' AND me.code = u.employment_type
     LEFT JOIN master_data mu ON mu.category = 'union_role' AND mu.code = u.union_role
     LEFT JOIN master_data mb ON mb.category = 'branch_officer' AND mb.code = u.union_role_branch
     WHERE ${conditions.join(' AND ')}
     ORDER BY u.created_at DESC
     ${isOfficer ? '' : `LIMIT $${idx++} OFFSET $${idx++}`}`,
        isOfficer ? [...vals] : [...vals, limit, offset]
    );

    return Response.json({ data: rows.map(toUser) });
}

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) return Response.json({ error: '権限がありません' }, { status: 403 });

    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: '不正なリクエストです' }, { status: 400 });
    }
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });

    // Check if the user has permission to create users with the specified role and store
    if (user.role === 'STORE_ADMIN' && parsed.data.role === 'HQ_ADMIN') {
        return Response.json({ error: '権限がありません' }, { status: 403 });
    }

    if (user.role !== 'HQ_ADMIN') {
        const targetStoreId = parsed.data.storeId;
        if (!targetStoreId) {
            return Response.json({ error: '店舗への所属が必須です' }, { status: 400 });
        }
        const targetGroupRes = await queryOne<{ group_id: number | null }>('SELECT group_id FROM stores WHERE id = $1', [targetStoreId]);
        const targetGroupId = targetGroupRes?.group_id ?? null;

        if (!canAccessStore(user.role, user.storeId, targetStoreId, user.unionRole, targetGroupId)) {
            return Response.json({ error: '指定した店舗へのアクセス権限がありません' }, { status: 403 });
        }
    }

    try {
        let rawPassword = parsed.data.password;
        if (!rawPassword && typeof parsed.data.birthday === 'string') {
            // Initial password is birthday in YYYYMMDD format
            rawPassword = parsed.data.birthday.replace(/-/g, '');
        }

        if (!rawPassword) {
            return Response.json({ error: 'パスワードまたは誕生日を入力してください' }, { status: 400 });
        }

        const passwordHash = await hashPassword(rawPassword as string);

        const newUser = await queryOne<{ id: number }>(
            `INSERT INTO users (employee_number, name, email, role, store_id, employment_type, union_role, union_role_branch, job_title, birthday, password_hash, is_active, must_change_pw)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE)
         RETURNING id`,
            [
                parsed.data.employeeNumber, parsed.data.name, parsed.data.email ?? null,
                parsed.data.role, parsed.data.storeId, parsed.data.employmentType,
                parsed.data.unionRole, parsed.data.unionRoleBranch ?? null, parsed.data.jobTitle ?? null, parsed.data.birthday ?? null,
                passwordHash, parsed.data.isActive,
            ]
        );

        await logAudit(user, 'USER_CREATE', 'users', newUser?.id, { employeeNumber: parsed.data.employeeNumber });

        return Response.json({ data: { id: newUser?.id } }, { status: 201 });
    } catch (e) {
        console.error('[admin/users] Error:', e);
        return Response.json({ error: '保存中にエラーが発生しました' }, { status: 500 });
    }
}

function toUser(r: Record<string, unknown>) {
    const bd = r.birthday instanceof Date ? r.birthday : (null as Date | null);
    const birthdayStr = bd ? [
        bd.getFullYear(),
        String(bd.getMonth() + 1).padStart(2, '0'),
        String(bd.getDate()).padStart(2, '0'),
    ].join('-') : null;
    return {
        id: r.id, employeeNumber: r.employee_number, name: r.name, email: r.email,
        role: r.role, storeId: r.store_id, storeName: r.store_name,
        employmentType: r.employment_type, unionRole: r.union_role, unionRoleBranch: r.union_role_branch,
        jobTitle: r.job_title, isNonUnion: r.is_non_union,
        birthday: birthdayStr,
        isActive: r.is_active,
        mustChangePw: r.must_change_pw, lastLoginAt: r.last_login_at,
        createdAt: r.created_at, updatedAt: r.updated_at,
    };
}
