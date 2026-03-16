<template>
    <div>
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
        <ToastWrapper />
        <!-- Sprint 3: Auto-init FCM push notifications -->
        <ClientOnly>
            <PushNotificationInit />
        </ClientOnly>
    </div>
</template>

<script setup>
import ToastWrapper from '~/components/ToastWrapper.vue';
import PushNotificationInit from '~/components/PushNotificationInit.vue';
</script>