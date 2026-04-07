import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const { id } = await params;
    const announcementId = parseInt(id);
    const userId = parseInt(user.sub);

    // Toggle bookmark
    const existing = await queryOne<{ id: number }>(
        `SELECT id FROM announcement_bookmarks WHERE announcement_id = $1 AND user_id = $2`,
        [announcementId, userId]
    );

    if (existing) {
        // Remove bookmark
        await query(`DELETE FROM announcement_bookmarks WHERE id = $1`, [existing.id]);
        return Response.json({ success: true, bookmarked: false });
    } else {
        // Add bookmark
        await query(
            `INSERT INTO announcement_bookmarks (announcement_id, user_id) VALUES ($1, $2)`,
            [announcementId, userId]
        );
        return Response.json({ success: true, bookmarked: true });
    }
}
