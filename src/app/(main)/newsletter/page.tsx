'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { getRelativeTime } from '@/lib/date';
import { useSearchParams } from 'next/navigation';
import PdfThumbnail from '@/components/announcements/PdfThumbnail';

interface Announcement {
    id: number;
    title: string;
    importance: string;
    category: string;
    isRead: boolean;
    authorName: string;
    createdAt: string;
    attachments?: { name: string; url: string }[];
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
            {/* Featured Post (Latest) */}
            {!loading && presidentPosts.length > 0 && (
                <div className="relative bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-800 rounded-[32px] p-6 sm:p-10 text-white overflow-hidden shadow-2xl shadow-purple-200/50 group">
                    {/* Background Effects */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9InAiIHg9IjAiIHk9IjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNwKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-40" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row gap-8 lg:gap-12 items-center md:items-stretch">
                        {/* Hero Preview Image */}
                        <Link href={`/announcements/${presidentPosts[0].id}`} className="shrink-0 transition-transform duration-500 group-hover:scale-[1.02]">
                            <div className="w-48 h-64 sm:w-64 sm:h-88 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-5xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.4)] overflow-hidden relative">
                                {presidentPosts[0].attachments?.find(f => f.url.toLowerCase().endsWith('.pdf')) ? (
                                    <PdfThumbnail url={presidentPosts[0].attachments.find(f => f.url.toLowerCase().endsWith('.pdf'))!.url} className="w-full h-full" />
                                ) : (
                                    '📚'
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                            </div>
                        </Link>

                        {/* Content Area */}
                        <div className="flex-1 flex flex-col justify-between text-center md:text-left py-2">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 mb-6 mx-auto md:mx-0">
                                    <span className="w-2 h-2 bg-purple-300 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-100">Latest Issue</span>
                                </div>
                                <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4 drop-shadow-md">
                                    {presidentPosts[0].title}
                                </h2>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-purple-100/70 text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <span className="opacity-50 text-xs">執筆：</span>
                                        <span className="text-white">{presidentPosts[0].authorName}</span>
                                    </div>
                                    <div className="w-1 h-1 bg-white/20 rounded-full hidden md:block" />
                                    <div className="flex items-center gap-2">
                                        <span className="opacity-50 text-xs">発行：</span>
                                        <span className="text-white">{new Date(presidentPosts[0].createdAt).toLocaleDateString('ja-JP')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 md:mt-0 flex flex-col md:flex-row items-center gap-6">
                                <Link href={`/announcements/${presidentPosts[0].id}`} className="w-full md:w-auto px-10 py-4.5 bg-white text-purple-700 rounded-2xl font-black shadow-xl shadow-black/10 hover:bg-purple-50 transition-all active:scale-95 flex items-center justify-center gap-3 group/btn">
                                    <span>今すぐ読む</span>
                                    <svg className="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </Link>
                                <div className="flex items-center gap-2 text-purple-200/50">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Protected Archive</span>
                                </div>
                            </div>
                        </div>
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
                {/* Thumbnail / Avatar */}
                <div className={`w-14 h-20 sm:w-16 sm:h-24 rounded-lg flex items-center justify-center shrink-0 ${config.avatarBg} ${config.avatarText} font-bold text-sm shadow-sm overflow-hidden border border-gray-100`}>
                    {ann.attachments?.find(f => f.url.toLowerCase().endsWith('.pdf')) ? (
                        <PdfThumbnail url={ann.attachments.find(f => f.url.toLowerCase().endsWith('.pdf'))!.url} className="w-full h-full" />
                    ) : (
                        <span className="text-xl">{config.avatarIcon || ann.authorName.charAt(0)}</span>
                    )}
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
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        {ann.attachments?.some(f => f.url.toLowerCase().endsWith('.pdf')) && (
                             <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-red-100">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                PDF
                            </span>
                        )}
                        <p className={`text-sm ${!ann.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'} line-clamp-2`}>
                            {ann.title}
                        </p>
                    </div>
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
