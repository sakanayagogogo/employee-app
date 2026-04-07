import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const { id } = await params;

    const ann = await queryOne<{ id: number }>(
        `SELECT id FROM announcements WHERE id = $1 AND is_published = TRUE`,
        [parseInt(id)]
    );
    if (!ann) return Response.json({ error: 'お知らせが見つかりません' }, { status: 404 });

    // Upsert read record
    await query(
        `INSERT INTO announcement_reads (announcement_id, user_id, read_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (announcement_id, user_id) DO NOTHING`,
        [parseInt(id), parseInt(user.sub)]
    );

    return Response.json({ message: '既読にしました' });
}
