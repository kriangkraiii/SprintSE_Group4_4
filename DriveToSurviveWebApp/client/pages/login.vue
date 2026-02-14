<template>
  <div class="flex min-h-[85vh]">
    <!-- Left panel -->
    <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-slate-900 to-primary items-center justify-center p-12">
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
            <input type="text" id="identifier" v-model="identifier" required placeholder="กรอกชื่อผู้ใช้หรืออีเมล"
              class="input-field" />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label for="password" class="text-sm font-medium text-primary">
                รหัสผ่าน <span class="text-red-500">*</span>
              </label>
              <NuxtLink to="/forgot-password" class="text-xs cursor-pointer text-cta hover:text-cta-hover">ลืมรหัสผ่าน?</NuxtLink>
            </div>
            <input type="password" id="password" v-model="password" required minlength="6" placeholder="กรอกรหัสผ่าน"
              class="input-field" />
          </div>

          <button type="submit"
            class="w-full py-3 btn-primary">
            เข้าสู่ระบบ
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
const router = useRouter()
const { login } = useAuth()

const submit = async () => {
  errorMessage.value = ''
  try {
    await login(identifier.value, password.value)
    router.push('/')
  } catch (e) {
    console.error(e)
    errorMessage.value = e?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ'
  }
}
</script>