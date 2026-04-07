import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

type Params = { params: Promise<{ responseId: string }> };

const statusSchema = z.object({
    status: z.enum(['PENDING', 'PROCESSED', 'REJECTED']),
});

export async function PATCH(request: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
        return Response.json({ error: '権限がありません' }, { status: 403 });
    }

    const { responseId } = await params;
    const responseIdInt = parseInt(responseId);

    try {
        const body = await request.json();
        const parsed = statusSchema.safeParse(body);
        if (!parsed.success) {
            return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const { status } = parsed.data;

        // Access check for STORE_ADMIN
        if (user.role === 'STORE_ADMIN') {
            const currentResponse = await queryOne<{ user_id: number, store_id: number | null, group_id: number | null }>(`
                SELECT wr.user_id, u.store_id, s.group_id
                FROM widget_responses wr
                JOIN users u ON u.id = wr.user_id
                LEFT JOIN stores s ON s.id = u.store_id
                WHERE wr.id = $1
            `, [responseIdInt]);

            if (!currentResponse) {
                return Response.json({ error: '回答が見つかりません' }, { status: 404 });
            }

            const { getAreaGroupId } = await import('@/lib/rbac');
            const areaGroupId = getAreaGroupId(user.unionRole);
            const isAuthorized = (currentResponse.store_id === user.storeId) || 
                               (areaGroupId && currentResponse.group_id === areaGroupId);

            if (!isAuthorized) {
                return Response.json({ error: '権限がありません' }, { status: 403 });
            }
        }

        const updated = await queryOne<{ id: number, widget_id: number, user_id: number }>(
            `UPDATE widget_responses 
             SET status = $1, updated_at = NOW() 
             WHERE id = $2 
             RETURNING id, widget_id, user_id`,
            [status, responseIdInt]
        );

        if (!updated) {
            return Response.json({ error: '対応する回答が見つかりません' }, { status: 404 });
        }

        await logAudit(user, 'WIDGET_RESPONSE_STATUS_UPDATE', 'widget_responses', responseIdInt, { status });

        return Response.json({ message: 'ステータスを更新しました', data: updated });
    } catch (err: any) {
        console.error('Status update error:', err);
        return Response.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
