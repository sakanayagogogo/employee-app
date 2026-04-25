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
    
    try {
        const parsedUrl = new URL(targetUrl);
        if (!allowedDomains.includes(parsedUrl.hostname)) {
            return new Response('Forbidden domain', { status: 403 });
        }
    } catch {
        return new Response('Invalid URL', { status: 400 });
    }

    // 4. 画像の取得
    try {
        const auth = Buffer.from('t-union:union2656').toString('base64');
        const response = await fetch(targetUrl, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });

        if (!response.ok) {
            return new Response(`Failed to fetch image: ${response.statusText}`, { status: response.status });
        }

        // 5. 画像データをストリームとして返却
        const contentType = response.headers.get('Content-Type') || 'image/jpeg';
        const buffer = await response.arrayBuffer();

        return new Response(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable', // 長期キャッシュ
            },
        });
    } catch (error) {
        console.error('Image proxy error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
