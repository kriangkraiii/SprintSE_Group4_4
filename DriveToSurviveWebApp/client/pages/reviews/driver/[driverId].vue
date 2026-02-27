<template>
  <div class="min-h-screen bg-surface pb-12">
    <!-- Header -->
    <div class="relative h-[220px] w-full bg-gradient-to-br from-primary to-blue-700">
      <div class="absolute inset-0 flex flex-col justify-center px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <button @click="navigateTo('/findTrip')"
          class="mb-3 flex items-center gap-1 text-white/80 hover:text-white text-sm transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          กลับ
        </button>
        <h2 class="text-3xl font-bold text-white drop-shadow-md">⭐ รีวิวคนขับ</h2>
        <p v-if="driverName" class="mt-2 text-white/90 drop-shadow-sm">{{ driverName }}</p>
      </div>
    </div>

    <div class="relative px-4 mx-auto -mt-8 max-w-7xl sm:px-6 lg:px-8">
      <!-- Stats Card -->
      <div class="p-6 mb-6 bg-white border border-slate-200 rounded-xl shadow-lg text-center">
        <div v-if="isLoading" class="py-8 text-slate-400">กำลังโหลด...</div>
        <template v-else>
          <div class="flex items-center justify-center gap-2 mb-2">
            <span class="text-4xl font-bold text-primary">{{ stats.avgRating || 0 }}</span>
            <span class="text-3xl text-yellow-400">★</span>
          </div>
          <p class="text-sm text-slate-500">{{ stats.totalReviews || 0 }} รีวิว</p>

          <!-- Tag Summary -->
          <div v-if="Object.keys(stats.tagCounts || {}).length" class="mt-4 flex flex-wrap justify-center gap-2">
            <span v-for="(count, tag) in stats.tagCounts" :key="tag"
              class="px-2.5 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {{ tagLabel(tag) }} ({{ count }})
            </span>
          </div>
        </template>
      </div>

      <!-- Reviews List -->
      <div v-if="!isLoading">
        <div v-if="reviews.length === 0" class="p-12 text-center">
          <p class="text-5xl mb-3">📝</p>
          <p class="text-slate-500">ยังไม่มีรีวิว</p>
        </div>

        <div v-else class="space-y-4">
          <ReviewCard v-for="review in reviews" :key="review.id" :review="review" />
        </div>

        <!-- Load More -->
        <div v-if="hasMore" class="mt-6 text-center">
          <button @click="loadMore"
            class="px-6 py-2.5 text-sm text-primary bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
            โหลดเพิ่ม
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useReview } from '~/composables/useReview'

const route = useRoute()
const driverId = route.params.driverId

useHead({ title: 'รีวิวคนขับ — Ride' })

const { fetchDriverReviews, fetchDriverStats } = useReview()

const stats = ref({})
const reviews = ref([])
const isLoading = ref(true)
const page = ref(1)
const totalPages = ref(1)
const driverName = ref('')

const hasMore = computed(() => page.value < totalPages.value)

const TAG_LABELS = {
  polite: '🤝 สุภาพ',
  safe_driving: '🛡️ ขับปลอดภัย',
  clean_car: '✨ รถสะอาด',
  on_time: '⏰ ตรงเวลา',
  good_conversation: '💬 คุยสนุก',
  reckless_driving: '⚠️ ขับรถเร็ว',
  impolite: '😤 ไม่สุภาพ',
  dirty_car: '🚮 รถไม่สะอาด',
  late_arrival: '⏳ มาสาย',
  wrong_route: '🗺️ ผิดเส้นทาง',
}

const tagLabel = (tag) => TAG_LABELS[tag] || tag

async function loadData() {
  isLoading.value = true
  try {
    const [statsData, reviewsData] = await Promise.all([
      fetchDriverStats(driverId),
      fetchDriverReviews(driverId, { page: 1, limit: 20 }),
    ])
    stats.value = statsData || {}
    reviews.value = reviewsData?.data || reviewsData || []
    totalPages.value = reviewsData?.pagination?.totalPages || 1
  } catch (err) {
    console.error('Failed to load driver reviews:', err)
  } finally {
    isLoading.value = false
  }
}

async function loadMore() {
  page.value++
  try {
    const result = await fetchDriverReviews(driverId, { page: page.value, limit: 20 })
    reviews.value.push(...(result?.data || []))
  } catch (err) {
    console.error('Failed to load more:', err)
  }
}

onMounted(loadData)
</script>
