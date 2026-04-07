import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

type Params = { params: Promise<{ widgetId: string }> };

export async function GET(request: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user || user.role === 'GENERAL') {
        return Response.json({ error: '権限がありません' }, { status: 403 });
    }

    const { widgetId } = await params;
    const widgetIdInt = parseInt(widgetId);

    const widget = await queryOne<{ id: number; type: string; title: string; config_json: Record<string, unknown> }>(
        `SELECT id, type, title, config_json FROM portal_widgets WHERE id = $1`,
        [widgetIdInt]
    );

    if (!widget) {
        return Response.json({ error: 'ウィジェットが見つかりません' }, { status: 404 });
    }

    // Fetch responses joined with user info
    const responses = await query<{
        id: number;
        user_id: number;
        employee_name: string;
        employee_number: string;
        response_json: Record<string, unknown>;
        updated_at: string;
    }>(
        `SELECT 
            wr.id, 
            wr.user_id, 
            u.name as employee_name, 
            u.employee_number,
            wr.response_json, 
            wr.updated_at
         FROM widget_responses wr
         JOIN users u ON wr.user_id = u.id
         WHERE wr.widget_id = $1
         ORDER BY wr.updated_at DESC`,
        [widget.id]
    );

    return Response.json({
        data: {
            widget: {
                id: widget.id,
                type: widget.type,
                title: widget.title,
                configJson: widget.config_json,
            },
            responses: responses.map(r => ({
                id: r.id,
                userId: r.user_id,
                employeeName: r.employee_name,
                employeeNumber: r.employee_number,
                responseJson: r.response_json,
                updatedAt: r.updated_at,
            }))
        }
    });
}
