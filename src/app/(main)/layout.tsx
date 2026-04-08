'use client';

import { useAuth } from '@/contexts/AuthContext';
import MobileNav from '@/components/layout/MobileNav';
import GlobalMenuSidebar from '@/components/layout/GlobalMenuSidebar';
import PushPermissionBanner from '@/components/push/PushPermissionBanner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, logout, unreadCount, unreadInquiryCount } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
            <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
                <div className="h-28 w-28 bg-black rounded-[2.5rem] p-5 flex items-center justify-center shadow-2xl animate-pulse-gentle">
                    <img src="/kizuna-color.svg" alt="Loading KIZUNA..." className="h-full w-full object-contain animate-spin-slow" />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <p className="text-zinc-600 text-sm font-bold tracking-widest">読み込み中</p>
                    <div className="w-24 h-1 bg-zinc-200 rounded-full overflow-hidden relative">
                    <div className="absolute inset-x-0 h-full bg-emerald-500 animate-[loading-bar_1.5s_infinite_ease-in-out]" />
                    </div>
                </div>
            </div>
            </div>
        );
    }

    if (!user) return null;
    
    // Non-union members block
    if (user.isNonUnion) {
        return (
            <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-[40px] p-10 shadow-2xl border border-red-100 flex flex-col items-center text-center gap-8 animate-in icon-slide-up duration-500">
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-5xl shadow-inner animate-pulse">
                        🚫
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
                    <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Union Communication System Layer</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 text-zinc-900 font-sans flex flex-col">
            {/* Blue Header */}
            <header className="bg-emerald-600 sticky top-0 z-40 text-white shadow-sm">
                <div className="hidden lg:flex max-w-[1200px] mx-auto px-4 h-14 items-center justify-between w-full">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/home')}>
                            <div className="h-12 w-12 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                <img src="/kizuna-icon.svg" alt="" className="h-full w-full object-contain drop-shadow-md" />
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="font-black text-2xl tracking-tighter text-white uppercase">KIZUNA</span>
                                <span className="text-[9px] font-bold text-emerald-100 tracking-wider">とりせん労働組合連絡システム</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">                        {/* Desktop Navigation Links (Moved to right) */}
                        <nav className="hidden lg:flex items-center gap-1">
                             <Link href="/announcements" className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10 transition-colors whitespace-nowrap group relative">
                                <svg className="w-5 h-5 text-white/80 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <span className="font-bold text-sm">お知らせ</span>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-emerald-600 shadow-sm animate-in zoom-in duration-300">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </Link>
                            <Link href="/inquiries" className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10 transition-colors whitespace-nowrap group relative">
                                <svg className="w-5 h-5 text-white/80 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="font-bold text-sm">メール</span>
                                {unreadInquiryCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-emerald-600 shadow-sm animate-in zoom-in duration-300">
                                        {unreadInquiryCount > 99 ? '99+' : unreadInquiryCount}
                                    </span>
                                )}
                            </Link>
                            <Link href="/home" className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10 transition-colors whitespace-nowrap group">
                                <svg className="w-5 h-5 text-white/80 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span className="font-bold text-sm">ホーム</span>
                            </Link>
                            <Link href="/newsletter?category=PRESIDENT" className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10 transition-colors whitespace-nowrap group">
                                <svg className="w-5 h-5 text-white/80 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                </svg>
                                <span className="font-bold text-sm">機関誌「きずな」</span>
                            </Link>
                        </nav>
                        
                        <div className="w-px h-6 bg-white/20 mx-2 hidden lg:block" /> {/* Separator */}
                        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push('/profile')}>
                            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shadow-inner overflow-hidden border border-white/30">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    user.name.charAt(0)
                                )}
                            </div>
                        </div>
                        {(user.role === 'STORE_ADMIN' || user.role === 'HQ_ADMIN') && (
                            <a href="/admin" className="text-[11px] font-bold tracking-wider uppercase bg-white text-emerald-600 px-3 py-1 rounded shadow-sm hover:bg-emerald-50 transition-colors ml-2 hidden lg:block">
                                管理
                            </a>
                        )}
                    </div>
                </div>

                {/* Mobile Header */}
                <div className="lg:hidden flex h-14 px-4 items-center justify-between w-full relative">
                    <div className="flex items-center z-10 cursor-pointer" onClick={() => router.push('/profile')}>
                        <div className="w-8 h-8 rounded-full border border-white/20 bg-gray-200 flex items-center justify-center overflow-hidden">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-gray-500 font-bold text-xs">{user.name.charAt(0)}</span>
                            )}
                        </div>
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 cursor-pointer" onClick={() => router.push('/home')}>
                        <div className="h-10 w-10 flex items-center justify-center">
                            <img src="/kizuna-icon.svg" alt="" className="h-full w-full object-contain" />
                        </div>
                        <span className="font-black text-xl tracking-tighter text-white uppercase">KIZUNA</span>
                    </div>
                    <div className="w-8 z-10" /> {/* Spacer for balance */}
                </div>
            </header>

            <div className="flex-1 w-full max-w-[1200px] mx-auto px-0 lg:px-4 py-0 lg:py-6 mt-14 lg:mt-0">
                <div className="lg:grid lg:grid-cols-12 lg:gap-6 px-4 lg:px-0">
                    {/* Left Sidebar (Desktop Only) */}
                    <aside className="hidden lg:block col-span-3 space-y-4">
                        {/* Profile Card */}
                        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden relative group">
                            <Link href="/profile" className="absolute top-3 right-3 p-1.5 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-black/60 shadow-sm" title="プロフィール編集">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </Link>
                            <div className="h-24 bg-gradient-to-r from-emerald-100 to-emerald-200 relative overflow-hidden">
                                {user.backgroundUrl ? (
                                    <img src={user.backgroundUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                                ) : (
                                    <div className="absolute inset-0 opacity-40 mix-blend-multiply flex items-center justify-center overflow-hidden">
                                        <svg className="w-full h-full text-emerald-500/20 max-w-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                            <rect x="0" y="0" width="100" height="100" fill="currentColor" />
                                            <rect x="20" y="20" width="30" height="40" fill="white" opacity="0.5" />
                                            <rect x="60" y="30" width="20" height="30" fill="white" opacity="0.5" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="px-4 pb-4 relative pt-12">
                                <div className="w-16 h-16 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center shadow-sm absolute -top-8 left-4 text-xl font-bold text-gray-400 z-10 overflow-hidden">
                                    {user.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : user.name.charAt(0)}
                                </div>
                                <div className="mt-2 text-left">
                                    <h3 className="font-bold text-gray-900 text-lg hover:text-emerald-600 transition-colors w-fit">
                                        <Link href="/profile">{user.name}</Link>
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {user.groupName && user.storeName ? `${user.groupName} ${user.storeName}` : (user.storeName ?? '本部')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Menu (Includes fixed items and dynamic widgets) */}
                        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
                             <GlobalMenuSidebar />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="col-span-12 lg:col-span-9 pb-20 lg:pb-0 animate-fade-in z-10 w-full max-w-4xl">
                        {children}
                    </main>
                </div>
            </div>

            {/* Push notification banner */}
            <PushPermissionBanner />

            {/* Bottom nav for Mobile only */}
            <div className="lg:hidden">
                <MobileNav />
            </div>
        </div>
    );
}
