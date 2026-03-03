<template>
    <div class="min-h-screen text-primary bg-slate-50">
        <AppHeader />

        <!-- Hero Banner -->
        <div class="relative pt-24 pb-12 overflow-hidden bg-gradient-to-br from-[#0a2540] to-[#1a4b7a]">
            <div class="absolute inset-0 opacity-10">
                <div class="absolute inset-0"
                    style="background-image: radial-gradient(circle at 30% 40%, rgba(19,127,236,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(20,94,231,0.2) 0%, transparent 50%);">
                </div>
            </div>
            <div class="relative px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div class="flex items-center gap-4 mb-4">
                    <div class="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm">
                        <svg class="w-7 h-7 text-cta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold text-white md:text-4xl">ข้อกำหนดและเงื่อนไขการใช้งาน</h1>
                        <p class="text-blue-200">Terms of Service — Ride Platform</p>
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
                            ข้อกำหนดและเงื่อนไขฉบับนี้เป็นข้อตกลงระหว่าง <strong>Ride</strong> ("แพลตฟอร์ม", "เรา")
                            และท่าน ("ผู้ใช้", "ท่าน") ซึ่งกำหนดข้อกำหนดทั่วไปสำหรับการใช้งานแพลตฟอร์ม Ride
                            และบริการที่เกี่ยวข้องทั้งหมด โดยการลงทะเบียนหรือใช้งาน
                            ท่านตกลงยอมรับข้อกำหนดเหล่านี้ทั้งหมด
                        </p>
                    </div>

                    <!-- Section 1: การยอมรับข้อกำหนด -->
                    <section id="section-1" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">1</span>
                            การยอมรับข้อกำหนด
                        </h2>
                        <div class="space-y-4 text-slate-600 leading-relaxed">
                            <p>
                                การเข้าถึงและใช้งานแพลตฟอร์ม Ride ถือว่าท่านได้อ่าน ทำความเข้าใจ
                                และยอมรับข้อกำหนดและเงื่อนไขฉบับนี้ทุกประการ
                                รวมถึง <NuxtLink to="/privacy" class="text-cta font-semibold hover:underline">นโยบายความเป็นส่วนตัว</NuxtLink> ด้วย
                            </p>
                            <div class="p-4 border-l-4 border-amber-400 rounded-r-lg bg-amber-50">
                                <p class="font-medium text-amber-800">
                                    ⚠️ หากท่านไม่ยอมรับข้อกำหนดเหล่านี้ กรุณาหยุดใช้งานแพลตฟอร์มทันที
                                </p>
                            </div>
                        </div>
                    </section>

                    <!-- Section 2: บัญชีผู้ใช้และการลงทะเบียน -->
                    <section id="section-2" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">2</span>
                            บัญชีผู้ใช้และการลงทะเบียน
                        </h2>
                        <div class="space-y-4">
                            <div class="p-5 rounded-lg bg-slate-50 border border-slate-100">
                                <h3 class="mb-2 font-semibold text-primary">📝 การสร้างบัญชี</h3>
                                <ul class="space-y-2 text-sm text-slate-600">
                                    <li class="flex items-start gap-2"><span class="text-cta shrink-0">•</span> ท่านต้องมีอายุไม่ต่ำกว่า 18 ปีในการลงทะเบียน</li>
                                    <li class="flex items-start gap-2"><span class="text-cta shrink-0">•</span> ข้อมูลที่ท่านให้ต้องเป็นข้อมูลจริง ถูกต้อง และเป็นปัจจุบัน</li>
                                    <li class="flex items-start gap-2"><span class="text-cta shrink-0">•</span> ท่านต้องยืนยันตัวตนด้วยอีเมลและ OTP ก่อนใช้งานฟีเจอร์หลัก</li>
                                    <li class="flex items-start gap-2"><span class="text-cta shrink-0">•</span> บัญชีหนึ่งต่อบุคคล — ห้ามสร้างบัญชีซ้ำ</li>
                                </ul>
                            </div>
                            <div class="p-5 rounded-lg bg-slate-50 border border-slate-100">
                                <h3 class="mb-2 font-semibold text-primary">🔐 ความรับผิดชอบต่อบัญชี</h3>
                                <ul class="space-y-2 text-sm text-slate-600">
                                    <li class="flex items-start gap-2"><span class="text-cta shrink-0">•</span> ท่านรับผิดชอบในการรักษาความลับของรหัสผ่าน</li>
                                    <li class="flex items-start gap-2"><span class="text-cta shrink-0">•</span> กิจกรรมทั้งหมดภายใต้บัญชีของท่านถือเป็นความรับผิดชอบของท่าน</li>
                                    <li class="flex items-start gap-2"><span class="text-cta shrink-0">•</span> หากพบการเข้าถึงโดยไม่ได้รับอนุญาต ต้องแจ้งเราทันที</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <!-- Section 3: สำหรับผู้ขับขี่ -->
                    <section id="section-3" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">3</span>
                            ข้อกำหนดสำหรับผู้ขับขี่
                        </h2>
                        <div class="space-y-4">
                            <div class="p-5 rounded-lg bg-green-50 border border-green-100">
                                <h3 class="mb-3 font-semibold text-green-800">🚗 คุณสมบัติผู้ขับขี่</h3>
                                <ul class="space-y-2 text-sm text-green-700">
                                    <li class="flex items-start gap-2"><span class="shrink-0">✓</span> มีใบอนุญาตขับขี่ที่ถูกต้องตามกฎหมายและไม่หมดอายุ</li>
                                    <li class="flex items-start gap-2"><span class="shrink-0">✓</span> ผ่านการยืนยันตัวตนด้วยระบบ OCR หรือการตรวจสอบโดยแอดมิน</li>
                                    <li class="flex items-start gap-2"><span class="shrink-0">✓</span> ลงทะเบียนยานพาหนะพร้อมข้อมูลครบถ้วน (รุ่น, ทะเบียน, จำนวนที่นั่ง)</li>
                                    <li class="flex items-start gap-2"><span class="shrink-0">✓</span> เลขบัตรประชาชนบนใบขับขี่ต้องตรงกับที่ลงทะเบียนไว้</li>
                                </ul>
                            </div>
                            <div class="p-5 rounded-lg bg-slate-50 border border-slate-100">
                                <h3 class="mb-3 font-semibold text-primary">📋 ความรับผิดชอบผู้ขับขี่</h3>
                                <ul class="space-y-2 text-sm text-slate-600">
                                    <li class="flex items-start gap-2"><span class="text-cta shrink-0">•</span> ปฏิบัติตามกฎจราจรและกฎหมายที่เกี่ยวข้องทุกประการ</li>
                                    <li class="flex items-start gap-2"><span class="text-cta shrink-0">•</span> ดูแลความปลอดภัยของผู้โดยสารระหว่างเดินทาง</li>
                                    <li class="flex items-start gap-2"><span class="text-cta shrink-0">•</span> เดินทางตามเส้นทางที่ประกาศไว้ หรือแจ้งผู้โดยสารล่วงหน้า</li>
                                    <li class="flex items-start gap-2"><span class="text-cta shrink-0">•</span> ห้ามขับขี่ภายใต้อิทธิพลของสุรา ยาเสพติด หรือสารมึนเมา</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <!-- Section 4: สำหรับผู้โดยสาร -->
                    <section id="section-4" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">4</span>
                            ข้อกำหนดสำหรับผู้โดยสาร
                        </h2>
                        <div class="space-y-4">
                            <div class="p-5 rounded-lg bg-blue-50 border border-blue-100">
                                <h3 class="mb-3 font-semibold text-blue-800">🎫 การจองและการยกเลิก</h3>
                                <ul class="space-y-2 text-sm text-blue-700">
                                    <li class="flex items-start gap-2"><span class="shrink-0">→</span> การจองถือเป็นข้อตกลงระหว่างท่านกับผู้ขับขี่</li>
                                    <li class="flex items-start gap-2"><span class="shrink-0">→</span> หากต้องยกเลิก ควรแจ้งผู้ขับขี่ล่วงหน้าผ่านระบบแชท</li>
                                    <li class="flex items-start gap-2"><span class="shrink-0">→</span> ห้ามจองที่นั่งเกินจำนวนที่ต้องการจริง</li>
                                </ul>
                            </div>
                            <div class="p-5 rounded-lg bg-slate-50 border border-slate-100">
                                <h3 class="mb-3 font-semibold text-primary">👤 ความรับผิดชอบผู้โดยสาร</h3>
                                <ul class="space-y-2 text-sm text-slate-600">
                                    <li class="flex items-start gap-2"><span class="text-cta shrink-0">•</span> ตรงเวลาตามจุดขึ้นรถที่ตกลงไว้</li>
                                    <li class="flex items-start gap-2"><span class="text-cta shrink-0">•</span> ปฏิบัติตัวสุภาพและให้เกียรติผู้ขับขี่และผู้ร่วมเดินทาง</li>
                                    <li class="flex items-start gap-2"><span class="text-cta shrink-0">•</span> ชำระค่าใช้จ่ายตามที่ตกลงกับผู้ขับขี่ (ถ้ามี)</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <!-- Section 5: เนื้อหาของผู้ใช้ -->
                    <section id="section-5" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">5</span>
                            เนื้อหาของผู้ใช้งาน
                        </h2>
                        <div class="space-y-4 text-slate-600 leading-relaxed">
                            <p>
                                ท่านเป็นเจ้าของเนื้อหาทั้งหมดที่ท่านสร้างขึ้นบนแพลตฟอร์ม (รีวิว, ข้อความแชท, รูปโปรไฟล์)
                                โดยท่านให้สิทธิ์แก่ Ride ในการแสดง จัดเก็บ และประมวลผลเนื้อหาดังกล่าวเพื่อการให้บริการ
                            </p>
                            <div class="p-4 border-l-4 border-red-400 rounded-r-lg bg-red-50">
                                <h3 class="mb-2 font-semibold text-red-800">🚫 เนื้อหาต้องห้าม</h3>
                                <ul class="space-y-1 text-sm text-red-700">
                                    <li>• ข้อความหยาบคาย คุกคาม หรือสแปม (กรองอัตโนมัติโดย Profanity Filter)</li>
                                    <li>• รีวิวเท็จหรือบิดเบือนข้อเท็จจริง</li>
                                    <li>• ข้อมูลส่วนบุคคลของผู้อื่นโดยไม่ได้รับอนุญาต</li>
                                    <li>• เนื้อหาละเมิดลิขสิทธิ์หรือทรัพย์สินทางปัญญาของผู้อื่น</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <!-- Section 6: ข้อห้ามในการใช้งาน -->
                    <section id="section-6" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">6</span>
                            ข้อห้ามในการใช้งาน
                        </h2>
                        <p class="mb-4 text-sm text-slate-600">ห้ามใช้แพลตฟอร์มเพื่อ:</p>
                        <div class="grid gap-3 sm:grid-cols-2">
                            <div v-for="(item, i) in prohibitions" :key="i"
                                class="flex items-start gap-3 p-4 rounded-lg bg-red-50/50 border border-red-100">
                                <span class="text-lg shrink-0">{{ item.icon }}</span>
                                <div>
                                    <h4 class="text-sm font-semibold text-red-800">{{ item.title }}</h4>
                                    <p class="text-xs text-red-600 mt-0.5">{{ item.desc }}</p>
                                </div>
                            </div>
                        </div>
                        <div class="p-4 mt-4 border-l-4 border-red-400 rounded-r-lg bg-red-50">
                            <p class="text-sm font-medium text-red-800">
                                ⚠️ การฝ่าฝืนอาจนำไปสู่การระงับบัญชี ขึ้น Blacklist หรือดำเนินคดีตามกฎหมาย
                            </p>
                        </div>
                    </section>

                    <!-- Section 7: ความปลอดภัยและ SOS -->
                    <section id="section-7" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">7</span>
                            ความปลอดภัยและระบบฉุกเฉิน
                        </h2>
                        <div class="space-y-4">
                            <div class="p-5 rounded-lg bg-green-50 border border-green-100">
                                <h3 class="mb-2 font-semibold text-green-800">🛡️ มาตรการความปลอดภัย</h3>
                                <ul class="space-y-2 text-sm text-green-700">
                                    <li class="flex items-start gap-2"><span class="shrink-0">✓</span> ระบบ Checkpoint ติดตามตำแหน่งระหว่างเดินทาง</li>
                                    <li class="flex items-start gap-2"><span class="shrink-0">✓</span> ระบบแจ้งเตือนเมื่อผู้ขับขี่ใกล้ถึงจุดรับ (Arrival Notification)</li>
                                    <li class="flex items-start gap-2"><span class="shrink-0">✓</span> ระบบยืนยันตัวตนหลายชั้น (OTP, บัตรประชาชน, ใบขับขี่ OCR)</li>
                                    <li class="flex items-start gap-2"><span class="shrink-0">✓</span> ระบบ Profanity Filter กรองข้อความไม่เหมาะสมอัตโนมัติ</li>
                                </ul>
                            </div>
                            <div class="p-5 rounded-lg bg-red-50 border border-red-100">
                                <h3 class="mb-2 font-semibold text-red-800">🆘 ปุ่ม SOS ฉุกเฉิน</h3>
                                <p class="text-sm text-red-700 leading-relaxed">
                                    ในกรณีฉุกเฉิน ท่านสามารถกดปุ่ม SOS เพื่อแจ้งเหตุ ระบบจะส่งตำแหน่งปัจจุบันและข้อมูลการเดินทางไปยังผู้ติดต่อฉุกเฉินที่ท่านกำหนดไว้
                                    การใช้ SOS เท็จอาจนำไปสู่การระงับบัญชี
                                </p>
                            </div>
                        </div>
                    </section>

                    <!-- Section 8: ทรัพย์สินทางปัญญา -->
                    <section id="section-8" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">8</span>
                            สิทธิ์ในทรัพย์สินทางปัญญา
                        </h2>
                        <div class="p-5 rounded-lg bg-indigo-50 border border-indigo-100">
                            <p class="leading-relaxed text-primary">
                                สิทธิ์ในทรัพย์สินทางปัญญาทั้งหมดของแพลตฟอร์ม Ride รวมถึงแต่ไม่จำกัดเพียง
                                ซอร์สโค้ด, ดีไซน์ UI/UX, โลโก้, ชื่อแบรนด์ และอัลกอริทึม เป็นทรัพย์สินของ Ride
                                ห้ามทำซ้ำ ดัดแปลง แจกจ่าย หรือใช้ในเชิงพาณิชย์โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร
                            </p>
                        </div>
                    </section>

                    <!-- Section 9: บริการบุคคลที่สาม -->
                    <section id="section-9" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">9</span>
                            บริการของบุคคลที่สาม
                        </h2>
                        <p class="mb-4 text-sm text-slate-600 leading-relaxed">
                            แพลตฟอร์มใช้บริการของบุคคลที่สามเพื่อดำเนินการบางอย่าง
                            ซึ่งอยู่ภายใต้ข้อกำหนดและนโยบายของผู้ให้บริการนั้นๆ:
                        </p>
                        <div class="grid gap-3 sm:grid-cols-2">
                            <div class="p-4 rounded-lg bg-slate-50 border border-slate-100">
                                <h4 class="font-semibold text-primary text-sm">🗺️ Google Maps API</h4>
                                <p class="text-xs text-slate-500 mt-1">แผนที่ เส้นทาง และระบุตำแหน่ง</p>
                            </div>
                            <div class="p-4 rounded-lg bg-slate-50 border border-slate-100">
                                <h4 class="font-semibold text-primary text-sm">☁️ Cloudinary</h4>
                                <p class="text-xs text-slate-500 mt-1">จัดเก็บรูปภาพ (โปรไฟล์, ใบขับขี่)</p>
                            </div>
                            <div class="p-4 rounded-lg bg-slate-50 border border-slate-100">
                                <h4 class="font-semibold text-primary text-sm">🔍 iApp OCR</h4>
                                <p class="text-xs text-slate-500 mt-1">อ่านข้อมูลใบขับขี่อัตโนมัติ</p>
                            </div>
                            <div class="p-4 rounded-lg bg-slate-50 border border-slate-100">
                                <h4 class="font-semibold text-primary text-sm">📧 SMTP Service</h4>
                                <p class="text-xs text-slate-500 mt-1">ส่งอีเมล OTP และการแจ้งเตือน</p>
                            </div>
                        </div>
                    </section>

                    <!-- Section 10: ข้อจำกัดความรับผิด -->
                    <section id="section-10" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">10</span>
                            ข้อจำกัดความรับผิด
                        </h2>
                        <div class="space-y-4 text-slate-600 leading-relaxed">
                            <p>
                                Ride ทำหน้าที่เป็น <strong>ตัวกลาง</strong> ในการจับคู่ผู้ขับขี่กับผู้โดยสาร
                                โดยเราไม่ได้เป็นผู้ให้บริการขนส่ง
                            </p>
                            <div class="p-4 rounded-lg bg-amber-50 border border-amber-100">
                                <p class="text-sm text-amber-800 leading-relaxed">
                                    <strong>Ride จะไม่รับผิดชอบ</strong> ต่อความเสียหายอันเกิดจาก:
                                    อุบัติเหตุระหว่างเดินทาง, ทรัพย์สินสูญหาย, ความล่าช้า,
                                    พฤติกรรมของผู้ใช้รายอื่น, หรือเหตุสุดวิสัยใดๆ
                                    ทั้งนี้เราจะพยายามอย่างสุดความสามารถเพื่อให้บริการที่ปลอดภัย
                                </p>
                            </div>
                        </div>
                    </section>

                    <!-- Section 11: การระงับข้อพิพาท -->
                    <section id="section-11" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">11</span>
                            การระงับข้อพิพาท
                        </h2>
                        <div class="space-y-4 text-slate-600 leading-relaxed">
                            <p>
                                หากเกิดข้อพิพาทระหว่างผู้ใช้ ท่านสามารถ:
                            </p>
                            <div class="grid gap-3 sm:grid-cols-3">
                                <div class="p-4 text-center rounded-lg bg-blue-50 border border-blue-100">
                                    <span class="text-2xl">💬</span>
                                    <h4 class="mt-2 text-sm font-semibold text-blue-800">รายงานผ่านแชท</h4>
                                    <p class="mt-1 text-xs text-blue-600">ใช้ปุ่มรายงานข้อความ</p>
                                </div>
                                <div class="p-4 text-center rounded-lg bg-amber-50 border border-amber-100">
                                    <span class="text-2xl">⭐</span>
                                    <h4 class="mt-2 text-sm font-semibold text-amber-800">Dispute รีวิว</h4>
                                    <p class="mt-1 text-xs text-amber-600">ร้องเรียนรีวิวที่ไม่เป็นธรรม</p>
                                </div>
                                <div class="p-4 text-center rounded-lg bg-green-50 border border-green-100">
                                    <span class="text-2xl">📧</span>
                                    <h4 class="mt-2 text-sm font-semibold text-green-800">ติดต่อแอดมิน</h4>
                                    <p class="mt-1 text-xs text-green-600">อีเมลหรือระบบ ticket</p>
                                </div>
                            </div>
                            <p class="text-sm">
                                แอดมินจะพิจารณาและดำเนินการภายในระยะเวลาที่เหมาะสม
                                หากไม่สามารถตกลงกันได้ จะใช้กฎหมายไทยในการระงับข้อพิพาท
                            </p>
                        </div>
                    </section>

                    <!-- Section 12: การเปลี่ยนแปลงและยกเลิก -->
                    <section id="section-12" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">12</span>
                            การเปลี่ยนแปลงข้อกำหนดและการยกเลิกบัญชี
                        </h2>
                        <div class="space-y-4">
                            <div class="p-5 rounded-lg bg-teal-50 border border-teal-100">
                                <h3 class="mb-2 font-semibold text-teal-800">🔄 การแก้ไขข้อกำหนด</h3>
                                <p class="text-sm text-teal-700 leading-relaxed">
                                    เราขอสงวนสิทธิ์ในการแก้ไขข้อกำหนดเป็นครั้งคราว
                                    การเปลี่ยนแปลงที่สำคัญจะแจ้งให้ทราบผ่านระบบแจ้งเตือนบนแพลตฟอร์ม
                                    การใช้งานต่อหลังการเปลี่ยนแปลง ถือว่าท่านยอมรับข้อกำหนดใหม่
                                </p>
                            </div>
                            <div class="p-5 rounded-lg bg-slate-50 border border-slate-100">
                                <h3 class="mb-2 font-semibold text-primary">🗑️ การยกเลิกบัญชี</h3>
                                <p class="text-sm text-slate-600 leading-relaxed">
                                    ท่านสามารถขอยกเลิกบัญชีได้ตลอดเวลาโดยติดต่อแอดมิน
                                    ข้อมูลบางส่วนอาจถูกเก็บไว้ตามระยะเวลาที่กฎหมายกำหนด
                                    ข้อกำหนดบางข้อยังคงมีผลบังคับใช้หลังยกเลิกบัญชี (เช่น ข้อจำกัดความรับผิด)
                                </p>
                            </div>
                        </div>
                    </section>

                    <!-- Section 13: ติดต่อเรา -->
                    <section id="section-13" class="p-8 bg-white border border-slate-200 rounded-xl shadow-sm content-section">
                        <h2 class="flex items-center gap-3 mb-6 text-2xl font-bold text-primary">
                            <span class="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-cta">13</span>
                            ติดต่อเรา
                        </h2>
                        <p class="mb-6 text-slate-600">
                            หากมีคำถามเกี่ยวกับข้อกำหนดและเงื่อนไข กรุณาติดต่อ:
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
                                    <a href="mailto:support@drivetosurvive.com"
                                        class="font-semibold text-cta hover:underline">support@drivetosurvive.com</a>
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

                    <!-- กฎหมายที่ใช้บังคับ -->
                    <div class="p-6 text-center border border-slate-200 rounded-xl bg-white shadow-sm">
                        <p class="text-sm text-slate-500">
                            ข้อกำหนดฉบับนี้อยู่ภายใต้กฎหมายของราชอาณาจักรไทย
                            และศาลไทยมีเขตอำนาจในการพิจารณาข้อพิพาทที่เกิดขึ้น
                        </p>
                    </div>
                </div>
            </div>
        </main>

        <AppFooter />
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

useHead({
    title: 'ข้อกำหนดและเงื่อนไขการใช้งาน — Ride',
    meta: [
        { name: 'description', content: 'ข้อกำหนดและเงื่อนไขการใช้งาน Ride แพลตฟอร์มเดินทางร่วมกันอย่างปลอดภัย — สิทธิ์ ความรับผิดชอบ และกฎเกณฑ์การใช้บริการ' }
    ]
})

const tocItems = [
    { id: 'section-1', label: 'การยอมรับข้อกำหนด' },
    { id: 'section-2', label: 'บัญชีผู้ใช้และการลงทะเบียน' },
    { id: 'section-3', label: 'ข้อกำหนดสำหรับผู้ขับขี่' },
    { id: 'section-4', label: 'ข้อกำหนดสำหรับผู้โดยสาร' },
    { id: 'section-5', label: 'เนื้อหาของผู้ใช้งาน' },
    { id: 'section-6', label: 'ข้อห้ามในการใช้งาน' },
    { id: 'section-7', label: 'ความปลอดภัยและ SOS' },
    { id: 'section-8', label: 'ทรัพย์สินทางปัญญา' },
    { id: 'section-9', label: 'บริการบุคคลที่สาม' },
    { id: 'section-10', label: 'ข้อจำกัดความรับผิด' },
    { id: 'section-11', label: 'การระงับข้อพิพาท' },
    { id: 'section-12', label: 'การเปลี่ยนแปลงและยกเลิก' },
    { id: 'section-13', label: 'ติดต่อเรา' },
]

const prohibitions = [
    { icon: '🚫', title: 'กระทำผิดกฎหมาย', desc: 'ห้ามใช้แพลตฟอร์มเพื่อกิจกรรมผิดกฎหมายทุกชนิด' },
    { icon: '🤖', title: 'ระบบอัตโนมัติ', desc: 'ห้ามใช้ Bot หรือ Scraper เข้าถึงข้อมูล' },
    { icon: '💣', title: 'โจมตีระบบ', desc: 'ห้าม DDoS, SQL Injection หรือพยายามเข้าถึงระบบโดยไม่ได้รับอนุญาต' },
    { icon: '🎭', title: 'ปลอมแปลงตัวตน', desc: 'ห้ามแอบอ้างหรือปลอมแปลงเป็นบุคคลอื่น' },
    { icon: '📧', title: 'สแปม', desc: 'ห้ามส่งข้อความสแปมหรือโฆษณาโดยไม่ได้รับอนุญาต' },
    { icon: '🔄', title: 'หลีกเลี่ยงระบบ', desc: 'ห้ามหลบเลี่ยง Blacklist หรือมาตรการความปลอดภัย' },
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
