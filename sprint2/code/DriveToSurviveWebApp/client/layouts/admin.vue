<template>
    <div>
        <main class="min-h-screen bg-slate-50">
            <NuxtPage />
        </main>
    </div>
</template>

<script setup>
// Admin layout — ไม่มี AppHeader เพราะ admin pages มี AdminHeader ของตัวเอง
// โหลด Font Awesome ให้ทุกหน้า admin อัตโนมัติ
useHead({
    link: [{ rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css' }],
})
</script>
