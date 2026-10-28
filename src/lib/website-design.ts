export type WebsiteDesign = {
  theme: 'classic' | 'magazine' | 'simple';
  site_title: string; tagline: string; heading: string; description: string;
  accent: string; background: string; custom_css: string;
};
export const defaultDesign: WebsiteDesign = {
  theme: 'classic', site_title: 'とりせん労働組合', tagline: 'TORISEN UNION',
  heading: 'とりせん労働組合', description: '組合からのお知らせや活動をお届けします。',
  accent: '#22634d', background: '#faf9f6', custom_css: '',
};
export function normalizeDesign(value: unknown): WebsiteDesign {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultDesign;
  const input = value as Partial<WebsiteDesign>;
  return { ...defaultDesign, ...input };
}
