import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

const statusSchema = z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED']).optional(),
    assigneeId: z.number().nullable().optional(),
});

export async function PATCH(request: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) return Response.json({ error: '権限がありません' }, { status: 403 });

    const { id } = await params;
    const inquiryId = parseInt(id);

    const inquiry = await queryOne<{ id: number; store_id: number | null; group_id: number | null }>(
        `SELECT i.id, i.store_id, s.group_id
         FROM inquiries i
         LEFT JOIN stores s ON s.id = i.store_id
         WHERE i.id = $1`,
        [inquiryId]
    );
    if (!inquiry) return Response.json({ error: '相談が見つかりません' }, { status: 404 });

    // STORE_ADMIN access control: must have permission for this store
    if (user.role === 'STORE_ADMIN') {
        const { canAccessStore } = await import('@/lib/rbac');
        if (!canAccessStore(user.role, user.storeId, inquiry.store_id as number, user.unionRole, inquiry.group_id as number)) {
            return Response.json({ error: '権限がありません' }, { status: 403 });
        }
    }

    const body = await request.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const updates: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;

    if (parsed.data.status !== undefined) { updates.push(`status = $${idx++}`); vals.push(parsed.data.status); }
    if (parsed.data.assigneeId !== undefined) { updates.push(`assignee_id = $${idx++}`); vals.push(parsed.data.assigneeId); }

    if (updates.length === 0) return Response.json({ error: '更新するフィールドがありません' }, { status: 400 });

    updates.push(`updated_at = NOW()`);
    vals.push(inquiryId);
    await query(`UPDATE inquiries SET ${updates.join(', ')} WHERE id = $${idx}`, vals);

    await logAudit(user, 'INQUIRY_STATUS_UPDATE', 'inquiries', inquiryId, parsed.data as Record<string, unknown>);

    return Response.json({ message: '更新しました' });
}
