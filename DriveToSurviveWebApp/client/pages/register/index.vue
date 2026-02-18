<template>
  <div class="flex min-h-screen">
    <!-- Left panel -->
     
    
    <div class="hidden lg:flex lg:w-6/12 bg-[#236993] items-center justify-center p-12 relative">
      <div class="absolute inset-0 opacity-100 bg-no-repeat bg-cover " style="background-image: url('/images/bgregister.png'); background-position:center 100%;"></div>
    </div>

    <!-- Right form -->
    <div class="flex items-center justify-center flex-1 p-4 sm:p-6 lg:p-12 bg-surface">
      <main class="w-full max-w-lg">
        

        <h1 class="mb-2 text-2xl lg:text-6xl font-bold text-center font-heading text-[#137FEC]">สมัครสมาชิก</h1>
        <p class="mb-6 text-sm text-center text-slate-500">กรอกข้อมูลเพื่อสร้างบัญชี Ride</p>

        <!-- Stepper -->
        <div class="relative mb-8">
          <div class="absolute left-0 right-0 h-0.5 bg-slate-200 top-5"></div>
          <div class="absolute left-0 h-0.5 transition-all duration-500 bg-[#137FEC] top-5" :style="{ width: stepProgress }"></div>
          <div class="relative flex items-center justify-between">
            <div v-for="step in totalSteps" :key="step" class="z-10 flex flex-col items-center w-1/3">
              <div :class="getStepClass(step)">
                <span>{{ step }}</span>
              </div>
              <span :class="getLabelClass(step)">{{ getStepLabel(step) }}</span>
            </div>
          </div>
        </div>

        <!-- Registration Form -->
        <form @submit.prevent="handleRegister" novalidate>
          <!-- Step 1: Account Info -->
          <div v-if="currentStep === 1" class="space-y-4">
            <h2 class="mb-4 text-2xl font-semibold font-heading text-[#383838]">ข้อมูลบัญชีผู้ใช้</h2>
            <div>
              <label for="username" class="block mb-1.5 text-sm font-medium text-[#383838] ml-1">ชื่อผู้ใช้ <span class="text-red-500">*</span></label>
              <input type="text" id="username" v-model="formData.username" placeholder="example123"
                class="input-field" :class="{ 'border-red-400 focus:border-red-400 focus:shadow-red-100': errors.username }">
              <p v-if="errors.username" class="mt-1 text-xs text-red-600">{{ errors.username }}</p>
              <p v-else class="mt-1 text-xs text-slate-400 ml-6">ความยาว 4–20 ตัวอักษร ภาษาอังกฤษ ตัวเลข หรือขีดล่าง (_) เท่านั้น</p>
            </div>
            <div>
              <label for="email" class="block mb-1.5 text-sm font-medium text-[#383838] ml-1">อีเมล <span class="text-red-500">*</span></label>
              <input type="email" id="email" v-model="formData.email" placeholder="example@example.com"
                class="input-field" :class="{ 'border-red-400': errors.email }">
              <p v-if="errors.email" class="mt-1 text-xs text-red-600">{{ errors.email }}</p>
            </div>
            <div>
              <label for="password" class="block mb-1.5 text-sm font-medium text-[#383838] ml-1">รหัสผ่าน <span class="text-red-500">*</span></label>
              <input type="password" id="password" v-model="formData.password" placeholder="อย่างน้อย 8 ตัวอักษร"
                class="input-field" :class="{ 'border-red-400': errors.password }">
              <p v-if="errors.password" class="mt-1 text-xs text-red-600">{{ errors.password }}</p>
              <p v-else class="mt-1 text-xs text-slate-400 ml-6">ต้องประกอบด้วย A–Z, a–z และตัวเลข 0–9</p>
            </div>
            <div>
              <label for="confirmPassword" class="block mb-1.5 text-sm font-medium text-[#383838] ml-1">ยืนยันรหัสผ่าน <span class="text-red-500">*</span></label>
              <input type="password" id="confirmPassword" v-model="formData.confirmPassword" placeholder="กรอกรหัสผ่านอีกครั้ง"
                class="input-field" :class="{ 'border-red-400': errors.confirmPassword }">
              <p v-if="errors.confirmPassword" class="mt-1 text-xs text-red-600">{{ errors.confirmPassword }}</p>
            </div>
            <button type="button" @click="nextStep" class="w-full max-w-lg py-4 mx-auto text-lg font-semibold text-white transition-all duration-200 rounded-xl bg-[#137FEC] hover:bg-[#137FEC]/90 shadow-lg block">ถัดไป</button>
          </div>

          <!-- Step 2: Personal Info -->
          <div v-if="currentStep === 2" class="space-y-4">
            <h2 class="mb-4 text-2xl font-semibold font-heading text-[#383838]">ข้อมูลส่วนตัว</h2>
            <div>
              <label for="firstName" class="block mb-1.5 text-sm font-medium text-[#383838] ml-1">ชื่อจริง <span class="text-red-500">*</span></label>
              <input type="text" id="firstName" v-model="formData.firstName" placeholder="กรอกชื่อจริง"
                class="input-field" :class="{ 'border-red-400': errors.firstName }">
              <p v-if="errors.firstName" class="mt-1 text-xs text-red-600">{{ errors.firstName }}</p>
            </div>
            <div>
              <label for="lastName" class="block mb-1.5 text-sm font-medium text-[#383838] ml-1">นามสกุล <span class="text-red-500">*</span></label>
              <input type="text" id="lastName" v-model="formData.lastName" placeholder="กรอกนามสกุล"
                class="input-field" :class="{ 'border-red-400': errors.lastName }">
              <p v-if="errors.lastName" class="mt-1 text-xs text-red-600">{{ errors.lastName }}</p>
            </div>
            <div>
              <label for="phoneNumber" class="block mb-1.5 text-sm font-medium text-[#383838] ml-1">เบอร์โทรศัพท์ <span class="text-red-500">*</span></label>
              <input type="tel" id="phoneNumber" v-model="formData.phoneNumber" placeholder="เช่น 0891234567"
                class="input-field" :class="{ 'border-red-400': errors.phoneNumber }">
              <p v-if="errors.phoneNumber" class="mt-1 text-xs text-red-600">{{ errors.phoneNumber }}</p>
            </div>
            <div>
              <label class="block mb-2 text-sm font-medium text-[#383838] ml-1">เพศ <span class="text-red-500">*</span></label>
              <div class="flex gap-6">
                <label class="flex items-center cursor-pointer"><input type="radio" name="gender" value="male" v-model="formData.gender"
                    class="mr-2 text-cta focus:ring-cta"> ชาย</label>
                <label class="flex items-center cursor-pointer"><input type="radio" name="gender" value="female" v-model="formData.gender"
                    class="mr-2 text-cta focus:ring-cta"> หญิง</label>
              </div>
              <p v-if="errors.gender" class="mt-1 text-xs text-red-600">{{ errors.gender }}</p>
            </div>
            <div class="flex gap-3 pt-2">
              <button type="button" @click="prevStep" class="w-full py-3 btn-ghost border border-slate-200">ย้อนกลับ</button>
              <button type="button" @click="nextStep" class="w-full py-3 text-white transition-all duration-200 rounded-xl bg-[#137FEC] hover:bg-[#137FEC]/90 shadow-lg font-semibold">ถัดไป</button>
            </div>
          </div>

          <!-- Step 3: Verification -->
          <div v-if="currentStep === 3" class="space-y-4">
            <h2 class="mb-4 text-2xl font-semibold font-heading text-[#383838]">ยืนยันตัวตนด้วยบัตรประชาชน</h2>

            <!-- บัตรประชาชน ด้านหน้า -->
            <div>
              <label class="block mb-1.5 text-sm font-medium text-[#383838] ml-1">บัตรประชาชน (ด้านหน้า) <span class="text-red-500">*</span></label>
              <div v-if="!idCardPreview" @click="triggerFileUpload('idCardFile')"
                @dragover.prevent="dropping.idCard = true"
                @dragleave.prevent="dropping.idCard = false"
                @drop.prevent="handleDrop($event, 'idCard')"
                class="p-6 text-center transition-colors border-2 border-dashed rounded-lg cursor-pointer border-slate-300 hover:border-[#0C5EB1] hover:bg-[#0C5EB1]/5"
                :class="{ 'border-red-400': errors.idCardFile, 'border-[#0C5EB1] bg-[#0C5EB1]/10': dropping.idCard }">
                <svg class="w-10 h-10 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                <p class="mt-2 text-sm text-slate-500">กดเพื่อเลือกรูปภาพ (ด้านหน้า)</p>
              </div>
              <div v-else class="relative">
                <img :src="idCardPreview" alt="ID Card Front Preview" class="w-full mt-2 rounded-lg" />
                <button type="button" @click="removeImage('idCard')"
                  class="absolute flex items-center justify-center w-7 h-7 text-white bg-red-500 rounded-full cursor-pointer top-4 right-2 hover:bg-red-600">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <input type="file" id="idCardFile" @change="handleFileUpload($event, 'idCard')" accept=".jpg,.jpeg,.png" class="hidden">
              <p v-if="errors.idCardFile" class="mt-1 text-xs text-red-600">{{ errors.idCardFile }}</p>

              <!-- ปุ่มตรวจสอบ OCR ด้านหน้า -->
              <button v-if="formData.idCardFile && !ocrFrontResult" type="button" @click="scanIdCardFront"
                :disabled="isOcrLoading"
                class="w-full py-2 mt-2 text-sm font-medium text-white rounded-lg bg-[#0C5EB1] hover:bg-[#0C5EB1]/90 disabled:opacity-50">
                <span v-if="isOcrLoading" class="flex items-center justify-center">
                  <svg class="w-4 h-4 mr-2 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  กำลังตรวจสอบ...
                </span>
                <span v-else>กดเพื่อตรวจสอบบัตรประชาชน (ด้านหน้า)</span>
              </button>

              <!-- แสดงผล OCR ด้านหน้า -->
              <div v-if="ocrFrontResult" class="p-4 mt-3 border rounded-lg bg-green-50 border-green-200">
                <div class="flex items-center gap-2 mb-3">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-sm font-semibold text-green-700">ตรวจสอบด้านหน้าผ่าน (คะแนน: {{ (ocrFrontResult.detectionScore * 100).toFixed(1) }}%)</span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div><span class="text-slate-500">เลขบัตร:</span> <span class="font-medium">{{ ocrFrontResult.idNumber }}</span></div>
                  <div><span class="text-slate-500">ชื่อ:</span> <span class="font-medium">{{ ocrFrontResult.thName }}</span></div>
                  <div><span class="text-slate-500">วันเกิด:</span> <span class="font-medium">{{ ocrFrontResult.thDob }}</span></div>
                  <div><span class="text-slate-500">หมดอายุ:</span> <span class="font-medium">{{ ocrFrontResult.thExpiryDate }}</span></div>
                  <div class="col-span-2"><span class="text-slate-500">ที่อยู่:</span> <span class="font-medium">{{ ocrFrontResult.address }}</span></div>
                </div>
              </div>

              <!-- แสดง error ถ้า OCR ไม่ผ่าน -->
              <div v-if="ocrFrontError && !isBlacklisted" class="p-3 mt-3 border rounded-lg bg-red-50 border-red-200">
                <p class="text-sm text-red-600">{{ ocrFrontError }}</p>
                <button type="button" @click="resetOcrFront" class="mt-2 text-xs font-medium text-red-700 underline">ลองใหม่</button>
              </div>

              <!-- แสดง Blacklist Warning -->
              <div v-if="isBlacklisted" class="p-4 mt-3 border-2 rounded-lg bg-red-100 border-red-400">
                <div class="flex items-center gap-2 mb-2">
                  <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <span class="text-base font-bold text-red-700">ไม่สามารถสมัครสมาชิกได้</span>
                </div>
                <p class="text-sm text-red-700">{{ ocrFrontError }}</p>
                <p class="mt-2 text-xs text-red-600">หากคุณเชื่อว่าเกิดข้อผิดพลาด กรุณาติดต่อฝ่ายสนับสนุน</p>
                <button type="button" @click="resetOcrFront" class="mt-3 text-xs font-medium text-red-700 underline">ลองใหม่ด้วยบัตรอื่น</button>
              </div>
            </div>

            <!-- บัตรประชาชน ด้านหลัง -->
            <div :class="{ 'opacity-40 pointer-events-none': isBlacklisted }">
              <label class="block mb-1.5 text-sm font-medium text-[#383838] ml-1">บัตรประชาชน (ด้านหลัง) <span class="text-red-500">*</span></label>
              <div v-if="!idCardBackPreview" @click="triggerFileUpload('idCardBackFile')"
                @dragover.prevent="dropping.idCardBack = true"
                @dragleave.prevent="dropping.idCardBack = false"
                @drop.prevent="handleDrop($event, 'idCardBack')"
                class="p-6 text-center transition-colors border-2 border-dashed rounded-lg cursor-pointer border-slate-300 hover:border-[#0C5EB1] hover:bg-[#0C5EB1]/5"
                :class="{ 'border-red-400': errors.idCardBackFile, 'border-[#0C5EB1] bg-[#0C5EB1]/10': dropping.idCardBack }">
                <svg class="w-10 h-10 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                <p class="mt-2 text-sm text-slate-500">กดเพื่อเลือกรูปภาพ (ด้านหลัง)</p>
              </div>
              <div v-else class="relative">
                <img :src="idCardBackPreview" alt="ID Card Back Preview" class="w-full mt-2 rounded-lg" />
                <button type="button" @click="removeImage('idCardBack')"
                  class="absolute flex items-center justify-center w-7 h-7 text-white bg-red-500 rounded-full cursor-pointer top-4 right-2 hover:bg-red-600">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <input type="file" id="idCardBackFile" @change="handleFileUpload($event, 'idCardBack')" accept=".jpg,.jpeg,.png" class="hidden">
              <p v-if="errors.idCardBackFile" class="mt-1 text-xs text-red-600">{{ errors.idCardBackFile }}</p>

              <!-- ปุ่มตรวจสอบ OCR ด้านหลัง -->
              <button v-if="formData.idCardBackFile && !ocrBackResult" type="button" @click="scanIdCardBack"
                :disabled="isOcrBackLoading"
                class="w-full py-2 mt-2 text-sm font-medium text-white rounded-lg bg-[#0C5EB1] hover:bg-[#0C5EB1]/90 disabled:opacity-50">
                <span v-if="isOcrBackLoading" class="flex items-center justify-center">
                  <svg class="w-4 h-4 mr-2 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  กำลังตรวจสอบ...
                </span>
                <span v-else>กดเพื่อตรวจสอบบัตรประชาชน (ด้านหลัง)</span>
              </button>

              <!-- แสดงผล OCR ด้านหลัง -->
              <div v-if="ocrBackResult" class="p-4 mt-3 border rounded-lg bg-green-50 border-green-200">
                <div class="flex items-center gap-2 mb-2">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-sm font-semibold text-green-700">ตรวจสอบด้านหลังผ่าน</span>
                </div>
                <div class="text-sm"><span class="text-slate-500">หมายเลขเลเซอร์:</span> <span class="font-medium">{{ ocrBackResult.backNumber }}</span></div>
              </div>

              <div v-if="ocrBackError" class="p-3 mt-3 border rounded-lg bg-red-50 border-red-200">
                <p class="text-sm text-red-600">{{ ocrBackError }}</p>
                <button type="button" @click="resetOcrBack" class="mt-2 text-xs font-medium text-red-700 underline">ลองใหม่</button>
              </div>
            </div>

            <!-- สรุปผลการตรวจสอบ -->
            <div v-if="ocrFrontResult && ocrBackResult" class="p-4 border rounded-lg bg-blue-50 border-blue-200">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span class="text-sm font-semibold text-blue-700">การตรวจสอบบัตรประชาชนผ่านทั้งสองด้าน</span>
              </div>
              <p class="text-xs text-blue-600">ข้อมูลจากบัตรจะถูกใช้ในการสร้างบัญชีของคุณโดยอัตโนมัติ</p>
            </div>

            <div :class="{ 'opacity-40 pointer-events-none': isBlacklisted }">
              <label class="block mb-1.5 text-sm font-medium text-[#383838] ml-1">รูปถ่ายใบหน้าตรงคู่บัตรประชาชน<span class="text-red-500">*</span></label>
              <p class="mb-2 text-xs text-slate-400 ml-6">ระบบจะเปรียบเทียบรูปถ่ายใบหน้าของคุณคู่บัตรประชาชน เพื่อยืนยันตัวตน</p>
              <div v-if="!selfiePreview" @click="triggerFileUpload('selfieFile')"
                @dragover.prevent="dropping.selfie = true"
                @dragleave.prevent="dropping.selfie = false"
                @drop.prevent="handleDrop($event, 'selfie')"
                class="p-6 text-center transition-colors border-2 border-dashed rounded-lg cursor-pointer border-slate-300 hover:border-[#0C5EB1] hover:bg-[#0C5EB1]/5"
                :class="{ 'border-red-400': errors.selfieFile, 'border-[#0C5EB1] bg-[#0C5EB1]/10': dropping.selfie }">
                <svg class="w-10 h-10 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <p class="mt-2 text-sm text-slate-500">กดเพื่อเลือกรูปเซลฟี่</p>
              </div>
              <div v-else class="relative">
                <img :src="selfiePreview" alt="Selfie Preview" class="w-full mt-2 rounded-lg" />
                <button type="button" @click="removeImage('selfie')"
                  class="absolute flex items-center justify-center w-7 h-7 text-white bg-red-500 rounded-full cursor-pointer top-4 right-2 hover:bg-red-600">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <input type="file" id="selfieFile" @change="handleFileUpload($event, 'selfie')" accept=".jpg,.jpeg,.png" class="hidden">
              <p v-if="errors.selfieFile" class="mt-1 text-xs text-red-600">{{ errors.selfieFile }}</p>

              <!-- ปุ่มยืนยันตัวตนด้วยใบหน้า + บัตร ปชช. -->
              <button v-if="formData.selfieFile && formData.idCardFile && !faceIdResult" type="button" @click="verifyFaceAndIdCard"
                :disabled="isFaceIdLoading"
                class="w-full py-2 mt-2 text-sm font-medium text-white rounded-lg bg-[#0C5EB1] hover:bg-[#0C5EB1]/90 disabled:opacity-50">
                <span v-if="isFaceIdLoading" class="flex items-center justify-center">
                  <svg class="w-4 h-4 mr-2 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  กำลังยืนยันตัวตน...
                </span>
                <span v-else>🤳 ยืนยันตัวตนด้วยใบหน้าและบัตรประชาชน</span>
              </button>

              <!-- แสดงผลยืนยันตัวตนสำเร็จ -->
              <div v-if="faceIdResult" class="p-4 mt-3 border rounded-lg bg-green-50 border-green-200">
                <div class="flex items-center gap-2 mb-2">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-sm font-semibold text-green-700">ยืนยันตัวตนสำเร็จ — เป็นบุคคลเดียวกัน!</span>
                </div>
                <div class="text-sm text-green-600">
                  <span>ความมั่นใจ: {{ faceIdResult.confidence?.toFixed(1) }}%</span>
                </div>
              </div>

              <!-- แสดง error ยืนยันตัวตนไม่ผ่าน -->
              <div v-if="faceIdError" class="p-3 mt-3 border rounded-lg bg-red-50 border-red-200">
                <p class="text-sm text-red-600">{{ faceIdError }}</p>
                <button type="button" @click="resetFaceId" class="mt-2 text-xs font-medium text-red-700 underline">ลองใหม่</button>
              </div>
            </div>

            <!-- Warning box -->
            <div class="flex gap-3 p-4 border rounded-lg bg-red-50 border-red-100">
              <svg class="w-5 h-5 mt-0.5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p class="mb-1 text-sm font-semibold text-red-700">ข้อควรหลีกเลี่ยง:</p>
                <ul class="space-y-0.5 text-sm text-red-600">
                  <li>• ใบหน้าไม่ชัดหรือถูกบัง</li>
                  <li>• บัตรไม่ชัดหรือไม่เต็ม</li>
                  <li>• แสงน้อยเกินไป</li>
                  <li>• ระยะไกลเกินไป</li>
                </ul>
              </div>
            </div>

            <!-- PDPA consent -->
            <div>
              <label class="flex items-start cursor-pointer">
                <input type="checkbox" v-model="formData.pdpa"
                  class="w-4 h-4 mt-1 mr-3 border-slate-300 rounded text-cta focus:ring-cta">
                <span class="text-sm text-slate-600">ข้าพเจ้ายินยอมรับ
                  <NuxtLink to="/terms-of-service" target="_blank" rel="noopener noreferrer"
                    class="font-medium text-[#137FEC] hover:text-cta-hover">ข้อตกลงและเงื่อนไขฯ</NuxtLink> และได้อ่าน
                  <NuxtLink to="/privacy" target="_blank" rel="noopener noreferrer"
                    class="font-medium text-[#137FEC] hover:text-cta-hover">นโยบายความเป็นส่วนตัว</NuxtLink> แล้ว
                </span>
              </label>
              <p v-if="errors.pdpa" class="mt-1 text-xs text-red-600">{{ errors.pdpa }}</p>
            </div>

            <div class="flex gap-3 pt-2">
              <button type="button" @click="prevStep" class="w-full py-3 btn-ghost border border-slate-200">ย้อนกลับ</button>
              <button type="submit" :disabled="isLoading || isBlacklisted"
                class="flex items-center justify-center w-full py-3 text-white transition-all duration-200 rounded-xl bg-[#137FEC] hover:bg-[#137FEC]/90 shadow-lg font-semibold disabled:opacity-50">
                <svg v-if="isLoading" class="w-5 h-5 mr-2 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {{ isLoading ? 'กำลังบันทึก...' : 'สมัครสมาชิก' }}
              </button>
            </div>
          </div>
        </form>

        <p class="mt-8 text-sm text-center text-slate-500">
          มีบัญชีแล้ว?
          <NuxtLink to="/login" class="font-medium cursor-pointer text-[#137FEC] hover:underline">เข้าสู่ระบบ</NuxtLink>
        </p>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { useToast } from '~/composables/useToast';
import { useRouter } from '#app';

const { register } = useAuth();
const { toast } = useToast();
const router = useRouter();

const currentStep = ref(1);
const totalSteps = 3;

const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  gender: '',
  idCardFile: null,
  idCardBackFile: null,
  idNumber: '',
  expiryDate: '',
  selfieFile: null,
  pdpa: false,
});

const errors = reactive({});
const idCardPreview = ref(null);
const idCardBackPreview = ref(null);
const selfiePreview = ref(null);
const isLoading = ref(false);

// OCR states
const isOcrLoading = ref(false);
const isOcrBackLoading = ref(false);
const ocrFrontResult = ref(null);
const ocrFrontError = ref(null);
const ocrBackResult = ref(null);
const ocrBackError = ref(null);
const isBlacklisted = ref(false); // ถูก Blacklist → บล็อกการสมัครทั้งหมด

const dropping = reactive({
  idCard: false,
  idCardBack: false,
  selfie: false
});

// Face + ID Card Verification states
const isFaceIdLoading = ref(false);
const faceIdResult = ref(null);
const faceIdError = ref(null);

const apiBase = useRuntimeConfig().public.apiBase || 'http://localhost:3000/api';

const stepProgress = computed(() => {
  if (totalSteps <= 1) return '0%';
  return `${((currentStep.value - 1) / (totalSteps - 1)) * 100}%`;
});

const getStepLabel = (step) => {
  return ['บัญชีผู้ใช้', 'ข้อมูลส่วนตัว', 'ยืนยันตัวตน'][step - 1];
};

const getStepClass = (step) => {
  let base = 'flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all duration-500 text-sm';
  if (step < currentStep.value) return `${base} bg-[#137FEC] text-white`;
  if (step === currentStep.value) return `${base} bg-[#137FEC] text-white ring-4 ring-[#137FEC]/20`;
  return `${base} bg-slate-200 text-slate-400`;
};

const getLabelClass = (step) => {
  let base = 'text-xs text-center mt-2 transition-all duration-500';
  if (step <= currentStep.value) return `${base} font-semibold text-[#137FEC]`;
  return `${base} text-slate-400`;
};

const clearErrors = () => {
  Object.keys(errors).forEach(key => delete errors[key]);
};

// ── OCR Functions ──
const scanIdCardFront = async () => {
  if (!formData.idCardFile) return;
  isOcrLoading.value = true;
  ocrFrontError.value = null;
  ocrFrontResult.value = null;
  isBlacklisted.value = false;

  try {
    const fd = new FormData();
    fd.append('image', formData.idCardFile);
    const res = await fetch(`${apiBase}/ocr/id-card/front`, { method: 'POST', body: fd });
    const body = await res.json();

    // ── ตรวจจับ Blacklist (403) ──
    if (res.status === 403) {
      isBlacklisted.value = true;
      const msg = body?.message || 'หมายเลขบัตรประชาชนนี้ถูกขึ้นบัญชีดำ ไม่สามารถสมัครสมาชิกได้';
      ocrFrontError.value = msg;
      toast.error('ไม่สามารถสมัครสมาชิกได้', msg);
      return;
    }

    if (!res.ok) throw new Error(body?.message || 'OCR ล้มเหลว');

    ocrFrontResult.value = body.data;

    // Auto-fill ข้อมูลจาก OCR
    if (body.data.idNumber) formData.idNumber = body.data.idNumber;
    if (body.data.enExpiryDate) {
      try {
        const d = new Date(body.data.enExpiryDate);
        if (!isNaN(d.getTime())) {
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          formData.expiryDate = `${dd}/${mm}/${yyyy}`;
        }
      } catch { }
    }

    toast.success('ตรวจสอบสำเร็จ', 'อ่านข้อมูลบัตรประชาชน (ด้านหน้า) สำเร็จ');
  } catch (err) {
    const msg = err.name === 'TypeError' && err.message === 'Failed to fetch'
      ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่'
      : (err.message || 'ไม่สามารถอ่านข้อมูลจากบัตร กรุณาถ่ายรูปใหม่');
    ocrFrontError.value = msg;
    toast.error('ตรวจสอบไม่ผ่าน', msg);
  } finally {
    isOcrLoading.value = false;
  }
};

const scanIdCardBack = async () => {
  if (!formData.idCardBackFile) return;
  isOcrBackLoading.value = true;
  ocrBackError.value = null;
  ocrBackResult.value = null;

  try {
    const fd = new FormData();
    fd.append('image', formData.idCardBackFile);
    const res = await fetch(`${apiBase}/ocr/id-card/back`, { method: 'POST', body: fd });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.message || 'OCR ล้มเหลว');

    ocrBackResult.value = body.data;
    toast.success('ตรวจสอบสำเร็จ', 'อ่านข้อมูลบัตรประชาชน (ด้านหลัง) สำเร็จ');
  } catch (err) {
    const msg = err.name === 'TypeError' && err.message === 'Failed to fetch'
      ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่'
      : (err.message || 'ไม่สามารถอ่านข้อมูลจากบัตร กรุณาถ่ายรูปใหม่');
    ocrBackError.value = msg;
    toast.error('ตรวจสอบไม่ผ่าน', msg);
  } finally {
    isOcrBackLoading.value = false;
  }
};

const resetOcrFront = () => {
  ocrFrontResult.value = null;
  ocrFrontError.value = null;
  isBlacklisted.value = false;
  idCardPreview.value = null;
  formData.idCardFile = null;
  formData.idNumber = '';
  formData.expiryDate = '';
};

const resetOcrBack = () => {
  ocrBackResult.value = null;
  ocrBackError.value = null;
  idCardBackPreview.value = null;
  formData.idCardBackFile = null;
};

// ── Face + ID Card Verification ──
const verifyFaceAndIdCard = async () => {
  if (!formData.idCardFile || !formData.selfieFile) return;
  isFaceIdLoading.value = true;
  faceIdError.value = null;
  faceIdResult.value = null;

  try {
    const fd = new FormData();
    fd.append('idCardImage', formData.idCardFile);
    fd.append('selfieImage', formData.selfieFile);
    const res = await fetch(`${apiBase}/ocr/face-id-verification`, { method: 'POST', body: fd });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.message || 'ยืนยันตัวตนไม่สำเร็จ');

    const data = body.data;
    if (!data.isSamePerson) {
      faceIdError.value = `ใบหน้าในเซลฟี่ไม่ตรงกับบัตรประชาชน (ความมั่นใจ: ${data.confidence?.toFixed(1)}%) กรุณาลองใหม่: ถ่ายในที่สว่าง หันหน้าตรง ไม่สวมแว่นหรือหมวก และถือบัตรให้ชิดใบหน้า`;
      toast.error('ยืนยันตัวตนไม่ผ่าน', faceIdError.value);
      return;
    }

    faceIdResult.value = data;
    toast.success('ยืนยันตัวตนสำเร็จ', 'ระบบยืนยันว่าเป็นบุคคลเดียวกัน');
  } catch (err) {
    const msg = err.name === 'TypeError' && err.message === 'Failed to fetch'
      ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่'
      : (err.message || 'ไม่สามารถยืนยันตัวตนได้ กรุณาลองใหม่');
    faceIdError.value = msg;
    toast.error('ยืนยันตัวตนไม่ผ่าน', msg);
  } finally {
    isFaceIdLoading.value = false;
  }
};

const resetFaceId = () => {
  faceIdResult.value = null;
  faceIdError.value = null;
  selfiePreview.value = null;
  formData.selfieFile = null;
};

const validationFunctions = [
  () => {
    clearErrors();
    if (!formData.username || formData.username.length < 4) errors.username = 'ชื่อผู้ใช้ต้องมีอย่างน้อย 4 ตัวอักษร';
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    if (!formData.password || formData.password.length < 8) errors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
    else if (!/[A-Z]/.test(formData.password)) errors.password = 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่ (A–Z) อย่างน้อย 1 ตัว';
    else if (!/[a-z]/.test(formData.password)) errors.password = 'รหัสผ่านต้องมีตัวพิมพ์เล็ก (a–z) อย่างน้อย 1 ตัว';
    else if (!/[0-9]/.test(formData.password)) errors.password = 'รหัสผ่านต้องมีตัวเลข (0–9) อย่างน้อย 1 ตัว';
    if (formData.password !== formData.confirmPassword || !formData.confirmPassword) errors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    return Object.keys(errors).length === 0;
  },
  () => {
    clearErrors();
    if (!formData.firstName.trim()) errors.firstName = 'กรุณากรอกชื่อจริง';
    if (!formData.lastName.trim()) errors.lastName = 'กรุณากรอกนามสกุล';
    if (!/^\d{9,10}$/.test(formData.phoneNumber)) errors.phoneNumber = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง';
    if (!formData.gender) errors.gender = 'กรุณาเลือกเพศ';
    return Object.keys(errors).length === 0;
  },
  () => {
    clearErrors();
    if (!formData.idCardFile) errors.idCardFile = 'กรุณาอัปโหลดรูปบัตรประชาชน (ด้านหน้า)';
    if (!ocrFrontResult.value) errors.idCardFile = 'กรุณากดตรวจสอบบัตรประชาชน (ด้านหน้า)';
    if (!formData.idCardBackFile) errors.idCardBackFile = 'กรุณาอัปโหลดรูปบัตรประชาชน (ด้านหลัง)';
    if (!ocrBackResult.value) errors.idCardBackFile = 'กรุณากดตรวจสอบบัตรประชาชน (ด้านหลัง)';
    if (!formData.selfieFile) errors.selfieFile = 'กรุณาอัปโหลดรูปเซลฟี่';
    if (!faceIdResult.value) errors.selfieFile = 'กรุณากดยืนยันตัวตนด้วยใบหน้าและบัตรประชาชน';
    if (!formData.pdpa) errors.pdpa = 'กรุณายอมรับข้อตกลงและเงื่อนไข';
    return Object.keys(errors).length === 0;
  }
];

const nextStep = () => {
  if (validationFunctions[currentStep.value - 1]()) {
    if (currentStep.value < totalSteps) currentStep.value++;
  }
};

const testClick = () => {
  alert('Button clicked! Current step: ' + currentStep.value);
  console.log('=== BUTTON CLICKED ===');
  console.log('currentStep:', currentStep.value);
  console.log('formData:', JSON.stringify(formData, null, 2));
  
  // ทดสอบเปลี่ยน step โดยตรง
  currentStep.value = 2;
  console.log('Changed to step:', currentStep.value);
};

const prevStep = () => {
  if (currentStep.value > 1) { currentStep.value--; clearErrors(); }
};

async function postForm(url, formData, token = '') {
  const res = await fetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
    credentials: 'include',
  });
  let body;
  try { body = await res.json(); }
  catch {
    const text = await res.text();
    const err = new Error(text || 'Unexpected response from server');
    err.status = res.status; throw err;
  }
  if (!res.ok) {
    const msg = body?.message || `Request failed with status ${res.status}`;
    const err = new Error(msg);
    err.status = res.status; err.payload = body; throw err;
  }
  return body;
}

function isValidDDMMYYYY(ddmmyyyy) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(ddmmyyyy)) return false;
  const [dd, mm, yyyy] = ddmmyyyy.split('/').map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
}

function toISODateFromDDMMYYYY(ddmmyyyy) {
  if (!isValidDDMMYYYY(ddmmyyyy)) return '';
  const [dd, mm, yyyy] = ddmmyyyy.split('/');
  const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}

const handleRegister = async () => {
  if (isBlacklisted.value) {
    toast.error('ไม่สามารถสมัครสมาชิกได้', 'หมายเลขบัตรประชาชนนี้ถูกขึ้นบัญชีดำ');
    return;
  }
  if (!validationFunctions[currentStep.value - 1]()) return;
  isLoading.value = true;
  await nextTick();

  // ดึงวันหมดอายุจาก OCR ถ้ามี
  let isoDate = '';
  if (formData.expiryDate && isValidDDMMYYYY(formData.expiryDate)) {
    isoDate = toISODateFromDDMMYYYY(formData.expiryDate);
  } else if (ocrFrontResult.value?.enExpiryDate) {
    const d = new Date(ocrFrontResult.value.enExpiryDate);
    if (!isNaN(d.getTime())) isoDate = d.toISOString();
  }

  if (!isoDate) {
    isoDate = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString(); // default 5 years
  }

  // ใช้ข้อมูลจาก OCR ถ้ามี
  const idNumber = formData.idNumber || ocrFrontResult.value?.idNumber || '';

  const fd = new FormData();
  fd.append('email', formData.email);
  fd.append('username', formData.username);
  fd.append('password', formData.password);
  fd.append('firstName', formData.firstName);
  fd.append('lastName', formData.lastName);
  fd.append('phoneNumber', formData.phoneNumber);
  fd.append('gender', String(formData.gender || '').toUpperCase());
  fd.append('nationalIdNumber', idNumber);
  fd.append('nationalIdExpiryDate', isoDate);
  fd.append('nationalIdPhotoUrl', formData.idCardFile);
  fd.append('selfiePhotoUrl', formData.selfieFile);
  fd.append('role', 'PASSENGER');

  // ส่งรูปด้านหลังด้วย (ถ้ามี)
  if (formData.idCardBackFile) {
    fd.append('nationalIdBackPhotoUrl', formData.idCardBackFile);
  }

  // ส่งข้อมูล OCR (ถ้ามี)
  if (ocrBackResult.value?.backNumber) {
    fd.append('nationalIdBackNumber', ocrBackResult.value.backNumber);
  }
  if (ocrFrontResult.value || ocrBackResult.value) {
    fd.append('nationalIdOcrData', JSON.stringify({
      front: ocrFrontResult.value || null,
      back: ocrBackResult.value || null,
    }));
    fd.append('verifiedByOcr', 'true');
  }

  // ส่งข้อมูลยืนยันตัวตนด้วยใบหน้า+บัตร (ถ้ามี)
  if (faceIdResult.value) {
    fd.append('faceIdVerification', JSON.stringify(faceIdResult.value));
    fd.append('faceIdVerified', 'true');
  }

  try {
    await postForm(`${apiBase}/users`, fd);
    router.push('/register/success');
  } catch (err) {
    console.error('Registration failed:', err);
    const status = err?.status;
    const msg = err?.message || 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
    if (status === 409) toast.error('ข้อมูลซ้ำ', msg);
    else toast.error('เกิดข้อผิดพลาด', msg);
  } finally {
    isLoading.value = false;
  }
};

const triggerFileUpload = (inputId) => { document.getElementById(inputId)?.click(); };

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const validateImageFile = (file) => {
    if (!file) return 'กรุณาเลือกไฟล์';
    const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
    if (!ALLOWED_FILE_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
        return 'รองรับเฉพาะไฟล์ JPEG, JPG, PNG เท่านั้น';
    }
    if (file.size > MAX_FILE_SIZE) {
        return 'ขนาดไฟล์ต้องไม่เกิน 5MB';
    }
    return null;
};

const processFile = (file, type) => {
  const error = validateImageFile(file);
  if (error) {
    toast.error('ไฟล์ไม่ถูกต้อง', error);
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target?.result;
    if (type === 'idCard') {
      idCardPreview.value = result; formData.idCardFile = file;
      if (errors.idCardFile) delete errors.idCardFile;
      // reset OCR result เมื่อเปลี่ยนรูป
      ocrFrontResult.value = null; ocrFrontError.value = null;
      isBlacklisted.value = false;
      // reset face+ID verification เมื่อเปลี่ยนบัตร
      faceIdResult.value = null; faceIdError.value = null;
    } else if (type === 'idCardBack') {
      idCardBackPreview.value = result; formData.idCardBackFile = file;
      if (errors.idCardBackFile) delete errors.idCardBackFile;
      ocrBackResult.value = null; ocrBackError.value = null;
    } else if (type === 'selfie') {
      selfiePreview.value = result; formData.selfieFile = file;
      if (errors.selfieFile) delete errors.selfieFile;
      // reset face+ID verification เมื่อเปลี่ยนเซลฟี่
      faceIdResult.value = null; faceIdError.value = null;
    }
  };
  reader.readAsDataURL(file);
};

const handleFileUpload = (event, type) => {
  const file = event.target.files?.[0];
  if (!file) return;
  processFile(file, type);
  event.target.value = '';
};

const handleDrop = (event, type) => {
  dropping[type] = false;
  const file = event.dataTransfer.files?.[0];
  if (!file) return;
  processFile(file, type);
};

const removeImage = (type) => {
  if (type === 'idCard') { idCardPreview.value = null; formData.idCardFile = null; ocrFrontResult.value = null; ocrFrontError.value = null; isBlacklisted.value = false; faceIdResult.value = null; faceIdError.value = null; }
  else if (type === 'idCardBack') { idCardBackPreview.value = null; formData.idCardBackFile = null; ocrBackResult.value = null; ocrBackError.value = null; }
  else if (type === 'selfie') { selfiePreview.value = null; formData.selfieFile = null; faceIdResult.value = null; faceIdError.value = null; }
};

const formatExpiryDate = () => {
  let value = formData.expiryDate;
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) formData.expiryDate = digits;
  else if (digits.length <= 4) formData.expiryDate = `${digits.slice(0, 2)}/${digits.slice(2)}`;
  else formData.expiryDate = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
};
</script>
