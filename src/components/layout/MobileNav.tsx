'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
    {
        href: '/announcements',
        label: 'お知らせ',
        icon: (active: boolean) => (
            <svg className={`w-6 h-6 transition-colors duration-300 ${active ? 'text-emerald-500 drop-shadow-sm' : 'text-zinc-400 group-hover:text-zinc-600'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        ),
    },
    {
        href: '/inquiries',
        label: 'メール',
        icon: (active: boolean) => (
            <svg className={`w-6 h-6 transition-colors duration-300 ${active ? 'text-emerald-500 drop-shadow-sm' : 'text-zinc-400 group-hover:text-zinc-600'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        href: '/home',
        label: 'ホーム',
        icon: (active: boolean) => (
            <svg className={`w-6 h-6 transition-colors duration-300 ${active ? 'text-emerald-500 drop-shadow-sm' : 'text-zinc-400 group-hover:text-zinc-600'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
                <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75v4.5a.75.75 0 01-.75.75H5.625c-1.035 0-1.875-.84-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.432z" />
            </svg>
        ),
    },
    {
        href: '/newsletter?category=PRESIDENT',
        label: '機関誌「きずな」',
        icon: (active: boolean) => (
            <svg className={`w-6 h-6 transition-colors duration-300 ${active ? 'text-emerald-500 drop-shadow-sm' : 'text-zinc-400 group-hover:text-zinc-600'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
        ),
    },
    {
        href: '/menu',
        label: 'その他',
        icon: (active: boolean) => (
            <svg className={`w-6 h-6 transition-colors duration-300 ${active ? 'text-emerald-500 drop-shadow-sm' : 'text-zinc-400 group-hover:text-zinc-600'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
        ),
    },
];

export default function MobileNav() {
    const pathname = usePathname();
    const { unreadCount, unreadInquiryCount } = useAuth();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 glass safe-pb border-t border-zinc-200/50 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="max-w-2xl mx-auto flex items-center justify-around h-[72px] px-2">
                {navItems.map((item) => {
                    const isHome = item.href === '/home';
                    const isMenu = item.href === '/menu';
                    const isAnnouncements = item.href === '/announcements';
                    const isInquiries = item.href === '/inquiries';
                    const href = item.href;
                    const active = isMenu ? pathname.startsWith('/menu') : pathname === item.href || pathname.startsWith(item.href + '/');

                    if (isHome) {
                        return (
                            <Link key={item.href} href={href} className="group flex flex-col items-center justify-center min-w-[72px] relative -top-4 transition-all duration-300">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${active ? 'bg-emerald-600 scale-110 shadow-emerald-200' : 'bg-white border border-gray-100 group-hover:bg-gray-50'}`}>
                                    <svg className={`w-7 h-7 transition-colors duration-300 ${active ? 'text-white' : 'text-zinc-400'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
                                        <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                                        <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75v4.5a.75.75 0 01-.75.75H5.625c-1.035 0-1.875-.84-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.432z" />
                                    </svg>
                                </div>
                                <span className={`mt-1.5 text-[10px] font-black tracking-wide transition-colors duration-300 ${active ? 'text-emerald-600' : 'text-zinc-400'}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    }

                    return (
                        <Link key={item.href} href={href} className="group flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-all duration-300">
                            <div className="relative flex flex-col items-center">
                                <div className={`p-1.5 rounded-xl transition-colors duration-300 ${active ? 'bg-emerald-50/80' : 'group-hover:bg-zinc-50'}`}>
                                    {item.icon(active)}
                                </div>
                                {isAnnouncements && unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-red-200">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                                {isInquiries && unreadInquiryCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-red-200">
                                        {unreadInquiryCount > 99 ? '99+' : unreadInquiryCount}
                                    </span>
                                )}
                                {active && (
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                )}
                            </div>
                            <span className={`text-[10px] font-bold tracking-wide transition-colors duration-300 ${active ? 'text-emerald-700' : 'text-zinc-400 group-hover:text-zinc-600'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
