'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface Widget {
    id: number;
    type: string;
    title: string;
    categoryName: string | null;
    configJson: Record<string, unknown>;
    size: 'S' | 'M' | 'L';
    sortOrder: number;
    isPublished: boolean;
    expiresAt: string | null;
    showInHeader: boolean;
}

const typeLabels: Record<string, string> = { SURVEY: 'アンケート', ATTENDANCE: '出欠', CHECKLIST: 'チェックリスト', LINK: 'リンク', BOARD: '掲示板' };
const typeColors: Record<string, string> = { SURVEY: 'bg-orange-100 text-orange-700', ATTENDANCE: 'bg-green-100 text-green-700', CHECKLIST: 'bg-orange-100 text-orange-700', LINK: 'bg-sky-100 text-sky-700', BOARD: 'bg-pink-100 text-pink-700' };

export default function AdminMenuPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [widgets, setWidgets] = useState<Widget[]>([]);
    const [categorySettings, setCategorySettings] = useState<{ name: string, showInHeader: boolean }[]>([]);
    const [loading, setLoading] = useState(true);
    const [localCategories, setLocalCategories] = useState<string[]>([]);
    const [draggedWidgetId, setDraggedWidgetId] = useState<number | null>(null);
    const [isDragOverCategory, setIsDragOverCategory] = useState<string | null>(null);

    const load = useCallback(async () => {
        const [wRes, cRes] = await Promise.all([
            fetch(`/api/menu?all=true`),
            fetch(`/api/menu/categories`)
        ]);
        const [wData, cData] = await Promise.all([wRes.json(), cRes.json()]);
        
        if (wData.data) {
            setWidgets(wData.data.widgets.sort((a: Widget, b: Widget) => a.sortOrder - b.sortOrder));
        }
        if (cData.data) {
            setCategorySettings(cData.data);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!authLoading && user && user.role !== 'HQ_ADMIN') {
            router.push('/admin');
        }
    }, [user, authLoading, router]);

    useEffect(() => { 
        if (user && user.role === 'HQ_ADMIN') {
            load(); 
        }
    }, [load, user]);

    const handleTogglePublish = async (widget: Widget) => {
        await fetch(`/api/menu/widget/${widget.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isPublished: !widget.isPublished }),
        });
        await load();
    };

    const handleDelete = async (widgetId: number) => {
        if (!confirm('このメニューを削除しますか？')) return;
        try {
            const res = await fetch(`/api/menu/widget/${widgetId}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json();
                alert(err.error || '削除に失敗しました。');
            } else {
                await load();
            }
        } catch (err) {
            alert('通信エラーが発生しました。');
        }
    };

    const updateCategory = async (widgetId: number, categoryName: string | null) => {
        await fetch(`/api/menu/widget/${widgetId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoryName }),
        });
        // Remove from localCategories if it was there
        if (categoryName) {
            setLocalCategories(prev => prev.filter(c => c !== categoryName));
        }
        await load();
    };

    const handleDragStart = (id: number) => {
        setDraggedWidgetId(id);
    };

    const handleDrop = async (categoryName: string | null) => {
        if (draggedWidgetId !== null) {
            await updateCategory(draggedWidgetId, categoryName);
        }
        setDraggedWidgetId(null);
        setIsDragOverCategory(null);
    };

    const handleRenameCategory = async (oldName: string) => {
        const newName = prompt('新しい分類名を入力してください', oldName === '未分類' ? '' : oldName);
        if (!newName || !newName.trim() || newName === oldName) return;

        try {
            const res = await fetch('/api/menu/categories', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldName, newName: newName.trim() }),
            });
            if (res.ok) {
                await load();
            } else {
                const err = await res.json();
                alert(err.error || '更新に失敗しました');
            }
        } catch (e) {
            alert('通信エラーが発生しました');
        }
    };

    const handleToggleCategoryHeader = async (name: string, current: boolean) => {
        try {
            const res = await fetch('/api/menu/categories', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldName: name, showInHeader: !current }),
            });
            if (res.ok) {
                await load();
            } else {
                const err = await res.json();
                alert(err.error || '更新に失敗しました');
            }
        } catch (e) {
            alert('通信エラーが発生しました');
        }
    };

    const handleDeleteCategory = async (name: string) => {
        if (!confirm(`分類「${name}」を削除してもよろしいですか？\nこの分類に含まれるメニューは「未分類」に移動されます。`)) return;

        try {
            const res = await fetch(`/api/menu/categories?name=${encodeURIComponent(name)}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                await load();
            } else {
                const err = await res.json();
                alert(err.error || '削除に失敗しました');
            }
        } catch (e) {
            alert('通信エラーが発生しました');
        }
    };

    const handleToggleHeader = async (widget: Widget) => {
        await fetch(`/api/menu/widget/${widget.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ showInHeader: !widget.showInHeader }),
        });
        await load();
    };

    const categories = Array.from(new Set([
        '未分類',
        ...widgets.map(w => w.categoryName).filter(Boolean),
        ...categorySettings.map(s => s.name),
        ...localCategories
    ] as string[]));

    const addCategory = () => {
        const name = prompt('新しい分類名を入力してください');
        if (name && name.trim()) {
            if (!categories.includes(name)) {
                setLocalCategories(prev => [...prev, name.trim()]);
            } else {
                alert('その分類名は既に存在します。');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mt-1">メニュー編集</h1>
                    <p className="text-gray-500 text-sm">サイドバーに表示される全社共通メニューの分類・順序設定</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={addCategory} className="flex items-center gap-2 bg-zinc-100 text-zinc-700 px-4 py-2 rounded-xl font-medium hover:bg-zinc-200 transition-colors text-sm">
                        + 分類追加
                    </button>
                    <Link href={`/admin/menu/new`} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-orange-700 transition-colors text-sm">
                        + メニュー作成
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-gray-100" />)}</div>
            ) : widgets.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
                    <p className="text-4xl mb-3">🧱</p>
                    <p>メニュー項目がありません。「メニュー作成」ボタンから作成してください。</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {categories.map(cat => {
                        const catWidgets = widgets.filter(w => (w.categoryName || '未分類') === cat);
                        const setting = categorySettings.find(s => s.name === cat);
                        const isShowInHeader = setting?.showInHeader ?? false;

                        return (
                            <div 
                                key={cat} 
                                className={`space-y-3 p-4 rounded-3xl transition-colors ${isDragOverCategory === cat ? 'bg-orange-50 ring-2 ring-orange-200' : 'bg-zinc-50/50'}`}
                                onDragOver={(e) => { e.preventDefault(); setIsDragOverCategory(cat); }}
                                onDragLeave={() => setIsDragOverCategory(null)}
                                onDrop={() => handleDrop(cat === '未分類' ? null : cat)}
                            >
                                <div className="flex items-center justify-between px-2">
                                    <h2 className="text-sm font-black text-zinc-800 flex items-center gap-2 text-orange-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                        {cat} 
                                        <span className="text-[10px] text-zinc-400 font-normal">({catWidgets.length} 項目)</span>
                                        {cat !== '未分類' && (
                                            <div className="flex items-center gap-1">
                                                <button 
                                                    onClick={() => handleRenameCategory(cat)}
                                                    className="p-1 text-zinc-400 hover:text-blue-600 transition-colors"
                                                    title="分類名を編集"
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteCategory(cat)}
                                                    className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                                                    title="分類を削除"
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        )}
                                    </h2>
                                    {cat !== '未分類' && (
                                        <button 
                                            onClick={() => handleToggleCategoryHeader(cat, isShowInHeader)}
                                            className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border ${isShowInHeader ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white border-zinc-200 text-zinc-400 hover:border-zinc-300'}`}
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                            </svg>
                                            {isShowInHeader ? 'サイドバーに分類を表示' : 'サイドバーに分類を表示しない'}
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {catWidgets.length === 0 ? (
                                        <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-6 text-center text-zinc-400 text-xs">
                                            ここに項目をドラッグしてグループに追加
                                        </div>
                                    ) : (
                                        catWidgets.map((w) => (
                                            <div 
                                                key={w.id} 
                                                draggable 
                                                onDragStart={() => handleDragStart(w.id)}
                                                className={`bg-white rounded-2xl border p-4 transition-all shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md ${w.isPublished ? 'border-green-100' : 'border-gray-100 opacity-60 grayscale'}`}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="text-zinc-300">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                                                        </div>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${typeColors[w.type] ?? 'bg-gray-100 text-gray-600'}`}>
                                                            {typeLabels[w.type]}
                                                        </span>
                                                        <Link href={`/admin/menu/widget/${w.id}`} className="font-bold text-gray-900 truncate hover:text-blue-600">
                                                            {w.title}
                                                        </Link>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {(w.type === 'SURVEY' || w.type === 'ATTENDANCE' || w.type === 'CHECKLIST' || w.type === 'BOARD') && (
                                                            <Link 
                                                                href={`/admin/menu/widget/${w.id}/responses`}
                                                                className="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                                                                title="回答・集計を確認"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                                                集計
                                                            </Link>
                                                        )}
                                                        <button onClick={() => handleToggleHeader(w)}
                                                            className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${w.showInHeader ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                                            {w.showInHeader ? 'サイドバー表示中' : 'サイドバー非表示'}
                                                        </button>
                                                        <button onClick={() => handleTogglePublish(w)}
                                                            className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${w.isPublished ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                                            {w.isPublished ? '公開中' : '非公開'}
                                                        </button>
                                                        <button onClick={() => handleDelete(w.id)} className="text-zinc-400 hover:text-red-600 p-1.5 rounded-xl hover:bg-red-50 transition-colors">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
