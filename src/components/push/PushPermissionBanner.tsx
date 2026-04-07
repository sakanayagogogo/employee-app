'use client';

import { useState, useEffect } from 'react';
import { usePushNotification } from '@/hooks/usePushNotification';

export default function PushPermissionBanner() {
    const { isSupported, isSubscribed, permission, loading, subscribe } = usePushNotification();
    const [dismissed, setDismissed] = useState(true); // start hidden
    const [animateOut, setAnimateOut] = useState(false);

    useEffect(() => {
        // Don't show if not supported, already subscribed, or already denied
        if (!isSupported || isSubscribed || permission === 'denied' || loading) {
            setDismissed(true);
            return;
        }
        // Check if user dismissed recently (localStorage)
        const dismissedUntil = localStorage.getItem('push_banner_dismissed_until');
        if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) {
            setDismissed(true);
            return;
        }
        // Show banner after small delay
        const timer = setTimeout(() => setDismissed(false), 2000);
        return () => clearTimeout(timer);
    }, [isSupported, isSubscribed, permission, loading]);

    const handleDismiss = () => {
        setAnimateOut(true);
        // Don't show for 7 days
        localStorage.setItem('push_banner_dismissed_until', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
        setTimeout(() => setDismissed(true), 300);
    };

    const handleEnable = async () => {
        const success = await subscribe();
        if (success) {
            setAnimateOut(true);
            setTimeout(() => setDismissed(true), 300);
        }
    };

    if (dismissed) return null;

    return (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg transition-all duration-300 ${animateOut ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0 animate-in slide-in-from-top'}`}>
            <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-xl shadow-blue-100/50">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-xl">🔔</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">プッシュ通知を有効にしませんか？</p>
                        <p className="text-xs text-gray-500 mt-0.5">新着のお知らせやメールをすぐにお届けします。</p>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3">
                    <button
                        onClick={handleDismiss}
                        className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        今はしない
                    </button>
                    <button
                        onClick={handleEnable}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {loading ? '設定中...' : '有効にする'}
                    </button>
                </div>
            </div>
        </div>
    );
}
