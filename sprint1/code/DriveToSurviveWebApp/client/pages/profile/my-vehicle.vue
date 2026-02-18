<template>
    <div class="h-screen flex flex-col pt-16">
        <div class="flex-1 flex overflow-hidden">
                <ProfileSidebar />
                <main class="flex-1 overflow-y-auto w-full p-8">


                    <!-- ยังไม่ยืนยันตัวตน -->
                    <div v-if="!canManageVehicle" class="bg-white rounded-xl shadow p-8 border border-gray-200 text-center">
                        <div class="inline-flex items-center justify-center w-14 h-14 bg-amber-100 rounded-full mb-4">
                            <svg class="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-2">ยังไม่สามารถจัดการรถยนต์ได้</h3>
                        <p class="text-gray-500 max-w-md mx-auto mb-6 text-sm">คุณต้องยืนยันตัวตนด้วยบัตรประชาชนและใบขับขี่ก่อน</p>
                        <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <NuxtLink v-if="!idCardVerified" to="/profile/verification" class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">ยืนยันบัตรประชาชน</NuxtLink>
                            <span v-else class="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg">✅ บัตร ปชช. ยืนยันแล้ว</span>
                            <NuxtLink v-if="!driverVerified" to="/driverVerify" class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">ยืนยันใบขับขี่</NuxtLink>
                            <span v-else class="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg">✅ ใบขับขี่ ยืนยันแล้ว</span>
                        </div>
                    </div>

                    <!-- ยืนยันแล้ว -->
                    <div v-else>

                        <!-- ════ ฟอร์มเพิ่ม/แก้ไข (inline) ════ -->
                        <div v-if="showForm" class="bg-white rounded-xl shadow p-6 border border-gray-200 mb-6">
                            <!-- Page Header (Inside Form) -->
                            <div class="text-center mb-6">
                                <h1 class="text-2xl font-bold text-gray-800 mb-1">ข้อมูลรถยนต์ของฉัน</h1>
                                <p class="text-gray-500 text-sm">จัดการข้อมูลรถยนต์ของคุณเพื่อใช้ในการสร้างเส้นทาง</p>
                            </div>

                            <div class="flex items-center justify-between mb-5">
                                <h2 class="text-lg font-semibold text-gray-800">{{ formMode === 'add' ? 'เพิ่มรถยนต์คันใหม่' : 'แก้ไขข้อมูลรถยนต์' }}</h2>
                                <button @click="cancelForm" class="text-gray-400 hover:text-gray-600 p-1">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <form @submit.prevent="handleFormSubmit" class="space-y-5">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">ยี่ห้อและรุ่นรถ</label>
                                        <input type="text" v-model="form.vehicleModel" placeholder="เช่น Toyota Camry" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" required>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">หมายเลขทะเบียน</label>
                                        <input type="text" v-model="form.licensePlate" placeholder="เช่น กก 1234 ขอนแก่น" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" required>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">ชนิดของรถ</label>
                                        <select v-model="form.vehicleType" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" required>
                                            <option disabled value="">กรุณาเลือกชนิด</option>
                                            <option>Sedan</option>
                                            <option>SUV</option>
                                            <option>Hatchback</option>
                                            <option>Van</option>
                                            <option>Pickup</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">สีรถ</label>
                                        <input type="text" v-model="form.color" placeholder="เช่น สีดำ" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" required>
                                    </div>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">จำนวนที่นั่ง (ไม่รวมคนขับ)</label>
                                        <input type="number" v-model.number="form.seatCapacity" min="1" max="12" placeholder="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" required>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">สิ่งอำนวยความสะดวก (คั่นด้วย ,)</label>
                                        <input type="text" v-model="amenitiesInput" placeholder="เช่น Air Conditioner, Music" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">รูปภาพรถยนต์ (สูงสุด 3 รูป)</label>
                                    <div class="grid grid-cols-3 gap-3">
                                        <div v-for="(label, index) in ['ด้านหน้า', 'ด้านข้าง', 'ภายใน']" :key="index">
                                            <div @click="photoInputs[index]?.click()"
                                                class="border-2 border-dashed border-gray-300 rounded-lg h-28 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors bg-gray-50 relative overflow-hidden">
                                                <div v-if="!photoPreviews[index]" class="text-center text-gray-400">
                                                    <svg class="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 16.5V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V16.5" /></svg>
                                                    <span class="text-xs mt-1 block">{{ label }}</span>
                                                </div>
                                                <img v-else :src="photoPreviews[index]" class="w-full h-full object-cover" />
                                            </div>
                                            <input type="file" :ref="el => photoInputs[index] = el" @change="handleFileChange($event, index)" class="hidden" accept=".jpg,.jpeg,.png" />
                                        </div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3 px-3 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <input type="checkbox" v-model="form.isDefault" id="isDefault" class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                                    <label for="isDefault" class="text-sm text-gray-700 font-medium cursor-pointer">ตั้งเป็นรถยนต์คันหลัก</label>
                                </div>
                                <div class="flex gap-3 pt-2">
                                    <button type="button" @click="cancelForm" class="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm">ยกเลิก</button>
                                    <button type="submit" :disabled="isSaving" class="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                        {{ isSaving ? 'กำลังบันทึก...' : 'บันทึก' }}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <!-- ════ รายการรถ ════ -->
                        <div v-if="!showForm" class="bg-white rounded-xl shadow p-6 border border-gray-200">
                            <!-- Page Header (Inside List Box) -->
                            <div class="text-center mb-6">
                                <h1 class="text-2xl font-bold text-gray-800 mb-1">ข้อมูลรถยนต์ของฉัน</h1>
                                <p class="text-gray-500 text-sm">จัดการข้อมูลรถยนต์ของคุณเพื่อใช้ในการสร้างเส้นทาง</p>
                            </div>

                            <!-- Top Bar (Show only if vehicles exist) -->
                            <div v-if="vehicles.length > 0 && !showForm" class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5 border-b border-gray-100 pb-4">
                                <p class="text-gray-800 font-medium">
                                    รถยนต์ {{ vehicles.length }} คัน
                                </p>
                                <button @click="openAddForm"
                                    class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                    เพิ่มรถยนต์
                                </button>
                            </div>

                            <div v-if="isLoadingVehicles" class="text-center py-8 text-gray-400">กำลังโหลด...</div>

                            <div v-else-if="vehicles.length === 0 && !showForm" class="text-center py-10">
                                <svg class="w-14 h-14 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                                </svg>
                                <p class="text-gray-500 text-sm mb-4">ยังไม่มีข้อมูลรถยนต์</p>
                                <button @click="openAddForm" class="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                    เพิ่มรถยนต์คันแรก
                                </button>
                            </div>

                            <div v-else class="space-y-3">
                                <div v-for="vehicle in vehicles" :key="vehicle.id"
                                    class="border rounded-xl p-4 transition-all hover:shadow-sm"
                                    :class="vehicle.isDefault ? 'border-blue-300 bg-blue-50/40' : 'border-gray-200'">
                                    <div class="flex flex-col sm:flex-row gap-4">
                                        <img :src="vehicle.photos?.[0] || 'https://placehold.co/120x90/e2e8f0/94a3b8?text=No+Photo'" alt="Vehicle" class="w-full sm:w-24 h-20 rounded-lg object-cover bg-gray-100 shrink-0" />
                                        <div class="flex-1 min-w-0">
                                            <div class="flex flex-col">
                                                <div class="flex items-center gap-2 mb-0.5">
                                                    <h3 class="font-semibold text-gray-800">{{ vehicle.vehicleModel }}</h3>
                                                    <span v-if="vehicle.isDefault" class="shrink-0 text-xs font-medium text-white bg-blue-600 px-2.5 py-1 rounded-full shadow-sm">
                                                        คันหลัก
                                                    </span>
                                                </div>
                                                <p class="text-sm text-gray-500">{{ vehicle.licensePlate }}</p>
                                            </div>
                                            <div class="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
                                                <span>{{ vehicle.vehicleType }}</span>
                                                <span>{{ vehicle.color }}</span>
                                                <span>{{ vehicle.seatCapacity }} ที่นั่ง</span>
                                            </div>
                                            <div v-if="vehicle.amenities?.length > 0" class="flex flex-wrap gap-1 mt-1.5">
                                                <span v-for="a in vehicle.amenities" :key="a.id || a" class="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">{{ typeof a === 'string' ? a : a.name }}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex items-center justify-end gap-2 mt-2 pt-2 border-t -mx-4 px-4 py-2"
                                        :class="vehicle.isDefault ? 'border-blue-200 bg-blue-50/40' : 'border-gray-100 bg-white'">
                                        <button v-if="!vehicle.isDefault" @click="handleSetDefault(vehicle.id)" 
                                            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 font-medium transition-all shadow-sm">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                                            ตั้งเป็นคันหลัก
                                        </button>
                                        <button @click="openEditForm(vehicle)" 
                                            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 font-medium transition-all shadow-sm">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                                            แก้ไข
                                        </button>
                                        <button @click="confirmDelete(vehicle)" 
                                            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 font-medium transition-all shadow-sm">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                            ลบ
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>


        <!-- Delete confirmation popup -->
        <transition name="modal-fade">
            <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="deleteTarget = null">
                <div class="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">ยืนยันการลบ</h3>
                    <p class="text-sm text-gray-500 mb-6">คุณต้องการลบ <strong>{{ deleteTarget.vehicleModel }}</strong> ({{ deleteTarget.licensePlate }}) ใช่หรือไม่?</p>
                    <div class="flex gap-3">
                        <button @click="deleteTarget = null" class="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm">ยกเลิก</button>
                        <button @click="handleDelete" :disabled="isDeleting" class="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm disabled:opacity-50">
                            {{ isDeleting ? 'กำลังลบ...' : 'ลบ' }}
                        </button>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import ProfileSidebar from '~/components/ProfileSidebar.vue';
import { useDriverStatus } from '~/composables/useDriverStatus';
import { useToast } from '~/composables/useToast';

definePageMeta({ middleware: 'auth' });

const { $api } = useNuxtApp();
const { toast } = useToast();
const { isDriverVerified, fetchDriverStatus } = useDriverStatus();

const isLoadingVehicles = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const vehicles = ref([]);
const deleteTarget = ref(null);
const idCardVerified = ref(false);
const driverVerified = computed(() => isDriverVerified.value);
const canManageVehicle = computed(() => idCardVerified.value && driverVerified.value);

const showForm = ref(false);
const formMode = ref('add');
const editingId = ref(null);

const form = reactive({
    vehicleModel: '', licensePlate: '', vehicleType: '', color: '',
    seatCapacity: 4, isDefault: false, photos: [null, null, null],
});
const amenitiesInput = ref('');
const photoPreviews = ref(['', '', '']);
const photoInputs = ref([]);

const resetForm = () => {
    Object.assign(form, { vehicleModel: '', licensePlate: '', vehicleType: '', color: '', seatCapacity: 4, isDefault: false, photos: [null, null, null] });
    amenitiesInput.value = '';
    photoPreviews.value = ['', '', ''];
    editingId.value = null;
};

const openAddForm = () => {
    resetForm();
    formMode.value = 'add';
    showForm.value = true;
};

const openEditForm = (vehicle) => {
    formMode.value = 'edit';
    editingId.value = vehicle.id;
    form.vehicleModel = vehicle.vehicleModel;
    form.licensePlate = vehicle.licensePlate;
    form.vehicleType = vehicle.vehicleType;
    form.color = vehicle.color;
    form.seatCapacity = vehicle.seatCapacity;
    form.isDefault = vehicle.isDefault;
    amenitiesInput.value = (vehicle.amenities || []).map(a => typeof a === 'string' ? a : a.name).join(', ');
    photoPreviews.value = [...(vehicle.photos || []), '', '', ''].slice(0, 3);
    form.photos = [null, null, null];
    showForm.value = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const cancelForm = () => {
    showForm.value = false;
    resetForm();
};

const handleFileChange = (event, index) => {
    const file = event.target.files[0];
    if (!file) return;
    const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
    if (!['image/jpeg', 'image/png'].includes(file.type) && !['.jpg', '.jpeg', '.png'].includes(ext)) {
        toast.error('ไฟล์ไม่ถูกต้อง', 'รองรับเฉพาะ JPEG, PNG');
        event.target.value = '';
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        toast.error('ไฟล์ใหญ่เกินไป', 'ขนาดไม่เกิน 5MB');
        event.target.value = '';
        return;
    }
    form.photos[index] = file;
    photoPreviews.value[index] = URL.createObjectURL(file);
};

const handleFormSubmit = async () => {
    isSaving.value = true;
    const amenities = amenitiesInput.value.split(',').map(s => s.trim()).filter(Boolean);
    const fd = new FormData();
    fd.append('vehicleModel', form.vehicleModel);
    fd.append('licensePlate', form.licensePlate);
    fd.append('vehicleType', form.vehicleType);
    fd.append('color', form.color);
    fd.append('seatCapacity', form.seatCapacity);
    fd.append('isDefault', form.isDefault);
    fd.append('amenities', JSON.stringify(amenities));
    form.photos.forEach(file => { if (file instanceof File) fd.append('photos', file); });

    try {
        if (formMode.value === 'add') {
            await $api('/vehicles', { method: 'POST', body: fd });
            toast.success('สำเร็จ', 'เพิ่มรถยนต์เรียบร้อยแล้ว');
        } else {
            await $api(`/vehicles/${editingId.value}`, { method: 'PUT', body: fd });
            toast.success('สำเร็จ', 'แก้ไขข้อมูลรถยนต์เรียบร้อยแล้ว');
        }
        showForm.value = false;
        resetForm();
        await fetchVehicles();
    } catch (error) {
        const msg = error?.statusMessage || error?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้';
        toast.error('เกิดข้อผิดพลาด', msg);
    } finally {
        isSaving.value = false;
    }
};

const fetchVehicles = async () => {
    isLoadingVehicles.value = true;
    try {
        const res = await $api('/vehicles');
        vehicles.value = Array.isArray(res) ? res : (res?.data ?? []);
    } catch (error) {
        console.error("Failed to fetch vehicles:", error);
    } finally {
        isLoadingVehicles.value = false;
    }
};

const fetchVerificationStatus = async () => {
    try {
        const me = await $api('/users/me');
        idCardVerified.value = !!(me.isVerified || me.verifiedByOcr);
    } catch (e) { console.error('Failed to fetch user verification:', e); }
    await fetchDriverStatus();
};

const handleSetDefault = async (vehicleId) => {
    try {
        await $api(`/vehicles/${vehicleId}/default`, { method: 'PUT' });
        toast.success('สำเร็จ', 'ตั้งเป็นรถยนต์คันหลักแล้ว');
        await fetchVehicles();
    } catch (error) {
        toast.error('เกิดข้อผิดพลาด', error?.statusMessage || 'ไม่สามารถตั้งเป็นค่าเริ่มต้นได้');
    }
};

const confirmDelete = (vehicle) => { deleteTarget.value = vehicle; };

const handleDelete = async () => {
    if (!deleteTarget.value) return;
    isDeleting.value = true;
    try {
        await $api(`/vehicles/${deleteTarget.value.id}`, { method: 'DELETE' });
        toast.success('สำเร็จ', 'ลบรถยนต์เรียบร้อยแล้ว');
        deleteTarget.value = null;
        await fetchVehicles();
    } catch (error) {
        toast.error('เกิดข้อผิดพลาด', error?.statusMessage || 'ไม่สามารถลบรถยนต์ได้');
    } finally {
        isDeleting.value = false;
    }
};

onMounted(() => {
    fetchVerificationStatus();
    fetchVehicles();
});
</script>

<style scoped>
/* Copied from the HTML file */
.license-card {
    background-color: #F8FAFC;
    border: 3px solid #1e40af;
    border-radius: 12px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.2);
}

.selfie-frame {
    background-color: #F9FAFB;
    border: 3px solid #f59e0b;
    border-radius: 20px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
}

.person-silhouette {
    background-color: #64748B;
    border-radius: 50%;
    position: relative;
}

.upload-zone {
    transition: all 0.3s ease;
    cursor: pointer;
}

.upload-zone:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.step-indicator {
    background-color: #1E4D40;
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>