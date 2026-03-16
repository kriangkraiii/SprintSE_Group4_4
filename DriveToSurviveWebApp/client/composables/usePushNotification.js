/**
 * Push Notification Composable — Multi-device Support
 * Sprint 3: Request permission, get FCM token, save to backend, handle foreground messages.
 *
 * Supports multiple devices per user — each device registers its own token
 * with a device name for identification.
 */

import { ref } from 'vue';
import { getToken, onMessage } from 'firebase/messaging';

export function usePushNotification() {
    const fcmToken = ref(null);
    const permissionStatus = ref('default'); // 'default' | 'granted' | 'denied'
    const isSupported = ref(false);
    const isLoading = ref(false);

    /**
     * Detect device name from User-Agent for identification.
     */
    function getDeviceName() {
        const ua = navigator.userAgent;

        if (/iPad/.test(ua)) return 'iPad';
        if (/iPhone/.test(ua)) return 'iPhone';
        if (/Android/.test(ua) && /Mobile/.test(ua)) return 'Android Phone';
        if (/Android/.test(ua)) return 'Android Tablet';
        if (/Macintosh/.test(ua)) return 'Mac';
        if (/Windows/.test(ua)) return 'Windows PC';
        if (/Linux/.test(ua)) return 'Linux';

        return 'Unknown Device';
    }

    /**
     * Initialize push notifications:
     * 1. Check browser support
     * 2. Request notification permission
     * 3. Get FCM token
     * 4. Save token + device name to backend
     * 5. Set up foreground message handler
     */
    async function initPushNotifications(onForegroundMessage) {
        const { $firebaseMessaging } = useNuxtApp();
        const config = useRuntimeConfig();

        // Check if messaging is available
        if (!$firebaseMessaging) {
            console.warn('⚠️  Firebase Messaging not available');
            isSupported.value = false;
            return false;
        }

        isSupported.value = true;
        isLoading.value = true;

        try {
            // 1. Request permission
            const permission = await Notification.requestPermission();
            permissionStatus.value = permission;

            if (permission !== 'granted') {
                console.warn('🔕 Notification permission denied');
                isLoading.value = false;
                return false;
            }

            // 2. Register service worker
            const sw = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

            // 3. Get FCM token
            const vapidKey = config.public.firebaseVapidKey;
            const token = await getToken($firebaseMessaging, {
                vapidKey,
                serviceWorkerRegistration: sw,
            });

            if (!token) {
                console.warn('⚠️  Could not get FCM token');
                isLoading.value = false;
                return false;
            }

            fcmToken.value = token;
            console.log('🔔 FCM Token:', token);

            // 4. Save token with device name to backend
            const deviceName = getDeviceName();
            await saveTokenToServer(token, deviceName);

            // 5. Setup foreground message handler
            if (onForegroundMessage) {
                onMessage($firebaseMessaging, (payload) => {
                    console.log('📬 Foreground message:', payload);
                    onForegroundMessage(payload);
                });
            }

            isLoading.value = false;
            return true;
        } catch (err) {
            console.error('❌ Push notification init failed:', err);
            isLoading.value = false;
            return false;
        }
    }

    /**
     * Save FCM token + device name to backend API.
     */
    async function saveTokenToServer(token, deviceName) {
        try {
            const { $api } = useNuxtApp();
            await $api.post('/fcm/save-token', { token, deviceName });
            console.log(`✅ FCM token saved for device: ${deviceName}`);
        } catch (err) {
            console.error('❌ Failed to save FCM token:', err);
        }
    }

    /**
     * Remove FCM token for THIS device (call on logout).
     */
    async function removeTokenFromServer() {
        try {
            if (!fcmToken.value) return;
            const { $api } = useNuxtApp();
            await $api.delete('/fcm/remove-token', {
                data: { token: fcmToken.value },
            });
            fcmToken.value = null;
            console.log('🗑️  FCM token removed for this device');
        } catch (err) {
            console.error('❌ Failed to remove FCM token:', err);
        }
    }

    /**
     * Remove ALL FCM tokens (logout from all devices).
     */
    async function removeAllTokens() {
        try {
            const { $api } = useNuxtApp();
            await $api.delete('/fcm/remove-all');
            fcmToken.value = null;
            console.log('🗑️  All FCM tokens removed');
        } catch (err) {
            console.error('❌ Failed to remove all FCM tokens:', err);
        }
    }

    return {
        fcmToken,
        permissionStatus,
        isSupported,
        isLoading,
        initPushNotifications,
        removeTokenFromServer,
        removeAllTokens,
    };
}
