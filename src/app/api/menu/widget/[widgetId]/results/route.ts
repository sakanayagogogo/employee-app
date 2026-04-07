import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';

type Params = { params: Promise<{ widgetId: string }> };

export async function GET(_req: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) return Response.json({ error: '権限がありません' }, { status: 403 });

    const { widgetId } = await params;
    const widgetIdInt = parseInt(widgetId);

    const widget = await queryOne<{ id: number; type: string; title: string; config_json: Record<string, unknown>; store_id: number }>(
        `SELECT id, type, title, config_json, store_id FROM portal_widgets WHERE id = $1`,
        [widgetIdInt]
    );
    if (!widget) return Response.json({ error: 'ウィジェットが見つかりません' }, { status: 404 });

    if (user.role === 'STORE_ADMIN' && user.storeId !== widget.store_id) {
        return Response.json({ error: '権限がありません' }, { status: 403 });
    }

    const totalResponses = await queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM widget_responses WHERE widget_id = $1`,
        [widgetIdInt]
    );

    const responses = await query<{ user_id: number; user_name: string; response_json: Record<string, unknown>; created_at: string }>(
        `SELECT wr.user_id, u.name as user_name, wr.response_json, wr.created_at
     FROM widget_responses wr
     JOIN users u ON u.id = wr.user_id
     WHERE wr.widget_id = $1
     ORDER BY wr.created_at DESC
     LIMIT 200`,
        [widgetIdInt]
    );

    // Aggregate for SURVEY / ATTENDANCE
    let aggregated: Record<string, unknown> | null = null;
    if (widget.type === 'SURVEY') {
        const config = widget.config_json as { type: string; options?: string[] };
        if (config.type === 'single_choice' || config.type === 'multiple_choice') {
            const tally: Record<string, number> = {};
            for (const r of responses) {
                const choice = r.response_json.choice;
                if (Array.isArray(choice)) {
                    for (const c of choice) {
                        tally[c] = (tally[c] ?? 0) + 1;
                    }
                } else if (typeof choice === 'string') {
                    tally[choice] = (tally[choice] ?? 0) + 1;
                }
            }
            aggregated = { tally };
        }
    } else if (widget.type === 'ATTENDANCE') {
        const tally: Record<string, number> = { 参加: 0, 不参加: 0, 未定: 0 };
        for (const r of responses) {
            const att = r.response_json.attendance as string;
            if (att in tally) tally[att]++;
        }
        aggregated = { tally };
    }

    return Response.json({
        data: {
            widget: { id: widget.id, type: widget.type, title: widget.title, configJson: widget.config_json },
            totalResponses: parseInt(totalResponses?.count ?? '0'),
            aggregated,
            responses: responses.map((r) => ({
                userId: r.user_id, userName: r.user_name,
                responseJson: r.response_json, createdAt: r.created_at,
            })),
        },
    });
}
