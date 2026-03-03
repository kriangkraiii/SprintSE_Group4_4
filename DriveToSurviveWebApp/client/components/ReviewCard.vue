<template>
  <div class="p-4 bg-white border border-slate-200 rounded-xl">
    <div class="flex items-start justify-between mb-2">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-primary">{{ review.displayName || 'ผู้โดยสาร' }}</span>
        <span v-if="review.isAnonymous" class="px-1.5 py-0.5 text-xs bg-slate-100 text-slate-500 rounded">ไม่ระบุตัวตน</span>
      </div>
      <span class="text-xs text-slate-400">{{ formatDate(review.createdAt) }}</span>
    </div>

    <StarRating :modelValue="review.rating" :readonly="true" size="sm" />

    <!-- Tags -->
    <div v-if="parsedTags.length" class="flex flex-wrap gap-1.5 mt-2">
      <span
        v-for="tag in parsedTags"
        :key="tag"
        class="px-2 py-0.5 text-xs rounded-full"
        :class="review.rating >= 4 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
      >
        {{ tagLabels[tag] || tag }}
      </span>
    </div>

    <!-- Comment -->
    <p v-if="review.comment" class="mt-2 text-sm text-slate-600 leading-relaxed">
      {{ review.comment }}
    </p>

    <!-- Private feedback (driver view) -->
    <div v-if="review.privateFeedback && showPrivate" class="mt-2 p-2 bg-blue-50 rounded-lg">
      <p class="text-xs font-medium text-blue-600 mb-0.5">ข้อเสนอแนะส่วนตัว:</p>
      <p class="text-sm text-blue-800">{{ review.privateFeedback }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'

dayjs.locale('th')
dayjs.extend(buddhistEra)

const props = defineProps({
  review: { type: Object, required: true },
  showPrivate: { type: Boolean, default: false },
})

const tagLabels = {
  polite: '🤝 สุภาพ',
  safe_driving: '🛞 ขับปลอดภัย',
  clean_car: '✨ รถสะอาด',
  on_time: '⏰ ตรงเวลา',
  good_conversation: '💬 คุยสนุก',
  reckless_driving: '⚠️ ขับเร็ว/อันตราย',
  impolite: '😤 ไม่สุภาพ',
  dirty_car: '🚗 รถไม่สะอาด',
  late_arrival: '⏰ มาสาย',
  wrong_route: '🗺️ ไปผิดเส้นทาง',
}

const parsedTags = computed(() => {
  const tags = props.review.tags
  if (!tags) return []
  return Array.isArray(tags) ? tags : []
})

const formatDate = (date) => dayjs(date).format('D MMM BBBB')
</script>
