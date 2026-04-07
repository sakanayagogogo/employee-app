'use client';

import { useCallback, useEffect, useState } from 'react';

interface Inquiry {
    id: number;
    title: string;
    category: string;
    destination: string;
    status: string;
    authorName: string;
    storeName: string | null;
    storeGroupName: string | null;
    assigneeName: string | null;
    createdAt: string;
    updatedAt: string;
}

const statusColors: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    CLOSED: 'bg-gray-100 text-gray-500',
};
const statusLabels: Record<string, string> = {
    OPEN: '未対応', IN_PROGRESS: '対応中', CLOSED: 'クローズ'
};

export default function AdminInquiriesPage() {
    const [items, setItems] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [masters, setMasters] = useState<any[]>([]);

    const load = useCallback(async () => {
        const url = filterStatus ? `/api/inquiries?status=${filterStatus}&limit=200` : '/api/inquiries?limit=200';
        const [res, mRes] = await Promise.all([
            fetch(url),
            fetch('/api/admin/master-data')
        ]);
        const [data, mData] = await Promise.all([res.json(), mRes.json()]);
        setItems(data.data ?? []);
        setMasters(mData.data ?? []);
        setLoading(false);
    }, [filterStatus]);

    useEffect(() => {
        setLoading(true);
        load();
    }, [load]);

    const handleStatusChange = async (id: number, status: string) => {
        await fetch(`/api/inquiries/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        await load();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('このメールを削除してもよろしいですか？\nこの操作は取り消せません。')) return;
        await fetch(`/api/inquiries/${id}`, { method: 'DELETE' });
        await load();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">メール管理</h1>
                    <p className="text-gray-500 text-sm">メール一覧・ステータス変更</p>
                </div>
                <div className="flex bg-gray-100 rounded-xl p-1">
                    {[['', 'すべて'], ['OPEN', '未対応'], ['IN_PROGRESS', '対応中'], ['CLOSED', 'クローズ']].map(([val, label]) => (
                        <button key={val} onClick={() => setFilterStatus(val)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterStatus === val ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center animate-pulse text-gray-300">読み込み中...</div>
                ) : items.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">メールはありません</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">件名</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">カテゴリ</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">グループ</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">店舗</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">氏名</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">ステータス</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">更新日</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900 max-w-40 truncate">{item.title}</td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {masters.find(m => m.category === 'inquiry_category' && m.code === item.category)?.name || item.category}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{item.storeGroupName ?? '-'}</td>
                                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{item.storeName ?? '-'}</td>
                                    <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">{item.authorName}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[item.status] ?? 'bg-gray-100 text-gray-500'}`}>
                                            {statusLabels[item.status] ?? item.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400">{new Date(item.updatedAt).toLocaleDateString('ja-JP')}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1">
                                            {item.status !== 'IN_PROGRESS' && (
                                                <button onClick={() => handleStatusChange(item.id, 'IN_PROGRESS')} className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-lg hover:bg-yellow-100 transition-colors">対応中</button>
                                            )}
                                            {item.status !== 'CLOSED' && (
                                                <button onClick={() => handleStatusChange(item.id, 'CLOSED')} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg hover:bg-gray-200 transition-colors">クローズ</button>
                                            )}
                                            {item.status === 'CLOSED' && (
                                                <button onClick={() => handleStatusChange(item.id, 'OPEN')} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg hover:bg-blue-100 transition-colors">再開</button>
                                            )}
                                            <button 
                                                onClick={() => handleDelete(item.id)} 
                                                className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full hover:bg-red-100 transition-colors"
                                            >
                                                削除
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
