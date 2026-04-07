import { NextRequest } from 'next/server';
import { queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const userId = parseInt(user.sub);
    const storeId = user.storeId;
    
    let whereClause = 'WHERE 1=1';
    const vals: any[] = [userId];

    if (user.role === 'GENERAL') {
        whereClause += ` AND i.author_id = $1`;
    } else if (user.role === 'STORE_ADMIN') {
        const { getAreaGroupId } = await import('@/lib/rbac');
        const areaGroupId = getAreaGroupId(user.unionRole);
        
        if (areaGroupId) {
            vals.push(storeId ?? -1);
            vals.push(areaGroupId);
            whereClause += ` AND (i.store_id = $2 OR EXISTS (SELECT 1 FROM stores s2 WHERE s2.id = i.store_id AND s2.group_id = $3) OR i.author_id = $1)`;
        } else {
            vals.push(storeId);
            whereClause += ` AND (i.store_id = $2 OR i.author_id = $1)`;
        }
    }

    try {
        // Count inquiries that have been updated since the user last read them, OR have never been read
        // IMPORTANT: We only count them as 'unread' if the user is NOT the one who performed the last update (i.e. someone else replied or it's a new post by someone else)
        
        const row = await queryOne<{ count: string }>(
            `SELECT COUNT(*) FROM inquiries i
             LEFT JOIN inquiry_reads r ON r.inquiry_id = i.id AND r.user_id = $1
             WHERE 1=1 
             ${whereClause === 'WHERE 1=1' ? '' : 'AND ' + whereClause.substring(6)}
             AND (r.last_read_at IS NULL OR i.updated_at > r.last_read_at)
             /* Ensure the last message was NOT from the user themselves */
             AND EXISTS (
                 SELECT 1 FROM inquiry_messages m 
                 WHERE m.inquiry_id = i.id 
                 AND m.author_id != $1
                 AND (r.last_read_at IS NULL OR m.created_at > r.last_read_at)
             )`,
            vals
        );

        return Response.json({ count: parseInt(row?.count ?? '0') });
    } catch (e: any) {
        console.error('[Inquiry Unread Count] Error:', e);
        return Response.json({ error: e.message }, { status: 500 });
    }
}
