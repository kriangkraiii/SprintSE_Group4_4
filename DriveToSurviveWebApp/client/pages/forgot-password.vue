<template>
  <div class="flex min-h-[85vh]">
    <!-- Left panel -->
    <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-slate-900 to-primary items-center justify-center p-12">
      <div class="max-w-md text-center">
        <div class="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl bg-cta/20">
          <svg class="w-8 h-8 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h2 class="mb-4 text-3xl font-bold text-white font-heading">รีเซ็ตรหัสผ่าน</h2>
        <p class="text-slate-300">เราจะส่งรหัส OTP 6 หลักไปยังอีเมลของคุณ<br>เพื่อยืนยันตัวตนและตั้งรหัสผ่านใหม่</p>
      </div>
    </div>

    <!-- Right form -->
    <div class="flex items-center justify-center flex-1 p-6 sm:p-8 lg:p-12">
      <div class="w-full max-w-md">
        <!-- Mobile brand -->
        <div class="flex items-center justify-center gap-2 mb-8 lg:hidden">
          <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span class="text-xl font-bold font-heading text-primary">Drive To Survive</span>
        </div>

        <!-- Stepper -->
        <div class="relative mb-8">
          <div class="absolute left-0 right-0 h-0.5 bg-slate-200 top-5"></div>
          <div class="absolute left-0 h-0.5 transition-all duration-500 bg-cta top-5" :style="{ width: stepProgress }"></div>
          <div class="relative flex items-center justify-between">
            <div v-for="s in 3" :key="s" class="z-10 flex flex-col items-center w-1/3">
              <div :class="[
                'flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all duration-500',
                s < step ? 'bg-cta text-white' :
                s === step ? 'bg-cta text-white ring-4 ring-sky-200' :
                'bg-slate-200 text-slate-400'
              ]">
                <svg v-if="s < step" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span v-else>{{ s }}</span>
              </div>
              <span :class="['text-xs text-center mt-2', s <= step ? 'font-semibold text-cta' : 'text-slate-400']">
                {{ ['กรอกอีเมล', 'ยืนยัน OTP', 'รหัสผ่านใหม่'][s - 1] }}
              </span>
            </div>
          </div>
        </div>

        <!-- Step 1: Email -->
        <div v-if="step === 1">
          <h1 class="mb-2 text-2xl font-bold font-heading text-primary">ลืมรหัสผ่าน?</h1>
          <p class="mb-6 text-sm text-slate-500">กรอกอีเมลที่ลงทะเบียนไว้ เราจะส่งรหัส OTP ให้คุณ</p>

          <form @submit.prevent="requestOtp" class="space-y-5">
            <div>
              <label for="email" class="block mb-1.5 text-sm font-medium text-primary">อีเมล <span class="text-red-500">*</span></label>
              <input type="email" id="email" v-model="email" required placeholder="example@example.com"
                class="input-field" />
            </div>
            <button type="submit" :disabled="isLoading" class="flex items-center justify-center w-full py-3 btn-primary disabled:opacity-50">
              <svg v-if="isLoading" class="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {{ isLoading ? 'กำลังส่ง...' : 'ส่งรหัส OTP' }}
            </button>
          </form>
        </div>

        <!-- Step 2: OTP -->
        <div v-if="step === 2">
          <h1 class="mb-2 text-2xl font-bold font-heading text-primary">ยืนยันรหัส OTP</h1>
          <p class="mb-6 text-sm text-slate-500">
            กรอกรหัส 6 หลักที่ส่งไปที่ <strong class="text-primary">{{ maskedEmail }}</strong>
          </p>

          <form @submit.prevent="checkOtp" class="space-y-5">
            <div>
              <label for="otp" class="block mb-1.5 text-sm font-medium text-primary">รหัส OTP <span class="text-red-500">*</span></label>
              <input type="text" id="otp" v-model="otpCode" required maxlength="6" pattern="[0-9]{6}"
                placeholder="xxxxxx" inputmode="numeric"
                class="text-2xl font-mono tracking-[0.5em] text-center input-field" />
            </div>

            <button type="submit" :disabled="isLoading || otpCode.length !== 6" class="flex items-center justify-center w-full py-3 btn-primary disabled:opacity-50">
              <svg v-if="isLoading" class="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {{ isLoading ? 'กำลังตรวจสอบ...' : 'ยืนยัน OTP' }}
            </button>

            <div class="text-center">
              <button type="button" @click="requestOtp" :disabled="resendCooldown > 0"
                class="text-sm cursor-pointer text-cta hover:text-cta-hover disabled:text-slate-400 disabled:cursor-not-allowed">
                {{ resendCooldown > 0 ? `ส่งอีกครั้งใน ${resendCooldown} วินาที` : 'ส่งรหัส OTP อีกครั้ง' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Step 3: New Password -->
        <div v-if="step === 3">
          <h1 class="mb-2 text-2xl font-bold font-heading text-primary">ตั้งรหัสผ่านใหม่</h1>
          <p class="mb-6 text-sm text-slate-500">กรอกรหัสผ่านใหม่ของคุณ ต้องกรอก 2 ครั้งให้ตรงกัน</p>

          <form @submit.prevent="resetPwd" class="space-y-5">
            <div>
              <label for="newPassword" class="block mb-1.5 text-sm font-medium text-primary">รหัสผ่านใหม่ <span class="text-red-500">*</span></label>
              <input type="password" id="newPassword" v-model="newPassword" required minlength="8"
                placeholder="อย่างน้อย 8 ตัวอักษร" class="input-field" />
            </div>
            <div>
              <label for="confirmPassword" class="block mb-1.5 text-sm font-medium text-primary">ยืนยันรหัสผ่านใหม่ <span class="text-red-500">*</span></label>
              <input type="password" id="confirmPassword" v-model="confirmPassword" required minlength="8"
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง" class="input-field"
                :class="{ 'border-red-400': confirmPassword && newPassword !== confirmPassword }" />
              <p v-if="confirmPassword && newPassword !== confirmPassword" class="mt-1 text-xs text-red-600">
                รหัสผ่านไม่ตรงกัน
              </p>
            </div>
            <button type="submit" :disabled="isLoading || !newPassword || newPassword !== confirmPassword"
              class="flex items-center justify-center w-full py-3 btn-primary disabled:opacity-50">
              <svg v-if="isLoading" class="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {{ isLoading ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน' }}
            </button>
          </form>
        </div>

        <!-- Step 4: Success -->
        <div v-if="step === 4" class="text-center">
          <div class="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100">
            <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 class="mb-2 text-2xl font-bold font-heading text-primary">เปลี่ยนรหัสผ่านสำเร็จ!</h1>
          <p class="mb-8 text-sm text-slate-500">คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว</p>
          <NuxtLink to="/login" class="inline-flex items-center gap-2 px-6 py-3 btn-primary">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            ไปหน้าเข้าสู่ระบบ
          </NuxtLink>
        </div>

        <!-- Error message -->
        <div v-if="errorMessage" class="flex items-center gap-2 p-3 mt-4 text-sm text-red-700 border rounded-lg bg-red-50 border-red-200">
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {{ errorMessage }}
        </div>

        <!-- Back to login -->
        <p v-if="step < 4" class="mt-8 text-sm text-center text-slate-500">
          จำรหัสผ่านได้แล้ว?
          <NuxtLink to="/login" class="font-medium cursor-pointer text-cta hover:text-cta-hover">เข้าสู่ระบบ</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

const config = useRuntimeConfig()
const apiBase = (config.public.apiBase || 'http://localhost:3000/api').replace(/\/+$/, '')

const step = ref(1)
const email = ref('')
const otpCode = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const resendCooldown = ref(0)
let cooldownTimer = null

const stepProgress = computed(() => {
  return `${((step.value - 1) / 2) * 100}%`
})

const maskedEmail = computed(() => {
  if (!email.value) return ''
  const [local, domain] = email.value.split('@')
  if (!domain) return email.value
  const visible = local.slice(0, 2)
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 2))}@${domain}`
})

const startCooldown = () => {
  resendCooldown.value = 60
  cooldownTimer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) clearInterval(cooldownTimer)
  }, 1000)
}

onUnmounted(() => { if (cooldownTimer) clearInterval(cooldownTimer) })

const requestOtp = async () => {
  if (!email.value) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await fetch(`${apiBase}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'เกิดข้อผิดพลาด')
    step.value = 2
    startCooldown()
  } catch (e) {
    errorMessage.value = e.message
  } finally {
    isLoading.value = false
  }
}

const checkOtp = async () => {
  if (otpCode.value.length !== 6) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await fetch(`${apiBase}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, otpCode: otpCode.value }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'รหัส OTP ไม่ถูกต้อง')
    step.value = 3
  } catch (e) {
    errorMessage.value = e.message
  } finally {
    isLoading.value = false
  }
}

const resetPwd = async () => {
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'รหัสผ่านไม่ตรงกัน'
    return
  }
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await fetch(`${apiBase}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        otpCode: otpCode.value,
        newPassword: newPassword.value,
        confirmNewPassword: confirmPassword.value,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'เกิดข้อผิดพลาด')
    step.value = 4
  } catch (e) {
    errorMessage.value = e.message
  } finally {
    isLoading.value = false
  }
}
</script>
