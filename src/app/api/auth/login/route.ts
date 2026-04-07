import { cookies } from 'next/headers';
import { z } from 'zod';
import { query, queryOne } from '@/lib/db';
import { signJWT } from '@/lib/jwt';
import { verifyPassword } from '@/lib/password';
import { logAudit } from '@/lib/audit';
import { AUTH_COOKIE } from '@/lib/auth';

const loginSchema = z.object({
    employeeNumber: z.string().min(1),
    password: z.string().min(1),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = loginSchema.safeParse(body);
        if (!parsed.success) return Response.json({ error: '必須項目が不足しています' }, { status: 400 });

        const { employeeNumber, password } = parsed.data;

        const user = await queryOne<any>(
            `SELECT u.*, s.name as store_name, sg.name as group_name, s.group_id
             FROM users u
             LEFT JOIN stores s ON s.id = u.store_id
             LEFT JOIN store_groups sg ON sg.id = s.group_id
             WHERE u.employee_number = $1`,
            [employeeNumber]
        );

        if (!user) {
            return Response.json({ error: '社員番号またはパスワードが正しくありません' }, { status: 401 });
        }

        if (!user.is_active) {
            return Response.json({ error: 'このアカウントは現在停止されています' }, { status: 403 });
        }

        const valid = await verifyPassword(password, user.password_hash);
        if (!valid) {
            return Response.json({ error: '社員番号またはパスワードが正しくありません' }, { status: 401 });
        }

        const payload = {
            sub: String(user.id),
            role: user.role,
            storeId: user.store_id,
            groupId: user.group_id,
            employeeNumber: user.employee_number,
            name: user.name,
            employmentType: user.employment_type,
            unionRole: user.union_role,
            jobTitle: user.job_title,
        };

        const token = await signJWT(payload);

        // Update last login
        await query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [user.id]);

        await logAudit(payload, 'USER_LOGIN', 'users', user.id, {});

        // Set cookie via Response header
        const isProd = process.env.NODE_ENV === 'production';
        const serialized = `${AUTH_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}${isProd ? '; Secure' : ''}`;

        return new Response(JSON.stringify({
            data: {
                id: user.id,
                employeeNumber: user.employee_number,
                name: user.name,
                email: user.email,
                role: user.role,
                storeId: user.store_id,
                storeName: user.store_name,
                groupName: user.group_name,
                employmentType: user.employment_type,
                mustChangePw: user.must_change_pw,
            },
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': serialized
            }
        });

    } catch (e: any) {
        console.error('[login] Critical Error:', e);
        return Response.json({ error: 'ログイン処理中にエラーが発生しました' }, { status: 500 });
    }
}
