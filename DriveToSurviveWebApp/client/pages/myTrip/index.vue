<script setup>
definePageMeta({ middleware: 'auth' })
navigateTo('/myTrips', { redirectCode: 301 })
</script>
<template><div class="min-h-screen flex items-center justify-center text-slate-400">กำลังนำทาง...</div></template>