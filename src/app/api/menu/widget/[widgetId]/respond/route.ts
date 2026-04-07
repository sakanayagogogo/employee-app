import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

type Params = { params: Promise<{ widgetId: string }> };

const respondSchema = z.object({
    responseJson: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const { widgetId } = await params;
    const widgetIdInt = parseInt(widgetId);

    const widget = await queryOne<{ id: number; type: string; expires_at: string | null }>(
        `SELECT id, type, expires_at FROM portal_widgets WHERE id = $1 AND is_published = TRUE`,
        [widgetIdInt]
    );
    if (!widget) return Response.json({ error: 'ウィジェットが見つかりません' }, { status: 404 });

    if (widget.expires_at && new Date(widget.expires_at) < new Date()) {
        return Response.json({ error: 'このウィジェットの回答期間が終了しました' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = respondSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });

    if (widget.type === 'BOARD' || widget.type === 'FORM') {
        // BOARD and FORM allow multiple entries
        await query(
            `INSERT INTO widget_responses (widget_id, user_id, response_json, status, created_at, updated_at) 
             VALUES ($1, $2, $3, 'PENDING', NOW(), NOW())`,
            [widgetIdInt, parseInt(user.sub), JSON.stringify(parsed.data.responseJson)]
        );
    } else {
        // Others (SURVEY, ATTENDANCE, CHECKLIST): upsert (one active response per user)
        const existing = await queryOne<{ id: number }>(
            `SELECT id FROM widget_responses WHERE widget_id = $1 AND user_id = $2 AND status = 'PENDING'`,
            [widgetIdInt, parseInt(user.sub)]
        );

        if (existing) {
            await query(
                `UPDATE widget_responses SET response_json = $1, updated_at = NOW() WHERE id = $2`,
                [JSON.stringify(parsed.data.responseJson), existing.id]
            );
        } else {
            await query(
                `INSERT INTO widget_responses (widget_id, user_id, response_json, updated_at, status) VALUES ($1, $2, $3, NOW(), 'PENDING')`,
                [widgetIdInt, parseInt(user.sub), JSON.stringify(parsed.data.responseJson)]
            );
        }
    }

    return Response.json({ message: '回答を送信しました' }, { status: 201 });
}
