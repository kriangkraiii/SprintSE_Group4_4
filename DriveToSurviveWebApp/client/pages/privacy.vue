<template>
    <div class="min-h-screen text-primary bg-slate-50">
        <AppHeader />

        <!-- Hero Banner -->
        <div class="relative pt-24 pb-12 overflow-hidden bg-gradient-to-br from-[#0a2540] to-[#1a4b7a]">
            <div class="absolute inset-0 opacity-10">
                <div class="absolute inset-0"
                    style="background-image: radial-gradient(circle at 25% 50%, rgba(19,127,236,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 50%, rgba(20,94,231,0.2) 0%, transparent 50%);">
                </div>
            </div>
            <div class="relative px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div class="flex items-center gap-4 mb-4">
                    <div class="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm">
                        <svg class="w-7 h-7 text-cta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold text-white md:text-4xl">นโยบายความเป็นส่วนตัว</h1>
                        <p class="text-blue-200">Privacy Policy — Ride Platform</p>
                    </div>
                </div>
                <div class="flex flex-wrap items-center gap-4 mt-6 text-sm text-blue-200">
                    <span class="flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        มีผลบังคับใช้: 8 กรกฎาคม 2568
                    </span>
                    <span class="flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        อัปเดตล่าสุด: 2 มีนาคม 2569
                    </span>
                </div>
            </div>
        </div>

        <!-- Scroll Progress -->
        <div class="scroll-indicator">
            <div class="scroll-progress" :style="{ width: scrollWidth + '%' }"></div>
        </div>

        <main class="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8 md:py-12">
            <div class="grid grid-cols-1 gap-8 lg:grid-cols-4">
                <!-- TOC Sidebar -->
                <aside class="lg:col-span-1">
                    <div class="sticky p-5 bg-white border border-slate-200 rounded-xl shadow-sm top-20">
                        <h3 class="flex items-center gap-2 mb-4 text-sm font-semibold tracking-wider uppercase text-slate-400">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            สารบัญ
                        </h3>
                        <nav class="space-y-1">
                            <a v-for="item in tocItems" :key="item.id" :href="'#' + item.id"
                                :class="['toc-link block px-3 py-2 text-sm rounded-lg transition-all', activeSectionId === item.id ? 'active' : 'text-slate-500 hover:text-cta hover:bg-slate-50']">
                                {{ item.label }}
                            </a>
                        </nav>
                    </div>
                </aside>

                <!-- Main Content -->
                <div class="space-y-6 lg:col-span-3">

                    <!-- Intro Banner -->
                    <div class="p-6 border border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50">
                        <p class="leading-relaxed text-primary">
                            <strong>Ride</strong> ("แพลตฟอร์ม", "เรา") ตระหนักถึงความสำคัญของข้อมูลส่วนบุคคลของท่านเป็นอย่างยิ่ง
                            นโยบายนี้อธิบายวิธีที่เราเก็บรวบรวม ใช้ เปิดเผย และปกป้องข้อมูลส่วนบุคคลของท่าน
                            สอดคล้องกับ <strong>พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)</strong>
                        </p>
                    </div>

                    <!-- Section 1: ข้อมูลที่เราเก็บรวบรวม -->
                    <section id="section-1" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">1</span>
                            ข้อมูลที่ Ride เก็บรวบรวม
                        </h2>
                        <p class="mb-6 leading-relaxed text-slate-600">
                            เราเก็บรวบรวมข้อมูลเพื่อให้บริการที่ดีขึ้นแก่ผู้ใช้ทุกคน
                            ข้อมูลที่เราเก็บรวบรวมและวิธีที่เราใช้ข้อมูลนั้นขึ้นอยู่กับว่าท่านใช้บริการของเราอย่างไร
                        </p>

                        <div class="space-y-5">
                            <!-- 1.1 -->
                            <div class="p-5 border border-slate-100 rounded-lg bg-slate-50">
                                <h3 class="flex items-center gap-2 mb-3 text-lg font-semibold text-primary">
                                    <svg class="w-5 h-5 text-cta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    ข้อมูลที่ท่านให้กับเราโดยตรง
                                </h3>
                                <div class="space-y-2 text-sm text-slate-600">
                                    <div class="flex items-start gap-3">
                                        <span class="mt-0.5 text-cta shrink-0">●</span>
                                        <span><strong class="text-primary">ข้อมูลบัญชี:</strong> ชื่อ-นามสกุล, อีเมล, เบอร์โทรศัพท์, ชื่อผู้ใช้, รหัสผ่าน (เข้ารหัส) และรูปโปรไฟล์</span>
                                    </div>
                                    <div class="flex items-start gap-3">
                                        <span class="mt-0.5 text-cta shrink-0">●</span>
                                        <span><strong class="text-primary">ข้อมูลยืนยันตัวตน:</strong> เลขบัตรประชาชน, ใบขับขี่, รูปถ่ายเซลฟี (สำหรับระบบ OCR อัตโนมัติ)</span>
                                    </div>
                                    <div class="flex items-start gap-3">
                                        <span class="mt-0.5 text-cta shrink-0">●</span>
                                        <span><strong class="text-primary">ข้อมูลยานพาหนะ:</strong> รุ่นรถยนต์, ทะเบียนรถ, ประเภทรถ, จำนวนที่นั่ง (สำหรับผู้ขับขี่)</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 1.2 -->
                            <div class="p-5 border border-green-100 rounded-lg bg-green-50/50">
                                <h3 class="flex items-center gap-2 mb-3 text-lg font-semibold text-primary">
                                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    ข้อมูลที่เก็บรวบรวมโดยอัตโนมัติ
                                </h3>
                                <div class="space-y-2 text-sm text-slate-600">
                                    <div class="flex items-start gap-3">
                                        <span class="mt-0.5 text-green-500 shrink-0">●</span>
                                        <span><strong class="text-primary">ข้อมูลการเดินทาง:</strong> ต้นทาง, ปลายทาง, จุดแวะพัก, วันเวลาเดินทาง</span>
                                    </div>
                                    <div class="flex items-start gap-3">
                                        <span class="mt-0.5 text-green-500 shrink-0">●</span>
                                        <span><strong class="text-primary">ข้อมูลตำแหน่ง:</strong> ตำแหน่ง GPS เมื่อใช้ระบบ Checkpoint, ปุ่ม SOS และการแชร์ตำแหน่งในแชท</span>
                                    </div>
                                    <div class="flex items-start gap-3">
                                        <span class="mt-0.5 text-green-500 shrink-0">●</span>
                                        <span><strong class="text-primary">ข้อมูลการใช้งาน:</strong> ประวัติเข้าสู่ระบบ, ประวัติจอง, คะแนนรีวิว, ข้อความแชท</span>
                                    </div>
                                    <div class="flex items-start gap-3">
                                        <span class="mt-0.5 text-green-500 shrink-0">●</span>
                                        <span><strong class="text-primary">ข้อมูลอุปกรณ์:</strong> ประเภทเบราว์เซอร์, ที่อยู่ IP, คุกกี้เซสชัน</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- Section 2: เหตุใด Ride จึงต้องรวบรวมข้อมูล -->
                    <section id="section-2" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">2</span>
                            เหตุใด Ride จึงต้องรวบรวมข้อมูล
                        </h2>
                        <p class="mb-6 leading-relaxed text-slate-600">
                            เราใช้ข้อมูลเพื่อสร้างบริการที่ดียิ่งขึ้นสำหรับผู้ใช้ทุกคน
                        </p>
                        <div class="space-y-4">
                            <div v-for="(item, i) in purposes" :key="i"
                                class="flex items-start gap-4 p-4 rounded-lg hover:bg-slate-50 transition-colors">
                                <div class="flex items-center justify-center w-10 h-10 rounded-lg shrink-0" :class="item.bg">
                                    <span class="text-lg">{{ item.icon }}</span>
                                </div>
                                <div>
                                    <h3 class="font-semibold text-primary">{{ item.title }}</h3>
                                    <p class="text-sm text-slate-500">{{ item.desc }}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- Section 3: การควบคุมความเป็นส่วนตัวของท่าน -->
                    <section id="section-3" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">3</span>
                            การควบคุมความเป็นส่วนตัวของท่าน
                        </h2>
                        <p class="mb-6 leading-relaxed text-slate-600">
                            ท่านมีสิทธิ์ในการจัดการข้อมูลส่วนบุคคลของท่านเอง ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล
                        </p>
                        <div class="grid gap-4 sm:grid-cols-2">
                            <div v-for="(right, i) in userRights" :key="i"
                                class="p-4 border border-slate-100 rounded-lg bg-slate-50 hover:border-cta/30 transition-colors">
                                <div class="flex items-center gap-2 mb-2">
                                    <span class="text-lg">{{ right.icon }}</span>
                                    <h4 class="font-semibold text-primary">{{ right.title }}</h4>
                                </div>
                                <p class="text-sm text-slate-500">{{ right.desc }}</p>
                            </div>
                        </div>
                        <div class="p-4 mt-6 border-l-4 border-cta rounded-r-lg bg-cta-light">
                            <p class="text-sm text-primary">
                                <strong>วิธีใช้สิทธิ์:</strong> ท่านสามารถจัดการข้อมูลได้ผ่านหน้า
                                <NuxtLink to="/profile" class="font-semibold text-cta hover:underline">โปรไฟล์ของฉัน</NuxtLink>
                                หรือติดต่อเราที่ privacy@drivetosurvive.com
                            </p>
                        </div>
                    </section>

                    <!-- Section 4: การแบ่งปันข้อมูลของท่าน -->
                    <section id="section-4" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">4</span>
                            การแบ่งปันข้อมูลของท่าน
                        </h2>

                        <div class="space-y-5">
                            <div class="p-5 rounded-lg bg-slate-50 border border-slate-100">
                                <h3 class="mb-2 font-semibold text-primary">🤝 ระหว่างผู้ใช้</h3>
                                <p class="text-sm text-slate-600">
                                    เมื่อท่านจองหรือสร้างเส้นทาง ข้อมูลบางส่วน (ชื่อ, รูปโปรไฟล์, คะแนนรีวิว, รุ่นรถ)
                                    จะแสดงกับผู้ร่วมเดินทาง เพื่อความปลอดภัยและการตัดสินใจ
                                </p>
                            </div>
                            <div class="p-5 rounded-lg bg-slate-50 border border-slate-100">
                                <h3 class="mb-2 font-semibold text-primary">☁️ ผู้ให้บริการภายนอก</h3>
                                <p class="text-sm text-slate-600">
                                    เราใช้บริการภายนอกเพื่อดำเนินการบางอย่าง ภายใต้สัญญาคุ้มครองข้อมูล:
                                </p>
                                <ul class="mt-2 space-y-1 text-sm text-slate-500">
                                    <li class="flex items-center gap-2">
                                        <span class="text-cta">→</span> Cloudinary — จัดเก็บรูปภาพ
                                    </li>
                                    <li class="flex items-center gap-2">
                                        <span class="text-cta">→</span> Google Maps — แผนที่และเส้นทาง
                                    </li>
                                    <li class="flex items-center gap-2">
                                        <span class="text-cta">→</span> iApp — OCR ยืนยันใบขับขี่
                                    </li>
                                    <li class="flex items-center gap-2">
                                        <span class="text-cta">→</span> SMTP — ส่งอีเมลแจ้งเตือนและ OTP
                                    </li>
                                </ul>
                            </div>
                            <div class="p-5 rounded-lg bg-red-50 border border-red-100">
                                <h3 class="mb-2 font-semibold text-red-800">🚨 กรณีฉุกเฉินและกฎหมาย</h3>
                                <ul class="space-y-2 text-sm text-red-700 list-disc list-inside">
                                    <li>เมื่อท่านใช้ปุ่ม SOS ข้อมูลตำแหน่งจะถูกส่งไปยังผู้ติดต่อฉุกเฉินและหน่วยงานที่เกี่ยวข้อง</li>
                                    <li>เราอาจเปิดเผยข้อมูลตามหมายศาล คำสั่งเจ้าหน้าที่ หรือกฎหมายที่เกี่ยวข้อง</li>
                                    <li>เพื่อป้องกันหรือตรวจสอบการฉ้อโกง การกระทำผิดกฎหมายที่อาจเกิดขึ้น</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <!-- Section 5: การรักษาข้อมูลให้ปลอดภัย -->
                    <section id="section-5" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">5</span>
                            การรักษาข้อมูลให้ปลอดภัย
                        </h2>
                        <p class="mb-6 leading-relaxed text-slate-600">
                            เรามีมาตรการรักษาความปลอดภัยทั้งทางเทคนิคและองค์กร เพื่อปกป้องข้อมูลของท่าน
                        </p>
                        <div class="grid gap-4 sm:grid-cols-3">
                            <div class="p-4 text-center rounded-lg bg-green-50 border border-green-100">
                                <div class="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full">
                                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h4 class="font-semibold text-green-800">เข้ารหัสรหัสผ่าน</h4>
                                <p class="mt-1 text-xs text-green-600">bcrypt hash + salt</p>
                            </div>
                            <div class="p-4 text-center rounded-lg bg-blue-50 border border-blue-100">
                                <div class="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full">
                                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <h4 class="font-semibold text-blue-800">JWT Authentication</h4>
                                <p class="mt-1 text-xs text-blue-600">Token-based session</p>
                            </div>
                            <div class="p-4 text-center rounded-lg bg-amber-50 border border-amber-100">
                                <div class="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-amber-100 rounded-full">
                                    <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h4 class="font-semibold text-amber-800">Session Timeout</h4>
                                <p class="mt-1 text-xs text-amber-600">หมดอายุอัตโนมัติ</p>
                            </div>
                        </div>
                        <div class="p-4 mt-5 text-sm border-l-4 border-green-400 rounded-r-lg bg-green-50 text-green-800">
                            นอกจากนี้ เรายังมีระบบ Rate Limiting, Profanity Filter, Blacklist และ System Logs
                            เพื่อตรวจจับและป้องกันการใช้งานที่ไม่เหมาะสม
                        </div>
                    </section>

                    <!-- Section 6: การเก็บรักษาและลบข้อมูล -->
                    <section id="section-6" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">6</span>
                            การเก็บรักษาและลบข้อมูล
                        </h2>
                        <div class="space-y-4">
                            <div class="p-5 rounded-lg bg-amber-50 border border-amber-100">
                                <h3 class="mb-2 font-semibold text-amber-800">⏱ ระยะเวลาจัดเก็บ</h3>
                                <p class="text-sm text-slate-600">
                                    เราจัดเก็บข้อมูลตราบที่ท่านยังเป็นผู้ใช้ของแพลตฟอร์ม
                                    หลังยกเลิกบัญชี เราอาจเก็บข้อมูลบางส่วนไว้ตามที่กฎหมายกำหนด
                                </p>
                            </div>
                            <div class="p-5 rounded-lg bg-slate-50 border border-slate-100">
                                <h3 class="mb-2 font-semibold text-primary">🗑 การลบข้อมูลอัตโนมัติ</h3>
                                <ul class="space-y-2 text-sm text-slate-600">
                                    <li class="flex items-center gap-2">
                                        <span class="text-cta">→</span> ข้อความแชทหมดอายุ: ลบอัตโนมัติตามช่วงเวลาที่กำหนด (CRON Job)
                                    </li>
                                    <li class="flex items-center gap-2">
                                        <span class="text-cta">→</span> OTP codes: หมดอายุหลัง 5 นาที ลบทิ้งอัตโนมัติ
                                    </li>
                                    <li class="flex items-center gap-2">
                                        <span class="text-cta">→</span> System Logs: เก็บตามนโยบาย Retention แล้วล้างอัตโนมัติ
                                    </li>
                                </ul>
                            </div>
                            <div class="p-5 rounded-lg bg-slate-50 border border-slate-100">
                                <h3 class="mb-2 font-semibold text-primary">📤 การส่งออกข้อมูลของท่าน</h3>
                                <p class="text-sm text-slate-600">
                                    ท่านสามารถขอรับสำเนาข้อมูลส่วนบุคคลของท่านได้โดยติดต่อเราที่
                                    <a href="mailto:privacy@drivetosurvive.com" class="text-cta hover:underline">privacy@drivetosurvive.com</a>
                                </p>
                            </div>
                        </div>
                    </section>

                    <!-- Section 7: การปฏิบัติตามกฎหมาย -->
                    <section id="section-7" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">7</span>
                            การปฏิบัติตามกฎหมาย
                        </h2>
                        <div class="p-5 border-l-4 border-indigo-400 rounded-r-lg bg-indigo-50">
                            <p class="leading-relaxed text-primary">
                                เราดำเนินการตาม <strong>พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)</strong>
                                โดยทบทวนแนวปฏิบัติเป็นประจำ หากท่านเชื่อว่าข้อมูลของท่านไม่ได้รับการจัดการอย่างเหมาะสม
                                ท่านมีสิทธิ์ร้องเรียนไปยัง
                                <strong>สำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.)</strong> ได้โดยตรง
                            </p>
                        </div>
                    </section>

                    <!-- Section 8: การเปลี่ยนแปลงนโยบาย -->
                    <section id="section-8" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">8</span>
                            เกี่ยวกับนโยบายนี้
                        </h2>
                        <div class="p-5 rounded-lg bg-teal-50 border border-teal-100">
                            <p class="leading-relaxed text-primary">
                                นโยบายนี้ครอบคลุมบริการทั้งหมดที่ Ride เสนอ รวมถึงเว็บไซต์
                                และฟีเจอร์ต่างๆ บนแพลตฟอร์ม เราอาจแก้ไขนโยบายเป็นครั้งคราว
                                และจะแจ้งให้ท่านทราบผ่านการแจ้งเตือนบนแพลตฟอร์ม
                                การเปลี่ยนแปลงจะไม่ลดทอนสิทธิ์ของท่านโดยไม่ได้รับความยินยอม
                            </p>
                        </div>
                    </section>

                    <!-- Section 9: คุกกี้ -->
                    <section id="section-9" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">9</span>
                            นโยบายคุกกี้
                        </h2>
                        <p class="mb-4 text-sm text-slate-600 leading-relaxed">
                            เราใช้คุกกี้และเทคโนโลยีที่คล้ายคลึงกันเพื่อ:
                        </p>
                        <div class="grid gap-3 sm:grid-cols-2">
                            <div class="p-3 rounded-lg bg-slate-50 text-sm">
                                <strong class="text-primary">🔐 คุกกี้ที่จำเป็น</strong>
                                <p class="text-slate-500 mt-1">Token สำหรับการเข้าสู่ระบบ, ภาษา, ธีม (Dark Mode)</p>
                            </div>
                            <div class="p-3 rounded-lg bg-slate-50 text-sm">
                                <strong class="text-primary">⚙️ คุกกี้เพื่อการทำงาน</strong>
                                <p class="text-slate-500 mt-1">จดจำการตั้งค่า, ตำแหน่ง Session Timeout</p>
                            </div>
                        </div>
                    </section>

                    <!-- Section 10: ติดต่อ -->
                    <section id="section-10" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">10</span>
                            ข้อมูลการติดต่อ
                        </h2>
                        <p class="mb-6 text-slate-600">
                            หากมีคำถามเกี่ยวกับนโยบายหรือต้องการใช้สิทธิ์ กรุณาติดต่อ:
                        </p>
                        <div class="grid gap-4 sm:grid-cols-2">
                            <div class="flex items-center gap-4 p-4 bg-cta-light rounded-xl">
                                <div class="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-sm">
                                    <svg class="w-5 h-5 text-cta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <div class="text-xs text-slate-500">อีเมล</div>
                                    <a href="mailto:privacy@drivetosurvive.com"
                                        class="font-semibold text-cta hover:underline">privacy@drivetosurvive.com</a>
                                </div>
                            </div>
                            <div class="flex items-center gap-4 p-4 bg-cta-light rounded-xl">
                                <div class="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-sm">
                                    <svg class="w-5 h-5 text-cta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <div class="text-xs text-slate-500">ที่อยู่</div>
                                    <div class="text-sm font-medium text-primary">Drive To Survive — ถ.มิตรภาพ ขอนแก่น 40000</div>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </main>

        <AppFooter />
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

useHead({
    title: 'นโยบายความเป็นส่วนตัว — Ride',
    meta: [
        { name: 'description', content: 'นโยบายความเป็นส่วนตัวของ Ride แพลตฟอร์มเดินทางร่วมกันอย่างปลอดภัย — การเก็บรวบรวม ใช้ และปกป้องข้อมูลส่วนบุคคลตาม PDPA' }
    ]
})

const tocItems = [
    { id: 'section-1', label: 'ข้อมูลที่เราเก็บรวบรวม' },
    { id: 'section-2', label: 'เหตุใดจึงต้องรวบรวมข้อมูล' },
    { id: 'section-3', label: 'การควบคุมความเป็นส่วนตัว' },
    { id: 'section-4', label: 'การแบ่งปันข้อมูล' },
    { id: 'section-5', label: 'การรักษาความปลอดภัย' },
    { id: 'section-6', label: 'การเก็บรักษาและลบข้อมูล' },
    { id: 'section-7', label: 'การปฏิบัติตามกฎหมาย' },
    { id: 'section-8', label: 'เกี่ยวกับนโยบายนี้' },
    { id: 'section-9', label: 'นโยบายคุกกี้' },
    { id: 'section-10', label: 'ข้อมูลการติดต่อ' },
]

const purposes = [
    { icon: '🚗', title: 'ให้บริการแพลตฟอร์ม', desc: 'จับคู่เส้นทาง ยืนยันการจอง อำนวยความสะดวกในการเดินทางร่วมกัน', bg: 'bg-blue-100' },
    { icon: '🛡️', title: 'ความปลอดภัยและสร้างความน่าเชื่อถือ', desc: 'ยืนยันตัวตน OCR ใบขับขี่ ตรวจจับการฉ้อโกง ระบบ SOS ฉุกเฉิน', bg: 'bg-green-100' },
    { icon: '💬', title: 'การสื่อสาร', desc: 'แจ้งเตือนสถานะการจอง ข้อความจากผู้ร่วมเดินทาง การแจ้งเตือนใกล้ถึง', bg: 'bg-amber-100' },
    { icon: '📊', title: 'ปรับปรุงและพัฒนาบริการ', desc: 'วิเคราะห์การใช้งาน ปรับระบบแนะนำเส้นทาง พัฒนาฟีเจอร์ใหม่', bg: 'bg-indigo-100' },
    { icon: '🔍', title: 'สนับสนุนและช่วยเหลือ', desc: 'แก้ไขปัญหาทางเทคนิค จัดการข้อพิพาท ตอบคำถามผู้ใช้', bg: 'bg-teal-100' },
    { icon: '⚖️', title: 'ปฏิบัติตามกฎหมาย', desc: 'ปฏิบัติตามคำสั่งศาล หน่วยงานภาครัฐ และ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล', bg: 'bg-red-100' },
]

const userRights = [
    { icon: '👁️', title: 'สิทธิ์เข้าถึง', desc: 'ขอรับสำเนาข้อมูลส่วนบุคคลที่เราจัดเก็บไว้' },
    { icon: '✏️', title: 'สิทธิ์แก้ไข', desc: 'แก้ไขข้อมูลให้ถูกต้องเป็นปัจจุบันผ่านหน้าโปรไฟล์' },
    { icon: '🗑️', title: 'สิทธิ์ลบข้อมูล', desc: 'ร้องขอลบข้อมูลตามเงื่อนไขที่กฎหมายกำหนด' },
    { icon: '🚫', title: 'สิทธิ์คัดค้าน', desc: 'คัดค้านการเก็บรวบรวม ใช้ หรือเปิดเผยข้อมูล' },
    { icon: '⏸️', title: 'สิทธิ์ระงับการใช้', desc: 'ขอให้ระงับการใช้ข้อมูลชั่วคราว' },
    { icon: '↩️', title: 'สิทธิ์เพิกถอนความยินยอม', desc: 'เพิกถอนความยินยอมที่เคยให้ไว้ได้ทุกเมื่อ' },
]

const scrollWidth = ref(0)
const activeSectionId = ref('section-1')

function handleScroll() {
    const doc = document.documentElement
    const scrollTotal = doc.scrollHeight - doc.clientHeight
    scrollWidth.value = scrollTotal > 0 ? (window.scrollY / scrollTotal) * 100 : 0

    const OFFSET = 120
    const sections = document.querySelectorAll('.content-section')
    let current = activeSectionId.value
    sections.forEach(el => {
        if (window.scrollY >= el.offsetTop - OFFSET) current = el.id
    })
    activeSectionId.value = current
}

onMounted(() => {
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
})
onBeforeUnmount(() => {
    window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.scroll-indicator {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: transparent;
    z-index: 1000;
}

.scroll-progress {
    height: 100%;
    background: linear-gradient(90deg, #137FEC, #145ee7);
    transition: width 0.1s ease-out;
}

.content-section {
    scroll-margin-top: 100px;
    transition: all 0.3s ease;
}

.content-section:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(19, 127, 236, 0.08);
}

.toc-link {
    border-left: 3px solid transparent;
    transition: all 0.2s ease;
}

.toc-link:hover {
    padding-left: 1rem;
    border-left-color: #93c5fd;
}

.toc-link.active {
    background-color: #eff6ff;
    border-left-color: #137FEC !important;
    padding-left: 1rem;
    color: #137FEC;
    font-weight: 500;
}
</style>
