/**
 * Firebase Messaging Service Worker
 * Handles background push notifications (when app is not in focus)
 */
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyByeJ4OkZ57uLV2keZOfRCNs2D72VHG7jw",
    authDomain: "secp-a5a40.firebaseapp.com",
    projectId: "secp-a5a40",
    storageBucket: "secp-a5a40.firebasestorage.app",
    messagingSenderId: "371634909022",
    appId: "1:371634909022:web:948830e27110f8f45229cf",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message:', payload);

    const title = payload.notification?.title || payload.data?.title || '🔔 แจ้งเตือนใหม่';
    const body = payload.notification?.body || payload.data?.body || '';
    const link = payload.data?.link || '/notifications';

    self.registration.showNotification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        data: { url: link },
        vibrate: [200, 100, 200],
        tag: payload.data?.type || 'default',
        renotify: true,
    });
});

// Handle notification click — open the app to the right page
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(url) && 'focus' in client) return client.focus();
            }
            return clients.openWindow(url);
        })
    );
});
