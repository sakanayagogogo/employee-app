import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isHQAdmin, isAdmin } from '@/lib/rbac';

export async function GET(request: Request) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const url = new URL(request.url);
    const category = url.searchParams.get('category');

    let sql = `SELECT id, category, code, name, sort_order as "sortOrder", is_non_union as "isNonUnion" FROM master_data`;
    const params = [];
    if (category) {
        sql += ` WHERE category = $1`;
        params.push(category);
    }
    sql += ` ORDER BY category ASC, sort_order ASC, code ASC`;

    const data = await query(sql, params);
    return Response.json({ data });
}

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user || !isHQAdmin(user.role)) return Response.json({ error: '権限がありません' }, { status: 403 });

    const body = await request.json();
    const { category, code, name, sortOrder, isNonUnion } = body;

    if (!category || !code || !name) return Response.json({ error: '必須項目が不足しています' }, { status: 400 });

    try {
        const result = await queryOne(
            `INSERT INTO master_data (category, code, name, sort_order, is_non_union) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [category, code, name, sortOrder || 0, isNonUnion || false]
        );
        return Response.json({ data: result }, { status: 201 });
    } catch (err: any) {
        return Response.json({ error: '保存に失敗しました（コードが重複している可能性があります）' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const user = await getCurrentUser();
    if (!user || !isHQAdmin(user.role)) return Response.json({ error: '権限がありません' }, { status: 403 });

    const url = new URL(request.url);
    const category = url.searchParams.get('category');

    if (!category) return Response.json({ error: 'カテゴリーが指定されていません' }, { status: 400 });

    try {
        await query(`DELETE FROM master_data WHERE category = $1`, [category]);
        return Response.json({ success: true });
    } catch (err: any) {
        return Response.json({ error: '削除に失敗しました' }, { status: 500 });
    }
}
