<template>
  <div class="min-h-screen bg-surface pb-12">
    <!-- Header -->
    <div class="relative h-[220px] w-full bg-gradient-to-br from-primary to-blue-700">
      <div class="absolute inset-0 flex flex-col justify-center px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <button @click="$router.back()"
          class="mb-3 flex items-center gap-1 text-white/80 hover:text-white text-sm transition-colors cursor-pointer">
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
          <ReviewCard v-for="review in reviews" :key="review.id" :review="review" :showPrivate="isOwnProfile"
            @dispute="openDisputeModal" />
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

    <!-- Dispute Modal -->
    <div v-if="showDisputeModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      @click.self="showDisputeModal = false">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <!-- Modal Header -->
        <div class="px-6 py-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-lg">🚩</div>
            <div>
              <h3 class="text-base font-semibold text-slate-800">รายงานข้อพิพาท</h3>
              <p class="text-xs text-slate-500">แจ้งรีวิวที่ไม่เป็นธรรมให้แอดมินพิจารณา</p>
            </div>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="px-6 py-5 space-y-4">
          <!-- Target Review Preview -->
          <div v-if="disputeTarget" class="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-yellow-400 text-sm">{{ '★'.repeat(disputeTarget.rating) }}{{ '☆'.repeat(5 - disputeTarget.rating) }}</span>
              <span class="text-xs text-slate-400">{{ disputeTarget.displayName || 'ผู้โดยสาร' }}</span>
            </div>
            <p v-if="disputeTarget.comment" class="text-xs text-slate-500 line-clamp-2">{{ disputeTarget.comment }}</p>
          </div>

          <!-- Reason Selection -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">เหตุผลในการรายงาน</label>
            <div class="space-y-2">
              <label v-for="r in disputeReasons" :key="r.value"
                class="flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer"
                :class="disputeReason === r.value ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:bg-slate-50'">
                <input type="radio" v-model="disputeReason" :value="r.value"
                  class="w-4 h-4 text-red-600 focus:ring-red-500" />
                <div>
                  <span class="text-sm font-medium text-slate-700">{{ r.icon }} {{ r.label }}</span>
                  <p class="text-xs text-slate-400">{{ r.desc }}</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Detail -->
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">รายละเอียดเพิ่มเติม</label>
            <textarea v-model="disputeDetail" rows="3" maxlength="500"
              class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 transition resize-none"
              placeholder="อธิบายสาเหตุที่คุณคิดว่ารีวิวนี้ไม่เป็นธรรม..."></textarea>
            <p class="text-xs text-slate-400 text-right mt-1">{{ disputeDetail.length }}/500</p>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button @click="showDisputeModal = false"
            class="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer">
            ยกเลิก
          </button>
          <button @click="submitDispute" :disabled="!disputeReason || !disputeDetail.trim() || isSubmittingDispute"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition cursor-pointer">
            {{ isSubmittingDispute ? 'กำลังส่ง...' : '🚩 ส่งรายงาน' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useReview } from '~/composables/useReview'
import { useAuth } from '~/composables/useAuth'
import { useToast } from '~/composables/useToast'

const route = useRoute()
const driverId = route.params.driverId
const { user } = useAuth()
const { toast } = useToast()

const isOwnProfile = computed(() => {
  return String(user.value?.id) === String(driverId)
})

useHead({ title: 'รีวิวคนขับ — Ride' })

const { fetchDriverReviews, fetchDriverStats, createDispute } = useReview()

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

// ─── Dispute Modal ───────────────────────────────────
const showDisputeModal = ref(false)
const disputeTarget = ref(null)
const disputeReason = ref('')
const disputeDetail = ref('')
const isSubmittingDispute = ref(false)

const disputeReasons = [
  { value: 'FAKE_REVIEW', icon: '🚫', label: 'รีวิวปลอม', desc: 'ผู้โดยสารไม่ได้ใช้บริการจริง' },
  { value: 'WRONG_PERSON', icon: '👤', label: 'คนผิด', desc: 'รีวิวนี้ไม่ใช่สำหรับฉัน' },
  { value: 'INACCURATE', icon: '❌', label: 'ข้อมูลไม่ถูกต้อง', desc: 'เนื้อหาไม่ตรงกับความเป็นจริง' },
  { value: 'OFFENSIVE', icon: '⚠️', label: 'เนื้อหาไม่เหมาะสม', desc: 'มีคำหยาบหรือเนื้อหาลามก' },
  { value: 'OTHER', icon: '📝', label: 'อื่นๆ', desc: 'ระบุเหตุผลในช่องรายละเอียด' },
]

function openDisputeModal(review) {
  disputeTarget.value = review
  disputeReason.value = ''
  disputeDetail.value = ''
  showDisputeModal.value = true
}

async function submitDispute() {
  if (!disputeTarget.value || !disputeReason.value || !disputeDetail.value.trim()) return
  isSubmittingDispute.value = true
  try {
    await createDispute({
      reviewId: disputeTarget.value.id,
      reason: disputeReason.value,
      detail: disputeDetail.value.trim(),
    })
    toast.success('ส่งรายงานข้อพิพาทแล้ว', 'แอดมินจะพิจารณาโดยเร็ว')
    // Mark the review as disputed in local state
    const idx = reviews.value.findIndex(r => r.id === disputeTarget.value.id)
    if (idx >= 0) reviews.value[idx].isDisputed = true
    showDisputeModal.value = false
  } catch (err) {
    const msg = err?.statusMessage || err?.data?.message || err?.message || ''
    if (msg.includes('Already disputed') || err?.statusCode === 409) {
      toast.error('รายงานข้อพิพาทซ้ำ', 'คุณได้ส่งรายงานสำหรับรีวิวนี้ไปแล้ว')
      const idx = reviews.value.findIndex(r => r.id === disputeTarget.value.id)
      if (idx >= 0) reviews.value[idx].isDisputed = true
      showDisputeModal.value = false
    } else {
      toast.error('เกิดข้อผิดพลาด', msg || 'ไม่สามารถส่งรายงานได้')
    }
  } finally {
    isSubmittingDispute.value = false
  }
}

// ─── Data Loading ────────────────────────────────────
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
