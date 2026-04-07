'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { typeIcons } from '@/components/layout/GlobalMenuSidebar';

interface MenuItem {
    id: number;
    type: string;
    title: string;
    categoryName: string | null;
    showInHeader: boolean;
    categoryShowInHeader: boolean;
}

export default function MenuPage() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/menu')
            .then(res => res.json())
            .then(data => {
                if (data.data?.widgets) {
                    // Filter by showInHeader to match PC sidebar
                    setMenuItems(data.data.widgets.filter((w: MenuItem) => w.showInHeader));
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="space-y-4 px-4 py-8 max-w-2xl mx-auto">
                <div className="h-8 bg-zinc-100 rounded-lg w-1/3 animate-pulse mb-8" />
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-zinc-100 animate-pulse">
                        <div className="w-10 h-10 bg-zinc-100 rounded-xl" />
                        <div className="h-4 bg-zinc-100 rounded-full w-1/2" />
                    </div>
                ))}
            </div>
        );
    }

    const grouped = menuItems.reduce((acc, item) => {
        const cat = item.categoryName || '未分類';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, MenuItem[]>);

    return (
        <div className="min-h-screen bg-zinc-50/50 pb-24">
            {/* Page Header */}
            <div className="bg-white border-b border-zinc-100 px-6 py-8 mb-4">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">サービスメニュー</h1>
                    </div>
                    <p className="text-zinc-500 text-sm font-medium">利用可能なツールをご確認いただけます。</p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 space-y-6">
                {menuItems.length === 0 ? (
                    <div className="bg-white rounded-[2rem] border border-zinc-100 p-12 text-center shadow-sm">
                        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
                             <svg className="w-8 h-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </div>
                        <p className="text-zinc-500 font-bold">表示できるメニューがありません</p>
                    </div>
                ) : (
                    Object.entries(grouped).map(([category, items]) => {
                        const showHeader = category !== '未分類' && items[0]?.categoryShowInHeader;
                        return (
                            <section key={category} className="space-y-3">
                                {showHeader && (
                                    <div className="flex items-center gap-3 px-2 mb-4">
                                        <span className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">{category}</span>
                                        <div className="flex-1 h-px bg-zinc-200/60" />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    {items.map(item => {
                                        const theme = typeIcons[item.type] || typeIcons.LINK;
                                        return (
                                            <Link 
                                                key={item.id} 
                                                href={`/menu/widget/${item.id}`} 
                                                className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md hover:translate-y-[-1px] transition-all group"
                                            >
                                                <div className={`w-11 h-11 rounded-xl ${theme.bg} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform`}>
                                                    <div className={`${theme.text} scale-110`}>{theme.icon}</div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-base font-bold text-zinc-800 truncate mb-0.5">{item.title}</h3>
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{item.type}</p>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300 group-hover:bg-zinc-100 group-hover:text-zinc-500 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })
                )}
            </div>
        </div>
    );
}
