import { z } from 'zod';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

const commentSchema = z.object({
    body: z.string().min(1).max(1000),
});

export async function GET(request: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const { id } = await params;
    const announcementId = parseInt(id);

    const comments = await query<{
        id: number; body: string; created_at: string;
        user_name: string; user_role: string; avatar_url: string | null;
    }>(
        `SELECT c.id, c.body, c.created_at, u.name as user_name, u.role as user_role, u.avatar_url
         FROM announcement_comments c
         JOIN users u ON u.id = c.user_id
         WHERE c.announcement_id = $1
         ORDER BY c.created_at ASC`,
        [announcementId]
    );

    return Response.json({
        data: comments.map(c => ({
            id: c.id,
            body: c.body,
            createdAt: c.created_at,
            userName: c.user_name,
            userRole: c.user_role,
            avatarUrl: c.avatar_url
        }))
    });
}

export async function POST(request: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const { id } = await params;
    
    try {
        const body = await request.json();
        const parsed = commentSchema.safeParse(body);
        if (!parsed.success) return Response.json({ error: 'コメントは1〜1000文字で入力してください' }, { status: 400 });

        const result = await query(
            `INSERT INTO announcement_comments (announcement_id, user_id, body) VALUES ($1, $2, $3) RETURNING id`,
            [parseInt(id), parseInt(user.sub), parsed.data.body]
        );

        return Response.json({ success: true });
    } catch (e) {
        console.error(e);
        return Response.json({ error: '投稿に失敗しました' }, { status: 500 });
    }
}
