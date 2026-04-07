'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const navItems = [
    { 
        href: '/admin', 
        label: 'ダッシュ', 
        exact: true, 
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 12a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
            </svg>
        ) 
    },
    { 
        href: '/admin/announcements', 
        label: 'お知らせ', 
        exact: false, 
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
        ) 
    },
    { 
        href: '/admin/inquiries', 
        label: 'メール', 
        exact: false, 
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ) 
    },
    { 
        href: '/admin/users', 
        label: 'ユーザー', 
        exact: false, 
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ) 
    },
    { 
        href: '/admin/menu', 
        label: 'メニュー', 
        exact: false, 
        hqOnly: true,
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
        ) 
    },
    { 
        href: '/admin/stores', 
        label: '店舗管理', 
        exact: false, 
        hqOnly: true,
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ) 
    },
    { 
        href: '/admin/masters/categories', 
        label: 'マスター', 
        exact: false, 
        hqOnly: true,
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ) 
    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (!loading && (!user || user.role === 'GENERAL')) {
            router.push('/home');
        }
    }, [user, loading, router]);

    // Close menu when pathname changes
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50">
            <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
                <div className="h-24 w-24 bg-black rounded-3xl p-4 flex items-center justify-center shadow-2xl animate-pulse-gentle">
                    <img src="/kizuna-color.svg" alt="Loading Admin..." className="h-full w-full object-contain animate-spin-slow" />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <p className="text-zinc-600 text-sm font-bold tracking-widest">読み込み中</p>
                    <div className="w-16 h-1 bg-zinc-200 rounded-full overflow-hidden relative">
                        <div className="absolute inset-x-0 h-full bg-emerald-500 animate-[loading-bar_1.5s_infinite_ease-in-out]" />
                    </div>
                </div>
            </div>
        </div>
    );
    if (!user || user.role === 'GENERAL') return null;

    // Non-union members block
    if (user.isNonUnion) {
        return (
            <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 font-sans">
                <div className="max-w-md w-full bg-white rounded-[40px] p-10 shadow-2xl border border-red-100 flex flex-col items-center text-center gap-8 animate-in icon-slide-up duration-500">
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center shadow-inner animate-pulse">
                        <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">アクセス制限</h1>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            申し訳ございません。このサイトは<br />
                            <span className="text-red-600 font-bold underline decoration-red-200 underline-offset-4">組合員向けの連絡システム</span>です。<br />
                            非組合員の方はご利用いただけません。
                        </p>
                    </div>
                    <button 
                        onClick={() => logout()}
                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 group"
                    >
                        <span>ログアウト</span>
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </button>
                    <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Admin Protection Layer</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 flex font-sans overflow-x-hidden">
            {/* Desktop Sidebar Toggle Tab */}
            <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`hidden lg:flex fixed top-1/2 -translate-y-1/2 z-50 w-6 h-20 bg-zinc-900 text-zinc-400 hover:text-emerald-400 border-y border-r border-white/10 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.3)] items-center justify-center transition-all duration-300 rounded-r-xl hover:bg-zinc-800 cursor-pointer group ${
                    isSidebarCollapsed ? 'left-20' : 'left-64'
                }`}
                title={isSidebarCollapsed ? "メニューを開く" : "メニューをしまう"}
            >
                {isSidebarCollapsed ? (
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                ) : (
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                )}
            </button>

            {/* Sidebar (Desktop) */}
            <aside className={`hidden lg:flex bg-zinc-950 flex-col fixed inset-y-0 left-0 z-40 border-r border-white/5 shadow-2xl shadow-zinc-900/10 overflow-x-hidden overflow-y-auto transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
                <div className={`flex items-center transition-all duration-300 ${isSidebarCollapsed ? 'p-4 justify-center' : 'p-6'}`}>
                    <div className="flex items-center gap-3.5 group">
                        <div className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 flex items-center gap-3'}`}>
                            <div className="h-12 w-12 bg-black rounded-xl p-1.5 flex-shrink-0 shadow-xl group-hover:scale-110 transition-transform">
                                <img src="/kizuna-icon.svg" alt="" className="h-full w-full object-contain" />
                            </div>
                            <div className="text-left">
                                <p className="font-black text-white text-xl tracking-tighter leading-none uppercase">KIZUNA</p>
                                <p className="text-[10px] font-bold text-emerald-400 tracking-wider mt-1 uppercase">とりせん労働組合連絡システム</p>
                            </div>
                        </div>
                    </div>
                </div>

                <nav className={`flex-1 mt-2 space-y-1 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
                    {navItems.filter(item => !item.hqOnly || user.role === 'HQ_ADMIN').map((item) => {
                        const active = item.exact
                            ? pathname === item.href
                            : pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={isSidebarCollapsed ? item.label : undefined}
                                className={`w-full flex items-center rounded-xl text-sm font-bold transition-all duration-300 overflow-hidden ${
                                    isSidebarCollapsed ? 'justify-center p-3' : 'gap-3.5 px-4 py-3'
                                } ${active
                                    ? 'bg-emerald-500/15 text-emerald-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-emerald-500/10'
                                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent'
                                    }`}
                            >
                                <span className={`shrink-0 drop-shadow-sm bg-zinc-900/50 p-2 rounded-lg border border-white/5 ${active ? 'text-emerald-400' : 'text-zinc-500'}`}>{item.icon}</span>
                                <span className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className={`border-t border-white/5 bg-zinc-900/30 transition-all duration-300 ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
                    <div className={`mb-2 bg-black/20 rounded-xl border border-white/5 overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'h-0 opacity-0 mb-0 border-transparent' : 'px-4 py-3 h-auto opacity-100'}`}>
                        <p className="text-sm font-bold text-white truncate drop-shadow-sm w-full">{user.name}</p>
                        <p className="text-[11px] text-zinc-400 font-medium tracking-wide uppercase mt-1">{user.role === 'HQ_ADMIN' ? '本部管理者' : '店舗管理者'}</p>
                    </div>
                    <Link 
                        href="/home" 
                        title="従業員画面へ戻る"
                        className={`group w-full flex items-center rounded-xl text-sm bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all duration-300 font-bold border border-emerald-500/20 overflow-hidden ${
                            isSidebarCollapsed ? 'justify-center p-3' : 'gap-2.5 px-4 py-3'
                        }`}
                    >
                        <svg className="shrink-0 w-5 h-5 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>従業員画面へ戻る</span>
                    </Link>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 inset-x-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-[100] shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center">
                        <img src="/kizuna-icon.svg" alt="" className="h-full w-full object-contain" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="font-black text-lg tracking-tighter text-zinc-900 line-clamp-1 uppercase">KIZUNA</span>
                        <span className="text-[9px] font-bold text-emerald-600 tracking-tight">とりせん労働組合連絡システム</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/home"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-100"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
                        </svg>
                        戻る
                    </Link>
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-900"
                    >
                        {isMenuOpen ? (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="lg:hidden fixed inset-0 bg-zinc-950/95 z-[90] animate-fade-in pt-16 flex flex-col overflow-y-auto">
                    <nav className="flex-1 px-6 py-8 space-y-2">
                        {navItems.filter(item => !item.hqOnly || user.role === 'HQ_ADMIN').map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-4 p-4 rounded-2xl text-lg font-bold transition-all ${pathname === item.href ? 'bg-emerald-500 text-white' : 'text-zinc-400'}`}
                            >
                                <span className={`flex items-center justify-center w-8 h-8 ${pathname === item.href ? 'text-white' : 'text-emerald-500'}`}>{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                        <Link href="/home" className="flex items-center gap-4 p-4 rounded-2xl text-lg font-bold text-zinc-500 border border-zinc-800 mt-4">
                            <span className="flex items-center justify-center w-8 h-8 text-zinc-500">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </span>
                            従業員画面へ戻る
                        </Link>
                    </nav>
                </div>
            )}

            {/* Main Content */}
            <main className={`flex-1 transition-all duration-300 p-4 sm:p-8 pt-20 lg:pt-8 w-full animate-fade-in ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <div className="lg:hidden fixed bottom-4 inset-x-4 h-16 glass-dark rounded-2xl border border-white/10 flex items-center justify-around px-2 z-[80] shadow-2xl">
                <Link href="/home" className="flex flex-col items-center gap-1 group">
                    <span className="flex items-center justify-center w-6 h-6 text-emerald-500 transition-transform opacity-80 scale-90 group-hover:scale-110">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">ホーム</span>
                </Link>
                {navItems.filter(item => !item.hqOnly || user.role === 'HQ_ADMIN').slice(0, 4).map((item) => {
                    const active = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 group">
                            <span className={`w-6 h-6 flex items-center justify-center transition-transform ${active ? 'scale-110 text-emerald-400' : 'opacity-60 scale-90 text-zinc-400'}`}>{item.icon}</span>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-emerald-400' : 'text-zinc-500'}`}>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
