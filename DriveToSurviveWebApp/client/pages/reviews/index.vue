<template>
  <div class="min-h-screen bg-surface pb-12">
    <!-- Header -->
    <div class="relative h-[220px] w-full bg-gradient-to-br from-primary to-blue-700">
      <div class="absolute inset-0 flex flex-col justify-center pt-20 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-white drop-shadow-md">⭐ รีวิวของฉัน</h2>
        <p class="mt-2 text-white/90 drop-shadow-sm">จัดการรีวิวและให้คะแนนการเดินทาง</p>
      </div>
    </div>

    <div class="relative px-4 mx-auto -mt-8 max-w-7xl sm:px-6 lg:px-8">
      <!-- Pending Reviews -->
      <div v-if="pendingBookings.length" class="p-5 mb-6 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
        <h3 class="text-lg font-semibold text-amber-800 mb-3">📝 รอเขียนรีวิว ({{ pendingBookings.length }})</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div v-for="booking in pendingBookings" :key="booking.id"
            class="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100">
            <div>
              <p class="text-sm font-medium text-primary">
                {{ booking.route?.startLocation?.name || 'ต้นทาง' }} → {{ booking.route?.endLocation?.name || 'ปลายทาง' }}
              </p>
              <p class="text-xs text-slate-500 mt-0.5">
                คนขับ: {{ booking.route?.driver?.firstName || 'ไม่ระบุ' }}
              </p>
            </div>
            <NuxtLink :to="`/reviews/create?bookingId=${booking.id}`"
              class="px-3 py-1.5 text-sm text-white bg-cta rounded-lg hover:bg-cta-hover transition-colors">
              เขียนรีวิว
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="p-3 mb-6 bg-white border border-slate-200 rounded-xl shadow-lg">
        <div class="flex gap-2">
          <button @click="activeTab = 'my'"
            :class="['flex-1 text-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
              activeTab === 'my' ? 'bg-primary text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100']">
            รีวิวที่เขียน ({{ myReviews.length }})
          </button>
          <button @click="activeTab = 'received'"
            :class="['flex-1 text-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
              activeTab === 'received' ? 'bg-primary text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100']">
            รีวิวที่ได้รับ
          </button>
          <!-- Private Feedback tab — DRIVER only -->
          <button v-if="isDriver" @click="activeTab = 'private'"
            :class="['flex-1 text-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
              activeTab === 'private' ? 'bg-primary text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100']">
            ความเห็นส่วนตัว
            <span v-if="privateFeedbacks.length"
              class="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full"
              :class="activeTab === 'private' ? 'bg-white text-slate-700' : 'bg-slate-200 text-slate-700'">
              {{ privateFeedbacks.length }}
            </span>
          </button>
        </div>
      </div>

      <!-- My Reviews List -->
      <div v-if="activeTab === 'my'">
        <div v-if="isLoading" class="p-12 text-center text-slate-400">
          <p>กำลังโหลดรีวิว...</p>
        </div>

        <div v-else-if="myReviews.length === 0" class="p-12 text-center">
          <p class="text-5xl mb-3">📝</p>
          <p class="text-slate-500">ยังไม่ได้เขียนรีวิว</p>
        </div>

        <div v-else class="space-y-4">
          <ReviewCard v-for="review in myReviews" :key="review.id" :review="review" />
        </div>
      </div>

      <!-- Received Reviews (for driver) -->
      <div v-if="activeTab === 'received'">
        <div class="p-8 bg-white border border-slate-200 rounded-xl text-center">
          <div v-if="driverStats" class="mb-6">
            <StarRating :modelValue="driverStats.avgRating" :readonly="true" size="lg" :showValue="true" />
            <p class="text-sm text-slate-500 mt-2">{{ driverStats.totalReviews }} รีวิว</p>
          </div>

          <div v-if="driverReviews.length === 0" class="text-slate-400">
            <p>ยังไม่มีรีวิว</p>
          </div>
          <div v-else class="space-y-4 text-left">
            <ReviewCard v-for="review in driverReviews" :key="review.id" :review="review" />
          </div>
        </div>
      </div>

      <!-- 🔒 Private Feedback Inbox (Driver only) -->
      <div v-if="activeTab === 'private' && isDriver">
        <div v-if="isLoadingPrivate" class="p-12 text-center text-slate-400">
          <p>กำลังโหลด...</p>
        </div>

        <div v-else-if="privateFeedbacks.length === 0"
          class="p-12 bg-white border border-slate-200 rounded-xl text-center">
          <p class="text-slate-500 font-medium">ยังไม่มีความเห็นส่วนตัว</p>
          <p class="text-xs text-slate-400 mt-1">ผู้โดยสารสามารถฝากข้อความถึงคุณโดยตรงตอนเขียนรีวิว</p>
        </div>

        <div v-else class="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          <div v-for="review in privateFeedbacks" :key="review.id" class="flex items-start gap-3 px-5 py-4">
            <div class="shrink-0 mt-0.5 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-500">
              {{ review.isAnonymous ? '?' : (review.displayName || 'P').charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="text-sm font-medium text-slate-700">
                  {{ review.isAnonymous ? 'ผู้โดยสารนิรนาม' : (review.displayName || 'ผู้โดยสาร') }}
                </span>
                <span class="text-xs text-slate-400 shrink-0">{{ formatDate(review.createdAt) }}</span>
              </div>
              <p class="text-sm text-slate-600 leading-relaxed">{{ review.privateFeedback }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useReview } from '~/composables/useReview'
import { useAuth } from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'

dayjs.locale('th')
dayjs.extend(buddhistEra)

definePageMeta({ middleware: 'auth' })
useHead({ title: 'รีวิวของฉัน — Ride' })

const { fetchMyReviews, fetchPendingReviews, fetchDriverReviews, fetchMyReceivedReviews, fetchDriverStats } = useReview()
const { user } = useAuth()
const { toast } = useToast()

const isDriver = computed(() => user.value?.role === 'DRIVER')

const activeTab = ref('my')
const isLoading = ref(false)
const isLoadingPrivate = ref(false)
const myReviews = ref([])
const pendingBookings = ref([])
const driverReviews = ref([])
const driverStats = ref(null)

// Only reviews that have privateFeedback content
const privateFeedbacks = computed(() =>
  driverReviews.value.filter(r => r.privateFeedback && r.privateFeedback.trim() !== '')
)

const formatDate = (date) => dayjs(date).format('D MMM BBBB')

async function loadMyReviews() {
  isLoading.value = true
  try {
    const result = await fetchMyReviews()
    myReviews.value = result?.data || result || []
  } catch (err) {
    console.error('Failed to load reviews:', err)
    toast.error('โหลดรีวิวล้มเหลว', err?.statusMessage || '')
  } finally {
    isLoading.value = false
  }
}

async function loadPending() {
  try {
    pendingBookings.value = await fetchPendingReviews() || []
  } catch {
    pendingBookings.value = []
  }
}

async function loadDriverReviews() {
  if (!user.value?.id) return
  isLoadingPrivate.value = true
  try {
    // Use authenticated endpoint that includes privateFeedback
    const result = await fetchMyReceivedReviews()
    driverReviews.value = result?.data || result || []
    driverStats.value = await fetchDriverStats(user.value.id)
  } catch {
    driverReviews.value = []
  } finally {
    isLoadingPrivate.value = false
  }
}

watch(activeTab, (tab) => {
  if ((tab === 'received' || tab === 'private') && driverReviews.value.length === 0) {
    loadDriverReviews()
  }
})

onMounted(() => {
  loadMyReviews()
  loadPending()
  // Pre-load driver reviews if driver is logged in
  if (isDriver.value) {
    loadDriverReviews()
  }
})
</script>
