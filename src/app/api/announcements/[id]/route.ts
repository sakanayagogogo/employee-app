import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    body: z.string().min(1).optional(),
    importance: z.enum(['NORMAL', 'IMPORTANT']).optional(),
    category: z.enum(['GENERAL', 'PRESIDENT', 'MUST_READ']).optional(),
    coverImageUrl: z.string().url().or(z.literal('')).nullish(),
    startAt: z.string().datetime().nullish(),
    endAt: z.string().datetime().nullish(),
    isPublished: z.boolean().optional(),
    attachments: z.array(z.object({
        name: z.string(),
        url: z.string().url(),
    })).optional(),
    widgetIds: z.array(z.number()).optional(),
    targets: z.array(
        z.object({
            targetType: z.enum(['ALL', 'STORE', 'STORE_GROUP', 'EMPLOYMENT_TYPE', 'UNION_ROLE', 'USER']),
            targetValue: z.string().nullish(),
        })
    ).optional(),
});

export async function GET(_req: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const { id } = await params;
    const now = new Date().toISOString();

    const ann = await queryOne<Record<string, unknown>>(
        `SELECT a.id, a.title, a.body, a.importance, a.category, a.start_at, a.end_at, a.cover_image_url, a.attachments,
            a.is_published, a.author_id, u.name as author_name,
            a.created_at, a.updated_at, a.widget_ids,
            EXISTS(
              SELECT 1 FROM announcement_reads ar
              WHERE ar.announcement_id = a.id AND ar.user_id = $2
            ) as is_read,
            (SELECT COUNT(*) FROM announcement_likes al WHERE al.announcement_id = a.id) as likes_count,
            EXISTS(
              SELECT 1 FROM announcement_likes al
              WHERE al.announcement_id = a.id AND al.user_id = $2
            ) as has_liked,
            (SELECT COUNT(*) FROM announcement_comments ac WHERE ac.announcement_id = a.id) as comments_count,
            EXISTS(
              SELECT 1 FROM announcement_bookmarks ab
              WHERE ab.announcement_id = a.id AND ab.user_id = $2
            ) as has_bookmarked
     FROM announcements a
     JOIN users u ON u.id = a.author_id
     WHERE a.id = $1`,
        [parseInt(id), parseInt(user.sub)]
    );

    if (!ann) return Response.json({ error: 'お知らせが見つかりません' }, { status: 404 });

    // Auto mark as read when viewing a published announcement (or for admins viewing drafts)
    if (ann.is_published || isAdmin(user.role)) {
        await query(
            `INSERT INTO announcement_reads (announcement_id, user_id, read_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (announcement_id, user_id) DO NOTHING`,
            [parseInt(id), parseInt(user.sub)]
        );
        // Ensure the response reflects the read status
        ann.is_read = true;
    }

    // Non-admins can only see published announcements within date range
    if (!isAdmin(user.role)) {
        if (!ann.is_published) return Response.json({ error: 'お知らせが見つかりません' }, { status: 404 });
        const startAt = ann.start_at as string | null;
        const endAt = ann.end_at as string | null;
        if (startAt && new Date(startAt) > new Date(now)) return Response.json({ error: 'お知らせが見つかりません' }, { status: 404 });
        if (endAt && new Date(endAt) < new Date(now)) return Response.json({ error: 'お知らせが見つかりません' }, { status: 404 });
    }

    const targets = await query(
        `SELECT id, target_type, target_value FROM announcement_targets WHERE announcement_id = $1`,
        [parseInt(id)]
    );

    return Response.json({
        data: {
            id: ann.id, title: ann.title, body: ann.body, importance: ann.importance,
            category: ann.category, coverImageUrl: ann.cover_image_url,
            startAt: ann.start_at, endAt: ann.end_at, isPublished: ann.is_published,
            authorId: ann.author_id, authorName: ann.author_name,
            isRead: true, // Force true since we just marked it as read or it was already read
            createdAt: ann.created_at, updatedAt: ann.updated_at,
            likesCount: parseInt(ann.likes_count as string) || 0,
            hasLiked: ann.has_liked,
            hasBookmarked: ann.has_bookmarked,
            commentsCount: parseInt(ann.comments_count as string) || 0,
            attachments: ann.attachments || [],
            widgetIds: ann.widget_ids || [],
            targets: targets.map((t) => ({
                id: t.id, targetType: t.target_type, targetValue: t.target_value
            })),
        },
    });
}

export async function PATCH(request: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) return Response.json({ error: '権限がありません' }, { status: 403 });

    const { id } = await params;
    try {
        const body = await request.json();
        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });

        const ann = await queryOne<{ id: number; author_id: number; store_id?: number }>(
            `SELECT id, author_id FROM announcements WHERE id = $1`,
            [parseInt(id)]
        );
        if (!ann) return Response.json({ error: 'お知らせが見つかりません' }, { status: 404 });

        const updates: string[] = [];
        const vals: unknown[] = [];
        let idx = 1;

        const d = parsed.data;
        if (d.title !== undefined) { updates.push(`title = $${idx++}`); vals.push(d.title); }
        if (d.body !== undefined) { updates.push(`body = $${idx++}`); vals.push(d.body); }
        if (d.importance !== undefined) { updates.push(`importance = $${idx++}`); vals.push(d.importance); }
        if (d.category !== undefined) { updates.push(`category = $${idx++}`); vals.push(d.category); }
        if (d.coverImageUrl !== undefined) { updates.push(`cover_image_url = $${idx++}`); vals.push(d.coverImageUrl ?? null); }
        if (d.startAt !== undefined) { updates.push(`start_at = $${idx++}`); vals.push(d.startAt ?? null); }
        if (d.endAt !== undefined) { updates.push(`end_at = $${idx++}`); vals.push(d.endAt ?? null); }
        if (d.isPublished !== undefined) { updates.push(`is_published = $${idx++}`); vals.push(d.isPublished); }
        if (d.attachments !== undefined) { updates.push(`attachments = $${idx++}`); vals.push(JSON.stringify(d.attachments)); }
        if (d.widgetIds !== undefined) { updates.push(`widget_ids = $${idx++}`); vals.push(JSON.stringify(d.widgetIds)); }

        if (updates.length > 0) {
            updates.push(`updated_at = NOW()`);
            vals.push(parseInt(id));
            await query(`UPDATE announcements SET ${updates.join(', ')} WHERE id = $${idx}`, vals);
        }

        if (d.targets) {
            await query(`DELETE FROM announcement_targets WHERE announcement_id = $1`, [parseInt(id)]);
            for (const t of d.targets) {
                await query(
                    `INSERT INTO announcement_targets (announcement_id, target_type, target_value) VALUES ($1, $2, $3)`,
                    [parseInt(id), t.targetType, t.targetValue ?? null]
                );
            }
        }

        await logAudit(user, 'ANNOUNCEMENT_UPDATE', 'announcements', parseInt(id), d as Record<string, unknown>);

        return Response.json({ message: '更新しました' });
    } catch (err) {
        console.error('[announcements PATCH]', err);
        return Response.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
export async function DELETE(_req: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) return Response.json({ error: '権限がありません' }, { status: 403 });

    const { id } = await params;
    try {
        const ann = await queryOne<{ id: number }>(
            `SELECT id FROM announcements WHERE id = $1`,
            [parseInt(id)]
        );
        if (!ann) return Response.json({ error: 'お知らせが見つかりません' }, { status: 404 });

        // Metadata will be deleted by ON DELETE CASCADE if configured in DB, 
        // but let's be safe if they aren't.
        await query(`DELETE FROM announcement_targets WHERE announcement_id = $1`, [ann.id]);
        await query(`DELETE FROM announcement_reads WHERE announcement_id = $1`, [ann.id]);
        await query(`DELETE FROM announcement_likes WHERE announcement_id = $1`, [ann.id]);
        await query(`DELETE FROM announcement_comments WHERE announcement_id = $1`, [ann.id]);
        await query(`DELETE FROM announcements WHERE id = $1`, [ann.id]);

        await logAudit(user, 'ANNOUNCEMENT_DELETE', 'announcements', ann.id, { id: ann.id });

        return Response.json({ message: '削除しました' });
    } catch (err) {
        console.error('[announcements DELETE]', err);
        return Response.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
