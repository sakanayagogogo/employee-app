import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { sendInquiryPush } from '@/lib/push';

type Params = { params: Promise<{ id: string }> };

const messageSchema = z.object({
    body: z.string().min(1),
});

export async function POST(request: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const { id } = await params;
    const inquiryId = parseInt(id);

    const inquiry = await queryOne<{ id: number; author_id: number; store_id: number | null; group_id: number | null; status: string }>(
        `SELECT i.id, i.author_id, i.store_id, s.group_id, i.status
         FROM inquiries i
         LEFT JOIN stores s ON s.id = i.store_id
         WHERE i.id = $1`,
        [inquiryId]
    );
    if (!inquiry) return Response.json({ error: '相談が見つかりません' }, { status: 404 });
    if (inquiry.status === 'CLOSED') return Response.json({ error: 'クローズ済みの相談には返信できません' }, { status: 400 });

    // Check access
    if (user.role === 'GENERAL' && inquiry.author_id !== parseInt(user.sub)) {
        return Response.json({ error: '権限がありません' }, { status: 403 });
    }
    if (user.role === 'STORE_ADMIN') {
        const { canAccessStore } = await import('@/lib/rbac');
        if (!canAccessStore(user.role, user.storeId, inquiry.store_id as number, user.unionRole, inquiry.group_id as number) && inquiry.author_id !== parseInt(user.sub)) {
            return Response.json({ error: '権限がありません' }, { status: 403 });
        }
    }

    const body = await request.json();
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const msg = await queryOne<{ id: number }>(
        `INSERT INTO inquiry_messages (inquiry_id, author_id, body) VALUES ($1, $2, $3) RETURNING id`,
        [inquiryId, parseInt(user.sub), parsed.data.body]
    );

    // Auto-move to IN_PROGRESS if OPEN
    if (inquiry.status === 'OPEN' && (user.role === 'STORE_ADMIN' || user.role === 'HQ_ADMIN')) {
        await query(`UPDATE inquiries SET status = 'IN_PROGRESS', updated_at = NOW() WHERE id = $1`, [inquiryId]);
    } else {
        await query(`UPDATE inquiries SET updated_at = NOW() WHERE id = $1`, [inquiryId]);
    }

    // Send push notification to other participants (fire-and-forget)
    try {
        // Get all participants except current user
        const participants = await query<{ author_id: number }>(
            `SELECT DISTINCT author_id FROM inquiry_messages WHERE inquiry_id = $1 AND author_id != $2
             UNION SELECT author_id FROM inquiries WHERE id = $1 AND author_id != $2`,
            [inquiryId, parseInt(user.sub)]
        );
        // Also notify admins who haven't participated yet
        const admins = await query<{ id: number }>(
            `SELECT id FROM users WHERE is_active = TRUE AND id != $1 AND (
                role = 'HQ_ADMIN' OR (role = 'STORE_ADMIN' AND store_id = $2)
            )`,
            [parseInt(user.sub), inquiry.store_id]
        );
        const allIds = [...new Set([...participants.map(p => p.author_id), ...admins.map(a => a.id)])];
        if (allIds.length > 0) {
            const inqTitle = await queryOne<{ title: string }>(`SELECT title FROM inquiries WHERE id = $1`, [inquiryId]);
            sendInquiryPush(allIds, inquiryId, inqTitle?.title || '', true).catch(err => {
                console.error('[Push] Failed to send reply push:', err);
            });
        }
    } catch (e) {
        console.error('[Push] Error preparing reply push:', e);
    }

    return Response.json({ data: { id: msg?.id } }, { status: 201 });
}
