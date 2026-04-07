'use client';

import { useEffect, useState, useRef } from 'react';

interface MasterData {
    id: number;
    category: string;
    code: string;
    name: string;
    sortOrder: number;
    isNonUnion: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
    user_role: 'ロール（権限）',
    employment_type: '雇用区分',
    union_role: '役員区分',
    branch_officer: '支部役員',
    announcement_category: 'お知らせカテゴリ',
    inquiry_category: '相談員カテゴリ',
    inquiry_destination: '相談先区分',
    importance_level: '重要度区分',
    job_title: '職務'
};

export default function CategoryMasterPage() {
    const [data, setData] = useState<MasterData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('user_role');
    const [newForm, setNewForm] = useState({ code: '', name: '', sortOrder: 0, isNonUnion: false });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [csvResult, setCsvResult] = useState<{ success: number; errors: { row: number; message: string }[] } | null>(null);
    const [csvImporting, setCsvImporting] = useState(false);
    const csvRef = useRef<HTMLInputElement>(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/master-data');
            if (!res.ok) throw new Error();
            const json = await res.json();
            setData(json.data ?? []);
        } catch {
            setError('データの読み込みに失敗しました');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newForm.code || !newForm.name) {
            setError('コードと表示名は必須です');
            return;
        }
        setError('');
        setSubmitting(true);

        const res = await fetch('/api/admin/master-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newForm, category: selectedCategory })
        });

        if (!res.ok) {
            const json = await res.json();
            setError(json.error || '保存に失敗しました');
            setSubmitting(false);
            return;
        }

        setNewForm({ code: '', name: '', sortOrder: newForm.sortOrder + 1, isNonUnion: false });
        setSubmitting(false);
        load();
    };

    const handleEditSave = async (item: MasterData, newName: string, newSort: number, newIsNonUnion?: boolean) => {
        const res = await fetch(`/api/admin/master-data/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name: newName, 
                sortOrder: newSort, 
                isNonUnion: newIsNonUnion ?? item.isNonUnion 
            })
        });
        if (res.ok) load();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('削除してもよろしいですか？')) return;
        await fetch(`/api/admin/master-data/${id}`, { method: 'DELETE' });
        load();
    };

    const handleDeleteAll = async () => {
        const label = CATEGORY_LABELS[selectedCategory];
        if (!confirm(`【警告】${label}の全データを削除します。よろしいですか？`)) return;
        
        setError('');
        const res = await fetch(`/api/admin/master-data?category=${selectedCategory}`, { method: 'DELETE' });
        if (res.ok) {
            load();
        } else {
            const data = await res.json();
            setError(data.error || '一括削除に失敗しました');
        }
    };

    const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCsvImporting(true);
        setCsvResult(null);
        setError('');
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch(`/api/admin/master-data/csv?category=${selectedCategory}`, { method: 'POST', body: fd });
            const data = await res.json();
            if (data.data) {
                setCsvResult(data.data);
                load();
            } else if (data.error) {
                setError(data.error);
            }
        } catch (err) {
            setError('通信エラーが発生しました');
        } finally {
            setCsvImporting(false);
            e.target.value = '';
        }
    };

    const downloadTemplate = () => {
        const header = 'コード,表示名,順序\n';
        const sample = 'NEW_ITEM,新項目,1\n';
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, header + sample], { type: 'text/csv;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `template_${selectedCategory}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filtered = data.filter(item => item.category === selectedCategory);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">カテゴリー・区分管理</h1>
                    <p className="text-gray-500 text-sm">各画面の選択肢を一覧のまま直接編集・追加できます。</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={downloadTemplate} className="flex items-center gap-2 border border-gray-200 text-gray-400 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all">
                        📄 雛形
                    </button>
                    <button onClick={handleDeleteAll} className="flex items-center gap-2 border border-red-200 text-red-500 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-all">
                        🗑️ 全削除
                    </button>
                    <button onClick={() => csvRef.current?.click()} className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200">
                        📥 CSV取込
                    </button>
                    <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                </div>
            </div>

            {csvImporting && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[100] flex items-center justify-center">
                    <div className="bg-white px-8 py-6 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin"></div>
                        <div className="flex flex-col items-center">
                            <p className="text-gray-900 font-bold">CSVデータ取込中</p>
                            <p className="text-gray-400 text-[10px] font-medium uppercase tracking-widest mt-1">Please wait while processing</p>
                        </div>
                    </div>
                </div>
            )}

            {csvResult && (
                <div className={`p-4 rounded-2xl border text-sm animate-in slide-in-from-top-2 duration-300 ${csvResult.errors.length > 0 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                    <p className="font-bold flex items-center gap-2">
                        {csvResult.errors.length > 0 ? '⚠️' : '✅'}
                        {csvResult.success}件の取込に成功しました {csvResult.errors.length > 0 && `（${csvResult.errors.length}件のエラー）`}
                    </p>
                    {csvResult.errors.slice(0, 5).map(err => (
                        <p key={err.row} className="text-xs text-red-600 mt-2 pl-6">行{err.row}: {err.message}</p>
                    ))}
                    <button onClick={() => setCsvResult(null)} className="mt-3 text-[10px] font-bold uppercase tracking-widest underline opacity-50 hover:opacity-100 transition-opacity">結果を閉じる</button>
                </div>
            )}

            <div className="flex flex-wrap gap-2 p-1 bg-gray-100/80 rounded-2xl w-fit">
                {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedCategory === cat ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {error && <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl animate-in fade-in slide-in-from-top-1">{error}</div>}

            <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="text-left px-6 py-4 font-bold text-gray-400 uppercase tracking-widest text-[10px]">コード（固定）</th>
                            <th className="text-left px-6 py-4 font-bold text-gray-400 uppercase tracking-widest text-[10px]">表示名</th>
                            {(selectedCategory === 'job_title' || selectedCategory === 'employment_type' || selectedCategory === 'union_role') && (
                                <th className="text-left px-6 py-4 font-bold text-gray-400 uppercase tracking-widest text-[10px] w-28">非組合員</th>
                            )}
                            <th className="text-left px-6 py-4 font-bold text-gray-400 uppercase tracking-widest text-[10px] w-24">順序</th>
                            <th className="text-center px-6 py-4 font-bold text-gray-400 uppercase tracking-widest text-[10px] w-20">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading && filtered.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-300 animate-pulse font-bold">読み込み中...</td></tr>
                        ) : (
                            <>
                                {filtered.map(item => (
                                    <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-mono text-gray-500">{item.code}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input 
                                                type="text" 
                                                defaultValue={item.name}
                                                onBlur={(e) => {
                                                    if (e.target.value !== item.name) {
                                                        handleEditSave(item, e.target.value, item.sortOrder);
                                                    }
                                                }}
                                            />
                                        </td>
                                        {(selectedCategory === 'job_title' || selectedCategory === 'employment_type' || selectedCategory === 'union_role') && (
                                            <td className="px-6 py-4 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={item.isNonUnion}
                                                    onChange={(e) => {
                                                        handleEditSave(item, item.name, item.sortOrder, e.target.checked);
                                                    }}
                                                    className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                />
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <input 
                                                type="number" 
                                                defaultValue={item.sortOrder}
                                                onBlur={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    if (val !== item.sortOrder) {
                                                        handleEditSave(item, item.name, val);
                                                    }
                                                }}
                                                className="w-16 bg-transparent border-none focus:ring-2 focus:ring-orange-500/10 rounded-lg px-2 py-1 text-gray-500 outline-none hover:bg-white"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => handleDelete(item.id)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-xl transition-all text-gray-300 hover:text-red-500">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {/* Create Inline Row */}
                                <tr className="bg-orange-50/30 border-t-2 border-orange-100">
                                    <td className="px-6 py-4">
                                        <input 
                                            type="text" 
                                            placeholder="NEW_CODE"
                                            value={newForm.code}
                                            onChange={e => setNewForm({ ...newForm, code: e.target.value.toUpperCase() })}
                                            className="w-full px-3 py-2 bg-white border border-orange-200 rounded-xl text-xs font-mono placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-orange-500/20"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="text" 
                                            placeholder="新しい項目名を入力..."
                                            value={newForm.name}
                                            onChange={e => setNewForm({ ...newForm, name: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-orange-200 rounded-xl font-bold placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-orange-500/20"
                                        />
                                    </td>
                                    {(selectedCategory === 'job_title' || selectedCategory === 'employment_type' || selectedCategory === 'union_role') && (
                                        <td className="px-6 py-4 text-center">
                                            <input 
                                                type="checkbox" 
                                                checked={newForm.isNonUnion}
                                                onChange={e => setNewForm({ ...newForm, isNonUnion: e.target.checked })}
                                                className="w-5 h-5 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                                            />
                                        </td>
                                    )}
                                    <td className="px-6 py-4">
                                        <input 
                                            type="number" 
                                            value={newForm.sortOrder}
                                            onChange={e => setNewForm({ ...newForm, sortOrder: parseInt(e.target.value) || 0 })}
                                            className="w-16 px-3 py-2 bg-white border border-orange-200 rounded-xl text-gray-600 outline-none focus:ring-2 focus:ring-orange-500/20"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={handleAdd}
                                            disabled={submitting || !newForm.code || !newForm.name}
                                            className="p-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-30 transition-all shadow-md shadow-orange-200 flex items-center justify-center mx-auto"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>
            </div>
            <p className="text-[10px] text-gray-400 px-4">※表示名と順序は入力後にフォーカスを外すと自動で保存されます。削除は右側のゴミ箱ボタンで行います。</p>
        </div>
    );
}
