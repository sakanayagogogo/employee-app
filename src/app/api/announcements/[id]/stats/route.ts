import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) return Response.json({ error: '権限がありません' }, { status: 403 });

    const { id } = await params;

    const ann = await queryOne<{ id: number; title: string }>(
        `SELECT id, title FROM announcements WHERE id = $1`,
        [parseInt(id)]
    );
    if (!ann) return Response.json({ error: 'お知らせが見つかりません' }, { status: 404 });

    const paramsList: any[] = [parseInt(id)];
    let storeFilter = '';
    if (user.role === 'STORE_ADMIN') {
        const { getAreaGroupId } = await import('@/lib/rbac');
        const areaGroupId = getAreaGroupId(user.unionRole);
        if (areaGroupId) {
            storeFilter = `AND (u.store_id = $${paramsList.length + 1} OR EXISTS (SELECT 1 FROM stores s2 WHERE s2.id = u.store_id AND s2.group_id = $${paramsList.length + 2}))`;
            paramsList.push(user.storeId ?? -1);
            paramsList.push(areaGroupId);
        } else {
            storeFilter = `AND u.store_id = $${paramsList.length + 1}`;
            paramsList.push(user.storeId);
        }
    }

    const readUsers = await query<{
        id: number;
        employee_number: string;
        name: string;
        store_name: string | null;
        read_at: string;
    }>(
        `SELECT u.id, u.employee_number, u.name, s.name as store_name, ar.read_at
         FROM announcement_reads ar
         JOIN users u ON u.id = ar.user_id
         LEFT JOIN stores s ON s.id = u.store_id
         WHERE ar.announcement_id = $1 ${storeFilter}
         ORDER BY ar.read_at DESC`,
        paramsList
    );

    const unreadUsers = await query<{
        id: number;
        employee_number: string;
        name: string;
        store_name: string | null;
    }>(
        `SELECT u.id, u.employee_number, u.name, s.name as store_name
     FROM users u
     LEFT JOIN stores s ON s.id = u.store_id
     WHERE u.is_active = TRUE ${storeFilter}
       AND NOT EXISTS (
         SELECT 1 FROM announcement_reads ar
         WHERE ar.announcement_id = $1 AND ar.user_id = u.id
       )
     ORDER BY u.name
     LIMIT 200`,
        paramsList
    );

    const totalEligible = await queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM users u WHERE u.is_active = TRUE ${storeFilter.replace(/\$2/g, '$1').replace(/\$3/g, '$2')}`,
        storeFilter ? (paramsList.length === 3 ? [paramsList[1], paramsList[2]] : [paramsList[1]]) : []
    );

    return Response.json({
        data: {
            title: ann.title,
            readCount: readUsers.length,
            totalEligible: parseInt(totalEligible?.count ?? '0'),
            readUsers: readUsers.map((u) => ({
                id: u.id,
                employeeNumber: u.employee_number,
                name: u.name,
                storeName: u.store_name,
                readAt: u.read_at,
            })),
            unreadUsers: unreadUsers.map((u) => ({
                id: u.id,
                employeeNumber: u.employee_number,
                name: u.name,
                storeName: u.store_name,
            })),
        },
    });
}
