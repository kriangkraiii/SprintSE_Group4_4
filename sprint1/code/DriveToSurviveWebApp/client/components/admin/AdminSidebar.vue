<template>
    <aside id="sidebar"
        class="sidebar fixed left-0 top-16 bottom-0 z-40 w-[280px] border-r border-slate-200 bg-white transition-all duration-300">
        <div class="h-full px-3 py-4 overflow-y-auto">
            <button @click="toggleSidebar"
                class="absolute items-center justify-center hidden w-6 h-6 transition-colors bg-white border rounded-full shadow-sm lg:flex -right-3 top-6 border-slate-200 text-slate-500 hover:bg-cta hover:text-white hover:border-cta">
                <i class="text-xs fas fa-chevron-left" id="toggle-icon"></i>
            </button>

            <div class="px-2 pb-3 mb-3 border-b border-slate-100">
                <p class="text-xs font-semibold tracking-wider uppercase sidebar-text text-slate-400">Admin Panel</p>
                <p class="mt-1 text-sm sidebar-text text-slate-600">จัดการระบบหลักของแพลตฟอร์ม</p>
            </div>

            <nav class="space-y-1">
                <NuxtLink v-for="item in mainMenus" :key="item.to" :to="item.to"
                    class="sidebar-item group flex items-center gap-3 rounded-lg px-3 py-2.5 text-primary hover:bg-cta-light"
                    active-class="font-semibold text-cta bg-cta-light">
                    <i :class="item.icon" class="w-5 text-center text-slate-400 group-[.router-link-active]:text-cta"></i>
                    <span class="sidebar-text">{{ item.label }}</span>
                </NuxtLink>

                <div class="pt-3 mt-3 border-t border-slate-200">
                    <p class="px-3 mb-2 text-xs font-semibold tracking-wider uppercase sidebar-text text-slate-400">
                        กฎหมาย & ความปลอดภัย
                    </p>
                    <NuxtLink v-for="item in complianceMenus" :key="item.to" :to="item.to"
                        class="sidebar-item group flex items-center gap-3 rounded-lg px-3 py-2.5 text-primary hover:bg-cta-light"
                        active-class="font-semibold text-cta bg-cta-light">
                        <i :class="item.icon" class="w-5 text-center text-slate-400 group-[.router-link-active]:text-cta"></i>
                        <span class="sidebar-text">{{ item.label }}</span>
                    </NuxtLink>
                </div>


                <div class="pt-3 mt-3 border-t border-slate-200">
                    <button @click="toggleSubmenu('settings-menu')"
                        class="sidebar-item w-full flex items-center justify-between gap-3 px-3 py-2.5 text-primary rounded-lg hover:bg-cta-light">
                        <div class="flex items-center gap-3">
                            <i class="w-5 text-center text-slate-400 fas fa-gear"></i>
                            <span class="sidebar-text">Setting</span>
                        </div>
                        <i class="text-xs transition-transform fas fa-chevron-down sidebar-text" id="settings-menu-icon"></i>
                    </button>

                    <div id="settings-menu" class="hidden mt-1 ml-11 space-y-1 sidebar-text">
                        <button @click="logout" class="block px-3 py-2 text-sm text-slate-500 hover:text-cta">
                            Logout
                        </button>
                    </div>
                </div>
            </nav>
        </div>
    </aside>
</template>

<script setup>
import { useAuth } from '~/composables/useAuth'

const { logout } = useAuth()

const mainMenus = [
    { to: '/admin/users', label: 'User Management', icon: 'fas fa-user' },
    { to: '/admin/vehicles', label: 'Vehicle Management', icon: 'fas fa-car-side' },
    { to: '/admin/routes', label: 'Route Management', icon: 'fas fa-route' },
    { to: '/admin/bookings', label: 'Booking Management', icon: 'fas fa-calendar-check' },
    { to: '/admin/driver-verifications', label: 'Driver Verification Management', icon: 'fas fa-id-card' },
]

const complianceMenus = [
    { to: '/admin/system-logs', label: 'System Logs', icon: 'fas fa-file-lines' },
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
