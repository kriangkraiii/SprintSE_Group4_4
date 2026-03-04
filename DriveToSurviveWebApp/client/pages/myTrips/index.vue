<template>
    <div class="min-h-screen bg-surface pb-12">
        <!-- Header -->
        <div class="relative h-[280px] w-full">
            <img src="/images/bgmytrip.png" alt="My Trips Background" class="object-cover w-full h-full" />
            <div class="absolute inset-0 flex flex-col justify-center px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <h2 class="text-4xl font-bold text-white drop-shadow-md -ml-4">การเดินทางของฉัน</h2>
                <p class="mt-2 text-white/90 drop-shadow-sm">จัดการและติดตามการเดินทางทั้งหมดของคุณ</p>
            </div>
        </div>

        <!-- Controls: Role Toggle + Status Filter -->
        <div class="relative px-4 mx-auto -mt-8 max-w-7xl sm:px-6 lg:px-8">
            <div class="p-4 mb-8 bg-white border border-slate-200 rounded-xl shadow-lg">
                <div class="flex flex-wrap items-center gap-4">
                    <!-- Role Toggle -->
                    <div class="inline-flex bg-slate-100 rounded-lg p-1">
                        <button @click="switchRole('passenger')"
                            :class="['px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-2',
                            role === 'passenger' ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-200']">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                            ผู้โดยสาร
                        </button>
                        <button @click="switchRole('driver')"
                            :class="['px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-2',
                            role === 'driver' ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-200']">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h.01M12 7h.01M16 7h.01M3 12h18M5 7h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z"/></svg>
                            คนขับ
                        </button>
                    </div>

                    <!-- Status Filter Dropdown -->
                    <div class="relative flex-1 min-w-[200px] max-w-xs">
                        <select v-model="statusFilter"
                            class="w-full appearance-none px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 cursor-pointer focus:ring-2 focus:ring-primary/30 focus:border-primary transition">
                            <option v-for="opt in statusOptions.filter(o => o.value !== 'reviews')" :key="opt.value" :value="opt.value">
                                {{ opt.label }} ({{ getCount(opt.value) }})
                            </option>
                        </select>
                        <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                    </div>

                    <!-- Reviews Button -->
                    <button @click="statusFilter = 'reviews'"
                        :class="['px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
                            statusFilter === 'reviews' ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-600 border border-slate-200']">
                        ⭐ รีวิวของฉัน
                        <span v-if="getCount('reviews') > 0"
                            :class="['text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                                statusFilter === 'reviews' ? 'bg-white/30 text-white' : 'bg-amber-100 text-amber-700']">
                            {{ getCount('reviews') }}
                        </span>
                    </button>

                    <!-- Count Badge -->
                    <span class="ml-auto text-sm text-slate-500">
                        {{ statusFilter === 'reviews' ? (myReviews.length + pendingBookings.length) + ' รีวิว' : displayedItems.length + ' รายการ' }}
                    </span>
                </div>
            </div>

            <!-- Main Content -->
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div class="lg:col-span-2">
                    <div class="overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 class="text-lg font-semibold text-[#383838]">
                                {{ statusFilter === 'reviews' ? '⭐ รีวิวของฉัน' : role === 'passenger' ? 'รายการเดินทาง' : (statusFilter === 'myRoutes' ? 'เส้นทางของฉัน' : 'รายการคำขอจอง') }}
                            </h3>
                        </div>

                        <div v-if="isLoading" class="divide-y divide-slate-100">
                            <div v-for="i in 3" :key="i" class="p-6 animate-pulse">
                                <div class="flex items-center gap-3 mb-3">
                                    <div class="h-5 bg-slate-200 rounded w-2/3"></div>
                                    <div class="h-5 bg-slate-100 rounded-full w-20 ml-auto"></div>
                                </div>
                                <div class="h-3 bg-slate-100 rounded w-1/2 mb-2"></div>
                                <div class="h-3 bg-slate-100 rounded w-1/3 mb-3"></div>
                                <div class="flex gap-2">
                                    <div class="h-8 bg-slate-100 rounded-lg w-20"></div>
                                    <div class="h-8 bg-slate-100 rounded-lg w-24"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Driver: My Routes Section -->
                        <div v-else-if="role === 'driver' && statusFilter === 'myRoutes'" class="divide-y divide-slate-100">
                            <div v-if="myRoutes.length === 0" class="p-12 text-center text-slate-400">
                                <p>ยังไม่มีเส้นทางที่คุณสร้าง</p>
                            </div>
                            <div v-for="route in myRoutes" :key="route.id"
                                class="p-6 transition-colors duration-200 cursor-pointer trip-card hover:bg-slate-50"
                                @click="toggleDetails(route.id)">
                                <!-- Route Card -->
                                <div class="flex items-start justify-between mb-3">
                                    <div class="flex-1">
                                        <div class="flex items-center justify-between">
                                            <h4 class="text-lg font-semibold text-primary">{{ route.origin }} → {{ route.destination }}</h4>
                                            <span class="status-badge" :class="getStatusBadge(route.status).class">
                                                {{ getStatusBadge(route.status).label }}
                                            </span>
                                        </div>
                                        <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-500">
                                            <span>📅 {{ route.date }} {{ route.time }}</span>
                                            <span>⏱ {{ route.durationText }}</span>
                                            <span>📏 {{ route.distanceText }}</span>
                                        </div>
                                        <div class="mt-1 text-sm text-slate-500">
                                            <span class="font-medium">ที่นั่งว่าง:</span> {{ route.availableSeats }}
                                            <span class="mx-2 text-slate-200">|</span>
                                            <span class="font-medium">ราคาต่อที่นั่ง:</span> {{ route.pricePerSeat }} บาท
                                        </div>
                                    </div>
                                </div>

                                <!-- Expanded Details -->
                                <div v-if="selectedId === route.id" class="pt-4 mt-4 mb-5 duration-300 border-t border-slate-200 animate-in slide-in-from-top">
                                    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <h5 class="mb-2 font-medium text-primary">รายละเอียดเส้นทาง</h5>
                                            <ul class="space-y-1 text-sm text-slate-500">
                                                <li>• จุดเริ่มต้น: <span class="font-medium text-primary">{{ route.origin }}</span><span v-if="route.originAddress"> — {{ route.originAddress }}</span></li>
                                                <template v-if="route.stops && route.stops.length">
                                                    <li class="mt-2 text-primary">• จุดแวะระหว่างทาง ({{ route.stops.length }} จุด):</li>
                                                    <li v-for="(stop, idx) in route.stops" :key="idx">  - จุดแวะ {{ idx + 1 }}: {{ stop }}</li>
                                                </template>
                                                <li class="mt-1">• จุดปลายทาง: <span class="font-medium text-primary">{{ route.destination }}</span><span v-if="route.destinationAddress"> — {{ route.destinationAddress }}</span></li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h5 class="mb-2 font-medium text-primary">รายละเอียดรถ</h5>
                                            <ul class="space-y-1 text-sm text-slate-500">
                                                <li v-for="detail in route.carDetails" :key="detail">• {{ detail }}</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div class="mt-4 space-y-4">
                                        <div v-if="route.conditions">
                                            <h5 class="mb-2 font-medium text-primary">เงื่อนไขการเดินทาง</h5>
                                            <p class="p-3 text-sm text-primary border border-slate-200 rounded-md bg-slate-50">{{ route.conditions }}</p>
                                        </div>
                                        <div v-if="route.photos && route.photos.length > 0">
                                            <h5 class="mb-2 font-medium text-primary">รูปภาพรถยนต์</h5>
                                            <div class="grid grid-cols-3 gap-2 mt-2">
                                                <div v-for="(photo, index) in route.photos.slice(0, 3)" :key="index">
                                                    <img :src="photo" alt="Vehicle photo" class="object-cover w-full transition-opacity rounded-lg shadow-sm cursor-pointer aspect-video hover:opacity-90" />
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="route.passengers && route.passengers.length">
                                            <h5 class="mb-2 font-medium text-primary">ผู้โดยสาร ({{ route.passengers.length }} คน)</h5>
                                            <div class="space-y-3">
                                                <div v-for="p in route.passengers" :key="p.id" class="flex items-center space-x-3">
                                                    <img :src="p.image" :alt="p.name" class="object-cover w-12 h-12 rounded-full" />
                                                    <div class="flex-1">
                                                        <div class="flex items-center">
                                                            <span class="font-medium text-primary">{{ p.name }}</span>
                                                            <svg v-if="p.isVerified" class="w-4 h-4 ml-1.5 text-cta" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12c0 1.357-.6 2.573-1.549 3.397a4.49 4.49 0 01-1.307 3.498 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.07-.01l3.5-4.875z" clip-rule="evenodd"/></svg>
                                                        </div>
                                                        <div class="text-sm text-slate-500">ที่นั่ง: {{ p.seats }}
                                                            <span v-if="p.email" class="mx-2 text-slate-200">|</span>
                                                            <a v-if="p.email" :href="`mailto:${p.email}`" class="text-cta hover:underline" @click.stop>{{ p.email }}</a>
                                                        </div>
                                                        <p v-if="p.rawPickup?.name" class="text-xs text-slate-400 mt-0.5">📍 จุดรับ: {{ p.rawPickup.name }}</p>
                                                    </div>
                                                    <a v-if="p.rawPickup?.lat" :href="getPickupNavUrl(p.rawPickup)" target="_blank" @click.stop
                                                        class="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-300 rounded-md hover:bg-green-100 transition flex items-center gap-1 flex-shrink-0">
                                                        📍 นำทางไปรับ
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Waypoint Panel -->
                                <transition name="modal-fade">
                                    <div v-if="addingWaypointRouteId === route.id" class="mt-4 p-4 bg-amber-50/80 border border-amber-200 rounded-xl" @click.stop>
                                        <div class="flex items-center justify-between mb-3">
                                            <h5 class="text-sm font-semibold text-amber-800 flex items-center gap-2">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                                เพิ่มจุดแวะระหว่างทาง
                                            </h5>
                                            <button @click.stop="cancelAddWaypoint" class="p-1 rounded-lg hover:bg-amber-200/50 text-amber-600 cursor-pointer transition">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                                            </button>
                                        </div>
                                        <div class="flex gap-2">
                                            <input ref="waypointInputRef" type="text" v-model="newWaypointText" placeholder="ค้นหาสถานที่..."
                                                class="flex-1 px-3 py-2.5 text-sm border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white placeholder:text-amber-400" />
                                            <button @click.stop="submitWaypoint(route.id)" :disabled="!newWaypointMeta.lat || isSubmittingWaypoint"
                                                class="px-4 py-2.5 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm transition cursor-pointer">
                                                เพิ่ม
                                            </button>
                                        </div>
                                        <p v-if="newWaypointMeta.lat" class="text-[10px] text-amber-600 mt-1.5 flex items-center gap-1">
                                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                                            {{ newWaypointText || 'เลือกสถานที่แล้ว' }}
                                        </p>
                                    </div>
                                </transition>

                                <!-- Route Actions -->
                                <div class="flex flex-wrap justify-end gap-2" :class="{ 'mt-4': selectedId !== route.id }">
                                    <!-- Trip Lifecycle Buttons -->
                                    <button v-if="['available', 'full'].includes(route.status)"
                                        @click.stop="openConfirmModal({ id: route.id, _type: 'route' }, 'startTrip')"
                                        class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition cursor-pointer flex items-center gap-1.5">
                                        🚗 เริ่มเดินทาง
                                    </button>
                                    <button v-if="route.status === 'in_transit'"
                                        @click.stop="openConfirmModal({ id: route.id, _type: 'route' }, 'endTrip')"
                                        class="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1.5">
                                        ✅ สิ้นสุดเดินทาง
                                    </button>
                                    <button v-if="route.status === 'available' && addingWaypointRouteId !== route.id"
                                        @click.stop="startAddWaypoint(route.id)"
                                        class="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 transition cursor-pointer flex items-center gap-1.5">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                                        เพิ่มจุดแวะ
                                    </button>
                                    <a v-if="route.rawStart" :href="getGoogleMapsNavUrl(route.rawStart, route.rawEnd)" target="_blank" @click.stop
                                        class="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition cursor-pointer flex items-center gap-1.5">
                                        🗺️ นำทาง Google Maps
                                    </a>
                                    <button v-if="route.passengers && route.passengers.length" @click.stop="openChatForRoute(route)" :disabled="isChatLoading"
                                        class="px-4 py-2 text-sm text-white transition duration-200 bg-cta rounded-md hover:bg-cta-hover cursor-pointer disabled:opacity-50">
                                        {{ isChatLoading ? '⏳ กำลังเปิด...' : '💬 แชทกลุ่ม' }}
                                    </button>
                                    <NuxtLink :to="`/tracking/${route.id}`" @click.stop
                                        class="px-4 py-2 text-sm text-white transition duration-200 bg-primary rounded-md hover:bg-primary/90">
                                        📍 ติดตามตำแหน่ง
                                    </NuxtLink>
                                    <NuxtLink v-if="['available', 'full'].includes(route.status)" :to="`/myRoute/${route.id}/edit`"
                                        class="px-4 py-2 text-sm text-white transition duration-200 bg-cta rounded-md hover:bg-cta-hover" @click.stop>
                                        แก้ไขเส้นทาง
                                    </NuxtLink>
                                </div>
                            </div>
                        </div>

                        <!-- Reviews Section -->
                        <div v-else-if="statusFilter === 'reviews'" class="p-6">
                            <!-- Pending Reviews -->
                            <div v-if="pendingBookings.length" class="mb-6 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                <!-- Header -->
                                <div class="px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100/60">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                            <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                        </div>
                                        <div>
                                            <h4 class="text-base font-semibold text-slate-800">รอเขียนรีวิว</h4>
                                            <p class="text-xs text-slate-500">คุณมี {{ pendingBookings.length }} ทริปที่ยังไม่ได้รีวิว</p>
                                        </div>
                                    </div>
                                </div>
                                <!-- Cards -->
                                <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div v-for="booking in pendingBookings" :key="booking.id"
                                        class="group relative p-4 bg-white rounded-xl border border-slate-100 hover:border-amber-200 hover:shadow-md transition-all duration-200 cursor-pointer">
                                        <!-- Route timeline -->
                                        <div class="flex items-start gap-3 mb-3">
                                            <div class="flex flex-col items-center gap-0.5 pt-0.5">
                                                <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100"></div>
                                                <div class="w-0.5 h-6 bg-slate-200"></div>
                                                <div class="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-100"></div>
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <p class="text-sm font-medium text-slate-800 truncate">{{ booking.route?.startLocation?.name || 'ต้นทาง' }}</p>
                                                <div class="h-3"></div>
                                                <p class="text-sm font-medium text-slate-800 truncate">{{ booking.route?.endLocation?.name || 'ปลายทาง' }}</p>
                                            </div>
                                        </div>
                                        <!-- Driver info + CTA -->
                                        <div class="flex items-center justify-between pt-3 border-t border-slate-50">
                                            <div class="flex items-center gap-2">
                                                <div class="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
                                                    <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                                </div>
                                                <span class="text-xs text-slate-500">{{ booking.route?.driver?.firstName || 'ไม่ระบุ' }}</span>
                                            </div>
                                            <NuxtLink :to="`/reviews/create?bookingId=${booking.id}`"
                                                class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-xl hover:bg-amber-600 shadow-sm hover:shadow transition-all duration-200" @click.stop>
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                                                เขียนรีวิว
                                            </NuxtLink>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Review Sub-tabs -->
                            <div class="flex gap-2 mb-6">
                                <button @click="reviewTab = 'my'"
                                    :class="['flex-1 text-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
                                        reviewTab === 'my' ? 'bg-primary text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100']">
                                    รีวิวที่เขียน ({{ myReviews.length }})
                                </button>
                                <button @click="reviewTab = 'received'"
                                    :class="['flex-1 text-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
                                        reviewTab === 'received' ? 'bg-primary text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100']">
                                    รีวิวที่ได้รับ ({{ driverReviewsList.length }})
                                </button>
                                <!-- Private Feedback tab — DRIVER only -->
                                <button v-if="isDriver" @click="reviewTab = 'private'"
                                    :class="['flex-1 text-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
                                        reviewTab === 'private' ? 'bg-primary text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100']">
                                    ความเห็นส่วนตัว
                                    <span v-if="privateFeedbacks.length"
                                        class="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full"
                                        :class="reviewTab === 'private' ? 'bg-white text-slate-700' : 'bg-slate-200 text-slate-700'">
                                        {{ privateFeedbacks.length }}
                                    </span>
                                </button>
                            </div>

                            <!-- Written Reviews -->
                            <div v-if="reviewTab === 'my'">
                                <div v-if="isReviewLoading" class="p-12 text-center text-slate-400">
                                    <p>กำลังโหลดรีวิว...</p>
                                </div>
                                <div v-else-if="myReviews.length === 0" class="p-12 text-center">
                                    <svg class="w-16 h-16 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                    <p class="text-slate-500">ยังไม่ได้เขียนรีวิว</p>
                                </div>
                                <div v-else class="space-y-4">
                                    <ReviewCard v-for="review in myReviews" :key="review.id" :review="review" />
                                </div>
                            </div>

                            <!-- Received Reviews -->
                            <div v-if="reviewTab === 'received'">
                                <div class="p-6 bg-white border border-slate-200 rounded-xl text-center">
                                    <div v-if="driverStats" class="mb-6">
                                        <StarRating :modelValue="driverStats.avgRating" :readonly="true" size="lg" :showValue="true" />
                                        <p class="text-sm text-slate-500 mt-2">{{ driverStats.totalReviews }} รีวิว</p>
                                    </div>
                                    <div v-if="driverReviewsList.length === 0" class="text-slate-400">
                                        <p>ยังไม่มีรีวิว</p>
                                    </div>
                                    <div v-else class="space-y-4 text-left">
                                        <ReviewCard v-for="review in driverReviewsList" :key="review.id" :review="review" :showPrivate="true" />
                                    </div>
                                </div>
                            </div>

                            <!-- 🔒 Private Feedback Inbox (Driver only) -->
                            <div v-if="reviewTab === 'private' && isDriver">
                                <div v-if="isPrivateLoading" class="p-12 text-center text-slate-400">
                                    <p>กำลังโหลด...</p>
                                </div>

                                <div v-else-if="privateFeedbacks.length === 0"
                                    class="p-12 bg-white border border-slate-200 rounded-xl text-center">
                                    <p class="text-slate-500 font-medium">ยังไม่มีความเห็นส่วนตัว</p>
                                    <p class="text-xs text-slate-400 mt-1">ผู้โดยสารสามารถฝากข้อความถึงคุณโดยตรงตอนเขียนรีวิว</p>
                                </div>

                                <div v-else class="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                                    <div v-for="review in privateFeedbacks" :key="review.id" class="flex items-start gap-3 px-5 py-4">
                                        <div class="shrink-0 mt-0.5 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-500">
                                            {{ review.isAnonymous ? '?' : (review.displayName || 'P').charAt(0).toUpperCase() }}
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center justify-between gap-2 mb-1">
                                                <span class="text-sm font-medium text-slate-700">
                                                    {{ review.isAnonymous ? 'ผู้โดยสารนิรนาม' : (review.displayName || 'ผู้โดยสาร') }}
                                                </span>
                                                <span class="text-xs text-slate-400 shrink-0">{{ formatPrivateDate(review.createdAt) }}</span>
                                            </div>
                                            <p class="text-sm text-slate-600 leading-relaxed">{{ review.privateFeedback }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Generic Card List (Passenger bookings OR Driver booking requests) -->
                        <div v-else class="divide-y divide-slate-100">
                            <div v-if="displayedItems.length === 0" class="p-12 text-center text-slate-400">
                                <p>ไม่พบรายการในหมวดหมู่นี้</p>
                            </div>

                            <div v-for="item in displayedItems" :key="item.id"
                                class="p-6 transition-colors duration-200 cursor-pointer trip-card hover:bg-slate-50"
                                @click="toggleDetails(item.id)">
                                <!-- Card Header -->
                                <div class="flex items-start justify-between mb-3">
                                    <div class="flex-1">
                                        <div class="flex items-center justify-between">
                                            <h4 class="text-lg font-semibold text-primary">{{ item.origin }} → {{ item.destination }}</h4>
                                            <span class="status-badge" :class="getStatusBadge(item.status).class">
                                                {{ getStatusBadge(item.status).label }}
                                            </span>
                                        </div>
                                        <p v-if="item.pickupPoint && item.pickupPoint !== '-'" class="mt-1 text-sm text-slate-500">จุดนัดพบ: {{ item.pickupPoint }}</p>
                                        <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-500">
                                            <span>📅 {{ item.date }} {{ item.time }}</span>
                                            <span>⏱ {{ item.durationText }}</span>
                                            <span>📏 {{ item.distanceText }}</span>
                                        </div>
                                        <!-- Cancel reason (driver view) -->
                                        <div v-if="role === 'driver' && item.status === 'cancelled' && item.cancelReason"
                                            class="p-2 mt-2 border border-slate-100 rounded-md bg-slate-50">
                                            <span class="text-sm text-primary">เหตุผลการยกเลิก: <span class="font-medium">{{ reasonLabel(item.cancelReason) }}</span></span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Person Info -->
                                <div class="flex items-center mb-4 space-x-4">
                                    <img :src="(item.person || {}).image" :alt="(item.person || {}).name"
                                        class="object-cover w-12 h-12 rounded-full"
                                        @error="(e) => e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent((item.person || {}).name || 'U')}&background=random&size=64`" />
                                    <div class="flex-1">
                                        <div class="flex items-center">
                                            <h5 class="font-medium text-primary">{{ (item.person || {}).name }}</h5>
                                            <svg v-if="(item.person || {}).isVerified" class="w-4 h-4 ml-1.5 text-cta" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12c0 1.357-.6 2.573-1.549 3.397a4.49 4.49 0 01-1.307 3.498 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.07-.01l3.5-4.875z" clip-rule="evenodd"/></svg>
                                        </div>
                                        <div class="flex items-center mt-1">
                                            <div class="flex text-sm text-yellow-400">
                                                <span>{{ '★'.repeat(Math.round((item.person || {}).rating || 0)) }}{{ '☆'.repeat(5 - Math.round((item.person || {}).rating || 0)) }}</span>
                                            </div>
                                            <span class="ml-2 text-sm text-slate-500">{{ (item.person || {}).rating || 0 }} ({{ (item.person || {}).reviews || 0 }} รีวิว)</span>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-lg font-bold text-cta">{{ item.price }} บาท</div>
                                        <div class="text-sm text-slate-500">{{ item.seats }} ที่นั่ง</div>
                                    </div>
                                </div>

                                <!-- Expanded Trip Details -->
                                <div v-if="selectedId === item.id" class="pt-4 mt-4 mb-5 duration-300 border-t border-slate-200 animate-in slide-in-from-top">
                                    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <h5 class="mb-2 font-medium text-primary">รายละเอียดเส้นทาง</h5>
                                            <ul class="space-y-1 text-sm text-slate-500">
                                                <li>• จุดเริ่มต้น: <span class="font-medium text-primary">{{ item.origin }}</span><span v-if="item.originAddress"> — {{ item.originAddress }}</span></li>
                                                <template v-if="item.stops && item.stops.length">
                                                    <li class="mt-2 text-primary">• จุดแวะระหว่างทาง ({{ item.stops.length }} จุด):</li>
                                                    <li v-for="(stop, idx) in item.stops" :key="idx">  - จุดแวะ {{ idx + 1 }}: {{ stop }}</li>
                                                </template>
                                                <li class="mt-1">• จุดปลายทาง: <span class="font-medium text-primary">{{ item.destination }}</span><span v-if="item.destinationAddress"> — {{ item.destinationAddress }}</span></li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h5 class="mb-2 font-medium text-primary">รายละเอียดรถ</h5>
                                            <ul class="space-y-1 text-sm text-slate-500">
                                                <li v-for="detail in item.carDetails" :key="detail">• {{ detail }}</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div class="mt-4 space-y-4">
                                        <div v-if="item.conditions">
                                            <h5 class="mb-2 font-medium text-primary">เงื่อนไขการเดินทาง</h5>
                                            <p class="p-3 text-sm text-primary border border-slate-200 rounded-md bg-slate-50">{{ item.conditions }}</p>
                                        </div>
                                        <div v-if="item.photos && item.photos.length > 0">
                                            <h5 class="mb-2 font-medium text-primary">รูปภาพรถยนต์</h5>
                                            <div class="grid grid-cols-3 gap-2 mt-2">
                                                <div v-for="(photo, index) in item.photos.slice(0, 3)" :key="index">
                                                    <img :src="photo" alt="Vehicle photo" class="object-cover w-full transition-opacity rounded-lg shadow-sm cursor-pointer aspect-video hover:opacity-90" />
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="item.hasReviewed && item.reviewData" class="pt-2">
                                            <h5 class="mb-2 font-medium text-emerald-700">รีวิวที่คุณเขียน</h5>
                                            <div class="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                                <div class="flex items-center gap-2 mb-2">
                                                    <div class="flex text-yellow-500 text-lg">
                                                        <span>{{ '★'.repeat(item.reviewData.rating || 0) }}{{ '☆'.repeat(5 - (item.reviewData.rating || 0)) }}</span>
                                                    </div>
                                                </div>
                                                <div v-if="Array.isArray(item.reviewData.tags) && item.reviewData.tags.length" class="flex flex-wrap gap-1.5 mb-2">
                                                    <span v-for="tag in item.reviewData.tags" :key="tag" class="px-2.5 py-1 text-xs font-medium bg-white text-emerald-700 border border-emerald-200 rounded-full">
                                                        {{ tag }}
                                                    </span>
                                                </div>
                                                <p v-if="item.reviewData.comment" class="text-sm text-emerald-800 mt-2">{{ item.reviewData.comment }}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Action Buttons -->
                                <div class="flex justify-end space-x-3" :class="{ 'mt-4': selectedId !== item.id }">
                                    <!-- PASSENGER Actions -->
                                    <template v-if="role === 'passenger'">
                                        <button v-if="item.status === 'pending'" @click.stop="openCancelModal(item)"
                                            class="px-4 py-2 text-sm text-red-600 transition duration-200 border border-red-300 rounded-md hover:bg-red-50 cursor-pointer">ยกเลิกการจอง</button>
                                        <template v-else-if="['confirmed', 'in_progress'].includes(item.status)">
                                            <!-- Passenger: ขึ้นรถแล้ว -->
                                            <button v-if="!item.passengerBoarded"
                                                @click.stop="openConfirmModal(item, 'boarded')"
                                                class="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 transition cursor-pointer flex items-center gap-1.5">
                                                🚌 ขึ้นรถแล้ว
                                            </button>
                                            <span v-else class="px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-md flex items-center gap-1">
                                                ✅ ขึ้นรถแล้ว
                                            </span>
                                            <button @click.stop="openCancelModal(item)" class="px-4 py-2 text-sm text-red-600 transition duration-200 border border-red-300 rounded-md hover:bg-red-50 cursor-pointer">ยกเลิกการจอง</button>
                                            <a v-if="item.rawPickup?.lat" :href="getPickupNavUrl(item.rawPickup)" target="_blank" @click.stop
                                                class="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-300 rounded-md hover:bg-green-100 transition cursor-pointer flex items-center gap-1.5">
                                                📍 นำทางไปจุดขึ้นรถ
                                            </a>
                                            <a v-else-if="item.rawStart" :href="getGoogleMapsNavUrl(item.rawStart, item.rawEnd)" target="_blank" @click.stop
                                                class="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition cursor-pointer flex items-center gap-1.5">
                                                🗺️ นำทาง
                                            </a>
                                            <NuxtLink :to="`/tracking/${item.routeId}`" @click.stop class="px-4 py-2 text-sm text-white transition duration-200 bg-primary rounded-md hover:bg-primary/90">📍 ติดตามตำแหน่ง</NuxtLink>
                                            <button @click.stop="openChat(item)" :disabled="isChatLoading" class="px-4 py-2 text-sm text-white transition duration-200 bg-cta rounded-md hover:bg-cta-hover disabled:opacity-50 cursor-pointer">{{ isChatLoading ? '⏳ กำลังเปิด...' : '💬 แชทกลุ่ม' }}</button>
                                        </template>
                                        <template v-else-if="item.status === 'completed'">
                                            <template v-if="item.hasReviewed">
                                                <span class="px-4 py-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md cursor-default flex items-center gap-1.5">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                                    รีวิวแล้ว
                                                </span>
                                            </template>
                                            <NuxtLink v-else :to="`/reviews/create?bookingId=${item.id}`" class="px-4 py-2 text-sm text-white transition duration-200 bg-amber-500 rounded-md hover:bg-amber-600" @click.stop>⭐ เขียนรีวิว</NuxtLink>
                                        </template>
                                        <button v-else-if="['rejected', 'cancelled', 'no_show'].includes(item.status)" @click.stop="openConfirmModal(item, 'delete')"
                                            class="px-4 py-2 text-sm text-slate-500 transition duration-200 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer">ลบรายการ</button>
                                    </template>
                                    <!-- DRIVER Actions -->
                                    <template v-else>
                                        <template v-if="item.status === 'pending'">
                                            <button @click.stop="openConfirmModal(item, 'confirm')" class="px-4 py-2 text-sm text-white transition duration-200 bg-cta rounded-md hover:bg-cta-hover cursor-pointer">ยืนยันคำขอ</button>
                                            <button @click.stop="openConfirmModal(item, 'reject')" class="px-4 py-2 text-sm text-red-600 transition duration-200 border border-red-300 rounded-md hover:bg-red-50 cursor-pointer">ปฏิเสธ</button>
                                        </template>
                                        <template v-else-if="['confirmed', 'in_progress'].includes(item.status)">
                                            <!-- Driver: รับ/ส่งผู้โดยสาร -->
                                            <button v-if="item.status === 'confirmed'"
                                                @click.stop="openConfirmModal(item, 'pickup')"
                                                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition cursor-pointer flex items-center gap-1.5">
                                                👤 รับผู้โดยสารแล้ว
                                            </button>
                                            <button v-if="item.status === 'in_progress'"
                                                @click.stop="openConfirmModal(item, 'dropoff')"
                                                class="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1.5">
                                                📍 ส่งผู้โดยสารแล้ว
                                            </button>
                                            <a v-if="item.rawStart" :href="getGoogleMapsNavUrl(item.rawStart, item.rawEnd)" target="_blank" @click.stop
                                                class="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition cursor-pointer flex items-center gap-1.5">
                                                🗺️ นำทาง
                                            </a>
                                            <NuxtLink :to="`/tracking/${item.routeId}`" @click.stop class="px-4 py-2 text-sm text-white transition duration-200 bg-primary rounded-md hover:bg-primary/90">📍 ติดตามตำแหน่ง</NuxtLink>
                                            <button @click.stop="openChat(item)" :disabled="isChatLoading" class="px-4 py-2 text-sm text-white transition duration-200 bg-cta rounded-md hover:bg-cta-hover cursor-pointer disabled:opacity-50">{{ isChatLoading ? '⏳ กำลังเปิด...' : '💬 แชทกลุ่ม' }}</button>
                                        </template>
                                        <button v-else-if="['rejected', 'cancelled'].includes(item.status)" @click.stop="openConfirmModal(item, 'delete')"
                                            class="px-4 py-2 text-sm text-slate-500 transition duration-200 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer">ลบรายการ</button>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Map Panel -->
                <div class="lg:col-span-1">
                    <div class="sticky overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm top-8">
                        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 class="text-lg font-semibold text-[#383838]">แผนที่เส้นทาง</h3>
                            <p class="mt-1 text-sm text-slate-500">{{ mapLabel || 'คลิกที่รายการเพื่อดูเส้นทาง' }}</p>
                        </div>
                        <div class="relative">
                            <div ref="mapContainer" id="map" class="h-96"></div>

                            <!-- Locate Me FAB -->
                            <button
                                @click="handleLocateMe"
                                :disabled="!geo.hasGps.value"
                                :title="!geo.hasGps.value ? 'อุปกรณ์ไม่รองรับ GPS' : 'ตำแหน่งของฉัน'"
                                class="absolute bottom-16 right-4 z-20 w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                :class="geo.isActive.value
                                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'">
                                <svg v-if="geo.isLocating.value" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M12 2v4m0 12v4m-10-10h4m12 0h4" />
                                </svg>
                            </button>

                            <!-- Realtime location badge -->
                            <div v-if="geo.isActive.value" class="absolute bottom-4 left-4 z-10">
                                <div class="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 text-xs">
                                    <span class="relative flex h-2.5 w-2.5">
                                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                    </span>
                                    <span class="text-gray-600">ตำแหน่งของคุณ</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Cancel Reason Modal (Passenger) -->
        <div v-if="isCancelModalVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="closeCancelModal">
            <div class="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
                <h3 class="text-lg font-semibold text-primary">เลือกเหตุผลการยกเลิก</h3>
                <p class="mt-1 text-sm text-slate-500">โปรดเลือกเหตุผลตามตัวเลือกที่กำหนด</p>
                <div class="mt-4">
                    <select v-model="selectedCancelReason" class="w-full px-3 py-2 border border-slate-200 rounded-md">
                        <option value="" disabled>-- เลือกเหตุผล --</option>
                        <option v-for="r in CANCEL_REASONS" :key="r.value" :value="r.value">{{ r.label }}</option>
                    </select>
                    <p v-if="cancelReasonError" class="mt-2 text-sm text-red-600">{{ cancelReasonError }}</p>
                </div>
                <div class="flex justify-end gap-2 mt-6">
                    <button @click="closeCancelModal" class="px-4 py-2 text-sm text-primary bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer">ปิด</button>
                    <button @click="submitCancel" :disabled="!selectedCancelReason || isSubmittingCancel"
                        class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 cursor-pointer">
                        {{ isSubmittingCancel ? 'กำลังส่ง...' : 'ยืนยันการยกเลิก' }}
                    </button>
                </div>
            </div>
        </div>

        <ConfirmModal :show="isModalVisible" :title="modalContent.title" :message="modalContent.message"
            :confirmText="modalContent.confirmText" :variant="modalContent.variant" @confirm="handleConfirmAction" @cancel="closeConfirmModal" />
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import buddhistEra from 'dayjs/plugin/buddhistEra'
import ConfirmModal from '~/components/ConfirmModal.vue'
import ReviewCard from '~/components/ReviewCard.vue'
import StarRating from '~/components/StarRating.vue'
import { useToast } from '~/composables/useToast'
import { useChat } from '~/composables/useChat'
import { useReview } from '~/composables/useReview'
import { useAuth } from '~/composables/useAuth'
import {
    useRouteMap, cleanAddr, formatDistance, formatDuration,
    getStatusBadge, CANCEL_REASONS, reasonLabel
} from '~/composables/useRouteMap'
import { useGeolocation } from '~/composables/useGeolocation'

dayjs.locale('th')
dayjs.extend(buddhistEra)

const { $api } = useNuxtApp()
const { toast } = useToast()
const { createSession: createChatSession } = useChat()
const { fetchMyReviews, fetchPendingReviews, fetchDriverReviews: fetchDriverReviewsAPI, fetchDriverStats: fetchDriverStatsAPI, fetchMyReceivedReviews } = useReview()
const { user } = useAuth()
const router = useRouter()
const { initializeMap, waitMapReady, reverseGeocode, extractNameParts, updateMap, mapReady, getMap } = useRouteMap()
const geo = useGeolocation()
let locationMarkerObj = null

// --- Core State ---
const role = ref('passenger')
const statusFilter = ref('all')
const selectedId = ref(null)
const isLoading = ref(false)
const mapContainer = ref(null)
const GMAPS_CB = '__gmapsReady__'

// Passenger data
const passengerTrips = ref([])
// Driver data
const driverBookings = ref([])
const myRoutes = ref([])

definePageMeta({ middleware: 'auth' })

// --- Status Options per Role ---
const passengerStatuses = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'pending', label: 'รอดำเนินการ' },
    { value: 'confirmed', label: 'ยืนยันแล้ว' },
    { value: 'in_progress', label: 'กำลังเดินทาง' },
    { value: 'completed', label: 'เสร็จสิ้น' },
    { value: 'rejected', label: 'ปฏิเสธ' },
    { value: 'cancelled', label: 'ยกเลิก' },
    { value: 'reviews', label: '⭐ รีวิว' },
]

const driverStatuses = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'confirmed', label: 'ยืนยันแล้ว' },
    { value: 'pending', label: 'รอดำเนินการ' },
    { value: 'in_progress', label: 'กำลังเดินทาง' },
    { value: 'rejected', label: 'ปฏิเสธ' },
    { value: 'cancelled', label: 'ยกเลิก' },
    { value: 'myRoutes', label: 'เส้นทางของฉัน' },
    { value: 'reviews', label: '⭐ รีวิว' },
]

const statusOptions = computed(() => role.value === 'passenger' ? passengerStatuses : driverStatuses)

// --- Computed ---
const currentTrips = computed(() => role.value === 'passenger' ? passengerTrips.value : driverBookings.value)

const displayedItems = computed(() => {
    if (role.value === 'driver' && statusFilter.value === 'myRoutes') return myRoutes.value
    if (statusFilter.value === 'all') return currentTrips.value
    return currentTrips.value.filter(t => t.status === statusFilter.value)
})

const mapLabel = computed(() => {
    if (role.value === 'driver' && statusFilter.value === 'myRoutes') {
        const r = myRoutes.value.find(x => x.id === selectedId.value)
        return r ? `${r.origin} → ${r.destination}` : null
    }
    const t = currentTrips.value.find(x => x.id === selectedId.value)
    return t ? `${t.origin} → ${t.destination}` : null
})

function getCount(status) {
    if (status === 'reviews') return myReviews.value.length + pendingBookings.value.length
    if (role.value === 'driver' && status === 'myRoutes') return myRoutes.value.length
    if (status === 'all') return currentTrips.value.length
    return currentTrips.value.filter(t => t.status === status).length
}

// --- Role Switch ---
function switchRole(newRole) {
    if (role.value === newRole) return
    role.value = newRole
    statusFilter.value = 'all'
    selectedId.value = null
    if (newRole === 'passenger' && passengerTrips.value.length === 0) fetchPassengerTrips()
    if (newRole === 'driver' && driverBookings.value.length === 0) fetchDriverRoutes()
}

// --- Helpers for formatting ---
function buildStops(wp) {
    const baseList = (Array.isArray(wp?.used) && wp.used.length ? wp.used : Array.isArray(wp?.requested) ? wp.requested : []) || []
    const orderedList = (Array.isArray(wp?.optimizedOrder) && wp.optimizedOrder.length === baseList.length)
        ? wp.optimizedOrder.map(i => baseList[i]) : baseList
    const stops = orderedList.map(p => {
        const name = p?.name || ''
        const address = cleanAddr(p?.address || '')
        const fallback = (p?.lat != null && p?.lng != null) ? `(${Number(p.lat).toFixed(6)}, ${Number(p.lng).toFixed(6)})` : ''
        const title = name || fallback
        return address ? `${title} — ${address}` : title
    }).filter(Boolean)
    const stopsCoords = orderedList.map(p =>
        (p && typeof p.lat === 'number' && typeof p.lng === 'number')
            ? { lat: Number(p.lat), lng: Number(p.lng), name: p.name || '', address: p.address || '' }
            : null
    ).filter(Boolean)
    return { stops, stopsCoords }
}

function buildCarDetails(vehicle) {
    if (!vehicle) return ['ไม่มีข้อมูลรถ']
    const list = [`${vehicle.vehicleModel} (${vehicle.vehicleType})`]
    if (Array.isArray(vehicle.amenities) && vehicle.amenities.length) {
        list.push(...vehicle.amenities.map(a => typeof a === 'string' ? a : a.name))
    }
    return list
}

function fmtDuration(r) {
    return (typeof r.duration === 'string' ? formatDuration(r.duration) : r.duration) ||
        (r.durationSeconds ? `${Math.round(r.durationSeconds / 60)} นาที` : '-')
}

function fmtDistance(r) {
    return (typeof r.distance === 'string' ? formatDistance(r.distance) : r.distance) ||
        (r.distanceMeters ? `${(r.distanceMeters / 1000).toFixed(1)} กม.` : '-')
}

// --- Fetch Passenger Trips ---
async function fetchPassengerTrips() {
    isLoading.value = true
    try {
        const bookings = await $api('/bookings/me')
        passengerTrips.value = bookings.map(b => {
            const start = b.route.startLocation, end = b.route.endLocation
            const { stops, stopsCoords } = buildStops(b.route.waypoints)
            return {
                id: b.id, routeId: b.routeId || b.route?.id,
                status: String(b.status || '').toLowerCase(),
                origin: start?.name || `(${Number(start.lat).toFixed(2)}, ${Number(start.lng).toFixed(2)})`,
                destination: end?.name || `(${Number(end.lat).toFixed(2)}, ${Number(end.lng).toFixed(2)})`,
                originAddress: start?.address ? cleanAddr(start.address) : null,
                destinationAddress: end?.address ? cleanAddr(end.address) : null,
                originHasName: !!start?.name, destinationHasName: !!end?.name,
                pickupPoint: b.pickupLocation?.name || '-',
                date: dayjs(b.route.departureTime).format('D MMMM BBBB'),
                time: dayjs(b.route.departureTime).format('HH:mm น.'),
                price: (b.route.pricePerSeat || 0) * (b.numberOfSeats || 1),
                seats: b.numberOfSeats || 1,
                person: {
                    name: `${b.route.driver.firstName} ${b.route.driver.lastName}`.trim(),
                    image: b.route.driver.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.route.driver.firstName || 'U')}&background=random&size=64`,
                    rating: b.route.driver.driverStats?.avgRating || 0,
                    reviews: b.route.driver.driverStats?.totalReviews || 0
                },
                coords: [[start.lat, start.lng], [end.lat, end.lng]],
                polyline: b.route.routePolyline || null,
                stops, stopsCoords,
                carDetails: buildCarDetails(b.route.vehicle),
                conditions: b.route.conditions,
                photos: b.route.vehicle?.photos || [],
                hasReviewed: Array.isArray(b.reviews) && b.reviews.length > 0,
                reviewData: (Array.isArray(b.reviews) && b.reviews[0]) ? b.reviews[0] : null,
                durationText: fmtDuration(b.route), distanceText: fmtDistance(b.route),
                rawStart: start, rawEnd: end,
                rawPickup: b.pickupLocation || null, rawDropoff: b.dropoffLocation || null,
                passengerBoarded: !!(b.metadata?.passengerBoarded),
            }
        })
        await waitMapReady()
        const jobs = passengerTrips.value.map(async (t, idx) => {
            const [o, d] = await Promise.all([reverseGeocode(t.coords[0][0], t.coords[0][1]), reverseGeocode(t.coords[1][0], t.coords[1][1])])
            const oParts = await extractNameParts(o), dParts = await extractNameParts(d)
            if (!passengerTrips.value[idx].originHasName && oParts.name) passengerTrips.value[idx].origin = oParts.name
            if (!passengerTrips.value[idx].destinationHasName && dParts.name) passengerTrips.value[idx].destination = dParts.name
        })
        await Promise.allSettled(jobs)
    } catch (error) {
        console.error('Failed to fetch passenger trips:', error)
        passengerTrips.value = []
    } finally { isLoading.value = false }
}

// --- Fetch Driver Routes ---
async function fetchDriverRoutes() {
    isLoading.value = true
    try {
        const routes = await $api('/routes/me')
        const allowedRouteStatuses = new Set(['AVAILABLE', 'FULL', 'IN_TRANSIT'])
        const formatted = [], ownRoutes = []

        for (const r of routes) {
            const routeStatus = String(r.status || '').toUpperCase()
            if (!allowedRouteStatuses.has(routeStatus)) continue
            const start = r.startLocation, end = r.endLocation
            const { stops, stopsCoords } = buildStops(r.waypoints)
            const carDetailsList = buildCarDetails(r.vehicle)
            const coords = [[start.lat, start.lng], [end.lat, end.lng]]

            for (const b of (r.bookings || [])) {
                formatted.push({
                    id: b.id, routeId: r.id,
                    status: (b.status || '').toLowerCase(),
                    origin: start?.name || `(${Number(start.lat).toFixed(2)}, ${Number(start.lng).toFixed(2)})`,
                    destination: end?.name || `(${Number(end.lat).toFixed(2)}, ${Number(end.lng).toFixed(2)})`,
                    originHasName: !!start?.name, destinationHasName: !!end?.name,
                    pickupPoint: b.pickupLocation?.name || '-',
                    date: dayjs(r.departureTime).format('D MMMM BBBB'),
                    time: dayjs(r.departureTime).format('HH:mm น.'),
                    price: (r.pricePerSeat || 0) * (b.numberOfSeats || 0),
                    seats: b.numberOfSeats || 0,
                    person: {
                        name: `${b.passenger?.firstName || ''} ${b.passenger?.lastName || ''}`.trim() || 'ผู้โดยสาร',
                        image: b.passenger?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.passenger?.firstName || 'P')}&background=random&size=64`,
                        email: b.passenger?.email || '',
                        isVerified: !!b.passenger?.isVerified,
                        rating: b.passenger?.driverStats?.avgRating || 0,
                        reviews: b.passenger?.driverStats?.totalReviews || 0
                    },
                    coords, polyline: r.routePolyline || null,
                    stops, stopsCoords, cancelReason: b.cancelReason || null,
                    carDetails: carDetailsList, conditions: r.conditions,
                    photos: r.vehicle?.photos || [],
                    originAddress: start?.address ? cleanAddr(start.address) : null,
                    destinationAddress: end?.address ? cleanAddr(end.address) : null,
                    durationText: fmtDuration(r), distanceText: fmtDistance(r),
                    rawStart: start, rawEnd: end,
                    rawPickup: b.pickupLocation || null, rawDropoff: b.dropoffLocation || null
                })
            }

            const confirmedBookings = (r.bookings || []).filter(b => (b.status || '').toUpperCase() === 'CONFIRMED')
            ownRoutes.push({
                id: r.id, status: (r.status || '').toLowerCase(),
                origin: start?.name || `(${Number(start.lat).toFixed(2)}, ${Number(start.lng).toFixed(2)})`,
                destination: end?.name || `(${Number(end.lat).toFixed(2)}, ${Number(end.lng).toFixed(2)})`,
                originAddress: start?.address ? cleanAddr(start.address) : null,
                destinationAddress: end?.address ? cleanAddr(end.address) : null,
                date: dayjs(r.departureTime).format('D MMMM BBBB'),
                time: dayjs(r.departureTime).format('HH:mm น.'),
                pricePerSeat: r.pricePerSeat || 0, availableSeats: r.availableSeats ?? 0,
                coords, polyline: r.routePolyline || null, stops, stopsCoords,
                carDetails: buildCarDetails(r.vehicle),
                photos: r.vehicle?.photos || [], conditions: r.conditions || '',
                passengers: confirmedBookings.map(b => ({
                    id: b.id, seats: b.numberOfSeats || 0, status: 'confirmed',
                    name: `${b.passenger?.firstName || ''} ${b.passenger?.lastName || ''}`.trim() || 'ผู้โดยสาร',
                    image: b.passenger?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.passenger?.firstName || 'P')}&background=random&size=64`,
                    email: b.passenger?.email || '', isVerified: !!b.passenger?.isVerified,
                    rating: b.passenger?.driverStats?.avgRating || 0,
                    reviews: b.passenger?.driverStats?.totalReviews || 0,
                    rawPickup: b.pickupLocation || null,
                    rawDropoff: b.dropoffLocation || null
                })),
                durationText: fmtDuration(r), distanceText: fmtDistance(r),
                rawStart: start, rawEnd: end
            })
        }
        driverBookings.value = formatted
        myRoutes.value = ownRoutes

        await waitMapReady()
        const jobs = driverBookings.value.map(async (t, idx) => {
            const [o, d] = await Promise.all([reverseGeocode(t.coords[0][0], t.coords[0][1]), reverseGeocode(t.coords[1][0], t.coords[1][1])])
            const oParts = await extractNameParts(o), dParts = await extractNameParts(d)
            if (!driverBookings.value[idx].originHasName && oParts.name) driverBookings.value[idx].origin = oParts.name
            if (!driverBookings.value[idx].destinationHasName && dParts.name) driverBookings.value[idx].destination = dParts.name
        })
        await Promise.allSettled(jobs)
    } catch (error) {
        console.error('Failed to fetch driver routes:', error)
        driverBookings.value = []; myRoutes.value = []
        toast.error('เกิดข้อผิดพลาด', error?.data?.message || 'ไม่สามารถโหลดข้อมูลได้')
    } finally { isLoading.value = false }
}

// --- Toggle Details & Map ---
function toggleDetails(id) {
    const items = (role.value === 'driver' && statusFilter.value === 'myRoutes') ? myRoutes.value : currentTrips.value
    const item = items.find(x => x.id === id)
    if (item) updateMap(item)
    selectedId.value = (selectedId.value === id) ? null : id
}

// --- Waypoint (Driver) ---
const addingWaypointRouteId = ref(null)
const newWaypointText = ref('')
const newWaypointMeta = reactive({ lat: null, lng: null, name: '', address: '' })
const isSubmittingWaypoint = ref(false)
const waypointInputRef = ref(null)
let waypointAutocomplete = null

function startAddWaypoint(routeId) {
    addingWaypointRouteId.value = routeId
    newWaypointText.value = ''
    Object.assign(newWaypointMeta, { lat: null, lng: null, name: '', address: '' })
    nextTick(() => {
        if (!waypointInputRef.value || !window.google?.maps?.places) return
        waypointAutocomplete = new google.maps.places.Autocomplete(waypointInputRef.value, {
            componentRestrictions: { country: 'th' },
            fields: ['geometry', 'name', 'formatted_address', 'place_id'],
        })
        waypointAutocomplete.addListener('place_changed', () => {
            const place = waypointAutocomplete.getPlace()
            if (!place?.geometry?.location) return
            newWaypointMeta.lat = place.geometry.location.lat()
            newWaypointMeta.lng = place.geometry.location.lng()
            newWaypointMeta.name = place.name || ''
            newWaypointMeta.address = place.formatted_address || ''
            newWaypointText.value = place.name || place.formatted_address || ''
        })
        waypointInputRef.value.focus()
    })
}

function cancelAddWaypoint() {
    addingWaypointRouteId.value = null
    newWaypointText.value = ''
    Object.assign(newWaypointMeta, { lat: null, lng: null, name: '', address: '' })
    if (waypointAutocomplete) {
        google.maps.event.clearInstanceListeners(waypointAutocomplete)
        waypointAutocomplete = null
    }
}

async function submitWaypoint(routeId) {
    if (!newWaypointMeta.lat || isSubmittingWaypoint.value) return
    isSubmittingWaypoint.value = true
    try {
        await $api(`/routes/${routeId}/waypoints`, {
            method: 'POST',
            body: { lat: newWaypointMeta.lat, lng: newWaypointMeta.lng, name: newWaypointMeta.name, address: newWaypointMeta.address }
        })
        toast.success('เพิ่มจุดแวะสำเร็จ', newWaypointMeta.name || 'เพิ่มจุดแวะใหม่แล้ว')
        cancelAddWaypoint()
        await fetchDriverRoutes()
    } catch (err) {
        toast.error('ไม่สามารถเพิ่มจุดแวะได้', err?.data?.message || 'กรุณาลองอีกครั้ง')
    } finally { isSubmittingWaypoint.value = false }
}

// --- Cancel Modal (Passenger) ---
const isCancelModalVisible = ref(false)
const isSubmittingCancel = ref(false)
const selectedCancelReason = ref('')
const cancelReasonError = ref('')
const tripToCancel = ref(null)

function openCancelModal(trip) {
    tripToCancel.value = trip
    selectedCancelReason.value = ''
    cancelReasonError.value = ''
    isCancelModalVisible.value = true
}
function closeCancelModal() { isCancelModalVisible.value = false; tripToCancel.value = null }

async function submitCancel() {
    if (!selectedCancelReason.value) { cancelReasonError.value = 'กรุณาเลือกเหตุผล'; return }
    if (!tripToCancel.value) return
    isSubmittingCancel.value = true
    try {
        await $api(`/bookings/${tripToCancel.value.id}/cancel`, { method: 'PATCH', body: { reason: selectedCancelReason.value } })
        toast.success('ยกเลิกการจองสำเร็จ', 'ระบบบันทึกเหตุผลแล้ว')
        closeCancelModal()
        await fetchPassengerTrips()
    } catch (err) {
        console.error('Cancel booking failed:', err)
        toast.error('เกิดข้อผิดพลาด', err?.data?.message || 'ไม่สามารถยกเลิกได้')
    } finally { isSubmittingCancel.value = false }
}

// --- Confirm Modal (shared) ---
const isModalVisible = ref(false)
const tripToAction = ref(null)
const modalContent = ref({ title: '', message: '', confirmText: '', action: null, variant: 'danger' })

function openConfirmModal(item, action) {
    tripToAction.value = item
    if (action === 'confirm') {
        modalContent.value = { title: 'ยืนยันคำขอจอง', message: `ยืนยันคำขอของผู้โดยสาร "${(item.person || {}).name}" ใช่หรือไม่?`, confirmText: 'ยืนยันคำขอ', action: 'confirm', variant: 'primary' }
    } else if (action === 'reject') {
        modalContent.value = { title: 'ปฏิเสธคำขอจอง', message: `ต้องการปฏิเสธคำขอของ "${(item.person || {}).name}" ใช่หรือไม่?`, confirmText: 'ปฏิเสธ', action: 'reject', variant: 'danger' }
    } else if (action === 'delete') {
        modalContent.value = { title: 'ยืนยันการลบรายการ', message: 'ต้องการลบรายการนี้ออกจากประวัติใช่หรือไม่?', confirmText: 'ลบรายการ', action: 'delete', variant: 'danger' }
    } else if (action === 'startTrip') {
        modalContent.value = { title: '🚗 เริ่มเดินทาง', message: 'ยืนยันเริ่มเดินทางเส้นทางนี้ ผู้โดยสารทุกคนจะได้รับการแจ้งเตือน', confirmText: 'เริ่มเดินทาง', action: 'startTrip', variant: 'primary' }
    } else if (action === 'endTrip') {
        modalContent.value = { title: '✅ สิ้นสุดเดินทาง', message: 'ยืนยันสิ้นสุดการเดินทาง? การจองทั้งหมดจะถูกตั้งเป็นเสร็จสิ้น', confirmText: 'สิ้นสุดเดินทาง', action: 'endTrip', variant: 'primary' }
    } else if (action === 'pickup') {
        modalContent.value = { title: '👤 รับผู้โดยสารแล้ว', message: `ยืนยันว่ารับ "${(item.person || {}).name}" ขึ้นรถแล้ว?`, confirmText: 'รับแล้ว', action: 'pickup', variant: 'primary' }
    } else if (action === 'dropoff') {
        modalContent.value = { title: '📍 ส่งผู้โดยสารแล้ว', message: `ยืนยันว่าส่ง "${(item.person || {}).name}" ถึงแล้ว?`, confirmText: 'ส่งแล้ว', action: 'dropoff', variant: 'primary' }
    } else if (action === 'boarded') {
        modalContent.value = { title: '🚌 ขึ้นรถแล้ว', message: 'ยืนยันว่าคุณขึ้นรถแล้ว?', confirmText: 'ขึ้นรถแล้ว', action: 'boarded', variant: 'primary' }
    }
    isModalVisible.value = true
}
function closeConfirmModal() { isModalVisible.value = false; tripToAction.value = null }

async function handleConfirmAction() {
    if (!tripToAction.value) return
    const action = modalContent.value.action
    const id = tripToAction.value.id
    try {
        if (action === 'confirm') {
            await $api(`/bookings/${id}/status`, { method: 'PATCH', body: { status: 'CONFIRMED' } })
            toast.success('สำเร็จ', 'ยืนยันคำขอแล้ว')
        } else if (action === 'reject') {
            await $api(`/bookings/${id}/status`, { method: 'PATCH', body: { status: 'REJECTED' } })
            toast.success('สำเร็จ', 'ปฏิเสธคำขอแล้ว')
        } else if (action === 'delete') {
            await $api(`/bookings/${id}`, { method: 'DELETE' })
            toast.success('ลบรายการสำเร็จ')
        } else if (action === 'startTrip') {
            await $api(`/routes/${id}/start`, { method: 'PATCH' })
            toast.success('🚗 เริ่มเดินทาง', 'ผู้โดยสารได้รับการแจ้งเตือนแล้ว')
        } else if (action === 'endTrip') {
            await $api(`/routes/${id}/end`, { method: 'PATCH' })
            toast.success('✅ สิ้นสุดเดินทาง', 'การเดินทางเสร็จสิ้น')
        } else if (action === 'pickup') {
            await $api(`/bookings/${id}/status`, { method: 'PATCH', body: { status: 'IN_PROGRESS' } })
            toast.success('👤 รับผู้โดยสารแล้ว')
        } else if (action === 'dropoff') {
            await $api(`/bookings/${id}/status`, { method: 'PATCH', body: { status: 'COMPLETED' } })
            toast.success('📍 ส่งผู้โดยสารแล้ว')
        } else if (action === 'boarded') {
            await $api(`/bookings/${id}/boarded`, { method: 'PATCH' })
            toast.success('🚌 ขึ้นรถแล้ว', 'คนขับได้รับการแจ้งเตือนแล้ว')
        }
        closeConfirmModal()
        if (role.value === 'passenger') await fetchPassengerTrips()
        else await fetchDriverRoutes()
    } catch (error) {
        console.error(`Failed to ${action}:`, error)
        toast.error('เกิดข้อผิดพลาด', error?.data?.message || 'ไม่สามารถดำเนินการได้')
        closeConfirmModal()
    }
}

// --- Locate Me (GPS) ---
async function handleLocateMe() {
    if (geo.isLocating.value || !geo.hasGps.value) return
    toast.info('กำลังค้นหาตำแหน่ง', 'กรุณารอสักครู่...')
    const result = await geo.locate()
    if (result.isDefault) {
        if (geo.permissionDenied.value) {
            toast.warning('GPS ถูกปิดกั้น', 'กรุณาเปิด GPS หรือค้นหาที่อยู่ด้วยตนเอง')
        } else {
            toast.error('ไม่พบตำแหน่ง GPS', 'ไม่สามารถหาตำแหน่ง GPS ได้')
        }
        return
    }
    const map = getMap()
    if (map) {
        map.panTo({ lat: result.lat, lng: result.lng })
        map.setZoom(18)
        if (locationMarkerObj?.marker) locationMarkerObj.marker.setMap(null)
        if (locationMarkerObj?.circle) locationMarkerObj.circle.setMap(null)
        locationMarkerObj = geo.renderLocationMarker(map, result.lat, result.lng, result.accuracy)
    }
    toast.success('พบตำแหน่งแล้ว', `ความแม่นยำ: ~${Math.round(result.accuracy || 0)}m`)
}

// --- Chat ---
const isChatLoading = ref(false)
async function openChat(item) {
    if (isChatLoading.value) return
    isChatLoading.value = true
    try {
        const session = await createChatSession(item.routeId, true)
        if (session?.id) router.push(`/chat/${session.id}`)
        else toast.error('เปิดแชทไม่สำเร็จ', 'ไม่พบ session ID')
    } catch (err) {
        console.error('Open chat failed:', err)
        toast.error('เปิดแชทไม่สำเร็จ', err?.statusMessage || err?.data?.message || 'กรุณาลองใหม่')
    } finally { isChatLoading.value = false }
}

async function openChatForRoute(route) {
    if (isChatLoading.value) return
    isChatLoading.value = true
    try {
        const session = await createChatSession(route.id, true)
        if (session?.id) router.push(`/chat/${session.id}`)
        else toast.error('เปิดแชทไม่สำเร็จ', 'ไม่พบ session ID')
    } catch (err) {
        console.error('Open chat for route failed:', err)
        toast.error('เปิดแชทไม่สำเร็จ', err?.statusMessage || err?.data?.message || 'กรุณาลองใหม่')
    } finally { isChatLoading.value = false }
}

function getGoogleMapsNavUrl(start, end) {
    if (!start?.lat || !end?.lat) return '#'
    return `https://www.google.com/maps/dir/?api=1&origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&travelmode=driving`
}

function getPickupNavUrl(pickup) {
    if (!pickup?.lat) return '#'
    let url = `https://www.google.com/maps/dir/?api=1&destination=${pickup.lat},${pickup.lng}&travelmode=driving`
    if (pickup.placeId) url += `&destination_place_id=${pickup.placeId}`
    return url
}

// --- Reviews ---
const reviewTab = ref('my')
const isReviewLoading = ref(false)
const isPrivateLoading = ref(false)
const myReviews = ref([])
const pendingBookings = ref([])
const driverReviewsList = ref([])
const driverStats = ref(null)

const isDriver = computed(() => user.value?.role === 'DRIVER')
const privateFeedbacks = computed(() =>
    driverReviewsList.value.filter(r => r.privateFeedback && r.privateFeedback.trim() !== '')
)
const formatPrivateDate = (date) => dayjs(date).format('D MMM BBBB')

async function loadMyReviews() {
    isReviewLoading.value = true
    try {
        const result = await fetchMyReviews()
        myReviews.value = result?.data || result || []
    } catch (err) {
        console.error('Failed to load reviews:', err)
    } finally { isReviewLoading.value = false }
}

async function loadPendingReviews() {
    try {
        pendingBookings.value = await fetchPendingReviews() || []
    } catch { pendingBookings.value = [] }
}

async function loadDriverReviewsData() {
    if (!user.value?.id) return
    isPrivateLoading.value = true
    try {
        // Use authenticated endpoint that includes privateFeedback
        const result = await fetchMyReceivedReviews()
        driverReviewsList.value = result?.data || result || []
        driverStats.value = await fetchDriverStatsAPI(user.value.id)
    } catch { driverReviewsList.value = [] }
    finally { isPrivateLoading.value = false }
}

const copyEmail = async (email) => {
    try { await navigator.clipboard.writeText(email); toast.success('คัดลอกแล้ว', email) }
    catch { toast.error('คัดลอกไม่สำเร็จ', 'ลองใหม่อีกครั้ง') }
}

// --- Lifecycle ---
useHead({
    title: 'การเดินทางของฉัน - Drive To Survive',
    script: process.client && !window.google?.maps ? [{
        key: 'gmaps',
        src: `https://maps.googleapis.com/maps/api/js?key=${useRuntimeConfig().public.googleMapsApiKey}&libraries=places,geometry&callback=${GMAPS_CB}`,
        async: true, defer: true
    }] : []
})

onMounted(() => {
    const afterInit = () => {
        fetchPassengerTrips().then(() => {
            if (displayedItems.value.length) updateMap(displayedItems.value[0])
        })
    }
    if (window.google?.maps) { initializeMap(mapContainer.value); afterInit(); return }
    window[GMAPS_CB] = () => {
        try { delete window[GMAPS_CB] } catch {}
        initializeMap(mapContainer.value)
        afterInit()
    }
})

watch([role, statusFilter], ([, newFilter]) => {
    selectedId.value = null
    if (newFilter === 'reviews') {
        loadMyReviews()
        loadPendingReviews()
    }
    nextTick(() => {
        if (displayedItems.value.length > 0) updateMap(displayedItems.value[0])
    })
})

watch(reviewTab, (tab) => {
    if ((tab === 'received' || tab === 'private') && driverReviewsList.value.length === 0) {
        loadDriverReviewsData()
    }
})
</script>

<style>
@import '~/assets/css/trip-shared.css';
</style>
