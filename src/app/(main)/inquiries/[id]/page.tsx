'use client';

import { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
    id: number;
    authorId: number;
    authorName: string;
    authorRole: string;
    body: string;
    createdAt: string;
}

interface InquiryDetail {
    id: number;
    title: string;
    destination: string;
    category: string;
    status: string;
    authorId: number;
    authorName: string;
    storeName: string | null;
    storeGroupName: string | null;
    assigneeName: string | null;
    messages: Message[];
}

const statusColors: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    CLOSED: 'bg-gray-100 text-gray-500',
};
const statusLabels: Record<string, string> = {
    OPEN: '未対応', IN_PROGRESS: '対応中', CLOSED: 'クローズ'
};

export default function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user, refreshUnreadCount } = useAuth();
    const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const load = async () => {
        const res = await fetch(`/api/inquiries/${id}`);
        const data = await res.json();
        if (data.data) {
            setInquiry(data.data);
            // Mark as read when opened
            await fetch(`/api/inquiries/${id}/read`, { method: 'POST' });
            if (refreshUnreadCount) refreshUnreadCount();
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [inquiry?.messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reply.trim()) return;
        setSending(true);
        await fetch(`/api/inquiries/${id}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body: reply }),
        });
        setReply('');
        await load();
        setSending(false);
    };

    if (loading) return <div className="animate-pulse space-y-3 pt-4">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-200 rounded-2xl" />)}</div>;
    if (!inquiry) return <div className="text-center text-gray-400 py-8">メールが見つかりません</div>;

    const isClosed = inquiry.status === 'CLOSED';
    const isAdmin = user?.role === 'STORE_ADMIN' || user?.role === 'HQ_ADMIN';

    return (
        <div className="flex flex-col h-[calc(100vh-14rem)] -mx-4 lg:-mx-0">
            {/* Header */}
            <div className="mb-3">
                <Link href="/inquiries" className="inline-flex items-center gap-1 text-sm text-zinc-600 font-medium mb-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    メール一覧
                </Link>
                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <h1 className="font-bold text-gray-900">{inquiry.title}</h1>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-gray-400">
                                <span className="text-gray-600 font-medium">{inquiry.authorName}</span>
                                <span className="text-gray-300">|</span>
                                <span>{inquiry.storeGroupName ?? '-'}</span>
                                <span className="text-gray-300">·</span>
                                <span>{inquiry.storeName ?? '-'}</span>
                                <span className="text-gray-300">|</span>
                                <span>{inquiry.category}</span>
                                <span className="text-gray-300">·</span>
                                <span>{inquiry.destination === 'STORE' ? '店舗へ' : '本部へ'}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[inquiry.status]}`}>
                                {statusLabels[inquiry.status]}
                            </span>
                            {isAdmin && !isClosed && (
                                <button
                                    onClick={async () => {
                                        await fetch(`/api/inquiries/${id}/status`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: 'CLOSED' }),
                                        });
                                        await load();
                                    }}
                                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    クローズ
                                </button>
                            )}
                            {(isAdmin || inquiry.authorId === user?.id) && (
                                <button
                                    onClick={async () => {
                                        if (!confirm('このメールを削除してもよろしいですか？')) return;
                                        const res = await fetch(`/api/inquiries/${id}`, { method: 'DELETE' });
                                        if (res.ok) {
                                            router.push('/inquiries');
                                        } else {
                                            alert('削除に失敗しました');
                                        }
                                    }}
                                    className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                >
                                    削除
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area - LINE Style Background */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-[#7494c0] rounded-t-2xl lg:rounded-2xl shadow-inner divide-y-0">
                {inquiry.messages.map((msg) => {
                    const isMe = msg.authorId === user?.id;
                    const isAdminMsg = msg.authorRole === 'STORE_ADMIN' || msg.authorRole === 'HQ_ADMIN';
                    return (
                        <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                            {/* Avatar (only for others) */}
                            {!isMe && (
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-sm ${isAdminMsg ? 'bg-orange-100 text-orange-700' : 'bg-white text-gray-400'
                                    }`}>
                                    {msg.authorName.charAt(0)}
                                </div>
                            )}
                            <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                                {!isMe && <p className="text-[10px] font-bold text-white/80 px-1 mb-0.5 drop-shadow-sm">{msg.authorName}</p>}
                                <div className="flex items-end gap-1.5 shrink-0">
                                    {isMe && (
                                        <span className="text-[9px] text-white/70 font-bold mb-1 order-1">
                                            {new Date(msg.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                    <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm relative ${isMe
                                            ? 'bg-[#85E249] text-gray-900 rounded-tr-none'
                                            : 'bg-white text-gray-900 rounded-tl-none'
                                        } order-2`}>
                                        {msg.body}
                                    </div>
                                    {!isMe && (
                                        <span className="text-[9px] text-white/70 font-bold mb-1 order-3">
                                            {new Date(msg.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Reply form */}
            {isClosed ? (
                <div className="py-3 text-center text-sm text-gray-400 border-t border-gray-100">
                    このメールはクローズされました
                </div>
            ) : (
                <form onSubmit={handleSend} className="bg-white p-3 lg:rounded-b-2xl border-t border-gray-100 flex gap-2">
                    <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="メッセージを入力..."
                        rows={1}
                        className="flex-1 px-3 py-2 bg-gray-50 border-none rounded-2xl focus:outline-none focus:ring-0 text-sm resize-none text-gray-900 placeholder:text-gray-400"
                    />
                    <button
                        type="submit"
                        disabled={sending || !reply.trim()}
                        className="p-2 text-blue-500 disabled:opacity-40 transition-colors self-end"
                    >
                        <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                </form>
            )}
        </div>
    );
}
