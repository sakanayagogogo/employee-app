import { NextRequest } from 'next/server';
import { z } from 'zod';
import { query, queryOne, transaction } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';
import { sendAnnouncementPush } from '@/lib/push';

const createSchema = z.object({
    title: z.string().min(1).max(200),
    body: z.string().min(1),
    importance: z.enum(['NORMAL', 'IMPORTANT']).default('NORMAL'),
    category: z.enum(['GENERAL', 'PRESIDENT', 'MUST_READ']).default('GENERAL'),
    coverImageUrl: z.string().url().or(z.literal('')).nullish(),
    isPublished: z.boolean().default(false),
    startAt: z.string().datetime().nullish(),
    endAt: z.string().datetime().nullish(),
    attachments: z.array(z.object({
        name: z.string(),
        url: z.string().url(),
    })).optional().default([]),
    targets: z.array(z.object({
        targetType: z.enum(['ALL', 'STORE', 'STORE_GROUP', 'EMPLOYMENT_TYPE', 'UNION_ROLE', 'BRANCH_OFFICER', 'USER']),
        targetValue: z.string().nullish(),
    })).min(1),
    widgetIds: z.array(z.number()).optional().default([]),
    sendPush: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const sp = request.nextUrl.searchParams;
    const limit = parseInt(sp.get('limit') ?? '50');
    const offset = parseInt(sp.get('offset') ?? '0');
    const categoryFilter = sp.get('category');

    let targetClause = '';
    const vals: unknown[] = [];
    vals.push(parseInt(user.sub)); // $1 (INT)

    if (user.role !== 'HQ_ADMIN') {
        const userIdStr = String(user.sub);
        const storeIdStr = String(user.storeId || '');
        const groupIdStr = String(user.groupId || '');
        const empTypeStr = String(user.employmentType);
        const uRoleStr = String(user.unionRole || '');
        const branchOfficerStr = String(user.unionRoleBranch || '');
        
        vals.push(userIdStr);  // $2
        vals.push(storeIdStr); // $3
        vals.push(groupIdStr); // $4
        vals.push(empTypeStr); // $5
        vals.push(uRoleStr);   // $6
        vals.push(branchOfficerStr); // $7
        
        targetClause = `
        AND (
            a.category = 'PRESIDENT'
            OR EXISTS (SELECT 1 FROM announcement_targets WHERE announcement_id = a.id AND target_type = 'ALL')
            OR EXISTS (SELECT 1 FROM announcement_targets WHERE announcement_id = a.id AND target_type = 'USER' AND target_value = $2::text)
            OR EXISTS (SELECT 1 FROM announcement_targets WHERE announcement_id = a.id AND target_type = 'STORE' AND target_value = $3::text)
            OR EXISTS (SELECT 1 FROM announcement_targets WHERE announcement_id = a.id AND target_type = 'STORE_GROUP' AND target_value = $4::text)
            OR EXISTS (SELECT 1 FROM announcement_targets WHERE announcement_id = a.id AND target_type = 'EMPLOYMENT_TYPE' AND target_value = $5::text)
            OR EXISTS (SELECT 1 FROM announcement_targets WHERE announcement_id = a.id AND target_type = 'UNION_ROLE' AND target_value = $6::text)
            OR EXISTS (SELECT 1 FROM announcement_targets WHERE announcement_id = a.id AND target_type = 'BRANCH_OFFICER' AND target_value = $7::text)
        )`;
    }

    const dateFilter = `AND (a.start_at IS NULL OR a.start_at <= NOW()) AND (a.end_at IS NULL OR a.end_at >= NOW())`;
    const publishedFilter = user.role === 'GENERAL' ? `AND a.is_published = TRUE` : '';

    let categoryClause = '';
    if (categoryFilter && ['GENERAL', 'PRESIDENT', 'MUST_READ'].includes(categoryFilter)) {
        vals.push(categoryFilter);
        categoryClause = `AND a.category = $${vals.length}::text`;
    }

    vals.push(limit);
    vals.push(offset);
    const limitIdx = vals.length - 1;

    try {
        const rows = await query<{
            id: number; title: string; body: string; importance: string; category: string; is_published: boolean;
            author_name: string; author_avatar_url: string | null; created_at: string; is_read: boolean;
            likes_count: string; comments_count: string; cover_image_url: string | null;
            attachments: string | null; widget_ids: string | null; has_bookmarked: boolean;
        }>(
            `SELECT a.id, a.title, a.body, a.importance, a.category, a.is_published, a.cover_image_url, a.attachments, a.widget_ids,
                u.name AS author_name, u.avatar_url AS author_avatar_url, a.created_at,
                EXISTS(SELECT 1 FROM announcement_reads r WHERE r.announcement_id = a.id AND r.user_id = $1::int) AS is_read,
                (SELECT COUNT(*) FROM announcement_likes al WHERE al.announcement_id = a.id) as likes_count,
                (SELECT COUNT(*) FROM announcement_comments ac WHERE ac.announcement_id = a.id) as comments_count,
                EXISTS(SELECT 1 FROM announcement_bookmarks ab WHERE ab.announcement_id = a.id AND ab.user_id = $1::int) AS has_bookmarked
            FROM announcements a
            JOIN users u ON u.id = a.author_id
            WHERE 1=1 ${publishedFilter} ${dateFilter} ${targetClause} ${categoryClause}
            ORDER BY a.created_at DESC
            LIMIT $${limitIdx}::int OFFSET $${limitIdx + 1}::int`,
            vals
        );

        const unreadCountRow = await queryOne<{ count: string }>(
            `SELECT COUNT(*) FROM announcements a
             WHERE a.is_published = TRUE
             ${dateFilter} ${targetClause} ${categoryClause}
             AND NOT EXISTS(SELECT 1 FROM announcement_reads r WHERE r.announcement_id = a.id AND r.user_id = $1::int)`,
            vals.slice(0, vals.length - 2)
        );

        return Response.json({
            unreadCount: parseInt(unreadCountRow?.count ?? '0'),
            data: rows.map(r => ({
                id: r.id, title: r.title, body: r.body, importance: r.importance,
                category: r.category,
                coverImageUrl: r.cover_image_url,
                isPublished: r.is_published, authorName: r.author_name, authorAvatarUrl: r.author_avatar_url,
                createdAt: r.created_at, isRead: r.is_read,
                likesCount: parseInt(r.likes_count) || 0,
                commentsCount: parseInt(r.comments_count) || 0,
                hasBookmarked: r.has_bookmarked,
                attachments: r.attachments || [],
                widgetIds: r.widget_ids || [],
            }))
        });
    } catch (e: any) {
        console.error('[GET Announcements] Error:', e);
        return Response.json({ error: 'お知らせの取得に失敗しました' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) return Response.json({ error: '権限がありません' }, { status: 403 });

    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: '不正なリクエストです' }, { status: 400 });
    }
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const { title, body: bodyText, importance, category, isPublished, startAt, endAt, targets, coverImageUrl, attachments, widgetIds, sendPush } = parsed.data;

    if (user.role === 'STORE_ADMIN') {
        const hasInvalidTarget = targets.some(t => t.targetType === 'ALL');
        if (hasInvalidTarget) return Response.json({ error: '権限がありません' }, { status: 403 });
    }

    const result = await transaction(async (client) => {
        const annRow = await client.query(
            `INSERT INTO announcements (title, body, importance, category, cover_image_url, is_published, start_at, end_at, author_id, attachments, widget_ids, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING id`,
            [title, bodyText, importance, category, coverImageUrl || null, isPublished, startAt ?? null, endAt ?? null, parseInt(user.sub), JSON.stringify(attachments), JSON.stringify(widgetIds)]
        );
        const annId = annRow.rows[0].id;

        for (const tgt of targets) {
            await client.query(
                `INSERT INTO announcement_targets (announcement_id, target_type, target_value) VALUES ($1, $2, $3)`,
                [annId, tgt.targetType, tgt.targetValue ?? null]
            );
        }
        return annId;
    });

    await logAudit(user, 'ANNOUNCEMENT_CREATE', 'announcements', result, { title, importance, category });

    // Send push notification (fire-and-forget, don't block response)
    if (isPublished && sendPush) {
        sendAnnouncementPush(result, title, category).catch(err => {
            console.error('[Push] Failed to send announcement push:', err);
        });
    }

    return Response.json({ data: { id: result } }, { status: 201 });
}
