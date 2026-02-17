<template>
    <div>
        <div class="flex items-center justify-center min-h-screen py-8">
            <div class="flex w-full max-w-6xl mx-4 overflow-hidden border card border-slate-200">

                <ProfileSidebar />

                <main class="flex-1 p-8">
                    <div>
                        <div class="mb-8 text-center">
                            <div class="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-cta/10">
                                <svg class="w-8 h-8 text-cta" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                                    </path>
                                </svg>
                            </div>
                            <h1 class="mb-2 text-3xl font-bold font-heading text-primary">โปรไฟล์ของฉัน</h1>
                            <p class="max-w-md mx-auto text-slate-500">
                                จัดการข้อมูลส่วนตัวของคุณให้เป็นปัจจุบันอยู่เสมอ
                            </p>
                        </div>

                        <form @submit.prevent="handleProfileUpdate" class="space-y-6" novalidate>
                            <div class="text-center">
                                <img :src="previewUrl" alt="Profile Preview"
                                    class="object-cover mx-auto mb-3 border-4 border-white rounded-full shadow-md w-36 h-36" />
                                <input type="file" accept=".jpg,.jpeg,.png" @change="handleFileChange" ref="fileInput"
                                    class="hidden" />
                                <button type="button" @click="fileInput.click()"
                                    class="text-sm font-medium cursor-pointer text-cta hover:text-cta-hover">เปลี่ยนรูปภาพ</button>
                            </div>

                            <div>
                                <label for="username"
                                    class="block mb-1.5 text-sm font-medium text-primary">ชื่อผู้ใช้</label>
                                <input id="username" :value="originalUserData?.username" type="text" disabled
                                    class="input-field disabled:bg-slate-50 disabled:text-slate-400" />
                            </div>

                            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <label for="firstName"
                                        class="block mb-1.5 text-sm font-medium text-primary">ชื่อจริง</label>
                                    <input id="firstName" v-model="form.firstName" type="text"
                                        placeholder="กรอกชื่อจริง" @focus="showNameWarning = true"
                                        @blur="showNameWarning = false"
                                        class="input-field" />
                                </div>
                                <div>
                                    <label for="lastName"
                                        class="block mb-1.5 text-sm font-medium text-primary">นามสกุล</label>
                                    <input id="lastName" v-model="form.lastName" type="text" placeholder="กรอกนามสกุล"
                                        @focus="showNameWarning = true" @blur="showNameWarning = false"
                                        class="input-field" />
                                </div>
                            </div>

                            <div v-if="showNameWarning" class="-mt-2 text-center">
                                <p class="text-sm text-red-600">
                                    หากมีการเปลี่ยนแปลงชื่อ-นามสกุล กรุณาตรวจสอบให้แน่ใจว่าตรงกับบัตรประชาชน
                                    <br>และอาจจำเป็นต้องยืนยันตัวตนสำหรับผู้ขับขี่ใหม่อีกครั้ง
                                </p>
                            </div>

                            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <label for="email"
                                        class="block mb-1.5 text-sm font-medium text-primary">อีเมล</label>
                                    <input id="email" v-model="form.email" type="email"
                                        placeholder="example@example.com"
                                        class="input-field" />
                                </div>
                                <div>
                                    <label for="phoneNumber"
                                        class="block mb-1.5 text-sm font-medium text-primary">เบอร์โทรศัพท์</label>
                                    <input id="phoneNumber" v-model="form.phoneNumber" type="text"
                                        placeholder="กรอกเบอร์โทรศัพท์"
                                        class="input-field" />
                                </div>
                            </div>

                            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <label class="block mb-1.5 text-sm font-medium text-primary">วันที่สร้างบัญชี</label>
                                    <input type="text" :value="formatDate(originalUserData?.createdAt)" disabled
                                        class="input-field disabled:bg-slate-50 disabled:text-slate-400" />
                                </div>
                                <div>
                                    <label
                                        class="block mb-1.5 text-sm font-medium text-primary">วันที่แก้ไขล่าสุด</label>
                                    <input type="text" :value="formatDate(originalUserData?.updatedAt)" disabled
                                        class="input-field disabled:bg-slate-50 disabled:text-slate-400" />
                                </div>
                            </div>

                            <div class="pt-6 border-t border-slate-200">
                                <h3 class="mb-4 text-lg font-semibold font-heading text-primary">เปลี่ยนรหัสผ่าน</h3>
                                <div>
                                    <label for="currentPassword"
                                        class="block mb-1.5 text-sm font-medium text-primary">รหัสผ่านเดิม</label>
                                    <input type="password" id="currentPassword" placeholder="กรอกรหัสผ่านเดิม"
                                        v-model="form.currentPassword"
                                        class="input-field" />
                                </div>

                                <div class="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2">
                                    <div>
                                        <label for="newPassword"
                                            class="block mb-1.5 text-sm font-medium text-primary">รหัสผ่านใหม่</label>
                                        <input type="password" id="newPassword" minlength="6" v-model="form.newPassword"
                                            placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                                            class="input-field" />
                                    </div>
                                    <div>
                                        <label for="confirmNewPassword"
                                            class="block mb-1.5 text-sm font-medium text-primary">ยืนยันรหัสผ่านใหม่</label>
                                        <input type="password" id="confirmNewPassword" minlength="6"
                                            v-model="form.confirmNewPassword" placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                                            class="input-field" />
                                    </div>
                                </div>
                            </div>

                            <div class="flex justify-end gap-4 pt-6">
                                <button type="button" @click="resetForm" :disabled="isLoading"
                                    class="px-6 py-3 btn-ghost border border-slate-200 disabled:opacity-50">
                                    ยกเลิก
                                </button>
                                <button type="submit" :disabled="isLoading"
                                    class="flex items-center px-6 py-3 btn-primary disabled:opacity-50">
                                    <svg v-if="isLoading" class="w-5 h-5 mr-3 -ml-1 text-white animate-spin"
                                        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                            stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                        </path>
                                    </svg>
                                    {{ isLoading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง' }}
                                </button>
                            </div>
                        </form>

                        <!-- Delete Account Section — PDPA ม.33 (Right to Erasure) -->
                        <div class="pt-6 mt-8 border-t border-red-200">
                            <div class="p-4 border border-red-200 rounded-lg bg-red-50">
                                <div class="flex items-start gap-3">
                                    <div class="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg">
                                        <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                        </svg>
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="text-lg font-semibold text-red-700">ลบบัญชีผู้ใช้</h3>
                                        <p class="mt-1 text-sm text-red-600">
                                            เมื่อลบบัญชี ข้อมูลส่วนบุคคลของคุณ (ชื่อ, อีเมล, เบอร์โทร) จะถูกลบออกถาวร
                                            แต่ข้อมูลจราจรคอมพิวเตอร์ (Logs) จะยังถูกเก็บรักษาตามกฎหมายอีก 90 วัน (พ.ร.บ.คอมพิวเตอร์ ม.26)
                                        </p>
                                        <button @click="showDeleteAccountModal = true" type="button"
                                            class="inline-flex items-center gap-2 px-4 py-2 mt-3 text-sm font-medium text-white bg-red-600 rounded-md cursor-pointer hover:bg-red-700">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                            ลบบัญชีของฉัน
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>

        <!-- Delete Account Confirm Modal -->
        <div v-if="showDeleteAccountModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            @click.self="showDeleteAccountModal = false">
            <div class="w-full max-w-md p-6 mx-4 bg-white rounded-xl shadow-xl">
                <div class="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                    <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>
                <h2 class="mb-2 text-lg font-semibold text-center text-primary">ยืนยันการลบบัญชี</h2>
                <p class="mb-4 text-sm text-center text-slate-500">
                    การลบบัญชีจะ<strong>ไม่สามารถย้อนกลับ</strong>ได้ ข้อมูลส่วนบุคคลของคุณจะถูกลบออก
                    พิมพ์ <code class="px-1 py-0.5 bg-slate-100 rounded text-red-600 font-semibold">DELETE</code> เพื่อยืนยัน
                </p>
                <input v-model="deleteConfirmText" type="text" placeholder="พิมพ์ DELETE เพื่อยืนยัน"
                    class="w-full px-3 py-2 mb-4 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400" />
                <div class="flex justify-end gap-3">
                    <button @click="showDeleteAccountModal = false; deleteConfirmText = ''"
                        class="px-4 py-2 border border-slate-200 rounded-md hover:bg-slate-50">
                        ยกเลิก
                    </button>
                    <button @click="handleDeleteAccount" :disabled="deleteConfirmText !== 'DELETE' || isDeletingAccount"
                        class="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-40">
                        {{ isDeletingAccount ? 'กำลังลบ...' : 'ลบบัญชีถาวร' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useAuth } from '~/composables/useAuth';
import { useToast } from '~/composables/useToast';
import ProfileSidebar from '~/components/ProfileSidebar.vue';
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

definePageMeta({
    middleware: 'auth'
});

const { $api } = useNuxtApp()
const { user: userCookie } = useAuth()
const { toast } = useToast();

const fileInput = ref(null)
const previewUrl = ref('')
const isLoading = ref(false)
const showNameWarning = ref(false);
const showDeleteAccountModal = ref(false)
const deleteConfirmText = ref('')
const isDeletingAccount = ref(false)

const form = reactive({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    profilePictureFile: null,
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
});

let originalUserData = null;

const fetchUserData = async () => {
    try {
        const data = await $api('/users/me');
        originalUserData = { ...data };
        resetForm();
    } catch (error) {
        console.error("Failed to fetch user data:", error);
        toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลผู้ใช้ได้');
    }
}

const resetForm = () => {
    if (originalUserData) {
        form.firstName = originalUserData.firstName || '';
        form.lastName = originalUserData.lastName || '';
        form.email = originalUserData.email || '';
        form.phoneNumber = originalUserData.phoneNumber || '';
        previewUrl.value = originalUserData.profilePicture || `https://ui-avatars.com/api/?name=${form.firstName || 'U'}&background=random&size=128`;
        form.currentPassword = '';
        form.newPassword = '';
        form.confirmNewPassword = '';
        form.profilePictureFile = null;
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    return dayjs(dateString).format('D MMMM YYYY HH:mm');
}

onMounted(() => {
    fetchUserData();
});

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

function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) {
        const error = validateImageFile(file);
        if (error) {
            toast.error('ไฟล์ไม่ถูกต้อง', error);
            e.target.value = '';
            return;
        }
        form.profilePictureFile = file
        previewUrl.value = URL.createObjectURL(file)
    }
}

async function handleProfileUpdate() {
    isLoading.value = true;
    try {
        const formData = new FormData()
        formData.append('firstName', form.firstName);
        formData.append('lastName', form.lastName);
        formData.append('email', form.email);
        formData.append('phoneNumber', form.phoneNumber);
        if (form.profilePictureFile) {
            formData.append('profilePicture', form.profilePictureFile);
        }
        const updatedUser = await $api('/users/me', { method: 'PUT', body: formData });
        userCookie.value = updatedUser;
        originalUserData = { ...updatedUser };

        let passwordChanged = false;
        if (form.currentPassword || form.newPassword || form.confirmNewPassword) {
            if (!form.currentPassword || !form.newPassword || !form.confirmNewPassword) {
                throw new Error("หากต้องการเปลี่ยนรหัสผ่าน กรุณากรอกข้อมูลรหัสผ่านให้ครบทุกช่อง");
            }
            if (form.newPassword !== form.confirmNewPassword) {
                throw new Error("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
            }
            if (form.newPassword.length < 6) {
                throw new Error("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
            }
            await $api('/auth/change-password', {
                method: 'PUT',
                body: { currentPassword: form.currentPassword, newPassword: form.newPassword, confirmNewPassword: form.confirmNewPassword }
            });
            passwordChanged = true;
            form.currentPassword = '';
            form.newPassword = '';
            form.confirmNewPassword = '';
        }
        toast.success('อัปเดตสำเร็จ!', passwordChanged ? 'โปรไฟล์และรหัสผ่านของคุณถูกบันทึกแล้ว' : 'ข้อมูลโปรไฟล์ของคุณถูกบันทึกแล้ว');
    } catch (err) {
        const message = err.data?.message || err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
        toast.error('เกิดข้อผิดพลาด', message);
    } finally {
        isLoading.value = false;
        if (fileInput.value) fileInput.value.value = '';
        form.profilePictureFile = null;
    }
}

/**
 * PDPA ม.33 — Right to Erasure
 * ลบบัญชีตัวเอง (Soft Delete + PII Anonymize)
 * SystemLog ยังคงเก็บตาม พ.ร.บ.คอมพิวเตอร์ ม.26
 */
async function handleDeleteAccount() {
    if (deleteConfirmText.value !== 'DELETE') return
    isDeletingAccount.value = true
    try {
        await $api('/users/me', { method: 'DELETE' })
        toast.success('ลบบัญชีสำเร็จ', 'ข้อมูลส่วนบุคคลของคุณถูกลบออกแล้ว')
        // ล้าง cookie + redirect ไปหน้า login
        const tokenCookie = useCookie('token')
        const userCookieRef = useCookie('user')
        tokenCookie.value = null
        userCookieRef.value = null
        await navigateTo('/login')
    } catch (err) {
        const msg = err?.data?.message || err?.message || 'เกิดข้อผิดพลาด'
        toast.error('ไม่สามารถลบบัญชีได้', msg)
    } finally {
        isDeletingAccount.value = false
        showDeleteAccountModal.value = false
        deleteConfirmText.value = ''
    }
}
</script>