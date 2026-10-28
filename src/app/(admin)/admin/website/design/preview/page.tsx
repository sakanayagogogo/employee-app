import { getCurrentUser } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import { normalizeDesign } from '@/lib/website-design';
import type { WebsiteArticle } from '@/lib/website';
import WebsiteShell from '@/app/website/WebsiteShell';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
export default async function DesignPreview() {
  const user = await getCurrentUser();
  if (user?.role !== 'HQ_ADMIN') return <p>権限がありません。</p>;
  const row = await queryOne<{draft:unknown}>('SELECT draft FROM website_design WHERE id=1');
  const design = normalizeDesign(row?.draft);
  const articles = await query<WebsiteArticle>('SELECT id, title, category, published_at FROM website_articles WHERE published = TRUE ORDER BY published_at DESC, id DESC LIMIT 10');
  return <><p className="mb-4 font-bold">下書きプレビュー（保存済みのデザイン）　<Link href="/admin/website/design" className="underline">設定へ戻る</Link></p><WebsiteShell design={design}><div className="site-hero"><p className="site-tagline">{design.tagline}</p><h1 className="site-heading">{design.heading}</h1><p className="site-description">{design.description}</p></div><section><h2 className="section-heading">お知らせ・活動報告</h2><ul className="article-list">{articles.map(a=><li key={a.id}><div className="article-link"><div className="article-meta"><span className="article-category">{a.category}</span><time>{a.published_at ? new Date(a.published_at).toLocaleDateString('ja-JP',{timeZone:'Asia/Tokyo'}) : ''}</time></div><h3 className="article-title">{a.title}</h3></div></li>)}</ul></section></WebsiteShell></>;
}
