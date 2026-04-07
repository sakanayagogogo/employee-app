import { query, queryOne, transaction } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';
import { parse } from 'csv-parse/sync';
import iconv from 'iconv-lite';

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'HQ_ADMIN') return Response.json({ error: '権限がありません' }, { status: 403 });

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
        records = parse(text, { columns: true, skip_empty_lines: true, trim: true, bom: true });
    } catch (err) {
        return Response.json({ error: 'CSVの解析に失敗しました。' }, { status: 400 });
    }

    const headerMap: Record<string, string> = {
        '店舗コード': 'code',
        'コード': 'code',
        '店舗名': 'name',
        '名称': 'name',
        'グループ表示順': 'group_sort_order',
        'グループ順': 'group_sort_order'
    };

    let successCount = 0;
    const errors: { row: number; message: string }[] = [];

    await transaction(async (client) => {
        // Pre-fetch groups for matching
        const groupRes = await client.query('SELECT id, sort_order FROM store_groups');
        const groupMap = new Map(groupRes.rows.map(g => [g.sort_order, g.id]));

        for (let i = 0; i < records.length; i++) {
            const rawRow = records[i];
            const row: Record<string, string> = {};
            for (const [key, val] of Object.entries(rawRow)) {
                const normalizedKey = headerMap[key] || key;
                row[normalizedKey] = val;
            }

            const rowNum = i + 2;
            try {
                const { code, name, group_sort_order } = row;

                if (!code || !name) {
                    errors.push({ row: rowNum, message: '店舗コードと店舗名は必須です' });
                    continue;
                }

                let groupId = null;
                const sortOrderNum = parseInt(group_sort_order);
                if (!isNaN(sortOrderNum)) {
                    groupId = groupMap.get(sortOrderNum) || null;
                }

                await client.query(
                    `INSERT INTO stores (code, name, group_id, is_active)
                     VALUES ($1, $2, $3, TRUE)
                     ON CONFLICT (code) DO UPDATE SET
                        name = EXCLUDED.name,
                        group_id = EXCLUDED.group_id,
                        updated_at = NOW()`,
                    [code.toUpperCase(), name, groupId]
                );

                successCount++;
            } catch (e) {
                errors.push({ row: rowNum, message: e instanceof Error ? e.message : '不明なエラー' });
            }
        }
    });

    await logAudit(user, 'STORE_CSV_IMPORT', 'stores', undefined, { success: successCount, errors: errors.length });

    return Response.json({ data: { success: successCount, errors } });
}
