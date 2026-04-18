'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

// PHP Upload Configuration
const UPLOAD_API_URL = 'https://t-union.jp/upload.php'; // 実際のURLに書き換えてください
const UPLOAD_API_KEY = 'union-connect-secret-key-12345'; // PHP側と一致させてください

interface Announcement {
    id: number;
    title: string;
    importance: string;
    category: string;
    isPublished: boolean;
    authorName: string;
    createdAt: string;
}

interface StoreGroup { id: number; name: string; }
interface Widget { id: number; title: string; type: string; categoryName: string | null; }

type TargetEntry = { targetType: string; targetValue: string | null };

interface FormState {
    title: string;
    body: string;
    importance: 'NORMAL' | 'IMPORTANT';
    category: 'GENERAL' | 'PRESIDENT' | 'MUST_READ';
    coverImageUrl: string;
    startAt: string;
    endAt: string;
    isPublished: boolean;
    targets: TargetEntry[];
    attachments: { name: string; url: string }[];
    widgetIds: number[];
    sendPush: boolean;
}

const emptyForm: FormState = {
    title: '', body: '', importance: 'NORMAL', category: 'GENERAL', coverImageUrl: '', startAt: '', endAt: '',
    isPublished: false, targets: [{ targetType: 'ALL', targetValue: null }],
    attachments: [],
    widgetIds: [],
    sendPush: true,
};

const categoryLabels: Record<string, string> = {
    GENERAL: '一般',
    PRESIDENT: '機関誌「きずな」',
    MUST_READ: '必読',
};

const categoryColors: Record<string, string> = {
    GENERAL: 'bg-gray-100 text-gray-600',
    PRESIDENT: 'bg-purple-100 text-purple-700',
    MUST_READ: 'bg-red-100 text-red-700',
};

export default function AdminAnnouncementsPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<Announcement[]>([]);
    const [groups, setGroups] = useState<StoreGroup[]>([]);
    const [allWidgets, setAllWidgets] = useState<Widget[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [editId, setEditId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [masters, setMasters] = useState<any[]>([]);

    const load = useCallback(async () => {
        const url = filterCategory === 'ALL'
            ? '/api/announcements?limit=100'
            : `/api/announcements?limit=100&category=${filterCategory}`;
        const [aRes, gRes, wRes, mRes] = await Promise.all([
            fetch(url),
            fetch('/api/admin/store-groups'),
            fetch('/api/menu?all=true'),
            fetch('/api/admin/master-data')
        ]);
        const [aData, gData, wData, mData] = await Promise.all([aRes.json(), gRes.json(), wRes.json(), mRes.json()]);
        setItems(aData.data ?? []);
        setGroups(gData.data ?? []);
        setAllWidgets(wData.data?.widgets ?? []);
        setMasters(mData.data ?? []);
    }, [filterCategory]);

    useEffect(() => { load(); }, [load]);

    const handleFileUpload = async (file: File) => {
        const formData = new FormData();
        formData.append('image', file);

        const res = await fetch(UPLOAD_API_URL, {
            method: 'POST',
            headers: { 'X-API-KEY': UPLOAD_API_KEY },
            body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'アップロードに失敗しました');
        return data.url as string;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        const finalTargets = form.targets.length > 0 ? form.targets : (
            user?.role === 'HQ_ADMIN' 
                ? [{ targetType: 'ALL', targetValue: null }] 
                : (user?.storeId ? [{ targetType: 'STORE', targetValue: String(user.storeId) }] : [])
        );

        const payload = {
            ...form,
            targets: finalTargets,
            startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
            endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
        };

        const url = editId ? `/api/announcements/${editId}` : '/api/announcements';
        const method = editId ? 'PATCH' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? 'エラー'); setSubmitting(false); return; }
        setShowForm(false);
        setEditId(null);
        setForm(emptyForm);
        await load();
        setSubmitting(false);
    };

    const handleEdit = async (id: number) => {
        const res = await fetch(`/api/announcements/${id}`);
        const data = await res.json();
        if (data.data) {
            const ann = data.data;
            // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
            const formatDate = (iso: string | null) => {
                if (!iso) return '';
                const d = new Date(iso);
                d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                return d.toISOString().slice(0, 16);
            };

            setForm({
                title: ann.title,
                body: ann.body,
                importance: ann.importance,
                category: ann.category,
                coverImageUrl: ann.coverImageUrl || '',
                startAt: formatDate(ann.startAt),
                endAt: formatDate(ann.endAt),
                isPublished: ann.isPublished,
                targets: ann.targets.map((t: any) => ({ targetType: t.targetType, targetValue: t.targetValue })),
                attachments: ann.attachments || [],
                widgetIds: ann.widgetIds || [],
                sendPush: false,
            });
            setEditId(id);
            setShowForm(true);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('お知らせを削除してもよろしいですか？\nこの操作は取り消せません。')) return;
        
        const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
        if (res.ok) {
            await load();
        } else {
            const data = await res.json();
            alert(data.error || '削除に失敗しました');
        }
    };

    return (
        <div className="space-y-6 pb-20 sm:pb-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">お知らせ管理</h1>
                    <p className="text-gray-500 text-xs sm:text-sm">お知らせの作成・編集・既読確認</p>
                </div>
                <button
                    onClick={() => { 
                        setShowForm(true); 
                        setEditId(null); 
                        const defaultTarget = user?.role === 'HQ_ADMIN' 
                            ? [{ targetType: 'ALL', targetValue: null }]
                            : (user?.storeId ? [{ targetType: 'STORE', targetValue: String(user.storeId) }] : []);
                        setForm({ ...emptyForm, targets: defaultTarget }); 
                    }}
                    className="flex items-center justify-center gap-2 bg-orange-600 text-white px-5 py-3 sm:py-2 rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200 sm:shadow-none"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    新規作成
                </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                <button
                    onClick={() => setFilterCategory('ALL')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterCategory === 'ALL'
                        ? 'bg-orange-600 text-white shadow-md'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-600'
                        }`}
                >
                    📋 すべて
                </button>
                {masters.filter(m => m.category === 'announcement_category').map(m => (
                    <button
                        key={m.code}
                        onClick={() => setFilterCategory(m.code)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterCategory === m.code
                            ? 'bg-orange-600 text-white shadow-md'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-600'
                            }`}
                    >
                        {m.name}
                    </button>
                ))}
            </div>

            {/* Form modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity lg:pl-64">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-5xl h-[95vh] sm:h-[90vh] overflow-y-auto p-5 sm:p-10 animate-slide-up shadow-2xl">
                        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 py-1">
                            <h2 className="text-xl font-bold text-gray-900">{editId ? 'お知らせ編集' : 'お知らせ作成'}</h2>
                            <button onClick={() => setShowForm(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors">✕</button>
                        </div>
                        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
                                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">本文</label>
                                <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required rows={12} className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 resize-y" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">重要度</label>
                                    <select value={form.importance} onChange={e => setForm({ ...form, importance: e.target.value as any })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 font-medium">
                                        {masters.filter(m => m.category === 'importance_level').map(m => (
                                            <option key={m.code} value={m.code}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">カテゴリ</label>
                                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as any })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 font-medium">
                                        {masters.filter(m => m.category === 'announcement_category').map(m => (
                                            <option key={m.code} value={m.code}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">カバー画像</label>
                                <div className="flex gap-2">
                                    <input type="text" value={form.coverImageUrl} onChange={e => setForm({ ...form, coverImageUrl: e.target.value })} placeholder="https://..." className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900" />
                                    <label className="shrink-0 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl cursor-pointer text-sm font-medium transition-colors flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                        アップロード
                                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            try {
                                                const url = await handleFileUpload(file);
                                                setForm({ ...form, coverImageUrl: url });
                                            } catch (err: any) { alert(err.message); }
                                        }} />
                                    </label>
                                </div>
                                {form.coverImageUrl && (
                                    <div className="mt-2 relative w-32 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                                        <img src={form.coverImageUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => setForm({ ...form, coverImageUrl: '' })} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">✕</button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">添付ファイル</label>
                                <div className="space-y-2">
                                    {form.attachments.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                <span className="text-xs text-gray-600 truncate">{file.name}</span>
                                            </div>
                                            <button type="button" onClick={() => setForm({ ...form, attachments: form.attachments.filter((_, i) => i !== idx) })} className="text-gray-400 hover:text-red-500 p-1">✕</button>
                                        </div>
                                    ))}
                                    <label className="flex items-center justify-center gap-2 w-full p-2 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50 cursor-pointer transition-all text-sm font-medium">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        ファイルを追加
                                        <input type="file" className="hidden" onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            try {
                                                const url = await handleFileUpload(file);
                                                setForm({ ...form, attachments: [...form.attachments, { name: file.name, url }] });
                                            } catch (err: any) { alert(err.message); }
                                        }} />
                                    </label>
                                </div>
                            </div>
                            {/* Category-specific hint */}
                            {form.category === 'PRESIDENT' && (
                                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-700 text-sm flex items-center gap-2">
                                    <span className="text-lg">📚</span>
                                    <span>機関誌「きずな」として投稿されます。トップに固定表示されます。</span>
                                </div>
                            )}
                            {form.category === 'MUST_READ' && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                                    <span className="text-lg">🔴</span>
                                    <span>必読投稿として配信されます。全従業員に既読確認が求められます。</span>
                                </div>
                            )}
                            <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <label className="flex items-center gap-3 cursor-pointer w-full">
                                    <input type="checkbox" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} className="w-5 h-5 accent-orange-600 rounded-lg" />
                                    <span className="text-sm font-bold text-gray-700">今すぐ公開する（チェックを外すと下書き保存）</span>
                                </label>
                            </div>
                            {form.isPublished && (
                                <div className="flex items-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <label className="flex items-center gap-3 cursor-pointer w-full">
                                        <input type="checkbox" checked={form.sendPush} onChange={e => setForm({ ...form, sendPush: e.target.checked })} className="w-5 h-5 accent-blue-600 rounded-lg" />
                                        <div>
                                            <span className="text-sm font-bold text-blue-700">🔔 プッシュ通知を送信する</span>
                                            <p className="text-xs text-blue-500 mt-0.5">公開時に対象ユーザーへ通知が送信されます</p>
                                        </div>
                                    </label>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">公開開始日時（任意）</label>
                                    <input type="datetime-local" value={form.startAt} onChange={e => setForm({ ...form, startAt: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 font-medium" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">公開終了日時（任意）</label>
                                    <input type="datetime-local" value={form.endAt} onChange={e => setForm({ ...form, endAt: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 font-medium" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">配信対象</label>
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {user?.role === 'HQ_ADMIN' ? (
                                            <button type="button" onClick={() => setForm({ ...form, targets: [{ targetType: 'ALL', targetValue: null }] })}
                                                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${form.targets.some(t => t.targetType === 'ALL') ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                                全員
                                            </button>
                                        ) : (
                                            user?.storeId && (
                                                <button type="button" onClick={() => setForm({ ...form, targets: [{ targetType: 'STORE', targetValue: String(user.storeId) }] })}
                                                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${form.targets.some(t => t.targetType === 'STORE') ? 'bg-orange-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                                                    所属店舗のみ
                                                </button>
                                            )
                                        )}
                                    </div>

                                    {groups.length > 0 && (
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase font-bold text-gray-400 ml-1">店舗グループ（エリア）別</p>
                                            <div className="flex flex-wrap gap-2">
                                                {groups.map(g => (
                                                     <button key={g.id} type="button"
                                                         onClick={() => {
                                                             const val = String(g.id);
                                                             const existing = form.targets.some(t => t.targetType === 'STORE_GROUP' && t.targetValue === val);
                                                             setForm({
                                                                 ...form, targets: existing
                                                                     ? form.targets.filter(t => !(t.targetType === 'STORE_GROUP' && t.targetValue === val))
                                                                     : [...form.targets.filter(t => t.targetType !== 'ALL'), { targetType: 'STORE_GROUP', targetValue: val }]
                                                             });
                                                         }}
                                                         className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${form.targets.some(t => t.targetType === 'STORE_GROUP' && t.targetValue === String(g.id)) ? 'bg-orange-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                                                         {g.name}
                                                     </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 ml-1">雇用区分別</p>
                                        <div className="flex flex-wrap gap-2">
                                            {masters.filter(m => m.category === 'employment_type').map(m => (
                                                    <button key={m.code} type="button"
                                                        onClick={() => {
                                                            const val = String(m.code);
                                                            const existing = form.targets.some(t => t.targetType === 'EMPLOYMENT_TYPE' && t.targetValue === val);
                                                            setForm({
                                                                ...form, targets: existing
                                                                    ? form.targets.filter(t => !(t.targetType === 'EMPLOYMENT_TYPE' && t.targetValue === val))
                                                                    : [...form.targets.filter(t => t.targetType !== 'ALL'), { targetType: 'EMPLOYMENT_TYPE', targetValue: val }]
                                                            });
                                                        }}
                                                        className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${form.targets.some(t => t.targetType === 'EMPLOYMENT_TYPE' && t.targetValue === String(m.code)) ? 'bg-orange-600 text-white shadow-sm' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                                                        {m.name}
                                                    </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 ml-1">役員区分別</p>
                                        <div className="flex flex-wrap gap-2">
                                            {masters.filter(m => m.category === 'union_role').map(m => (
                                                    <button key={m.code} type="button"
                                                        onClick={() => {
                                                            const val = String(m.code);
                                                            const existing = form.targets.some(t => t.targetType === 'UNION_ROLE' && t.targetValue === val);
                                                            setForm({
                                                                ...form, targets: existing
                                                                    ? form.targets.filter(t => !(t.targetType === 'UNION_ROLE' && t.targetValue === val))
                                                                    : [...form.targets.filter(t => t.targetType !== 'ALL'), { targetType: 'UNION_ROLE', targetValue: val }]
                                                            });
                                                        }}
                                                        className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${form.targets.some(t => t.targetType === 'UNION_ROLE' && t.targetValue === String(m.code)) ? 'bg-orange-600 text-white shadow-sm' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}>
                                                        {m.name}
                                                    </button>
                                            ))}
                                        </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-gray-400 ml-1">支部役割別</p>
                                        <div className="flex flex-wrap gap-2">
                                            {masters.filter(m => m.category === 'branch_officer').map(m => (
                                                    <button key={m.code} type="button"
                                                        onClick={() => {
                                                            const val = String(m.code);
                                                            const existing = form.targets.some(t => t.targetType === 'BRANCH_OFFICER' && t.targetValue === val);
                                                            setForm({
                                                                ...form, targets: existing
                                                                    ? form.targets.filter(t => !(t.targetType === 'BRANCH_OFFICER' && t.targetValue === val))
                                                                    : [...form.targets.filter(t => t.targetType !== 'ALL'), { targetType: 'BRANCH_OFFICER', targetValue: val }]
                                                            });
                                                        }}
                                                        className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${form.targets.some(t => t.targetType === 'BRANCH_OFFICER' && t.targetValue === String(m.code)) ? 'bg-orange-600 text-white shadow-sm' : 'bg-pink-50 text-pink-700 hover:bg-pink-100'}`}>
                                                        {m.name}
                                                    </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">メニュータイルの設置（任意）</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-100 rounded-xl bg-gray-50">
                                    {allWidgets.map(widget => {
                                        const isSelected = form.widgetIds.includes(widget.id);
                                        return (
                                            <button
                                                key={widget.id}
                                                type="button"
                                                onClick={() => {
                                                    setForm(prev => ({
                                                        ...prev,
                                                        widgetIds: isSelected
                                                            ? prev.widgetIds.filter(id => id !== widget.id)
                                                            : [...prev.widgetIds, widget.id]
                                                    }));
                                                }}
                                                className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all border ${
                                                    isSelected 
                                                        ? 'bg-orange-600 text-white border-orange-500 shadow-sm' 
                                                        : 'bg-white text-gray-600 border-gray-100 hover:border-orange-200'
                                                }`}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-orange-400'}`} />
                                                <span className="text-xs font-bold truncate">{widget.title}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="mt-1 text-[10px] text-gray-400 italic px-1">選択したタイルがお知らせの本文下にボタンとして表示されます。</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-6 pb-2 sticky bottom-0 bg-white border-t border-gray-50 mt-8">
                                <button type="button" onClick={() => setShowForm(false)} className="order-2 sm:order-1 flex-1 py-3.5 sm:py-2.5 border border-gray-200 rounded-2xl text-gray-600 font-bold hover:bg-gray-50 transition-colors">キャンセル</button>
                                <button type="submit" disabled={submitting} className="order-1 sm:order-2 flex-1 py-3.5 sm:py-2.5 bg-orange-600 text-white rounded-2xl font-bold disabled:opacity-50 hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200">
                                    {submitting ? '保存中...' : 'お知らせを保存する'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-4 py-4 font-bold text-gray-600 whitespace-nowrap">タイトル</th>
                                <th className="text-left px-4 py-4 font-bold text-gray-600 whitespace-nowrap">カテゴリ</th>
                                <th className="hidden md:table-cell text-left px-4 py-4 font-bold text-gray-600 whitespace-nowrap">重要度</th>
                                <th className="text-left px-4 py-4 font-bold text-gray-600 whitespace-nowrap">状態</th>
                                <th className="hidden lg:table-cell text-left px-4 py-4 font-bold text-gray-600 whitespace-nowrap">作成日</th>
                                <th className="text-right px-4 py-4 font-bold text-gray-600 whitespace-nowrap">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors">
                                    <td className="px-4 py-4 min-w-[180px]">
                                        <button 
                                            onClick={() => handleEdit(item.id)}
                                            className="font-bold text-gray-900 hover:text-blue-600 hover:underline text-left transition-colors leading-snug"
                                        >
                                            {item.title}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${categoryColors[item.category] ?? 'bg-gray-100 text-gray-500'}`}>
                                            {masters.find(m => m.category === 'announcement_category' && m.code === item.category)?.name || item.category}
                                        </span>
                                    </td>
                                    <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap">
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${item.importance === 'IMPORTANT' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                                            {masters.find(m => m.category === 'importance_level' && m.code === item.importance)?.name || item.importance}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${item.isPublished ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {item.isPublished ? '公開中' : '下書き'}
                                        </span>
                                    </td>
                                    <td className="hidden lg:table-cell px-4 py-4 text-gray-400 whitespace-nowrap font-medium">
                                        {new Date(item.createdAt).toLocaleDateString('ja-JP')}
                                    </td>
                                    <td className="px-4 py-4 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-3">
                                            <Link href={`/admin/announcements/${item.id}/stats`} className="w-8 h-8 flex items-center justify-center bg-orange-50 text-orange-600 rounded-full hover:bg-orange-100 transition-colors" title="既読確認">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(item.id)}
                                                className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors"
                                                title="削除"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {items.length === 0 && (
                    <div className="text-center py-12 text-gray-400">お知らせはありません</div>
                )}
            </div>
        </div>
    );
}
