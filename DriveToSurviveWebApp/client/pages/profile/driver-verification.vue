<template>
    <div class="bg-gray-50">
        <div class="flex items-center justify-center min-h-screen py-8">
            <div
                class="flex w-full max-w-6xl mx-4 overflow-hidden bg-white border border-gray-300 rounded-lg shadow-lg">

                <ProfileSidebar />

                <main class="flex-1 p-8 ">

                    <div class="mb-8">
                        <div class="p-6 bg-white border border-gray-300 shadow rounded-xl">
                            <div class="flex items-center justify-between mb-4">
                                <h2 class="text-lg font-semibold text-gray-900">
                                    ข้อมูลการยืนยันผู้ขับขี่ของฉัน
                                </h2>

                                <!-- แสดงเฉพาะเมื่อมีข้อมูล meVerification -->
                                <div class="flex items-center gap-2" v-if="meVerification">
                                    <span v-if="meVerification.verifiedByOcr"
                                        class="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200">
                                        🤖 OCR
                                    </span>
                                    <span
                                        class="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full"
                                        :class="statusBadgeClass(meVerification.status)">
                                        {{ statusLabel(meVerification.status) }}
                                    </span>
                                </div>
                            </div>

                            <div v-if="isLoadingMe" class="text-gray-500">กำลังโหลดข้อมูล...</div>

                            <div v-else-if="meVerification" class="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <div class="text-sm text-gray-500">ชื่อบนบัตร</div>
                                    <div class="font-medium text-gray-900">{{ meVerification.firstNameOnLicense }}</div>
                                </div>
                                <div>
                                    <div class="text-sm text-gray-500">นามสกุลบนบัตร</div>
                                    <div class="font-medium text-gray-900">{{ meVerification.lastNameOnLicense }}</div>
                                </div>
                                <div>
                                    <div class="text-sm text-gray-500">เลขที่ใบขับขี่</div>
                                    <div class="flex items-center font-medium text-gray-900 break-all">
                                        <span>{{ showLicense ? meVerification.licenseNumber :
                                            maskedLicense(meVerification.licenseNumber) }}</span>
                                        <button type="button" @click="showLicense = !showLicense"
                                            class="p-1 ml-2 text-gray-500 rounded hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            :aria-label="showLicense ? 'ซ่อนเลขที่ใบขับขี่' : 'แสดงเลขที่ใบขับขี่'"
                                            title="สลับการแสดงเลขที่ใบขับขี่">
                                            <!-- eye (show) -->
                                            <svg v-if="!showLicense" class="w-5 h-5" fill="none" stroke="currentColor"
                                                viewBox="0 0 24 24">
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
                                    <div class="text-sm text-gray-500">ชนิดของบัตรขับขี่</div>
                                    <div class="font-medium text-gray-900">{{ typeLabel(meVerification.typeOnLicense) }}
                                    </div>
                                </div>
                                <div>
                                    <div class="text-sm text-gray-500">วันออกใบขับขี่</div>
                                    <div class="font-medium text-gray-900">{{
                                        formatDate(meVerification.licenseIssueDate) }}</div>
                                </div>
                                <div>
                                    <div class="text-sm text-gray-500">วันหมดอายุใบขับขี่</div>
                                    <div class="font-medium text-gray-900">{{
                                        formatDate(meVerification.licenseExpiryDate) }}</div>
                                </div>
                            </div>

                            <div v-else class="text-gray-500">
                                ยังไม่มีประวัติการยืนยันผู้ขับขี่
                            </div>
                        </div>
                    </div>

                    <!-- ถ้า OCR ยืนยันแล้ว แสดงข้อมูล OCR -->
                    <div v-if="meVerification && meVerification.verifiedByOcr && meVerification.ocrData" class="mb-8">
                        <div class="p-6 bg-white border border-green-200 shadow rounded-xl">
                            <div class="flex items-center gap-2 mb-4">
                                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h2 class="text-lg font-semibold text-green-700">ยืนยันตัวตนผู้ขับขี่ด้วย OCR เรียบร้อยแล้ว</h2>
                            </div>
                            <div class="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                                <div v-if="meVerification.ocrData.thName"><span class="text-gray-500">ชื่อ (OCR):</span> <span class="font-medium">{{ meVerification.ocrData.thName }}</span></div>
                                <div v-if="meVerification.ocrData.licenseNumber"><span class="text-gray-500">เลขใบขับขี่:</span> <span class="font-medium">{{ meVerification.ocrData.licenseNumber }}</span></div>
                                <div v-if="meVerification.ocrData.thType || meVerification.ocrData.enType"><span class="text-gray-500">ประเภท:</span> <span class="font-medium">{{ meVerification.ocrData.thType || meVerification.ocrData.enType }}</span></div>
                                <div v-if="meVerification.ocrData.idNumber"><span class="text-gray-500">เลขบัตร ปชช.:</span> <span class="font-medium">{{ meVerification.ocrData.idNumber }}</span></div>
                                <div v-if="meVerification.ocrData.thIssueDate || meVerification.ocrData.enIssueDate"><span class="text-gray-500">วันออก:</span> <span class="font-medium">{{ meVerification.ocrData.thIssueDate || meVerification.ocrData.enIssueDate }}</span></div>
                                <div v-if="meVerification.ocrData.thExpiryDate || meVerification.ocrData.enExpiryDate"><span class="text-gray-500">หมดอายุ:</span> <span class="font-medium">{{ meVerification.ocrData.thExpiryDate || meVerification.ocrData.enExpiryDate }}</span></div>
                            </div>
                            <p class="mt-4 text-xs text-gray-400">ยืนยันอัตโนมัติ — ไม่ต้องรอแอดมินอนุมัติ</p>
                        </div>
                    </div>

                    <div v-if="!isDriverVerified" class="mb-8 text-center">
                        <div class="inline-flex items-center justify-center w-16 h-16 mb-4 bg-blue-600 rounded-full">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                                </path>
                            </svg>
                        </div>
                        <h1 class="mb-2 text-3xl font-bold text-gray-800">การยืนยันตัวตนสำหรับผู้ขับขี่</h1>
                        <p class="max-w-md mx-auto text-gray-600">
                            อัปโหลดภาพบัตรขับขี่และรูปถ่าย ระบบจะยืนยันตัวตนอัตโนมัติด้วย OCR
                        </p>
                        <div class="mt-4">
                            <NuxtLink to="/driverVerify" class="inline-flex items-center gap-2 px-6 py-3 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                ยืนยันตัวตนด้วย OCR (อัตโนมัติ)
                            </NuxtLink>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ProfileSidebar from '~/components/ProfileSidebar.vue';

definePageMeta({
    middleware: 'auth'
});

const { $api } = useNuxtApp();

const meVerification = ref(null)
const isLoadingMe = ref(false)
const showLicense = ref(false)

const typeLabelMap = {
    PRIVATE_CAR_TEMPORARY: 'รถยนต์ส่วนบุคคลชั่วคราว (2 ปี)',
    PRIVATE_CAR: 'รถยนต์ส่วนบุคคล (5 ปี)',
    PUBLIC_CAR: 'รถยนต์สาธารณะ',
    LIFETIME: 'ตลอดชีพ',
}
const statusLabelMap = {
    PENDING: 'กำลังตรวจสอบ',
    APPROVED: 'อนุมัติแล้ว',
    REJECTED: 'ถูกปฏิเสธ',
}

const typeLabel = (v) => typeLabelMap[v] || v

const formatDate = (iso) => {
    if (!iso) return '-'
    try {
        return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: 'long', year: 'numeric' })
    } catch { return '-' }
}

const statusLabel = (v) => statusLabelMap[v] || v || '-'

const statusBadgeClass = (v) => {
    switch (v) {
        case 'APPROVED':
            return 'bg-green-100 text-green-700 border border-green-200'
        case 'REJECTED':
            return 'bg-red-100 text-red-700 border border-red-200'
        case 'PENDING':
        default:
            return 'bg-amber-100 text-amber-700 border border-amber-200'
    }
}

const isDriverVerified = computed(() => {
    return !!(meVerification.value && (meVerification.value.status === 'APPROVED' || meVerification.value.verifiedByOcr))
})

const fetchMyDriverVerification = async () => {
    isLoadingMe.value = true
    try {
        const res = await $api('/driver-verifications/me')
        const record = (res && typeof res === 'object' && 'data' in res) ? res.data : res
        meVerification.value = record || null
    } catch (e) {
        meVerification.value = null
    } finally {
        isLoadingMe.value = false
    }
}

const maskedLicense = (value) => {
    if (!value) return '-'
    const s = String(value)
    const last4 = s.slice(-4)
    return '•'.repeat(Math.max(0, s.length - 4)) + last4
}

onMounted(() => {
    fetchMyDriverVerification()
})

</script>

<style scoped>
</style>