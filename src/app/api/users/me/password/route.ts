import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/password';

const passwordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(4, 'パスワードは4文字以上で入力してください'),
});

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    try {
        const body = await request.json();
        const parsed = passwordSchema.safeParse(body);
        if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });

        const { currentPassword, newPassword } = parsed.data;

        // Verify current password
        const dbUser = await queryOne<{ password_hash: string }>(
            `SELECT password_hash FROM users WHERE id = $1`,
            [parseInt(user.sub)]
        );

        if (!dbUser) return Response.json({ error: 'ユーザーが見つかりません' }, { status: 404 });

        const isValid = await verifyPassword(currentPassword, dbUser.password_hash);
        if (!isValid) return Response.json({ error: '現在のパスワードが正しくありません' }, { status: 400 });

        // Hash and update
        const hash = await hashPassword(newPassword);
        await query(
            `UPDATE users SET password_hash = $1, must_change_pw = FALSE, updated_at = NOW() WHERE id = $2`,
            [hash, parseInt(user.sub)]
        );

        return Response.json({ success: true, message: 'パスワードを変更しました' });
    } catch (e) {
        console.error(e);
        return Response.json({ error: '更新に失敗しました' }, { status: 500 });
    }
}
