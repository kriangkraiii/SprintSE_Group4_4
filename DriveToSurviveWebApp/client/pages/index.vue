<template>
  <div>
    <!-- Hero Section -->
    <section class="relative min-h-[90vh] flex items-center overflow-hidden bg-primary">
      <!-- Subtle grid pattern -->
      <div class="absolute inset-0 opacity-[0.03]" style="background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>

      <div class="relative px-6 py-24 mx-auto max-w-7xl sm:px-8 lg:px-12 w-full">
        <div class="max-w-4xl">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2.5 px-4 py-2 mb-8 text-sm font-medium rounded-full bg-cta/10 text-cta border border-cta/20">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cta opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-cta"></span>
            </span>
            มีผู้ใช้งานมากกว่า 10,000 คนแล้ว
          </div>
          
          <!-- Main Heading -->
          <h1 class="mb-8 text-5xl font-bold leading-[1.1] text-white font-heading sm:text-6xl lg:text-7xl tracking-tight">
            แชร์รถ แชร์ค่าใช้จ่าย<br/>
            <span class="text-cta">ปลอดภัยทุกเส้นทาง</span>
          </h1>
          
          <!-- Description -->
          <p class="max-w-2xl mb-12 text-lg leading-relaxed text-slate-300 sm:text-xl">
            เชื่อมต่อผู้ขับและผู้โดยสารที่ผ่านการยืนยันตัวตน พร้อมระบบติดตาม GPS แบบเรียลไทม์ 
            ลดค่าใช้จ่ายในการเดินทางได้มากกว่าครึ่ง
          </p>
          
          <!-- CTA Buttons -->
          <div class="flex flex-col gap-4 sm:flex-row sm:gap-5">
            <NuxtLink :to="localePath('/findTrip')" 
              class="group inline-flex items-center justify-center gap-2.5 px-7 py-4 text-base font-semibold text-primary transition-all duration-200 rounded-xl bg-cta hover:bg-yellow-400 shadow-lg hover:shadow-xl hover:shadow-cta/20">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              ค้นหาเส้นทาง
            </NuxtLink>
            
            <NuxtLink :to="localePath('/register')" 
              class="inline-flex items-center justify-center gap-2.5 px-7 py-4 text-base font-semibold text-white transition-all duration-200 border-2 rounded-xl border-white/20 hover:bg-white/5 hover:border-white/30">
              สมัครสมาชิกฟรี
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </NuxtLink>
          </div>

          <!-- Trust Indicators -->
          <div class="flex flex-wrap items-center gap-8 mt-16 pt-8 border-t border-white/10">
            <div class="flex items-center gap-2 text-slate-300">
              <svg class="w-5 h-5 text-cta" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="text-sm">ยืนยันตัวตนด้วย eKYC</span>
            </div>
            <div class="flex items-center gap-2 text-slate-300">
              <svg class="w-5 h-5 text-cta" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="text-sm">ติดตาม GPS เรียลไทม์</span>
            </div>
            <div class="flex items-center gap-2 text-slate-300">
              <svg class="w-5 h-5 text-cta" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="text-sm">ปฏิบัติตาม PDPA</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="py-20 bg-white sm:py-24 lg:py-28">
      <div class="px-6 mx-auto max-w-7xl sm:px-8 lg:px-12">
        <div class="max-w-2xl mb-16">
          <h2 class="text-3xl font-bold text-primary font-heading sm:text-4xl lg:text-5xl mb-4">
            ใช้งานง่าย เริ่มได้ทันที
          </h2>
          <p class="text-lg text-slate-600">
            เพียง 3 ขั้นตอน ก็สามารถเริ่มแชร์รถหรือหาเส้นทางได้แล้ว
          </p>
        </div>

        <div class="grid gap-8 lg:grid-cols-3 lg:gap-12">
          <!-- Step 1 -->
          <div class="relative">
            <div class="flex items-start gap-5">
              <div class="flex-shrink-0">
                <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white font-bold text-xl">
                  1
                </div>
              </div>
              <div>
                <h3 class="text-xl font-bold text-primary mb-3 font-heading">ลงทะเบียน</h3>
                <p class="text-slate-600 leading-relaxed">
                  สร้างบัญชีและยืนยันตัวตนด้วยบัตรประชาชนและใบขับขี่ ผ่านระบบ OCR อัตโนมัติ
                </p>
              </div>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="relative">
            <div class="flex items-start gap-5">
              <div class="flex-shrink-0">
                <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white font-bold text-xl">
                  2
                </div>
              </div>
              <div>
                <h3 class="text-xl font-bold text-primary mb-3 font-heading">เลือกเส้นทาง</h3>
                <p class="text-slate-600 leading-relaxed">
                  ค้นหาเส้นทางที่ต้องการ หรือสร้างเส้นทางใหม่ พร้อมกำหนดจุดรับ-ส่ง และเวลาที่สะดวก
                </p>
              </div>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="relative">
            <div class="flex items-start gap-5">
              <div class="flex-shrink-0">
                <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white font-bold text-xl">
                  3
                </div>
              </div>
              <div>
                <h3 class="text-xl font-bold text-primary mb-3 font-heading">เริ่มเดินทาง</h3>
                <p class="text-slate-600 leading-relaxed">
                  จองที่นั่ง ชำระเงิน และติดต่อกับคนขับหรือผู้โดยสาร พร้อมเริ่มต้นการเดินทางอย่างปลอดภัย
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-20 bg-slate-50 sm:py-24 lg:py-28">
      <div class="px-6 mx-auto max-w-7xl sm:px-8 lg:px-12">
        <div class="max-w-2xl mb-16 text-center mx-auto">
          <h2 class="text-3xl font-bold text-primary font-heading sm:text-4xl lg:text-5xl mb-4">
            ทำไมต้องเลือกเรา
          </h2>
          <p class="text-lg text-slate-600">
            ฟีเจอร์ที่ออกแบบมาเพื่อความปลอดภัยและความสะดวกสบายของคุณ
          </p>
        </div>

        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <!-- Feature 1 -->
          <div class="p-8 bg-white rounded-2xl border border-slate-200 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
            <div class="flex items-center justify-center w-14 h-14 mb-6 rounded-xl bg-emerald-50">
              <svg class="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-primary mb-2 font-heading">ปลอดภัยด้วย eKYC</h3>
            <p class="text-slate-600 text-sm leading-relaxed">
              ยืนยันตัวตนด้วยบัตรประชาชนและใบขับขี่ ผ่านระบบ OCR อัตโนมัติ
            </p>
          </div>

          <!-- Feature 2 -->
          <div class="p-8 bg-white rounded-2xl border border-slate-200 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
            <div class="flex items-center justify-center w-14 h-14 mb-6 rounded-xl bg-sky-50">
              <svg class="w-7 h-7 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-primary mb-2 font-heading">ติดตาม Real-time</h3>
            <p class="text-slate-600 text-sm leading-relaxed">
              ระบบ GPS แม่นยำ ติดตามตำแหน่งและเส้นทางแบบเรียลไทม์
            </p>
          </div>

          <!-- Feature 3 -->
          <div class="p-8 bg-white rounded-2xl border border-slate-200 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
            <div class="flex items-center justify-center w-14 h-14 mb-6 rounded-xl bg-purple-50">
              <svg class="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-primary mb-2 font-heading">ชุมชนที่ไว้ใจได้</h3>
            <p class="text-slate-600 text-sm leading-relaxed">
              ระบบรีวิวและเรตติ้ง สร้างความไว้วางใจในชุมชน
            </p>
          </div>

          <!-- Feature 4 -->
          <div class="p-8 bg-white rounded-2xl border border-slate-200 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
            <div class="flex items-center justify-center w-14 h-14 mb-6 rounded-xl bg-amber-50">
              <svg class="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-primary mb-2 font-heading">ประหยัดค่าใช้จ่าย</h3>
            <p class="text-slate-600 text-sm leading-relaxed">
              แบ่งค่าน้ำมันและค่าทางด่วน ลดต้นทุนการเดินทางได้มากกว่าครึ่ง
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="py-16 bg-primary sm:py-20">
      <div class="px-6 mx-auto max-w-7xl sm:px-8 lg:px-12">
        <div class="grid gap-8 md:grid-cols-3">
          <div class="text-center">
            <div class="text-5xl font-bold text-cta mb-2">10,000+</div>
            <div class="text-slate-300">ผู้ใช้งานที่ยืนยันตัวตนแล้ว</div>
          </div>
          <div class="text-center">
            <div class="text-5xl font-bold text-cta mb-2">50,000+</div>
            <div class="text-slate-300">เส้นทางที่สร้างขึ้น</div>
          </div>
          <div class="text-center">
            <div class="text-5xl font-bold text-cta mb-2">4.8/5</div>
            <div class="text-slate-300">คะแนนความพึงพอใจเฉลี่ย</div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-20 bg-white sm:py-24 lg:py-28">
      <div class="px-6 mx-auto max-w-4xl sm:px-8 lg:px-12 text-center">
        <h2 class="text-3xl font-bold text-primary font-heading sm:text-4xl lg:text-5xl mb-6">
          พร้อมเริ่มต้นแล้วหรือยัง?
        </h2>
        <p class="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
          สมัครสมาชิกฟรี ไม่มีค่าใช้จ่าย เริ่มแชร์รถหรือหาเส้นทางได้ทันที
        </p>
        <div class="flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-5">
          <NuxtLink :to="localePath('/register')" 
            class="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-lg font-semibold text-primary transition-all duration-200 rounded-xl bg-cta hover:bg-yellow-400 shadow-lg hover:shadow-xl">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            สมัครสมาชิกฟรี
          </NuxtLink>
          <NuxtLink :to="localePath('/findTrip')" 
            class="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-lg font-semibold text-primary transition-all duration-200 border-2 rounded-xl border-slate-300 hover:border-primary hover:bg-slate-50">
            ดูเส้นทางทั้งหมด
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-16 bg-primary border-t border-emerald-800">
      <div class="px-6 mx-auto max-w-7xl sm:px-8 lg:px-12">
        <div class="grid gap-12 md:grid-cols-4">
          <div class="md:col-span-2">
            <div class="flex items-center gap-3 mb-6">
              <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-cta">
                <svg class="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span class="text-xl font-bold text-white font-heading">Drive To Survive</span>
            </div>
            <p class="text-slate-400 max-w-md mb-6 leading-relaxed">
              แพลตฟอร์มแชร์รถที่ปลอดภัยและน่าเชื่อถือ ด้วยระบบยืนยันตัวตน eKYC และการติดตาม GPS แบบเรียลไทม์
            </p>
          </div>
          
          <div>
            <h4 class="mb-4 font-semibold text-white">ลิงก์สำคัญ</h4>
            <div class="space-y-3">
              <NuxtLink :to="localePath('/findTrip')" class="block text-slate-400 hover:text-white transition-colors">ค้นหาเส้นทาง</NuxtLink>
              <NuxtLink :to="localePath('/createTrip')" class="block text-slate-400 hover:text-white transition-colors">สร้างเส้นทาง</NuxtLink>
              <NuxtLink :to="localePath('/about')" class="block text-slate-400 hover:text-white transition-colors">เกี่ยวกับเรา</NuxtLink>
            </div>
          </div>
          
          <div>
            <h4 class="mb-4 font-semibold text-white">นโยบาย</h4>
            <div class="space-y-3">
              <NuxtLink :to="localePath('/terms-of-service')" class="block text-slate-400 hover:text-white transition-colors">ข้อกำหนดการใช้งาน</NuxtLink>
              <NuxtLink :to="localePath('/privacy')" class="block text-slate-400 hover:text-white transition-colors">นโยบายความเป็นส่วนตัว</NuxtLink>
            </div>
          </div>
        </div>
        
        <div class="pt-8 mt-12 text-center border-t border-emerald-800">
          <p class="text-slate-500">© {{ new Date().getFullYear() }} Drive To Survive. สงวนลิขสิทธิ์.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
const localePath = useLocalePath()
</script>