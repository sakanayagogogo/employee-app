import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';

/**
 * GET /api/users/search?q=<employee_number or name>
 * Admin-only: search users by employee number or name
 */
export async function GET(request: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });
    if (!isAdmin(user.role)) return Response.json({ error: '権限がありません' }, { status: 403 });

    const q = request.nextUrl.searchParams.get('q')?.trim();
    if (!q || q.length < 1) {
        return Response.json({ data: [] });
    }

    const rows = await query<{
        id: number;
        employee_number: string;
        name: string;
        store_name: string | null;
        role: string;
    }>(
        `SELECT u.id, u.employee_number, u.name, s.name AS store_name, u.role
         FROM users u
         LEFT JOIN stores s ON s.id = u.store_id
         WHERE u.is_active = TRUE
           AND (u.employee_number ILIKE $1 OR u.name ILIKE $2)
         ORDER BY u.employee_number ASC
         LIMIT 20`,
        [`%${q}%`, `%${q}%`]
    );

    return Response.json({
        data: rows.map(r => ({
            id: r.id,
            employeeNumber: r.employee_number,
            name: r.name,
            storeName: r.store_name,
            role: r.role,
        })),
    });
}
