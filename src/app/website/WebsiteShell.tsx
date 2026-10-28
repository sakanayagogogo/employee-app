import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import type { WebsiteDesign } from '@/lib/website-design';
import './website.css';
export default function WebsiteShell({design,children}:{design:WebsiteDesign;children:ReactNode}) {
  return <div className={`website theme-${design.theme}`} style={{'--accent':design.accent,'--background':design.background} as CSSProperties}>
    {design.custom_css && <style>{design.custom_css}</style>}
    <header className="site-header"><div className="site-header-inner"><Link className="site-title" href="/website">{design.site_title}</Link><Link className="site-login" href="/login">組合員ログイン</Link></div></header>
    <main className="site-main">{children}</main><footer className="site-footer">© {design.site_title}</footer>
  </div>;
}
