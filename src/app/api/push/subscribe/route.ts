import { NextRequest } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const subscriptionSchema = z.object({
    endpoint: z.string().url().max(2048).refine((value) => new URL(value).protocol === 'https:'),
    keys: z.object({
        p256dh: z.string().min(1).max(512),
        auth: z.string().min(1).max(512),
    }),
});

const unsubscribeSchema = z.object({
    endpoint: z.string().url().max(2048).optional(),
});

export async function POST(request: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const parsed = subscriptionSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: '無効な購読データです' }, { status: 400 });

    const { endpoint, keys } = parsed.data;
    const userId = Number.parseInt(user.sub, 10);
    const userAgent = request.headers.get('user-agent')?.slice(0, 512) || null;

    await query(`
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (user_id, endpoint)
        DO UPDATE SET p256dh = $3, auth = $4, user_agent = $5, updated_at = NOW()
    `, [userId, endpoint, keys.p256dh, keys.auth, userAgent]);

    await query(`
        INSERT INTO notification_preferences (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING
    `, [userId]);

    return Response.json({ success: true });
}

export async function DELETE(request: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const parsed = unsubscribeSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: '無効なリクエストです' }, { status: 400 });

    const userId = Number.parseInt(user.sub, 10);
    if (parsed.data.endpoint) {
        await query('DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2', [userId, parsed.data.endpoint]);
    } else {
        await query('DELETE FROM push_subscriptions WHERE user_id = $1', [userId]);
    }
    return Response.json({ success: true });
}
