import { getCurrentUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
const articleSchema = z.object({
  id: z.string().regex(/^\d+$/).optional(),
  title: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(40),
  body: z.string().trim().min(1).max(50000),
  image_url: z.string().max(2000).refine(value => {
    if (!value) return true;
    try { const url = new URL(value); return url.protocol === 'https:' && ['t-union.jp', 'www.t-union.jp'].includes(url.hostname); } catch { return false; }
  }),
  published: z.boolean(),
});
async function admin() {
  const user = await getCurrentUser();
  return user?.role === 'HQ_ADMIN' ? user : null;
}
export async function GET() {
  if (!await admin()) return Response.json({ error: '権限がありません' }, { status: 403 });
  try {
    return Response.json(await query('SELECT id, title, category, body, image_url, published, published_at, updated_at FROM website_articles ORDER BY updated_at DESC, id DESC LIMIT 500'));
  } catch { return Response.json({ error: '記事を取得できません。データベースの準備を確認してください。' }, { status: 500 }); }
}
export async function POST(request: Request) {
  const user = await admin();
  if (!user) return Response.json({ error: '権限がありません' }, { status: 403 });
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) return Response.json({ error: '不正なリクエストです' }, { status: 403 });
  let input;
  try { input = articleSchema.safeParse(await request.json()); } catch { return Response.json({ error: '入力を確認してください' }, { status: 400 }); }
  if (!input.success) return Response.json({ error: '入力内容を確認してください。画像はアップロードしたURLを使用してください。' }, { status: 400 });
  const { id, title, category, body, image_url, published } = input.data;
  try {
    const row = id
      ? await queryOne<{id: string}>(`UPDATE website_articles SET title=$1, category=$2, body=$3, image_url=$4, published=$5, published_at=CASE WHEN $5 AND NOT published THEN now() WHEN NOT $5 THEN NULL ELSE published_at END, updated_at=now() WHERE id=$6 RETURNING id`, [title, category, body, image_url || null, published, id])
      : await queryOne<{id: string}>(`INSERT INTO website_articles (title, category, body, image_url, published, published_at) VALUES ($1,$2,$3,$4,$5,CASE WHEN $5 THEN now() ELSE NULL END) RETURNING id`, [title, category, body, image_url || null, published]);
    if (!row) return Response.json({ error: '記事が見つかりません' }, { status: 404 });
    await logAudit(user, published ? 'WEBSITE_PUBLISH' : 'WEBSITE_SAVE_DRAFT', 'website_article', Number(row.id));
    return Response.json(row);
  } catch { return Response.json({ error: '保存できませんでした。データベースの準備を確認してください。' }, { status: 500 }); }
}
