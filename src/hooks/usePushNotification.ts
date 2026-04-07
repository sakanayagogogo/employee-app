'use client';

import { useState, useEffect, useCallback } from 'react';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotification() {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [loading, setLoading] = useState(true);

    // Check support and current state
    useEffect(() => {
        const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        setIsSupported(supported);
        if (supported) {
            setPermission(Notification.permission);
        }

        // Check existing subscription
        if (supported && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(reg => {
                reg.pushManager.getSubscription().then(sub => {
                    setIsSubscribed(!!sub);
                    setLoading(false);
                });
            });
        } else {
            setLoading(false);
        }
    }, []);

    // Register service worker
    const registerSW = useCallback(async () => {
        if (!('serviceWorker' in navigator)) return null;
        try {
            const reg = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;
            return reg;
        } catch (err) {
            console.error('[Push] SW registration failed:', err);
            return null;
        }
    }, []);

    // Subscribe to push notifications
    const subscribe = useCallback(async () => {
        setLoading(true);
        try {
            const reg = await registerSW();
            if (!reg) throw new Error('Service Worker登録に失敗しました');

            // Request notification permission
            const perm = await Notification.requestPermission();
            setPermission(perm);
            if (perm !== 'granted') {
                setLoading(false);
                return false;
            }

            // Get VAPID public key
            const vapidRes = await fetch('/api/push/vapid-key');
            const { publicKey } = await vapidRes.json();

            // Subscribe with PushManager
            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
            });

            // Send subscription to server
            const res = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription.toJSON()),
            });

            if (res.ok) {
                setIsSubscribed(true);
                setLoading(false);
                return true;
            }
            throw new Error('サーバー登録に失敗しました');
        } catch (err) {
            console.error('[Push] Subscribe failed:', err);
            setLoading(false);
            return false;
        }
    }, [registerSW]);

    // Unsubscribe from push notifications
    const unsubscribe = useCallback(async () => {
        setLoading(true);
        try {
            const reg = await navigator.serviceWorker.ready;
            const subscription = await reg.pushManager.getSubscription();
            if (subscription) {
                const endpoint = subscription.endpoint;
                await subscription.unsubscribe();

                await fetch('/api/push/subscribe', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint }),
                });
            }
            setIsSubscribed(false);
        } catch (err) {
            console.error('[Push] Unsubscribe failed:', err);
        }
        setLoading(false);
    }, []);

    return {
        isSupported,
        isSubscribed,
        permission,
        loading,
        subscribe,
        unsubscribe,
    };
}
