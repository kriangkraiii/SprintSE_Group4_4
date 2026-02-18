<template>
  <div>
    <!-- Hero Section -->
    <section class="relative min-h-[95vh] flex items-start justify-center ">
      <!-- Subtle grid pattern -->
      <div class="absolute inset-0 opacity-100 bg-no-repeat bg-cover " style="background-image: url('/images/bgindex.png'); background-position:center 70%;"></div>

      <div class="relative py-24 mx-auto max-w-7xl sm:px-8 lg:px-12 w-full ">
        <div class="max-w-7xl text-center mx-auto mt-10">
          
          <!-- Main Heading -->
          <h1 class=" text-5xl font-semibold leading-[1.1] text-white font-heading sm:text-6xl lg:text-8xl tracking-tight">
            แชร์รถ แชร์ค่าใช้จ่าย<br/>
          </h1>
          <h1 class="mb-8 text-3xl font-semibold leading-[1.1] text-white font-heading sm:text-6xl lg:text-7xl tracking-tight">
            ปลอดภัยทุกเส้นทาง
          </h1>
          
          <!-- Description-->
          <!-- <p class="max-w-2xl mb-12 text-lg leading-relaxed text-slate-300 sm:text-xl">
            เชื่อมต่อผู้ขับและผู้โดยสารที่ผ่านการยืนยันตัวตน พร้อมระบบติดตาม GPS แบบเรียลไทม์ 
            ลดค่าใช้จ่ายในการเดินทางได้มากกว่าครึ่ง
          </p> -->
          
          <!-- CTA Buttons -->
          <!-- <div class="flex flex-col gap-4 sm:flex-row sm:gap-5">
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
          </div>  -->

          <!-- Trust Indicators -->
          <div class="flex flex-wrap items-center gap-8 w-full">
            <div class="flex items-center gap-2 text-white">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20 shadow-lg">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="text-sm">ปลอดภัยทุกการเดินทาง ด้วยการยืนยันตัวตนก่อนใช้งาน</span>
            </div>
            <div class="flex items-center gap-2 text-white">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20 shadow-lg">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="text-sm">ติดตามการเดินทางแบบเรียลไทม์ด้วยระบบระบุตำแหน่งที่แม่นยำ</span>
            </div>
            <div class="flex items-center gap-2 text-white">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20 shadow-lg">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span class="text-sm">ประหยัดค่าใช้จ่าย และลดภาระสิ่งแวดล้อม</span>
            </div>
          </div>
        </div>
        
      </div>
      <div class="absolute -bottom-14 left-1/2 -translate-x-1/2 w-full px-6">
          <div class="max-w-6xl mx-auto p-4 bg-white h-28 rounded-2xl shadow-[0_5px_10px_rgba(0,0,0,0.25)]">
              <div class="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">

    <!-- จุดเริ่มต้น -->
    <div>
      <label class="text-sm font-medium text-gray-600">จุดเริ่มต้น</label>
      <input
        type="text"
        placeholder="ค้นหาจุดเริ่มต้น..."
        v-model="from"
        class="w-full mt-1 px-4 py-2 rounded-xl border border-[#CCCCCC] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    </div>

    <!-- จุดปลายทาง -->
    <div>
      <label class="text-sm font-medium text-gray-600">จุดปลายทาง</label>
      <input
        type="text"
        placeholder="ค้นหาจุดปลายทาง..."
        v-model="to"
        class="w-full mt-1 px-4 py-2 rounded-xl border border-[#CCCCCC] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    </div>

    <!-- วันที่ -->
    <div>
      <label class="text-sm font-medium text-gray-600">วันที่</label>
      <input
        type="date"
        v-model="date"
        class="w-full mt-1 px-4 py-2 rounded-xl border border-[#CCCCCC] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    </div>

    <!-- ที่นั่ง -->
    <div>
      <label  class="text-sm font-medium text-gray-600">ที่นั่ง</label>
      <select
        v-model="seat"
        class="w-full mt-1 px-4 py-2 rounded-xl border border-[#CCCCCC] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <option>ทั้งหมด</option>
        <option>1</option>
        <option>2</option>
        <option>3</option>
        <option>4+</option>
      </select>
    </div>

    <!-- ปุ่ม -->
    <div class="flex gap-2 ">
      <button @click="searchTrip" class="flex-1 bg-[#1B9329] hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl shadow">
        ค้นหา
      </button>
    </div>

  </div>
          </div>
        </div>
      
    </section>

    <!-- How It Works -->
    <section class="py-20 bg-white sm:py-24 lg:py-28">
      <div class="px-20 mx-auto max-w-7xl">
        <div class="max-w-3xl mb-16 text-left">
          <h2 class="text-3xl font-semibold text-[#137FEC] font-heading sm:text-5xl lg:text-7xl mb-4">
            ใช้งานง่าย เริ่มได้ทันที!
          </h2>
          <p class="text-lg text-slate-600 pl-8">
            เพียง 3 ขั้นตอน ก็สามารถเริ่มแชร์รถหรือค้นหาเส้นทางได้แล้ว
          </p>
        </div>

        <div class="max-w-3xl mx-auto space-y-12">
          <!-- Step 1 -->
          <div class="relative">
            <div class="flex items-start gap-6">
              <div class="flex-shrink-0">
                <div class="flex items-center justify-center w-18 h-18 rounded-2xl bg-[#137FEC] text-white font-bold text-3xl shadow-lg shadow-blue-200">
                  1
                </div>
              </div>
              <div class="pt-1">
                <h3 class="text-4xl font-semibold text-[#137FEC] mb-2 font-heading">ลงทะเบียน</h3>
                <p class="text-slate-600 leading-relaxed text-lg ml-5">
                  สร้างบัญชีและยืนยันตัวตนด้วยบัตรประชาชนและใบขับขี่ ผ่านระบบ OCR อัตโนมัติ
                </p>
              </div>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="relative">
            <div class="flex items-start gap-6">
              <div class="flex-shrink-0">
                <div class="flex items-center justify-center w-18 h-18 rounded-2xl bg-[#137FEC] text-white font-bold text-3xl shadow-lg shadow-blue-200">
                  2
                </div>
              </div>
              <div class="pt-1">
                <h3 class="text-4xl font-semibold text-[#137FEC] mb-2 font-heading">เลือก/ค้นหาเส้นทาง</h3>
                <p class="text-slate-600 leading-relaxed text-lg ml-5">
                  ค้นหาเส้นทางที่ต้องการ หรือสร้างเส้นทางใหม่ พร้อมกำหนดจุดรับ-ส่ง และเวลาที่สะดวก
                </p>
              </div>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="relative">
            <div class="flex items-start gap-6">
              <div class="flex-shrink-0">
                <div class="flex items-center justify-center w-18 h-18 rounded-2xl bg-[#137FEC] text-white font-bold text-3xl shadow-lg shadow-blue-200">
                  3
                </div>
              </div>
              <div class="pt-1">
                <h3 class="text-4xl font-semibold text-[#137FEC] mb-2 font-heading">เริ่มเดินทาง</h3>
                <p class="text-slate-600 leading-relaxed text-lg ml-5">
                  จองที่นั่ง ชำระเงิน และติดต่อกับคนขับหรือผู้โดยสาร พร้อมเริ่มต้นการเดินทางอย่างปลอดภัย
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section v-if="!token" class="pt-10 pb-55 bg-slate-100 sm:pt-24 lg:pt-28">
      <div class="px-6 mx-auto max-w-4xl sm:px-8 lg:px-12 text-center">
        <h2 class="text-3xl font-semibold text-[#137FEC] font-heading sm:text-5xl lg:text-7xl mb-4">
          พร้อมเริ่มต้นแล้วหรือยัง?
        </h2>
        <p class="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
          สมัครสมาชิกฟรี ไม่มีค่าใช้จ่าย เริ่มแชร์รถหรือหาเส้นทางได้ทันที
        </p>
        <div class="flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-5">
          <NuxtLink :to="localePath('/register')" 
            class="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-lg font-semibold text-white transition-all duration-200 rounded-xl bg-[#137FEC] hover:bg-[#2058C0] shadow-lg hover:shadow-xl">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            สมัครสมาชิกฟรี
          </NuxtLink>
          <NuxtLink :to="localePath('/findTrip')" 
            class="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-lg font-semibold text-[#137FEC] transition-all duration-200 border-2 rounded-xl border-[#137FEC] hover:bg-slate-200 hover:text-[#137FEC] shadow-lg">
            ดูเส้นทางทั้งหมด
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <!-- Footer -->
    <AppFooter />
  </div>
</template>

<script setup>
const localePath = useLocalePath()

const { token, user, logout } = useAuth()

const router = useRouter()

const from = ref('')
const to = ref('')
const date = ref('')
const seat = ref('')

const searchTrip = () => {
  router.push({
    path: localePath('/findTrip'),
    query: {
      from: from.value,
      to: to.value,
      date: date.value,
      seat: seat.value
    }
  })
}

</script>