<template>
    <div>
        <AdminSidebar />
        <div id="main-content" class="min-h-screen p-6 bg-slate-50 lg:ml-[280px] mt-16">
            <div class="max-w-4xl mx-auto">
                <!-- Header -->
                <div class="flex items-center gap-4 mb-8">
                    <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-cta-light">
                        <i class="text-xl fas fa-shield-halved text-cta"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-primary">ตั้งค่าความปลอดภัย</h1>
                        <p class="text-sm text-slate-500">เปิด/ปิดฟีเจอร์ความปลอดภัยสำหรับการทดสอบหรือพัฒนา</p>
                    </div>
                </div>

                <!-- Warning Banner -->
                <div class="flex items-start gap-3 p-4 mb-6 border rounded-xl bg-amber-50 border-amber-200">
                    <i class="mt-0.5 fas fa-triangle-exclamation text-amber-500"></i>
                    <div>
                        <p class="font-semibold text-amber-800">สำหรับ Development/Testing เท่านั้น</p>
                        <p class="text-sm text-amber-700">การปิดฟีเจอร์เหล่านี้จะมีผลทันทีทั้งระบบ และจะรีเซ็ตเป็นเปิดทั้งหมดเมื่อ Restart Server</p>
                    </div>
                </div>

                <!-- Loading -->
                <div v-if="loading" class="p-12 text-center bg-white border rounded-xl border-slate-200">
                    <i class="text-3xl fas fa-spinner fa-spin text-cta"></i>
                    <p class="mt-3 text-slate-500">กำลังโหลดการตั้งค่า...</p>
                </div>

                <!-- Settings Cards -->
                <div v-else class="space-y-4">
                    <div v-for="item in settingsItems" :key="item.key"
                        class="flex items-center justify-between p-5 transition-all bg-white border rounded-xl border-slate-200 hover:shadow-sm">
                        <div class="flex items-center gap-4">
                            <div class="flex items-center justify-center w-10 h-10 rounded-lg" :class="item.bgClass">
                                <i :class="item.icon" class="text-lg" :style="{ color: item.iconColor }"></i>
                            </div>
                            <div>
                                <h3 class="font-semibold text-primary">{{ item.label }}</h3>
                                <p class="text-sm text-slate-500">{{ item.desc }}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="text-xs font-medium" :class="config[item.key] ? 'text-green-600' : 'text-red-500'">
                                {{ config[item.key] ? 'เปิด' : 'ปิด' }}
                            </span>
                            <button @click="toggleFeature(item.key)"
                                class="relative w-12 h-6 transition-colors rounded-full cursor-pointer"
                                :class="config[item.key] ? 'bg-green-500' : 'bg-slate-300'">
                                <span class="absolute w-5 h-5 transition-transform bg-white rounded-full shadow-sm top-0.5"
                                    :class="config[item.key] ? 'left-[26px]' : 'left-0.5'"></span>
                            </button>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="flex gap-3 pt-4">
                        <button @click="enableAll"
                            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 transition-colors bg-green-100 rounded-lg hover:bg-green-200">
                            <i class="fas fa-toggle-on"></i> เปิดทั้งหมด
                        </button>
                        <button @click="disableAll"
                            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 transition-colors bg-red-100 rounded-lg hover:bg-red-200">
                            <i class="fas fa-toggle-off"></i> ปิดทั้งหมด
                        </button>
                    </div>
                </div>

                <!-- Status Info -->
                <div class="p-4 mt-6 border rounded-xl bg-slate-50 border-slate-200">
                    <h4 class="mb-2 text-sm font-semibold text-slate-600">ข้อมูลสถานะ</h4>
                    <div class="grid grid-cols-2 gap-2 text-xs text-slate-500">
                        <div>💡 รีเซ็ตอัตโนมัติเมื่อ Restart Server</div>
                        <div>🔒 Admin เท่านั้นที่เปลี่ยนได้</div>
                        <div>⚡ มีผลทันทีไม่ต้อง Restart</div>
                        <div>📡 เก็บใน Memory (ไม่เข้า DB)</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

definePageMeta({ middleware: 'admin-auth', layout: 'admin' })
useHead({
    title: 'ตั้งค่าความปลอดภัย — Admin',
    link: [{ rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' }],
})

const { $api } = useNuxtApp()

const config = ref({
    rateLimitEnabled: true,
    profanityFilterEnabled: true,
    contentFilterEnabled: true,
    blacklistCheckEnabled: true,
})

const loading = ref(true)

const settingsItems = [
    {
        key: 'rateLimitEnabled',
        label: 'Rate Limiting',
        desc: 'จำกัดจำนวนคำขอต่อ IP ต่อ 15 นาที (ป้องกัน DDoS / Brute Force)',
        icon: 'fas fa-gauge-high',
        bgClass: 'bg-blue-100',
        iconColor: '#2563eb',
    },
    {
        key: 'contentFilterEnabled',
        label: 'Content Filter (แชท)',
        desc: 'กรองเบอร์โทร, URL, LINE ID และคำหยาบในข้อความแชท',
        icon: 'fas fa-filter',
        bgClass: 'bg-amber-100',
        iconColor: '#d97706',
    },
    {
        key: 'profanityFilterEnabled',
        label: 'Profanity Filter (รีวิว)',
        desc: 'บล็อกคำหยาบคายในรีวิวและ Feedback (ภาษาไทย + อังกฤษ)',
        icon: 'fas fa-comment-slash',
        bgClass: 'bg-red-100',
        iconColor: '#dc2626',
    },
    {
        key: 'blacklistCheckEnabled',
        label: 'Blacklist Check',
        desc: 'ตรวจสอบบัญชีดำเมื่อลงทะเบียน / ยืนยันตัวตน',
        icon: 'fas fa-ban',
        bgClass: 'bg-slate-200',
        iconColor: '#475569',
    },
]

async function fetchConfig() {
    loading.value = true
    try {
        const res = await $api('/security-config')
        config.value = res
    } catch (e) {
        console.error('Failed to fetch security config:', e)
    } finally {
        loading.value = false
    }
}

async function toggleFeature(key) {
    config.value[key] = !config.value[key]
    try {
        await $api('/security-config', {
            method: 'PATCH',
            body: { [key]: config.value[key] },
        })
    } catch (e) {
        config.value[key] = !config.value[key]
        console.error('Failed to update:', e)
    }
}

async function enableAll() {
    const body = {}
    for (const item of settingsItems) body[item.key] = true
    config.value = { ...config.value, ...body }
    try {
        await $api('/security-config', { method: 'PATCH', body })
    } catch (e) {
        fetchConfig()
    }
}

async function disableAll() {
    const body = {}
    for (const item of settingsItems) body[item.key] = false
    config.value = { ...config.value, ...body }
    try {
        await $api('/security-config', { method: 'PATCH', body })
    } catch (e) {
        fetchConfig()
    }
}

onMounted(fetchConfig)
</script>
