import { getCurrentUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { defaultDesign, normalizeDesign } from '@/lib/website-design';
import { z } from 'zod';
import postcss from 'postcss';

export const dynamic = 'force-dynamic';
const schema = z.object({
  design: z.object({
    theme: z.enum(['classic','magazine','simple']),
    site_title: z.string().trim().min(1).max(80), tagline: z.string().max(80),
    heading: z.string().trim().min(1).max(120), description: z.string().max(300),
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/), background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    custom_css: z.string().max(12000),
  }), publish: z.boolean(),
});
// CSS is confined to the public website; imports, URLs, escapes and at-rules are rejected.
function validateCss(css: string): string | null {
  if (/[<>\\]/.test(css) || /url\s*\(|expression\s*\(/i.test(css)) return 'CSSに使用できない文字またはURLがあります。';
  try {
    const root = postcss.parse(css);
    let invalid = false;
    root.walkAtRules(() => { invalid = true; });
    root.walkRules(rule => {
      if (rule.selectors.some(s => !/^\.website(?:\s|[.#:[>+~]|$)/.test(s.trim()) || /:(?:root|has)\b/i.test(s))) invalid = true;
    });
    return invalid ? '各セレクターは .website から始めてください。@ルールは使用できません。' : null;
  } catch { return 'CSSの書式を確認してください。'; }
}
async function admin() { const user = await getCurrentUser(); return user?.role === 'HQ_ADMIN' ? user : null; }
export async function GET() {
  if (!await admin()) return Response.json({error:'権限がありません'}, {status:403});
  try {
    const row = await queryOne<{draft: unknown; published: unknown}>('SELECT draft, published FROM website_design WHERE id=1');
    return Response.json({draft: row ? normalizeDesign(row.draft) : defaultDesign, published: row ? normalizeDesign(row.published) : defaultDesign});
  } catch { return Response.json({error:'デザイン設定を取得できません。データベースの準備を確認してください。'}, {status:500}); }
}
export async function POST(request: Request) {
  const user = await admin(); if (!user) return Response.json({error:'権限がありません'}, {status:403});
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({error:'不正なリクエストです'}, {status:403});
  let parsed; try { parsed = schema.safeParse(await request.json()); } catch { return Response.json({error:'入力を確認してください'}, {status:400}); }
  if (!parsed.success) return Response.json({error:'入力内容を確認してください'}, {status:400});
  const error = validateCss(parsed.data.design.custom_css); if (error) return Response.json({error}, {status:400});
  try {
    const json = JSON.stringify(parsed.data.design);
    await queryOne(`INSERT INTO website_design (id,draft,published) VALUES (1,$1::jsonb,CASE WHEN $2 THEN $1::jsonb ELSE '{}'::jsonb END)
      ON CONFLICT (id) DO UPDATE SET draft=$1::jsonb, published=CASE WHEN $2 THEN $1::jsonb ELSE website_design.published END, updated_at=now() RETURNING id`, [json,parsed.data.publish]);
    await logAudit(user,parsed.data.publish ? 'WEBSITE_DESIGN_PUBLISH' : 'WEBSITE_DESIGN_DRAFT','website_design',1);
    return Response.json({ok:true});
  } catch { return Response.json({error:'保存できません。データベースの準備を確認してください。'}, {status:500}); }
}
