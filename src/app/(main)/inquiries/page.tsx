'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Inquiry {
    id: number;
    title: string;
    category: string;
    destination: string;
    status: string;
    authorName: string;
    storeName: string | null;
    storeGroupName: string | null;
    recipientId: number | null;
    recipientName: string | null;
    recipientEmployeeNumber: string | null;
    createdAt: string;
    updatedAt: string;
    isRead: boolean;
}

interface SearchUser {
    id: number;
    employeeNumber: string;
    name: string;
    storeName: string | null;
    role: string;
}

const statusColors: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    CLOSED: 'bg-gray-100 text-gray-500',
};
const statusLabels: Record<string, string> = {
    OPEN: '未対応', IN_PROGRESS: '対応中', CLOSED: 'クローズ'
};

function RecipientPicker({
    selectedUser,
    onSelect,
    onClear,
}: {
    selectedUser: SearchUser | null;
    onSelect: (u: SearchUser) => void;
    onClear: () => void;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<SearchUser[]>([]);
    const [searching, setSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const doSearch = useCallback(async (q: string) => {
        if (!q.trim()) {
            setResults([]);
            return;
        }
        setSearching(true);
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            setResults(data.data ?? []);
        } catch {
            setResults([]);
        } finally {
            setSearching(false);
        }
    }, []);

    const handleInputChange = (value: string) => {
        setSearchQuery(value);
        setShowDropdown(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(value), 300);
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (selectedUser) {
        return (
            <div className="flex items-center gap-3 bg-blue-50 border-2 border-blue-200 rounded-2xl px-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                    {selectedUser.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{selectedUser.name}</p>
                    <p className="text-[11px] text-gray-500 font-medium">
                        社員コード: {selectedUser.employeeNumber} · {selectedUser.storeName ?? '本部'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClear}
                    className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors shrink-0"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => searchQuery && setShowDropdown(true)}
                    placeholder="社員コードまたは名前で検索..."
                    className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white rounded-2xl focus:ring-0 text-gray-900 font-bold transition-all outline-none placeholder:text-gray-300"
                />
                {searching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {showDropdown && (searchQuery.trim().length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl shadow-gray-200/50 z-50 max-h-60 overflow-y-auto">
                    {results.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">
                            {searching ? '検索中...' : '該当するユーザーが見つかりません'}
                        </div>
                    ) : (
                        results.map((u) => (
                            <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                    onSelect(u);
                                    setSearchQuery('');
                                    setShowDropdown(false);
                                    setResults([]);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors text-left border-b border-gray-50 last:border-0"
                            >
                                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm shrink-0">
                                    {u.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-sm truncate">{u.name}</p>
                                    <p className="text-[11px] text-gray-400 font-medium">
                                        {u.employeeNumber} · {u.storeName ?? '本部'}
                                    </p>
                                </div>
                                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default function InquiriesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [items, setItems] = useState<Inquiry[]>([]);
    const isAdmin = user?.role === 'STORE_ADMIN' || user?.role === 'HQ_ADMIN';
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ title: '', destination: '', category: '', message: '' });
    const [selectedRecipient, setSelectedRecipient] = useState<SearchUser | null>(null);
    const [formError, setFormError] = useState('');
    const [masters, setMasters] = useState<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        Promise.all([
            fetch('/api/inquiries?limit=100').then(r => r.json()),
            fetch('/api/admin/master-data').then(r => r.json())
        ]).then(([inqData, mData]) => {
            setItems(inqData.data ?? []);
            const m = mData.data ?? [];
            setMasters(m);
            // Set defaults from masters
            const hqDest = m.find((x: any) => x.category === 'inquiry_destination' && (x.name === '本部' || x.code === 'HQ'))?.code || 'HQ';
            const defaultCat = m.find((x: any) => x.category === 'inquiry_category')?.name || '';
            setForm(prev => ({ ...prev, destination: hqDest, category: defaultCat }));
        }).finally(() => setLoading(false));
    }, []);

    const displayed = filter === 'unread' ? items.filter(i => !i.isRead) : items;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setSubmitting(true);
        const payload: any = { ...form };
        if (isAdmin && selectedRecipient) {
            payload.recipientId = selectedRecipient.id;
        }
        const res = await fetch('/api/inquiries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
            setFormError(data.error ?? 'エラーが発生しました');
            setSubmitting(false);
        } else {
            setSelectedRecipient(null);
            router.push(`/inquiries/${data.data.id}`);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold text-gray-900">メールBOX</h1>
                    <div className="flex mt-2 bg-gray-100 rounded-xl p-1 w-fit shadow-inner">
                        {(['all', 'unread'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f 
                                    ? 'bg-white text-orange-600 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {f === 'all' ? 'すべて' : '未読のみ'}
                                {f === 'unread' && items.filter((i) => !i.isRead).length > 0 && (
                                    <span className="ml-1.5 bg-orange-600 text-white text-[9px] px-1.5 py-0.5 rounded-full ring-2 ring-white">
                                        {items.filter((i) => !i.isRead).length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-1.5 bg-orange-600 text-white px-4 py-2.5 rounded-2xl text-sm font-bold hover:bg-orange-700 transition-all shadow-md shadow-orange-100 active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    新規メール
                </button>
            </div>

            {/* New inquiry form modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/70 z-[100] flex items-start justify-center p-4 pt-20 overflow-y-auto backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
                        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
                            {/* Fixed Header */}
                            <div className="flex items-center justify-between p-8 pb-4 bg-white border-b border-gray-50 z-10">
                                <h2 className="text-2xl font-black text-gray-900">新規メール</h2>
                                <div className="flex items-center gap-4">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="bg-orange-600 text-white px-5 py-2 rounded-2xl font-black text-sm hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-orange-100"
                                    >
                                        {submitting ? '送信中...' : '送信'}
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => { setShowForm(false); setSelectedRecipient(null); }} 
                                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-6 hide-scrollbar">
                                {formError && (
                                    <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 text-sm font-medium">{formError}</div>
                                )}

                                <input type="hidden" value={form.destination} />
                                
                                <div className="space-y-6">
                                    {/* Admin: Recipient Picker */}
                                    {isAdmin && (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-400 mb-2 px-1 uppercase tracking-widest">
                                                宛先
                                                <span className="ml-2 text-[10px] font-medium text-gray-300 normal-case tracking-normal">（指定しない場合は本部管理者宛になります）</span>
                                            </label>
                                            <RecipientPicker
                                                selectedUser={selectedRecipient}
                                                onSelect={setSelectedRecipient}
                                                onClear={() => setSelectedRecipient(null)}
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2 px-1 uppercase tracking-widest">カテゴリ</label>
                                        <select
                                            value={form.category}
                                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white rounded-2xl focus:ring-0 text-gray-900 font-bold transition-all outline-none"
                                        >
                                            {masters.filter(m => m.category === 'inquiry_category').map((m) => (
                                                <option key={m.code} value={m.name}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2 px-1 uppercase tracking-widest">件名</label>
                                        <input
                                            type="text"
                                            value={form.title}
                                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                                            required
                                            placeholder="メールのタイトルを入力"
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white rounded-2xl focus:ring-0 text-gray-900 font-bold transition-all outline-none placeholder:text-gray-300"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2 px-1 uppercase tracking-widest">内容</label>
                                        <textarea
                                            value={form.message}
                                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                                            required
                                            rows={8}
                                            placeholder="ここにご質問や連絡事項を入力してください..."
                                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white rounded-2xl focus:ring-0 text-gray-900 font-bold transition-all outline-none placeholder:text-gray-300 resize-none min-h-[200px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-3xl p-5 border border-gray-100 animate-pulse">
                            <div className="h-5 bg-gray-200 rounded-full w-3/4 mb-3" />
                            <div className="h-4 bg-gray-100 rounded-full w-1/3" />
                        </div>
                    ))}
                </div>
            ) : displayed.length === 0 ? (
                <div className="bg-white rounded-[2rem] border border-gray-100 py-20 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 font-bold mb-2">{filter === 'unread' ? '未読メールはありません' : 'メールはありません'}</p>
                    <p className="text-gray-400 text-sm mb-6">{filter === 'unread' ? 'すべての連絡事項を確認済みです' : '右上のボタンから新規メールを作成できます'}</p>
                    {filter === 'all' && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-orange-50 text-orange-600 font-bold px-6 py-2.5 rounded-2xl hover:bg-orange-100 transition-colors"
                        >
                            最初のメールを送る
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {displayed.map((inq) => (
                        <Link key={inq.id} href={`/inquiries/${inq.id}`}>
                            <div className={`group bg-white rounded-3xl p-5 border transition-all hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-0.5 ${!inq.isRead ? 'border-orange-200 bg-orange-50/10' : 'border-gray-100'}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            {!inq.isRead && (
                                                <span className="bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse whitespace-nowrap">
                                                    新着
                                                </span>
                                            )}
                                            <p className={`text-base truncate leading-tight ${!inq.isRead ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>
                                                {inq.title}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                            {isAdmin && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded-lg">{inq.authorName}</span>
                                                    <span className="text-xs text-gray-400 font-bold">{inq.storeName ?? '-'}</span>
                                                </div>
                                            )}
                                            {inq.recipientName && (
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    <span className="text-[11px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                                                        宛先: {inq.recipientName}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-[11px] text-gray-400 font-bold">
                                                <span className="bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                                                    {masters.find(m => m.category === 'inquiry_category' && m.name === inq.category)?.name || inq.category}
                                                </span>
                                                <span>·</span>
                                                <span>
                                                    {masters.find(m => m.category === 'inquiry_destination' && m.code === inq.destination)?.name || inq.destination}
                                                </span>
                                                <span>·</span>
                                                <span>{new Date(inq.updatedAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`shrink-0 text-[10px] font-black tracking-wider px-2.5 py-1 rounded-full border-2 ${
                                            inq.status === 'OPEN' ? 'border-blue-100 bg-blue-50 text-blue-600' :
                                            inq.status === 'IN_PROGRESS' ? 'border-yellow-100 bg-yellow-50 text-yellow-600' :
                                            'border-gray-100 bg-gray-50 text-gray-400'
                                        }`}>
                                            {statusLabels[inq.status] ?? inq.status}
                                        </span>
                                        { (isAdmin || inq.authorName === user?.name) && (
                                            <button
                                                onClick={async (e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (!confirm('このメールを削除してもよろしいですか？')) return;
                                                    const res = await fetch(`/api/inquiries/${inq.id}`, { method: 'DELETE' });
                                                    if (res.ok) {
                                                        setItems(prev => prev.filter(i => i.id !== inq.id));
                                                    }
                                                }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-red-400 hover:text-red-500 underline underline-offset-2"
                                            >
                                                削除
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
