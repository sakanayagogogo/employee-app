'use client';

import Link from 'next/link';

const masters = [
    {
        title: '店舗管理',
        description: '店舗の追加、編集、削除、情報の更新を行います。',
        icon: '🏪',
        href: '/admin/stores',
        color: 'text-orange-600',
        bg: 'bg-orange-50'
    },
    {
        title: 'ユーザー管理',
        description: '従業員の登録、権限・所属店舗の設定、停止等の管理を行います。',
        icon: '👥',
        href: '/admin/users',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50'
    },
    {
        title: '支部役員管理',
        description: '支部長、中央執行委員など、労働組合役員の任命・一覧管理を行います。',
        icon: '🎖️',
        href: '/admin/officers',
        color: 'text-rose-600',
        bg: 'bg-rose-50'
    },
    {
        title: 'お知らせ管理',
        description: '全社・店舗別のお知らせの配信管理を行います。',
        icon: '📢',
        href: '/admin/announcements',
        color: 'text-blue-600',
        bg: 'bg-blue-50'
    },
    {
        title: 'メニュー管理',
        description: '従業員画面のポータルに表示するウィジェットの設定を行います。',
        icon: '🧱',
        href: '/admin/menu',
        color: 'text-purple-600',
        bg: 'bg-purple-50'
    },
    {
        title: 'カテゴリー・区分',
        description: 'ロール（権限）、雇用区分、役員区分など、システム内の選択肢を管理します。',
        icon: '🏷️',
        href: '/admin/masters/categories',
        color: 'text-amber-600',
        bg: 'bg-amber-50'
    }
];

export default function MastersPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">マスター管理</h1>
                <p className="text-gray-500 text-sm">システム全体の基本情報を管理します。</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {masters.map((master) => (
                    <Link 
                        key={master.href} 
                        href={master.href}
                        className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300"
                    >
                        <div className="flex items-start gap-4">
                            <div className={`w-14 h-14 ${master.bg} ${master.color} rounded-2xl flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-transform`}>
                                {master.icon}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-lg font-bold text-gray-900 mb-1">{master.title}</h2>
                                <p className="text-sm text-gray-500 leading-relaxed">{master.description}</p>
                            </div>
                            <div className="text-gray-300 group-hover:text-gray-900 transition-colors pt-1">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
