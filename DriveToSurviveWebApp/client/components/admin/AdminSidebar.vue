<template>
    <aside id="sidebar" class="fixed bottom-0 left-3 bg-white shadow-sm sidebar top-32 h-fit rounded-md ">
        <div class="py-4">
            <!-- Toggle Button -->
            <button @click="toggleSidebar"
                class="absolute items-center justify-center hidden w-6 h-6 transition-colors bg-white border rounded-full shadow-sm lg:flex -right-3 top-6 border-slate-200 text-slate-500 hover:bg-cta hover:text-white hover:border-cta">
                <i class="text-xs fas fa-chevron-left" id="toggle-icon"></i>
            </button>

            <div class="px-2 pb-3 mb-3 border-b border-slate-100">
                <p class="text-xs font-semibold tracking-wider uppercase sidebar-text text-slate-400">Admin Panel</p>
                <p class="mt-1 text-sm sidebar-text text-slate-600">จัดการระบบหลักของแพลตฟอร์ม</p>
            </div>

            <nav class="space-y-1">
                <!-- Dashboard -->
                <NuxtLink v-for="item in mainMenus" :key="item.to" :to="item.to"
                    class="sidebar-item group flex items-center gap-3 rounded-lg px-3 py-2.5 text-primary hover:bg-cta-light"
                    active-class="font-semibold text-cta bg-cta-light">
                    <i :class="item.icon" class="w-5 text-center text-slate-400 group-[.router-link-active]:text-cta"></i>
                    <span class="sidebar-text">{{ item.label }}</span>
                </NuxtLink>

                <!-- จัดการข้อมูล -->
                <div class="pt-3 mt-3 border-t border-slate-200">
                    <p class="px-3 mb-2 text-xs font-semibold tracking-wider uppercase sidebar-text text-slate-400">
                        จัดการข้อมูล
                    </p>
                    <NuxtLink v-for="item in dataMenus" :key="item.to" :to="item.to"
                        class="sidebar-item group flex items-center gap-3 rounded-lg px-3 py-2.5 text-primary hover:bg-cta-light"
                        active-class="font-semibold text-cta bg-cta-light">
                        <i :class="item.icon" class="w-5 text-center text-slate-400 group-[.router-link-active]:text-cta"></i>
                        <span class="sidebar-text">{{ item.label }}</span>
                    </NuxtLink>
                </div>

                <!-- การเดินทาง -->
                <div class="pt-3 mt-3 border-t border-slate-200">
                    <p class="px-3 mb-2 text-xs font-semibold tracking-wider uppercase sidebar-text text-slate-400">
                        การเดินทาง
                    </p>
                    <NuxtLink v-for="item in tripMenus" :key="item.to" :to="item.to"
                        class="sidebar-item group flex items-center gap-3 rounded-lg px-3 py-2.5 text-primary hover:bg-cta-light"
                        active-class="font-semibold text-cta bg-cta-light">
                        <i :class="item.icon" class="w-5 text-center text-slate-400 group-[.router-link-active]:text-cta"></i>
                        <span class="sidebar-text">{{ item.label }}</span>
                    </NuxtLink>
                </div>

                <!-- ระบบ -->
                <div class="pt-3 mt-3 border-t border-slate-200">
                    <p class="px-3 mb-2 text-xs font-semibold tracking-wider uppercase sidebar-text text-slate-400">
                        ระบบ
                    </p>
                    <NuxtLink v-for="item in systemMenus" :key="item.to" :to="item.to"
                        class="sidebar-item group flex items-center gap-3 rounded-lg px-3 py-2.5 text-primary hover:bg-cta-light"
                        active-class="font-semibold text-cta bg-cta-light">
                        <i :class="item.icon" class="w-5 text-center text-slate-400 group-[.router-link-active]:text-cta"></i>
                        <span class="sidebar-text">{{ item.label }}</span>
                    </NuxtLink>
                </div>

                <!-- Logout -->
                <div class="pt-3 mt-3 border-t border-slate-200">
                    <button @click="logout"
                        class="sidebar-item w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
                        <i class="w-5 text-center fas fa-right-from-bracket"></i>
                        <span class="sidebar-text">ออกจากระบบ</span>
                    </button>
                </div>
            </nav>
        </div>
    </aside>
</template>

<script setup>
import { useAuth } from '~/composables/useAuth'

const { logout } = useAuth()

const mainMenus = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: 'fas fa-chart-line' },
]

const dataMenus = [
    { to: '/admin/users', label: 'ผู้ใช้งาน', icon: 'fas fa-users' },
    { to: '/admin/driver-verifications', label: 'ยืนยันตัวตนคนขับ', icon: 'fas fa-id-card' },
    { to: '/admin/vehicles', label: 'ยานพาหนะ', icon: 'fas fa-car-side' },
]

const tripMenus = [
    { to: '/admin/routes', label: 'เส้นทาง', icon: 'fas fa-route' },
    { to: '/admin/bookings', label: 'การจอง', icon: 'fas fa-calendar-check' },
    { to: '/admin/sprint2', label: 'แชท & รีวิว', icon: 'fas fa-comments' },
]

const systemMenus = [
    { to: '/admin/system-logs', label: 'System Logs', icon: 'fas fa-file-lines' },
    { to: '/admin/cron', label: 'CRON Jobs', icon: 'fas fa-clock' },
    { to: '/admin/blacklist', label: 'Blacklist', icon: 'fas fa-ban' },
]

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar')
    const mainContent = document.getElementById('main-content')
    const toggleIcon = document.getElementById('toggle-icon')
    if (!sidebar || !mainContent) return

    sidebar.classList.toggle('collapsed')
    if (sidebar.classList.contains('collapsed')) {
        mainContent.style.marginLeft = '80px'
        if (toggleIcon) toggleIcon.classList.replace('fa-chevron-left', 'fa-chevron-right')
    } else {
        mainContent.style.marginLeft = '280px'
        if (toggleIcon) toggleIcon.classList.replace('fa-chevron-right', 'fa-chevron-left')
    }
}

function toggleSubmenu(menuId) {
    const menu = document.getElementById(menuId)
    const icon = document.getElementById(menuId + '-icon')
    if (!menu || !icon) return
    menu.classList.toggle('hidden')
    icon.classList.toggle('fa-chevron-down')
    icon.classList.toggle('fa-chevron-up')
}
</script>

<style scoped>
#sidebar.collapsed {
    width: 80px;
}

#sidebar.collapsed .sidebar-text {
    display: none;
}

#sidebar.collapsed .sidebar-item {
    justify-content: center;
}

@media (max-width: 1023px) {
    #sidebar {
        transform: translateX(-100%);
    }

    #sidebar.mobile-open {
        transform: translateX(0);
    }
}
</style>
