import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    sortOrder: z.number().int().optional(),
});

export async function PATCH(request: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'HQ_ADMIN') return Response.json({ error: '権限がありません' }, { status: 403 });

    const { id } = await params;
    const groupId = parseInt(id);

    try {
        const body = await request.json();
        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });

        const updates: string[] = [];
        const vals: unknown[] = [];
        let idx = 1;

        if (parsed.data.name !== undefined) {
            updates.push(`name = $${idx++}`);
            vals.push(parsed.data.name);
        }
        if (parsed.data.sortOrder !== undefined) {
            updates.push(`sort_order = $${idx++}`);
            vals.push(parsed.data.sortOrder);
        }

        if (updates.length > 0) {
            updates.push(`updated_at = NOW()`);
            vals.push(groupId);
            await query(`UPDATE store_groups SET ${updates.join(', ')} WHERE id = $${idx}`, vals);
        }

        await logAudit(user, 'STORE_GROUP_UPDATE', 'store_groups', groupId, parsed.data as Record<string, unknown>);

        return Response.json({ message: '更新しました' });
    } catch (err: any) {
        console.error('[store-groups PATCH]', err);
        return Response.json({ error: `サーバーエラー: ${err.message}` }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'HQ_ADMIN') return Response.json({ error: '権限がありません' }, { status: 403 });

    const { id } = await params;
    const groupId = parseInt(id);

    try {
        await query(`DELETE FROM store_groups WHERE id = $1`, [groupId]);
        await logAudit(user, 'STORE_GROUP_DELETE', 'store_groups', groupId, { id: groupId });
        return Response.json({ message: '削除しました' });
    } catch (err: any) {
        console.error('[store-groups DELETE]', err);
        return Response.json({ error: `サーバーエラー: ${err.message}` }, { status: 500 });
    }
}
