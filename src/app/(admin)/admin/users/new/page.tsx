'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewUserPage() {
    const router = useRouter();
    const [stores, setStores] = useState<any[]>([]);
    const [masters, setMasters] = useState<any[]>([]);
    const [form, setForm] = useState({ 
        employeeNumber: '', 
        name: '', 
        email: '', 
        role: 'GENERAL', 
        storeId: '', 
        employmentType: 'EMPLOYEE', 
        unionRole: '', 
        unionRoleBranch: '',
        jobTitle: '',
        birthday: '', 
        password: '' 
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([
            fetch('/api/admin/stores').then(r => r.json()),
            fetch('/api/admin/master-data').then(r => r.json()),
        ]).then(([s, m]) => {
            setStores(s.data ?? []);
            setMasters(m.data ?? []);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        const payload = { 
            ...form, 
            storeId: form.storeId ? parseInt(form.storeId) : null,
            email: form.email.trim() || null
        };

        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) { 
            setError(data.error ?? 'エラー'); 
            setSubmitting(false); 
            return; 
        }
        alert('ユーザーを登録しました');
        setSubmitting(false);
    };

    return (
        <div className="max-w-none space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                    ←
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">ユーザー登録</h1>
                    <p className="text-gray-500 text-sm">新しく従業員をシステムに追加します</p>
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
                                required 
                                value={form.employeeNumber}
                                onChange={e => setForm({ ...form, employeeNumber: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" 
                                placeholder="例: 1001"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">氏名</label>
                            <input 
                                type="text" 
                                required 
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" 
                                placeholder="例: 山田 太郎"
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
                            placeholder="example@t-union.jp"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">初期パスワード</label>
                            <input 
                                type="password" 
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" 
                                placeholder="未入力なら誕生日の8桁"
                            />
                            <p className="text-[10px] text-gray-400 mt-2 px-1">※空欄の場合、初期パスワードは「19900101」形式の8桁になります。</p>
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
                            {submitting ? '登録処理中...' : 'この内容で登録する'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
