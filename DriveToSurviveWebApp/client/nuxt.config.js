import { resolve } from "path";
import dotenv from "dotenv";

// Load .env from parent directory
dotenv.config({ path: resolve(__dirname || process.cwd(), "../.env") });

import tailwindcssVite from "@tailwindcss/vite";

const productionApiBase = "https://sparkling-benetta-kraeeeeeew-9ef9bd6d.koyeb.app";
const defaultApiBase = process.env.NODE_ENV === "production" ? productionApiBase : "/api";

export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || defaultApiBase,
      googleMapsApiKey: process.env.NUXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
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

  plugins: ["~/plugins/api.client.js"],
  app: {
    head: {
      title: "Drive To Survive — เดินทางร่วมกันอย่างปลอดภัย",
      meta: [
        { name: "description", content: "Drive To Survive — แพลตฟอร์มเดินทางร่วมกันอย่างปลอดภัย ยืนยันตัวตน OTP ติดตามเรียลไทม์ ปุ่ม SOS พร้อมระบบรีวิว" }
      ],
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1, maximum-scale=1",
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap'
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
  ],
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
