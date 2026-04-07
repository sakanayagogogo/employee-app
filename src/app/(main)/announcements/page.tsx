'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getRelativeTime } from '@/lib/date';

interface Announcement {
    id: number;
    title: string;
    importance: string;
    category: string;
    isRead: boolean;
    authorName: string;
    createdAt: string;
    hasBookmarked: boolean;
}

export default function AnnouncementsPage() {
    const [items, setItems] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        fetch('/api/announcements?limit=100')
            .then((r) => r.json())
            .then((d) => setItems(d.data ?? []))
            .finally(() => setLoading(false));
    }, []);

    const handleBookmark = async (e: React.MouseEvent, annId: number) => {
        e.preventDefault();
        e.stopPropagation();
        const res = await fetch(`/api/announcements/${annId}/bookmark`, { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            setItems(prev => prev.map(a => a.id === annId ? { ...a, hasBookmarked: data.bookmarked } : a));
        }
    };

    const displayed = filter === 'unread' ? items.filter((a) => !a.isRead) : items;

    const categoryBadge = (cat: string) => {
        switch (cat) {
            case 'PRESIDENT':
                return <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">きずな</span>;
            case 'MUST_READ':
                return <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">必読</span>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900">お知らせ</h1>
                <div className="flex bg-gray-100 rounded-xl p-1">
                    {(['all', 'unread'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'
                                }`}
                        >
                            {f === 'all' ? 'すべて' : '未読'}
                            {f === 'unread' && items.filter((a) => !a.isRead).length > 0 && (
                                <span className="ml-1 bg-orange-100 text-orange-600 text-xs px-1.5 py-0.5 rounded-full">
                                    {items.filter((a) => !a.isRead).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-gray-100 rounded w-1/3" />
                        </div>
                    ))}
                </div>
            ) : displayed.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <p>お知らせはありません</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {displayed.map((ann) => (
                        <Link key={ann.id} href={`/announcements/${ann.id}`}>
                            <div className={`bg-white rounded-2xl p-4 border transition-all hover:shadow-md ${ann.category === 'PRESIDENT' && !ann.isRead ? 'border-purple-200 bg-purple-50/30' :
                                    ann.category === 'MUST_READ' && !ann.isRead ? 'border-red-200 bg-red-50/30' :
                                        !ann.isRead ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100'
                                }`}>
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {!ann.isRead ? (
                                            <span className={`w-2 h-2 rounded-full block mt-1.5 ${ann.category === 'PRESIDENT' ? 'bg-purple-500' :
                                                    ann.category === 'MUST_READ' ? 'bg-red-500' :
                                                        'bg-orange-500'
                                                }`} />
                                        ) : (
                                            <span className="w-2 h-2 bg-gray-200 rounded-full block mt-1.5" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {categoryBadge(ann.category)}
                                            {ann.importance === 'IMPORTANT' && (
                                                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">重要</span>
                                            )}
                                            <p className={`text-sm truncate ${!ann.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                {ann.title}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-xs text-gray-400">{ann.authorName}</p>
                                            <span className="text-gray-300">·</span>
                                            <p className="text-xs text-gray-400">{getRelativeTime(ann.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 mt-1">
                                        <button
                                            onClick={(e) => handleBookmark(e, ann.id)}
                                            className={`transition-colors ${ann.hasBookmarked ? 'text-orange-500' : 'text-gray-300 hover:text-orange-400'}`}
                                        >
                                            <svg className="w-5 h-5" fill={ann.hasBookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                            </svg>
                                        </button>
                                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
