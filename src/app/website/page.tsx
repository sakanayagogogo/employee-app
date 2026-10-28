import Link from 'next/link';
import { query } from '@/lib/db';
import { getPublishedDesign } from '@/lib/website-design-server';
import type { WebsiteArticle } from '@/lib/website';
import WebsiteShell from './WebsiteShell';
export const dynamic = 'force-dynamic';
export default async function PublicWebsite() {
  let articles: WebsiteArticle[] = []; let error = false;
  try { articles = await query<WebsiteArticle>('SELECT id, title, category, published_at FROM website_articles WHERE published = TRUE ORDER BY published_at DESC, id DESC LIMIT 100'); } catch { error = true; }
  const design = await getPublishedDesign();
  return <WebsiteShell design={design}><div className="site-hero"><p className="site-tagline">{design.tagline}</p><h1 className="site-heading">{design.heading}</h1><p className="site-description">{design.description}</p></div>
    <section><h2 className="section-heading">お知らせ・活動報告</h2>{error ? <p>現在、記事を表示できません。時間をおいて再度お試しください。</p> : articles.length === 0 ? <p>公開中の記事はありません。</p> : <ul className="article-list">{articles.map(a => <li key={a.id}><Link className="article-link" href={`/website/${a.id}`}><div className="article-meta"><span className="article-category">{a.category}</span><time>{a.published_at ? new Date(a.published_at).toLocaleDateString('ja-JP',{timeZone:'Asia/Tokyo'}) : ''}</time></div><h3 className="article-title">{a.title}</h3></Link></li>)}</ul>}</section></WebsiteShell>;
}
