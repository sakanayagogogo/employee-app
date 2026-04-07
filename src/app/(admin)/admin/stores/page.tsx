'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';

interface StoreGroup {
    id: number;
    name: string;
    sortOrder: number;
}

interface Store {
    id: number;
    name: string;
    code: string;
    groupId: number | null;
    groupName: string | null;
    address: string | null;
    isActive: boolean;
}

export default function AdminStoresPage() {
    const [groups, setGroups] = useState<StoreGroup[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Forms
    const [showStoreForm, setShowStoreForm] = useState(false);
    const [showGroupForm, setShowGroupForm] = useState(false);
    const [editStoreId, setEditStoreId] = useState<number | null>(null);
    const [editGroupId, setEditGroupId] = useState<number | null>(null);
    
    const [storeForm, setStoreForm] = useState({ name: '', code: '', groupId: '', address: '', isActive: true });
    const [groupForm, setGroupForm] = useState({ name: '', sortOrder: 0 });
    
    const [submitting, setSubmitting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [csvResult, setCsvResult] = useState<{ success: number; errors: { row: number; message: string }[] } | null>(null);
    const [error, setError] = useState('');
    
    const [draggedStoreId, setDraggedStoreId] = useState<number | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

    const load = useCallback(async () => {
        const [gRes, sRes] = await Promise.all([
            fetch('/api/admin/store-groups'),
            fetch('/api/admin/stores'),
        ]);
        const [gData, sData] = await Promise.all([gRes.json(), sRes.json()]);
        setGroups(gData.data ?? []);
        setStores(sData.data ?? []);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    // --- Store Operations ---
    const handleStoreSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        const payload = { 
            ...storeForm, 
            groupId: storeForm.groupId ? parseInt(storeForm.groupId) : null 
        };
        
        const url = editStoreId ? `/api/admin/stores/${editStoreId}` : '/api/admin/stores';
        const method = editStoreId ? 'PATCH' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? 'エラー'); setSubmitting(false); return; }
        
        setShowStoreForm(false);
        setEditStoreId(null);
        setStoreForm({ name: '', code: '', groupId: '', address: '', isActive: true });
        await load();
        setSubmitting(false);
    };

    const handleEditStore = (s: Store) => {
        setStoreForm({
            name: s.name,
            code: s.code,
            groupId: s.groupId?.toString() || '',
            address: s.address || '',
            isActive: s.isActive,
        });
        setEditStoreId(s.id);
        setShowStoreForm(true);
    };

    const handleDeleteStore = async (id: number) => {
        if (!confirm('この店舗を削除してもよろしいですか？')) return;
        const res = await fetch(`/api/admin/stores/${id}`, { method: 'DELETE' });
        if (res.ok) await load();
        else {
            const data = await res.json();
            alert(data.error || '削除に失敗しました');
        }
    };

    const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        setCsvResult(null);
        setError('');
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch('/api/admin/stores/csv', { method: 'POST', body: fd });
            const data = await res.json();
            if (data.data) {
                setCsvResult(data.data);
                await load();
            } else if (data.error) {
                setError(data.error);
            }
        } catch (err) {
            setError('通信エラーが発生しました');
        } finally {
            setImporting(false);
            e.target.value = '';
        }
    };

    const downloadTemplate = () => {
        const header = '店舗コード,店舗名,グループ表示順\n';
        const sample = 'S001,新宿店,1\n';
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, header + sample], { type: 'text/csv;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'store_import_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Group Operations ---
    const handleGroupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        const url = editGroupId ? `/api/admin/store-groups/${editGroupId}` : '/api/admin/store-groups';
        const method = editGroupId ? 'PATCH' : 'POST';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(groupForm),
        });
        if (!res.ok) { const data = await res.json(); setError(data.error ?? 'エラー'); setSubmitting(false); return; }
        setShowGroupForm(false);
        setEditGroupId(null);
        setGroupForm({ name: '', sortOrder: 0 });
        await load();
        setSubmitting(false);
    };

    const handleEditGroup = (g: StoreGroup) => {
        setGroupForm({ name: g.name, sortOrder: g.sortOrder });
        setEditGroupId(g.id);
        setShowGroupForm(true);
    };

    const handleDeleteGroup = async (id: number) => {
        if (!confirm('このグループを削除しますか？\n所属店舗は「未設定」になります。')) return;
        const res = await fetch(`/api/admin/store-groups/${id}`, { method: 'DELETE' });
        if (res.ok) await load();
    };

    // --- Drag & Drop ---
    const handleMoveStore = async (storeId: number, targetGroupId: number | null) => {
        const res = await fetch(`/api/admin/stores/${storeId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId: targetGroupId }),
        });
        if (res.ok) {
            setStores(prev => prev.map(s => s.id === storeId ? { ...s, groupId: targetGroupId } : s));
        }
    };

    const onDragStart = (e: React.DragEvent, id: number) => { setDraggedStoreId(id); };
    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); };
    const onDrop = async (e: React.DragEvent, groupId: number | null) => {
        e.preventDefault();
        if (draggedStoreId !== null) {
            await handleMoveStore(draggedStoreId, groupId);
            setDraggedStoreId(null);
        }
    };

    const toggleGroup = (id: number) => {
        setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const storeCounts = useMemo(() => {
        const counts: Record<number | string, number> = { 'unassigned': 0 };
        stores.forEach(s => {
            if (s.groupId === null) counts['unassigned']++;
            else counts[s.groupId] = (counts[s.groupId] || 0) + 1;
        });
        return counts;
    }, [stores]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">店舗管理</h1>
                    <p className="text-gray-500 text-sm">店舗の追加、グループ分け（ドラッグ＆ドロップ）、CSV一括登録</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={downloadTemplate} className="flex items-center gap-2 border border-zinc-200 text-zinc-400 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-50 transition-all">
                        📄 雛形
                    </button>
                    <label className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors text-sm cursor-pointer border ${importing ? 'bg-zinc-100 text-zinc-400' : 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800 shadow-lg shadow-zinc-200'}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        {importing ? '中...' : 'CSVインポート'}
                        <input type="file" accept=".csv" onChange={handleCsvUpload} disabled={importing} className="hidden" />
                    </label>
                    <button onClick={() => { setEditGroupId(null); setGroupForm({ name: '', sortOrder: 0 }); setShowGroupForm(true); }} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold hover:bg-emerald-100 transition-colors text-sm border border-emerald-100">
                        + グループ作成
                    </button>
                    <button onClick={() => { setEditStoreId(null); setStoreForm({ name: '', code: '', groupId: '', address: '', isActive: true }); setShowStoreForm(true); }} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-700 transition-colors text-sm shadow-lg shadow-orange-600/20">
                        + 店舗追加
                    </button>
                </div>
            </div>

            {csvResult && (
                <div className={`p-4 rounded-2xl border text-sm animate-in slide-in-from-top-2 duration-300 ${csvResult.errors.length > 0 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                    <p className="font-bold flex items-center gap-2">
                        {csvResult.errors.length > 0 ? '⚠️' : '✅'}
                        {csvResult.success}件の取込に成功しました {csvResult.errors.length > 0 && `（${csvResult.errors.length}件のエラー）`}
                    </p>
                    {csvResult.errors.slice(0, 5).map((err, idx) => (
                        <p key={idx} className="text-xs text-red-600 mt-2 pl-6">行{err.row}: {err.message}</p>
                    ))}
                    <button onClick={() => setCsvResult(null)} className="mt-3 text-[10px] font-bold uppercase tracking-widest underline opacity-50 hover:opacity-100 transition-opacity">結果を閉じる</button>
                </div>
            )}

            {/* Store Modal */}
            {showStoreForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black">{editStoreId ? '店舗編集' : '店舗追加'}</h2>
                            <button onClick={() => setShowStoreForm(false)} className="text-gray-400 hover:text-gray-600 p-2">✕</button>
                        </div>
                        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl">{error}</div>}
                        <form onSubmit={handleStoreSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">店舗コード</label>
                                <input type="text" value={storeForm.code} onChange={e => setStoreForm({ ...storeForm, code: e.target.value })} required className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" placeholder="TOKYO01" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">店舗名</label>
                                <input type="text" value={storeForm.name} onChange={e => setStoreForm({ ...storeForm, name: e.target.value })} required className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">グループ</label>
                                <select value={storeForm.groupId} onChange={e => setStoreForm({ ...storeForm, groupId: e.target.value })} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold outline-none">
                                    <option value="">未設定</option>
                                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowStoreForm(false)} className="flex-1 py-4 border border-zinc-200 rounded-2xl text-sm font-bold text-gray-600">キャンセル</button>
                                <button type="submit" disabled={submitting} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl text-sm font-black disabled:opacity-50">保存</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Group Modal */}
            {showGroupForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black">{editGroupId ? 'グループ編集' : 'グループ作成'}</h2>
                            <button onClick={() => setShowGroupForm(false)} className="text-gray-400 hover:text-gray-600 p-2">✕</button>
                        </div>
                        <form onSubmit={handleGroupSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">グループ名</label>
                                <input type="text" value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} required className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">表示順（番号）</label>
                                <input type="number" value={groupForm.sortOrder} onChange={e => setGroupForm({ ...groupForm, sortOrder: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold outline-none" />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowGroupForm(false)} className="flex-1 py-4 border border-zinc-200 rounded-2xl text-sm font-bold text-gray-600">キャンセル</button>
                                <button type="submit" disabled={submitting} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-sm font-black disabled:opacity-50">保存</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Drag Source: Unassigned */}
                <div 
                    onDragOver={onDragOver} 
                    onDrop={(e) => onDrop(e, null)}
                    className={`lg:col-span-1 bg-zinc-50 rounded-[40px] p-6 border-2 border-dashed border-zinc-200 transition-all h-fit sticky top-8 ${draggedStoreId !== null ? 'border-zinc-400 bg-zinc-100' : ''}`}
                >
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                             <span className="w-2.5 h-2.5 bg-zinc-300 rounded-full"></span>
                             未設定
                        </h3>
                        <span className="text-[10px] font-black bg-zinc-200 text-zinc-500 px-2 py-0.5 rounded-lg">{storeCounts['unassigned']} 店舗</span>
                    </div>
                    <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                        {stores.filter(s => s.groupId === null).map(s => (
                            <div
                                key={s.id}
                                draggable
                                onDragStart={(e) => onDragStart(e, s.id)}
                                onClick={() => handleEditStore(s)}
                                className={`bg-white p-4 rounded-[24px] shadow-sm border border-zinc-100 cursor-grab active:cursor-grabbing hover:shadow-xl transition-all group ${draggedStoreId === s.id ? 'opacity-30' : ''}`}
                            >
                                <div className="flex items-center justify-between group/tile">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center text-xl group-hover:bg-emerald-50 transition-colors">🏪</div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-zinc-400 mb-0.5">{s.code}</span>
                                            <span className="text-sm font-bold text-gray-800">{s.name}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover/tile:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); handleEditStore(s); }} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-emerald-600 transition-colors">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteStore(s.id); }} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-red-500 transition-colors">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Drop Targets: Groups */}
                <div className="lg:col-span-3 space-y-4">
                    {groups.map(g => {
                        const isExpanded = expandedGroups[g.id];
                        const count = storeCounts[g.id] || 0;
                        return (
                            <div 
                                key={g.id}
                                onDragOver={onDragOver}
                                onDrop={(e) => onDrop(e, g.id)}
                                className={`bg-white rounded-[32px] border-2 transition-all overflow-hidden ${draggedStoreId !== null ? 'border-emerald-200 bg-emerald-50/10' : 'border-zinc-50 shadow-sm'}`}
                            >
                                <div 
                                    onClick={() => toggleGroup(g.id)}
                                    className="p-5 flex items-center justify-between cursor-pointer group/header"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-black text-xs ring-1 ring-emerald-100">
                                            {g.sortOrder}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-gray-900">{g.name}</h3>
                                            <span className="bg-emerald-100/50 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                                                {count} 店舗
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                            <button onClick={(e) => { e.stopPropagation(); handleEditGroup(g); }} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-400 hover:text-emerald-600">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.id); }} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-400 hover:text-red-500">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                        <div className={`p-1.5 rounded-full transition-transform ${isExpanded ? 'rotate-180 bg-zinc-900 text-white' : 'text-zinc-400'}`}>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-5 pb-6 pt-2 animate-in slide-in-from-top-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[80px] bg-zinc-50/50 rounded-[24px] p-4 border border-dashed border-zinc-200">
                                            {stores.filter(s => s.groupId === g.id).map(s => (
                                                <div
                                                    key={s.id}
                                                    draggable
                                                    onDragStart={(e) => onDragStart(e, s.id)}
                                                    onClick={() => handleEditStore(s)}
                                                    className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group flex items-center justify-between"
                                                >
                                                    <div className="flex items-center justify-between w-full group/tile">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] font-black text-emerald-600/50 mb-0.5">{s.code}</span>
                                                                <span className="text-sm font-bold text-gray-800">{s.name}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover/tile:opacity-100 transition-opacity">
                                                            <button onClick={(e) => { e.stopPropagation(); handleEditStore(s); }} className="p-1.5 hover:bg-emerald-50 rounded-lg text-zinc-400 hover:text-emerald-600 transition-colors">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteStore(s.id); }} className="p-1.5 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-500 transition-colors">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {stores.filter(s => s.groupId === g.id).length === 0 && (
                                                <div className="col-span-full h-full flex items-center justify-center py-6 text-zinc-300 text-[10px] font-black uppercase tracking-widest">ドラッグして追加</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
