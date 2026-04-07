import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const { id } = await params;
    const announcementId = parseInt(id);
    const userId = parseInt(user.sub);

    // Toggle like
    const existingLike = await queryOne<{ id: number }>(
        `SELECT id FROM announcement_likes WHERE announcement_id = $1 AND user_id = $2`,
        [announcementId, userId]
    );

    if (existingLike) {
        // Unlike
        await query(`DELETE FROM announcement_likes WHERE id = $1`, [existingLike.id]);
        return Response.json({ success: true, liked: false });
    } else {
        // Like
        await query(
            `INSERT INTO announcement_likes (announcement_id, user_id) VALUES ($1, $2)`,
            [announcementId, userId]
        );
        return Response.json({ success: true, liked: true });
    }
}
