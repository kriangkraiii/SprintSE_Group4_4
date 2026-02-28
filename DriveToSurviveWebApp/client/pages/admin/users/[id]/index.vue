<template>
    <div>
        <AdminHeader />
        <AdminSidebar />

        <main id="main-content" class="main-content mt-16 ml-0 lg:ml-[280px] p-6">
            <!-- Back -->
            <div class="mb-8">
                <NuxtLink to="/admin/users"
                    class="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-md hover:bg-slate-50">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>ย้อนกลับ</span>
                </NuxtLink>
            </div>

            <div class="mx-auto max-w-8xl">
                <!-- Title -->
                <div class="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div class="flex items-center gap-3">
                        <h1 class="text-2xl font-semibold text-primary">รายละเอียดผู้ใช้</h1>
                        <span class="text-sm text-slate-400">ดูข้อมูลทั้งหมดของผู้ใช้งาน</span>
                    </div>

                    <!-- Verify switch -->
                    <div v-if="user" class="flex items-center gap-2">
                        <label class="inline-flex items-center cursor-pointer select-none switch">
                            <input type="checkbox" class="switch-input" :checked="user.isVerified"
                                :disabled="isLoading || toggling" @change="onToggleVerify($event.target.checked)" />
                            <span class="switch-slider"></span>
                        </label>
                        <span class="text-sm" :class="user.isVerified ? 'text-green-700' : 'text-slate-400'">
                            {{ user.isVerified ? 'Verified' : 'Unverified' }}
                        </span>
                    </div>
                </div>

                <!-- Card -->
                <div class="bg-white border border-slate-200 rounded-lg shadow-sm">
                    <div class="px-4 py-4 border-b border-slate-100 sm:px-6">
                        <h2 class="font-medium text-primary">ข้อมูลผู้ใช้</h2>
                    </div>

                    <!-- Loading / Error -->
                    <div v-if="isLoading" class="p-8 text-center text-slate-400">กำลังโหลดข้อมูล...</div>
                    <div v-else-if="loadError" class="p-8 text-center text-red-600">{{ loadError }}</div>

                    <!-- Content -->
                    <div v-else class="grid grid-cols-1 gap-6 p-4 sm:p-6 text-[15px]">
                        <!-- ชื่อหัวการ์ดให้เหมือนหน้าแก้ไข -->
                        <div class="w-full max-w-[80rem] mx-auto space-y-6">
                            <!-- บัญชีผู้ใช้ -->
                            <section>
                                <h3 class="mb-3 text-sm font-semibold text-primary">บัญชีผู้ใช้</h3>
                                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label class="block mb-1 text-xs font-medium text-slate-500">อีเมล</label>
                                        <div
                                            class="w-full px-3 py-2.5 border border-slate-200 rounded-md bg-slate-50 text-primary">
                                            {{ user.email }}
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-xs font-medium text-slate-500">ชื่อผู้ใช้
                                            (username)</label>
                                        <div
                                            class="w-full px-3 py-2.5 border border-slate-200 rounded-md bg-slate-50 text-primary">
                                            {{ user.username }}
                                        </div>
                                    </div>
                                    <div>
                                        <label
                                            class="block mb-1 text-xs font-medium text-slate-500">เบอร์โทรศัพท์</label>
                                        <div
                                            class="w-full px-3 py-2.5 border border-slate-200 rounded-md bg-slate-50 text-primary">
                                            {{ user.phoneNumber || '-' }}
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-xs font-medium text-slate-500">บทบาท</label>
                                        <div
                                            class="w-full px-3 py-2.5 border border-slate-200 rounded-md bg-slate-50 text-primary">
                                            {{ user.role }}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <!-- ข้อมูลส่วนตัว -->
                            <section>
                                <h3 class="mb-3 text-sm font-semibold text-primary">ข้อมูลส่วนตัว</h3>
                                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label class="block mb-1 text-xs font-medium text-slate-500">ชื่อจริง</label>
                                        <div
                                            class="w-full px-3 py-2.5 border border-slate-200 rounded-md bg-slate-50 text-primary">
                                            {{ user.firstName }}
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-xs font-medium text-slate-500">นามสกุล</label>
                                        <div
                                            class="w-full px-3 py-2.5 border border-slate-200 rounded-md bg-slate-50 text-primary">
                                            {{ user.lastName }}
                                        </div>
                                    </div>
                                    <div>
                                        <label class="block mb-1 text-xs font-medium text-slate-500">เพศ</label>
                                        <div
                                            class="w-full px-3 py-2.5 border border-slate-200 rounded-md bg-slate-50 text-primary">
                                            {{ user.gender || '-' }}
                                        </div>
                                    </div>
                                    <!-- ตัดสถานะ Active ออกตามที่ขอ -->
                                </div>
                            </section>

                            <!-- บัตรประชาชน -->
                            <section>
                                <div class="flex items-center gap-2 mb-3">
                                    <h3 class="text-sm font-semibold text-primary">บัตรประชาชน</h3>
                                    <span v-if="user.verifiedByOcr"
                                        class="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200">
                                        🤖 OCR Verified
                                    </span>
                                </div>
                                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label
                                            class="block mb-1 text-xs font-medium text-slate-500">เลขบัตรประชาชน</label>
                                        <div
                                            class="w-full px-3 py-2.5 border border-slate-200 rounded-md bg-slate-50 text-primary">
                                            {{ user.nationalIdNumber || '-' }}
                                        </div>
                                    </div>
                                    <div>
                                        <label
                                            class="block mb-1 text-xs font-medium text-slate-500">วันหมดอายุบัตร</label>
                                        <div
                                            class="w-full px-3 py-2.5 border border-slate-200 rounded-md bg-slate-50 text-primary">
                                            {{ formatDate(user.nationalIdExpiryDate) }}
                                        </div>
                                    </div>
                                    <div v-if="user.nationalIdBackNumber">
                                        <label
                                            class="block mb-1 text-xs font-medium text-slate-500">เลขหลังบัตร</label>
                                        <div
                                            class="w-full px-3 py-2.5 border border-slate-200 rounded-md bg-slate-50 text-primary">
                                            {{ user.nationalIdBackNumber }}
                                        </div>
                                    </div>
                                </div>

                                <!-- รูปบัตรประชาชน -->
                                <div class="grid grid-cols-1 gap-6 mt-4 sm:grid-cols-3">
                                    <div>
                                        <label
                                            class="block mb-1 text-xs font-medium text-slate-500">รูปบัตรประชาชน (หน้า)</label>
                                        <div
                                            class="p-4 text-center border-2 border-slate-200 border-dashed rounded-md bg-slate-50">
                                            <template v-if="user.nationalIdPhotoUrl">
                                                <div class="flex items-center justify-center">
                                                    <a :href="user.nationalIdPhotoUrl" target="_blank" class="block">
                                                        <img :src="user.nationalIdPhotoUrl" alt="National ID Front"
                                                            class="rounded max-h-82" />
                                                    </a>
                                                </div>
                                            </template>
                                            <div v-else class="text-slate-400">
                                                <i class="text-3xl fa-regular fa-image"></i>
                                                <p class="mt-1 text-sm">ไม่มีรูป</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            class="block mb-1 text-xs font-medium text-slate-500">รูปบัตรประชาชน (หลัง)</label>
                                        <div
                                            class="p-4 text-center border-2 border-slate-200 border-dashed rounded-md bg-slate-50">
                                            <template v-if="user.nationalIdBackPhotoUrl">
                                                <div class="flex items-center justify-center">
                                                    <a :href="user.nationalIdBackPhotoUrl" target="_blank" class="block">
                                                        <img :src="user.nationalIdBackPhotoUrl" alt="National ID Back"
                                                            class="rounded max-h-82" />
                                                    </a>
                                                </div>
                                            </template>
                                            <div v-else class="text-slate-400">
                                                <i class="text-3xl fa-regular fa-image"></i>
                                                <p class="mt-1 text-sm">ไม่มีรูป</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label class="block mb-1 text-xs font-medium text-slate-500">รูปถ่ายใบหน้า
                                            (Selfie)</label>
                                        <div
                                            class="p-4 text-center border-2 border-slate-200 border-dashed rounded-md bg-slate-50">
                                            <template v-if="user.selfiePhotoUrl">
                                                <div class="flex items-center justify-center">
                                                    <a :href="user.selfiePhotoUrl" target="_blank" class="block">
                                                        <img :src="user.selfiePhotoUrl" alt="Selfie"
                                                            class="rounded max-h-82" />
                                                    </a>
                                                </div>
                                            </template>
                                            <div v-else class="text-slate-400">
                                                <i class="text-3xl fa-regular fa-image"></i>
                                                <p class="mt-1 text-sm">ไม่มีรูป</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- OCR Data -->
                                <div v-if="user.nationalIdOcrData" class="mt-4">
                                    <label class="block mb-1 text-xs font-medium text-slate-500">ข้อมูล OCR บัตรประชาชน</label>
                                    <div class="p-4 border border-blue-100 rounded-lg bg-blue-50">
                                        <pre class="text-xs text-blue-800 whitespace-pre-wrap break-words">{{ JSON.stringify(user.nationalIdOcrData, null, 2) }}</pre>
                                    </div>
                                </div>
                            </section>

                            <!-- ใบขับขี่ -->
                            <section>
                                <div class="flex items-center justify-between mb-3">
                                    <div class="flex items-center gap-2">
                                        <h3 class="text-sm font-semibold text-primary">ยืนยันใบขับขี่</h3>
                                        <span v-if="licenseData"
                                            class="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full"
                                            :class="licenseStatusClass"
                                        >
                                            {{ licenseStatusLabel }}
                                        </span>
                                        <span v-if="licenseData?.verifiedByOcr"
                                            class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-100 text-indigo-700 rounded-full"
                                        >
                                            🤖 OCR
                                        </span>
                                    </div>
                                    <!-- Toggle switch -->
                                    <div class="flex items-center gap-2">
                                        <label class="inline-flex items-center cursor-pointer select-none switch">
                                            <input type="checkbox" class="switch-input"
                                                :checked="licenseData?.status === 'APPROVED'"
                                                :disabled="licenseToggling || licenseLoading"
                                                @change="onToggleLicense($event.target.checked)" />
                                            <span class="switch-slider"></span>
                                        </label>
                                        <span class="text-sm font-medium"
                                            :class="licenseData?.status === 'APPROVED' ? 'text-green-700' : 'text-slate-400'">
                                            {{ licenseData?.status === 'APPROVED' ? 'อนุมัติแล้ว' : 'ยังไม่อนุมัติ' }}
                                        </span>
                                        <span v-if="licenseToggling" class="text-xs text-slate-400">
                                            <i class="fa-solid fa-spinner fa-spin mr-1"></i>กำลังอัปเดต...
                                        </span>
                                    </div>
                                </div>

                                <!-- License details (if exists) -->
                                <template v-if="licenseData">
                                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label class="block mb-1 text-xs font-medium text-slate-500">เลขที่ใบขับขี่</label>
                                            <div class="w-full px-3 py-2.5 border border-slate-200 rounded-md bg-slate-50 text-primary">
                                                {{ licenseData.licenseNumber || '-' }}
                                            </div>
                                        </div>
                                        <div>
                                            <label class="block mb-1 text-xs font-medium text-slate-500">ชื่อ-นามสกุลบนใบขับขี่</label>
                                            <div class="w-full px-3 py-2.5 border border-slate-200 rounded-md bg-slate-50 text-primary">
                                                {{ (licenseData.firstNameOnLicense || '-') + ' ' + (licenseData.lastNameOnLicense || '') }}
                                            </div>
                                        </div>
                                        <div>
                                            <label class="block mb-1 text-xs font-medium text-slate-500">ชนิดใบขับขี่</label>
                                            <div class="w-full px-3 py-2.5 border border-slate-200 rounded-md bg-slate-50 text-primary">
                                                {{ mapLicenseType(licenseData.typeOnLicense) }}
                                            </div>
                                        </div>
                                        <div>
                                            <label class="block mb-1 text-xs font-medium text-slate-500">วันที่ส่งคำขอ</label>
                                            <div class="w-full px-3 py-2.5 border border-slate-200 rounded-md bg-slate-50 text-primary">
                                                {{ formatDate(licenseData.createdAt, true) }}
                                            </div>
                                        </div>
                                    </div>

                                    <!-- รูปใบขับขี่ -->
                                    <div class="grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2">
                                        <div v-if="licenseData.licensePhotoUrl || licenseData.selfiePhotoUrl">
                                            <label class="block mb-1 text-xs font-medium text-slate-500">รูปใบขับขี่ / Selfie</label>
                                            <div class="p-4 text-center border-2 border-slate-200 border-dashed rounded-md bg-slate-50">
                                                <a :href="licenseData.licensePhotoUrl || licenseData.selfiePhotoUrl" target="_blank" class="block">
                                                    <img :src="licenseData.licensePhotoUrl || licenseData.selfiePhotoUrl" alt="License Photo"
                                                        class="rounded max-h-60 mx-auto" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </template>

                                <!-- No license data yet -->
                                <div v-else-if="!licenseLoading" class="px-4 py-4 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                    <i class="fa-solid fa-id-card text-2xl mb-1"></i>
                                    <p class="text-sm">ยังไม่มีข้อมูลใบขับขี่ — เปิดสวิตช์ด้านบนเพื่ออนุมัติโดยตรง</p>
                                </div>
                            </section>

                            <!-- ระบบ -->
                            <section>
                                <h3 class="mb-3 text-sm font-semibold text-primary">ระบบ</h3>
                                <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">

                                    <div>
                                        <label class="block mb-1 text-xs font-medium text-slate-500">สร้างเมื่อ</label>
                                        <div
                                            class="w-full px-3 py-2.5 border border-slate-200 rounded-md bg-slate-50 text-primary">
                                            {{ formatDate(user.createdAt, true) }}
                                        </div>
                                    </div>
                                    <div>
                                        <label
                                            class="block mb-1 text-xs font-medium text-slate-500">ปรับปรุงล่าสุด</label>
                                        <div
                                            class="w-full px-3 py-2.5 border border-slate-200 rounded-md bg-slate-50 text-primary">
                                            {{ formatDate(user.updatedAt, true) }}
                                        </div>
                                    </div>
                                </div>
                            </section>
                            <!-- Admin: ส่งการแจ้งเตือนถึงผู้ใช้ -->
                            <section class="pt-6 mt-4 border-t border-slate-100">
                                <div class="flex items-center justify-between px-4 mb-3 sm:px-0">
                                    <h3 class="text-base font-semibold text-primary">ส่งการแจ้งเตือนถึงผู้ใช้</h3>
                                    <span v-if="sending" class="text-xs text-slate-400">กำลังส่ง...</span>
                                </div>

                                <div class="grid grid-cols-1 gap-4">
                                    <!-- Body Preset (dropdown) -->
                                    <div>
                                        <label
                                            class="block mb-1 text-xs font-medium text-slate-500">เลือกข้อความสำหรับผู้ใช้
                                            (body)</label>
                                        <select v-model="presetKey" @change="applyPreset"
                                            class="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-cta">
                                            <option value="">-- เลือก --</option>
                                            <option value="VERIFY_FAIL_DOC">
                                                ข้อมูลบัตรประชาชน/รูปถ่ายของคุณไม่ผ่านการตรวจสอบ
                                                กรุณาตรวจสอบและส่งใหม่อีกครั้ง
                                            </option>
                                            <option value="VERIFY_FAIL_SELFIE">
                                                รูปถ่ายใบหน้าไม่ชัดเจน กรุณาถ่ายใหม่ให้เห็นใบหน้าชัดเจนและไม่มีแสงสะท้อน
                                            </option>
                                            <option value="VERIFY_APPROVED">
                                                การยืนยันตัวตนเสร็จสมบูรณ์ ขอบคุณที่ให้ความร่วมมือ
                                            </option>
                                            <option value="DOC_EXPIRE_SOON">
                                                บัตรประชาชนของคุณใกล้หมดอายุ กรุณาอัปเดตข้อมูลเพื่อใช้งานได้ต่อเนื่อง
                                            </option>
                                            <!-- <option value="SECURITY_PASSWORD">
                                                ระบบพบความเสี่ยงด้านความปลอดภัย กรุณาเปลี่ยนรหัสผ่านทันที
                                            </option> -->
                                            <option value="CUSTOM">กำหนดข้อความเอง</option>
                                        </select>
                                    </div>

                                    <!-- Body (กำหนดเอง เฉพาะตอนเลือก CUSTOM) -->
                                    <div v-if="presetKey === 'CUSTOM'">
                                        <label class="block mb-1 text-xs font-medium text-slate-500">เนื้อหา
                                            (body)</label>
                                        <textarea v-model.trim="customBody" rows="3"
                                            placeholder="พิมพ์ข้อความถึงผู้ใช้..."
                                            class="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-cta"></textarea>
                                    </div>

                                    <!-- Actions -->
                                    <div class="flex items-center justify-end gap-2">
                                        <button @click="resetNotify" :disabled="sending"
                                            class="px-3 py-2 text-primary border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-60">
                                            ล้างฟอร์ม
                                        </button>
                                        <button @click="sendNotification" :disabled="sending || !user || !currentBody"
                                            class="px-4 py-2 text-white bg-cta rounded-md hover:bg-cta-hover disabled:bg-blue-400">
                                            ส่งการแจ้งเตือน
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Mobile Overlay -->
        <div id="overlay" class="fixed inset-0 z-40 hidden bg-black bg-opacity-50 lg:hidden"
            @click="closeMobileSidebar"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRuntimeConfig, useCookie } from '#app'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import AdminHeader from '~/components/admin/AdminHeader.vue'
import AdminSidebar from '~/components/admin/AdminSidebar.vue'
import { useToast } from '~/composables/useToast'

dayjs.locale('th')
definePageMeta({ middleware: ['admin-auth'], layout: 'admin' })
useHead({
    title: 'ดูรายละเอียดผู้ใช้ • Admin',
    link: [{ rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' }]
})

const route = useRoute()
const { toast } = useToast()

const isLoading = ref(true)
const loadError = ref('')
const toggling = ref(false)
const licenseData = ref(null)
const licenseLoading = ref(false)
const licenseToggling = ref(false)
const user = ref(null)

const FIXED_TYPE = 'VERIFICATION'
const FIXED_TITLE = 'ยืนยันตัวตนไม่สำเร็จ'
const FIXED_LINK = '/profile/verification'
const FIXED_initiatedBy = 'system'

const sending = ref(false)
const presetKey = ref('')
const customBody = ref('')   // ใช้เมื่อเลือก CUSTOM

// Map ของข้อความสำเร็จรูป
const BODY_PRESETS = {
    VERIFY_FAIL_DOC: 'ข้อมูลบัตรประชาชน/รูปถ่ายของคุณไม่ผ่านการตรวจสอบ กรุณาตรวจสอบและส่งใหม่อีกครั้ง',
    VERIFY_FAIL_SELFIE: 'รูปถ่ายใบหน้าไม่ชัดเจน กรุณาถ่ายใหม่ให้เห็นใบหน้าชัดเจนและไม่มีแสงสะท้อน',
    VERIFY_APPROVED: 'การยืนยันตัวตนเสร็จสมบูรณ์ ขอบคุณที่ให้ความร่วมมือ',
    DOC_EXPIRE_SOON: 'บัตรประชาชนของคุณใกล้หมดอายุ กรุณาอัปเดตข้อมูลเพื่อใช้งานได้ต่อเนื่อง',
    // SECURITY_PASSWORD: 'ระบบพบความเสี่ยงด้านความปลอดภัย กรุณาเปลี่ยนรหัสผ่านทันที',
}

// body ปัจจุบันที่พร้อมส่ง (คำนวณจาก preset หรือ custom)
const currentBody = computed(() => {
    if (presetKey.value === 'CUSTOM') return (customBody.value || '').trim()
    return BODY_PRESETS[presetKey.value] || ''
})

function resetNotify() {
    presetKey.value = ''
    customBody.value = ''
}

function applyPreset() {
    // ถ้าเปลี่ยนจาก CUSTOM เป็น preset อื่น ให้ล้าง customBody
    if (presetKey.value !== 'CUSTOM') customBody.value = ''
}

async function sendNotification() {
    if (!user.value) return
    const bodyText = currentBody.value
    if (!bodyText) return

    sending.value = true
    try {
        const apiBase = useRuntimeConfig().public.apiBase
        const token = useCookie('token')?.value || (process.client ? localStorage.getItem('token') : '')

        const payload = {
            userId: user.value.id,
            type: FIXED_TYPE,
            title: FIXED_TITLE,
            body: bodyText,
            link: FIXED_LINK,
            metadata: {
                kind: 'user_verification',
                userId: user.value.id,
                initiatedBy: FIXED_initiatedBy,
            },
        }

        const res = await fetch(`${apiBase}/notifications/admin`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(payload),
            credentials: 'include',
        })

        let resp
        try { resp = await res.json() } catch {
            const txt = await res.text()
            const e = new Error(txt || 'Unexpected response from server'); e.status = res.status; throw e
        }
        if (!res.ok) {
            const e = new Error(resp?.message || `Request failed with status ${res.status}`); e.status = res.status; e.payload = resp; throw e
        }

        toast.success('ส่งการแจ้งเตือนแล้ว', 'ผู้ใช้จะได้รับการแจ้งเตือนในระบบ')
        resetNotify()
    } catch (err) {
        console.error(err)
        toast.error('ส่งการแจ้งเตือนไม่สำเร็จ', err?.message || 'เกิดข้อผิดพลาด')
    } finally {
        sending.value = false
    }
}


function formatDate(iso, withTime = false) {
    if (!iso) return '-'
    return withTime ? dayjs(iso).format('D MMM BBBB HH:mm') : dayjs(iso).format('D MMM BBBB')
}

/* ---------- GET: fetch user ---------- */
async function fetchUser() {
    isLoading.value = true
    loadError.value = ''
    try {
        const id = route.params.id
        const config = useRuntimeConfig()
        const token = useCookie('token')?.value || (process.client ? localStorage.getItem('token') : '')

        const res = await $fetch(`/users/admin/${id}`, {
            baseURL: config.public.apiBase,
            headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        })

        user.value = res?.data || null
    } catch (err) {
        console.error(err)
        loadError.value = err?.data?.message || 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้'
        toast.error('เกิดข้อผิดพลาด', loadError.value)
    } finally {
        isLoading.value = false
    }
}

/* ---------- PATCH: toggle verify ---------- */
async function onToggleVerify(next) {
    if (!user.value) return
    const prev = !!user.value.isVerified
    if (prev === next) return

    // optimistic
    user.value.isVerified = next
    toggling.value = true

    try {
        const id = route.params.id
        const apiBase = useRuntimeConfig().public.apiBase
        let token = useCookie('token')?.value || (process.client ? localStorage.getItem('token') : '')

        const res = await fetch(`${apiBase}/users/admin/${id}/status`, {
            method: 'PATCH',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ isVerified: next }),
            credentials: 'include'
        })

        let body
        try { body = await res.json() } catch {
            const txt = await res.text()
            const e = new Error(txt || 'Unexpected response from server'); e.status = res.status; throw e
        }
        if (!res.ok) {
            const e = new Error(body?.message || `Request failed with status ${res.status}`); e.status = res.status; e.payload = body; throw e
        }

        toast.success('อัปเดตการยืนยันแล้ว', next ? 'ยืนยันผู้ใช้สำเร็จ' : 'ยกเลิกการยืนยันผู้ใช้สำเร็จ')
    } catch (err) {
        console.error(err)
        user.value.isVerified = prev // rollback
        toast.error('ไม่สามารถอัปเดตสถานะยืนยันได้', err?.message || 'เกิดข้อผิดพลาด')
    } finally {
        toggling.value = false
    }
}

/* ---------- License helpers ---------- */
function mapLicenseType(type) {
    const map = {
        PRIVATE_CAR_TEMPORARY: 'รถยนต์ส่วนบุคคลชั่วคราว (2 ปี)',
        PRIVATE_CAR: 'รถยนต์ส่วนบุคคล (5 ปี)',
        PUBLIC_CAR: 'รถยนต์สาธารณะ',
        LIFETIME: 'ตลอดชีพ'
    }
    return map[type] || type || '-'
}

const licenseStatusClass = computed(() => {
    if (!licenseData.value) return ''
    switch (licenseData.value.status) {
        case 'APPROVED': return 'bg-green-100 text-green-700 ring-1 ring-inset ring-green-200'
        case 'REJECTED': return 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-200'
        default: return 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200'
    }
})

const licenseStatusLabel = computed(() => {
    if (!licenseData.value) return ''
    switch (licenseData.value.status) {
        case 'APPROVED': return '✅ อนุมัติแล้ว'
        case 'REJECTED': return '❌ ปฏิเสธ'
        default: return '⏳ รอดำเนินการ'
    }
})

async function fetchLicenseData() {
    licenseLoading.value = true
    try {
        const config = useRuntimeConfig()
        const token = useCookie('token')?.value || (process.client ? localStorage.getItem('token') : '')
        const res = await $fetch('/driver-verifications/admin', {
            baseURL: config.public.apiBase,
            headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            query: { q: user.value?.username || user.value?.email || '', limit: 10 }
        })
        const rows = res?.data || []
        // Find the one belonging to this user
        const userId = route.params.id
        licenseData.value = rows.find(r => r.userId === userId || r.user?.id === userId) || null
    } catch (err) {
        console.error('Fetch license data error:', err)
        licenseData.value = null
    } finally {
        licenseLoading.value = false
    }
}

async function onToggleLicense(checked) {
    if (!user.value) return
    licenseToggling.value = true
    try {
        const config = useRuntimeConfig()
        const token = useCookie('token')?.value || (process.client ? localStorage.getItem('token') : '')
        const res = await $fetch('/driver-verifications/admin/quick-approve', {
            baseURL: config.public.apiBase,
            method: 'POST',
            headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: { userId: user.value.id, approve: checked }
        })
        licenseData.value = res?.data || licenseData.value
        if (licenseData.value) licenseData.value.status = checked ? 'APPROVED' : 'REJECTED'
        toast.success(checked ? '✅ อนุมัติใบขับขี่แล้ว' : '❌ ยกเลิกการอนุมัติใบขับขี่')
    } catch (err) {
        console.error('Toggle license error:', err)
        toast.error('เกิดข้อผิดพลาด', err?.data?.message || err?.message || '')
        await fetchLicenseData()
    } finally {
        licenseToggling.value = false
    }
}

/* ---------- layout helpers ---------- */
function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar')
    const overlay = document.getElementById('overlay')
    if (!sidebar || !overlay) return
    sidebar.classList.remove('mobile-open')
    overlay.classList.add('hidden')
}
function defineGlobalScripts() {
    window.__adminResizeHandler__ = function () {
        const sidebar = document.getElementById('sidebar')
        const mainContent = document.getElementById('main-content')
        const overlay = document.getElementById('overlay')
        if (!sidebar || !mainContent || !overlay) return
        if (window.innerWidth >= 1024) {
            sidebar.classList.remove('mobile-open'); overlay.classList.add('hidden')
            mainContent.style.marginLeft = sidebar.classList.contains('collapsed') ? '80px' : '280px'
        } else {
            mainContent.style.marginLeft = '0'
        }
    }
    window.addEventListener('resize', window.__adminResizeHandler__)
}
function cleanupGlobalScripts() {
    window.removeEventListener('resize', window.__adminResizeHandler__ || (() => { }))
    delete window.__adminResizeHandler__
}

onMounted(async () => {
    defineGlobalScripts()
    if (typeof window.__adminResizeHandler__ === 'function') window.__adminResizeHandler__()
    await fetchUser()
    await fetchLicenseData()
})
onUnmounted(() => cleanupGlobalScripts())
</script>

<style>
.main-content {
    transition: margin-left 0.3s ease;
}

/* สวิตช์ (แบบเดียวกับหน้า list) */
.switch {
    position: relative;
    width: 42px;
    height: 24px;
}

.switch-input {
    appearance: none;
    -webkit-appearance: none;
    width: 42px;
    height: 24px;
    margin: 0;
    outline: none;
    position: relative;
    cursor: pointer;
}

.switch-slider {
    pointer-events: none;
    position: absolute;
    inset: 0;
    background: #e5e7eb;
    border-radius: 9999px;
    transition: background .2s ease;
}

.switch-input:checked+.switch-slider {
    background: #22c55e;
}

.switch-slider::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    background: #fff;
    border-radius: 9999px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, .2);
    transition: transform .2s ease;
}

.switch-input:checked+.switch-slider::after {
    transform: translateX(18px);
}

.switch-input:disabled+.switch-slider {
    filter: grayscale(.4);
    opacity: .6;
}
</style>
