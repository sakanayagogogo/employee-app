import { z } from 'zod';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const profileSchema = z.object({
    avatarUrl: z.string().nullish(),
    backgroundUrl: z.string().nullish(),
});

export async function PATCH(request: Request) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    try {
        const body = await request.json();
        const parsed = profileSchema.safeParse(body);
        if (!parsed.success) return Response.json({ error: '無効なデータです' }, { status: 400 });

        const { avatarUrl, backgroundUrl } = parsed.data;

        await query(
            `UPDATE users SET avatar_url = $1, background_url = $2, updated_at = NOW() WHERE id = $3`,
            [avatarUrl || null, backgroundUrl || null, parseInt(user.sub)]
        );

        return Response.json({ success: true });
    } catch (e) {
        console.error(e);
        return Response.json({ error: '更新に失敗しました' }, { status: 500 });
    }
}
