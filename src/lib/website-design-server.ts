import { queryOne } from '@/lib/db';
import { defaultDesign, normalizeDesign, type WebsiteDesign } from '@/lib/website-design';
export async function getPublishedDesign(): Promise<WebsiteDesign> {
  try {
    const row = await queryOne<{published: unknown}>('SELECT published FROM website_design WHERE id=1');
    return row ? normalizeDesign(row.published) : defaultDesign;
  } catch { return defaultDesign; }
}
