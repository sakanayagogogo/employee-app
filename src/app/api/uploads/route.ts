import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
]);

export async function POST(request: Request) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(user.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const uploadUrl = process.env.UPLOAD_API_URL;
    const uploadApiKey = process.env.UPLOAD_API_KEY;
    const uploadBasicUser = process.env.UPLOAD_BASIC_USER;
    const uploadBasicPassword = process.env.UPLOAD_BASIC_PASSWORD;
    if (!uploadUrl || !uploadApiKey || !uploadBasicUser || !uploadBasicPassword) {
        console.error('[upload] Required upload environment variables are missing');
        return Response.json({ error: 'Upload service is not configured' }, { status: 503 });
    }

    let upstreamUrl: URL;
    try {
        upstreamUrl = new URL(uploadUrl);
        if (upstreamUrl.protocol !== 'https:' || !['t-union.jp', 'www.t-union.jp'].includes(upstreamUrl.hostname)) {
            throw new Error('Upload URL is not allowed');
        }
    } catch (error) {
        console.error('[upload] Invalid UPLOAD_API_URL', error);
        return Response.json({ error: 'Upload service is not configured' }, { status: 503 });
    }

    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > MAX_UPLOAD_BYTES + 1024 * 1024) {
        return Response.json({ error: 'File is too large' }, { status: 413 });
    }

    const input = await request.formData();
    const file = input.get('image');
    if (!(file instanceof File)) {
        return Response.json({ error: 'File is required' }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
        return Response.json({ error: 'File must be 10 MB or smaller' }, { status: 413 });
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return Response.json({ error: 'Unsupported file type' }, { status: 415 });
    }

    const outgoing = new FormData();
    outgoing.set('image', file, file.name);
    const basic = Buffer.from(`${uploadBasicUser}:${uploadBasicPassword}`).toString('base64');

    try {
        const upstream = await fetch(upstreamUrl, {
            method: 'POST',
            headers: {
                'X-API-KEY': uploadApiKey,
                Authorization: `Basic ${basic}`,
            },
            body: outgoing,
            redirect: 'error',
            signal: AbortSignal.timeout(30_000),
        });
        const data = await upstream.json().catch(() => null) as { url?: unknown } | null;
        if (!upstream.ok || typeof data?.url !== 'string') {
            console.error('[upload] Upstream rejected upload', upstream.status);
            return Response.json({ error: 'Upload failed' }, { status: 502 });
        }

        const uploadedUrl = new URL(data.url);
        if (uploadedUrl.protocol !== 'https:' || !['t-union.jp', 'www.t-union.jp'].includes(uploadedUrl.hostname)) {
            return Response.json({ error: 'Upload service returned an invalid URL' }, { status: 502 });
        }
        return Response.json({ url: uploadedUrl.toString() });
    } catch (error) {
        console.error('[upload] Request failed', error);
        return Response.json({ error: 'Upload failed' }, { status: 502 });
    }
}
