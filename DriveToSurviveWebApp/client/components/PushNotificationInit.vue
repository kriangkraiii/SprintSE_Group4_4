<!--
  PushNotificationInit.vue
  Sprint 3: Auto-initializes FCM push notifications when user is logged in.
  This is a render-less component — include it in your default layout.

  Usage: <PushNotificationInit />
-->
<template>
  <!-- Render-less component: no visible UI -->
  <div v-if="false" />
</template>

<script setup>
import { onMounted, watch } from 'vue';

const { initPushNotifications, isSupported, permissionStatus } = usePushNotification();
const auth = useAuth();

// Show in-app toast when foreground notification received
function handleForegroundMessage(payload) {
    const title = payload.notification?.title || 'Ride';
    const body = payload.notification?.body || '';

    // Try to use the app's toast system if available
    try {
        const { showToast } = useToast();
        showToast(`🔔 ${title}: ${body}`, 'info');
    } catch {
        // Fallback: browser alert (should not happen in normal flow)
        console.log(`🔔 ${title}: ${body}`);
    }
}

// Initialize FCM when user is logged in
async function tryInitFCM() {
    // Only init if user is authenticated
    if (!auth?.user?.value?.id) return;

    // Don't init if browser doesn't support
    if (!('Notification' in window)) return;
    if (!('serviceWorker' in navigator)) return;

    // Skip if already denied
    if (Notification.permission === 'denied') return;

    await initPushNotifications(handleForegroundMessage);
}

onMounted(() => {
    tryInitFCM();
});

// Re-init when auth state changes (e.g., after login)
if (auth?.user) {
    watch(() => auth.user.value, (newUser) => {
        if (newUser?.id) {
            tryInitFCM();
        }
    });
}
</script>
