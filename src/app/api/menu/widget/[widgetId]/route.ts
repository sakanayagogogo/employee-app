import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin, canAccessStore } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

type Params = { params: Promise<{ widgetId: string }> };

export async function GET(request: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user) {
        return Response.json({ error: '認証されていません' }, { status: 401 });
    }

    const { widgetId } = await params;
    const widgetIdInt = parseInt(widgetId);

    // Fetch the widget
    const widget = await queryOne<{ id: number; type: string; title: string; category_name: string | null; config_json: Record<string, unknown>; expires_at: string | null; is_published: boolean; show_in_header: boolean }>(
        `SELECT id, type, title, category_name, config_json, expires_at, is_published, show_in_header FROM portal_widgets WHERE id = $1`,
        [widgetIdInt]
    );

    if (!widget) {
        return Response.json({ error: 'ウィジェットが見つかりません' }, { status: 404 });
    }

    if (!widget.is_published && user.role === 'GENERAL') {
        return Response.json({ error: 'このウィジェットは現在非公開です' }, { status: 403 });
    }

    // Fetch the user's specific response if it exists (only PENDING blocks new submission)
    const response = await queryOne<{ response_json: Record<string, unknown> }>(
        `SELECT response_json FROM widget_responses 
         WHERE widget_id = $1 AND user_id = $2 AND status = 'PENDING'
         ORDER BY created_at DESC LIMIT 1`,
        [widget.id, parseInt(user.sub)]
    );

    return Response.json({
        data: {
            widget: {
                id: widget.id,
                type: widget.type,
                title: widget.title,
                configName: widget.category_name, // maintaining some odd naming if it existed but categoryName is preferred
                categoryName: widget.category_name,
                configJson: widget.config_json,
                expiresAt: widget.expires_at,
                showInHeader: widget.show_in_header,
                userResponse: response ? response.response_json : null,
            }
        }
    });
}


const patchSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    configJson: z.record(z.string(), z.unknown()).optional(),
    size: z.enum(['S', 'M', 'L']).optional(),
    isPublished: z.boolean().optional(),
    categoryName: z.string().max(100).nullish(),
    expiresAt: z.string().datetime().nullish(),
    sortOrder: z.number().int().optional(),
    showInHeader: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'HQ_ADMIN') return Response.json({ error: '権限がありません' }, { status: 403 });

    const { widgetId } = await params;
    const widgetIdInt = parseInt(widgetId);

    const widget = await queryOne<{ id: number }>(
        `SELECT id FROM portal_widgets WHERE id = $1`,
        [widgetIdInt]
    );
    if (!widget) return Response.json({ error: 'ウィジェットが見つかりません' }, { status: 404 });

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const updates: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;
    const d = parsed.data;

    if (d.title !== undefined) { updates.push(`title = $${idx++}`); vals.push(d.title); }
    if (d.configJson !== undefined) { updates.push(`config_json = $${idx++}`); vals.push(JSON.stringify(d.configJson)); }
    if (d.size !== undefined) { updates.push(`size = $${idx++}`); vals.push(d.size); }
    if (d.isPublished !== undefined) { updates.push(`is_published = $${idx++}`); vals.push(d.isPublished); }
    if (d.categoryName !== undefined) { updates.push(`category_name = $${idx++}`); vals.push(d.categoryName ?? null); }
    if (d.expiresAt !== undefined) { updates.push(`expires_at = $${idx++}`); vals.push(d.expiresAt ?? null); }
    if (d.sortOrder !== undefined) { updates.push(`sort_order = $${idx++}`); vals.push(d.sortOrder); }
    if (d.showInHeader !== undefined) { updates.push(`show_in_header = $${idx++}`); vals.push(d.showInHeader); }

    if (updates.length === 0) return Response.json({ error: '更新するフィールドがありません' }, { status: 400 });

    updates.push(`updated_at = NOW()`);
    vals.push(widgetIdInt);
    await query(`UPDATE portal_widgets SET ${updates.join(', ')} WHERE id = $${idx}`, vals);

    if (d.isPublished !== undefined) {
        await logAudit(user, d.isPublished ? 'WIDGET_PUBLISH' : 'WIDGET_UNPUBLISH', 'portal_widgets', widgetIdInt);
    } else {
        await logAudit(user, 'WIDGET_UPDATE', 'portal_widgets', widgetIdInt, d as Record<string, unknown>);
    }

    return Response.json({ message: '更新しました' });
}

export async function DELETE(_req: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'HQ_ADMIN') return Response.json({ error: '権限がありません' }, { status: 403 });

    const { widgetId } = await params;
    const widgetIdInt = parseInt(widgetId);

    await query(`DELETE FROM portal_widgets WHERE id = $1`, [widgetIdInt]);
    await logAudit(user, 'WIDGET_DELETE', 'portal_widgets', widgetIdInt);

    return Response.json({ message: '削除しました' });
}
