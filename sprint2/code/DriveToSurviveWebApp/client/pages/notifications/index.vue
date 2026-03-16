<template>
    <div class="min-h-screen bg-gray-50 py-8">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-2xl font-bold text-gray-800">การแจ้งเตือน</h1>
                    <p class="text-sm text-gray-500 mt-1">
                        {{ unreadCount > 0 ? `${unreadCount} รายการยังไม่อ่าน` : 'ไม่มีการแจ้งเตือนใหม่' }}
                    </p>
                </div>
                <button v-if="notifications.length > 0" @click="markAllRead"
                    class="px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition cursor-pointer">
                    อ่านทั้งหมด
                </button>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="flex items-center justify-center py-20">
                <svg class="animate-spin w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>

            <!-- Empty state -->
            <div v-else-if="notifications.length === 0"
                class="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </div>
                <p class="text-gray-500">ยังไม่มีการแจ้งเตือน</p>
            </div>

            <!-- Notification list -->
            <div v-else class="space-y-3">
                <div v-for="n in notifications" :key="n.id"
                    class="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                    :class="{ 'border-l-4 border-l-emerald-500 bg-emerald-50/30': !n.isRead }"
                    @click="markRead(n)">
                    <div class="flex items-start gap-3">
                        <!-- Icon -->
                        <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                            :class="iconBg(n.type)">
                            <span class="text-lg">{{ iconEmoji(n.type) }}</span>
                        </div>
                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <h3 class="text-sm font-semibold text-gray-800 truncate">{{ n.title }}</h3>
                                <span v-if="!n.isRead"
                                    class="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500"></span>
                            </div>
                            <p class="text-sm text-gray-600 mt-0.5 line-clamp-2">{{ n.body }}</p>
                            <span class="text-xs text-gray-400 mt-1 block">{{ formatTime(n.createdAt) }}</span>
                        </div>
                        <!-- Delete -->
                        <button @click.stop="deleteNotif(n.id)"
                            class="flex-shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/th'
import { useToast } from '~/composables/useToast'
import { useAuth } from '~/composables/useAuth'
import { useChat } from '~/composables/useChat'

dayjs.extend(relativeTime)
dayjs.locale('th')

useHead({ title: 'การแจ้งเตือน - Drive To Survive' })

const { $api } = useNuxtApp()
const { toast } = useToast()
const { token } = useAuth()
const config = useRuntimeConfig()
const { connectChatSocket, onNewNotification, offNewNotification } = useChat()

const notifications = ref([])
const loading = ref(true)

const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length)

const apiBase = computed(() => {
    if (process.server) return ''
    return config.public.apiBase || ''
})

function iconEmoji(type) {
    const map = { BOOKING: '🎫', SYSTEM: '⚙️', ARRIVAL: '🚗', CHAT: '💬', REVIEW: '⭐' }
    return map[type] || '🔔'
}
function iconBg(type) {
    const map = {
        BOOKING: 'bg-blue-50',
        SYSTEM: 'bg-gray-100',
        ARRIVAL: 'bg-emerald-50',
        CHAT: 'bg-purple-50',
        REVIEW: 'bg-yellow-50',
    }
    return map[type] || 'bg-gray-100'
}
function formatTime(dt) {
    return dayjs(dt).fromNow()
}

async function fetchNotifications() {
    loading.value = true
    try {
        const res = await $api('/notifications', {
            headers: { Authorization: `Bearer ${token.value}` }
        })
        notifications.value = res.data || res || []
    } catch (e) {
        console.error('Failed to fetch notifications:', e)
        notifications.value = []
    } finally {
        loading.value = false
    }
}

async function markRead(n) {
    if (n.isRead) return
    try {
        await fetch(`${apiBase.value}/notifications/${n.id}/read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token.value}` }
        })
        n.isRead = true
    } catch (e) {
        console.error(e)
    }
}

async function markAllRead() {
    try {
        await fetch(`${apiBase.value}/notifications/read-all`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token.value}` }
        })
        notifications.value.forEach(n => n.isRead = true)
        toast('อ่านทั้งหมดแล้ว', 'success')
    } catch (e) {
        console.error(e)
    }
}

async function deleteNotif(id) {
    try {
        await fetch(`${apiBase.value}/notifications/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token.value}` }
        })
        notifications.value = notifications.value.filter(n => n.id !== id)
        toast('ลบการแจ้งเตือนแล้ว', 'success')
    } catch (e) {
        toast('เกิดข้อผิดพลาด', 'error')
    }
}

// Real-time notification handler
function handleNewNotification(notif) {
    // Avoid duplicates
    if (notifications.value.some(n => n.id === notif.id)) return
    notifications.value.unshift(notif)
}

onMounted(() => {
    fetchNotifications()
    // Connect Socket.IO for real-time push notifications
    if (token.value) {
        connectChatSocket(token.value)
        onNewNotification(handleNewNotification)
    }
})

onUnmounted(() => {
    offNewNotification(handleNewNotification)
})
</script>
