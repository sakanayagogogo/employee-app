import { NextRequest } from 'next/server';
import { queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type KeepAliveResult = {
    current_time: string | Date;
    user_count: string;
};

export async function GET(request: NextRequest) {
    const cronSecret = process.env.CRON_SECRET;
    const authorization = request.headers.get('authorization');

    // Fail closed: an unset secret must never make this endpoint public.
    if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await queryOne<KeepAliveResult>(
            `SELECT NOW() AS current_time,
                    (SELECT COUNT(*)::text FROM users) AS user_count`
        );

        if (!result) {
            throw new Error('Keep-alive query returned no result');
        }

        console.info('[cron/keep-alive] Supabase query completed', {
            timestamp: new Date(result.current_time).toISOString(),
            userCount: Number(result.user_count),
        });

        return Response.json({
            status: 'ok',
            timestamp: new Date(result.current_time).toISOString(),
        });
    } catch (error) {
        console.error('[cron/keep-alive] Supabase query failed', error);
        return Response.json(
            { status: 'error', message: 'Database keep-alive failed' },
            { status: 500 }
        );
    }
}
