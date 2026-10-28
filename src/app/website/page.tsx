import Link from 'next/link';
import { query } from '@/lib/db';
import type { WebsiteArticle } from '@/lib/website';
export const dynamic = 'force-dynamic';
export default async function PublicWebsite() {
  let articles: WebsiteArticle[] = []; let error = false;
  try { articles = await query<WebsiteArticle>('SELECT id, title, category, published_at FROM website_articles WHERE published = TRUE ORDER BY published_at DESC, id DESC LIMIT 100'); } catch { error = true; }
  return <div className="min-h-screen bg-stone-50 text-zinc-900"><header className="border-b bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5"><Link href="/website" className="font-bold">とりせん労働組合</Link><Link href="/login" className="rounded-full bg-emerald-700 px-5 py-2 text-sm font-bold text-white">組合員ログイン</Link></div></header>
    <main className="mx-auto max-w-5xl px-6 py-12"><div className="rounded-3xl bg-emerald-800 px-8 py-14 text-white"><p className="text-sm font-bold tracking-widest text-emerald-200">TORISEN UNION</p><h1 className="mt-4 text-3xl font-bold sm:text-4xl">とりせん労働組合<br/>公式ホームページ</h1><p className="mt-5 text-emerald-100">組合からのお知らせや活動をお届けします。</p></div>
    <section className="mt-12"><h2 className="text-2xl font-bold">お知らせ・活動報告</h2>{error ? <p className="mt-6">現在、記事を表示できません。時間をおいて再度お試しください。</p> : articles.length === 0 ? <p className="mt-6 text-zinc-500">公開中の記事はありません。</p> : <ul className="mt-6 space-y-3">{articles.map(a => <li key={a.id}><Link className="block rounded-xl border bg-white p-5 hover:border-emerald-500" href={`/website/${a.id}`}><span className="text-sm text-emerald-700">{a.category}</span><span className="ml-3 text-sm text-zinc-500">{a.published_at ? new Date(a.published_at).toLocaleDateString('ja-JP',{timeZone:'Asia/Tokyo'}) : ''}</span><h3 className="mt-2 font-bold">{a.title}</h3></Link></li>)}</ul>}</section></main><footer className="mt-12 border-t px-6 py-8 text-center text-sm text-zinc-500">© とりせん労働組合</footer></div>;
}
