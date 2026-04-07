'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

interface UserDetail {
    id: number;
    employeeNumber: string;
    name: string;
    storeName: string | null;
    readAt?: string;
}

interface Stats {
    title: string;
    readCount: number;
    totalEligible: number;
    readUsers: UserDetail[];
    unreadUsers: UserDetail[];
}

export default function AnnouncementStatsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showReadList, setShowReadList] = useState(false);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/announcements/${id}/stats`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'データの取得に失敗しました');
            if (data.data) setStats(data.data);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [id]);

    if (loading) return <div className="space-y-4 animate-pulse"><div className="h-8 bg-gray-200 rounded w-1/4" /><div className="h-32 bg-gray-100 rounded-2xl" /></div>;
    
    if (error) return (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-10 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">⚠️</div>
            <div>
                <h3 className="text-lg font-bold text-gray-900">エラーが発生しました</h3>
                <p className="text-sm text-gray-500 mt-1">{error}</p>
            </div>
            <button 
                onClick={() => load()}
                className="mt-4 px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
            >
                再試行する
            </button>
        </div>
    );

    if (!stats) return <div className="text-gray-400 text-center py-8">データが見つかりません</div>;

    const rate = stats.totalEligible > 0 ? Math.round((stats.readCount / stats.totalEligible) * 100) : 0;

    return (
        <div className="space-y-6">
            <Link href="/admin/announcements" className="inline-flex items-center gap-1 text-sm text-orange-600 font-medium">← お知らせ管理</Link>
            
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">閲覧・反応状況</p>
                <h1 
                    onClick={() => setShowReadList(!showReadList)}
                    className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-orange-600 transition-colors flex items-center gap-2"
                >
                    {stats.title}
                    <svg className={`w-5 h-5 transition-transform ${showReadList ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: '既読数', value: stats.readCount, color: 'text-green-600' },
                    { label: '対象人数', value: stats.totalEligible, color: 'text-gray-900' },
                    { label: '既読率', value: `${rate}%`, color: rate > 70 ? 'text-green-600' : rate > 40 ? 'text-yellow-600' : 'text-red-600' },
                ].map(card => (
                    <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
                        <p className={`text-4xl font-black ${card.color}`}>{card.value}</p>
                        <p className="text-sm text-gray-400 font-bold mt-1">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Progress bar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3 text-sm">
                    <span className="font-bold text-gray-600">既読進捗</span>
                    <span className="font-black text-gray-900">{rate}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${rate}%` }} />
                </div>
            </div>

            {/* Read users (Conditional) */}
            {showReadList && (
                <div className="bg-white rounded-2xl border border-green-100 overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="px-5 py-4 bg-green-50 border-b border-green-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-green-800">既読者一覧</h3>
                            <p className="text-xs text-green-600 font-medium">{stats.readUsers.length}人が既読</p>
                        </div>
                        <span className="text-[10px] font-bold bg-green-200 text-green-700 px-2 py-1 rounded-full uppercase">READ</span>
                    </div>
                    {stats.readUsers.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">既読者はまだいません</div>
                    ) : (
                        <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                            {stats.readUsers.map(u => (
                                <div key={u.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm">
                                            {u.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{u.name}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">#{u.employeeNumber}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {u.storeName && <p className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mb-1 inline-block">{u.storeName}</p>}
                                        <p className="text-[10px] text-gray-400 font-medium">{u.readAt ? new Date(u.readAt).toLocaleString('ja-JP') : '-'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Unread users */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-900">未読者一覧</h3>
                        <p className="text-xs text-gray-400 font-medium">{stats.unreadUsers.length}人が未読</p>
                    </div>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full uppercase">UNREAD</span>
                </div>
                {stats.unreadUsers.length === 0 ? (
                    <div className="text-center py-12 text-green-600 font-bold bg-green-50/50">
                        <div className="text-3xl mb-2">🎉</div>
                        全員既読済みです！
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                        {stats.unreadUsers.map(u => (
                            <div key={u.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-bold text-sm">
                                        {u.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{u.name}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">#{u.employeeNumber}</p>
                                    </div>
                                </div>
                                {u.storeName && <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{u.storeName}</span>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
