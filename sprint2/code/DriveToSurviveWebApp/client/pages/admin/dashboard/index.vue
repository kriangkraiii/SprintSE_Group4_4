<template>
  <div>
    <AdminHeader />
    <AdminSidebar />

    <main id="main-content" class="main-content mt-24 ml-0 lg:ml-[280px] p-6">
      <div class="mx-auto max-w-7xl">
        <!-- Page Title -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-semibold text-primary">📊 Dashboard</h1>
            <p class="text-sm text-slate-400 mt-1">ภาพรวมระบบ Drive To Survive</p>
          </div>
          <button @click="fetchStats" :disabled="isLoading"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-cta rounded-lg hover:bg-cta-hover disabled:opacity-50 transition-colors cursor-pointer">
            <i class="fas fa-sync-alt" :class="{ 'animate-spin': isLoading }"></i>
            รีเฟรช
          </button>
        </div>

        <!-- Loading Skeleton -->
        <div v-if="isLoading && !stats" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div v-for="i in 8" :key="i" class="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-5 animate-pulse">
            <div class="h-3 bg-slate-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
            <div class="h-8 bg-slate-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
            <div class="h-2 bg-slate-100 dark:bg-gray-600 rounded w-1/3"></div>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6 text-center">
          <p class="text-red-600 dark:text-red-400">{{ error }}</p>
          <button @click="fetchStats" class="mt-3 text-sm text-cta hover:underline cursor-pointer">ลองใหม่</button>
        </div>

        <template v-if="stats">
          <!-- Stat Cards Row 1: Main Metrics -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-slate-400 uppercase tracking-wider">ผู้ใช้ทั้งหมด</p>
                  <p class="text-3xl font-bold text-primary mt-1">{{ stats.overview.totalUsers }}</p>
                  <p class="text-xs text-emerald-600 mt-1">
                    <i class="fas fa-arrow-up mr-1"></i>+{{ stats.overview.newUsersToday }} วันนี้
                  </p>
                </div>
                <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <i class="fas fa-users text-xl text-blue-500"></i>
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-slate-400 uppercase tracking-wider">เส้นทางทั้งหมด</p>
                  <p class="text-3xl font-bold text-primary mt-1">{{ stats.overview.totalRoutes }}</p>
                  <p class="text-xs text-emerald-600 mt-1">
                    <i class="fas fa-circle text-[8px] mr-1"></i>{{ stats.overview.activeRoutes }} กำลังดำเนินการ
                  </p>
                </div>
                <div class="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <i class="fas fa-route text-xl text-emerald-500"></i>
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-slate-400 uppercase tracking-wider">การจองทั้งหมด</p>
                  <p class="text-3xl font-bold text-primary mt-1">{{ stats.overview.totalBookings }}</p>
                  <p class="text-xs text-emerald-600 mt-1">
                    <i class="fas fa-arrow-up mr-1"></i>+{{ stats.overview.bookingsToday }} วันนี้
                  </p>
                </div>
                <div class="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                  <i class="fas fa-calendar-check text-xl text-amber-500"></i>
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-slate-400 uppercase tracking-wider">รายได้รวม</p>
                  <p class="text-3xl font-bold text-primary mt-1">฿{{ formatNumber(stats.revenue.total) }}</p>
                  <p class="text-xs text-slate-400 mt-1">
                    <i class="fas fa-star text-amber-400 mr-1"></i>{{ stats.ratings.average }}/5 ({{ stats.ratings.totalReviews }} รีวิว)
                  </p>
                </div>
                <div class="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <i class="fas fa-baht-sign text-xl text-green-500"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Row 2: Booking Breakdown + Driver Stats + Quick Stats -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <!-- Booking Status Breakdown -->
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-5">
              <h3 class="text-sm font-semibold text-primary mb-4">📋 สถานะการจอง</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full bg-amber-400"></span>
                    <span class="text-sm text-slate-600">รอดำเนินการ</span>
                  </div>
                  <span class="text-sm font-semibold text-primary">{{ stats.bookings.pending }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span class="text-sm text-slate-600">ยืนยันแล้ว</span>
                  </div>
                  <span class="text-sm font-semibold text-primary">{{ stats.bookings.confirmed }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full bg-green-500"></span>
                    <span class="text-sm text-slate-600">เสร็จสิ้น</span>
                  </div>
                  <span class="text-sm font-semibold text-primary">{{ stats.bookings.completed }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full bg-red-400"></span>
                    <span class="text-sm text-slate-600">ยกเลิก</span>
                  </div>
                  <span class="text-sm font-semibold text-primary">{{ stats.bookings.cancelled }}</span>
                </div>
              </div>
              <!-- Simple bar chart -->
              <div class="flex items-end gap-1 mt-4 h-8" v-if="bookingTotal > 0">
                <div class="bg-amber-400 rounded-t" :style="{ width: '25%', height: barH(stats.bookings.pending) }" :title="`รอ: ${stats.bookings.pending}`"></div>
                <div class="bg-blue-500 rounded-t" :style="{ width: '25%', height: barH(stats.bookings.confirmed) }" :title="`ยืนยัน: ${stats.bookings.confirmed}`"></div>
                <div class="bg-green-500 rounded-t" :style="{ width: '25%', height: barH(stats.bookings.completed) }" :title="`เสร็จ: ${stats.bookings.completed}`"></div>
                <div class="bg-red-400 rounded-t" :style="{ width: '25%', height: barH(stats.bookings.cancelled) }" :title="`ยกเลิก: ${stats.bookings.cancelled}`"></div>
              </div>
            </div>

            <!-- Driver Verification -->
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-5">
              <h3 class="text-sm font-semibold text-primary mb-4">🪪 คนขับ</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full bg-green-500"></span>
                    <span class="text-sm text-slate-600">อนุมัติแล้ว</span>
                  </div>
                  <span class="text-sm font-semibold text-primary">{{ stats.drivers.approved }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full bg-amber-400"></span>
                    <span class="text-sm text-slate-600">รอตรวจสอบ</span>
                  </div>
                  <span class="text-sm font-semibold text-amber-600 font-bold">{{ stats.drivers.pendingVerifications }}</span>
                </div>
              </div>

              <h3 class="text-sm font-semibold text-primary mb-3 mt-6">💬 แชท</h3>
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-slate-600">ห้องแชททั้งหมด</span>
                  <span class="text-sm font-semibold text-primary">{{ stats.overview.totalChatSessions }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-slate-600">กำลังใช้งาน</span>
                  <span class="text-sm font-semibold text-emerald-600">{{ stats.overview.activeChatSessions }}</span>
                </div>
              </div>
            </div>

            <!-- Quick Stats -->
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-5">
              <h3 class="text-sm font-semibold text-primary mb-4">📈 สรุปข้อมูล</h3>
              <div class="grid grid-cols-2 gap-3">
                <div class="bg-slate-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                  <p class="text-2xl font-bold text-primary">{{ stats.overview.totalVehicles }}</p>
                  <p class="text-xs text-slate-400 mt-1">🚗 รถยนต์</p>
                </div>
                <div class="bg-slate-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                  <p class="text-2xl font-bold text-primary">{{ stats.overview.totalReviews }}</p>
                  <p class="text-xs text-slate-400 mt-1">⭐ รีวิว</p>
                </div>
                <div class="bg-slate-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                  <p class="text-2xl font-bold text-primary">{{ stats.overview.newUsersWeek }}</p>
                  <p class="text-xs text-slate-400 mt-1">👤 ผู้ใช้ใหม่ (7 วัน)</p>
                </div>
                <div class="bg-slate-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                  <p class="text-2xl font-bold text-primary">{{ stats.overview.totalNotifications }}</p>
                  <p class="text-xs text-slate-400 mt-1">🔔 แจ้งเตือน</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Row 3: Trend Charts (7-day) -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <!-- Booking Trend -->
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-5">
              <h3 class="text-sm font-semibold text-primary mb-4">📅 การจอง 7 วันล่าสุด</h3>
              <div v-if="stats.charts.recentBookings.length" class="flex items-end gap-1 h-32">
                <div v-for="(d, i) in stats.charts.recentBookings" :key="i"
                  class="flex-1 flex flex-col items-center gap-1">
                  <span class="text-xs font-semibold text-primary">{{ d.count }}</span>
                  <div class="w-full bg-blue-400 rounded-t transition-all"
                    :style="{ height: chartBarH(d.count, maxBooking) }"></div>
                  <span class="text-[10px] text-slate-400">{{ formatDay(d.date) }}</span>
                </div>
              </div>
              <p v-else class="text-sm text-slate-400 text-center py-8">ไม่มีข้อมูล</p>
            </div>

            <!-- User Trend -->
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-5">
              <h3 class="text-sm font-semibold text-primary mb-4">👤 ผู้ใช้ใหม่ 7 วันล่าสุด</h3>
              <div v-if="stats.charts.recentUsers.length" class="flex items-end gap-1 h-32">
                <div v-for="(d, i) in stats.charts.recentUsers" :key="i"
                  class="flex-1 flex flex-col items-center gap-1">
                  <span class="text-xs font-semibold text-primary">{{ d.count }}</span>
                  <div class="w-full bg-emerald-400 rounded-t transition-all"
                    :style="{ height: chartBarH(d.count, maxUser) }"></div>
                  <span class="text-[10px] text-slate-400">{{ formatDay(d.date) }}</span>
                </div>
              </div>
              <p v-else class="text-sm text-slate-400 text-center py-8">ไม่มีข้อมูล</p>
            </div>
          </div>

          <!-- Row 4: Quick Actions -->
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-5">
            <h3 class="text-sm font-semibold text-primary mb-4">⚡ การดำเนินการด่วน</h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <NuxtLink to="/admin/users"
                class="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer">
                <i class="fas fa-users text-xl text-blue-500"></i>
                <span class="text-xs font-medium text-slate-600">จัดการผู้ใช้</span>
              </NuxtLink>
              <NuxtLink to="/admin/bookings"
                class="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 hover:bg-amber-50 hover:border-amber-200 transition-all cursor-pointer">
                <i class="fas fa-calendar-check text-xl text-amber-500"></i>
                <span class="text-xs font-medium text-slate-600">จัดการการจอง</span>
              </NuxtLink>
              <NuxtLink to="/admin/driver-verifications"
                class="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all cursor-pointer"
                :class="stats.drivers.pendingVerifications > 0 ? 'ring-2 ring-amber-300' : ''">
                <i class="fas fa-id-card text-xl text-emerald-500"></i>
                <span class="text-xs font-medium text-slate-600">ตรวจสอบคนขับ</span>
                <span v-if="stats.drivers.pendingVerifications > 0"
                  class="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">{{ stats.drivers.pendingVerifications }} รอตรวจ</span>
              </NuxtLink>
              <NuxtLink to="/admin/system-logs"
                class="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer">
                <i class="fas fa-file-lines text-xl text-slate-500"></i>
                <span class="text-xs font-medium text-slate-600">System Logs</span>
              </NuxtLink>
            </div>
          </div>
        </template>
      </div>
    </main>

    <!-- Mobile Overlay -->
    <div id="overlay" class="fixed inset-0 z-40 hidden bg-black bg-opacity-50 lg:hidden"
      @click="closeMobileSidebar"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRuntimeConfig, useCookie } from '#app'
import AdminHeader from '~/components/admin/AdminHeader.vue'
import AdminSidebar from '~/components/admin/AdminSidebar.vue'
import dayjs from 'dayjs'

definePageMeta({ middleware: ['admin-auth'], layout: 'admin' })
useHead({
  title: 'Dashboard — Admin',
  link: [{ rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' }]
})

const isLoading = ref(false)
const error = ref('')
const stats = ref(null)

const bookingTotal = computed(() => {
  if (!stats.value) return 0
  const b = stats.value.bookings
  return b.pending + b.confirmed + b.completed + b.cancelled
})

const maxBooking = computed(() => {
  if (!stats.value?.charts?.recentBookings?.length) return 1
  return Math.max(...stats.value.charts.recentBookings.map(d => d.count), 1)
})

const maxUser = computed(() => {
  if (!stats.value?.charts?.recentUsers?.length) return 1
  return Math.max(...stats.value.charts.recentUsers.map(d => d.count), 1)
})

function barH(count) {
  if (!bookingTotal.value) return '4px'
  return Math.max(4, (count / bookingTotal.value) * 100) + '%'
}

function chartBarH(count, max) {
  if (!max) return '4px'
  return Math.max(4, (count / max) * 100) + '%'
}

function formatNumber(n) {
  return Number(n || 0).toLocaleString('th-TH')
}

function formatDay(dateStr) {
  return dayjs(dateStr).format('D/M')
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar')
  const overlay = document.getElementById('overlay')
  if (sidebar) sidebar.classList.remove('mobile-open')
  if (overlay) overlay.classList.add('hidden')
}

async function fetchStats() {
  isLoading.value = true
  error.value = ''
  try {
    const config = useRuntimeConfig()
    const token = useCookie('token').value || (process.client ? localStorage.getItem('token') : '')

    const res = await $fetch('/dashboard/stats', {
      baseURL: config.public.apiBase,
      headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })

    stats.value = res?.data || res
  } catch (err) {
    console.error('Dashboard fetch error:', err)
    const status = err?.response?.status || err?.status || err?.statusCode
    if (status === 401 || status === 403) {
      error.value = 'ไม่มีสิทธิ์เข้าถึง — กรุณาเข้าสู่ระบบใหม่'
    } else if (status >= 500) {
      error.value = `เซิร์ฟเวอร์ผิดพลาด (${status}) — ${err?.data?.message || 'ลองรีเฟรชอีกครั้ง'}`
    } else if (err?.message?.includes('fetch') || err?.message?.includes('ECONNREFUSED')) {
      error.value = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ — ตรวจสอบว่า Backend กำลังทำงานอยู่'
    } else {
      error.value = err?.data?.message || err?.statusMessage || 'ไม่สามารถโหลดข้อมูลได้'
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchStats()
})
</script>
