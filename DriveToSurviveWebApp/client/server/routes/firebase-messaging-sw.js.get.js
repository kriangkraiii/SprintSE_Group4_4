/**
 * Dynamic Firebase Messaging Service Worker
 *
 * This Nitro server route serves firebase-messaging-sw.js with
 * Firebase config injected from environment variables.
 *
 * This avoids hardcoding API keys in the static service worker file.
 *
 * URL: /firebase-messaging-sw.js
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const {
    firebaseApiKey,
    firebaseAuthDomain,
    firebaseProjectId,
    firebaseStorageBucket,
    firebaseMessagingSenderId,
    firebaseAppId,
    firebaseMeasurementId,
  } = config.public

  // Set correct content type for Service Worker
  setResponseHeader(event, 'Content-Type', 'application/javascript')
  setResponseHeader(event, 'Service-Worker-Allowed', '/')
  // Cache for 1 hour (Firebase recommends short cache for SW)
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')

  return `/* Firebase Messaging Service Worker — auto-generated from .env */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: '${firebaseApiKey}',
  authDomain: '${firebaseAuthDomain}',
  projectId: '${firebaseProjectId}',
  storageBucket: '${firebaseStorageBucket}',
  messagingSenderId: '${firebaseMessagingSenderId}',
  appId: '${firebaseAppId}',
  measurementId: '${firebaseMeasurementId}',
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);
  const { title, body, icon } = payload.notification || {};
  const link = payload.data?.link || '/';

  self.registration.showNotification(title || 'Ride', {
    body: body || '',
    icon: icon || '/favicon.png',
    badge: '/favicon.png',
    data: { url: link },
    requireInteraction: true,
  });
});

// Open link when user clicks the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
`
})
