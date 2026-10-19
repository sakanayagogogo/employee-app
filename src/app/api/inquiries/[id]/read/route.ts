import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { canAccessInquiry } from '@/lib/content-access';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const { id } = await params;
    const inquiryId = parseInt(id);
    const userId = parseInt(user.sub);
    if (!Number.isSafeInteger(inquiryId) || !(await canAccessInquiry(user, inquiryId))) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        await query(
            `INSERT INTO inquiry_reads (inquiry_id, user_id, last_read_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (inquiry_id, user_id)
             DO UPDATE SET last_read_at = NOW()`,
            [inquiryId, userId]
        );
        return Response.json({ success: true });
    } catch (e) {
        console.error('[Inquiry Mark Read] Error:', e);
        return Response.json({ error: 'Failed to mark inquiry as read' }, { status: 500 });
    }
}
