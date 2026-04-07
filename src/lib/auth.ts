import { cookies } from 'next/headers';
import { verifyJWT } from './jwt';
import type { JWTPayload } from '@/types';

export const AUTH_COOKIE = 'auth_token';

export async function getCurrentUser(): Promise<JWTPayload | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_COOKIE)?.value;
        if (!token) return null;
        return await verifyJWT(token);
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
