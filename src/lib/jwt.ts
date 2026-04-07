import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from '@/types';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable must be set in production');
}
const secret = new TextEncoder().encode(
    jwtSecret || 'dev_only_secret_do_not_use_in_production!!'
);
const alg = 'HS256';
const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

export async function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
    return new SignJWT(payload as Record<string, unknown>)
        .setProtectedHeader({ alg })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(secret);
}

export async function verifyJWT(token: string): Promise<JWTPayload> {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
}
