import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isHQAdmin } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';
import { parse } from 'csv-parse/sync';
import iconv from 'iconv-lite';

export async function POST(request: Request) {
    const user = await getCurrentUser();
    // Only HQ_ADMIN can import master data
    if (!user || !isHQAdmin(user.role)) return Response.json({ error: '権限がありません' }, { status: 403 });

    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    if (!category) return Response.json({ error: 'カテゴリーが指定されていません' }, { status: 400 });

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
        return Response.json({ error: 'ファイルが必要です' }, { status: 400 });
    }

    const bytes = await (file as Blob).arrayBuffer();
    const buffer = Buffer.from(bytes);
    let records: Record<string, string>[];
    
    let text = '';
    try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch (e) {
        text = iconv.decode(buffer, 'CP932');
    }

    try {
        records = parse(text, { columns: true, skip_empty_lines: true, trim: true, bom: true });
    } catch (err) {
        return Response.json({ error: 'CSVの解析に失敗しました。' }, { status: 400 });
    }

    let successCount = 0;
    const errors: { row: number; message: string }[] = [];

    const headerMap: Record<string, string> = {
        'コード': 'code',
        '表示名': 'name',
        '順序': 'sort_order'
    };

    for (let i = 0; i < records.length; i++) {
        const rawRow = records[i];
        const row: Record<string, string> = {};
        for (const [key, val] of Object.entries(rawRow)) {
            const normalizedKey = headerMap[key] || key;
            row[normalizedKey] = val;
        }
        const rowNum = i + 2;

        try {
            const { code, name, sort_order } = row;

            if (!code || !name) {
                errors.push({ row: rowNum, message: 'コードと表示名は必須です' });
                continue;
            }

            await query(
                `INSERT INTO master_data (category, code, name, sort_order)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (category, code) DO UPDATE SET
                    name = EXCLUDED.name,
                    sort_order = EXCLUDED.sort_order,
                    updated_at = NOW()`,
                [category, code.toUpperCase(), name, parseInt(sort_order || '0')]
            );

            successCount++;
        } catch (e) {
            errors.push({ row: rowNum, message: e instanceof Error ? e.message : '不明なエラー' });
        }
    }

    await logAudit(user, 'MASTER_DATA_CSV_IMPORT', 'master_data', undefined, { category, success: successCount, errors: errors.length });

    return Response.json({ data: { success: successCount, errors } });
}
