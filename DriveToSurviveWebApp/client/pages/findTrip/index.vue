<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Graphical Header -->
        <div class="relative h-[280px] w-full">
            <img src="/images/bgfindtrip.png" alt="Find Trip Background" class="object-cover w-full h-full" />
            <div class="absolute inset-0 flex flex-col justify-center px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <h1 class="text-4xl font-bold text-white drop-shadow-md">ค้นหาเส้นทาง</h1>
                <p class="mt-2 text-white/90 drop-shadow-sm ml-4">ระบุจุดเริ่มต้น ปลายทาง และรายละเอียดการเดินทางของคุณ เพื่อจับคู่กับผู้ขับขี่ที่ไปในเส้นทางเดียวกัน</p>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 pb-24">
            <!-- Search bar (Floating) -->
            <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 mb-8">
                <form @submit.prevent="handleSearch"
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                    <div class="lg:col-span-3">
                        <label class="block text-xs font-medium text-gray-500 mb-1">จุดเริ่มต้น</label>
                        <div class="relative">
                            <input ref="originInputEl" v-model="searchForm.origin" type="text"
                                placeholder="ค้นหาจุดเริ่มต้น..."
                                class="w-full pl-3 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 transition" />
                            <button type="button" @click="openPlacePicker('origin')"
                                class="absolute right-1 top-1 p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path
                                        d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="lg:col-span-3">
                        <label class="block text-xs font-medium text-gray-500 mb-1">จุดปลายทาง</label>
                        <div class="relative">
                            <input ref="destinationInputEl" v-model="searchForm.destination" type="text"
                                placeholder="ค้นหาจุดปลายทาง..."
                                class="w-full pl-3 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 transition" />
                            <button type="button" @click="openPlacePicker('destination')"
                                class="absolute right-1 top-1 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path
                                        d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="lg:col-span-2">
                        <label class="block text-xs font-medium text-gray-500 mb-1">วันที่</label>
                        <input v-model="searchForm.date" type="date" :min="minDate"
                            class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50" />
                    </div>
                    <div class="lg:col-span-1">
                        <label class="block text-xs font-medium text-gray-500 mb-1">ที่นั่ง</label>
                        <select v-model="searchForm.seats"
                            class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50">
                            <option value="">ทั้งหมด</option>
                            <option v-for="s in 5" :key="s" :value="s">{{ s }} ที่นั่ง</option>
                        </select>
                    </div>
                    <div class="flex gap-2 lg:col-span-3">
                        <button type="submit"
                            class="flex-1 py-3 text-sm font-semibold text-white bg-[#1B9329] rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-500/20 cursor-pointer">
                            ค้นหา
                        </button>
                        <button type="button" @click="resetSearch"
                            class="flex-1 py-3 text-sm font-semibold text-white bg-[#137FEC] rounded-xl hover:bg-blue-600 transition shadow-lg shadow-blue-500/20 cursor-pointer">
                            รีเซ็ต
                        </button>
                    </div>
                </form>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <!-- Left: Results -->
                <div class="lg:col-span-3 space-y-4">
                    <div class="flex items-center justify-between">
                        <h3 class="text-sm font-medium text-gray-500">
                            {{ isLoading ? 'กำลังค้นหา...' : `พบ ${routes.length} เส้นทาง` }}
                        </h3>
                    </div>

                    <div v-if="isLoading" class="flex items-center justify-center py-16">
                        <svg class="animate-spin w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                            <path class="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>

                    <div v-else-if="routes.length === 0"
                        class="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                        <div
                            class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                        </div>
                        <p class="text-gray-500">ไม่พบเส้นทางที่ค้นหา</p>
                    </div>

                    <!-- Route cards -->
                    <div v-for="route in routes" :key="route.id"
                        class="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer group"
                        @click="toggleDetails(route)">
                        <div class="p-5">
                            <!-- Route header -->
                            <div class="flex items-center gap-3 mb-4">
                                <div class="flex items-center gap-2 flex-1 min-w-0">
                                    <div class="flex items-center gap-1.5 text-sm">
                                        <span class="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                                        <span class="font-medium text-gray-800 truncate">{{ route.originName }}</span>
                                    </div>
                                    <svg class="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 5l7 7-7 7" />
                                    </svg>
                                    <div class="flex items-center gap-1.5 text-sm">
                                        <span class="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
                                        <span class="font-medium text-gray-800 truncate">{{ route.destinationName
                                            }}</span>
                                    </div>
                                </div>
                                <div class="text-right flex-shrink-0">
                                    <div class="text-lg font-bold text-emerald-600">฿{{ route.price }}</div>
                                    <div class="text-[10px] text-gray-400">ต่อที่นั่ง</div>
                                </div>
                            </div>

                            <!-- Driver info -->
                            <div class="flex items-center gap-3">
                                <img :src="route.driver.image" :alt="route.driver.name"
                                    class="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100" />
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-sm font-medium text-gray-800">{{ route.driver.name }}</span>
                                        <svg v-if="route.driver.isVerified" class="w-4 h-4 text-emerald-500"
                                            viewBox="0 0 24 24" fill="currentColor">
                                            <path fill-rule="evenodd"
                                                d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.49 4.49 0 01-1.307 3.498 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.07-.01l3.5-4.875z"
                                                clip-rule="evenodd" />
                                        </svg>
                                    </div>
                                    <div class="flex items-center gap-1 text-xs text-gray-400">
                                        <span class="text-yellow-400">★</span>
                                        <span>{{ route.driver.rating }}</span>
                                        <span>({{ route.driver.reviews }})</span>
                                    </div>
                                </div>
                                <div class="flex flex-wrap gap-1.5 items-center">
                                    <span :class="[
                                        'px-2 py-0.5 rounded-full text-[10px] font-medium',
                                        route.availableSeats > 2 ? 'bg-emerald-50 text-emerald-700' : route.availableSeats > 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                                    ]">
                                        {{ route.availableSeats > 0 ? `${route.availableSeats} ที่นั่ง` : 'เต็ม' }}
                                    </span>
                                </div>
                            </div>

                            <!-- Meta info -->
                            <div
                                class="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
                                <span class="flex items-center gap-1">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {{ route.date }}
                                </span>
                                <span class="flex items-center gap-1">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {{ route.departureTime }}
                                </span>
                                <span>{{ route.distanceText }}</span>
                                <span>{{ route.durationText }}</span>
                            </div>
                        </div>

                        <!-- Expanded details -->
                        <transition name="slide">
                            <div v-if="selectedRoute && selectedRoute.id === route.id"
                                class="border-t border-gray-100 bg-gray-50/50 p-5 space-y-4">
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <h5 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                            เส้นทาง</h5>
                                        <ul class="space-y-1.5 text-sm text-gray-600">
                                            <li class="flex items-start gap-2">
                                                <span
                                                    class="w-2 h-2 mt-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                                                <span>{{ route.originName }}<span v-if="route.originAddress"
                                                        class="text-gray-400"> — {{ route.originAddress }}</span></span>
                                            </li>
                                            <template v-if="route.stops?.length">
                                                <li v-for="(stop, idx) in route.stops" :key="idx"
                                                    class="flex items-start gap-2 pl-1">
                                                    <span
                                                        class="w-1.5 h-1.5 mt-1.5 rounded-full bg-amber-400 flex-shrink-0"></span>
                                                    <span class="text-gray-500">{{ stop }}</span>
                                                </li>
                                            </template>
                                            <li class="flex items-start gap-2">
                                                <span
                                                    class="w-2 h-2 mt-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                                                <span>{{ route.destinationName }}<span
                                                        v-if="route.destinationAddress" class="text-gray-400"> — {{
                                                            route.destinationAddress }}</span></span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h5 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                            รถยนต์</h5>
                                        <ul class="space-y-1 text-sm text-gray-600">
                                            <li v-for="detail in route.carDetails" :key="detail">{{ detail }}</li>
                                        </ul>
                                    </div>
                                </div>

                                <div v-if="route.conditions"
                                    class="bg-white rounded-xl p-3 border border-gray-100">
                                    <h5 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                        เงื่อนไข</h5>
                                    <p class="text-sm text-gray-600">{{ route.conditions }}</p>
                                </div>

                                <div v-if="route.photos?.length" class="grid grid-cols-3 gap-2">
                                    <img v-for="(photo, i) in route.photos.slice(0, 3)" :key="i" :src="photo"
                                        class="w-full aspect-video object-cover rounded-xl border border-gray-100" />
                                </div>

                                <div class="flex justify-end">
                                    <button @click.stop="openModal(route)" :disabled="route.availableSeats === 0"
                                        class="px-6 py-2.5 text-sm font-semibold text-white bg-[#1B9329] rounded-xl hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-green-500/20 transition cursor-pointer">
                                        จองที่นั่ง
                                    </button>
                                </div>
                            </div>
                        </transition>
                    </div>
                </div>

                <!-- Right: Map -->
                <div class="lg:col-span-2 relative">
                    <div class="sticky top-4">
                        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                            <div ref="mapContainer" class="w-full" style="height: 500px;"></div>
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
                                    <span class="text-gray-600">ตำแหน่งของคุณ</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Booking Modal (Grab-style) -->
        <transition name="modal-fade">
            <div v-if="showModal && bookingRoute"
                class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
                @click.self="closeModal">
                <div
                    class="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:w-[95%] sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                    <!-- Booking picker mode -->
                    <template v-if="bookingPickingTarget">
                        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h3 class="text-base font-semibold text-gray-800">
                                เลือก{{ bookingPickingTarget === 'pickup' ? 'จุดขึ้นรถ' : 'จุดลงรถ' }}
                            </h3>
                            <button @click="stopBookingPicker"
                                class="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div ref="bookingPickerMapEl" class="w-full" style="height: 60vh;"></div>
                        <div class="flex items-center justify-between p-4 border-t border-gray-100">
                            <span class="text-sm text-gray-500 truncate mr-2">{{ bookingPicked.name || '— ยังไม่เลือก —'
                                }}</span>
                            <button :disabled="!bookingPicked.name" @click="applyBookingPicked"
                                class="px-4 py-2 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 disabled:bg-gray-300 transition">
                                ใช้ตำแหน่งนี้
                            </button>
                        </div>
                    </template>

                    <!-- Normal booking form -->
                    <template v-else>
                        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h3 class="text-lg font-semibold text-gray-800">ยืนยันการจอง</h3>
                            <button @click="closeModal"
                                class="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div class="p-5 space-y-5">
                            <!-- Driver -->
                            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <img :src="bookingRoute.driver.image" class="w-12 h-12 rounded-full object-cover" />
                                <div>
                                    <div class="flex items-center gap-1.5">
                                        <span class="font-medium text-gray-800">{{ bookingRoute.driver.name }}</span>
                                        <svg v-if="bookingRoute.driver.isVerified" class="w-4 h-4 text-emerald-500"
                                            viewBox="0 0 24 24" fill="currentColor">
                                            <path fill-rule="evenodd"
                                                d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.49 4.49 0 01-1.307 3.498 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.07-.01l3.5-4.875z"
                                                clip-rule="evenodd" />
                                        </svg>
                                    </div>
                                    <div class="flex items-center gap-1 text-xs text-gray-400">
                                        <span class="text-yellow-400">★</span> {{ bookingRoute.driver.rating }} ({{
                                            bookingRoute.driver.reviews }} รีวิว)
                                    </div>
                                </div>
                            </div>

                            <!-- Route summary -->
                            <div class="flex items-center gap-3">
                                <div class="flex flex-col items-center gap-1">
                                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                    <div class="w-0.5 h-6 bg-gray-200"></div>
                                    <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                                </div>
                                <div class="flex-1 space-y-3">
                                    <div>
                                        <div class="text-sm font-medium text-gray-800">{{ bookingRoute.originName }}
                                        </div>
                                        <div class="text-xs text-gray-400">{{ bookingRoute.date }} · {{
                                            bookingRoute.departureTime }}</div>
                                    </div>
                                    <div>
                                        <div class="text-sm font-medium text-gray-800">{{
                                            bookingRoute.destinationName }}</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Booking options -->
                            <div class="space-y-3">
                                <div>
                                    <label class="block text-xs font-medium text-gray-500 mb-1">จำนวนที่นั่ง</label>
                                    <select v-model="bookingSeats"
                                        class="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-gray-50">
                                        <option v-for="s in bookingRoute.availableSeats" :key="s" :value="s">{{ s }}
                                            ที่นั่ง</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-gray-500 mb-1">จุดขึ้นรถ</label>
                                    <div class="relative">
                                        <input ref="pickupInputEl" v-model="pickupPoint" type="text"
                                            placeholder="พิมพ์หรือปักหมุด..."
                                            class="w-full pl-3 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-gray-50" />
                                        <button type="button" @click="startBookingPicker('pickup')"
                                            class="absolute right-1 top-1 p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition">
                                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                <path
                                                    d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-gray-500 mb-1">จุดลงรถ</label>
                                    <div class="relative">
                                        <input ref="dropoffInputEl" v-model="dropoffPoint" type="text"
                                            placeholder="พิมพ์หรือปักหมุด..."
                                            class="w-full pl-3 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-gray-50" />
                                        <button type="button" @click="startBookingPicker('dropoff')"
                                            class="absolute right-1 top-1 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                <path
                                                    d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Price summary -->
                            <div class="bg-emerald-50 rounded-xl p-4 space-y-2">
                                <div class="flex justify-between text-sm text-gray-600">
                                    <span>ราคาต่อที่นั่ง</span>
                                    <span>฿{{ bookingRoute.price }}</span>
                                </div>
                                <div class="flex justify-between text-sm text-gray-600">
                                    <span>จำนวน</span>
                                    <span>{{ bookingSeats }} ที่นั่ง</span>
                                </div>
                                <div class="flex justify-between pt-2 border-t border-emerald-200">
                                    <span class="font-semibold text-gray-800">ยอดรวม</span>
                                    <span class="text-lg font-bold text-emerald-600">฿{{ bookingTotalPrice }}</span>
                                </div>
                            </div>

                            <!-- Actions -->
                            <div class="flex gap-3">
                                <button @click="closeModal"
                                    class="flex-1 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition cursor-pointer">
                                    ยกเลิก
                                </button>
                                <button @click="confirmBooking"
                                    class="flex-[2] py-3 text-sm font-semibold text-white bg-[#1B9329] rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition cursor-pointer">
                                    ยืนยันการจอง
                                </button>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </transition>

        <!-- Place Picker Modal (for search) -->
        <transition name="modal-fade">
            <div v-if="showPlacePicker"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                @click.self="closePlacePicker">
                <div class="bg-white rounded-2xl w-[95%] max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
                    <div class="flex items-center justify-between px-7 py-5 border-b border-gray-100">
                        <h3 class="text-base font-semibold text-gray-800">
                            เลือก{{ pickingField === 'origin' ? 'จุดเริ่มต้น' : 'จุดปลายทาง' }}
                        </h3>
                        <button @click="closePlacePicker"
                            class="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition">
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
                            <span class="text-gray-500">{{ pickedPlace.name || '— แตะบนแผนที่ —' }}</span>
                        </div>
                        <div class="flex gap-2">
                            <button @click="closePlacePicker"
                                class="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                                ยกเลิก
                            </button>
                            <button :disabled="!pickedPlace.name" @click="applyPickedPlace"
                                class="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 disabled:bg-gray-300 transition">
                                ใช้ตำแหน่งนี้
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import { useToast } from '~/composables/useToast'
import { useAuth } from '~/composables/useAuth'
import { navigateTo } from '#app'
import { useRoute } from 'vue-router'
import { getProvinceFromPlace } from '~/utils/googleMaps'

const route = useRoute()


dayjs.locale('th')
dayjs.extend(buddhistEra)

const { $api } = useNuxtApp()
const { toast } = useToast()
const { token } = useAuth()
const config = useRuntimeConfig()
const GMAPS_CB = '__gmapsReady__'

// User real-time location
const userLocation = ref({ lat: null, lng: null })
let userLocationMarker = null
let userLocationCircle = null
let watchId = null

// Booking modal
const pickupInputEl = ref(null)
const dropoffInputEl = ref(null)
let pickupAutocomplete = null
let dropoffAutocomplete = null

const pickupData = ref({ lat: null, lng: null, placeId: null, address: null, name: null })
const dropoffData = ref({ lat: null, lng: null, placeId: null, address: null, name: null })

const bookingPickingTarget = ref(null)
const bookingPickerMapEl = ref(null)
let bookingPickerMap = null
let bookingPickerMarker = null
const bookingPicked = ref({ name: '', lat: null, lng: null, placeId: null, address: null })

// Search autocomplete
const originInputEl = ref(null)
const destinationInputEl = ref(null)
let originAutocomplete = null
let destinationAutocomplete = null

// Search place picker
const showPlacePicker = ref(false)
const pickingField = ref(null)
const placePickerMapEl = ref(null)
let placePickerMap = null
let placePickerMarker = null
const pickedPlace = ref({ name: '', lat: null, lng: null, province: null })

const headScripts = []
if (process.client && !window.google?.maps) {
    headScripts.push({
        key: 'gmaps',
        src: `https://maps.googleapis.com/maps/api/js?key=${config.public.googleMapsApiKey}&libraries=places,geometry&callback=${GMAPS_CB}`,
        async: true,
        defer: true,
    })
}

useHead({
    title: 'ค้นหาเส้นทาง - Drive To Survive',
    script: headScripts,
})

const searchForm = ref({ origin: '', destination: '', date: '', seats: '' })
const minDate = new Date().toISOString().split('T')[0]
const RADIUS_METERS = 500
const routes = ref([])
const selectedRoute = ref(null)
const isLoading = ref(false)

const mapContainer = ref(null)
let gmap = null
let activePolyline = null
let startMarker = null
let endMarker = null
let geocoder = null
let placesService = null
const mapReady = ref(false)
let stopMarkers = []

const showModal = ref(false)
const bookingRoute = ref(null)
const bookingSeats = ref(1)
const pickupPoint = ref('')
const dropoffPoint = ref('')

const bookingTotalPrice = computed(() => bookingRoute.value ? bookingSeats.value * bookingRoute.value.price : 0)

function cleanAddr(a) {
    return (a || '').replace(/,?\s*(Thailand|ไทย|ประเทศ)\s*$/i, '').replace(/\s{2,}/g, ' ').trim()
}

// ==================== Real-time Location ====================
function startLocationTracking() {
    if (!navigator.geolocation) return
    watchId = navigator.geolocation.watchPosition(
        (pos) => {
            userLocation.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
            updateUserLocationOnMap(pos.coords.latitude, pos.coords.longitude)
        },
        () => { },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )
}

function updateUserLocationOnMap(lat, lng) {
    if (!gmap) return
    const pos = new google.maps.LatLng(lat, lng)
    if (userLocationMarker) {
        userLocationMarker.setPosition(pos)
        userLocationCircle.setCenter(pos)
    } else {
        userLocationMarker = new google.maps.Marker({
            position: pos, map: gmap,
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#10b981', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 },
            zIndex: 999, title: 'ตำแหน่งของคุณ',
        })
        userLocationCircle = new google.maps.Circle({
            map: gmap, center: pos, radius: 100,
            fillColor: '#10b981', fillOpacity: 0.1, strokeColor: '#10b981', strokeOpacity: 0.3, strokeWeight: 1,
        })
    }
}

// ==================== Search ====================
async function ensureLatLng(field) {
    const metaKey = field === 'origin' ? '_originMeta' : '_destinationMeta'
    const meta = searchForm.value[metaKey]
    if (meta?.lat && meta?.lng) return { lat: meta.lat, lng: meta.lng }
    const text = searchForm.value[field]
    if (!text) return { lat: null, lng: null }
    const g = await geocodeText(text)
    if (g?.lat && g?.lng) {
        searchForm.value[metaKey] = { ...(meta || {}), lat: g.lat, lng: g.lng, placeId: g.placeId || null, fullAddress: g.address || null }
        return { lat: g.lat, lng: g.lng }
    }
    return { lat: null, lng: null }
}

async function handleSearch() {
    isLoading.value = true
    selectedRoute.value = null
    try {
        const q = { page: 1, limit: 20 }
        if (searchForm.value.date) {
            const d = dayjs(searchForm.value.date)
            q.dateFrom = d.startOf('day').toISOString()
            q.dateTo = d.endOf('day').toISOString()
        }
        if (searchForm.value.seats) q.seatsRequired = Number(searchForm.value.seats)

        let usedRadius = false
        if (searchForm.value.origin || searchForm.value._originMeta?.lat) {
            const { lat, lng } = await ensureLatLng('origin')
            if (lat != null) { q.startNearLat = lat; q.startNearLng = lng; usedRadius = true }
        }
        if (searchForm.value.destination || searchForm.value._destinationMeta?.lat) {
            const { lat, lng } = await ensureLatLng('destination')
            if (lat != null) { q.endNearLat = lat; q.endNearLng = lng; usedRadius = true }
        }
        
        // Province filtering
        if (searchForm.value._originMeta?.province) q.startProvince = searchForm.value._originMeta.province
        if (searchForm.value._destinationMeta?.province) q.endProvince = searchForm.value._destinationMeta.province

        if (usedRadius) q.radiusMeters = RADIUS_METERS

        const apiRes = await $api('/routes', { query: q })
        const raw = (apiRes?.data || apiRes || []).filter(r => r.status === 'AVAILABLE')

        routes.value = raw.map(route => {
            const wp = route.waypoints || {}
            const baseList = (Array.isArray(wp.used) && wp.used.length ? wp.used : Array.isArray(wp.requested) ? wp.requested : [])
            const orderedList = (Array.isArray(wp.optimizedOrder) && wp.optimizedOrder.length === baseList.length)
                ? wp.optimizedOrder.map(i => baseList[i]) : baseList

            const stops = orderedList.map(p => {
                const name = p?.name || ''
                const address = cleanAddr(p?.address || '')
                const fallback = (p?.lat != null && p?.lng != null) ? `(${p.lat.toFixed(6)}, ${p.lng.toFixed(6)})` : ''
                const title = name || fallback
                return address ? `${title} — ${address}` : title
            }).filter(Boolean)

            const stopsCoords = orderedList.map(p => (p && typeof p.lat === 'number' && typeof p.lng === 'number') ? { lat: p.lat, lng: p.lng, name: p.name || '', address: p.address || '' } : null).filter(Boolean)

            return {
                id: route.id,
                availableSeats: route.availableSeats,
                price: route.pricePerSeat,
                departureTime: dayjs(route.departureTime).format('HH:mm น.'),
                date: dayjs(route.departureTime).format('D MMMM BBBB'),
                start: route.startLocation,
                end: route.endLocation,
                originName: route.startLocation?.name || `(${route.startLocation.lat.toFixed(2)}, ${route.startLocation.lng.toFixed(2)})`,
                destinationName: route.endLocation?.name || `(${route.endLocation.lat.toFixed(2)}, ${route.endLocation.lng.toFixed(2)})`,
                originAddress: route.startLocation?.address ? cleanAddr(route.startLocation.address) : null,
                destinationAddress: route.endLocation?.address ? cleanAddr(route.endLocation.address) : null,
                driver: {
                    name: `${route.driver?.firstName || ''} ${route.driver?.lastName || ''}`.trim() || 'ไม่ระบุชื่อ',
                    image: route.driver?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(route.driver?.firstName || 'U')}&background=random&size=64`,
                    rating: 4.5,
                    reviews: Math.floor(Math.random() * 50) + 5,
                    isVerified: !!route.driver?.isVerified,
                },
                carDetails: route.vehicle ? [`${route.vehicle.vehicleModel} (${route.vehicle.vehicleType})`, ...(route.vehicle.amenities || [])] : ['ไม่มีข้อมูลรถ'],
                conditions: route.conditions,
                photos: route.vehicle?.photos || [],
                durationText: formatDuration(route.duration) || route.duration || '-',
                distanceText: formatDistance(route.distance) || route.distance || '-',
                polyline: route.routePolyline || null,
                stops,
                stopsCoords,
            }
        })

        await waitMapReady()
        const jobs = routes.value.map(async (r, i) => {
            const [o, d] = await Promise.all([reverseGeocode(r.start.lat, r.start.lng), reverseGeocode(r.end.lat, r.end.lng)])
            const oParts = await extractNameParts(o)
            const dParts = await extractNameParts(d)
            if (!r.start?.name && oParts.name) routes.value[i].originName = oParts.name
            if (!r.end?.name && dParts.name) routes.value[i].destinationName = dParts.name
        })
        await Promise.allSettled(jobs)
    } catch (e) {
        console.error('Failed to fetch routes:', e)
        routes.value = []
    } finally {
        isLoading.value = false
    }
}

// ==================== Map ====================
function reverseGeocode(lat, lng) {
    return new Promise(resolve => {
        if (!geocoder) return resolve(null)
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status !== 'OK' || !results?.length) return resolve(null)
            resolve(results[0])
        })
    })
}

async function extractNameParts(geocodeResult) {
    if (!geocodeResult) return { name: null, area: null }
    const comps = geocodeResult.address_components || []
    const byType = (t) => comps.find(c => c.types.includes(t))?.long_name
    const types = geocodeResult.types || []
    const isPoi = types.includes('point_of_interest') || types.includes('establishment') || types.includes('premise')

    let name = null
    if (isPoi && geocodeResult.place_id) {
        const poiName = await getPlaceName(geocodeResult.place_id)
        if (poiName) name = poiName
    }
    if (!name) {
        const streetNumber = byType('street_number')
        const route = byType('route')
        name = (streetNumber && route) ? `${streetNumber} ${route}` : (route || geocodeResult.formatted_address || null)
    }
    if (name) name = name.replace(/,?\s*(Thailand|ไทย|ประเทศ)\s*$/i, '')
    return { name }
}

const toggleDetails = (route) => {
    if (selectedRoute.value?.id === route.id) { selectedRoute.value = null; clearMapDrawing() }
    else { selectedRoute.value = route; updateMapForRoute(route) }
}

function waitMapReady() {
    return new Promise(resolve => {
        if (mapReady.value) return resolve(true)
        const t = setInterval(() => { if (mapReady.value) { clearInterval(t); resolve(true) } }, 50)
    })
}

function clearMapDrawing() {
    if (activePolyline) { activePolyline.setMap(null); activePolyline = null }
    if (startMarker) { startMarker.setMap(null); startMarker = null }
    if (endMarker) { endMarker.setMap(null); endMarker = null }
    stopMarkers.forEach(m => m.setMap(null))
    stopMarkers = []
}

async function updateMapForRoute(route) {
    if (!route) return
    await waitMapReady()
    if (!gmap) return
    clearMapDrawing()

    startMarker = new google.maps.Marker({
        position: { lat: route.start.lat, lng: route.start.lng }, map: gmap,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#10b981', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 },
    })
    endMarker = new google.maps.Marker({
        position: { lat: route.end.lat, lng: route.end.lng }, map: gmap,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#ef4444', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 },
    })

    if (route.stopsCoords?.length) {
        stopMarkers = route.stopsCoords.map((s, idx) => new google.maps.Marker({
            position: { lat: s.lat, lng: s.lng }, map: gmap,
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 6, fillColor: '#f59e0b', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
            title: s.name || `จุดแวะ ${idx + 1}`,
        }))
    }

    if (route.polyline && google.maps.geometry?.encoding) {
        const path = google.maps.geometry.encoding.decodePath(route.polyline)
        activePolyline = new google.maps.Polyline({ path, map: gmap, strokeColor: '#10b981', strokeOpacity: 0.8, strokeWeight: 5 })
        const bounds = new google.maps.LatLngBounds()
        path.forEach(p => bounds.extend(p))
        if (route.stopsCoords?.length) route.stopsCoords.forEach(s => bounds.extend(new google.maps.LatLng(s.lat, s.lng)))
        gmap.fitBounds(bounds)
    } else {
        const bounds = new google.maps.LatLngBounds()
        bounds.extend(new google.maps.LatLng(route.start.lat, route.start.lng))
        bounds.extend(new google.maps.LatLng(route.end.lat, route.end.lng))
        if (route.stopsCoords?.length) route.stopsCoords.forEach(s => bounds.extend(new google.maps.LatLng(s.lat, s.lng)))
        gmap.fitBounds(bounds)
    }
}

function getPlaceName(placeId) {
    return new Promise(resolve => {
        if (!placesService || !placeId) return resolve(null)
        placesService.getDetails({ placeId, fields: ['name'] }, (place, status) => {
            resolve(status === google.maps.places.PlacesServiceStatus.OK && place?.name ? place.name : null)
        })
    })
}

// ==================== Booking ====================
function openModal(route) {
    if (!token.value) return navigateTo('/login')
    if (route?.availableSeats > 0) {
        bookingRoute.value = route
        bookingSeats.value = 1
        pickupPoint.value = ''
        dropoffPoint.value = ''
        pickupData.value = { lat: null, lng: null, placeId: null, address: null, name: null }
        dropoffData.value = { lat: null, lng: null, placeId: null, address: null, name: null }
        bookingPickingTarget.value = null
        showModal.value = true
        nextTick(() => initBookingAutocomplete())
    }
}

function closeModal() {
    showModal.value = false
    setTimeout(() => { bookingRoute.value = null }, 300)
}

async function confirmBooking() {
    if (!bookingRoute.value) return
    if (pickupPoint.value && !pickupData.value.lat) {
        const g = await geocodeText(pickupPoint.value)
        if (g) pickupData.value = g
    }
    if (dropoffPoint.value && !dropoffData.value.lat) {
        const g = await geocodeText(dropoffPoint.value)
        if (g) dropoffData.value = g
    }
    if (!pickupData.value.lat || !dropoffData.value.lat) {
        toast.warning('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกจุดขึ้นรถและจุดลงรถ')
        return
    }

    try {
        await $api('/bookings', {
            method: 'POST',
            body: {
                routeId: bookingRoute.value.id,
                numberOfSeats: bookingSeats.value,
                pickupLocation: pickupData.value,
                dropoffLocation: dropoffData.value,
            },
        })
        closeModal()
        toast.success('จองสำเร็จ!', 'การจองได้รับการยืนยันแล้ว')
        setTimeout(() => navigateTo('/myTrip'), 1500)
    } catch (error) {
        const msg = String(error?.data?.message || error?.message || '')
        const is403 = error?.status === 403 || error?.statusCode === 403
        if (is403 && /ยืนยันบัตรประชาชน/.test(msg)) {
            toast.error('ต้องยืนยันตัวตน', 'คุณต้องยืนยันบัตรประชาชนก่อนจึงจะจองได้')
            setTimeout(() => navigateTo('/profile'), 1500)
        } else {
            toast.error('เกิดข้อผิดพลาด', error.data?.message || 'โปรดลองใหม่อีกครั้ง')
        }
    }
}

// ==================== Map Init ====================
const initializeMap = () => {
    if (!mapContainer.value || gmap) return
    const center = userLocation.value.lat ? { lat: userLocation.value.lat, lng: userLocation.value.lng } : { lat: 13.7563, lng: 100.5018 }
    gmap = new google.maps.Map(mapContainer.value, {
        center, zoom: userLocation.value.lat ? 14 : 6,
        mapTypeControl: false, streetViewControl: false, fullscreenControl: true,
        styles: [
            { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        ],
    })
    geocoder = new google.maps.Geocoder()
    placesService = new google.maps.places.PlacesService(gmap)
    mapReady.value = true
    if (userLocation.value.lat) updateUserLocationOnMap(userLocation.value.lat, userLocation.value.lng)
}

function initAutocomplete() {
    if (!originInputEl.value || !destinationInputEl.value) return
    if (!window.google?.maps?.places) return
    const commonOpts = { fields: ['place_id', 'name', 'formatted_address', 'geometry'] }

    originAutocomplete = new google.maps.places.Autocomplete(originInputEl.value, { ...commonOpts, types: ['geocode', 'establishment'] })
    originAutocomplete.addListener('place_changed', () => {
        const p = originAutocomplete.getPlace()
        if (!p) return
        searchForm.value.origin = p.name || p.formatted_address || searchForm.value.origin
        searchForm.value._originMeta = { 
            placeId: p.place_id || null, 
            fullAddress: p.formatted_address || null, 
            lat: p.geometry?.location?.lat?.() ?? null, 
            lng: p.geometry?.location?.lng?.() ?? null,
            province: getProvinceFromPlace(p)
        }
    })

    destinationAutocomplete = new google.maps.places.Autocomplete(destinationInputEl.value, { ...commonOpts, types: ['geocode', 'establishment'] })
    destinationAutocomplete.addListener('place_changed', () => {
        const p = destinationAutocomplete.getPlace()
        if (!p) return
        searchForm.value.destination = p.name || p.formatted_address || searchForm.value.destination
        searchForm.value._destinationMeta = { 
            placeId: p.place_id || null, 
            fullAddress: p.formatted_address || null, 
            lat: p.geometry?.location?.lat?.() ?? null, 
            lng: p.geometry?.location?.lng?.() ?? null,
            province: getProvinceFromPlace(p)
        }
    })
}

// ==================== Place Picker (Search) ====================
function openPlacePicker(field) {
    pickingField.value = field
    pickedPlace.value = { name: '', lat: null, lng: null, province: null }
    showPlacePicker.value = true
    nextTick(() => {
        const meta = field === 'origin' ? searchForm.value._originMeta : searchForm.value._destinationMeta
        const center = (meta?.lat && meta?.lng) ? { lat: meta.lat, lng: meta.lng } : userLocation.value.lat ? { lat: userLocation.value.lat, lng: userLocation.value.lng } : { lat: 13.7563, lng: 100.5018 }
        placePickerMap = new google.maps.Map(placePickerMapEl.value, { center, zoom: meta?.lat ? 14 : userLocation.value.lat ? 14 : 6, mapTypeControl: false, streetViewControl: false, fullscreenControl: false })
        placePickerMap.addListener('click', (e) => { setPickerMarker(e.latLng); resolvePicked(e.latLng) })
    })
}

function setPickerMarker(latlng) {
    if (placePickerMarker) { placePickerMarker.setPosition(latlng); return }
    placePickerMarker = new google.maps.Marker({ position: latlng, map: placePickerMap, draggable: true })
    placePickerMarker.addListener('dragend', (e) => resolvePicked(e.latLng))
}

async function resolvePicked(latlng) {
    const lat = latlng.lat(), lng = latlng.lng()
    const geocodeRes = await new Promise(resolve => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results?.length) resolve(results[0]); else resolve(null)
        })
    })
    let name = ''
    let province = null
    if (geocodeRes) {
        const parts = await extractNameParts(geocodeRes)
        name = parts.name || ''
        province = getProvinceFromPlace(geocodeRes)
    }
    if (!name || isPlusCode(name)) {
        const poi = await findNearestPoi(lat, lng, 120)
        if (poi?.name) name = poi.name
        else if (geocodeRes?.formatted_address) name = cleanAddr(geocodeRes.formatted_address)
    }
    pickedPlace.value = { name, lat, lng, province }
}

function applyPickedPlace() {
    if (!pickingField.value || !pickedPlace.value.name) return
    if (pickingField.value === 'origin') {
        searchForm.value.origin = pickedPlace.value.name
        searchForm.value._originMeta = { placeId: null, fullAddress: null, lat: pickedPlace.value.lat, lng: pickedPlace.value.lng, province: pickedPlace.value.province }
    } else {
        searchForm.value.destination = pickedPlace.value.name
        searchForm.value._destinationMeta = { placeId: null, fullAddress: null, lat: pickedPlace.value.lat, lng: pickedPlace.value.lng, province: pickedPlace.value.province }
    }
    closePlacePicker()
}

function closePlacePicker() {
    showPlacePicker.value = false; pickingField.value = null; placePickerMarker = null; placePickerMap = null
}

// ==================== Booking Autocomplete & Picker ====================
function initBookingAutocomplete() {
    if (!window.google?.maps?.places) return
    const opts = { fields: ['place_id', 'name', 'formatted_address', 'geometry'], types: ['geocode', 'establishment'] }

    if (pickupInputEl.value) {
        pickupAutocomplete?.unbindAll?.()
        pickupAutocomplete = new google.maps.places.Autocomplete(pickupInputEl.value, opts)
        pickupAutocomplete.addListener('place_changed', () => {
            const p = pickupAutocomplete.getPlace()
            if (!p) return
            pickupPoint.value = p.name || p.formatted_address || pickupPoint.value
            pickupData.value = { lat: p.geometry?.location?.lat?.() ?? null, lng: p.geometry?.location?.lng?.() ?? null, placeId: p.place_id || null, address: p.formatted_address || null, name: p.name || null }
        })
    }
    if (dropoffInputEl.value) {
        dropoffAutocomplete?.unbindAll?.()
        dropoffAutocomplete = new google.maps.places.Autocomplete(dropoffInputEl.value, opts)
        dropoffAutocomplete.addListener('place_changed', () => {
            const p = dropoffAutocomplete.getPlace()
            if (!p) return
            dropoffPoint.value = p.name || p.formatted_address || dropoffPoint.value
            dropoffData.value = { lat: p.geometry?.location?.lat?.() ?? null, lng: p.geometry?.location?.lng?.() ?? null, placeId: p.place_id || null, address: p.formatted_address || null, name: p.name || null }
        })
    }
}

function startBookingPicker(target) {
    bookingPickingTarget.value = target
    bookingPicked.value = { name: '', lat: null, lng: null, placeId: null, address: null }
    nextTick(() => {
        const base = target === 'pickup' ? pickupData.value : dropoffData.value
        const center = (base.lat && base.lng) ? { lat: base.lat, lng: base.lng } : userLocation.value.lat ? { lat: userLocation.value.lat, lng: userLocation.value.lng } : { lat: 13.7563, lng: 100.5018 }
        bookingPickerMap = new google.maps.Map(bookingPickerMapEl.value, { center, zoom: base.lat ? 15 : userLocation.value.lat ? 14 : 6, mapTypeControl: false, streetViewControl: false, fullscreenControl: false })
        bookingPickerMap.addListener('click', async (e) => { setBookingPickerMarker(e.latLng); await resolveBookingPicked(e.latLng) })
    })
}

function stopBookingPicker() { bookingPickingTarget.value = null; bookingPickerMap = null; bookingPickerMarker = null }

function setBookingPickerMarker(latlng) {
    if (bookingPickerMarker) return bookingPickerMarker.setPosition(latlng)
    bookingPickerMarker = new google.maps.Marker({ position: latlng, map: bookingPickerMap, draggable: true })
    bookingPickerMarker.addListener('dragend', (e) => resolveBookingPicked(e.latLng))
}

async function resolveBookingPicked(latlng) {
    const lat = latlng.lat(), lng = latlng.lng()
    const geocodeRes = await new Promise(resolve => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results?.length) resolve(results[0]); else resolve(null)
        })
    })
    let name = '', placeId = geocodeRes?.place_id || null, address = geocodeRes?.formatted_address || null
    if (geocodeRes) { const parts = await extractNameParts(geocodeRes); name = parts.name || '' }
    if (!name) {
        const poi = await findNearestPoi(lat, lng, 120)
        if (poi?.place_id) {
            placeId = poi.place_id
            const details = await new Promise(resolve => {
                placesService.getDetails({ placeId: poi.place_id, fields: ['name', 'formatted_address'] }, (pl, st) => resolve(st === google.maps.places.PlacesServiceStatus.OK ? pl : null))
            })
            name = details?.name || poi.name || name
            address = details?.formatted_address || address
        }
    }
    if (address) address = cleanAddr(address)
    bookingPicked.value = { name, lat, lng, placeId, address }
}

function applyBookingPicked() {
    if (!bookingPickingTarget.value || !bookingPicked.value.name) return
    const data = { lat: bookingPicked.value.lat, lng: bookingPicked.value.lng, placeId: bookingPicked.value.placeId, address: bookingPicked.value.address, name: bookingPicked.value.name }
    if (bookingPickingTarget.value === 'pickup') { pickupPoint.value = data.name || ''; pickupData.value = data }
    else { dropoffPoint.value = data.name || ''; dropoffData.value = data }
    stopBookingPicker()
}

function geocodeText(text) {
    return new Promise(resolve => {
        if (!text) return resolve(null)
        geocoder.geocode({ address: text }, async (results, status) => {
            if (status !== 'OK' || !results?.length) return resolve(null)
            const r = results[0]
            const lat = r.geometry?.location?.lat?.()
            const lng = r.geometry?.location?.lng?.()
            const parts = await extractNameParts(r)
            resolve({ lat, lng, placeId: r.place_id || null, address: cleanAddr(r.formatted_address || ''), name: parts.name || null })
        })
    })
}

function resetSearch() {
    searchForm.value.origin = ''
    searchForm.value.destination = ''
    searchForm.value.date = ''
    searchForm.value.seats = ''
    delete searchForm.value._originMeta
    delete searchForm.value._destinationMeta
    selectedRoute.value = null
    handleSearch()
}

// ==================== Helpers ====================
function isPlusCode(text) { return text ? /^[A-Z0-9]{4,}\+[A-Z0-9]{2,}/i.test(text.trim()) : false }

function findNearestPoi(lat, lng, radius = 100) {
    return new Promise(resolve => {
        if (!placesService) return resolve(null)
        placesService.nearbySearch({ location: { lat, lng }, radius }, (results, status) => {
            resolve(status === google.maps.places.PlacesServiceStatus.OK && results?.length ? results[0] : null)
        })
    })
}

function formatDistance(input) {
    if (typeof input !== 'string') return input
    const parts = input.split('+')
    if (parts.length <= 1) return input
    let meters = 0
    for (const seg of parts) {
        const n = parseFloat(seg.replace(/[^\d.]/g, ''))
        if (Number.isNaN(n)) continue
        if (/กม/.test(seg)) meters += n * 1000
        else if (/เมตร|ม\./.test(seg)) meters += n
        else meters += n
    }
    if (meters >= 1000) { const km = Math.round((meters / 1000) * 10) / 10; return `${(km % 1 === 0 ? km.toFixed(0) : km)} กม.` }
    return `${Math.round(meters)} ม.`
}

function formatDuration(input) {
    if (typeof input !== 'string') return input
    const parts = input.split('+')
    if (parts.length <= 1) return input
    let minutes = 0
    for (const seg of parts) {
        const n = parseFloat(seg.replace(/[^\d.]/g, ''))
        if (Number.isNaN(n)) continue
        if (/ชม/.test(seg)) minutes += n * 60
        else minutes += n
    }
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    return h ? (m ? `${h} ชม. ${m} นาที` : `${h} ชม.`) : `${m} นาที`
}

// ==================== Lifecycle ====================
function initAll() {
    initializeMap()
    initAutocomplete()
    startLocationTracking()
    handleSearch()
}

onMounted(() => {
    // 1. Parse query params first
    if (route.query.from) {
        searchForm.value.origin = route.query.from
        if (route.query.fromLat && route.query.fromLng) {
            searchForm.value._originMeta = {
                lat: parseFloat(route.query.fromLat),
                lng: parseFloat(route.query.fromLng),
                name: route.query.from,
                fullAddress: route.query.from,
                province: route.query.fromProvince || null
            }
        }
    }
    if (route.query.to) {
        searchForm.value.destination = route.query.to
        if (route.query.toLat && route.query.toLng) {
            searchForm.value._destinationMeta = {
                lat: parseFloat(route.query.toLat),
                lng: parseFloat(route.query.toLng),
                name: route.query.to,
                fullAddress: route.query.to,
                province: route.query.toProvince || null
            }
        }
    }
    if (route.query.date) searchForm.value.date = route.query.date
    if (route.query.seat) searchForm.value.seats = route.query.seat

    // 2. Initialize
    if (window.google?.maps) { initAll(); return }
    window[GMAPS_CB] = () => {
        try { delete window[GMAPS_CB] } catch { }
        initAll()
    }
})

onUnmounted(() => {
    if (watchId != null) navigator.geolocation.clearWatch(watchId)
})
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
    transition: all 0.3s ease;
    max-height: 600px;
    overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
    max-height: 0;
    opacity: 0;
}

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
