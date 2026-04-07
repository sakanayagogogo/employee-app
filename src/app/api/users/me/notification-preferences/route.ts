import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

// GET: Get notification preferences
export async function GET() {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const userId = parseInt(user.sub);

    const prefs = await queryOne<{
        notify_announcements: boolean;
        notify_inquiries: boolean;
    }>('SELECT notify_announcements, notify_inquiries FROM notification_preferences WHERE user_id = $1', [userId]);

    // Check if user has any push subscriptions
    const subCount = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM push_subscriptions WHERE user_id = $1', [userId]);
    const hasSubscription = parseInt(subCount?.count || '0') > 0;

    return Response.json({
        data: {
            notifyAnnouncements: prefs?.notify_announcements ?? true,
            notifyInquiries: prefs?.notify_inquiries ?? true,
            pushEnabled: hasSubscription,
        }
    });
}

// PATCH: Update notification preferences
export async function PATCH(request: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const userId = parseInt(user.sub);
    const body = await request.json();

    const { notifyAnnouncements, notifyInquiries } = body;

    await query(`
        INSERT INTO notification_preferences (user_id, notify_announcements, notify_inquiries, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET
            notify_announcements = COALESCE($2, notification_preferences.notify_announcements),
            notify_inquiries = COALESCE($3, notification_preferences.notify_inquiries),
            updated_at = NOW()
    `, [userId, notifyAnnouncements ?? true, notifyInquiries ?? true]);

    return Response.json({ success: true });
}
