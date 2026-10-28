'use client';
import { useEffect, useState } from 'react';
import type { WebsiteArticle } from '@/lib/website';

type Form = { id?: string; title: string; category: string; body: string; image_url: string; published: boolean };
const empty = (): Form => ({ title: '', category: '組合ニュース', body: '', image_url: '', published: false });
export default function WebsiteAdmin() {
  const [articles, setArticles] = useState<WebsiteArticle[]>([]);
  const [form, setForm] = useState<Form>(empty());
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() {
    try { const res = await fetch('/api/admin/website', { cache: 'no-store' }); const data = await res.json(); if (!res.ok) throw new Error(data.error); setArticles(data); }
    catch (e) { setMessage(e instanceof Error ? e.message : '読み込みに失敗しました'); }
  }
  useEffect(() => {
    let active = true;
    fetch('/api/admin/website', { cache: 'no-store' }).then(async res => { const data = await res.json(); if (!res.ok) throw new Error(data.error); if (active) setArticles(data); }).catch(e => { if (active) setMessage(e instanceof Error ? e.message : '読み込みに失敗しました'); });
    return () => { active = false; };
  }, []);
  async function save(published: boolean) {
    if (!form.title.trim() || !form.body.trim() || !form.category.trim()) { setMessage('タイトル・分類・本文を入力してください。'); return; }
    if (published && !window.confirm('この記事をインターネット上に公開します。組合員限定の情報や個人情報が含まれていないことを確認しましたか？')) return;
    setBusy(true); setMessage('');
    try {
      const res = await fetch('/api/admin/website', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, published }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      setForm({ ...form, id: String(data.id), published }); setMessage(published ? '公開しました。' : '下書きとして保存しました。'); await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : '保存に失敗しました'); } finally { setBusy(false); }
  }
  async function upload(file: File) {
    setBusy(true); setMessage('画像をアップロードしています…');
    try { const data = new FormData(); data.set('image', file); const res = await fetch('/api/uploads', { method: 'POST', body: data }); const result = await res.json(); if (!res.ok) throw new Error('画像をアップロードできませんでした。'); setForm(f => ({ ...f, image_url: result.url })); setMessage('画像を追加しました。公開用の画像であることを確認してください。'); }
    catch (e) { setMessage(e instanceof Error ? e.message : '画像をアップロードできませんでした'); } finally { setBusy(false); }
  }
  return <div className="space-y-6 pb-24 text-zinc-900">
    <div><h1 className="text-2xl font-bold">公式ホームページ管理</h1><p className="mt-2 text-sm text-zinc-600">公開用の記事を作成します。 <a href="/admin/website/design" className="text-emerald-700 underline">デザイン設定</a>　<a className="text-emerald-700 underline" href="/website" target="_blank" rel="noreferrer">公開ページを見る ↗</a></p></div>
    <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">公開記事と画像は誰でも閲覧できます。組合員限定の内容は掲載しないでください。</p>
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-900">{message}</p>}
    <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
      <section className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex justify-between items-center"><h2 className="font-bold">記事一覧</h2><button className="text-emerald-700 underline" onClick={() => { setForm(empty()); setMessage(''); }}>新規作成</button></div>
        <ul className="mt-4 space-y-2">{articles.map(a => <li key={a.id}><button className="w-full rounded-xl border p-3 text-left hover:bg-zinc-50" onClick={() => {setForm({ ...a, id: String(a.id), image_url: a.image_url || '' }); setMessage('');}}><span className="block font-bold">{a.title}</span><span className="text-xs text-zinc-500">{a.published ? '公開中' : '下書き'} ・ {a.category}</span></button></li>)}</ul>
      </section>
      <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-bold">{form.id ? '記事を編集' : '新しい記事'}</h2>
        <label className="block text-sm font-bold">タイトル<input className="mt-1 w-full rounded-lg border p-3 font-normal" value={form.title} maxLength={160} onChange={e => setForm({...form,title:e.target.value})}/></label>
        <label className="block text-sm font-bold">分類<input className="mt-1 w-full rounded-lg border p-3 font-normal" value={form.category} maxLength={40} onChange={e => setForm({...form,category:e.target.value})}/></label>
        <label className="block text-sm font-bold">本文<textarea className="mt-1 min-h-64 w-full rounded-lg border p-3 font-normal" value={form.body} maxLength={50000} onChange={e => setForm({...form,body:e.target.value})}/></label>
        <label className="block text-sm font-bold">写真（JPEG・PNG・GIF・WebP、10MB以下）<input className="mt-2 block w-full font-normal" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={e => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ''; }}/></label>
        {form.image_url && <div><p className="break-all text-xs text-zinc-500">{form.image_url}</p><button className="text-sm text-red-700 underline" onClick={() => setForm({...form,image_url:''})}>写真を記事から外す</button></div>}
        <div className="flex flex-wrap gap-3"><button disabled={busy} onClick={() => void save(false)} className="rounded-xl border px-5 py-3 font-bold disabled:opacity-50">下書き保存・非公開</button><button disabled={busy} onClick={() => void save(true)} className="rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white disabled:opacity-50">公開する</button></div>
      </section>
    </div>
  </div>;
}
