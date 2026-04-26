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
            {!loading && presidentPosts.length > 0 && (
                <div className="relative bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-900 rounded-[40px] p-4 sm:p-10 text-white overflow-hidden shadow-2xl shadow-purple-200/50 group">
                    {/* Background Effects */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9InAiIHg9IjAiIHk9IjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNwKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-30" />
                    <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-full text-center mb-6">
                            <p className="text-[10px] font-black text-purple-200 uppercase tracking-[0.3em] mb-1 opacity-70">Latest Issue</p>
                            <h2 className="text-lg font-black tracking-tight">機関誌「きずな」最新号</h2>
                        </div>

                        {/* HUGE Preview Image (Taking about 60% of screen width/height) */}
                        <Link href={`/announcements/${presidentPosts[0].id}`} className="w-full flex justify-center mb-8 px-2">
                            <div className="relative group/cover transition-transform duration-700 hover:scale-[1.03]">
                                <div className="w-64 h-92 sm:w-80 sm:h-112 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-6xl border border-white/20 shadow-[0_30px_70px_rgba(0,0,0,0.5)] overflow-hidden">
                                    {presidentPosts[0].attachments?.find(f => f.url.toLowerCase().endsWith('.pdf')) ? (
                                        <PdfThumbnail url={presidentPosts[0].attachments.find(f => f.url.toLowerCase().endsWith('.pdf'))!.url} className="w-full h-full" />
                                    ) : (
                                        '📚'
                                    )}
                                </div>
                                {/* Glossy highlight */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
                            </div>
                        </Link>

                        {/* Text Content Area (Inside the bottom box like the screenshot) */}
                        <Link href={`/announcements/${presidentPosts[0].id}`} className="w-full max-w-lg">
                            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/20 hover:bg-white/15 transition-all shadow-inner relative overflow-hidden group/btn">
                                <div className="flex flex-col items-center text-center relative z-10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-[9px] font-black bg-red-500 text-white px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                                            PDF VERSION
                                        </span>
                                        {!presidentPosts[0].isRead && (
                                            <span className="text-[9px] font-black bg-white text-purple-700 px-2.5 py-0.5 rounded-full uppercase tracking-widest animate-pulse">NEW</span>
                                        )}
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl font-black mb-3 leading-tight uppercase tracking-tight">
                                        {presidentPosts[0].title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-purple-100/70 font-medium">
                                        <span>執筆 : {presidentPosts[0].authorName}</span>
                                        <span>·</span>
                                        <span>{new Date(presidentPosts[0].createdAt).toLocaleDateString('ja-JP')}発行</span>
                                    </div>

                                    <div className="mt-6 flex items-center gap-2 text-white font-bold text-sm bg-purple-600/50 px-6 py-3 rounded-2xl border border-white/10 group-hover/btn:bg-purple-600 transition-colors">
                                        <span>今すぐ読む</span>
                                        <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </div>
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
