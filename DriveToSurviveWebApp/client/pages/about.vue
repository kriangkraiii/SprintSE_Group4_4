<template>
  <div>
    <!-- Hero Section -->
    <section class="relative py-20 overflow-hidden bg-primary">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0" style="background-image: radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px); background-size: 32px 32px;"></div>
      </div>
      <div class="relative px-4 mx-auto text-center max-w-7xl sm:px-6 lg:px-8">
        <h1 class="mb-4 text-4xl font-bold text-white font-heading lg:text-5xl">เกี่ยวกับ Drive To Survive</h1>
        <p class="max-w-2xl mx-auto text-lg text-slate-300">
          เรียนรู้เพิ่มเติมเกี่ยวกับแพลตฟอร์มเดินทางร่วมกันที่ปลอดภัยที่สุด
        </p>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-20 bg-white">
      <div class="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div class="mb-16 text-center">
          <h2 class="mb-4 text-3xl font-bold font-heading text-primary lg:text-4xl">ทำไมต้อง Drive To Survive?</h2>
          <p class="max-w-2xl mx-auto text-slate-500">แพลตฟอร์มที่ออกแบบมาเพื่อความปลอดภัยของคุณในทุกเที่ยวเดินทาง</p>
        </div>
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div v-for="feature in features" :key="feature.title" class="p-6 transition-all duration-300 border card border-slate-100 hover:border-cta/30">
            <div class="flex items-center justify-center w-12 h-12 mb-4 rounded-xl" :class="feature.iconBg">
              <svg class="w-6 h-6" :class="feature.iconColor" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" :d="feature.icon" />
              </svg>
            </div>
            <h3 class="mb-2 text-lg font-semibold font-heading text-primary">{{ feature.title }}</h3>
            <p class="text-sm leading-relaxed text-slate-500">{{ feature.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="py-20 bg-surface">
      <div class="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div class="mb-16 text-center">
          <h2 class="mb-4 text-3xl font-bold font-heading text-primary lg:text-4xl">เริ่มต้นง่ายๆ 4 ขั้นตอน</h2>
          <p class="max-w-2xl mx-auto text-slate-500">ระบบใช้งานง่าย ลงทะเบียนเสร็จเดินทางได้ทันที</p>
        </div>
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div v-for="(step, idx) in steps" :key="idx" class="relative text-center">
            <div class="flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-full bg-cta/10">
              <span class="text-xl font-bold text-cta font-heading">{{ idx + 1 }}</span>
            </div>
            <h3 class="mb-2 text-lg font-semibold font-heading text-primary">{{ step.title }}</h3>
            <p class="text-sm text-slate-500">{{ step.desc }}</p>
            <div v-if="idx < steps.length - 1" class="hidden lg:block absolute top-7 left-[60%] w-[80%] border-t-2 border-dashed border-slate-200"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Safety Highlights -->
    <section class="py-20 bg-white">
      <div class="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div class="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 class="mb-4 text-3xl font-bold font-heading text-primary lg:text-4xl">ความปลอดภัยที่ครอบคลุม</h2>
            <p class="mb-8 text-slate-500">เราลงทุนในระบบความปลอดภัยมาตรฐานสากล เพื่อให้คุณวางใจได้ในทุกเที่ยว</p>
            <div class="space-y-4">
              <div v-for="safety in safetyItems" :key="safety.title" class="flex gap-4 p-4 border card border-slate-100">
                <div class="flex items-center justify-center w-10 h-10 rounded-lg shrink-0" :class="safety.iconBg">
                  <svg class="w-5 h-5" :class="safety.iconColor" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" :d="safety.icon" />
                  </svg>
                </div>
                <div>
                  <h4 class="mb-1 font-semibold font-heading text-primary">{{ safety.title }}</h4>
                  <p class="text-sm text-slate-500">{{ safety.desc }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="hidden lg:block">
            <div class="grid grid-cols-2 gap-4">
              <div class="p-6 text-center border card border-slate-100">
                <div class="mb-2 text-3xl font-bold text-cta font-heading">100%</div>
                <p class="text-sm text-slate-500">ยืนยันตัวตน</p>
              </div>
              <div class="p-6 text-center border card border-slate-100">
                <div class="mb-2 text-3xl font-bold text-cta font-heading">24/7</div>
                <p class="text-sm text-slate-500">ติดตามเรียลไทม์</p>
              </div>
              <div class="p-6 text-center border card border-slate-100">
                <div class="mb-2 text-3xl font-bold text-cta font-heading">PDPA</div>
                <p class="text-sm text-slate-500">คุ้มครองข้อมูล</p>
              </div>
              <div class="p-6 text-center border card border-slate-100">
                <div class="mb-2 text-3xl font-bold text-cta font-heading">SOS</div>
                <p class="text-sm text-slate-500">ปุ่มฉุกเฉิน</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-20 bg-surface">
      <div class="max-w-3xl px-4 mx-auto sm:px-6 lg:px-8">
        <div class="mb-12 text-center">
          <h2 class="mb-4 text-3xl font-bold font-heading text-primary">คำถามที่พบบ่อย</h2>
          <p class="text-slate-500">คำตอบสำหรับข้อสงสัยทั่วไปเกี่ยวกับ Drive To Survive</p>
        </div>
        <div class="space-y-3">
          <div v-for="(faq, idx) in faqs" :key="idx" class="overflow-hidden border card border-slate-100">
            <button @click="toggleFaq(idx)"
              class="flex items-center justify-between w-full px-6 py-4 text-left cursor-pointer">
              <span class="font-medium text-primary">{{ faq.q }}</span>
              <svg class="w-5 h-5 transition-transform duration-200 shrink-0 text-slate-400"
                :class="{ 'rotate-180': openFaqIdx === idx }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div class="overflow-hidden transition-all duration-300"
              :style="{ maxHeight: openFaqIdx === idx ? '200px' : '0', paddingBottom: openFaqIdx === idx ? '16px' : '0' }">
              <p class="px-6 text-sm leading-relaxed text-slate-500">{{ faq.a }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-20 bg-gradient-to-br from-primary via-slate-900 to-primary">
      <div class="max-w-3xl px-4 mx-auto text-center sm:px-6 lg:px-8">
        <h2 class="mb-4 text-3xl font-bold text-white font-heading lg:text-4xl">พร้อมเดินทางอย่างปลอดภัย?</h2>
        <p class="mb-8 text-lg text-slate-300">สมัครฟรี ไม่มีค่าใช้จ่ายแฝง เริ่มต้นได้เลยวันนี้</p>
        <div class="flex justify-center gap-4">
          <NuxtLink to="/register" class="inline-flex items-center gap-2 px-8 py-3 font-medium text-white transition-all duration-200 rounded-lg shadow-lg bg-cta hover:bg-cta-hover hover:shadow-xl">
            สมัครสมาชิกฟรี
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const features = [
  { title: 'ยืนยันตัวตน eKYC', desc: 'ทุกผู้ใช้ต้องผ่านการยืนยันตัวตนด้วยบัตรประชาชนและ Selfie ก่อนใช้งาน', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', iconBg: 'bg-sky-50', iconColor: 'text-cta' },
  { title: 'ติดตามเรียลไทม์', desc: 'ระบบ GPS ติดตามการเดินทางแบบเรียลไทม์ ผู้โดยสารและผู้ดูแลเห็นตำแหน่งตลอดเส้นทาง', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { title: 'ปุ่ม SOS ฉุกเฉิน', desc: 'กดปุ่ม SOS เพื่อแจ้งเตือนผู้ติดต่อฉุกเฉินและศูนย์ช่วยเหลือทันที', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z', iconBg: 'bg-red-50', iconColor: 'text-red-500' },
  { title: 'ระบบรีวิว', desc: 'ให้คะแนนและรีวิวผู้ขับขี่หลังเดินทาง ช่วยให้ชุมชนปลอดภัยขึ้น', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', iconBg: 'bg-amber-50', iconColor: 'text-amber-500' },
  { title: 'PDPA Compliant', desc: 'ข้อมูลส่วนบุคคลของคุณได้รับการคุ้มครองตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', iconBg: 'bg-indigo-50', iconColor: 'text-indigo-500' },
  { title: 'แชร์ค่าใช้จ่าย', desc: 'ประหยัดค่าเดินทางโดยแชร์เส้นทางกับผู้ร่วมทาง ตั้งราคาเองได้', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', iconBg: 'bg-teal-50', iconColor: 'text-teal-600' },
]

const steps = [
  { title: 'สมัครสมาชิก', desc: 'กรอกข้อมูลและยืนยันตัวตนด้วยบัตรประชาชน' },
  { title: 'ค้นหาหรือสร้างเส้นทาง', desc: 'ค้นหาเส้นทางที่ต้องการหรือสร้างเส้นทางของคุณเอง' },
  { title: 'จองที่นั่ง', desc: 'จองที่นั่งกับผู้ขับขี่ที่ผ่านการยืนยันแล้ว' },
  { title: 'เดินทางอย่างปลอดภัย', desc: 'ติดตามเส้นทางแบบเรียลไทม์ พร้อมปุ่ม SOS' },
]

const safetyItems = [
  { title: 'ยืนยันตัวตนทุกคน', desc: 'ทั้งผู้โดยสารและผู้ขับขี่ต้องผ่าน eKYC ด้วยบัตรประชาชนและรูปถ่าย', icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2', iconBg: 'bg-sky-50', iconColor: 'text-cta' },
  { title: 'ระบบ Blacklist', desc: 'ระบบตรวจสอบรายชื่อบุคคลต้องห้ามอัตโนมัติ ป้องกันผู้ใช้อันตราย', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', iconBg: 'bg-red-50', iconColor: 'text-red-500' },
  { title: 'System Log ตาม กม.', desc: 'บันทึกกิจกรรมตาม พ.ร.บ.คอมพิวเตอร์ ม.26 เก็บรักษา 90 วัน', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
]

const faqs = [
  { q: 'Drive To Survive คืออะไร?', a: 'Drive To Survive คือแพลตฟอร์มแชร์เส้นทางการเดินทางที่เน้นความปลอดภัยเป็นอันดับหนึ่ง ทุกผู้ใช้ต้องผ่านการยืนยันตัวตน และมีระบบติดตามเรียลไทม์ ปุ่ม SOS และระบบรีวิวเพื่อความปลอดภัยของทุกคน' },
  { q: 'สมัครสมาชิกต้องใช้อะไรบ้าง?', a: 'คุณต้องใช้อีเมล เบอร์โทรศัพท์ รูปถ่ายบัตรประชาชน และรูปเซลฟี่เพื่อยืนยันตัวตนผ่านระบบ eKYC' },
  { q: 'ข้อมูลส่วนตัวของฉันปลอดภัยไหม?', a: 'เราปฏิบัติตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) อย่างเคร่งครัด ข้อมูลถูกเข้ารหัสและไม่มีการแชร์ให้บุคคลที่สาม' },
  { q: 'ค่าใช้จ่ายเท่าไหร่?', a: 'การสมัครสมาชิกและใช้งานฟรี! ค่าเดินทางตกลงกันระหว่างผู้ขับขี่และผู้โดยสาร ระบบจะแสดงราคาก่อนการจอง' },
  { q: 'หากเกิดเหตุฉุกเฉินต้องทำอย่างไร?', a: 'กดปุ่ม SOS ในหน้าติดตามการเดินทาง ระบบจะแจ้งเตือนผู้ติดต่อฉุกเฉินและส่งตำแหน่ง GPS ให้ทันที' },
]

const openFaqIdx = ref(null)
const toggleFaq = (idx) => {
  openFaqIdx.value = openFaqIdx.value === idx ? null : idx
}
</script>
