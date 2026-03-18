/**
 * FCM Client Plugin for Nuxt 3
 *
 * Multi-device support:
 * - Each browser/device gets its own FCM token
 * - Token is registered only when user is logged in
 * - Token is sent to server on login and page reload
 * - Old/expired tokens are cleaned up server-side
 */

import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

export default defineNuxtPlugin(() => {
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

  let messaging = null
  let swRegistration = null

  /**
   * Initialize Firebase + Service Worker (one-time setup)
   */
  async function initFCM() {
    if (messaging) return messaging

    try {
      const app = initializeApp({
        apiKey: firebaseApiKey,
        authDomain: firebaseAuthDomain,
        projectId: firebaseProjectId,
        storageBucket: firebaseStorageBucket,
        messagingSenderId: firebaseMessagingSenderId,
        appId: firebaseAppId,
        measurementId: firebaseMeasurementId,
      })
      messaging = getMessaging(app)

      // Register Service Worker
      if ('serviceWorker' in navigator) {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
        })
        console.log('✅ FCM Service Worker registered')
      }

      // Listen for foreground messages
      onMessage(messaging, (payload) => {
        console.log('📩 Foreground message:', payload)
        const { title, body } = payload.notification || {}
        if (Notification.permission === 'granted') {
          new Notification(title || 'Ride', {
            body: body || '',
            icon: '/favicon.png',
            badge: '/favicon.png',
          })
        }
      })

      return messaging
    } catch (err) {
      console.error('❌ FCM init failed:', err)
      return null
    }
  }

  /**
   * Request permission, get FCM token, and register with server.
   * Call this AFTER the user is logged in.
   */
  async function registerFCMToken() {
    try {
      // Step 1: Check if user is logged in
      const token = useCookie('token')
      if (!token.value) {
        console.log('⏳ FCM: No auth token — skipping (user not logged in)')
        return
      }

      // Step 2: Initialize Firebase
      console.log('🔥 FCM Step 1: Initializing Firebase...')
      await initFCM()
      if (!messaging) {
        console.warn('⚠️ FCM: Firebase messaging init failed — check Firebase config')
        return
      }
      console.log('✅ FCM Step 1: Firebase initialized')

      // Step 3: Request notification permission
      console.log('🔔 FCM Step 2: Requesting notification permission...')
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        console.warn('⚠️ FCM: Notification permission denied by user')
        return
      }
      console.log('✅ FCM Step 2: Permission granted')

      // Step 4: Get FCM token
      console.log('🎫 FCM Step 3: Getting FCM token (VAPID key:', firebaseVapidKey ? 'present' : '❌ MISSING', ')...')
      const fcmToken = await getToken(messaging, {
        vapidKey: firebaseVapidKey,
        serviceWorkerRegistration: swRegistration,
      })

      if (!fcmToken) {
        console.warn('⚠️ FCM: getToken returned null — check VAPID key and SW registration')
        return
      }
      console.log('✅ FCM Step 3: Token obtained:', fcmToken.substring(0, 20) + '...')

      // Step 5: Register token with backend
      console.log('📤 FCM Step 4: Sending token to backend...')
      const { $api } = useNuxtApp()
      const deviceName = getDeviceName()

      await $api('/fcm/token', {
        method: 'POST',
        body: { token: fcmToken, deviceName },
      })
      console.log('✅ FCM Step 4: Token registered on server (device:', deviceName + ')')
    } catch (err) {
      // Show detailed error
      console.error('❌ FCM registration failed:', {
        message: err.message || err,
        statusCode: err.statusCode || err.status,
        statusMessage: err.statusMessage,
        data: err.data,
      })
    }
  }

  // Auto-register when plugin loads (if user is already logged in)
  registerFCMToken()

  // Watch for cookie changes — register when user logs in
  const authToken = useCookie('token')
  watch(authToken, (newVal) => {
    if (newVal) {
      // User just logged in — register FCM token
      setTimeout(() => registerFCMToken(), 1000)
    }
  })

  // Expose for manual use (e.g., after login redirect)
  return {
    provide: {
      registerFCMToken,
    },
  }
})

/**
 * Generate a human-readable device name from User-Agent.
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
