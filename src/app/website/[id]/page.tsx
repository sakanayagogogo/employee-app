import Link from 'next/link';
import { notFound } from 'next/navigation';
import { queryOne } from '@/lib/db';
import type { WebsiteArticle } from '@/lib/website';
export const dynamic = 'force-dynamic';
export default async function ArticlePage({params}: {params: Promise<{id:string}>}) {
  const {id} = await params;
  if (!/^\d+$/.test(id)) notFound();
  const article = await queryOne<WebsiteArticle>('SELECT id, title, category, body, image_url, published_at FROM website_articles WHERE id=$1 AND published=TRUE', [id]);
  if (!article) notFound();
  return <main className="min-h-screen bg-stone-50 px-6 py-10 text-zinc-900"><article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 sm:p-10"><Link href="/website" className="text-sm text-emerald-700 underline">← 公式ホームページへ</Link><p className="mt-8 text-sm text-emerald-700">{article.category}　{article.published_at ? new Date(article.published_at).toLocaleDateString('ja-JP',{timeZone:'Asia/Tokyo'}) : ''}</p><h1 className="mt-3 text-3xl font-bold">{article.title}</h1>{article.image_url && <img src={article.image_url} alt="" className="mt-8 max-h-[500px] w-full rounded-xl object-contain" />}<div className="mt-8 whitespace-pre-wrap break-words leading-8">{article.body}</div></article></main>;
}
