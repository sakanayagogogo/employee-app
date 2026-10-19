import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    // 1. 認証チェック
    const user = await getCurrentUser();
    if (!user) {
        return new Response('Unauthorized', { status: 401 });
    }

    // 2. URLパラメータの取得
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return new Response('Missing url parameter', { status: 400 });
    }

    // 3. 許可されたドメインかチェック（セキュリティのため）
    const allowedDomains = [
        't-union.jp',
        'www.t-union.jp'
    ];
    
    let parsedUrl: URL;
    try {
        parsedUrl = new URL(targetUrl);
        if (parsedUrl.protocol !== 'https:' || !allowedDomains.includes(parsedUrl.hostname)) {
            return new Response('Forbidden domain', { status: 403 });
        }
    } catch {
        return new Response('Invalid URL', { status: 400 });
    }

    // 4. 画像の取得
    try {
        const uploadBasicUser = process.env.UPLOAD_BASIC_USER;
        const uploadBasicPassword = process.env.UPLOAD_BASIC_PASSWORD;
        if (!uploadBasicUser || !uploadBasicPassword) {
            return new Response('Image service is not configured', { status: 503 });
        }
        const auth = Buffer.from(`${uploadBasicUser}:${uploadBasicPassword}`).toString('base64');
        const response = await fetch(parsedUrl, {
            headers: {
                'Authorization': `Basic ${auth}`
            },
            redirect: 'error',
            signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
            return new Response(`Failed to fetch image: ${response.statusText}`, { status: response.status });
        }

        // 5. 画像・PDFデータをストリームとして返却
        const contentType = response.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() || '';
        const allowedContentTypes = new Set([
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf',
        ]);
        if (!allowedContentTypes.has(contentType)) {
            return new Response('Unsupported content type', { status: 415 });
        }
        
        // Next.jsのレスポンスとして、元サーバーのBody（ReadableStream）をそのまま渡す
        return new Response(response.body, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'private, no-store',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (error) {
        console.error('Image proxy error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
