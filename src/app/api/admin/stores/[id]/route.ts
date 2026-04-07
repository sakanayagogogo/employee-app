import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    code: z.string().min(1).max(20).optional(),
    groupId: z.number().int().nullable().optional(),
    address: z.string().nullish().optional(),
    isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'HQ_ADMIN') return Response.json({ error: '権限がありません' }, { status: 403 });

    const { id } = await params;
    const storeId = parseInt(id);

    try {
        const body = await request.json();
        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });

        const updates: string[] = [];
        const vals: unknown[] = [];
        let idx = 1;

        const d = parsed.data;
        if (d.name !== undefined) { updates.push(`name = $${idx++}`); vals.push(d.name); }
        if (d.code !== undefined) { updates.push(`code = $${idx++}`); vals.push(d.code); }
        if (d.groupId !== undefined) { updates.push(`group_id = $${idx++}`); vals.push(d.groupId); }
        if (d.address !== undefined) { updates.push(`address = $${idx++}`); vals.push(d.address ?? null); }
        if (d.isActive !== undefined) { updates.push(`is_active = $${idx++}`); vals.push(d.isActive); }

        if (updates.length > 0) {
            updates.push(`updated_at = NOW()`);
            vals.push(storeId);
            await query(`UPDATE stores SET ${updates.join(', ')} WHERE id = $${idx}`, vals);
        }

        await logAudit(user, 'STORE_UPDATE', 'stores', storeId, d as Record<string, unknown>);

        return Response.json({ message: '更新しました' });
    } catch (err) {
        console.error('[stores PATCH]', err);
        return Response.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'HQ_ADMIN') return Response.json({ error: '権限がありません' }, { status: 403 });

    const { id } = await params;
    const storeId = parseInt(id);

    try {
        // Dependencies like users will be handled by ON DELETE SET NULL as per schema
        await query(`DELETE FROM stores WHERE id = $1`, [storeId]);
        await logAudit(user, 'STORE_DELETE', 'stores', storeId, { id: storeId });
        return Response.json({ message: '削除しました' });
    } catch (err) {
        console.error('[stores DELETE]', err);
        return Response.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
