/**
 * Firebase Messaging Service Worker
 * Sprint 3: Handles background push notifications when the app is not in focus.
 *
 * This file MUST be in the public/ directory root and named exactly
 * "firebase-messaging-sw.js" for Firebase to find it.
 */

/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: 'AIzaSyByeJ4OkZ57uLV2keZOfRCNs2D72VHG7jw',
    authDomain: 'secp-a5a40.firebaseapp.com',
    projectId: 'secp-a5a40',
    storageBucket: 'secp-a5a40.firebasestorage.app',
    messagingSenderId: '371634909022',
    appId: '1:371634909022:web:948830e27110f8f45229cf',
    measurementId: 'G-VM88VLQXN1',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload);

    const notificationTitle = payload.notification?.title || 'Ride';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: payload.data?.notificationId || 'default',
        data: {
            url: payload.data?.link || '/',
        },
        // Vibrate pattern: short-long-short (mobile)
        vibrate: [100, 200, 100],
        requireInteraction: true,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click — navigate to the link
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.notification);
    event.notification.close();

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If the app is already open, focus it and navigate
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    client.navigate(url);
                    return;
                }
            }
            // Otherwise, open a new window
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
