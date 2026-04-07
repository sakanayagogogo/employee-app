import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';

export async function GET() {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { getAreaGroupId } = await import('@/lib/rbac');
    const areaGroupId = getAreaGroupId(user.unionRole);
    const isHQ = user.role === 'HQ_ADMIN';
    const storeId = user.storeId ?? -1;

    // Filters for STORE_ADMIN
    const userFilterSql = isHQ ? '1=1' : `(u.store_id = $1 OR EXISTS (SELECT 1 FROM stores s2 WHERE s2.id = u.store_id AND s2.group_id = $2))`;
    const inquiryFilterSql = isHQ ? '1=1' : `(i.store_id = $1 OR EXISTS (SELECT 1 FROM stores s2 WHERE s2.id = i.store_id AND s2.group_id = $2))`;
    const filterVals = isHQ ? [] : [storeId, areaGroupId];

    // 1. Total users
    const userStats = await queryOne<{ count: string }>(`SELECT COUNT(*)::text FROM users u WHERE ${userFilterSql.replace('u.', '')}`, filterVals);
    
    // 2. Active users (logged in within 7 days)
    const activeStats = await queryOne<{ count: string }>(
        `SELECT COUNT(*)::text FROM users u WHERE last_login_at >= NOW() - INTERVAL '7 days' AND ${userFilterSql.replace('u.store_id', 'store_id')}`,
        filterVals
    );

    // 2.5 PL && Non-Union
    const plNonUnionStats = await queryOne<{ count: string }>(`
        SELECT COUNT(*)::text as count 
        FROM users u
        LEFT JOIN master_data me ON me.category = 'employment_type' AND me.code = u.employment_type
        LEFT JOIN master_data mu ON mu.category = 'union_role' AND mu.code = u.union_role
        WHERE me.name = 'PL' AND mu.name = '非組合員' AND ${userFilterSql}
    `, filterVals);

    // 2.6 Union Members
    const unionMembersStats = await queryOne<{ count: string }>(`
        SELECT COUNT(*)::text as count 
        FROM users u
        LEFT JOIN master_data me ON me.category = 'employment_type' AND me.code = u.employment_type
        LEFT JOIN master_data mu ON mu.category = 'union_role' AND mu.code = u.union_role
        WHERE me.name IN ('正社員', 'PA', 'PL')
          AND COALESCE(me.is_non_union, false) = false 
          AND COALESCE(mu.is_non_union, false) = false
          AND ${userFilterSql}
    `, filterVals);

    // 3. Stores (Always show total or filter by area?)
    // Decision: STORE_ADMIN sees count within their area
    const storeStats = await queryOne<{ count: string }>(
        isHQ ? 'SELECT COUNT(*)::text FROM stores' : 'SELECT COUNT(*)::text FROM stores s WHERE s.id = $1 OR s.group_id = $2',
        filterVals
    );

    // 4. Open Inquiries
    const openInquiries = await queryOne<{ count: string }>(
        `SELECT COUNT(*)::text FROM inquiries i WHERE status IN ('OPEN', 'IN_PROGRESS') AND ${inquiryFilterSql}`,
        filterVals
    );

    // 5. Total Announcements (Show all published/targeted?)
    // Decision: For now keep it global or filter by targeting - let's keep it simple and show global count for announcements
    const announcementStats = await queryOne<{ count: string }>('SELECT COUNT(*)::text FROM announcements');

    // 6. Recent inquiries for dashboard activity
    const recentInquiries = await queryOne<{ count: string }>(`SELECT COUNT(*)::text FROM inquiries i WHERE created_at >= NOW() - INTERVAL '24 hours' AND ${inquiryFilterSql}`, filterVals);

    // 7. Inquiry Category Distribution
    const categoryStats = await query<{ category: string, count: string }>(
        `SELECT category, COUNT(*)::text as count FROM inquiries i WHERE ${inquiryFilterSql} GROUP BY category ORDER BY count DESC`,
        filterVals
    );

    // 8. Inquiry Status Distribution
    const statusStats = await query<{ status: string, count: string }>(
        `SELECT status, COUNT(*)::text as count FROM inquiries i WHERE ${inquiryFilterSql} GROUP BY status`,
        filterVals
    );

    // 9. Total Hearts (Likes)
    const totalHearts = await queryOne<{ count: string }>(
        isHQ 
        ? 'SELECT COUNT(*)::text FROM announcement_likes'
        : `SELECT COUNT(*)::text FROM announcement_likes al JOIN users u ON u.id = al.user_id WHERE ${userFilterSql}`,
        filterVals
    );

    // 10. Announcement Read Status (Recent 5 announcements)
    const announcementReads = await query<{ id: number, title: string, read_count: string, likes_count: string, total_users: string }>(`
        SELECT 
            a.id,
            a.title,
            (SELECT COUNT(*) FROM announcement_reads ar JOIN users u ON u.id = ar.user_id WHERE ar.announcement_id = a.id AND ${userFilterSql}) as read_count,
            (SELECT COUNT(*) FROM announcement_likes al JOIN users u ON u.id = al.user_id WHERE al.announcement_id = a.id AND ${userFilterSql}) as likes_count,
            (SELECT COUNT(*) FROM users u WHERE is_active = true AND ${userFilterSql}) as total_users
        FROM announcements a
        WHERE a.is_published = true
        ORDER BY a.created_at DESC
        LIMIT 5
    `, filterVals);
    
    // 11. Portal Widget Stats (Show global items)
    const totalWidgets = await queryOne<{ count: string }>('SELECT COUNT(*)::text FROM portal_widgets');
    const widgetTypeStats = await query<{ type: string, count: string }>(
        'SELECT type, COUNT(*)::text as count FROM portal_widgets GROUP BY type ORDER BY count DESC'
    );
    const widgetResponseCount = await queryOne<{ count: string }>(
        isHQ 
        ? 'SELECT COUNT(*)::text FROM widget_responses'
        : `SELECT COUNT(*)::text FROM widget_responses wr JOIN users u ON u.id = wr.user_id WHERE ${userFilterSql}`,
        filterVals
    );

    // 12. Recent Application Form Submissions
    const recentSubmissions = await query<{ id: number, widget_title: string, widget_config: any, user_name: string, employee_number: string, store_name: string, response_json: any, created_at: string }>(`
        SELECT 
            wr.id, 
            pw.title as widget_title, 
            pw.config_json as widget_config,
            u.name as user_name, 
            u.employee_number,
            s.name as store_name,
            wr.response_json, 
            wr.created_at
        FROM widget_responses wr
        JOIN portal_widgets pw ON wr.widget_id = pw.id
        JOIN users u ON wr.user_id = u.id
        LEFT JOIN stores s ON u.store_id = s.id
        WHERE pw.type = 'FORM' AND wr.status = 'PENDING' AND ${userFilterSql}
        ORDER BY wr.created_at DESC
        LIMIT 10
    `, filterVals);

    return NextResponse.json({
        totalUsers: parseInt(userStats?.count || '0'),
        activeUsers: parseInt(activeStats?.count || '0'),
        plNonUnionUsers: parseInt(plNonUnionStats?.count || '0'),
        unionMembersUsers: parseInt(unionMembersStats?.count || '0'),
        totalStores: parseInt(storeStats?.count || '0'),
        openInquiries: parseInt(openInquiries?.count || '0'),
        totalAnnouncements: parseInt(announcementStats?.count || '0'),
        recentInquiries: parseInt(recentInquiries?.count || '0'),
        totalHearts: parseInt(totalHearts?.count || '0'),
        categories: categoryStats.map(c => ({ label: c.category, value: parseInt(c.count) })),
        statuses: statusStats.map(s => ({ label: s.status, value: parseInt(s.count) })),
        announcementHighlights: announcementReads.map(a => ({
            id: a.id,
            title: a.title,
            readCount: parseInt(a.read_count),
            likesCount: parseInt(a.likes_count),
            totalUsers: parseInt(a.total_users)
        })),
        totalWidgets: parseInt(totalWidgets?.count || '0'),
        widgetsByType: widgetTypeStats.map(w => ({ label: w.type, value: parseInt(w.count) })),
        totalWidgetResponses: parseInt(widgetResponseCount?.count || '0'),
        recentFormSubmissions: (recentSubmissions && recentSubmissions.length > 0) ? recentSubmissions.map(s => ({
            id: s.id,
            widgetTitle: s.widget_title,
            widgetConfig: s.widget_config,
            userName: s.user_name,
            employeeNumber: s.employee_number,
            storeName: s.store_name,
            responseJson: s.response_json,
            createdAt: s.created_at
        })) : [],
        recentInquiriesList: await query<{ id: number, title: string, user_name: string, employee_number: string, store_name: string, status: string, created_at: string }>(`
            SELECT 
                i.id, 
                i.title, 
                u.name as user_name, 
                u.employee_number,
                s.name as store_name, 
                i.status, 
                i.created_at
            FROM inquiries i
            JOIN users u ON i.author_id = u.id
            LEFT JOIN stores s ON i.store_id = s.id
            WHERE i.status IN ('OPEN', 'IN_PROGRESS') AND ${inquiryFilterSql}
            ORDER BY i.created_at DESC
            LIMIT 5
        `, filterVals)
    });
}
