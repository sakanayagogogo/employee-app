'use client';

import { useState, useEffect } from 'react';
import { usePushNotification } from '@/hooks/usePushNotification';

export default function NotificationSettings() {
    const { isSupported, isSubscribed, permission, loading, subscribe, unsubscribe } = usePushNotification();
    const [prefs, setPrefs] = useState({ notifyAnnouncements: true, notifyInquiries: true });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/users/me/notification-preferences')
            .then(r => r.json())
            .then(d => {
                if (d.data) {
                    setPrefs({
                        notifyAnnouncements: d.data.notifyAnnouncements,
                        notifyInquiries: d.data.notifyInquiries,
                    });
                }
            })
            .catch(() => {});
    }, []);

    const handleToggle = async (key: 'notifyAnnouncements' | 'notifyInquiries') => {
        const newPrefs = { ...prefs, [key]: !prefs[key] };
        setPrefs(newPrefs);
        setSaving(true);
        await fetch('/api/users/me/notification-preferences', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPrefs),
        });
        setSaving(false);
    };

    const handlePushToggle = async () => {
        if (isSubscribed) {
            await unsubscribe();
        } else {
            await subscribe();
        }
    };

    if (!isSupported) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-lg">🔔</span> 通知設定
                </h3>
                <p className="text-xs text-gray-400">
                    お使いのブラウザはプッシュ通知に対応していません。
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-lg">🔔</span> 通知設定
            </h3>

            <div className="space-y-4">
                {/* Master push toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-800">プッシュ通知</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {permission === 'denied' ? 'ブラウザの設定で通知がブロックされています' : 'ブラウザへの通知を受け取る'}
                        </p>
                    </div>
                    <button
                        onClick={handlePushToggle}
                        disabled={loading || permission === 'denied'}
                        className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${isSubscribed ? 'bg-blue-600' : 'bg-gray-200'} ${(loading || permission === 'denied') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200 ${isSubscribed ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>

                {isSubscribed && (
                    <>
                        <div className="border-t border-gray-100 pt-3 space-y-3">
                            {/* Announcements toggle */}
                            <div className="flex items-center justify-between pl-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">お知らせ通知</p>
                                    <p className="text-xs text-gray-400">新着お知らせ・機関誌「きずな」</p>
                                </div>
                                <button
                                    onClick={() => handleToggle('notifyAnnouncements')}
                                    disabled={saving}
                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${prefs.notifyAnnouncements ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${prefs.notifyAnnouncements ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* Inquiries toggle */}
                            <div className="flex items-center justify-between pl-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">メール通知</p>
                                    <p className="text-xs text-gray-400">新着メール・返信</p>
                                </div>
                                <button
                                    onClick={() => handleToggle('notifyInquiries')}
                                    disabled={saving}
                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${prefs.notifyInquiries ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${prefs.notifyInquiries ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {permission === 'denied' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2">
                        <p className="text-xs text-amber-700">
                            ⚠️ ブラウザの設定で通知がブロックされています。通知を有効にするには、ブラウザの設定画面から通知を許可してください。
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
