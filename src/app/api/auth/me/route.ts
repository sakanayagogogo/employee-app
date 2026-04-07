import { queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: '認証が必要です' }, { status: 401 });

    const row = await queryOne<{
        id: number; employee_number: string; name: string; email: string | null;
        role: string; store_id: number | null; store_name: string | null;
        group_name: string | null;
        employment_type: string;
            union_role: string;
            job_title: string | null;
            is_active: boolean; 
            must_change_pw: boolean;
            last_login_at: string | null;
            avatar_url: string | null; 
            background_url: string | null;
            is_non_union: boolean;
        }>(
            `SELECT u.id, u.employee_number, u.name, u.email, u.role,
                u.store_id, s.name AS store_name, sg.name AS group_name, u.employment_type,
                u.union_role, u.job_title, u.is_active, u.must_change_pw, u.last_login_at,
                u.avatar_url, u.background_url,
                (COALESCE(mj.is_non_union, FALSE) OR COALESCE(me.is_non_union, FALSE) OR COALESCE(mu.is_non_union, FALSE)) as is_non_union
            FROM users u
            LEFT JOIN stores s ON s.id = u.store_id
            LEFT JOIN store_groups sg ON sg.id = s.group_id
            LEFT JOIN master_data mj ON mj.category = 'job_title' AND mj.code = u.job_title
            LEFT JOIN master_data me ON me.category = 'employment_type' AND me.code = u.employment_type
            LEFT JOIN master_data mu ON mu.category = 'union_role' AND mu.code = u.union_role
            WHERE u.id = $1`,
            [parseInt(user.sub)]
        );

    if (!row) return Response.json({ error: 'ユーザーが見つかりません' }, { status: 404 });

    return Response.json({
        data: {
            id: row.id,
            employeeNumber: row.employee_number,
            name: row.name,
            email: row.email,
            role: row.role,
            storeId: row.store_id,
            storeName: row.store_name,
            groupName: row.group_name,
            employmentType: row.employment_type,
            unionRole: row.union_role,
            jobTitle: row.job_title,
            isActive: row.is_active,
            mustChangePw: row.must_change_pw,
            lastLoginAt: row.last_login_at,
            avatarUrl: row.avatar_url,
            backgroundUrl: row.background_url,
            isNonUnion: row.is_non_union,
        }
    });
}
