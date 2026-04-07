import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isHQAdmin } from '@/lib/rbac';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser();
    if (!user || !isHQAdmin(user.role)) return Response.json({ error: '権限がありません' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { name, sortOrder, isNonUnion } = body;

    const result = await queryOne(
        `UPDATE master_data 
         SET name = COALESCE($1, name), 
             sort_order = COALESCE($2, sort_order), 
             is_non_union = COALESCE($3, is_non_union),
             updated_at = NOW() 
         WHERE id = $4 RETURNING id`,
        [name, sortOrder, isNonUnion, parseInt(id)]
    );

    if (!result) return Response.json({ error: '見つかりませんでした' }, { status: 404 });
    return Response.json({ data: result });
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getCurrentUser();
    if (!user || !isHQAdmin(user.role)) return Response.json({ error: '権限がありません' }, { status: 403 });

    const { id } = await params;
    await query(`DELETE FROM master_data WHERE id = $1`, [parseInt(id)]);
    return Response.json({ success: true });
}
