'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
    id: number;
    employeeNumber: string;
    name: string;
    email: string | null;
    role: string;
    storeId: number | null;
    storeName: string | null;
    employmentType: string;
    unionRole: string;
    unionRoleBranch: string | null;
    jobTitle: string | null;
    isNonUnion: boolean;
    birthday: string | null;
    isActive: boolean;
    lastLoginAt: string | null;
}

interface Store {
    id: number;
    name: string;
    code: string;
    groupId: number | null;
    groupName: string | null;
}

type TreeFilter = 
    | { type: 'all' }
    | { type: 'hq' }
    | { type: 'group'; id: number; name: string }
    | { type: 'store'; id: number; name: string };

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [csvResult, setCsvResult] = useState<{ success: number; errors: { row: number; message: string }[] } | null>(null);
    const [csvImporting, setCsvImporting] = useState(false);
    const [currentProgress, setCurrentProgress] = useState<{ current: number; total: number } | null>(null);
    const [filter, setFilter] = useState<TreeFilter>({ type: 'all' });
    const [selectedUnionRole, setSelectedUnionRole] = useState('');
    const [selectedBranchOfficer, setSelectedBranchOfficer] = useState('');
    const [selectedEmploymentType, setSelectedEmploymentType] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<number[]>([]);
    const [masters, setMasters] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 50;
    const csvRef = useRef<HTMLInputElement>(null);

    const toggleGroup = (id: number) => {
        setExpandedGroups(prev => prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]);
    };

    const load = async (currentFilter: TreeFilter = filter, currentOffset: number = 0) => {
        setError(null);
        setLoading(true);
        try {
            let url = `/api/admin/users?search=${encodeURIComponent(search)}&limit=${LIMIT}&offset=${currentOffset}`;
            if (currentFilter.type === 'hq') url += '&storeId=hq';
            else if (currentFilter.type === 'store') url += `&storeId=${currentFilter.id}`;
            else if (currentFilter.type === 'group') url += `&groupId=${currentFilter.id}`;
            
            if (selectedUnionRole) url += `&unionRole=${selectedUnionRole}`;
            if (selectedBranchOfficer) url += `&unionRoleBranch=${selectedBranchOfficer}`;
            if (selectedEmploymentType) url += `&employmentType=${selectedEmploymentType}`;

            const [uRes, sRes, mRes] = await Promise.all([
                fetch(url),
                fetch('/api/admin/stores'),
                fetch('/api/admin/master-data'),
            ]);

            if (!uRes.ok || !sRes.ok || !mRes.ok) {
                throw new Error('データの取得に失敗しました');
            }

            const [u, s, m] = await Promise.all([uRes.json(), sRes.json(), mRes.json()]);

            const newUsers = u.data ?? [];
            setUsers(prev => currentOffset === 0 ? newUsers : [...prev, ...newUsers]);
            setHasMore(newUsers.length === LIMIT);
            setStores(s.data ?? []);
            setMasters(m.data ?? []);
            setOffset(currentOffset);
        } catch (err: any) {
            console.error(err);
            setError(err.message || '通信エラーが発生しました。ページを再読み込みしてください。');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(filter, 0); }, [filter, selectedUnionRole, selectedBranchOfficer, selectedEmploymentType]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleLoadMore = () => {
        if (loading || !hasMore) return;
        load(filter, offset + LIMIT);
    };

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(filter, 0); };

    const handleToggleActive = async (id: number, current: boolean) => {
        await fetch(`/api/admin/users/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !current }),
        });
        await load();
    };

    const handleDeleteUser = async (id: number, name: string) => {
        if (!confirm(`${name}さんをシステムから削除します。よろしいですか？\n※関連データがある場合はエラーになります。`)) return;
        const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) {
            alert(data.error || '削除に失敗しました');
        } else {
            await load();
        }
    };

    const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCsvImporting(true);
        setCsvResult(null);
        setCurrentProgress(null);
        
        try {
            // Read file to count lines for initial progress display
            const text = await file.text();
            const totalLines = text.split('\n').filter(line => line.trim()).length;
            const totalRecords = totalLines > 1 ? totalLines - 1 : 0;
            
            // Set initial total count
            setCurrentProgress({ current: 0, total: totalRecords });

            const fd = new FormData();
            fd.append('file', file);
            
            const res = await fetch('/api/admin/users/csv', { method: 'POST', body: fd });
            
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'サーバーエラーが発生しました');
            }

            if (!res.body) throw new Error('レスポンスの読み出しに失敗しました');
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    // Process remaining buffer
                    if (buffer.trim()) {
                        const msg = JSON.parse(buffer);
                        if (msg.type === 'result') setCsvResult(msg.data);
                        else if (msg.error) alert(msg.error);
                    }
                    break;
                }
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const msg = JSON.parse(line);
                        if (msg.type === 'progress') {
                            setCurrentProgress({ current: msg.current, total: totalRecords });
                        } else if (msg.type === 'result') {
                            setCsvResult(msg.data);
                            await load();
                        } else if (msg.error) {
                            alert(msg.error);
                        }
                    } catch (e) {
                        console.error('Line parse error:', line);
                    }
                }
            }
        } catch (err: any) {
            console.error(err);
            alert(err.message || '通信エラーが発生しました。');
        } finally {
            setCsvImporting(false);
            setCurrentProgress(null);
            e.target.value = '';
        }
    };

    const downloadTemplate = () => {
        const header = '社員番号,氏名,メールアドレス,権限,役員区分,職務,雇用区分,店舗コード,生年月日,パスワード\n';
        const sample = '1001,山田 太郎,yamada@example.com,GENERAL,MEMBER,STAFF,EMPLOYEE,S001,1990-01-01,\n';
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), header + sample], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'user_import_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Grouping stores by groupName
    const groups = stores.reduce((acc, s) => {
        if (!s.groupId) return acc;
        const existing = acc.find(g => g.id === s.groupId);
        if (existing) {
            existing.stores.push(s);
        } else {
            acc.push({ id: s.groupId, name: s.groupName || '未分類', stores: [s] });
        }
        return acc;
    }, [] as { id: number; name: string; stores: Store[] }[]);

    return (
        <div className="flex gap-6 items-start min-h-[600px]">
            {/* Tree Sidebar */}
            <div className="w-48 flex-shrink-0 bg-white rounded-3xl border border-gray-100 p-4 sticky top-6 max-h-[calc(100vh-120px)] overflow-y-auto shadow-sm">
                <div className="space-y-1">
                    <button 
                        onClick={() => setFilter({ type: 'all' })}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${filter.type === 'all' ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <span>🏢</span> 全ユーザー
                    </button>
                    <button 
                        onClick={() => setFilter({ type: 'hq' })}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${filter.type === 'hq' ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <span>🏛️</span> 本部
                    </button>

                    <div className="pt-4 pb-2 px-3 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                        店舗・グループ
                    </div>

                    {groups.map(g => (
                        <div key={g.id} className="space-y-1">
                            <div className={`flex items-center gap-1 rounded-xl transition-all ${filter.type === 'group' && filter.id === g.id ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <button 
                                    onClick={() => toggleGroup(g.id)}
                                    className="p-2 text-[10px] hover:bg-black/10 rounded-lg transition-colors"
                                >
                                    {expandedGroups.includes(g.id) ? '▼' : '▶'}
                                </button>
                                <button 
                                    onClick={() => setFilter({ type: 'group', id: g.id, name: g.name })}
                                    className="flex-1 flex items-center gap-2 py-2 pr-3 text-sm font-bold text-left"
                                >
                                    <span>📁</span> {g.name}
                                </button>
                            </div>
                            {expandedGroups.includes(g.id) && (
                                <div className="pl-6 space-y-1 animate-in slide-in-from-top-1 duration-200">
                                    {g.stores.map(s => (
                                        <button 
                                            key={s.id}
                                            onClick={() => setFilter({ type: 'store', id: s.id, name: s.name })}
                                            className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter.type === 'store' && filter.id === s.id ? 'bg-orange-50 text-orange-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            <span className="opacity-50">📍</span> {s.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 space-y-6">
                {csvImporting && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center">
                        <div className="bg-white px-10 py-10 rounded-[40px] shadow-2xl border border-gray-100 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300 max-w-sm w-full mx-4">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-orange-50 border-t-orange-600 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center text-xl">⏳</div>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <p className="text-gray-900 text-xl font-black tracking-tight">CSVデータ取込中</p>
                                {currentProgress ? (
                                    <div className="mt-4 w-full space-y-2">
                                        <p className="text-orange-600 font-bold text-lg">
                                            {currentProgress.current} / {currentProgress.total} 件目を処理中
                                        </p>
                                        <p className="text-gray-400 text-xs font-medium uppercase tracking-[0.2em] animate-pulse">
                                            Optimizing database operations...
                                        </p>
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-6 relative">
                                            <div 
                                                className="h-full bg-orange-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                                                style={{ width: `${currentProgress.total > 0 ? (currentProgress.current / currentProgress.total * 100) : 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-xs font-medium uppercase tracking-widest mt-2">Please wait while processing</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {filter.type === 'all' ? 'ユーザー管理' : 
                             filter.type === 'hq' ? '本部スタッフ' : 
                             (filter.type === 'group' || filter.type === 'store') ? filter.name : ''}
                        </h1>
                        <p className="text-gray-500 text-sm">
                            {filter.type === 'all' ? '全ユーザーを表示中' : 
                             filter.type === 'hq' ? '本部スタッフを表示中' : 
                             (filter.type === 'group' || filter.type === 'store') ? `${filter.name}のスタッフを表示中` : ''}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={downloadTemplate} className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                            📄 テンプレート
                        </button>
                        <button onClick={() => csvRef.current?.click()} className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                            📥 CSV取込
                        </button>
                        <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                        <Link href="/admin/users/new" className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 text-sm">
                            + 新規登録
                        </Link>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="space-y-4">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="社員番号・氏名で検索"
                            className="flex-1 px-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 shadow-sm transition-all"
                        />
                        <button type="submit" className="px-6 py-3 bg-gray-900 text-white rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all shadow-md active:scale-95">検索</button>
                    </form>
                    
                    <div className="flex flex-wrap gap-2">
                        <select 
                            value={selectedEmploymentType} 
                            onChange={e => setSelectedEmploymentType(e.target.value)}
                            className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                        >
                            <option value="">雇用区分: 全て</option>
                            {masters.filter(m => m.category === 'employment_type').map(m => (
                                <option key={m.code} value={m.code}>{m.name}</option>
                            ))}
                        </select>

                        <select 
                            value={selectedUnionRole} 
                            onChange={e => setSelectedUnionRole(e.target.value)}
                            className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                        >
                            <option value="">役員区分: 全て</option>
                            {masters.filter(m => m.category === 'union_role').map(m => (
                                <option key={m.code} value={m.code}>{m.name}</option>
                            ))}
                        </select>

                        <select 
                            value={selectedBranchOfficer} 
                            onChange={e => setSelectedBranchOfficer(e.target.value)}
                            className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                        >
                            <option value="">支部役員: 全て</option>
                            {masters.filter(m => m.category === 'branch_officer').map(m => (
                                <option key={m.code} value={m.code}>{m.name}</option>
                            ))}
                        </select>

                        {(selectedUnionRole || selectedBranchOfficer || selectedEmploymentType) && (
                            <button 
                                onClick={() => { setSelectedUnionRole(''); setSelectedBranchOfficer(''); setSelectedEmploymentType(''); }}
                                className="px-4 py-2 text-[10px] font-bold text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
                            >
                                ✕ フィルター解除
                            </button>
                        )}
                    </div>
                </div>

                {/* CSV result */}
                {csvResult && (
                    <div className={`p-4 rounded-2xl border text-sm animate-in slide-in-from-top-2 duration-300 ${csvResult.errors.length > 0 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                        <p className="font-bold flex items-center gap-2">
                            {csvResult.errors.length > 0 ? '⚠️' : '✅'}
                            {csvResult.success}件の取込に成功しました {csvResult.errors.length > 0 && `（${csvResult.errors.length}件のエラー）`}
                        </p>
                        {csvResult.errors.slice(0, 5).map(err => (
                            <p key={err.row} className="text-xs text-red-600 mt-2 pl-6">行{err.row}: {err.message}</p>
                        ))}
                        <button onClick={() => setCsvResult(null)} className="mt-3 text-xs font-bold underline opacity-50 hover:opacity-100 transition-opacity">結果を閉じる</button>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="p-20 text-center flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-4 border-gray-100 border-t-orange-500 rounded-full animate-spin"></div>
                            <p className="text-gray-400 font-bold animate-pulse">データを読み込み中...</p>
                        </div>
                    ) : error ? (
                        <div className="p-20 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xl">⚠️</div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">読み込みに失敗しました</h3>
                                <p className="text-sm text-gray-500 mt-1">{error}</p>
                            </div>
                            <button 
                                onClick={() => load()}
                                className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all"
                            >
                                再試行する
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="text-left px-6 py-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider">社員番号</th>
                                    <th className="text-left px-6 py-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider">氏名</th>
                                    <th className="text-left px-6 py-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider">職務 / 組合属性</th>
                                    <th className="text-left px-6 py-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider">店舗</th>
                                    <th className="text-left px-6 py-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider">状態</th>
                                    <th className="text-right px-6 py-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.map(u => (
                                    <tr key={u.id} className={`group transition-colors ${!u.isActive ? 'bg-gray-50/50' : 'hover:bg-orange-50/30'}`}>
                                        <td className="px-6 py-4 font-mono text-gray-400 text-xs">{u.employeeNumber}</td>
                                        <td className="px-6 py-4">
                                            <Link 
                                                href={`/admin/users/${u.id}`}
                                                className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors"
                                            >
                                                {u.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="text-xs font-bold text-gray-900 leading-tight">
                                                    {u.jobTitle ? (masters.find(m => m.category === 'job_title' && String(m.code) === String(u.jobTitle))?.name || u.jobTitle) : '職務なし'}
                                                </div>
                                                <div className="flex flex-wrap gap-1 items-center">
                                                    <span className="inline-flex px-1.5 py-0.5 rounded bg-gray-100 text-[9px] text-gray-500 font-bold border border-gray-200">
                                                        {masters.find(m => m.category === 'employment_type' && String(m.code) === String(u.employmentType))?.name || u.employmentType}
                                                    </span>
                                                    <span className="inline-flex px-1.5 py-0.5 rounded bg-orange-50 text-[9px] text-orange-600 font-bold border border-orange-100">
                                                        {masters.find(m => m.category === 'union_role' && String(m.code) === String(u.unionRole))?.name || u.unionRole}
                                                    </span>
                                                    {u.unionRoleBranch && (
                                                        <span className="inline-flex px-1.5 py-0.5 rounded bg-purple-50 text-[9px] text-purple-600 font-bold border border-purple-100">
                                                            {masters.find(m => m.category === 'branch_officer' && String(m.code) === String(u.unionRoleBranch))?.name || u.unionRoleBranch}
                                                        </span>
                                                    )}
                                                    {u.isNonUnion ? (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-zinc-800 text-white gap-1">
                                                            非組合員
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700 gap-1 border border-blue-200">
                                                            組合員
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-600 font-medium">{u.storeName ?? '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleActive(u.id, u.isActive)}
                                                className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all ${u.isActive
                                                        ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                                                        : 'text-gray-400 bg-gray-50 border-gray-100'
                                                    }`}
                                            >
                                                {u.isActive ? '● 有効' : '○ 停止中'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleDeleteUser(u.id, u.name)}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                title="削除"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {!loading && users.length === 0 && (
                        <div className="text-center py-20 text-gray-300">
                            <p className="text-4xl mb-4">🔍</p>
                            <p className="font-bold">ユーザーが見つかりません</p>
                        </div>
                    )}
                </div>

                {!loading && hasMore && users.length > 0 && (
                    <div className="flex justify-center pt-4">
                        <button 
                            onClick={handleLoadMore}
                            className="bg-white border border-gray-100 text-gray-500 font-bold px-10 py-3 rounded-2xl hover:bg-orange-50 hover:text-orange-600 transition-all shadow-sm"
                        >
                            さらに読み込む
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
