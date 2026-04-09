import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const createWidgetSchema = z.object({
    type: z.enum(['SURVEY', 'ATTENDANCE', 'CHECKLIST', 'LINK', 'BOARD', 'FORM']),
    title: z.string().min(1).max(200),
    configJson: z.record(z.string(), z.unknown()).default({}),
    size: z.enum(['S', 'M', 'L']).default('M'),
    isPublished: z.boolean().default(false),
    categoryName: z.string().max(100).nullish(),
    expiresAt: z.string().datetime().nullish(),
    showInHeader: z.boolean().default(false),
});

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
        return Response.json({ error: '権限がありません' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const parsed = createWidgetSchema.safeParse(body);
        if (!parsed.success) {
            return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const { type, title, configJson, size, isPublished, expiresAt, categoryName, showInHeader } = parsed.data;

        // Get max sort_order
        const maxOrder = await queryOne<{ max: number | null }>(
            `SELECT MAX(sort_order) as max FROM portal_widgets`
        );
        const nextOrder = (maxOrder?.max ?? -1) + 1;

        const widget = await queryOne<{ id: number }>(
            `INSERT INTO portal_widgets (type, title, config_json, size, sort_order, is_published, expires_at, category_name, show_in_header, store_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id`,
            [type, title, JSON.stringify(configJson), size, nextOrder, isPublished, expiresAt ?? null, categoryName ?? null, showInHeader, user.role === 'HQ_ADMIN' ? null : user.storeId]
        );

        if (widget) {
            await logAudit(user, 'WIDGET_CREATE', 'portal_widgets', widget.id, { type, title, isPublished });
        }

        return Response.json({ data: { id: widget?.id } }, { status: 201 });
    } catch (err: any) {
        console.error('Widget creation error:', err);
        return Response.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
