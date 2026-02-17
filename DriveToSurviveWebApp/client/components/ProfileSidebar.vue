<template>
    <!-- Desktop Sidebar -->
    <aside class="w-80 bg-slate-50 p-6 border-r border-slate-100 hidden md:block">
        <div class="mb-8">
            <h1 class="text-xl font-bold text-primary text-center mb-2">โปรไฟล์และการตั้งค่า</h1>
            <p class="text-sm text-slate-500 text-center">จัดการข้อมูลส่วนตัวและความปลอดภัยของบัญชี</p>
        </div>
        <nav class="space-y-4">
            <div>
                <h3 class="text-sm font-semibold text-primary mb-2 px-4">การจัดการบัญชี</h3>
                <ul class="space-y-1">
                    <li>
                        <NuxtLink to="/profile" class="block px-4 py-2 text-sm rounded-md"
                            :class="isActive('/profile') ? 'font-semibold text-cta bg-cta-light' : 'text-primary hover:bg-slate-100'">
                            โปรไฟล์ของฉัน
                        </NuxtLink>
                    </li>
                </ul>
            </div>
            <div>
                <h3 class="text-sm font-semibold text-primary mb-2 px-4">การยืนยันตัวตน</h3>
                <ul class="space-y-1">
                    <li>
                        <NuxtLink to="/profile/verification" class="block px-4 py-2 text-sm rounded-md"
                            :class="isActive('/profile/verification') ? 'font-semibold text-cta bg-cta-light' : 'text-primary hover:bg-slate-100'">
                            การยืนยันตัวตนขั้นพื้นฐาน
                        </NuxtLink>
                    </li>
                    <li>
                        <NuxtLink to="/profile/driver-verification" class="block px-4 py-2 text-sm rounded-md"
                            :class="isActive('/profile/driver-verification') ? 'font-semibold text-cta bg-cta-light' : 'text-primary hover:bg-slate-100'">
                            การยืนยันตัวตนสำหรับผู้ขับขี่
                        </NuxtLink>
                    </li>
                </ul>
            </div>
            <div>
                <h3 class="text-sm font-semibold text-primary mb-2 px-4">โหมดผู้ขับขี่</h3>
                <ul class="space-y-1">
                    <li>
                        <NuxtLink to="/profile/my-vehicle" class="block px-4 py-2 text-sm rounded-md"
                            :class="isActive('/profile/my-vehicle') ? 'font-semibold text-cta bg-cta-light' : 'text-primary hover:bg-slate-100'">
                            ข้อมูลรถยนต์ของฉัน
                        </NuxtLink>
                    </li>
                </ul>
            </div>
        </nav>
    </aside>

    <!-- Mobile Navigation (แสดงเฉพาะจอเล็ก) -->
    <div class="md:hidden border-b border-slate-200 bg-white px-4 py-3">
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <NuxtLink to="/profile"
                class="shrink-0 px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap"
                :class="isActive('/profile') ? 'bg-cta text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'">
                โปรไฟล์
            </NuxtLink>
            <NuxtLink to="/profile/verification"
                class="shrink-0 px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap"
                :class="isActive('/profile/verification') ? 'bg-cta text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'">
                ยืนยันตัวตน
            </NuxtLink>
            <NuxtLink to="/profile/driver-verification"
                class="shrink-0 px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap"
                :class="isActive('/profile/driver-verification') ? 'bg-cta text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'">
                ยืนยันใบขับขี่
            </NuxtLink>
            <NuxtLink to="/profile/my-vehicle"
                class="shrink-0 px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap"
                :class="isActive('/profile/my-vehicle') ? 'bg-cta text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'">
                ข้อมูลรถยนต์
            </NuxtLink>
        </div>
    </div>
</template>

<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();

// Function to check if a menu item is active (exact match)
const isActive = (path) => {
    return route.path === path || (path !== '/profile' && route.path.startsWith(path));
};
</script>