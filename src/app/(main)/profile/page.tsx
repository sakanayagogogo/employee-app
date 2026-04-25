'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NotificationSettings from '@/components/push/NotificationSettings';
import { getProxyUrl } from '@/lib/image';

export default function ProfileDashboardPage() {
    const { user, refresh, logout } = useAuth();
    const router = useRouter();
    const [avatarUrl, setAvatarUrl] = useState('');
    const [backgroundUrl, setBackgroundUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [bookmarks, setBookmarks] = useState<any[]>([]);
    const [loadingBookmarks, setLoadingBookmarks] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'bookmarks' | 'password' | 'notifications'>('profile');
    const [passForm, setPassForm] = useState({ current: '', next: '', confirm: '' });
    const [passSaving, setPassSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setAvatarUrl(user.avatarUrl || '');
            setBackgroundUrl(user.backgroundUrl || '');
        }
    }, [user]);

    useEffect(() => {
        if (activeTab === 'bookmarks') {
            loadBookmarks();
        }
    }, [activeTab]);

    const loadBookmarks = async () => {
        setLoadingBookmarks(true);
        try {
            const res = await fetch('/api/users/me/bookmarks');
            const data = await res.json();
            if (data.data) setBookmarks(data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingBookmarks(false);
        }
    };

    if (!user) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch('/api/users/me/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ avatarUrl, backgroundUrl }),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'プロフィールを更新しました。' });
                await refresh();
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || '更新に失敗しました。' });
            }
        } catch {
            setMessage({ type: 'error', text: '通信エラーが発生しました。' });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passForm.next !== passForm.confirm) {
            setMessage({ type: 'error', text: '新しいパスワードが一致しません。' });
            return;
        }
        setPassSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch('/api/users/me/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: passForm.current, newPassword: passForm.next }),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'パスワードを変更しました。' });
                setPassForm({ current: '', next: '', confirm: '' });
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || '変更に失敗しました。' });
            }
        } catch {
            setMessage({ type: 'error', text: '通信エラーが発生しました。' });
        } finally {
            setPassSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900 pb-4">マイページ</h1>
                <div className="flex gap-4 pb-4">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`text-sm font-bold transition-colors ${activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600 pb-4 -mb-4.5' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        プロフィール編集
                    </button>
                    <button
                        onClick={() => setActiveTab('bookmarks')}
                        className={`text-sm font-bold transition-colors ${activeTab === 'bookmarks' ? 'text-blue-600 border-b-2 border-blue-600 pb-4 -mb-4.5' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        しおり一覧
                    </button>
                    <button
                        onClick={() => setActiveTab('password')}
                        className={`text-sm font-bold transition-colors ${activeTab === 'password' ? 'text-blue-600 border-b-2 border-blue-600 pb-4 -mb-4.5' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        パスワード変更
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`text-sm font-bold transition-colors ${activeTab === 'notifications' ? 'text-blue-600 border-b-2 border-blue-600 pb-4 -mb-4.5' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        🔔 通知
                    </button>
                </div>
            </div>
            
            {activeTab === 'profile' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Form Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                        <form onSubmit={handleSave} className="space-y-6">
                            {message.text && (
                                <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {message.text}
                                </div>
                            )}

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">バッジ画像 (アバター) URL</label>
                                    <input
                                        type="text"
                                        value={avatarUrl}
                                        onChange={e => setAvatarUrl(e.target.value)}
                                        placeholder="https://example.com/icon.png"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm text-gray-900"
                                    />
                                    <p className="text-xs text-gray-500 mt-1.5 font-medium">アイコン画像のURLを入力してください。空白にするとデフォルトのイニシャル表示に戻ります。</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">背景画像 (カバー) URL</label>
                                    <input
                                        type="text"
                                        value={backgroundUrl}
                                        onChange={e => setBackgroundUrl(e.target.value)}
                                        placeholder="https://example.com/background.jpg"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm text-gray-900"
                                    />
                                    <p className="text-xs text-gray-500 mt-1.5 font-medium">プロフィールカード上部に表示される背景画像のURLを入力してください。</p>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6 border-t border-gray-100">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-[#1877F2] hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? '保存中...' : '変更を保存する'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push('/')}
                                    className="px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="button"
                                    onClick={() => logout().then(() => router.push('/login'))}
                                    className="px-6 py-3 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
                                >
                                    ログアウト
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Preview Section */}
                    <div>
                        <h2 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider ml-1">プレビュー</h2>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full max-w-[320px] mx-auto lg:mx-0 transition-all duration-300 hover:shadow-md">
                            <div className="h-[120px] bg-gradient-to-r from-blue-100 to-blue-200 relative overflow-hidden">
                                {backgroundUrl ? (
                                    <img src={getProxyUrl(backgroundUrl)} alt="Cover Preview" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                ) : (
                                    <div className="absolute inset-0 opacity-40 mix-blend-multiply flex items-center justify-center">
                                        <svg className="w-full h-full text-blue-500/20 max-w-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                            <rect x="0" y="0" width="100" height="100" fill="currentColor" />
                                            <rect x="20" y="20" width="30" height="40" fill="white" opacity="0.5" />
                                            <rect x="60" y="30" width="20" height="30" fill="white" opacity="0.5" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="px-5 pb-6 relative pt-14">
                                <div className="w-20 h-20 rounded-full border-[5px] border-white bg-gray-100 flex items-center justify-center shadow-sm absolute -top-10 left-5 text-2xl font-bold text-gray-400 overflow-hidden z-10 transition-transform hover:scale-105 duration-300">
                                    {avatarUrl ? (
                                        <img src={getProxyUrl(avatarUrl)} alt="Avatar Preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    ) : (
                                        user.name.charAt(0)
                                    )}
                                </div>
                                <div className="mt-2 text-left">
                                    <h3 className="font-bold text-gray-900 text-xl tracking-tight">{user.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1.5 font-medium">
                                        {user.groupName && user.storeName ? `${user.groupName} ${user.storeName}` : (user.storeName ?? '本部')}
                                    </p>
                                    <div className="mt-4 flex gap-2">
                                        <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold border border-blue-100">
                                            {user.role === 'HQ_ADMIN' ? '本部管理者' : user.role === 'STORE_ADMIN' ? '店舗管理者' : '一般ユーザー'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'password' ? (
                <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">パスワード変更</h2>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        {message.text && (
                            <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {message.text}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">現在のパスワード</label>
                            <input
                                type="password"
                                required
                                value={passForm.current}
                                onChange={e => setPassForm({ ...passForm, current: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">新しいパスワード</label>
                            <input
                                type="password"
                                required
                                value={passForm.next}
                                onChange={e => setPassForm({ ...passForm, next: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">新しいパスワード（確認）</label>
                            <input
                                type="password"
                                required
                                value={passForm.confirm}
                                onChange={e => setPassForm({ ...passForm, confirm: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm text-gray-900"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={passSaving}
                            className="w-full mt-4 bg-gray-900 hover:bg-black text-white py-3 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {passSaving ? '保存中...' : 'パスワードを更新する'}
                        </button>
                    </form>
                </div>
            ) : activeTab === 'notifications' ? (
                <div className="max-w-md mx-auto">
                    <NotificationSettings />
                </div>
            ) : (
                <div className="space-y-4">
                    {loadingBookmarks ? (
                        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 animate-pulse">読み込み中...</div>
                    ) : bookmarks.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 font-medium">しおりを挟んだお知らせはありません</p>
                            <button 
                                onClick={() => router.push('/announcements')}
                                className="mt-4 text-sm font-bold text-blue-600 hover:underline"
                            >
                                お知らせ一覧を見に行く
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {bookmarks.map(b => (
                                <Link key={b.id} href={`/announcements/${b.id}`}>
                                    <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-orange-200 transition-all hover:shadow-md group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-3">
                                            <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                            </svg>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            {b.category === 'PRESIDENT' && <span className="text-[10px] font-bold bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">社長</span>}
                                            {b.category === 'MUST_READ' && <span className="text-[10px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded">必読</span>}
                                            <span className="text-[10px] text-gray-400">{new Date(b.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-sm mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">{b.title}</h3>
                                        <p className="text-[11px] text-gray-500">{b.authorName}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
