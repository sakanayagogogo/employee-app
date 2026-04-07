import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// POST: Subscribe to push notifications
export async function POST(request: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return Response.json({ error: '無効な購読データです' }, { status: 400 });
    }

    const userId = parseInt(user.sub);
    const userAgent = request.headers.get('user-agent') || null;

    // Upsert subscription
    await query(`
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (user_id, endpoint)
        DO UPDATE SET p256dh = $3, auth = $4, user_agent = $5, updated_at = NOW()
    `, [userId, endpoint, keys.p256dh, keys.auth, userAgent]);

    // Ensure notification_preferences row exists
    await query(`
        INSERT INTO notification_preferences (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING
    `, [userId]);

    return Response.json({ success: true });
}

// DELETE: Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const body = await request.json();
    const { endpoint } = body;
    const userId = parseInt(user.sub);

    if (endpoint) {
        await query('DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2', [userId, endpoint]);
    } else {
        // Delete all subscriptions for this user
        await query('DELETE FROM push_subscriptions WHERE user_id = $1', [userId]);
    }

    return Response.json({ success: true });
}
