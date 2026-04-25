'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { getRelativeTime } from '@/lib/date';
import TimelineGallery, { isImage } from '@/components/TimelineGallery';

interface Announcement {
    id: number;
    title: string;
    body: string;
    importance: string;
    category: string;
    coverImageUrl?: string;
    authorName: string;
    createdAt: string;
    isRead: boolean;
    likesCount: number;
    hasLiked: boolean;
    attachments?: { name: string; url: string }[];
    commentsCount: number;
    widgetIds?: number[];
    hasBookmarked: boolean;
}

interface Widget {
    id: number;
    title: string;
    type: string;
    size: 'S' | 'M' | 'L';
    configJson?: any;
}

interface Comment {
    id: number;
    body: string;
    createdAt: string;
    userName: string;
    userRole: string;
    avatarUrl?: string;
}

const categoryStyles: Record<string, { headerBg: string; badge: string; badgeColor: string; icon: string; readBtnColor: string; readBtnShadow: string }> = {
    PRESIDENT: {
        headerBg: 'bg-gradient-to-r from-purple-600 to-indigo-600',
        badge: '機関誌「きずな」',
        badgeColor: 'bg-purple-100 text-purple-700',
        icon: '📚',
        readBtnColor: 'bg-purple-600 hover:bg-purple-700',
        readBtnShadow: 'shadow-purple-200',
    },
    MUST_READ: {
        headerBg: 'bg-gradient-to-r from-red-600 to-rose-600',
        badge: '必読',
        badgeColor: 'bg-red-100 text-red-700',
        icon: '🔴',
        readBtnColor: 'bg-red-600 hover:bg-red-700',
        readBtnShadow: 'shadow-red-200',
    },
    GENERAL: {
        headerBg: '',
        badge: '',
        badgeColor: '',
        icon: '',
        readBtnColor: 'bg-orange-600 hover:bg-orange-700',
        readBtnShadow: 'shadow-orange-200',
    },
};



export default function AnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { user } = useAuth();
    const { id } = use(params);
    const [ann, setAnn] = useState<Announcement | null>(null);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [liking, setLiking] = useState(false);
    const [widgets, setWidgets] = useState<Widget[]>([]);

    const loadComments = async () => {
        const res = await fetch(`/api/announcements/${id}/comments`);
        const data = await res.json();
        if (data.data) setComments(data.data);
    };

    useEffect(() => {
        fetch(`/api/announcements/${id}`)
            .then((r) => r.json())
            .then(async (d) => {
                if (d.data) {
                    setAnn(d.data);
                    if (d.data.widgetIds?.length > 0) {
                        const wRes = await fetch(`/api/menu?all=true`);
                        const wData = await wRes.json();
                        if (wData.data?.widgets) {
                            const filtered = wData.data.widgets.filter((w: any) => d.data.widgetIds.includes(w.id));
                            setWidgets(filtered);
                        }
                    }
                }
            })
            .then(loadComments)
            .finally(() => setLoading(false));
    }, [id]);

    const handleLike = async () => {
        if (!ann || liking) return;
        setLiking(true);
        const res = await fetch(`/api/announcements/${id}/like`, { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            setAnn(prev => prev ? {
                ...prev,
                hasLiked: data.liked,
                likesCount: prev.likesCount + (data.liked ? 1 : -1)
            } : null);
        }
        setLiking(false);
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || submittingComment) return;
        setSubmittingComment(true);
        const res = await fetch(`/api/announcements/${id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body: newComment })
        });
        if (res.ok) {
            setNewComment('');
            await loadComments();
            setAnn(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
        }
        setSubmittingComment(false);
    };

    const handleBookmark = async () => {
        if (!ann) return;
        const res = await fetch(`/api/announcements/${id}/bookmark`, { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            setAnn(prev => prev ? { ...prev, hasBookmarked: data.bookmarked } : null);
        }
    };



    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/4" />
                <div className="space-y-2 mt-4">
                    {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-4 bg-gray-100 rounded" />)}
                </div>
            </div>
        );
    }

    if (!ann) return <div className="text-center text-gray-400 py-8">お知らせが見つかりません</div>;

    const style = categoryStyles[ann.category] ?? categoryStyles['GENERAL'];
    const isSpecial = ann.category === 'PRESIDENT' || ann.category === 'MUST_READ';

    return (
        <div className="space-y-4">
            <Link href="/announcements" className="inline-flex items-center gap-1 text-sm text-orange-600 font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                お知らせ一覧
            </Link>

            {/* Special Category Header */}
            {isSpecial && (
                <div className={`${style.headerBg} rounded-2xl p-5 text-white`}>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl border border-white/20 shadow-inner">
                            {style.icon}
                        </div>
                        <div>
                            <p className="text-xs font-medium text-white/70 uppercase tracking-widest">{style.badge}</p>
                            <p className="text-lg font-bold">{ann.authorName}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        {ann.importance === 'IMPORTANT' && (
                            <span className="inline-block bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">🔴 重要</span>
                        )}
                        {style.badge && (
                            <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${style.badgeColor}`}>
                                {style.icon} {style.badge}
                            </span>
                        )}
                    </div>
                    
                    <button
                        onClick={handleBookmark}
                        className={`p-2 rounded-full transition-all active:scale-90 ${ann.hasBookmarked ? 'text-orange-500 bg-orange-50' : 'text-gray-300 hover:bg-gray-50 hover:text-orange-400'}`}
                        title={ann.hasBookmarked ? "しおりを外す" : "しおりを挟む"}
                    >
                        <svg className="w-5 h-5" fill={ann.hasBookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </button>
                </div>

                <h1 className="text-xl font-bold text-gray-900 mb-2">{ann.title}</h1>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
                    <span>{ann.authorName}</span>
                    <span>·</span>
                    <span>{new Date(ann.createdAt).toLocaleDateString('ja-JP')} ({getRelativeTime(ann.createdAt)})</span>
                    {ann.isRead && (
                        (user?.role === 'HQ_ADMIN' || user?.role === 'STORE_ADMIN') ? (
                            <Link 
                                href={`/admin/announcements/${ann.id}/stats`}
                                className="text-[10px] font-bold text-green-600 bg-green-50 hover:bg-green-100 px-1.5 py-0.5 rounded flex items-center gap-0.5 ml-1 shadow-sm transition-colors"
                                title="既読状況を確認"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                既読
                            </Link>
                        ) : (
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-0.5 ml-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                既読
                            </span>
                        )
                    )}
                </div>

                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap mb-8">
                    {ann.body}
                </div>

                {/* PDF Viewer for Newsletters/Announcements with PDF */}
                {(() => {
                    const pdf = ann.attachments?.find(f => f.url.toLowerCase().endsWith('.pdf'));
                    if (!pdf) return null;
                    return (
                        <div className="mb-10 rounded-3xl overflow-hidden border border-gray-100 shadow-2xl bg-gray-900/5 ring-1 ring-black/5">
                            <div className="bg-gray-900 p-4 flex items-center justify-between text-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center shadow-lg">
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    </div>
                                    <div className="overflow-hidden">
                                        <span className="text-sm font-black truncate block">{pdf.name}</span>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">PDF Document Viewer</p>
                                    </div>
                                </div>
                                <a 
                                    href={pdf.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-xs font-black border border-white/10 flex items-center gap-2"
                                >
                                    <span>全画面表示</span>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                </a>
                            </div>
                            <div className="relative aspect-[1/1.414] w-full bg-white sm:h-[1000px]">
                                <iframe 
                                    src={`${pdf.url}#toolbar=0&navpanes=0`} 
                                    className="absolute inset-0 w-full h-full border-none"
                                    title="PDF Viewer"
                                />
                            </div>
                        </div>
                    );
                })()}

                {/* Display Menu Tiles */}
                {widgets.length > 0 && (
                    <div className="mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            関連メニュー
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {widgets.map(widget => (
                                <Link 
                                    key={widget.id} 
                                    href={`/menu/widget/${widget.id}`}
                                    className="flex items-center gap-3 p-3 bg-white hover:bg-orange-50 border border-gray-100 hover:border-orange-200 rounded-2xl transition-all shadow-sm group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0 group-hover:scale-105 transition-transform">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-bold text-gray-800 truncate">{widget.title}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">タップして開く</p>
                                    </div>
                                    <svg className="w-4 h-4 text-gray-300 group-hover:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Gallery */}
                {(() => {
                    const atts = ann.attachments || [];
                    const galleryImages = [ann.coverImageUrl, ...atts.filter(f => isImage(f.url) && f.url !== ann.coverImageUrl).map(f => f.url)].filter(Boolean) as string[];
                    if (galleryImages.length === 0) return null;
                    return (
                        <div className="mb-6 -mx-5 px-5 sm:mx-0 sm:px-0">
                            <TimelineGallery images={galleryImages} annId={ann.id} isModal={true} />
                        </div>
                    );
                })()}

                {/* Attachments Section (Non-images) */}
                {ann.attachments && ann.attachments.filter(f => !isImage(f.url)).length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                            添付ファイル
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {ann.attachments.filter(f => !isImage(f.url)).map((file, idx) => (
                                <a
                                    key={idx}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-orange-50 border border-gray-100 hover:border-orange-200 rounded-xl transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-orange-500 transition-colors">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-bold text-gray-700 truncate group-hover:text-orange-700">{file.name}</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{file.url.split('.').pop()} FILE</p>
                                    </div>
                                    <svg className="w-4 h-4 text-gray-300 group-hover:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleLike}
                            disabled={liking}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors ${ann.hasLiked ? 'text-pink-600 bg-pink-50 hover:bg-pink-100' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <svg className="w-5 h-5" fill={ann.hasLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={ann.hasLiked ? 0 : 2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span className="font-bold text-sm">{ann.likesCount > 0 ? ann.likesCount : 'いいね'}</span>
                        </button>
                        <div className="flex items-center gap-1.5 text-gray-500 text-sm px-2 py-1.5">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="font-bold">{ann.commentsCount > 0 ? ann.commentsCount : 'コメント'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-6 space-y-5">
                <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-3">コメント ({ann.commentsCount})</h3>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">まだコメントはありません。一番乗りでコメントしてみましょう！</p>
                    ) : (
                        comments.map(c => (
                            <div key={c.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden text-xs font-bold text-gray-400">
                                    {c.avatarUrl ? <img src={c.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : c.userName.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-bold text-sm text-gray-800">{c.userName}</span>
                                        <span className="text-[10px] text-gray-400">{getRelativeTime(c.createdAt)}</span>
                                    </div>
                                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{c.body}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <form onSubmit={handleCommentSubmit} className="pt-3 border-t border-gray-100 flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="コメントを入力..."
                        className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm text-gray-900"
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim() || submittingComment}
                        className="px-4 py-2 bg-[#1877F2] hover:bg-blue-600 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50"
                    >
                        送信
                    </button>
                </form>
            </div>

        </div>
    );
}
