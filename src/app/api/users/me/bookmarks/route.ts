import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const userId = parseInt(user.sub);

    const bookmarks = await query(`
        SELECT 
            a.id, 
            a.title, 
            a.category, 
            a.importance,
            a.created_at as "createdAt",
            u.name as "authorName",
            b.created_at as "bookmarkedAt",
            EXISTS(SELECT 1 FROM announcement_reads ar WHERE ar.announcement_id = a.id AND ar.user_id = $1) as "isRead"
        FROM announcement_bookmarks b
        JOIN announcements a ON b.announcement_id = a.id
        LEFT JOIN users u ON a.author_id = u.id
        WHERE b.user_id = $1
        ORDER BY b.created_at DESC
    `, [userId]);

    return Response.json({ data: bookmarks });
}
