import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin, canAccessStore } from '@/lib/rbac';
import { logAudit } from '@/lib/audit';

type Params = { params: Promise<{ storeId: string }> };

const createWidgetSchema = z.object({
    type: z.enum(['SURVEY', 'ATTENDANCE', 'CHECKLIST', 'LINK', 'BOARD']),
    title: z.string().min(1).max(200),
    configJson: z.record(z.string(), z.unknown()).default({}),
    size: z.enum(['S', 'M', 'L']).default('M'),
    isPublished: z.boolean().default(false),
    expiresAt: z.string().datetime().nullish(),
});

export async function POST(request: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) return Response.json({ error: '権限がありません' }, { status: 403 });

    const { storeId } = await params;
    const storeIdInt = parseInt(storeId);

    if (!canAccessStore(user.role, user.storeId, storeIdInt)) {
        return Response.json({ error: '権限がありません' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createWidgetSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });

    // Get max sort_order
    const maxOrder = await queryOne<{ max: number | null }>(
        `SELECT MAX(sort_order) as max FROM portal_widgets WHERE store_id = $1`,
        [storeIdInt]
    );
    const nextOrder = (maxOrder?.max ?? -1) + 1;

    const { type, title, configJson, size, isPublished, expiresAt } = parsed.data;

    const widget = await queryOne<{ id: number }>(
        `INSERT INTO portal_widgets (store_id, type, title, config_json, size, sort_order, is_published, expires_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
        [storeIdInt, type, title, JSON.stringify(configJson), size, nextOrder, isPublished, expiresAt ?? null, parseInt(user.sub)]
    );

    await logAudit(user, 'WIDGET_CREATE', 'portal_widgets', widget?.id, { type, title, isPublished });

    // Ensure portal_layouts exists
    await query(
        `INSERT INTO portal_layouts (store_id, layout_json) VALUES ($1, '[]') ON CONFLICT (store_id) DO NOTHING`,
        [storeIdInt]
    );

    return Response.json({ data: { id: widget?.id } }, { status: 201 });
}
