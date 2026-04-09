import { AUTH_COOKIE } from '@/lib/auth';

export async function POST() {
    const cookieOptions = [
        `${AUTH_COOKIE}=`,
        'HttpOnly',
        'Path=/',
        'SameSite=Lax',
        'Max-Age=0',
        ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []),
    ].join('; ');

    return new Response(JSON.stringify({ message: 'ログアウトしました' }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': cookieOptions,
        },
    });
}
