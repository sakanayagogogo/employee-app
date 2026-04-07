'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { getRelativeTime } from '@/lib/date';
import { useSearchParams } from 'next/navigation';

interface Announcement {
    id: number;
    title: string;
    importance: string;
    category: string;
    isRead: boolean;
    authorName: string;
    createdAt: string;
}

type CategoryTab = 'ALL' | 'PRESIDENT' | 'MUST_READ' | 'GENERAL';

function NewsletterContent() {
    const [items, setItems] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const url = `/api/announcements?limit=100&category=PRESIDENT`;
        fetch(url)
            .then((r) => r.json())
            .then((d) => setItems(d.data ?? []))
            .finally(() => setLoading(false));
    }, []);

    const presidentPosts = items; // Already filtered by API or local

    return (
        <div className="space-y-4 pb-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-tight">機関誌「きずな」</h1>
                    <p className="text-xs text-gray-500 mt-1">歴代の機関誌「きずな」をこちらから閲覧できます</p>
                </div>
            </div>

            {/* Featured Post (Latest) */}
            {!loading && presidentPosts.length > 0 && (
                <div className="relative bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-700 rounded-3xl p-6 text-white overflow-hidden shadow-xl shadow-purple-100/50">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9InAiIHg9IjAiIHk9IjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNwKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-60" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl border border-white/20 shadow-2xl">
                                📚
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-purple-200 uppercase tracking-[0.2em] mb-0.5">LATEST ISSUE</p>
                                <p className="text-xl font-black tracking-tight">機関誌「きずな」最新号</p>
                            </div>
                        </div>
                        <Link href={`/announcements/${presidentPosts[0].id}`}>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all cursor-pointer group shadow-inner">
                                <div className="flex justify-between items-start gap-4 mb-2">
                                    <p className="font-bold text-lg leading-snug group-hover:text-purple-100 transition-colors uppercase">{presidentPosts[0].title}</p>
                                    {!presidentPosts[0].isRead && (
                                        <span className="shrink-0 bg-white text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm animate-pulse">NEW</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-purple-200 font-medium">
                                    <span>執筆：{presidentPosts[0].authorName}</span>
                                    <span>·</span>
                                    <span>{new Date(presidentPosts[0].createdAt).toLocaleDateString('ja-JP')}発行</span>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            )}

            {/* Grid Title */}
            <div className="flex items-center gap-3 pt-4 pb-2">
                <div className="w-1 h-4 bg-purple-600 rounded-full" />
                <h2 className="font-black text-gray-900 uppercase tracking-widest text-sm">バックナンバー</h2>
            </div>

            {/* Content List */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-3xl p-5 animate-pulse border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-gray-100 rounded-full" />
                                <div className="h-3 bg-gray-100 rounded w-24" />
                            </div>
                            <div className="h-4 bg-gray-100 rounded w-5/6 mb-2" />
                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : presidentPosts.length <= 1 ? (
                presidentPosts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <div className="text-4xl mb-4 grayscale opacity-50">📚</div>
                        <p className="text-gray-400 text-sm font-bold">まだ機関誌がありません</p>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                        <p className="text-gray-400 text-xs font-medium">これより古い記事はありません</p>
                    </div>
                )
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {presidentPosts.slice(1).map((ann) => (
                        <Link key={ann.id} href={`/announcements/${ann.id}`}>
                            <NewsCard announcement={ann} />
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function NewsletterPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center animate-pulse text-gray-400">Loading...</div>}>
            <NewsletterContent />
        </Suspense>
    );
}

function NewsCard({ announcement: ann }: { announcement: Announcement }) {
    const categoryConfig: Record<string, { bgColor: string; borderColor: string; badge: string; badgeColor: string; avatarBg: string; avatarText: string; avatarIcon: string }> = {
        PRESIDENT: {
            bgColor: !ann.isRead ? 'bg-purple-50/50' : 'bg-white',
            borderColor: !ann.isRead ? 'border-purple-200' : 'border-gray-100',
            badge: '機関誌「きずな」',
            badgeColor: 'bg-purple-100 text-purple-700',
            avatarBg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
            avatarText: 'text-white',
            avatarIcon: '📚',
        },
        MUST_READ: {
            bgColor: !ann.isRead ? 'bg-red-50/50' : 'bg-white',
            borderColor: !ann.isRead ? 'border-red-200' : 'border-gray-100',
            badge: '必読',
            badgeColor: 'bg-red-100 text-red-700',
            avatarBg: 'bg-gradient-to-br from-red-500 to-rose-600',
            avatarText: 'text-white',
            avatarIcon: '❗',
        },
        GENERAL: {
            bgColor: !ann.isRead ? 'bg-blue-50/30' : 'bg-white',
            borderColor: !ann.isRead ? 'border-blue-200/50' : 'border-gray-100',
            badge: '',
            badgeColor: '',
            avatarBg: 'bg-blue-100',
            avatarText: 'text-blue-600',
            avatarIcon: '',
        },
    };

    const config = categoryConfig[ann.category] ?? categoryConfig['GENERAL'];

    return (
        <div className={`rounded-2xl p-4 border transition-all hover:shadow-md ${config.bgColor} ${config.borderColor} mb-1`}>
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.avatarBg} ${config.avatarText} font-bold text-sm shadow-sm`}>
                    {config.avatarIcon || ann.authorName.charAt(0)}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        {config.badge && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.badgeColor}`}>
                                {config.badge}
                            </span>
                        )}
                        {ann.importance === 'IMPORTANT' && (
                            <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">重要</span>
                        )}
                        {!ann.isRead && (
                            <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">NEW</span>
                        )}
                    </div>
                    <p className={`text-sm ${!ann.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'} line-clamp-2`}>
                        {ann.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                        <p className="text-xs text-gray-400">{ann.authorName}</p>
                        <span className="text-gray-300">·</span>
                        <p className="text-xs text-gray-400">{getRelativeTime(ann.createdAt)}</p>
                    </div>
                </div>
                {/* Arrow */}
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </div>
    );
}
