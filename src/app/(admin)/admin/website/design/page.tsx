'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { defaultDesign, type WebsiteDesign } from '@/lib/website-design';

export default function WebsiteDesignAdmin() {
  const [design,setDesign] = useState<WebsiteDesign>(defaultDesign);
  const [message,setMessage] = useState(''); const [busy,setBusy] = useState(false);
  useEffect(() => { let active = true; fetch('/api/admin/website/design').then(async r => { const d=await r.json(); if (!r.ok) throw new Error(d.error); if (active) setDesign(d.draft); }).catch(e => { if (active) setMessage(e.message); }); return () => {active=false;}; },[]);
  const set = <K extends keyof WebsiteDesign>(key:K,value:WebsiteDesign[K]) => setDesign(d => ({...d,[key]:value}));
  async function save(publish:boolean) {
    if (publish && !window.confirm('このデザインを公開ページに反映しますか？')) return;
    setBusy(true); setMessage('');
    try { const r=await fetch('/api/admin/website/design',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({design,publish})}); const d=await r.json(); if(!r.ok) throw new Error(d.error); setMessage(publish ? 'デザインを公開しました。' : '下書きを保存しました。公開ページにはまだ反映されません。'); } catch(e) { setMessage(e instanceof Error ? e.message : '保存できませんでした'); } finally { setBusy(false); }
  }
  return <div className="space-y-6 pb-28 text-zinc-900"><div><Link href="/admin/website" className="text-emerald-700 underline">← 記事管理に戻る</Link><h1 className="mt-3 text-2xl font-bold">ホームページのデザイン</h1><p className="mt-2 text-sm text-zinc-600">下書きとして保存し、準備ができたら公開できます。</p></div>
  {message && <p role="status" className="rounded-xl bg-emerald-50 p-4">{message}</p>}
  <section className="space-y-5 rounded-xl bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">テーマ</h2><div className="grid gap-3 sm:grid-cols-3">{([['classic','クラシック','落ち着いた公式サイト'],['magazine','マガジン','記事をカードで見せる'],['simple','シンプル','すっきりとした一覧']] as const).map(([id,title,description]) => <label key={id} className={`cursor-pointer rounded-xl border-2 p-4 ${design.theme===id ? 'border-emerald-700 bg-emerald-50' : 'border-zinc-200'}`}><input type="radio" name="theme" checked={design.theme===id} onChange={()=>set('theme',id)}/><span className="ml-2 font-bold">{title}</span><span className="mt-2 block text-sm text-zinc-600">{description}</span></label>)}</div>
  <div className="grid gap-4 sm:grid-cols-2">{([['site_title','サイト名'],['tagline','小さな見出し'],['heading','トップページの見出し'],['description','紹介文']] as const).map(([key,label]) => <label key={key} className="text-sm font-bold">{label}<input className="mt-1 w-full rounded-lg border p-3 font-normal" value={design[key]} maxLength={key==='description'?300:key==='heading'?120:80} onChange={e=>set(key,e.target.value)}/></label>)}</div>
  <div className="flex flex-wrap gap-8">{([['accent','アクセント色'],['background','背景色']] as const).map(([key,label])=><label key={key} className="text-sm font-bold">{label}<span className="mt-2 flex items-center gap-2"><input type="color" value={design[key]} onChange={e=>set(key,e.target.value)}/><span>{design[key]}</span></span></label>)}</div></section>
  <section className="space-y-3 rounded-xl bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">追加CSS</h2><p className="text-sm text-zinc-600">詳しい方向けの設定です。各指定を <code>.website</code> から始めてください。外部URLや @ルールは使用できません。</p><textarea spellCheck={false} className="min-h-48 w-full rounded-lg border p-3 font-mono text-sm" value={design.custom_css} maxLength={12000} onChange={e=>set('custom_css',e.target.value)} placeholder={'.website .site-title { font-size: 2rem; }'} /></section>
  <div className="flex flex-wrap gap-3"><button disabled={busy} onClick={()=>void save(false)} className="rounded-lg border bg-white px-5 py-3 font-bold disabled:opacity-50">下書き保存</button><button disabled={busy} onClick={()=>void save(true)} className="rounded-lg bg-emerald-700 px-5 py-3 font-bold text-white disabled:opacity-50">デザインを公開</button><a href="/admin/website/design/preview" target="_blank" rel="noreferrer" className="px-4 py-3 text-emerald-700 underline">保存済み下書きを確認 ↗</a><a href="/website" target="_blank" rel="noreferrer" className="px-4 py-3 text-emerald-700 underline">公開ページを見る ↗</a></div></div>;
}
