<template>
    <footer class="py-8 bg-white border-t border-slate-200">
      <div class="px-6 mx-auto max-w-7xl sm:px-8 lg:px-12">
        <div class="grid gap-12 md:grid-cols-4">
          <div class="md:col-span-2">
            <div class="flex items-center gap-3 mb-6">
              <div class="flex items-center justify-center w-10 h-10 rounded-lg ">
                <img src="/Ride.png" alt="Ride Logo" class="h-8 w-auto object-contain" />
              </div>
              <span class="text-3xl font-bold text-[#236993] font-heading">Ride</span>
            </div>
            <p class="text-slate-600 max-w-md mb-6 leading-relaxed font-semibold">
              แพลตฟอร์มแชร์รถที่ปลอดภัยและน่าเชื่อถือ<br>
              ด้วยระบบยืนยันตัวตน eKYC และการติดตาม GPS แบบเรียลไทม์
            </p>
          </div>
          
          <div>
            <h4 class="mb-4 font-bold text-slate-600 text-lg font-heading">ลิงก์สำคัญ</h4>
            <div class="space-y-3">
              <NuxtLink :to="localePath('/findTrip')" class="block text-[#236993] hover:text-[#137FEC] transition-colors font-medium ml-3">ค้นหาเส้นทาง</NuxtLink>
              <NuxtLink :to="localePath('/createTrip')" class="block text-[#236993] hover:text-[#137FEC] transition-colors font-medium ml-3">สร้างเส้นทาง</NuxtLink>
              <NuxtLink :to="localePath('/about')" class="block text-[#236993] hover:text-[#137FEC] transition-colors font-medium ml-3">เกี่ยวกับเรา</NuxtLink>
            </div>
          </div>
          
          <div>
            <h4 class="mb-4 font-bold text-slate-600 text-lg font-heading">นโยบาย</h4>
            <div class="space-y-3">
              <NuxtLink :to="localePath('/terms-of-service')" class="block text-[#236993] hover:text-[#137FEC] transition-colors font-medium ml-3">ข้อกำหนดการใช้งาน</NuxtLink>
              <NuxtLink :to="localePath('/privacy')" class="block text-[#236993] hover:text-[#137FEC] transition-colors font-medium ml-3">นโยบายความเป็นส่วนตัว</NuxtLink>
            </div>
          </div>
        </div>
        
        <div class="pt-20 mt-15 text-center">
          <p class="text-[#236993] text-sm font-medium">© {{ new Date().getFullYear() }} Ride | สงวนลิขสิทธิ์</p>
        </div>
      </div>
    </footer>
</template>

<script setup>
const localePath = useLocalePath()
</script>
