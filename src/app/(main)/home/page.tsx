'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
    authorName: string;
    authorAvatarUrl?: string;
    coverImageUrl?: string;
    isRead: boolean;
    createdAt: string;
    likesCount: number;
    commentsCount: number;
    attachments?: { name: string; url: string }[];
    hasBookmarked: boolean;
}

interface Inquiry {
    id: number;
    title: string;
    status: string;
    updatedAt: string;
}

interface Comment {
    id: number;
    body: string;
    createdAt: string;
    userName: string;
    avatarUrl?: string;
}

interface LikeUser {
    id: number;
    name: string;
    avatarUrl?: string | null;
}

function LikeUserList({ users }: { users: LikeUser[] }) {
    if (users.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-2 mt-4 pb-4">
            <p className="w-full text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">いいねしたユーザー</p>
            {users.map(u => (
                <div key={u.id} title={u.name} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-2 py-1 rounded-full">
                    <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center text-[10px] font-bold text-pink-600 overflow-hidden">
                        {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" /> : u.name.charAt(0)}
                    </div>
                    <span className="text-[10px] font-bold text-gray-600">{u.name}</span>
                </div>
            ))}
        </div>
    );
}


function AnnouncementModal({ annId, onClose }: { annId: number, onClose: () => void }) {
    const { user } = useAuth();
    const [ann, setAnn] = useState<Announcement | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [likeUsers, setLikeUsers] = useState<LikeUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [liking, setLiking] = useState(false);

    const loadData = async () => {
        try {
            const [annRes, commRes, likesRes] = await Promise.all([
                fetch(`/api/announcements/${annId}`).then(r => r.json()),
                fetch(`/api/announcements/${annId}/comments`).then(r => r.json()),
                fetch(`/api/announcements/${annId}/likes`).then(r => r.json())
            ]);
            if (annRes.data) setAnn(annRes.data);
            if (commRes.data) setComments(commRes.data);
            if (likesRes.data) setLikeUsers(likesRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [annId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!ann || liking) return;
        setLiking(true);
        const res = await fetch(`/api/announcements/${annId}/like`, { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            setAnn(prev => prev ? {
                ...prev,
                likesCount: prev.likesCount + (data.liked ? 1 : -1)
            } : null);
            // Refresh like users list
            const likesRes = await fetch(`/api/announcements/${annId}/likes`).then(r => r.json());
            if (likesRes.data) setLikeUsers(likesRes.data);
        }
        setLiking(false);
    };

    const handleBookmark = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!ann) return;
        const res = await fetch(`/api/announcements/${annId}/bookmark`, { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            setAnn(prev => prev ? { ...prev, hasBookmarked: data.bookmarked } : null);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || submitting) return;
        setSubmitting(true);
        const res = await fetch(`/api/announcements/${annId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body: newComment })
        });
        if (res.ok) {
            setNewComment('');
            const commRes = await fetch(`/api/announcements/${annId}/comments`).then(r => r.json());
            if (commRes.data) setComments(commRes.data);
            setAnn(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
        }
        setSubmitting(false);
    };

    if (!annId) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-gray-500 hover:bg-black/10 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {loading ? (
                    <div className="p-12 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : ann ? (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex-1 overflow-y-auto scrollbar-hide">
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 uppercase overflow-hidden">
                                        {ann.authorName.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-bold text-gray-900 text-sm leading-none">{ann.authorName}</p>
                                            {ann.isRead && (
                                                (user?.role === 'HQ_ADMIN' || user?.role === 'STORE_ADMIN') ? (
                                                    <Link 
                                                        href={`/admin/announcements/${ann.id}/stats`}
                                                        className="text-[10px] font-bold text-green-600 bg-green-50 hover:bg-green-100 px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm transition-colors"
                                                        title="既読状況を確認"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                        既読
                                                    </Link>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                        既読
                                                    </span>
                                                )
                                            )}
                                        </div>
                                        <p className="text-[11px] text-gray-400 font-medium tracking-wide">
                                            {new Date(ann.createdAt).toLocaleDateString('ja-JP')} · {new Date(ann.createdAt).toLocaleTimeString('ja-JP', {hour:'2-digit', minute:'2-digit'})} ({getRelativeTime(ann.createdAt)})
                                        </p>
                                    </div>
                                </div>

                                <h2 className="text-xl font-black text-gray-900 leading-snug mb-4 tracking-tight">{ann.title}</h2>

                                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap mb-8">
                                    {ann.body}
                                </div>

                                {/* Image Gallery in Modal */}
                                {(() => {
                                    const atts = ann.attachments || [];
                                    const galleryImages = [ann.coverImageUrl, ...atts.filter(f => isImage(f.url) && f.url !== ann.coverImageUrl).map(f => f.url)].filter(Boolean) as string[];
                                    return <TimelineGallery images={galleryImages} annId={ann.id} isModal={true} />;
                                })()}

                                {/* File Attachments (Non-images) */}
                                {ann.attachments && ann.attachments.filter(f => !isImage(f.url)).length > 0 && (
                                    <div className="mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">添付資料</p>
                                        {ann.attachments.filter(f => !isImage(f.url)).map((file, idx) => (
                                            <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100 hover:border-orange-200 transition-colors group">
                                                <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                <span className="text-xs font-bold text-gray-600 truncate group-hover:text-orange-700">{file.name}</span>
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {/* Like Button in Modal */}
                                <div className="flex items-center gap-6 py-4 border-t border-b border-gray-50 text-gray-500">
                                    <button onClick={handleLike} disabled={liking} className="flex items-center gap-2 hover:text-red-500 transition-colors group">
                                        <div className={`p-2 rounded-full group-hover:bg-red-50 transition-colors`}>
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                        </div>
                                        <span className="text-xs font-bold leading-none">{ann.likesCount} いいね</span>
                                    </button>
                                    <button onClick={handleBookmark} className={`flex items-center gap-2 transition-colors group ${ann.hasBookmarked ? 'text-orange-500' : 'hover:text-orange-500'}`}>
                                        <div className={`p-2 rounded-full ${ann.hasBookmarked ? 'bg-orange-50' : 'group-hover:bg-orange-50'} transition-colors`}>
                                            <svg className="w-6 h-6" fill={ann.hasBookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-bold leading-none">{ann.hasBookmarked ? 'しおり中' : 'しおり'}</span>
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-full">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                        </div>
                                        <span className="text-xs font-bold leading-none">{ann.commentsCount} コメント</span>
                                    </div>
                                </div>

                                {/* Like Users List */}
                                <LikeUserList users={likeUsers} />

                                {/* Comments Section */}
                                <div className="mt-6 space-y-4">
                                    <h3 className="text-sm font-bold text-gray-900 border-l-4 border-blue-500 pl-3">コメント ({ann.commentsCount})</h3>
                                    <div className="space-y-4 divide-y divide-gray-50">
                                        {comments.length === 0 ? (
                                            <p className="text-xs text-center text-gray-400 py-6">まだコメントはありません</p>
                                        ) : (
                                            comments.map(c => (
                                                <div key={c.id} className="flex gap-3 pt-4">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-xs font-bold text-gray-400">
                                                        {c.avatarUrl ? <img src={c.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" /> : c.userName.charAt(0)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-bold text-xs text-gray-900">{c.userName}</span>
                                                            <span className="text-[10px] text-gray-400 font-medium">{getRelativeTime(c.createdAt)}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600 leading-normal">{c.body}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Comment Input */}
                        <form onSubmit={handleCommentSubmit} className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                            <input
                                type="text"
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="コメントを送る..."
                                className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                            />
                            <button
                                type="submit"
                                disabled={!newComment.trim() || submitting}
                                className="bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-sm disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/10 active:scale-95 transform"
                            >
                                送信
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="p-12 text-center text-gray-400">エラーが発生しました</div>
                )}
            </div>
        </div>
    );
}

export default function HomePage() {
    const { user, loading: authLoading } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewAnnId, setPreviewAnnId] = useState<number | null>(null);
    const [unreadTotal, setUnreadTotal] = useState(0);
    const [recentFormSubmissions, setRecentFormSubmissions] = useState<any[]>([]);
    const [recentInquiriesList, setRecentInquiriesList] = useState<any[]>([]);
    const [isAdminSubmissionsLoading, setIsAdminSubmissionsLoading] = useState(false);



    const fetchStats = useCallback(async () => {
        if (!user) return;
        const [annData, inqData] = await Promise.all([
            fetch('/api/announcements?limit=5').then((r) => r.json()),
            fetch('/api/inquiries?limit=5').then((r) => r.json()),
        ]);
        setAnnouncements(annData.data ?? []);
        setUnreadTotal(annData.unreadCount ?? 0);
        setInquiries(inqData.data ?? []);
        
        // Fetch admin submissions and inquiries if applicable
        if (user.role === 'HQ_ADMIN' || user.role === 'STORE_ADMIN') {
            setIsAdminSubmissionsLoading(true);
            fetch('/api/admin/stats')
                .then(r => r.json())
                .then(data => {
                    if (data.recentFormSubmissions) {
                        setRecentFormSubmissions(data.recentFormSubmissions);
                    }
                    if (data.recentInquiriesList) {
                        setRecentInquiriesList(data.recentInquiriesList);
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setIsAdminSubmissionsLoading(false));
        }


        setLoading(false);
    }, [user]);

    const handleUpdateStatus = async (responseId: number, status: string) => {
        try {
            const res = await fetch(`/api/admin/menu/responses/${responseId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                // Refresh
                fetchStats();
            }
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const handleCardBookmark = async (e: React.MouseEvent, annId: number) => {
        e.preventDefault();
        e.stopPropagation();
        const res = await fetch(`/api/announcements/${annId}/bookmark`, { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            setAnnouncements(prev => prev.map(a => a.id === annId ? { ...a, hasBookmarked: data.bookmarked } : a));
        }
    };

    useEffect(() => {
        fetchStats();
        // Refresh stats when user returns to this tab or window
        window.addEventListener('focus', fetchStats);
        return () => window.removeEventListener('focus', fetchStats);
    }, [fetchStats]);

    const unread = unreadTotal;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'おはようございます' : hour < 18 ? 'こんにちは' : 'お疲れ様です';

    const statusColors: Record<string, string> = {
        OPEN: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50 shadow-sm shadow-emerald-100',
        IN_PROGRESS: 'bg-amber-50 text-amber-700 border border-emerald-200/50 shadow-sm shadow-amber-100',
        CLOSED: 'bg-zinc-100/80 text-zinc-500 border border-zinc-200/50',
    };
    const statusLabels: Record<string, string> = {
        OPEN: '未対応', IN_PROGRESS: '対応中', CLOSED: 'クローズ'
    };

    if (loading || authLoading) {
        return (
            <div className="space-y-5 animate-pulse pt-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="card-premium p-6">
                        <div className="h-4 bg-zinc-100 rounded-lg w-3/4 mb-4" />
                        <div className="h-3 bg-zinc-50 rounded-lg w-1/2" />
                    </div>
                ))}
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="space-y-8 pb-4">
            {/* Greeting Card Premium */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-slide-up relative">
                <div className="md:col-span-12 p-6 flex flex-col justify-center">
                    <div className="space-y-1">
                        <p className="text-gray-500 text-sm font-bold">{greeting} 👋</p>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xl font-bold text-gray-900">{user?.name} さん</h2>
                            {(user.role === 'STORE_ADMIN' || user.role === 'HQ_ADMIN') && (
                                <a
                                    href="/admin"
                                    className="inline-flex items-center gap-1 bg-blue-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    管理画面
                                </a>
                            )}
                        </div>
                        <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider mt-1">
                            {user.groupName && user.storeName ? `${user.groupName} ${user.storeName}` : (user.storeName ?? '本部')}
                        </p>
                    </div>

                    {unread > 0 && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded px-3 py-1.5 text-[11px] text-blue-600 font-bold shadow-sm w-fit">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            未読のお知らせが{unread}件あります
                        </div>
                    )}
                </div>
            </div>

            {/* Admin: Recent Form Submissions at the Top of Home Page */}
            {(user.role === 'HQ_ADMIN' || user.role === 'STORE_ADMIN') && recentFormSubmissions.length > 0 && (
                <div className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-black text-zinc-900 tracking-tight">新着の申請</h2>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {recentFormSubmissions.map((sub) => (
                            <div key={sub.id} className="bg-white rounded-2xl border border-zinc-100 p-5 hover:border-indigo-200 transition-all hover:shadow-md cursor-default flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
                                {/* Left: User Info & Meta */}
                                <div className="lg:w-64 shrink-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded uppercase tracking-tighter">
                                            {sub.widgetTitle}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 font-medium">
                                            {new Date(sub.createdAt).toLocaleDateString('ja-JP')} · {new Date(sub.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="flex items-baseline gap-2">
                                            <h4 className="text-base font-bold text-zinc-900 leading-tight">{sub.userName}</h4>
                                            <span className="text-[10px] text-zinc-400 font-bold whitespace-nowrap">社番: {sub.employeeNumber}</span>
                                        </div>
                                        <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1 mt-0.5">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                            {sub.storeName || '本部'}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Center: Form Data */}
                                <div className="flex-1 bg-zinc-50/50 p-4 rounded-xl border border-zinc-50 flex flex-wrap gap-x-8 gap-y-3">
                                     {Object.entries(sub.responseJson).map(([id, value]) => {
                                         const field = sub.widgetConfig?.fields?.find((f: any) => f.id === id);
                                         const label = field?.label || '未設定';
                                         const isCounter = field?.type === 'number';
                                         
                                         return (
                                             <div key={id} className="min-w-[100px]">
                                                 <span className="text-[10px] font-bold text-zinc-400 block mb-0.5">{label}</span>
                                                 <span className="text-sm font-bold text-zinc-700">
                                                     {typeof value === 'object' && value !== null ? (value as any).name || 'データ' : `${value}${isCounter ? '枚' : ''}`}
                                                 </span>
                                             </div>
                                         );
                                     })}
                                </div>

                                {/* Right: Action */}
                                <div className="lg:w-44 shrink-0">
                                    <button 
                                        onClick={() => handleUpdateStatus(sub.id, 'PROCESSED')}
                                        className="w-full py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                        完了にする
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Admin: Recent Inquiries at the Top of Home Page */}
            {(user.role === 'HQ_ADMIN' || user.role === 'STORE_ADMIN') && recentInquiriesList.length > 0 && (
                <div className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm overflow-hidden animate-slide-up" style={{ animationDelay: '0.15s' }}>
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-black text-zinc-900 tracking-tight">未対応の相談メール</h2>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {recentInquiriesList.map((inq) => (
                            <Link key={inq.id} href={`/inquiries/${inq.id}`} className="bg-white rounded-2xl border border-zinc-100 p-5 hover:border-amber-400 transition-all hover:shadow-md cursor-pointer flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8 group">
                                <div className="lg:w-64 shrink-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${statusColors[inq.status] ?? 'bg-gray-100 text-gray-500'}`}>
                                            {statusLabels[inq.status] ?? inq.status}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap">
                                            {new Date(inq.created_at).toLocaleDateString('ja-JP')} · {new Date(inq.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <h4 className="text-base font-bold text-zinc-900 group-hover:text-amber-600 transition-colors leading-tight">{inq.user_name}</h4>
                                        <span className="text-[10px] text-zinc-400 font-bold whitespace-nowrap">({inq.employee_number})</span>
                                        <p className="text-[10px] font-bold text-zinc-400">{inq.store_name || '本部'}</p>
                                    </div>
                                </div>
                                
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-zinc-700 leading-snug line-clamp-1">{inq.title}</p>
                                </div>

                                <div className="lg:w-44 shrink-0 text-right">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 group-hover:underline">
                                        詳細を確認する
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Announcements (Timeline Card Style) */}
            <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-end justify-between mb-4 px-1">
                    <h3 className="font-bold text-gray-800 text-sm">最新のお知らせ</h3>
                    <Link href="/announcements" className="text-xs text-blue-500 font-bold hover:underline transition-colors flex items-center gap-1">
                        すべて見る &gt;
                    </Link>
                </div>
                <div className="space-y-4">
                    {announcements.length === 0 ? (
                        <div className="text-center py-10 bg-white border border-dashed rounded text-gray-400 text-sm font-bold">
                            お知らせはありません
                        </div>
                    ) : (
                        announcements.slice(0, 3).map((ann) => {
                            const imageUrl = ann.coverImageUrl;

                            return (
                                <div key={ann.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4 relative">
                                    {/* Header */}
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl shrink-0">
                                                📚
                                            </div>
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                                                {ann.authorAvatarUrl ? <img src={ann.authorAvatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : ann.authorName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-sm text-gray-900">{ann.authorName}</p>
                                                    {!ann.isRead && (
                                                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">NEW</span>
                                                    )}
                                                    {ann.isRead && (
                                                        (user?.role === 'HQ_ADMIN' || user?.role === 'STORE_ADMIN') ? (
                                                            <Link 
                                                                href={`/admin/announcements/${ann.id}/stats`}
                                                                className="text-[10px] font-bold text-green-600 bg-green-50 hover:bg-green-100 px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm transition-colors"
                                                                title="既読状況を確認"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                                既読
                                                            </Link>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                                既読
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-gray-500 mt-0.5">
                                                    {new Date(ann.createdAt).toLocaleDateString('ja-JP')} {new Date(ann.createdAt).toLocaleTimeString('ja-JP', {hour: '2-digit', minute:'2-digit'})} ({getRelativeTime(ann.createdAt)})
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => handleCardBookmark(e, ann.id)}
                                            className={`p-2 rounded-full transition-all active:scale-90 ${ann.hasBookmarked ? 'text-orange-500 bg-orange-50' : 'text-gray-300 hover:bg-gray-50 hover:text-orange-400'}`}
                                            title={ann.hasBookmarked ? "しおりを外す" : "しおりを挟む"}
                                        >
                                            <svg className="w-5 h-5" fill={ann.hasBookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Action Header */}
                                    <div className="px-4 pb-3">
                                        <Link href={`/announcements/${ann.id}`} className="text-sm font-bold text-[#0096C7] hover:underline transition-colors flex items-center gap-1.5 flex-wrap">
                                            {ann.category === 'PRESIDENT' && (
                                                <span className="bg-purple-100 text-purple-700 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded shrink-0">📚 機関誌「きずな」</span>
                                            )}
                                            {ann.category === 'MUST_READ' && (
                                                <span className="bg-red-100 text-red-700 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded shrink-0">🔴 必読</span>
                                            )}
                                            {ann.importance === 'IMPORTANT' && (
                                                <span className="bg-[#E63946] text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded shrink-0">重要</span>
                                            )}
                                            {ann.title}
                                        </Link>
                                    </div>

                                    {/* Content Preview */}
                                    <div className="px-4 pb-2">
                                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                                            {ann.body}
                                        </p>
                                    </div>
                                    <div className="px-4 pb-4">
                                        <Link href={`/announcements/${ann.id}`} className="text-[13px] text-[#0096C7] font-bold hover:underline">
                                            もっと見る
                                        </Link>
                                    </div>

                                    {/* Hero Image / Gallery */}
                                    {(() => {
                                        const atts = ann.attachments || [];
                                        const galleryImages = [imageUrl, ...atts.filter(f => isImage(f.url) && f.url !== imageUrl).map(f => f.url)].filter(Boolean) as string[];
                                        return <TimelineGallery images={galleryImages} annId={ann.id} />;
                                    })()}

                                    {/* Reaction Footer */}
                                    <div className="p-3 border-t border-gray-100 flex items-center gap-4 text-gray-500">
                                        <button 
                                            onClick={() => setPreviewAnnId(ann.id)}
                                            className="flex items-center gap-1.5 cursor-pointer hover:text-red-500 transition-colors outline-none"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                            <span className="text-xs font-bold">{ann.likesCount}</span>
                                        </button>
                                        <button 
                                            onClick={() => setPreviewAnnId(ann.id)}
                                            className="flex items-center gap-1.5 cursor-pointer hover:text-blue-500 transition-colors outline-none"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                            <span className="text-xs font-bold">{ann.commentsCount}</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            {/* Recent Inquiries */}
            <section className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-end justify-between mb-3 px-1">
                    <h3 className="font-bold text-gray-800 text-sm">メール状況</h3>
                    <Link href="/inquiries" className="text-xs text-blue-500 font-bold hover:underline transition-colors flex items-center gap-1">
                        すべて見る &gt;
                    </Link>
                </div>
                <div className="space-y-3">
                    {inquiries.length === 0 ? (
                        <div className="text-center py-10 bg-white border border-dashed rounded text-gray-400 text-sm font-bold">
                            メールはありません
                        </div>
                    ) : (
                        inquiries.slice(0, 3).map((inq) => (
                            <Link key={inq.id} href={`/inquiries/${inq.id}`}>
                                <div className="bg-white border rounded p-4 group hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-gray-800 truncate">{inq.title}</p>
                                            <p className="text-xs text-gray-500 mt-1.5">
                                                更新: {getRelativeTime(inq.updatedAt)}
                                            </p>
                                        </div>
                                        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded ${statusColors[inq.status] ?? 'bg-gray-100 text-gray-500'}`}>
                                            {statusLabels[inq.status] ?? inq.status}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </section>

            {previewAnnId && (
                <AnnouncementModal annId={previewAnnId} onClose={() => {
                    setPreviewAnnId(null);
                    fetchStats();
                    window.location.reload(); // Ensure Link navigation works after modal closure
                }} />
            )}
        </div>
    );
}
