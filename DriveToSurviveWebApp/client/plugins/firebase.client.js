/**
 * Firebase Client Plugin
 * Sprint 3: Initialize Firebase app & messaging for push notifications.
 *
 * This plugin runs client-side only (.client.js suffix).
 */

import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

export default defineNuxtPlugin(async () => {
    const firebaseConfig = {
        apiKey: 'AIzaSyByeJ4OkZ57uLV2keZOfRCNs2D72VHG7jw',
        authDomain: 'secp-a5a40.firebaseapp.com',
        projectId: 'secp-a5a40',
        storageBucket: 'secp-a5a40.firebasestorage.app',
        messagingSenderId: '371634909022',
        appId: '1:371634909022:web:948830e27110f8f45229cf',
        measurementId: 'G-VM88VLQXN1',
    };

    const app = initializeApp(firebaseConfig);

    let messaging = null;

    // Messaging is not supported in all browsers (e.g., Safari without PWA)
    const supported = await isSupported();
    if (supported) {
        messaging = getMessaging(app);
    } else {
        console.warn('⚠️  Firebase Messaging is not supported in this browser');
    }

    return {
        provide: {
            firebaseApp: app,
            firebaseMessaging: messaging,
        },
    };
});
