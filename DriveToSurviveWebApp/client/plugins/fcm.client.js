/**
 * FCM Client Plugin for Nuxt 3
 *
 * Reads Firebase config from runtimeConfig (sourced from .env).
 * Multi-device support:
 * - Each browser/device gets its own FCM token
 * - Token is refreshed automatically and re-registered
 * - Token is sent to server on every page load (upsert on server side)
 * - Old/expired tokens are cleaned up server-side
 */

import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

export default defineNuxtPlugin(async () => {
  // Only run on client side
  if (!process.client) return
  if (!('Notification' in window)) {
    console.warn('⚠️ This browser does not support push notifications')
    return
  }

  // Read Firebase config from Nuxt runtimeConfig (sourced from .env)
  const config = useRuntimeConfig()
  const {
    firebaseApiKey,
    firebaseAuthDomain,
    firebaseProjectId,
    firebaseStorageBucket,
    firebaseMessagingSenderId,
    firebaseAppId,
    firebaseMeasurementId,
    firebaseVapidKey,
  } = config.public

  // Skip if Firebase is not configured
  if (!firebaseApiKey || !firebaseProjectId) {
    console.warn('⚠️ Firebase not configured — set FIREBASE_API_KEY and FIREBASE_PROJECT_ID in .env')
    return
  }

  try {
    // 1. Initialize Firebase
    const app = initializeApp({
      apiKey: firebaseApiKey,
      authDomain: firebaseAuthDomain,
      projectId: firebaseProjectId,
      storageBucket: firebaseStorageBucket,
      messagingSenderId: firebaseMessagingSenderId,
      appId: firebaseAppId,
      measurementId: firebaseMeasurementId,
    })
    const messaging = getMessaging(app)

    // 2. Register the Service Worker
    let swRegistration = null
    if ('serviceWorker' in navigator) {
      swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      })
      console.log('✅ FCM Service Worker registered')
    }

    // 3. Check / Request permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('⚠️ Notification permission denied')
      return
    }

    // 4. Get FCM token (unique per browser/device)
    const token = await getToken(messaging, {
      vapidKey: firebaseVapidKey,
      serviceWorkerRegistration: swRegistration,
    })

    if (!token) {
      console.warn('⚠️ Failed to get FCM token')
      return
    }

    console.log('✅ FCM Token:', token)

    // 5. Send token to backend (server does upsert — same token = update, new token = create)
    // This fires every page load, which is intentional for multi-device:
    // - If user switches device, new token is registered
    // - If token refreshes (Firebase rotates tokens), new token replaces old
    // - Server stores ALL tokens per user, sends push to ALL devices
    await sendTokenToServer(token)

    // 6. Listen for foreground messages
    onMessage(messaging, (payload) => {
      console.log('📩 Foreground message:', payload)
      const { title, body } = payload.notification || {}

      // Show native browser notification for foreground messages
      if (Notification.permission === 'granted') {
        new Notification(title || 'Ride', {
          body: body || '',
          icon: '/favicon.png',
          badge: '/favicon.png',
        })
      }
    })
  } catch (err) {
    console.error('❌ FCM init failed:', err)
  }
})

/**
 * Send FCM token to the backend API for storage.
 * Server does upsert by token — supports multi-device automatically.
 */
async function sendTokenToServer(token) {
  try {
    const { $api } = useNuxtApp()
    const deviceName = getDeviceName()

    await $api('/fcm/token', {
      method: 'POST',
      body: { token, deviceName },
    })
    console.log('✅ FCM token registered on server (device:', deviceName + ')')
  } catch (err) {
    // Non-critical — token registration failing shouldn't break the app
    console.warn('⚠️ Failed to register FCM token on server:', err.message || err)
  }
}

/**
 * Generate a human-readable device name from User-Agent.
 * Each device gets a unique name for the multi-device token list.
 */
function getDeviceName() {
  const ua = navigator.userAgent
  if (/iPhone/.test(ua)) return 'iPhone Safari'
  if (/iPad/.test(ua)) return 'iPad Safari'
  if (/Android.*Mobile/.test(ua)) return 'Android Phone'
  if (/Android/.test(ua)) return 'Android Tablet'
  if (/Mac/.test(ua) && /Chrome/.test(ua)) return 'Mac Chrome'
  if (/Mac/.test(ua) && /Safari/.test(ua)) return 'Mac Safari'
  if (/Mac/.test(ua) && /Firefox/.test(ua)) return 'Mac Firefox'
  if (/Windows/.test(ua) && /Chrome/.test(ua)) return 'Windows Chrome'
  if (/Windows/.test(ua) && /Edge/.test(ua)) return 'Windows Edge'
  if (/Windows/.test(ua)) return 'Windows Desktop'
  if (/Linux/.test(ua)) return 'Linux Desktop'
  return 'Unknown Device'
}
