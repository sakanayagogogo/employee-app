'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function EditUserPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id;
    const { user: currentUser } = useAuth();

    const [stores, setStores] = useState<any[]>([]);
    const [masters, setMasters] = useState<any[]>([]);
    const [form, setForm] = useState({ 
        employeeNumber: '', 
        name: '', 
        email: '', 
        role: '', 
        storeId: '', 
        employmentType: '', 
        unionRole: '', 
        unionRoleBranch: '',
        jobTitle: '',
        birthday: '', 
        password: '' 
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([
            fetch(`/api/admin/users/${id}`).then(r => r.ok ? r.json() : Promise.reject('User fetch failed')),
            fetch('/api/admin/stores').then(r => r.ok ? r.json() : Promise.reject('Stores fetch failed')),
            fetch('/api/admin/master-data').then(r => r.ok ? r.json() : Promise.reject('Masters fetch failed')),
        ]).then(([u, s, m]) => {
            const userData = u.data;
            if (userData) {
                setForm({
                    employeeNumber: userData.employeeNumber,
                    name: userData.name,
                    email: userData.email || '',
                    role: userData.role,
                    storeId: userData.storeId?.toString() || '',
                    employmentType: userData.employmentType,
                    unionRole: userData.unionRole || '',
                    unionRoleBranch: userData.unionRoleBranch || '',
                    jobTitle: userData.jobTitle || '',
                    birthday: userData.birthday ? userData.birthday.split('T')[0] : '',
                    password: '',
                });
            } else {
                setError('ユーザーデータが見つかりませんでした');
            }
            setStores(s.data ?? []);
            setMasters(m.data ?? []);
        }).catch(err => {
            console.error(err);
            setError('データの読み込みに失敗しました');
        }).finally(() => {
            setLoading(false);
        });
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        const payload: any = { 
            ...form, 
            storeId: form.storeId ? parseInt(form.storeId) : null,
            email: form.email.trim() || null
        };
        if (!payload.password) delete payload.password;
        
        // Hide birthday from payload if not authorized
        const canSeeBirthday = currentUser?.role === 'HQ_ADMIN' || currentUser?.id.toString() === id;
        if (!canSeeBirthday) delete payload.birthday;

        const res = await fetch(`/api/admin/users/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) { 
            setError(data.error ?? 'エラー'); 
            setSubmitting(false); 
            return; 
        }
        alert('ユーザー情報を更新しました');
        setSubmitting(false);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] animate-pulse">
            <div className="w-12 h-12 border-4 border-gray-100 border-t-orange-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 font-bold">読み込み中...</p>
        </div>
    );

    return (
        <div className="max-w-none space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                    ←
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">ユーザー編集</h1>
                    <p className="text-gray-500 text-sm">{form.name}さんの情報を編集します</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium">{error}</div>}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">社員番号</label>
                            <input 
                                type="text" 
                                disabled
                                value={form.employeeNumber}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 cursor-not-allowed" 
                            />
                            <p className="text-[10px] text-gray-400 mt-2 px-1">※社員番号は変更できません</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">氏名</label>
                            <input 
                                type="text" 
                                required 
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">メールアドレス（任意）</label>
                        <input 
                            type="email" 
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" 
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {(currentUser?.role === 'HQ_ADMIN' || currentUser?.id.toString() === id) && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">生年月日</label>
                                <input 
                                    type="date" 
                                    required 
                                    value={form.birthday}
                                    onChange={e => setForm({ ...form, birthday: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" 
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">パスワード変更</label>
                            <input 
                                type="password" 
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" 
                                placeholder="変更する場合のみ入力"
                            />
                        </div>
                    </div>

                    <hr className="border-gray-50" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">ロール（管理権限）</label>
                            <select 
                                value={form.role} 
                                onChange={e => setForm({ ...form, role: e.target.value })} 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                            >
                                {masters.filter(m => m.category === 'user_role').map(m => (
                                    <option key={m.code} value={m.code}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>


                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">雇用区分</label>
                            <select 
                                value={form.employmentType} 
                                onChange={e => setForm({ ...form, employmentType: e.target.value })} 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                            >
                                {masters.filter(m => m.category === 'employment_type').map(m => (
                                    <option key={m.code} value={m.code}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">役員区分</label>
                            <select 
                                value={form.unionRole} 
                                onChange={e => setForm({ ...form, unionRole: e.target.value })} 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                            >
                                <option value="">選択してください</option>
                                {masters.filter(m => m.category === 'union_role').map(m => (
                                    <option key={m.code} value={m.code}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">職務</label>
                            <select 
                                value={form.jobTitle} 
                                onChange={e => setForm({ ...form, jobTitle: e.target.value })} 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                            >
                                <option value="">選択してください</option>
                                {masters.filter(m => m.category === 'job_title').map(m => (
                                    <option key={m.code} value={m.code}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">支部役割</label>
                            <select 
                                value={form.unionRoleBranch} 
                                onChange={e => setForm({ ...form, unionRoleBranch: e.target.value })} 
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                            >
                                <option value="">なし</option>
                                {masters.filter(m => m.category === 'branch_officer').map(m => (
                                    <option key={m.code} value={m.code}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="sm:col-start-2">
                             <label className="block text-sm font-bold text-gray-700 mb-2">所属店舗</label>
                             <select 
                                 value={form.storeId} 
                                 onChange={e => setForm({ ...form, storeId: e.target.value })} 
                                 className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                             >
                                 <option value="">選択なし（本部等）</option>
                                 {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                             </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={submitting} 
                            className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 disabled:opacity-50"
                        >
                            {submitting ? '保存中...' : '変更を保存する'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
