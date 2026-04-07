import { NextRequest } from 'next/server';
import { queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const userId = parseInt(user.sub);
    const userIdStr = String(user.sub);
    const storeIdStr = String(user.storeId || '');
    const groupIdStr = String(user.groupId || '');
    const empTypeStr = String(user.employmentType);
    const uRoleStr = String(user.unionRole || '');

    const publishedFilter = user.role === 'GENERAL' ? 'AND a.is_published = TRUE' : '';
    const dateFilter = 'AND (a.start_at IS NULL OR a.start_at <= NOW()) AND (a.end_at IS NULL OR a.end_at >= NOW())';
    
    let targetClause = '';
    const vals: any[] = [userId];

    if (user.role !== 'HQ_ADMIN') {
        vals.push(userIdStr, storeIdStr, groupIdStr, empTypeStr, uRoleStr);
        targetClause = `
        AND (
            EXISTS (SELECT 1 FROM announcement_targets WHERE announcement_id = a.id AND target_type = 'ALL')
            OR EXISTS (SELECT 1 FROM announcement_targets WHERE announcement_id = a.id AND target_type = 'USER' AND target_value = $2::text)
            OR EXISTS (SELECT 1 FROM announcement_targets WHERE announcement_id = a.id AND target_type = 'STORE' AND target_value = $3::text)
            OR EXISTS (SELECT 1 FROM announcement_targets WHERE announcement_id = a.id AND target_type = 'STORE_GROUP' AND target_value = $4::text)
            OR EXISTS (SELECT 1 FROM announcement_targets WHERE announcement_id = a.id AND target_type = 'EMPLOYMENT_TYPE' AND target_value = $5::text)
            OR EXISTS (SELECT 1 FROM announcement_targets WHERE announcement_id = a.id AND target_type = 'UNION_ROLE' AND target_value = $6::text)
        )`;
    }

    try {
        const row = await queryOne<{ count: string }>(
            `SELECT COUNT(*) FROM announcements a
             WHERE 1=1 ${publishedFilter} ${dateFilter} ${targetClause}
             AND NOT EXISTS(SELECT 1 FROM announcement_reads r WHERE r.announcement_id = a.id AND r.user_id = $1::int)`,
            vals
        );

        return Response.json({ count: parseInt(row?.count ?? '0') });
    } catch (e: any) {
        return Response.json({ error: e.message }, { status: 500 });
    }
}
