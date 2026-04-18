'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface StatItem {
    label: string;
    value: number;
}

interface AnnouncementHighlight {
    id: number;
    title: string;
    readCount: number;
    likesCount: number;
    totalUsers: number;
}

interface FormSubmission {
    id: number;
    widgetTitle: string;
    userName: string;
    storeName: string | null;
    responseJson: Record<string, any>;
    createdAt: string;
}

interface Stats {
    totalUsers: number;
    activeUsers: number;
    plNonUnionUsers: number;
    unionMembersUsers: number;
    totalStores: number;
    openInquiries: number;
    totalAnnouncements: number;
    recentInquiries: number;
    totalHearts: number;
    categories: StatItem[];
    statuses: StatItem[];
    announcementHighlights: AnnouncementHighlight[];
    totalWidgets: number;
    widgetsByType: StatItem[];
    totalWidgetResponses: number;
    recentFormSubmissions: FormSubmission[];
    loginLogs: {
        id: number;
        action: string;
        user_name: string | null;
        employee_number: string | null;
        store_name: string | null;
        detail_json: any;
        created_at: string;
    }[];
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setStats(data);
                }
            })
            .catch(err => {
                console.error('Failed to fetch stats:', err);
                setError('データの取得に失敗しました');
            })
            .finally(() => setLoading(false));
    }, []);

    const handleUpdateStatus = async (responseId: number, status: string) => {
        try {
            const res = await fetch(`/api/admin/menu/responses/${responseId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                // Refresh stats
                const data = await (await fetch('/api/admin/stats')).json();
                setStats(data);
            }
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 text-red-700 rounded-3xl border border-red-100">
                <p className="font-bold">エラーが発生しました</p>
                <p className="text-sm mt-2">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold">再試行</button>
            </div>
        );
    }

    const statCards = [
        { 
            label: '総ユーザー数', 
            value: stats?.totalUsers ?? 0, 
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ), 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-50', 
            href: '/admin/users' 
        },
        { 
            label: '総ハート数', 
            value: stats?.totalHearts ?? 0, 
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            ), 
            color: 'text-pink-600', 
            bg: 'bg-pink-50', 
            href: '/admin/announcements' 
        },
        { 
            label: '未解決相談', 
            value: stats?.openInquiries ?? 0, 
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ), 
            color: 'text-orange-600', 
            bg: 'bg-orange-50', 
            href: '/admin/inquiries' 
        },
        { 
            label: '組合員数', 
            value: stats?.unionMembersUsers ?? 0, 
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
            ), 
            color: 'text-blue-600', 
            bg: 'bg-blue-50', 
            href: '/admin/users' 
        },
        { 
            label: '組合未加入 (PL)', 
            value: stats?.plNonUnionUsers ?? 0, 
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            color: 'text-rose-600',
            bg: 'bg-rose-50',
            href: '/admin/users'
        },
    ];

    const statusLabels: Record<string, { label: string, color: string }> = {
        OPEN: { label: '未対応', color: '#3b82f6' },
        IN_PROGRESS: { label: '対応中', color: '#eab308' },
        CLOSED: { label: 'クローズ', color: '#94a3b8' }
    };

    const maxCategoryValue = Math.max(...(stats?.categories.map(c => c.value) || [1]));

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">ダッシュボード</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {user?.name}さん、{user?.role === 'HQ_ADMIN' ? '本部管理者' : '店舗管理者'}としてログイン中
                    </p>
                </div>
            </div>

            {/* Recent Form Submissions at the Top */}
            {!loading && stats && stats.recentFormSubmissions.length > 0 && (
                <div className="bg-white rounded-[2rem] border border-zinc-200 p-6 shadow-sm overflow-hidden relative">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-black text-zinc-900 tracking-tight">届いた申請（最新）</h2>
                        </div>
                        <Link href="/admin/menu" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-4 py-2 rounded-xl transition-colors">
                            すべての申請データを見る
                        </Link>
                    </div>

                    <div className="flex overflow-x-auto gap-4 pb-2 -mx-2 px-2 scrollbar-none snap-x">
                        {stats.recentFormSubmissions.map((sub) => (
                            <div key={sub.id} className="flex-shrink-0 w-80 bg-zinc-50 rounded-2xl border border-zinc-100 p-5 snap-start hover:border-indigo-300 transition-colors cursor-default">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded shadow-sm inline-block uppercase tracking-wider">
                                        {sub.widgetTitle}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 font-bold">
                                        {new Date(sub.createdAt).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="mb-4">
                                    <p className="text-lg font-black text-zinc-900">{sub.userName}</p>
                                    <p className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                        {sub.storeName || '本部'}
                                    </p>
                                </div>
                                <div className="space-y-1 bg-white p-3 rounded-xl border border-zinc-100 min-h-[60px] max-h-[100px] overflow-y-auto overflow-hidden">
                                     {Object.entries(sub.responseJson).slice(0, 3).map(([key, value]) => (
                                         <div key={key} className="text-xs">
                                             <span className="text-zinc-400 font-bold">{key}: </span>
                                             <span className="text-zinc-800 font-medium">
                                                 {typeof value === 'object' && value !== null ? (value as any).name || 'データ' : String(value)}
                                             </span>
                                         </div>
                                     ))}
                                     {Object.keys(sub.responseJson).length > 3 && (
                                         <p className="text-[10px] text-zinc-300 italic pt-1 text-center">...他項目あり</p>
                                     )}
                                </div>
                                <div className="mt-4 flex gap-2 pt-4 border-t border-zinc-100">
                                    <button 
                                        onClick={() => handleUpdateStatus(sub.id, 'PROCESSED')}
                                        className="flex-1 py-3 bg-indigo-600 text-white text-[11px] font-black rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                        処理済にする
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Real Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {statCards.map((stat) => (
                    <Link key={stat.label} href={stat.href} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:translate-y-[-2px] transition-all hover:shadow-md cursor-pointer group">
                        <div className="flex items-center justify-between mb-3">
                            <span className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                                {stat.icon}
                            </span>
                            <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-400">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {loading ? <span className="animate-pulse bg-gray-100 rounded text-transparent">000</span> : stat.value}
                        </p>
                    </Link>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Inquiry Charts & Announcement Reach */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Announcement Highlights */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-pink-500 rounded-full"></span>
                                お知らせの閲覧・反応状況
                            </h2>
                            <Link href="/admin/announcements" className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors">すべて見る</Link>
                        </div>
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-2xl animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {stats?.announcementHighlights?.map((ann) => (
                                    <Link key={ann.id} href={`/admin/announcements/${ann.id}/stats`} className="block bg-gray-50/50 rounded-2xl p-4 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100 group">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <p className="text-sm font-bold text-gray-800 line-clamp-1 flex-1 group-hover:text-blue-600 transition-colors">{ann.title}</p>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 text-pink-500">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                    </svg>
                                                    <span className="text-sm font-bold">{ann.likesCount}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${(ann.readCount / ann.totalUsers) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter whitespace-nowrap">
                                                READ: {ann.readCount} / {ann.totalUsers} ({Math.round((ann.readCount / ann.totalUsers) * 100)}%)
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                            相談カテゴリ分布
                        </h2>
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-8 bg-gray-50 rounded-full animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {stats?.categories?.map((cat, idx) => (
                                    <div key={cat.label} className="group">
                                        <div className="flex justify-between text-sm mb-1.5">
                                            <span className="font-bold text-gray-700">{cat.label}</span>
                                            <span className="text-gray-400 font-medium">{cat.value} 件</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-gray-50 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000 ease-out"
                                                style={{ width: `${(cat.value / maxCategoryValue) * 100}%`, transitionDelay: `${idx * 100}ms` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                            相談対応ステータス
                        </h2>
                        {loading ? (
                            <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />
                        ) : (
                            <div className="flex flex-col md:flex-row items-center gap-12">
                                <div className="relative w-40 h-40">
                                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                        <path
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="#f3f4f6"
                                            strokeWidth="3"
                                        />
                                        {(() => {
                                            let offset = 0;
                                            const total = stats?.statuses?.reduce((acc, curr) => acc + curr.value, 0) || 1;
                                            return stats?.statuses?.map((s, i) => {
                                                const percentage = (s.value / total) * 100;
                                                const stroke = `${percentage} ${100 - percentage}`;
                                                const currentOffset = offset;
                                                offset += percentage;
                                                return (
                                                    <path
                                                        key={s.label}
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                        fill="none"
                                                        stroke={statusLabels[s.label]?.color || '#cbd5e1'}
                                                        strokeWidth="3.5"
                                                        strokeDasharray={stroke}
                                                        strokeDashoffset={-currentOffset}
                                                        className="transition-all duration-1000 ease-in-out"
                                                    />
                                                );
                                            });
                                        })()}
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <p className="text-xs text-gray-400 font-bold">TOTAL</p>
                                        <p className="text-2xl font-black text-gray-900">
                                            {stats?.statuses.reduce((acc, curr) => acc + curr.value, 0)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex-1 grid grid-cols-1 gap-4 w-full">
                                    {['OPEN', 'IN_PROGRESS', 'CLOSED'].map(key => {
                                        const s = stats?.statuses?.find(st => st.label === key) || { label: key, value: 0 };
                                        const label = statusLabels[key];
                                        const total = stats?.statuses?.reduce((acc, curr) => acc + curr.value, 0) || 1;
                                        return (
                                            <div key={key} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }}></span>
                                                    <span className="text-sm font-bold text-gray-600">{label.label}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-gray-900">{s.value}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold">{Math.round((s.value / total) * 100)}%</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Menu Widgets Overview */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                                メニュー（タイル）の集約情報
                            </h2>
                            <Link href="/admin/menu" className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors">画面管理</Link>
                        </div>
                        {loading ? (
                            <div className="h-32 bg-gray-50 rounded-2xl animate-pulse" />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">総タイル数</p>
                                        <p className="text-3xl font-black text-orange-700">{stats?.totalWidgets || 0}<span className="text-xs ml-1 font-bold">件</span></p>
                                    </div>
                                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">アンケート総回答数</p>
                                        <p className="text-3xl font-black text-blue-700">{stats?.totalWidgetResponses || 0}<span className="text-xs ml-1 font-bold">件</span></p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">タイプ別内訳</p>
                                    {stats?.widgetsByType?.map(w => (
                                        <div key={w.label} className="flex items-center justify-between p-2.5 bg-gray-50/50 rounded-xl">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                                                <span className="text-sm font-bold text-gray-700">
                                                    {{
                                                        'SURVEY': 'アンケート',
                                                        'LINK': '外部リンク',
                                                        'BOARD': '掲示板',
                                                        'CHECKLIST': 'チェックリスト',
                                                        'ATTENDANCE': '勤怠管理',
                                                        'FAQ': 'FAQ'
                                                    }[w.label] || w.label}
                                                </span>
                                            </div>
                                            <span className="text-sm font-black text-gray-900">{w.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                    {/* Info Panel */}
                    <div className="bg-zinc-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden min-h-[300px] flex flex-col justify-between">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-8">
                                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <span className="text-[11px] font-black tracking-widest text-emerald-400 uppercase">コンテンツ分析</span>
                            </div>
                            
                            <p className="text-zinc-500 text-xs font-bold mb-1 tracking-wider">総お知らせ配信数</p>
                            <p className="text-4xl font-black mb-6 tracking-tighter">
                                {loading ? '...' : stats?.totalAnnouncements}
                                <span className="text-sm font-medium text-zinc-600 ml-3">件</span>
                            </p>
                            
                            <div className="space-y-4">
                                <div className="p-5 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2 tracking-widest">直近24時間の相談</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-2xl font-black text-emerald-400">+{stats?.recentInquiries || 0}</span>
                                        <span className="text-xs font-bold text-zinc-400 mb-1">件の新規相談</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] -ml-24 -mb-24" />
                    </div>

                    {/* Login Logs Panel */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm overflow-hidden min-h-[400px]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">ログイン履歴</h2>
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                        </div>

                        <div className="space-y-4">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-gray-50 rounded-2xl animate-pulse" />)
                            ) : stats?.loginLogs?.map((log) => (
                                <div key={log.id} className="group relative flex items-center gap-4 p-3 rounded-2xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors border border-transparent">
                                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                                        log.action === 'USER_LOGIN' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                                    }`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            {log.action === 'USER_LOGIN' ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            )}
                                        </svg>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                            <p className="text-xs font-black text-gray-900 truncate">
                                                {log.user_name || '不明なユーザー'}
                                            </p>
                                            <span className="shrink-0 text-[9px] font-bold text-gray-400">
                                                {new Date(log.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-400 truncate flex items-center gap-1">
                                            <span className="bg-gray-200/50 px-1 rounded text-[8px] uppercase">{log.employee_number || '---'}</span>
                                            {log.store_name && <span className="truncate">@{log.store_name}</span>}
                                            {log.action === 'LOGIN_FAILURE' && <span className="text-red-500 font-black">LOGIN FAIL</span>}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {!loading && (!stats?.loginLogs || stats.loginLogs.length === 0) && (
                                <div className="text-center py-10">
                                    <p className="text-xs font-bold text-gray-300">履歴はありません</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
