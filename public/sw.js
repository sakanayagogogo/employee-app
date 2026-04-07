// Service Worker for KIZUNA Push Notifications
// This file MUST be in /public so it's served at the root scope

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Receive push notification
self.addEventListener('push', (event) => {
    let data = { title: 'KIZUNA', body: '新着通知があります', url: '/home', tag: 'default' };
    try {
        if (event.data) {
            data = { ...data, ...event.data.json() };
        }
    } catch (e) {
        // fallback to defaults
    }

    const options = {
        body: data.body,
        icon: '/kizuna-color.svg',
        badge: '/kizuna-icon.svg',
        data: { url: data.url },
        tag: data.tag,
        renotify: true,
        vibrate: [200, 100, 200],
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/home';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Focus existing tab if found
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            // Open new window
            return self.clients.openWindow(url);
        })
    );
});
