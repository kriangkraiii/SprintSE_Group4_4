import { resolve } from "path";
import dotenv from "dotenv";

// Load .env from parent directory
dotenv.config({ path: resolve(__dirname || process.cwd(), "../.env") });

import tailwindcssVite from "@tailwindcss/vite";

const productionApiBase = "https://sparkling-benetta-kraeeeeeew-9ef9bd6d.koyeb.app";
const defaultApiBase = process.env.NODE_ENV === "production" ? productionApiBase : "/api";

export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || defaultApiBase,
<<<<<<< HEAD
      googleMapsApiKey: process.env.NUXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      firebaseVapidKey: process.env.FIREBASE_VAPID_KEY || "",
=======
      googleMapsApiKey: process.env.NUXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
>>>>>>> 1d3939c31757b40e998434982bcfc4279244e10d
    },
  },
  devServer: {
    port: 3000,
  },

  // ── Proxy /api → Express server (port 3001) ──
  nitro: {
    devProxy: {
      '/api': {
        target: 'http://localhost:3001/api',
        changeOrigin: true,
      },
      '/documentation': {
        target: 'http://localhost:3001/documentation',
        changeOrigin: true,
      },
      '/metrics': {
        target: 'http://localhost:3001/metrics',
        changeOrigin: true,
      },
    },
  },

  plugins: [
    "~/plugins/api.client.js",
    "~/plugins/firebase.client.js",
  ],
  app: {
    head: {
      title: "Ride — เดินทางร่วมกันอย่างปลอดภัย",
      meta: [
        { name: "description", content: "Ride — แพลตฟอร์มเดินทางร่วมกันอย่างปลอดภัย ยืนยันตัวตน OTP ติดตามเรียลไทม์ ปุ่ม SOS พร้อมระบบรีวิว" }
      ],
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1, maximum-scale=1",
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/favicon.png'
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap'
        }
      ]
    },
  },
  vite: {
    plugins: [tailwindcssVite()],
  },
  css: [
    '~/assets/css/input.css',
  ],
  modules: [
    '@nuxtjs/i18n',
    '@vite-pwa/nuxt',
  ],
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Ride — เดินทางร่วมกันอย่างปลอดภัย',
      short_name: 'Ride',
      description: 'แพลตฟอร์มเดินทางร่วมกันอย่างปลอดภัย',
      theme_color: '#0f172a',
      background_color: '#f8fafc',
      display: 'standalone',
      start_url: '/',
      icons: [
        {
          src: '/favicon.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/favicon.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/favicon.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      // Don't precache the FCM service worker
      navigateFallback: null,
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },
  i18n: {
    locales: [
      { code: 'th', iso: 'th-TH', file: 'th.json', name: 'Thai' },
      { code: 'en', iso: 'en-US', file: 'en.json', name: 'English' }
    ],
    lazy: true,
    langDir: 'locales',
    defaultLocale: 'th',
    strategy: 'prefix_and_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    }
  },
  build: {
    transpile: []
  },
});