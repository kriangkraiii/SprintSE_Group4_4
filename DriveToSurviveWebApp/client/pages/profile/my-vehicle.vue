<template>
    <div >
        <div class=" flex items-center justify-center py-8">
            <div
                class="flex bg-white rounded-lg shadow-lg overflow-hidden max-w-6xl w-full mx-4 border border-gray-300">

                <ProfileSidebar />

                <main class="flex-1 p-8">
                    <div class="text-center mb-8">
                        <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">
                                </path>
                            </svg>
                        </div>
                        <h1 class="text-3xl font-bold text-gray-800 mb-2">ข้อมูลรถยนต์ของฉัน</h1>
                        <p class="text-gray-600 max-w-md mx-auto">
                            จัดการข้อมูลรถยนต์ของคุณเพื่อใช้ในการสร้างเส้นทาง
                        </p>
                    </div>

                    <div class="bg-white rounded-xl shadow-xl p-8 border border-gray-300">
                        <!-- ยังไม่ยืนยันตัวตน -->
                        <div v-if="!canManageVehicle" class="text-center py-8">
                            <div class="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                                <svg class="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            </div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">ยังไม่สามารถจัดการรถยนต์ได้</h3>
                            <p class="text-gray-500 max-w-md mx-auto mb-6">
                                คุณต้องยืนยันตัวตนด้วยบัตรประชาชน (OCR) และใบขับขี่ก่อน จึงจะสามารถเพิ่มข้อมูลรถยนต์ได้
                            </p>
                            <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <NuxtLink v-if="!idCardVerified" to="/profile/verification"
                                    class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                                    </svg>
                                    ยืนยันบัตรประชาชน
                                </NuxtLink>
                                <span v-else class="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg">
                                    ✅ บัตร ปชช. ยืนยันแล้ว
                                </span>
                                <NuxtLink v-if="!driverVerified" to="/driverVerify"
                                    class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    ยืนยันใบขับขี่
                                </NuxtLink>
                                <span v-else class="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg">
                                    ✅ ใบขับขี่ ยืนยันแล้ว
                                </span>
                            </div>
                        </div>

                        <!-- ยืนยันแล้ว แสดงปุ่มจัดการรถ -->
                        <div v-else
                            class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-[#F2F2F2] p-4 md:px-6 md:py-6 rounded-[8px]">
                            <p class="text-gray-800 text-base md:text-[18px] text-center sm:text-left">
                                {{ vehicleCount > 0 ? `คุณมีรถยนต์ที่บันทึกไว้ ${vehicleCount} คัน` :
                                    'คุณยังไม่มีข้อมูลรถยนต์' }}
                            </p>
                            <button @click="isModalOpen = true"
                                class="bg-[#2563EB] hover:bg-blue-600 text-white text-sm md:text-[16px] px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
                                เพิ่ม / จัดการข้อมูล
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>

        <VehicleModal :show="isModalOpen" @close="closeAndRefresh" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import ProfileSidebar from '~/components/ProfileSidebar.vue';
import VehicleModal from '~/components/VehicleModal.vue';

definePageMeta({
    middleware: 'auth'
});

const { $api } = useNuxtApp();

const isModalOpen = ref(false);
const vehicleCount = ref(0);
const idCardVerified = ref(false);
const driverVerified = ref(false);
const canManageVehicle = computed(() => idCardVerified.value && driverVerified.value);

const fetchVehicles = async () => {
    try {
        const vehicles = await $api('/vehicles');
        vehicleCount.value = vehicles.length;
    } catch (error) {
        console.error("Failed to fetch vehicles:", error);
    }
};

const fetchVerificationStatus = async () => {
    try {
        const me = await $api('/users/me');
        idCardVerified.value = !!(me.isVerified || me.verifiedByOcr);
    } catch (e) {
        console.error('Failed to fetch user verification:', e);
    }
    try {
        const dv = await $api('/driver-verifications/me');
        driverVerified.value = !!(dv?.status === 'APPROVED' || dv?.verifiedByOcr);
    } catch (e) {
        // ยังไม่เคยส่งใบขับขี่
        driverVerified.value = false;
    }
};

const closeAndRefresh = () => {
    isModalOpen.value = false;
    fetchVehicles(); // Refresh count when modal is closed
};

onMounted(() => {
    fetchVerificationStatus();
    fetchVehicles();
});
</script>

<style scoped>
/* Copied from the HTML file */
.license-card {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 3px solid #1e40af;
    border-radius: 12px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.2);
}

.selfie-frame {
    background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
    border: 3px solid #f59e0b;
    border-radius: 20px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
}

.person-silhouette {
    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
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
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
</style>