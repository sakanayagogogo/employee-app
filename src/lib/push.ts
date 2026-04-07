import webpush from 'web-push';
import { query } from '@/lib/db';

// Configure VAPID
webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@kizuna-union.jp',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
);

interface PushPayload {
    title: string;
    body: string;
    url: string;
    tag: string;
}

interface PushSub {
    id: number;
    endpoint: string;
    p256dh: string;
    auth: string;
}

/**
 * Send push notification to specific users
 */
export async function sendPushToUsers(
    userIds: number[],
    payload: PushPayload,
    notificationType: 'announcements' | 'inquiries' = 'announcements'
) {
    if (userIds.length === 0) return;

    const prefColumn = notificationType === 'inquiries' ? 'notify_inquiries' : 'notify_announcements';

    // Get subscriptions for users who have notifications enabled
    const subs = await query<PushSub>(`
        SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth
        FROM push_subscriptions ps
        LEFT JOIN notification_preferences np ON np.user_id = ps.user_id
        WHERE ps.user_id = ANY($1)
          AND COALESCE(np.${prefColumn}, TRUE) = TRUE
    `, [userIds]);

    if (subs.length === 0) return;

    const results = await Promise.allSettled(
        subs.map(sub =>
            webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth }
                },
                JSON.stringify(payload)
            ).catch(async (err: any) => {
                // 410 Gone or 404 = subscription expired, clean up
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
                }
                throw err;
            })
        )
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    console.log(`[Push] Sent ${sent}/${subs.length} notifications (${failed} failed) for tag=${payload.tag}`);
    return { sent, failed, total: subs.length };
}

/**
 * Send push to all targeted users of an announcement
 */
export async function sendAnnouncementPush(
    announcementId: number,
    title: string,
    category: string
) {
    // Determine notification content based on category
    let prefix = '📢';
    let tag = 'announcement';
    if (category === 'MUST_READ') { prefix = '🔴 必読'; tag = 'must-read'; }
    else if (category === 'PRESIDENT') { prefix = '📚 機関誌「きずな」'; tag = 'kizuna'; }

    const notifTitle = `${prefix}`;
    const notifBody = title;
    const url = `/announcements/${announcementId}`;

    // Get target users
    const targets = await query<{ target_type: string; target_value: string | null }>(`
        SELECT target_type, target_value FROM announcement_targets WHERE announcement_id = $1
    `, [announcementId]);

    let userIds: number[] = [];

    const hasAll = targets.some(t => t.target_type === 'ALL');
    if (hasAll) {
        const users = await query<{ id: number }>(`SELECT id FROM users WHERE is_active = TRUE`);
        userIds = users.map(u => u.id);
    } else {
        // Build user list from targets
        const storeIds = targets.filter(t => t.target_type === 'STORE').map(t => t.target_value);
        const groupIds = targets.filter(t => t.target_type === 'STORE_GROUP').map(t => t.target_value);

        if (storeIds.length > 0 || groupIds.length > 0) {
            let conditions: string[] = [];
            let params: unknown[] = [];
            let idx = 1;

            if (storeIds.length > 0) {
                conditions.push(`u.store_id = ANY($${idx}::int[])`);
                params.push(storeIds.map(Number));
                idx++;
            }
            if (groupIds.length > 0) {
                conditions.push(`s.group_id = ANY($${idx}::int[])`);
                params.push(groupIds.map(Number));
                idx++;
            }

            const users = await query<{ id: number }>(`
                SELECT DISTINCT u.id FROM users u
                LEFT JOIN stores s ON s.id = u.store_id
                WHERE u.is_active = TRUE AND (${conditions.join(' OR ')})
            `, params);
            userIds = users.map(u => u.id);
        }
    }

    if (userIds.length > 0) {
        return sendPushToUsers(userIds, { title: notifTitle, body: notifBody, url, tag }, 'announcements');
    }
}

/**
 * Send push for new inquiry message
 */
export async function sendInquiryPush(
    recipientUserIds: number[],
    inquiryId: number,
    subject: string,
    isReply: boolean
) {
    const prefix = isReply ? '💬 メール返信' : '✉️ 新着メール';
    return sendPushToUsers(
        recipientUserIds,
        {
            title: prefix,
            body: subject,
            url: `/inquiries/${inquiryId}`,
            tag: `inquiry-${inquiryId}`,
        },
        'inquiries'
    );
}
