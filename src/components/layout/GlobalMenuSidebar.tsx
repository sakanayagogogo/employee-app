'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface MenuItem {
    id: number;
    type: string;
    title: string;
    categoryName: string | null;
    showInHeader: boolean;
    categoryShowInHeader: boolean;
}

export const typeIcons: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    SURVEY: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
    },
    ATTENDANCE: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    },
    CHECKLIST: {
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
    LINK: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
    },
    BOARD: {
        bg: 'bg-rose-50',
        text: 'text-rose-600',
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
    },
};

export default function GlobalMenuSidebar() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/menu')
            .then(res => res.json())
            .then(data => {
                if (data.data?.widgets) {
                    setMenuItems(data.data.widgets.filter((w: MenuItem) => w.showInHeader));
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
                        <div className="w-8 h-8 rounded-lg bg-gray-100" />
                        <div className="h-4 bg-gray-100 rounded w-24" />
                    </div>
                ))}
            </div>
        );
    }

    if (menuItems.length === 0) return null;

    const grouped = menuItems.reduce((acc, item) => {
        const cat = item.categoryName || '未分類';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, MenuItem[]>);

    return (
        <div className="divide-y divide-gray-100">
            {Object.entries(grouped).map(([category, items]) => {
                const showHeader = category !== '未分類' && items[0]?.categoryShowInHeader;
                return (
                    <div key={category} className="py-2">
                        {showHeader && (
                            <div className="px-4 py-1.5 flex items-center gap-2">
                                <div className="w-1 h-3 bg-orange-500 rounded-full" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{category}</span>
                            </div>
                        )}
                        {items.map(item => {
                            const theme = typeIcons[item.type] || typeIcons.LINK;
                            return (
                                <Link 
                                    key={item.id} 
                                    href={`/menu/widget/${item.id}`} 
                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group"
                                >
                                    <div className={`w-7 h-7 rounded-lg ${theme.bg} flex items-center justify-center group-hover:opacity-80 transition-opacity shrink-0`}>
                                        <span className={`${theme.text} scale-90`}>{theme.icon}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700 truncate">{item.title}</span>
                                </Link>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}
