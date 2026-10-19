import { cookies } from 'next/headers';
import { verifyJWT } from './jwt';
import { queryOne } from './db';
import type { JWTPayload } from '@/types';

export const AUTH_COOKIE = 'auth_token';

export async function getCurrentUser(options: { allowPasswordChangeRequired?: boolean } = {}): Promise<JWTPayload | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_COOKIE)?.value;
        if (!token) return null;
        const claims = await verifyJWT(token);
        const userId = Number.parseInt(claims.sub, 10);
        if (!Number.isSafeInteger(userId)) return null;

        // JWTs identify the session, but current database values decide access.
        // This immediately revokes disabled/deleted users and stale privileges.
        const user = await queryOne<{
            id: number;
            employee_number: string;
            name: string;
            role: JWTPayload['role'];
            store_id: number | null;
            group_id: number | null;
            employment_type: string;
            union_role: string | null;
            job_title: string | null;
            must_change_pw: boolean;
        }>(
            `SELECT u.id, u.employee_number, u.name, u.role, u.store_id,
                    s.group_id, u.employment_type, u.union_role, u.job_title, u.must_change_pw
             FROM users u
             LEFT JOIN stores s ON s.id = u.store_id
             WHERE u.id = $1 AND u.is_active = TRUE`,
            [userId]
        );
        if (!user) return null;
        if (user.must_change_pw && !options.allowPasswordChangeRequired) return null;

        return {
            ...claims,
            sub: String(user.id),
            employeeNumber: user.employee_number,
            name: user.name,
            role: user.role,
            storeId: user.store_id,
            groupId: user.group_id,
            employmentType: user.employment_type,
            unionRole: user.union_role ?? undefined,
            jobTitle: user.job_title,
            mustChangePw: user.must_change_pw,
        };
    } catch {
        return null;
    }
}

export async function requireAuth(): Promise<JWTPayload> {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('UNAUTHORIZED');
    }
    return user;
}

export async function requireRole(
    allowedRoles: import('@/types').UserRole[]
): Promise<JWTPayload> {
    const user = await requireAuth();
    if (!allowedRoles.includes(user.role)) {
        throw new Error('FORBIDDEN');
    }
    return user;
}

export function makeAuthResponse(error: string, status: 401 | 403) {
    return Response.json({ error }, { status });
}
