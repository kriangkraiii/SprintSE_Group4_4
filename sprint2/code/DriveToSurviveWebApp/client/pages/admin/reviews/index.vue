<template>
  <div>
    <AdminHeader />
    <AdminSidebar />

    <main id="main-content" class="main-content mt-24 ml-0 lg:ml-[280px] p-6">
      <div class="mx-auto max-w-8xl">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-semibold text-primary">⭐ Reviews</h1>
            <span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-50 text-yellow-600">
              {{ reviews.length }} รีวิว
            </span>
          </div>
        </div>

        <!-- Review List -->
        <div v-if="isLoading" class="py-12 text-center text-slate-400">กำลังโหลด...</div>
        <div v-else-if="reviews.length === 0" class="py-12 text-center text-slate-400">ไม่พบรีวิว</div>

        <div v-else class="space-y-3">
          <div v-for="r in reviews" :key="r.id"
            class="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-yellow-500 text-sm">{{ '⭐'.repeat(r.rating) }}</span>
                  <span class="text-xs text-slate-400">({{ r.rating }}/5)</span>
                  <span v-if="r.isHidden" class="px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-600">ซ่อนแล้ว</span>
                </div>
                <p class="text-sm text-slate-700 mb-2">{{ r.comment || 'ไม่มีความเห็น' }}</p>
                <div class="flex items-center gap-4 text-xs text-slate-400">
                  <span>👤 ผู้รีวิว: {{ r.reviewer?.firstName || r.reviewerId }}</span>
                  <span>🚗 คนขับ: {{ r.driver?.firstName || r.driverId }}</span>
                  <span>📅 {{ formatDate(r.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminHeader from '~/components/admin/AdminHeader.vue'
import AdminSidebar from '~/components/admin/AdminSidebar.vue'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

definePageMeta({ middleware: 'admin-auth', layout: 'admin' })
useHead({
    title: 'Reviews — Admin',
    link: [{ rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' }],
})

const { $api } = useNuxtApp()

const reviews = ref([])
const isLoading = ref(false)

const formatDate = (d) => d ? dayjs(d).format('D MMM YYYY HH:mm') : ''

async function fetchReviews() {
  isLoading.value = true
  try {
    const res = await $api('/reviews?limit=100')
    reviews.value = res.data || res || []
  } catch (e) {
    console.error('Failed to load reviews:', e)
    reviews.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchReviews)
</script>
