import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const { id } = await params;

    try {
        const likes = await query(
            `SELECT u.id, u.name, u.avatar_url as "avatarUrl"
             FROM announcement_likes al
             JOIN users u ON u.id = al.user_id
             WHERE al.announcement_id = $1
             ORDER BY al.created_at DESC`,
            [parseInt(id)]
        );

        return Response.json({ data: likes });
    } catch (err) {
        console.error('[announcements likes GET]', err);
        return Response.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
