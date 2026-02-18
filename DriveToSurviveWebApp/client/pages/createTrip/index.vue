<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Guard: ยังไม่ผ่านเงื่อนไข -->
        <div v-if="!canCreateRoute" class="flex items-center justify-center min-h-screen py-12 bg-gray-50/50">
            <div class="max-w-xl w-full mx-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
                <div class="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6 animate-pulse">
                    <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 class="text-4xl font-bold text-[#B50000] mb-2">ยังไม่สามารถสร้างเส้นทางได้</h2>
                <p class="text-gray-500 mb-8 max-w-sm mx-auto">คุณจำเป็นต้องดำเนินการตามขั้นตอนด้านล่างให้ครบถ้วน <br> จึงจะสามารถสร้างเส้นทางได้</p>
                
                <div class="space-y-4 text-left">
                    <!-- ขั้นตอน 1: บัตร ปชช. -->
                    <div class="flex items-center justify-between p-4 rounded-xl border transition-all duration-200" 
                        :class="guardStatus.idCard 
                            ? 'bg-green-50 border-green-200 shadow-sm' 
                            : 'bg-blue-50 border-blue-200 shadow-sm'">
                        <div class="flex items-center gap-3">
                            <span class="font-semibold text-sm sm:text-base" 
                                :class="guardStatus.idCard ? 'text-green-800' : 'text-blue-900'">
                                ยืนยันบัตรประชาชน
                            </span>
                        </div>
                        <div v-if="guardStatus.idCard" class="text-green-600 font-medium text-sm flex items-center gap-1">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            ผ่านการยืนยันแล้ว
                        </div>
                        <NuxtLink v-else to="/profile"
                            class="px-4 py-2 text-sm font-medium text-white bg-[#1B4D89] rounded-lg hover:bg-[#164070] shadow-sm transition-colors">
                            ดำเนินการ
                        </NuxtLink>
                    </div>

                    <!-- ขั้นตอน 2: ใบขับขี่ -->
                    <div class="flex items-center justify-between p-4 rounded-xl border transition-all duration-200" 
                        :class="guardStatus.driver 
                            ? 'bg-green-50 border-green-200 shadow-sm' 
                            : 'bg-blue-50 border-blue-200 shadow-sm'">
                        <div class="flex items-center gap-3">
                            <span class="font-semibold text-sm sm:text-base" 
                                :class="guardStatus.driver ? 'text-green-800' : 'text-blue-900'">
                                ยืนยันใบขับขี่
                            </span>
                        </div>
                        <div v-if="guardStatus.driver" class="text-green-600 font-medium text-sm flex items-center gap-1">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            ผ่านการยืนยันแล้ว
                        </div>
                        <NuxtLink v-else to="/driverVerify"
                            class="px-4 py-2 text-sm font-medium text-white bg-[#1B4D89] rounded-lg hover:bg-[#164070] shadow-sm transition-colors">
                            ดำเนินการ
                        </NuxtLink>
                    </div>

                    <!-- ขั้นตอน 3: รถยนต์ -->
                    <div class="flex items-center justify-between p-4 rounded-xl border transition-all duration-200" 
                        :class="[
                            guardStatus.vehicle ? 'bg-green-50 border-green-200 shadow-sm' : '',
                            !guardStatus.vehicle && (guardStatus.idCard && guardStatus.driver) ? 'bg-blue-50 border-blue-200 shadow-sm' : '',
                            !guardStatus.vehicle && (!guardStatus.idCard || !guardStatus.driver) ? 'bg-gray-100 border-gray-200 opacity-75' : ''
                        ]">
                        <div class="flex items-center gap-3">
                            <span class="font-semibold text-sm sm:text-base" 
                                :class="[
                                    guardStatus.vehicle ? 'text-green-800' : '',
                                    !guardStatus.vehicle && (guardStatus.idCard && guardStatus.driver) ? 'text-blue-900' : '',
                                    !guardStatus.vehicle && (!guardStatus.idCard || !guardStatus.driver) ? 'text-gray-500' : ''
                                ]">
                                เพิ่มข้อมูลรถยนต์
                            </span>
                        </div>
                        
                        <div v-if="guardStatus.vehicle" class="text-green-600 font-medium text-sm flex items-center gap-1">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            ผ่านการยืนยันแล้ว
                        </div>

                        <button v-else-if="!guardStatus.idCard || !guardStatus.driver" disabled
                            class="px-4 py-2 text-sm font-medium text-white bg-gray-400 rounded-lg cursor-not-allowed">
                            ดำเนินการ
                        </button>

                        <NuxtLink v-else to="/profile/my-vehicle"
                            class="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 shadow-sm transition-colors">
                            ดำเนินการ
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </div>

        <!-- Hero header -->
        <template v-else>
        <!-- Graphical Header -->
        <div class="relative h-[280px] w-full">
            <img src="/images/bgmytrip.png" alt="Create Trip Background" class="object-cover w-full h-full" />
            <div class="absolute inset-0 flex flex-col justify-center px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <h1 class="text-4xl font-bold text-white drop-shadow-md">สร้างเส้นทาง</h1>
                <p class="mt-2 text-white/90 drop-shadow-sm ml-4">สร้างเส้นทางของคุณ เพื่อแชร์ที่นั่งว่างให้กับเพื่อนร่วมทางที่มีจุดหมายเดียวกัน</p>
            </div>
        </div>

        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <!-- Left panel: Form -->
                <div class="lg:col-span-2 space-y-4">
                    <form @submit.prevent="handleSubmit" novalidate>
                        <!-- Route inputs (Grab-style timeline) -->
                        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div class="p-5">
                                <h3 class="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <span
                                        class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">1</span>
                                    เส้นทาง
                                </h3>
                                <div class="relative pl-8">
                                    <!-- Timeline line -->
                                    <div class="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-200"></div>
                                    <!-- Start -->
                                    <div class="relative mb-4">
                                        <div
                                            class="absolute -left-[18px] top-3 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100 z-10">
                                        </div>
                                        <label class="block text-xs font-medium text-gray-500 mb-1">จุดเริ่มต้น</label>
                                        <div class="relative">
                                            <input ref="startInputEl" v-model="form.startPoint" type="text"
                                                placeholder="ค้นหาจุดเริ่มต้น..."
                                                class="w-full pl-3 pr-20 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 transition" />
                                            <div class="absolute right-1 top-1 flex gap-1">
                                                <button type="button" @click="useCurrentLocation('start')"
                                                    class="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition"
                                                    title="ใช้ตำแหน่งปัจจุบัน">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor"
                                                        viewBox="0 0 24 24">
                                                        <circle cx="12" cy="12" r="3" />
                                                        <path d="M12 2v4m0 12v4m-10-10h4m12 0h4" />
                                                    </svg>
                                                </button>
                                                <button type="button" @click="openPlacePicker('start')"
                                                    class="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition"
                                                    title="เลือกจากแผนที่">
                                                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                        <path
                                                            d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Waypoints -->
                                    <div v-for="(wp, idx) in waypoints" :key="idx" class="relative mb-4">
                                        <div
                                            class="absolute -left-[18px] top-3 w-3 h-3 rounded-full bg-amber-400 ring-4 ring-amber-100 z-10">
                                        </div>
                                        <label class="block text-xs font-medium text-gray-500 mb-1">จุดแวะ {{ idx + 1
                                            }}</label>
                                        <div class="relative">
                                            <input :ref="el => waypointInputs[idx] = el" v-model="wp.text" type="text"
                                                :placeholder="`ค้นหาจุดแวะ (#${idx + 1})...`"
                                                class="w-full pl-3 pr-16 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-gray-50 transition" />
                                            <div class="absolute right-1 top-1 flex gap-1">
                                                <button type="button" @click="openPlacePicker(`wp-${idx}`)"
                                                    class="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition">
                                                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                        <path
                                                            d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                                                    </svg>
                                                </button>
                                                <button type="button" @click="removeWaypoint(idx)"
                                                    class="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor"
                                                        viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                            stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- End -->
                                    <div class="relative">
                                        <div
                                            class="absolute -left-[18px] top-3 w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-100 z-10">
                                        </div>
                                        <label class="block text-xs font-medium text-gray-500 mb-1">จุดปลายทาง</label>
                                        <div class="relative">
                                            <input ref="endInputEl" v-model="form.endPoint" type="text"
                                                placeholder="ค้นหาจุดปลายทาง..."
                                                class="w-full pl-3 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-400 focus:border-red-400 bg-gray-50 transition" />
                                            <button type="button" @click="openPlacePicker('end')"
                                                class="absolute right-1 top-1 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                    <path
                                                        d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button type="button" @click="addWaypoint"
                                    class="mt-4 ml-8 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 4v16m8-8H4" />
                                    </svg>
                                    เพิ่มจุดแวะ
                                </button>
                            </div>
                        </div>

                        <!-- Trip details -->
                        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-4">
                            <div class="p-5">
                                <h3 class="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <span
                                        class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">2</span>
                                    รายละเอียดการเดินทาง
                                </h3>
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label class="block text-xs font-medium text-gray-500 mb-1">วันที่เดินทาง</label>
                                        <input v-model="form.date" type="date" :min="minDate"
                                            class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50" />
                                    </div>
                                    <div>
                                        <label
                                            class="block text-xs font-medium text-gray-500 mb-1">เวลาออกเดินทาง</label>
                                        <input v-model="form.time" type="time"
                                            class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50" />
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-gray-500 mb-1">ที่นั่งว่าง</label>
                                        <input v-model.number="form.availableSeats" type="number" min="1" placeholder="4"
                                            class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50" />
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-gray-500 mb-1">ราคา/ที่นั่ง
                                            (฿)</label>
                                        <input v-model.number="form.pricePerSeat" type="number" min="0" placeholder="250"
                                            class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Vehicle -->
                        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-4">
                            <div class="p-5">
                                <h3 class="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <span
                                        class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">3</span>
                                    ข้อมูลรถยนต์
                                </h3>
                                <div v-if="vehicles.length > 0">
                                    <select v-model="form.vehicleId"
                                        class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50">
                                        <option disabled value="">เลือกรถยนต์</option>
                                        <option v-for="v in vehicles" :key="v.id" :value="v.id">
                                            {{ v.vehicleModel }} ({{ v.licensePlate }})
                                        </option>
                                    </select>
                                    <button type="button" @click="isModalOpen = true"
                                        class="mt-2 text-xs text-emerald-600 hover:underline">
                                        + เพิ่ม / จัดการรถยนต์
                                    </button>
                                </div>
                                <div v-else class="text-center py-6">
                                    <div
                                        class="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                                        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                                d="M8 17h8M8 17a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 104 0 2 2 0 00-4 0zM3 9l3-6h12l3 6M3 9h18M3 9v8h18V9" />
                                        </svg>
                                    </div>
                                    <p class="text-sm text-gray-500 mb-2">ยังไม่มีข้อมูลรถยนต์</p>
                                    <button type="button" @click="isModalOpen = true"
                                        class="px-4 py-2 text-sm text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition">
                                        เพิ่มรถยนต์
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Conditions -->
                        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-4">
                            <div class="p-5">
                                <h3 class="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <span
                                        class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">4</span>
                                    เงื่อนไข
                                </h3>
                                <textarea v-model="form.conditions" rows="3"
                                    placeholder="เช่น ไม่สูบบุหรี่, สัมภาระไม่เกิน 20 กก."
                                    class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 resize-none"></textarea>
                            </div>
                        </div>

                        <!-- Submit -->
                        <div class="flex gap-3 mt-4 mb-24">
                            <button type="button" @click="navigateTo('/findTrip')"
                                class="flex-1 py-3 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition cursor-pointer">
                                ยกเลิก
                            </button>
                            <button type="submit" :disabled="isLoading"
                                class="flex-[2] py-3 text-sm font-semibold text-white bg-[#1B9329] rounded-2xl hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition cursor-pointer">
                                <span v-if="isLoading" class="flex items-center justify-center gap-2">
                                    <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                            stroke-width="4" />
                                        <path class="opacity-75" fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    กำลังสร้าง...
                                </span>
                                <span v-else>สร้างเส้นทาง</span>
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Right panel: Map -->
                <div class="lg:col-span-3 relative">
                    <div class="sticky top-4">
                        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                            <div ref="mainMapEl" class="w-full"
                                style="height: calc(100vh - 160px); min-height: 500px;"></div>
                            <!-- Realtime location badge -->
                            <div v-if="userLocation.lat" class="absolute bottom-4 left-4 z-10">
                                <div
                                    class="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 text-xs">
                                    <span class="relative flex h-2.5 w-2.5">
                                        <span
                                            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span
                                            class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </span>
                                    <span class="text-gray-600">ตำแหน่งของคุณ (เรียลไทม์)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Vehicle Modal -->
        <VehicleModal :show="isModalOpen" @close="closeAndRefresh" />

        <!-- Place Picker Modal -->
        <transition name="modal-fade">
            <div v-if="showPlacePicker"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                @click.self="closePlacePicker">
                <div class="bg-white rounded-2xl w-[95%] max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
                    <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 ">
                        <h3 class="text-base font-semibold text-gray-800 ">
                            เลือก{{ pickingField === 'start' ? 'จุดเริ่มต้น' : pickingField === 'end' ? 'จุดปลายทาง' :
                                'จุดแวะ' }}
                        </h3>
                        <button @click="closePlacePicker"
                            class="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div ref="placePickerMapEl" class="w-full h-80"></div>
                    <div class="p-4 space-y-3">
                        <div class="text-sm">
                            <span class="font-medium text-gray-700">ตำแหน่ง: </span>
                            <span class="text-gray-500">{{ pickedPlace.name || '— แตะบนแผนที่เพื่อเลือก —' }}</span>
                        </div>
                        <div class="flex gap-2">
                            <button @click="closePlacePicker"
                                class="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                                ยกเลิก
                            </button>
                            <button :disabled="!pickedPlace.name" @click="applyPickedPlace"
                                class="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition">
                                ใช้ตำแหน่งนี้
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
        </template>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRuntimeConfig, useHead, navigateTo } from '#app'
import { useToast } from '~/composables/useToast'
import VehicleModal from '~/components/VehicleModal.vue'
import { getProvinceFromPlace , stripCountry, stripLeadingPlusCode } from '~/utils/googleMaps'

definePageMeta({ middleware: 'auth' })

const { $api } = useNuxtApp()
const { toast } = useToast()
const config = useRuntimeConfig()

// ==================== Guard: ตรวจสอบสิทธิ์ก่อนสร้างเส้นทาง ====================
const guardStatus = reactive({ idCard: false, driver: false, vehicle: false })
const guardLoaded = ref(false)
const canCreateRoute = computed(() => guardLoaded.value && guardStatus.idCard && guardStatus.driver && guardStatus.vehicle)

const fetchGuardStatus = async () => {
    try {
        const me = await $api('/users/me')
        guardStatus.idCard = !!(me.isVerified || me.verifiedByOcr)
    } catch { guardStatus.idCard = false }
    try {
        const dv = await $api('/driver-verifications/me')
        guardStatus.driver = !!(dv?.status === 'APPROVED' || dv?.verifiedByOcr)
    } catch { guardStatus.driver = false }
    try {
        const v = await $api('/vehicles')
        const vList = Array.isArray(v) ? v : (v?.data ?? [])
        guardStatus.vehicle = vList.length > 0
    } catch { guardStatus.vehicle = false }
    guardLoaded.value = true
}

const isModalOpen = ref(false)
const isLoading = ref(false)
const vehicles = ref([])

const waypoints = ref([])
const minDate = new Date().toISOString().split('T')[0]
const waypointMetas = ref([])
const waypointInputs = ref([])
let waypointAutocompletes = []

const form = reactive({
    vehicleId: '',
    startPoint: '',
    endPoint: '',
    date: '',
    time: '',
    availableSeats: null,
    pricePerSeat: null,
    conditions: '',
})

const startInputEl = ref(null)
const endInputEl = ref(null)
let startAutocomplete = null
let endAutocomplete = null

const startMeta = ref({ lat: null, lng: null, name: null, address: null, placeId: null, province: null })
const endMeta = ref({ lat: null, lng: null, name: null, address: null, placeId: null, province: null })

const showPlacePicker = ref(false)
const pickingField = ref(null)
const placePickerMapEl = ref(null)
let placePickerMap = null
let placePickerMarker = null
const pickedPlace = ref({ name: '', lat: null, lng: null })

let geocoder = null
let placesService = null

// Main map
const mainMapEl = ref(null)
let mainMap = null
let mainStartMarker = null
let mainEndMarker = null
let mainPolyline = null
let mainWaypointMarkers = []

// User real-time location
const userLocation = ref({ lat: null, lng: null })
let userLocationMarker = null
let userLocationCircle = null
let watchId = null

const GMAPS_CB = '__gmapsReadyCreateTrip__'
const headScripts = []
if (process.client && !window.google?.maps) {
    headScripts.push({
        key: 'gmaps',
        src: `https://maps.googleapis.com/maps/api/js?key=${config.public.googleMapsApiKey}&libraries=places,geometry&callback=${GMAPS_CB}`,
        async: true,
        defer: true,
    })
}
useHead({ script: headScripts })

// ==================== Real-time Location ====================
function startLocationTracking() {
    if (!navigator.geolocation) return
    watchId = navigator.geolocation.watchPosition(
        (pos) => {
            const lat = pos.coords.latitude
            const lng = pos.coords.longitude
            userLocation.value = { lat, lng }
            updateUserLocationOnMap(lat, lng)
        },
        () => { },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )
}

function updateUserLocationOnMap(lat, lng) {
    if (!mainMap) return
    const pos = new google.maps.LatLng(lat, lng)

    if (userLocationMarker) {
        userLocationMarker.setPosition(pos)
        userLocationCircle.setCenter(pos)
    } else {
        userLocationMarker = new google.maps.Marker({
            position: pos,
            map: mainMap,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#10b981',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3,
            },
            zIndex: 999,
            title: 'ตำแหน่งของคุณ',
        })
        userLocationCircle = new google.maps.Circle({
            map: mainMap,
            center: pos,
            radius: 100,
            fillColor: '#10b981',
            fillOpacity: 0.1,
            strokeColor: '#10b981',
            strokeOpacity: 0.3,
            strokeWeight: 1,
        })
    }
}

function useCurrentLocation(field) {
    if (!navigator.geolocation) {
        toast.error('ไม่รองรับ', 'เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง')
        return
    }
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const lat = pos.coords.latitude
            const lng = pos.coords.longitude
            const latlng = new google.maps.LatLng(lat, lng)
            const geocodeRes = await new Promise(resolve => {
                geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                    if (status === 'OK' && results?.length) resolve(results[0])
                    else resolve(null)
                })
            })
            const name = geocodeRes ? stripLeadingPlusCode(stripCountry(geocodeRes.formatted_address || '')) : `${lat.toFixed(6)}, ${lng.toFixed(6)}`
            const address = geocodeRes ? stripCountry(geocodeRes.formatted_address || '') : name
            const province = getProvinceFromPlace(geocodeRes)

            if (field === 'start') {
                form.startPoint = name
                startMeta.value = { lat, lng, name, address, placeId: geocodeRes?.place_id || null, province }
            } else {
                form.endPoint = name
                endMeta.value = { lat, lng, name, address, placeId: geocodeRes?.place_id || null, province }
            }
            updateMainMap()
            if (mainMap) mainMap.panTo(latlng)
        },
        () => toast.error('ไม่สามารถระบุตำแหน่ง', 'กรุณาอนุญาตการเข้าถึงตำแหน่ง'),
        { enableHighAccuracy: true }
    )
}

// ==================== Vehicle ====================
const fetchVehicles = async (showError = true) => {
    try {
        const res = await $api('/vehicles')
        const list = Array.isArray(res) ? res : (res?.data ?? [])
        vehicles.value = list
        if (list.length > 0) {
            const def = list.find(v => v.isDefault) || list[0]
            form.vehicleId = def.id
        }
    } catch (e) {
        if (showError) toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลรถยนต์ได้')
    }
}

const closeAndRefresh = async () => {
    isModalOpen.value = false
    await fetchVehicles(false)
}

// ==================== Submit ====================
const handleSubmit = async () => {
    if (isLoading.value) return

    if (!form.vehicleId || !form.date || !form.time || !form.availableSeats || !form.pricePerSeat) {
        toast.error('ข้อมูลไม่ครบถ้วน', 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน')
        return
    }

    if (!startMeta.value.lat || !endMeta.value.lat) {
        toast.error('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกจุดเริ่มต้นและจุดปลายทาง')
        return
    }

    isLoading.value = true
    const departureTime = new Date(`${form.date}T${form.time}`).toISOString()

    const waypointsPayload = waypointMetas.value
        .map((m, i) => {
            const name = m?.name || waypoints.value[i]?.text || null
            const address = m?.address || waypoints.value[i]?.text || null
            const lat = m?.lat != null ? Number(m.lat) : null
            const lng = m?.lng != null ? Number(m.lng) : null
            if (!name && lat == null) return null
            return { lat, lng, name, address }
        })
        .filter(Boolean)

    const payload = {
        vehicleId: form.vehicleId,
        startLocation: { 
            lat: Number(startMeta.value.lat), 
            lng: Number(startMeta.value.lng), 
            name: startMeta.value.name || form.startPoint, 
            address: startMeta.value.address || form.startPoint,
            province: startMeta.value.province 
        },
        endLocation: { 
            lat: Number(endMeta.value.lat), 
            lng: Number(endMeta.value.lng), 
            name: endMeta.value.name || form.endPoint, 
            address: endMeta.value.address || form.endPoint,
            province: endMeta.value.province
        },
        waypoints: waypointsPayload,
        optimizeWaypoints: true,
        departureTime,
        availableSeats: Number(form.availableSeats),
        pricePerSeat: Number(form.pricePerSeat),
        conditions: form.conditions,
    }

    try {
        const apiBase = config.public.apiBase || 'http://localhost:3000/api'
        let token = ''
        try { const m = document.cookie.match(/(?:^|;\s*)token=([^;]+)/); if (m) token = decodeURIComponent(m[1]) } catch { }
        if (process.client && !token) { try { token = localStorage.getItem('token') || '' } catch { } }

        const res = await fetch(`${apiBase}/routes`, {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify(payload),
            credentials: 'include',
        })

        let body
        try { body = await res.json() } catch { throw new Error('Unexpected response') }
        if (!res.ok) { const err = new Error(body?.message || `${res.status}`); err.status = res.status; err.payload = body; throw err }

        toast.success('สำเร็จ', body?.message || 'สร้างเส้นทางเรียบร้อยแล้ว!')
        setTimeout(() => navigateTo('/findTrip'), 1500)
    } catch (err) {
        const msg = String(err?.message || '')
        const is403 = err?.status === 403

        if (is403 && /ยืนยันบัตรประชาชน/.test(msg)) {
            toast.error('ต้องยืนยันตัวตน', 'คุณต้องยืนยันบัตรประชาชนก่อนจึงจะสร้างเส้นทางได้')
            setTimeout(() => navigateTo('/profile'), 1500)
        } else if (is403) {
            toast.error('ต้องยืนยันตัวตน', 'คุณต้องยืนยันบัตรประชาชนและใบขับขี่ก่อนจึงจะสร้างเส้นทางได้')
            setTimeout(() => navigateTo('/driverVerify'), 1500)
        } else {
            toast.error('เกิดข้อผิดพลาด', msg || 'ไม่สามารถสร้างเส้นทางได้')
        }
    } finally {
        isLoading.value = false
    }
}

// ==================== Waypoints ====================
function addWaypoint() {
    waypoints.value.push({ text: '' })
    waypointMetas.value.push({ lat: null, lng: null, name: null, address: null, placeId: null })
    nextTick(() => initWaypointAutocomplete(waypoints.value.length - 1))
}

function removeWaypoint(idx) {
    waypoints.value.splice(idx, 1)
    waypointMetas.value.splice(idx, 1)
    const ac = waypointAutocompletes[idx]
    if (ac && typeof ac.unbindAll === 'function') ac.unbindAll()
    waypointAutocompletes.splice(idx, 1)
    waypointInputs.value.splice(idx, 1)
    updateMainMap()
}

function initWaypointAutocomplete(idx) {
    if (!window.google?.maps?.places) return
    const el = waypointInputs.value[idx]
    if (!el) return

    const opts = { fields: ['place_id', 'name', 'formatted_address', 'geometry'], types: ['geocode', 'establishment'] }
    const ac = new google.maps.places.Autocomplete(el, opts)
    waypointAutocompletes[idx] = ac

    ac.addListener('place_changed', () => {
        const p = ac.getPlace()
        if (!p) return
        const lat = p.geometry?.location?.lat?.() ?? null
        const lng = p.geometry?.location?.lng?.() ?? null
        const name = p.name || stripLeadingPlusCode(stripCountry(p.formatted_address || ''))
        const address = stripCountry(p.formatted_address || name || '')
        waypoints.value[idx].text = name
        waypointMetas.value[idx] = { lat, lng, name, address, placeId: p.place_id || null }
        updateMainMap()
    })
}

// ==================== Autocomplete ====================
function initStartEndAutocomplete() {
    if (!window.google?.maps?.places) return
    geocoder = new google.maps.Geocoder()
    const tmpDiv = document.createElement('div')
    placesService = new google.maps.places.PlacesService(tmpDiv)

    const opts = { fields: ['place_id', 'name', 'formatted_address', 'geometry'], types: ['geocode', 'establishment'] }

    if (startInputEl.value) {
        if (startAutocomplete?.unbindAll) startAutocomplete.unbindAll()
        startAutocomplete = new google.maps.places.Autocomplete(startInputEl.value, opts)
        startAutocomplete.addListener('place_changed', () => {
            const p = startAutocomplete.getPlace()
            if (!p) return
            const lat = p.geometry?.location?.lat?.() ?? null
            const lng = p.geometry?.location?.lng?.() ?? null
            const name = p.name || stripLeadingPlusCode(stripCountry(p.formatted_address || ''))
            const address = stripCountry(p.formatted_address || name || '')
            const province = getProvinceFromPlace(p)
            
            form.startPoint = name
            startMeta.value = { lat, lng, name, address, placeId: p.place_id || null, province }
            updateMainMap()
        })
    }

    if (endInputEl.value) {
        if (endAutocomplete?.unbindAll) endAutocomplete.unbindAll()
        endAutocomplete = new google.maps.places.Autocomplete(endInputEl.value, opts)
        endAutocomplete.addListener('place_changed', () => {
            const p = endAutocomplete.getPlace()
            if (!p) return
            const lat = p.geometry?.location?.lat?.() ?? null
            const lng = p.geometry?.location?.lng?.() ?? null
            const name = p.name || stripLeadingPlusCode(stripCountry(p.formatted_address || ''))
            const address = stripCountry(p.formatted_address || name || '')
            const province = getProvinceFromPlace(p)

            form.endPoint = name
            endMeta.value = { lat, lng, name, address, placeId: p.place_id || null, province }
            updateMainMap()
        })
    }

    for (let i = 0; i < waypoints.value.length; i++) initWaypointAutocomplete(i)
}

// ==================== Main Map ====================
function initMainMap() {
    if (!mainMapEl.value || mainMap) return
    const center = userLocation.value.lat
        ? { lat: userLocation.value.lat, lng: userLocation.value.lng }
        : { lat: 13.7563, lng: 100.5018 }

    mainMap = new google.maps.Map(mainMapEl.value, {
        center,
        zoom: userLocation.value.lat ? 14 : 6,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
            { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        ],
    })

    if (!geocoder) geocoder = new google.maps.Geocoder()
    if (!placesService) placesService = new google.maps.places.PlacesService(mainMap)

    if (userLocation.value.lat) {
        updateUserLocationOnMap(userLocation.value.lat, userLocation.value.lng)
    }
}

function clearMainMapMarkers() {
    if (mainStartMarker) { mainStartMarker.setMap(null); mainStartMarker = null }
    if (mainEndMarker) { mainEndMarker.setMap(null); mainEndMarker = null }
    if (mainPolyline) { mainPolyline.setMap(null); mainPolyline = null }
    mainWaypointMarkers.forEach(m => m.setMap(null))
    mainWaypointMarkers = []
}

async function updateMainMap() {
    clearMainMapMarkers()
    if (!mainMap) return

    const hasStart = startMeta.value.lat != null
    const hasEnd = endMeta.value.lat != null

    if (hasStart) {
        mainStartMarker = new google.maps.Marker({
            position: { lat: startMeta.value.lat, lng: startMeta.value.lng },
            map: mainMap,
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#10b981', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 },
            title: 'จุดเริ่มต้น',
        })
    }

    if (hasEnd) {
        mainEndMarker = new google.maps.Marker({
            position: { lat: endMeta.value.lat, lng: endMeta.value.lng },
            map: mainMap,
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#ef4444', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 },
            title: 'จุดปลายทาง',
        })
    }

    waypointMetas.value.forEach((m, i) => {
        if (m.lat != null) {
            mainWaypointMarkers.push(new google.maps.Marker({
                position: { lat: m.lat, lng: m.lng },
                map: mainMap,
                icon: { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: '#f59e0b', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
                title: `จุดแวะ ${i + 1}`,
            }))
        }
    })

    if (hasStart && hasEnd) {
        try {
            const directionsService = new google.maps.DirectionsService()
            const wps = waypointMetas.value.filter(m => m.lat != null).map(m => ({
                location: new google.maps.LatLng(m.lat, m.lng),
                stopover: true,
            }))

            const result = await directionsService.route({
                origin: new google.maps.LatLng(startMeta.value.lat, startMeta.value.lng),
                destination: new google.maps.LatLng(endMeta.value.lat, endMeta.value.lng),
                waypoints: wps,
                travelMode: google.maps.TravelMode.DRIVING,
                optimizeWaypoints: true,
            })

            if (result.routes?.length) {
                const path = result.routes[0].overview_path
                mainPolyline = new google.maps.Polyline({
                    path,
                    map: mainMap,
                    strokeColor: '#10b981',
                    strokeOpacity: 0.8,
                    strokeWeight: 5,
                })
                const bounds = new google.maps.LatLngBounds()
                path.forEach(p => bounds.extend(p))
                mainMap.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 })
            }
        } catch (e) {
            const bounds = new google.maps.LatLngBounds()
            bounds.extend(new google.maps.LatLng(startMeta.value.lat, startMeta.value.lng))
            bounds.extend(new google.maps.LatLng(endMeta.value.lat, endMeta.value.lng))
            mainMap.fitBounds(bounds)
        }
    } else if (hasStart) {
        mainMap.panTo({ lat: startMeta.value.lat, lng: startMeta.value.lng })
        mainMap.setZoom(14)
    } else if (hasEnd) {
        mainMap.panTo({ lat: endMeta.value.lat, lng: endMeta.value.lng })
        mainMap.setZoom(14)
    }
}

// ==================== Place Picker Modal ====================
function openPlacePicker(field) {
    pickingField.value = field
    pickedPlace.value = { name: '', lat: null, lng: null }
    showPlacePicker.value = true

    nextTick(() => {
        let base
        if (field === 'start') base = startMeta.value
        else if (field === 'end') base = endMeta.value
        else if (String(field).startsWith('wp-')) {
            const idx = Number(String(field).split('-')[1] || -1)
            base = waypointMetas.value[idx] || {}
        }

        const hasMeta = base?.lat != null && base?.lng != null
        const center = hasMeta ? { lat: base.lat, lng: base.lng }
            : userLocation.value.lat ? { lat: userLocation.value.lat, lng: userLocation.value.lng }
                : { lat: 13.7563, lng: 100.5018 }

        placePickerMap = new google.maps.Map(placePickerMapEl.value, {
            center,
            zoom: hasMeta ? 14 : userLocation.value.lat ? 14 : 6,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
        })

        placePickerMap.addListener('click', (e) => {
            setPickerMarker(e.latLng)
            resolvePicked(e.latLng)
        })
    })
}

function setPickerMarker(latlng) {
    if (placePickerMarker) { placePickerMarker.setPosition(latlng); return }
    placePickerMarker = new google.maps.Marker({ position: latlng, map: placePickerMap, draggable: true })
    placePickerMarker.addListener('dragend', (e) => resolvePicked(e.latLng))
}

async function resolvePicked(latlng) {
    const lat = latlng.lat()
    const lng = latlng.lng()

    const geocodeRes = await new Promise(resolve => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results?.length) resolve(results[0]); else resolve(null)
        })
    })

    let display = '', addr = ''
    if (geocodeRes?.formatted_address) {
        addr = stripCountry(geocodeRes.formatted_address)
        display = stripLeadingPlusCode(addr)
    }

    if (geocodeRes?.place_id) {
        await new Promise(done => {
            placesService.getDetails({ placeId: geocodeRes.place_id, fields: ['name'] }, (pl, st) => {
                if (st === google.maps.places.PlacesServiceStatus.OK && pl?.name) display = pl.name
                done()
            })
        })
    }

    if (!display || isPlusCode(display)) {
        const poi = await findNearestPoi(lat, lng, 150)
        if (poi?.place_id) {
            await new Promise(done => {
                placesService.getDetails({ placeId: poi.place_id, fields: ['name', 'formatted_address'] }, (pl, st) => {
                    if (st === google.maps.places.PlacesServiceStatus.OK) {
                        display = pl?.name || stripLeadingPlusCode(stripCountry(pl?.formatted_address || display))
                        addr = stripCountry(pl?.formatted_address || addr)
                    }
                    done()
                })
            })
        }
    }

    pickedPlace.value = { name: display, address: addr || display, lat, lng }
}

function applyPickedPlace() {
    if (!pickingField.value || !pickedPlace.value.name) return
    const meta = { lat: pickedPlace.value.lat, lng: pickedPlace.value.lng, name: pickedPlace.value.name, address: pickedPlace.value.address || pickedPlace.value.name, placeId: null }

    if (pickingField.value === 'start') {
        form.startPoint = pickedPlace.value.name
        startMeta.value = meta
    } else if (pickingField.value === 'end') {
        form.endPoint = pickedPlace.value.name
        endMeta.value = meta
    } else if (String(pickingField.value).startsWith('wp-')) {
        const idx = Number(String(pickingField.value).split('-')[1] || -1)
        if (idx > -1) {
            waypoints.value[idx].text = pickedPlace.value.name
            waypointMetas.value[idx] = meta
        }
    }
    closePlacePicker()
    updateMainMap()
}

function closePlacePicker() {
    showPlacePicker.value = false
    pickingField.value = null
    placePickerMarker = null
    placePickerMap = null
}

// ==================== Helpers ====================
function isPlusCode(text) { return text ? /^[A-Z0-9]{4,}\+[A-Z0-9]{2,}/i.test(text.trim()) : false }
function findNearestPoi(lat, lng, radius = 120) {
    return new Promise(resolve => {
        if (!placesService) return resolve(null)
        placesService.nearbySearch({ location: { lat, lng }, radius }, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results?.length) resolve(results[0])
            else resolve(null)
        })
    })
}

// ==================== Lifecycle ====================
function initAll() {
    initMainMap()
    initStartEndAutocomplete()
    startLocationTracking()
}

onMounted(async () => {
    await fetchGuardStatus()
    if (!canCreateRoute.value) return // ไม่ต้อง init map ถ้ายังไม่ผ่านเงื่อนไข
    fetchVehicles()
    if (window.google?.maps?.places) {
        initAll()
    } else {
        window[GMAPS_CB] = () => {
            try { delete window[GMAPS_CB] } catch { }
            initAll()
        }
    }
})

onUnmounted(() => {
    if (watchId != null) navigator.geolocation.clearWatch(watchId)
})
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.25s ease;
}

.modal-fade-enter-active>div,
.modal-fade-leave-active>div {
    transition: all 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}

.modal-fade-enter-from>div,
.modal-fade-leave-to>div {
    transform: scale(0.95) translateY(10px);
}
</style>
