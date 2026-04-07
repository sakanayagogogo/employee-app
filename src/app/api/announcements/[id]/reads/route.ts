import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const { id } = await params;

    try {
        const reads = await query(
            `SELECT u.id, u.name, u.avatar_url as "avatarUrl"
             FROM announcement_reads ar
             JOIN users u ON u.id = ar.user_id
             WHERE ar.announcement_id = $1
             ORDER BY ar.read_at DESC`,
            [parseInt(id)]
        );

        return Response.json({ data: reads });
    } catch (err) {
        console.error('[announcements reads GET]', err);
        return Response.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
