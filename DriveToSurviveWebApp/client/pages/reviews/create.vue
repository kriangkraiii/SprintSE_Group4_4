<template>
  <div class="min-h-screen bg-surface pb-12">
    <!-- Header -->
    <div class="relative h-[180px] w-full bg-gradient-to-br from-primary to-blue-700">
      <div class="absolute inset-0 flex flex-col justify-center px-4 mx-auto max-w-3xl sm:px-6">
        <h2 class="text-2xl font-bold text-white drop-shadow-md">✍️ เขียนรีวิว</h2>
        <p class="mt-1 text-white/90 text-sm">แบ่งปันประสบการณ์การเดินทางกับผู้โดยสารคนอื่น</p>
      </div>
    </div>

    <div class="relative px-4 mx-auto -mt-8 max-w-3xl sm:px-6">
      <div class="p-6 bg-white border border-slate-200 rounded-xl shadow-lg">

        <!-- Loading -->
        <div v-if="isLoadingBooking" class="py-12 text-center text-slate-400">
          <p>กำลังโหลดข้อมูลการจอง...</p>
        </div>

        <!-- Error -->
        <div v-else-if="bookingError" class="py-12 text-center">
          <p class="text-red-500">{{ bookingError }}</p>
          <NuxtLink to="/reviews" class="mt-4 inline-block text-primary hover:underline">← กลับไปหน้ารีวิว</NuxtLink>
        </div>

        <template v-else>
          <!-- Star Rating -->
          <div class="text-center mb-6">
            <p class="text-sm text-slate-500 mb-3">ให้คะแนนคนขับ</p>
            <StarRating v-model="form.rating" size="lg" />
            <p v-if="form.rating" class="mt-2 text-lg font-medium" :class="ratingColor">
              {{ ratingLabel }}
            </p>
          </div>

          <!-- Tags -->
          <div v-if="form.rating" class="mb-6">
            <p class="text-sm font-medium text-slate-600 mb-2">
              เลือกแท็ก {{ form.rating <= 3 ? '(บังคับ 1 ข้อ)' : '(ไม่บังคับ)' }}
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="tag in availableTags"
                :key="tag.value"
                type="button"
                @click="toggleTag(tag.value)"
                :class="[
                  'px-3 py-1.5 text-sm rounded-full border transition-all duration-200',
                  form.tags.includes(tag.value)
                    ? (form.rating >= 4 ? 'bg-green-500 text-white border-green-500' : 'bg-red-500 text-white border-red-500')
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                ]"
              >
                {{ tag.label }}
              </button>
            </div>
          </div>

          <!-- Comment -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-slate-600 mb-1">
              ความคิดเห็น {{ form.rating && form.rating <= 2 ? '(บังคับ ≥10 ตัวอักษร)' : '(ไม่บังคับ)' }}
            </label>
            <textarea
              v-model="form.comment"
              rows="3"
              maxlength="1000"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              placeholder="เล่าประสบการณ์ของคุณ..."
            ></textarea>
            <p class="text-xs text-slate-400 text-right mt-0.5">{{ (form.comment || '').length }}/1000</p>
          </div>

          <!-- Private feedback -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-slate-600 mb-1">
              ข้อเสนอแนะส่วนตัว (เฉพาะคนขับเห็น)
            </label>
            <textarea
              v-model="form.privateFeedback"
              rows="2"
              maxlength="500"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              placeholder="เช่น อยากให้ปรับอะไร..."
            ></textarea>
          </div>

          <!-- Anonymous toggle -->
          <div class="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-lg">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="form.isAnonymous" class="sr-only peer" />
              <div class="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
            <span class="text-sm text-slate-600">ไม่แสดงชื่อ (Anonymous)</span>
          </div>

          <!-- Validation Error -->
          <div v-if="validationError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600">{{ validationError }}</p>
          </div>

          <!-- Submit -->
          <button
            @click="submitReview"
            :disabled="isSubmitting || !canSubmit"
            class="w-full py-3 text-white font-medium bg-cta rounded-lg hover:bg-cta-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSubmitting ? 'กำลังส่ง...' : 'ส่งรีวิว' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReview } from '~/composables/useReview'
import { useToast } from '~/composables/useToast'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'เขียนรีวิว — Ride' })

const route = useRoute()
const router = useRouter()
const { createReview } = useReview()
const { toast } = useToast()

const bookingId = computed(() => route.query.bookingId)
const isLoadingBooking = ref(false)
const bookingError = ref(null)
const isSubmitting = ref(false)

const form = ref({
  rating: 0,
  tags: [],
  comment: '',
  privateFeedback: '',
  isAnonymous: false,
})

const positiveTags = [
  { value: 'polite', label: '🤝 สุภาพ' },
  { value: 'safe_driving', label: '🛞 ขับปลอดภัย' },
  { value: 'clean_car', label: '✨ รถสะอาด' },
  { value: 'on_time', label: '⏰ ตรงเวลา' },
  { value: 'good_conversation', label: '💬 คุยสนุก' },
]

const negativeTags = [
  { value: 'reckless_driving', label: '⚠️ ขับเร็ว/อันตราย' },
  { value: 'impolite', label: '😤 ไม่สุภาพ' },
  { value: 'dirty_car', label: '🚗 รถไม่สะอาด' },
  { value: 'late_arrival', label: '⏰ มาสาย' },
  { value: 'wrong_route', label: '🗺️ ไปผิดเส้นทาง' },
]

const availableTags = computed(() =>
  form.value.rating >= 4 ? positiveTags : negativeTags
)

const ratingLabel = computed(() => {
  const labels = { 1: 'แย่มาก', 2: 'ไม่ดี', 3: 'พอใช้', 4: 'ดี', 5: 'ยอดเยี่ยม!' }
  return labels[form.value.rating] || ''
})

const ratingColor = computed(() => {
  if (form.value.rating >= 4) return 'text-green-600'
  if (form.value.rating === 3) return 'text-amber-600'
  return 'text-red-600'
})

const canSubmit = computed(() => {
  if (!form.value.rating) return false
  if (form.value.rating <= 3 && form.value.tags.length === 0) return false
  if (form.value.rating <= 2 && (!form.value.comment || form.value.comment.length < 10)) return false
  return true
})

const validationError = computed(() => {
  if (!form.value.rating) return null
  if (form.value.rating <= 3 && form.value.tags.length === 0) return 'กรุณาเลือกแท็กอย่างน้อย 1 ข้อ'
  if (form.value.rating <= 2 && (!form.value.comment || form.value.comment.length < 10)) {
    const len = (form.value.comment || '').length
    return `กรุณาระบุเหตุผล (อย่างน้อย 10 ตัวอักษร — ตอนนี้ ${len}/10)`
  }
  return null
})

const toggleTag = (tag) => {
  const idx = form.value.tags.indexOf(tag)
  if (idx >= 0) {
    form.value.tags.splice(idx, 1)
  } else {
    form.value.tags.push(tag)
  }
}

async function submitReview() {
  if (!form.value.rating) return

  isSubmitting.value = true
  try {
    await createReview({
      bookingId: bookingId.value,
      rating: form.value.rating,
      tags: form.value.tags,
      comment: form.value.comment || undefined,
      privateFeedback: form.value.privateFeedback || undefined,
      isAnonymous: form.value.isAnonymous,
    })

    toast.success('ส่งรีวิวสำเร็จ', 'ขอบคุณที่แบ่งปันประสบการณ์ 🎉')
    router.push('/reviews')
  } catch (err) {
    console.error('Submit review failed:', err)
    toast.error('ส่งรีวิวไม่สำเร็จ', err?.statusMessage || 'กรุณาลองใหม่')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  if (!bookingId.value) {
    bookingError.value = 'ไม่พบรหัสการจอง กรุณาเลือกจากหน้ารีวิว'
  }
})
</script>
