import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const { searchParams } = new URL(_req.url);
    const fetchAll = searchParams.get('all') === 'true' && user.role === 'HQ_ADMIN';

    const condition = fetchAll
        ? ``
        : `WHERE w.is_published = TRUE AND (w.expires_at IS NULL OR w.expires_at > NOW())`;

    const widgets = await query<Record<string, unknown>>(
        `SELECT w.id, w.type, w.title, w.config_json, w.size, w.category_name,
            w.sort_order, w.is_published, w.expires_at, w.created_at, w.updated_at,
            w.show_in_header,
            pc.show_in_header as category_show_in_header,
            wr.response_json as user_response
     FROM portal_widgets w
     LEFT JOIN portal_categories pc ON pc.name = w.category_name
     LEFT JOIN widget_responses wr ON wr.widget_id = w.id AND wr.user_id = $1
     ${condition}
     ORDER BY w.sort_order ASC`,
        [parseInt(user.sub)]
    );

    return Response.json({
        data: {
            widgets: widgets.map((w) => ({
                id: w.id, type: w.type, title: w.title, categoryName: w.category_name,
                categoryShowInHeader: !!w.category_show_in_header,
                configJson: w.config_json, size: w.size, sortOrder: w.sort_order,
                isPublished: w.is_published, expiresAt: w.expires_at,
                showInHeader: w.show_in_header,
                createdAt: w.created_at, updatedAt: w.updated_at,
                userResponse: w.user_response ?? null,
            })),
        },
    });
}
