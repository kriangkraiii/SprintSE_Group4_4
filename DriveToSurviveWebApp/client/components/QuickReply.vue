<template>
  <div v-if="show" class="px-4 pb-2">
    <div class="flex flex-wrap gap-2">
      <button
        v-for="reply in templates"
        :key="reply.th"
        @click="$emit('select', reply.th)"
        class="px-3 py-1.5 text-sm bg-blue-50 text-primary border border-blue-200 rounded-full hover:bg-blue-100 transition-colors whitespace-nowrap"
      >
        {{ reply.th }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: true },
  type: { type: String, default: 'driver' },
})

defineEmits(['select'])

const driverTemplates = [
  { th: 'กำลังไปรับครับ/ค่ะ', en: 'On my way' },
  { th: 'ถึงแล้วครับ/ค่ะ', en: "I've arrived" },
  { th: 'รอสักครู่ครับ/ค่ะ', en: 'Please wait a moment' },
  { th: 'จอดรอที่จุดนัดพบแล้ว', en: 'Waiting at pickup' },
]

const passengerTemplates = [
  { th: 'รอข้างล่างแล้ว', en: 'Waiting downstairs' },
  { th: 'กำลังลงไป', en: 'Coming down now' },
  { th: 'รอ 5 นาทีนะคะ/ครับ', en: 'Please wait 5 minutes' },
  { th: 'เปลี่ยนจุดรับ', en: 'Change pickup location' },
]

const templates = computed(() =>
  props.type === 'driver' ? driverTemplates : passengerTemplates
)
</script>
