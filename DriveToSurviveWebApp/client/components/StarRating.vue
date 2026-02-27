<template>
  <div class="inline-flex items-center gap-0.5" :class="sizeClass">
    <button
      v-for="star in 5"
      :key="star"
      type="button"
      :disabled="readonly"
      @click="!readonly && $emit('update:modelValue', star)"
      @mouseenter="!readonly && (hovered = star)"
      @mouseleave="!readonly && (hovered = 0)"
      class="transition-colors duration-150 focus:outline-none"
      :class="readonly ? 'cursor-default' : 'cursor-pointer'"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        :fill="star <= activeValue ? '#FBBF24' : '#E2E8F0'"
        :class="iconSize"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </button>
    <span v-if="showValue && modelValue" class="ml-1.5 font-medium" :class="valueTextClass">
      {{ modelValue.toFixed(1) }}
    </span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  readonly: { type: Boolean, default: false },
  size: { type: String, default: 'md' }, // sm, md, lg
  showValue: { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])

const hovered = ref(0)

const activeValue = computed(() =>
  hovered.value > 0 ? hovered.value : props.modelValue
)

const sizeClass = computed(() => ({
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
}[props.size] || 'text-base'))

const iconSize = computed(() => ({
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}[props.size] || 'w-6 h-6'))

const valueTextClass = computed(() => ({
  sm: 'text-xs text-slate-500',
  md: 'text-sm text-slate-600',
  lg: 'text-base text-slate-700',
}[props.size] || 'text-sm text-slate-600'))
</script>
