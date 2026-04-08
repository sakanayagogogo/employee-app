import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/jwt';
import { AUTH_COOKIE } from './lib/auth';

const PUBLIC_PATHS = [
    '/login',
    '/api/auth/login',
    '/api/test-db',
    '/_next',
    '/favicon.ico',
    '/icon.png',
    '/pwa-icon.png',
    '/pwa-icon-512.png',
    '/apple-touch-icon.png',
    '/manifest.json',
    '/icons/',
];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    const token = request.cookies.get(AUTH_COOKIE)?.value;

    if (!token) {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        const user = await verifyJWT(token);
        if (!user) throw new Error('Invalid token');

        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', String(user.sub || ''));
        requestHeaders.set('x-user-role', String(user.role || 'GENERAL'));
        // Encode non-ASCII characters for header safety
        requestHeaders.set('x-user-name', encodeURIComponent(user.name || 'Unknown'));
        requestHeaders.set('x-user-employee-number', String(user.employeeNumber || ''));
        requestHeaders.set('x-user-store-id', String(user.storeId || ''));
        requestHeaders.set('x-user-employment-type', String(user.employmentType || 'EMPLOYEE'));

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    } catch {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Session expired' }, { status: 401 });
        }
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete(AUTH_COOKIE);
        return response;
    }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
