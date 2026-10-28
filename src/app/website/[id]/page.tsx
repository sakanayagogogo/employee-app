import Link from 'next/link';
import { notFound } from 'next/navigation';
import { queryOne } from '@/lib/db';
import { getPublishedDesign } from '@/lib/website-design-server';
import type { WebsiteArticle } from '@/lib/website';
import WebsiteShell from '../WebsiteShell';
export const dynamic = 'force-dynamic';
export default async function ArticlePage({params}: {params: Promise<{id:string}>}) {
  const {id} = await params; if (!/^\d+$/.test(id)) notFound();
  const article = await queryOne<WebsiteArticle>('SELECT id, title, category, body, image_url, published_at FROM website_articles WHERE id=$1 AND published=TRUE', [id]); if (!article) notFound();
  const design = await getPublishedDesign();
  return <WebsiteShell design={design}><article className="article-detail"><Link href="/website">← 記事一覧へ</Link><div className="article-meta" style={{marginTop:32}}><span className="article-category">{article.category}</span><time>{article.published_at ? new Date(article.published_at).toLocaleDateString('ja-JP',{timeZone:'Asia/Tokyo'}) : ''}</time></div><h1 className="site-heading">{article.title}</h1>{article.image_url && <img src={article.image_url} alt="" className="article-image" />}<div className="article-body">{article.body}</div></article></WebsiteShell>;
}
