<template>
    <div class="bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8">
            <div
                class="flex w-full overflow-hidden bg-white border border-gray-300 rounded-lg shadow-lg">

                <ProfileSidebar />

                <main class="flex-1 p-8 ">

                    <div class="mb-8">
                        <div class="p-6 bg-white border border-gray-300 shadow rounded-xl">
                            <div class="flex items-center mb-4">
                                <h2 class="text-lg font-semibold text-gray-900">
                                    ข้อมูลการยืนยันขั้นพื้นฐานของฉัน
                                </h2>

                                <!-- แสดงสถานะ isVerified ชิดขวา -->
                                <div class="ml-auto flex items-center gap-2" v-if="meBasic">
                                    <!-- OCR Badge -->
                                    <span v-if="meBasic.verifiedByOcr"
                                        class="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200">
                                        OCR
                                    </span>
                                    <!-- VERIFIED -->
                                    <span v-if="meBasic.isVerified || meBasic.verifiedByOcr"
                                        class="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M5 13l4 4L19 7" />
                                        </svg>
                                        ยืนยันแล้ว
                                    </span>

                                    <!-- NOT VERIFIED -->
                                    <span v-else
                                        class="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
                                        <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        ยังไม่ยืนยัน
                                    </span>
                                </div>
                            </div>

                            <div v-if="isLoadingMeBasic" class="text-gray-500">กำลังโหลดข้อมูล...</div>

                            <div v-else-if="meBasic" class="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <div class="text-sm text-gray-500">ชื่อ</div>
                                    <div class="font-medium text-gray-900">{{ meBasic.firstName || '-' }}</div>
                                </div>
                                <div>
                                    <div class="text-sm text-gray-500">นามสกุล</div>
                                    <div class="font-medium text-gray-900">{{ meBasic.lastName || '-' }}</div>
                                </div>
                                <div>
                                    <div class="text-sm text-gray-500">เลขประจำตัว</div>
                                    <div class="flex items-center font-medium text-gray-900 break-all">
                                        <span>
                                            {{ showNationalId ? formatNationalId(meBasic.nationalIdNumber) :
                                                maskedNationalId(meBasic.nationalIdNumber) }}
                                        </span>
                                        <button type="button" @click="showNationalId = !showNationalId"
                                            class="p-1 ml-2 text-gray-500 rounded hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            :aria-label="showNationalId ? 'ซ่อนเลขประจำตัว' : 'แสดงเลขประจำตัว'"
                                            title="สลับการแสดงเลขประจำตัว">
                                            <!-- eye (show) -->
                                            <svg v-if="!showNationalId" class="w-5 h-5" fill="none"
                                                stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            <!-- eye-off (hide) -->
                                            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor"
                                                viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a10.053 10.053 0 012.227-3.592M6.223 6.223A10.05 10.05 0 0112 5c4.477 0 8.268 2.943 9.542 7a10.05 10.05 0 01-2.042 3.33M15 12a3 3 0 00-3-3M3 3l18 18" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <div class="text-sm text-gray-500">วันหมดอายุบัตรประชาชน</div>
                                    <div class="font-medium text-gray-900">{{ formatDate(meBasic.nationalIdExpiryDate)
                                        }}</div>
                                </div>
                            </div>

                            <div v-else class="text-gray-500">
                                ยังไม่มีประวัติการยืนยันขั้นพื้นฐาน
                            </div>
                        </div>
                    </div>
                    <!-- /โซนข้อมูลการยืนยันที่เคยยื่นไว้ (ใหม่) -->


                    <!-- OCR data display (ถ้ายืนยันแล้ว) -->
                    <div v-if="isBasicVerified && meBasic.nationalIdOcrData" class="mb-8">
                        <div class="p-6 bg-white border border-green-200 shadow rounded-xl">
                            <div class="flex items-center gap-2 mb-4">
                                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h2 class="text-lg font-semibold text-green-700">ยืนยันตัวตนด้วย OCR เรียบร้อยแล้ว</h2>
                            </div>
                            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div v-if="meBasic.nationalIdOcrData?.front">
                                    <h3 class="mb-2 text-sm font-medium text-gray-500">ข้อมูลด้านหน้าบัตร</h3>
                                    <div class="space-y-1 text-sm">
                                        <div v-if="meBasic.nationalIdOcrData.front.thName"><span class="text-gray-500">ชื่อ:</span> <span class="font-medium">{{ meBasic.nationalIdOcrData.front.thName }}</span></div>
                                        <div v-if="meBasic.nationalIdOcrData.front.enName"><span class="text-gray-500">Name:</span> <span class="font-medium">{{ meBasic.nationalIdOcrData.front.enName }}</span></div>
                                        <div v-if="meBasic.nationalIdOcrData.front.idNumber"><span class="text-gray-500">เลขบัตร:</span> <span class="font-medium">{{ meBasic.nationalIdOcrData.front.idNumber }}</span></div>
                                        <div v-if="meBasic.nationalIdOcrData.front.thExpiryDate"><span class="text-gray-500">หมดอายุ:</span> <span class="font-medium">{{ meBasic.nationalIdOcrData.front.thExpiryDate }}</span></div>
                                    </div>
                                </div>
                                <div v-if="meBasic.nationalIdOcrData?.back">
                                    <h3 class="mb-2 text-sm font-medium text-gray-500">ข้อมูลด้านหลังบัตร</h3>
                                    <div class="space-y-1 text-sm">
                                        <div v-if="meBasic.nationalIdBackNumber"><span class="text-gray-500">เลขหลังบัตร:</span> <span class="font-medium">{{ meBasic.nationalIdBackNumber }}</span></div>
                                    </div>
                                </div>
                            </div>
                            <p class="mt-4 text-xs text-gray-400">ยืนยันด้วยระบบการยืนยันอัตโนมัติ</p>
                        </div>
                    </div>

                    <div v-if="!isBasicVerified" class="mb-8 text-center">
                        <div class="inline-flex items-center justify-center w-16 h-16 mb-4 bg-blue-600 rounded-full">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                                </path>
                            </svg>
                        </div>
                        <h1 class="mb-2 text-3xl font-bold text-gray-800">การยืนยันตัวตนขั้นพื้นฐาน</h1>
                        <p class="max-w-md mx-auto text-gray-600">
                            การยืนยันบัตรประชาชนจะดำเนินการผ่านระบบ OCR อัตโนมัติในขั้นตอนการลงทะเบียน
                        </p>
                        <div class="mt-6">
                            <div class="p-4 mx-auto max-w-md bg-amber-50 border border-amber-200 rounded-xl">
                                <p class="text-sm text-amber-700">
                                    หากคุณยังไม่ได้ยืนยันบัตรประชาชน กรุณาติดต่อแอดมินเพื่อดำเนินการ หรือลงทะเบียนใหม่พร้อมแนบรูปบัตรประชาชน
                                </p>
                            </div>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ProfileSidebar from '~/components/ProfileSidebar.vue';

definePageMeta({
    middleware: 'auth'
});

const { $api } = useNuxtApp();

const meBasic = ref(null)
const isLoadingMeBasic = ref(false)
const showNationalId = ref(false)

const formatDate = (iso) => {
    if (!iso) return '-'
    try {
        return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: 'long', year: 'numeric' })
    } catch { return '-' }
}

const formatNationalId = (raw) => {
    if (!raw) return '-'
    const s = String(raw).replace(/\D/g, '').slice(0, 13)
    if (s.length < 13) return s
    return `${s[0]}-${s.slice(1, 5)}-${s.slice(5, 10)}-${s.slice(10, 12)}-${s.slice(12, 13)}`
}

const maskedNationalId = (raw) => {
    if (!raw) return '-'
    const s = String(raw)
    const last4 = s.slice(-4)
    return '•'.repeat(Math.max(0, s.length - 4)) + last4
}

const isBasicVerified = computed(() => {
    return !!(meBasic.value && (meBasic.value.isVerified || meBasic.value.verifiedByOcr))
})

const fetchMeBasic = async () => {
    isLoadingMeBasic.value = true
    try {
        const res = await $api('/users/me')
        const record = (res && typeof res === 'object' && 'data' in res) ? res.data : res
        meBasic.value = record || null
    } catch (e) {
        meBasic.value = null
    } finally {
        isLoadingMeBasic.value = false
    }
}

onMounted(() => {
    fetchMeBasic()
})
</script>

<style scoped>
</style>