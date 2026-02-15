<template>
  <div class="flex min-h-[85vh]">
    <!-- Left panel -->
    <div class="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
      <div class="max-w-md text-center">
        <div class="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-2xl bg-cta/20">
          <svg class="w-8 h-8 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 class="mb-4 text-3xl font-bold text-white font-heading">ยินดีต้อนรับกลับ</h2>
        <p class="text-slate-300">เข้าสู่ระบบเพื่อใช้งาน Drive To Survive — แพลตฟอร์มเดินทางร่วมกันอย่างปลอดภัย</p>
        <div class="flex justify-center gap-4 mt-8">
          <div class="flex items-center gap-2 text-sm text-slate-400">
            <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ปลอดภัย
          </div>
          <div class="flex items-center gap-2 text-sm text-slate-400">
            <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            PDPA Compliant
          </div>
        </div>
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

        <h1 class="mb-2 text-2xl font-bold font-heading text-primary">เข้าสู่ระบบ</h1>
        <p class="mb-8 text-sm text-slate-500">กรอกข้อมูลเพื่อเข้าสู่บัญชีของคุณ</p>

        <form @submit.prevent="submit" id="loginForm" class="space-y-5">
          <div>
            <label for="identifier" class="block mb-1.5 text-sm font-medium text-primary">
              ชื่อผู้ใช้ หรือ อีเมล <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input type="text" id="identifier" v-model="identifier" required placeholder="กรอกชื่อผู้ใช้หรืออีเมล"
                class="input-field pl-10" />
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label for="password" class="text-sm font-medium text-primary">
                รหัสผ่าน <span class="text-red-500">*</span>
              </label>
              <NuxtLink to="/forgot-password" class="text-xs cursor-pointer text-cta hover:text-cta-hover">ลืมรหัสผ่าน?</NuxtLink>
            </div>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input :type="showPassword ? 'text' : 'password'" id="password" v-model="password" required minlength="6" placeholder="กรอกรหัสผ่าน"
                class="input-field pl-10 pr-10" />
              <button type="button" @click="showPassword = !showPassword" class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600">
                <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" :disabled="isLoading"
            class="inline-flex items-center justify-center gap-2 w-full py-3 btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            <svg v-if="!isLoading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}
          </button>

          <div v-if="errorMessage" class="flex items-center gap-2 p-3 text-sm text-red-700 border rounded-lg bg-red-50 border-red-200">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {{ errorMessage }}
          </div>
        </form>

        <p class="mt-8 text-sm text-center text-slate-500">
          ยังไม่มีบัญชี?
          <NuxtLink to="/register" class="font-medium cursor-pointer text-cta hover:text-cta-hover">สมัครสมาชิก</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'

const identifier = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)
const showPassword = ref(false)
const router = useRouter()
const { login } = useAuth()

const submit = async () => {
  errorMessage.value = ''
  isLoading.value = true
  try {
    await login(identifier.value, password.value)
    router.push('/')
  } catch (e) {
    console.error(e)
    errorMessage.value = e?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ'
  } finally {
    isLoading.value = false
  }
}
</script>