/**
 * 外部ストレージのURLをアプリ内の認証プロキシURLに変換します。
 * これにより、ログインしていない第三者がURLを直接叩いても閲覧できないようになります。
 */
export function getProxyUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (typeof url !== 'string') return '';
    
    // すでにプロキシ済み、またはデータURI、相対パス、ローカル環境の場合はそのまま
    if (url.startsWith('/api/images/proxy') || 
        url.startsWith('data:') || 
        url.startsWith('/') || 
        url.includes('localhost') || 
        url.includes('127.0.0.1')) {
        return url;
    }
    
    // 特定のドメイン（ストレージサーバー）の場合のみプロキシを通す
    // ※今後、ストレージドメインが変わる場合はここを調整します
    if (url.includes('t-union.jp')) {
        return `/api/images/proxy?url=${encodeURIComponent(url)}`;
    }
    
    return url;
}
