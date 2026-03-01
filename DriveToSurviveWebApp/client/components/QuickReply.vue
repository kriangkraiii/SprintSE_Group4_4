<template>
  <div v-if="show" class="px-4 pb-2">
    <!-- Shortcut chips -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="reply in allReplies"
        :key="reply.id || reply.th"
        @click="$emit('select', reply.text || reply.th)"
        class="px-3 py-1.5 text-sm bg-blue-50 text-primary border border-blue-200 rounded-full hover:bg-blue-100 transition-colors whitespace-nowrap cursor-pointer"
      >
        {{ reply.text || reply.th }}
      </button>
      <!-- Manage shortcuts button -->
      <button
        @click="showManageModal = true"
        class="px-3 py-1.5 text-sm bg-slate-50 text-slate-500 border border-slate-200 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        title="จัดการคีย์ลัด"
      >
        ⚙️ จัดการ
      </button>
    </div>

    <!-- Manage Modal -->
    <Teleport to="body">
      <div v-if="showManageModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showManageModal = false">
        <div class="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-base font-semibold text-slate-800">จัดการคีย์ลัดด่วน</h3>
            <button @click="showManageModal = false" class="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-5 space-y-3 max-h-80 overflow-y-auto">
            <!-- Existing custom shortcuts -->
            <div v-for="item in customShortcuts" :key="item.id"
              class="flex items-center gap-2 p-2 rounded-xl bg-slate-50 group">
              <span v-if="!item._editing" class="flex-1 text-sm text-slate-700">{{ item.text }}</span>
              <input v-else v-model="item._editText" @keydown.enter="saveEdit(item)"
                class="flex-1 text-sm px-2 py-1 border border-blue-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-200" />
              <button v-if="!item._editing" @click="startEdit(item)" class="p-1 text-slate-400 hover:text-blue-500 cursor-pointer" title="แก้ไข">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button v-if="item._editing" @click="saveEdit(item)" class="p-1 text-green-500 hover:text-green-600 cursor-pointer" title="บันทึก">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button @click="removeShortcut(item.id)" class="p-1 text-slate-400 hover:text-red-500 cursor-pointer" title="ลบ">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <div v-if="customShortcuts.length === 0" class="text-center py-4 text-xs text-slate-400">
              ยังไม่มีคีย์ลัดกำหนดเอง
            </div>
          </div>

          <!-- Add new shortcut -->
          <div class="px-5 py-3 border-t border-slate-100">
            <div class="flex gap-2">
              <input v-model="newShortcutText" @keydown.enter="addShortcut"
                class="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                placeholder="พิมพ์คีย์ลัดใหม่..." maxlength="200" />
              <button @click="addShortcut" :disabled="!newShortcutText.trim()"
                class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-40 transition cursor-pointer">
                เพิ่ม
              </button>
            </div>
            <p class="mt-1 text-[10px] text-slate-400">สูงสุด 20 รายการ (ปัจจุบัน {{ customShortcuts.length }}/20)</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useChat } from '~/composables/useChat'
import { useToast } from '~/composables/useToast'

const props = defineProps({
  show: { type: Boolean, default: true },
  type: { type: String, default: 'driver' },
})

defineEmits(['select'])

const { fetchShortcuts, createShortcutApi, updateShortcutApi, deleteShortcutApi } = useChat()
const { toast } = useToast()

const showManageModal = ref(false)
const newShortcutText = ref('')
const customShortcuts = ref([])

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

const defaultTemplates = computed(() =>
  props.type === 'driver' ? driverTemplates : passengerTemplates
)

const allReplies = computed(() => [
  ...customShortcuts.value.map(s => ({ ...s, text: s.text })),
  ...defaultTemplates.value,
])

async function loadShortcuts() {
  try {
    const data = await fetchShortcuts()
    customShortcuts.value = (data || []).map(s => ({ ...s, _editing: false, _editText: '' }))
  } catch { customShortcuts.value = [] }
}

async function addShortcut() {
  if (!newShortcutText.value.trim()) return
  try {
    await createShortcutApi(newShortcutText.value.trim())
    newShortcutText.value = ''
    await loadShortcuts()
    toast.success('เพิ่มคีย์ลัดแล้ว')
  } catch (e) {
    toast.error('ไม่สามารถเพิ่มได้', e?.statusMessage || '')
  }
}

function startEdit(item) {
  item._editing = true
  item._editText = item.text
}

async function saveEdit(item) {
  if (!item._editText.trim()) return
  try {
    await updateShortcutApi(item.id, item._editText.trim())
    item.text = item._editText.trim()
    item._editing = false
    toast.success('แก้ไขแล้ว')
  } catch (e) {
    toast.error('ไม่สามารถแก้ไขได้', e?.statusMessage || '')
  }
}

async function removeShortcut(id) {
  try {
    await deleteShortcutApi(id)
    customShortcuts.value = customShortcuts.value.filter(s => s.id !== id)
    toast.success('ลบคีย์ลัดแล้ว')
  } catch (e) {
    toast.error('ไม่สามารถลบได้', e?.statusMessage || '')
  }
}

onMounted(loadShortcuts)
</script>
