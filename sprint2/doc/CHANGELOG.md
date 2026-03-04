# Project Changelog — Sprint 2 / บันทึกการเปลี่ยนแปลง Sprint 2
บันทึกการเปลี่ยนแปลงของโปรเจค DriveToSurviveWebApp สำหรับ Sprint 2 ตั้งแต่วันที่ 27 กุมภาพันธ์ 2026 ถึง 4 มีนาคม 2026

> **Sprint Goal:** Deliver Secure Communication, Smart Arrival Alerts, and Post-Ride Review capabilities  
> **Tech Stack:** Nuxt 3 (Client) + Express (Server) + Prisma ORM + Socket.IO + MySQL 8.0

---

## [Sprint 2 Release] — 2026-03-04

### 🔒 Epic 1: ระบบแชทในแอปที่ปลอดภัย (Secure In-App Messaging)

*   **เพิ่มระบบแชทแบบ Real-time ผ่าน Socket.IO** (`socket/index.js`, `chat.controller.js`, `chat.service.js`): พัฒนาระบบแชทกลุ่มต่อเส้นทาง (Group Chat per Route) รองรับคนขับและผู้โดยสารทุกคนที่จองในเส้นทางเดียวกัน
    *   **WebSocket Authentication**: ใช้ JWT Token ตรวจสอบตัวตนตอน Handshake พร้อม Room-based Architecture (`chat:{sessionId}`, `route:{routeId}`)
    *   **ประเภทข้อความที่รองรับ**: TEXT, IMAGE (อัปโหลดผ่าน Cloudinary CDN), LOCATION (ลิงก์ Google Maps), QUICK_REPLY, SYSTEM
    *   **ระบบ Presence**: แสดงสถานะออนไลน์/ออฟไลน์ แบบ Real-time พร้อม Typing Indicators
    *   **การเชื่อมต่อขาด/กลับมา**: แสดง Banner แจ้งผู้ใช้เมื่อขาดการเชื่อมต่อ ("ขาดการเชื่อมต่อ") และเมื่อกลับมาเชื่อมต่อสำเร็จ ("กลับมาเชื่อมต่อแล้ว")

*   **ระบบกรองเนื้อหาอัจฉริยะ (Smart Content Filtering)** (`contentFilter.js`, `profanityFilter.js`):
    *   **Phone Number Masking**: ตรวจจับและซ่อนเบอร์โทรศัพท์ไทย (0XX-XXX-XXXX, +66...) ด้วย `***-***-****`
    *   **URL/Link Blocking**: แทนที่ลิงก์ด้วย "[ลิงก์ถูกซ่อน / Link hidden]"
    *   **Line ID Masking**: ป้องกันการเปิดเผย Line ID ในแชท
    *   **Profanity Masking**: กรองคำหยาบทั้งไทยและอังกฤษ พร้อม Whitelist คำที่ถูกต้อง (เช่น `ฟักทอง`), ตรวจจับการหลีกเลี่ยงด้วย Character Substitution (`@→a`, `$→s`) และ Spaced-out Words

*   **ระบบปกปิดตัวตน (Identity Masking)**:
    *   แสดงเฉพาะชื่อแรกและรูปโปรไฟล์ ไม่เปิดเผยนามสกุล, เบอร์โทร, อีเมล หรือเลขบัตรประชาชนใน API Response
    *   API `/api/chat/sessions/:id/participants` ส่งคืนเฉพาะ `id`, `firstName`, `avatarUrl`, `role`

*   **Quick Reply ตอบกลับด่วน** (`QuickReply.vue`, `QuickReplyShortcut` model):
    *   ระบบ Quick Reply สำเร็จรูป (กำลังไปรับ, ถึงแล้ว, รอสักครู่, จอดรอที่จุดนัดพบ)
    *   รองรับการสร้าง Quick Reply กำหนดเอง สูงสุด 20 รายการต่อผู้ใช้

*   **แก้ไขและยกเลิกข้อความ (Edit & Unsend)**:
    *   **Edit**: แก้ไขข้อความได้สูงสุด 3 ครั้ง พร้อมบันทึกประวัติการแก้ไขใน `metadata` JSON
    *   **Unsend**: ยกเลิกข้อความได้ภายใน 5 นาที (`unsendDeadline`) ด้วย Three-dots Menu
    *   **ข้อจำกัดคำหยาบ**: หากข้อความมีคำหยาบ จะไม่สามารถแก้ไขหรือยกเลิกข้อความได้

*   **การแชร์ตำแหน่งและรูปภาพ**:
    *   แชร์ตำแหน่ง GPS แบบ Real-time พร้อมรองรับการยกเลิกการแชร์ (`revoke-location` Socket.IO event)
    *   ส่งรูปภาพผ่าน Cloudinary CDN (รองรับ JPG/PNG, ปฏิเสธ PDF)

*   **ระบบรายงานข้อความ (Chat Reporting)** (`ChatReport` model):
    *   ผู้ใช้รายงานข้อความพร้อมเหตุผล: HARASSMENT, SPAM, INAPPROPRIATE, PRIVACY_VIOLATION, OTHER
    *   Admin สามารถตรวจสอบและจัดการรายงานผ่าน Dashboard

*   **วงจรชีวิตแชทอัตโนมัติ (Chat Lifecycle Management)** (`chatLifecycle.service.js`):
    *   `ACTIVE` → ทริปจบ → `ENDED` (ยังแชทได้ 24 ชั่วโมง)
    *   `ENDED` → หลัง `chatExpiresAt` → `READ_ONLY` (อ่านอย่างเดียว 7 วัน)
    *   `READ_ONLY` → หลัง `readOnlyExpiresAt` → `ARCHIVED` (ข้อความย้ายไป `ChatLog` แล้วลบ)

---

### 📍 Epic 2: ระบบแจ้งเตือนเมื่อถึงจุดรับ (In-Chat Arrival Notification)

*   **ระบบแจ้งเตือนอัตโนมัติ 3 ระดับ GPS** (`arrivalNotification.service.js`, `gpsUtils.js`):
    *   **5 กม.**: "🚗 คนขับอยู่ห่างประมาณ 5 กม. / Driver is ~5 km away"
    *   **1 กม.**: "🚗 คนขับใกล้ถึงแล้ว ~1 กม. / Driver is ~1 km away"
    *   **0 กม. (ถึงแล้ว)**: "✅ คนขับถึงจุดรับแล้ว! / Driver has arrived!"
    *   ใช้สูตร **Haversine** คำนวณระยะทาง GPS ที่แม่นยำ
    *   **Deduplication**: Unique constraint `[bookingId, radiusType]` ป้องกันการแจ้งเตือนซ้ำ

*   **ช่องทางการแจ้งเตือนคู่ (Dual-Channel Delivery)**:
    *   **In-App Push Notification**: แจ้งเตือนใน Web App แบบ Real-time
    *   **Email**: ส่งอีเมลแจ้งเตือนผ่าน Nodemailer/SMTP พร้อม HTML Template สองภาษา (ไทย + อังกฤษ)
    *   **Fallback**: หาก Email ล้มเหลว → In-App ยังส่งสำเร็จ + Retry 3 ครั้ง (Exponential Backoff: 30s, 60s, 120s)

*   **ปุ่มแจ้งเตือนด้วยตนเอง (Manual Arrival Trigger)**:
    *   คนขับกดปุ่ม "แจ้งถึงแล้ว / I've Arrived" เมื่อ GPS ไม่แม่นยำ
    *   Cooldown 5 นาที ป้องกัน Spam

*   **ระบบ Real-time Tracking** (`useLocationTracking.js`):
    *   ติดตาม GPS หลายผู้เข้าร่วมผ่าน Socket.IO rooms (`route:{routeId}`)
    *   Smooth marker animation ด้วย Cubic Easing
    *   ตรวจจับ GPS Outlier (กระโดด >50 กม. จะถูกละทิ้ง)
    *   Banner แจ้งเตือนเมื่อ GPS ขาดหาย (>30 วินาที)
    *   คำนวณ Bearing สำหรับหมุน Marker ตามทิศทางการเดินทาง
    *   Client-side proximity alerts แจ้งเตือนผู้โดยสารตาม Threshold เดียวกับ Server

*   **ระบบ No-Show** (`noShow.service.js`):
    *   นับถอยหลัง 20 นาทีอัตโนมัติเมื่อคนขับถึงจุดรับ (0KM หรือ MANUAL)
    *   คนขับสามารถกด No-Show หลังหมดเวลา → Booking เปลี่ยนเป็น `NO_SHOW`
    *   แจ้งเตือนผู้โดยสารทันที

*   **บันทึกตรวจสอบ (Notification Audit Trail)** (`NotificationLog` model):
    *   ทุกการแจ้งเตือนถูกบันทึกพร้อม channel, status, payload, GPS coordinates ณ เวลาที่ trigger

---

### ⭐ Epic 3: ระบบรีวิวและให้คะแนนการเดินทาง (Ride Review & Rating System)

*   **ระบบให้คะแนน 1-5 ดาว พร้อม Tag เงื่อนไข** (`review.service.js`, `StarRating.vue`, `ReviewCard.vue`):
    *   **4-5 ดาว (เชิงบวก)**: แสดง Tag — สุภาพ, ขับปลอดภัย, รถสะอาด, ตรงเวลา, บทสนทนาดี
    *   **1-3 ดาว (เชิงลบ)**: แสดง Tag — ขับเร็ว/อันตราย, ไม่สุภาพ, รถไม่สะอาด, มาช้า, ไม่ตรงเส้นทาง
    *   **เปลี่ยนดาว → Tag รีเซ็ต**: หากเปลี่ยนจาก 5 ดาวเป็น 2 ดาว Tag เชิงบวกจะถูกล้างและแสดง Tag เชิงลบแทน

*   **กฎเกณฑ์รีวิวเข้มงวด (Review Business Rules)**:
    *   **หน้าต่าง 7 วัน**: รีวิวได้ภายใน 7 วันหลังเดินทางเสร็จเท่านั้น
    *   **1 รีวิวต่อ 1 Booking**: Unique constraint ป้องกันรีวิวซ้ำ
    *   **Immutable**: ไม่สามารถแก้ไขหรือลบรีวิวได้ไม่ว่าจะเป็นผู้ใช้หรือ Admin
    *   **บังคับข้อความ 1-2 ดาว**: ต้องเขียนเหตุผลอย่างน้อย 10 ตัวอักษร
    *   **บังคับ Tag 1-3 ดาว**: ต้องเลือก Tag อย่างน้อย 1 รายการ
    *   **กรองคำหยาบ**: รีวิวที่มีคำหยาบจะถูก **บล็อกไม่ให้ส่ง** (ต่างจากแชทที่แค่ mask)

*   **รีวิวแบบไม่ระบุตัวตน (Anonymous Reviews)**:
    *   ผู้โดยสารเลือกรีวิวแบบไม่ระบุตัวตน → `displayName` เปลี่ยนเป็น "Anonymous Passenger"
    *   รองรับ Private Feedback — ข้อความที่มองเห็นเฉพาะคนขับ แยกจาก Comment สาธารณะ

*   **สถิติคนขับอัตโนมัติ (DriverStats)**:
    *   คำนวณ `avgRating`, `totalReviews`, `tagCounts` อัตโนมัติด้วย Prisma `$transaction` แบบ Atomic
    *   อัปเดตทุกครั้งที่มีรีวิวใหม่

*   **ระบบโต้แย้งรีวิว (Review Disputes)** (`reviewDispute.service.js`):
    *   คนขับสามารถโต้แย้งพร้อมเหตุผล: FAKE_REVIEW, WRONG_PERSON, INACCURATE, OFFENSIVE, OTHER
    *   Admin ตัดสิน: สามารถซ่อนรีวิว + คำนวณสถิติคนขับใหม่อัตโนมัติ

*   **การปฏิบัติตาม PDPA (Account Deletion)**:
    *   เมื่อลบบัญชี → รีวิวถูก Anonymize เป็น "Anonymous Passenger" (Soft Delete)
    *   สถิติคนขับยังคงสมบูรณ์

---

### 🛡️ ระบบความปลอดภัยและการป้องกัน (Security & Protection)

*   **ระบบจำกัดอัตราการเรียก API (Rate Limiting)** (`rateLimiter.js`):
    *   **3 ระดับ**: Global (1,000 req/15 นาที), Auth (30 req/15 นาที), Strict (10 req/15 นาที)
    *   รองรับการเปิด/ปิดผ่าน Runtime Security Config

*   **JWT ทนทานต่อการ Restart (Boot Epoch JWT)** (`jwt.js`):
    *   ฝัง `bootEpoch` ในทุก Token — Token จาก Server รอบก่อนหน้าจะถูกทำให้หมดอายุอัตโนมัติ
    *   บังคับ Re-login เมื่อ Server Restart (มาตรการรักษาความปลอดภัย)

*   **Runtime Security Config** (`securityConfig.js`, `securityConfig.routes.js`):
    *   Admin เปิด/ปิดฟีเจอร์ได้แบบ Real-time: `rateLimitEnabled`, `profanityFilterEnabled`, `contentFilterEnabled`, `blacklistCheckEnabled`
    *   จัดการผ่าน Admin Dashboard REST API

*   **ระบบพักการใช้งานอัตโนมัติ (Auto-Suspension)** (`penalty.service.js`):
    *   **ผู้โดยสาร**: ยกเลิกการจอง (CONFIRMED) 3 ครั้งใน 30 วัน → พักการใช้งาน 7 วัน
    *   **คนขับ**: ยกเลิกเส้นทาง 2 ครั้งใน 30 วัน → พักการใช้งาน 7 วัน
    *   **Admin Manual Suspension**: กำหนดแบบ Role-based (ผู้โดยสาร/คนขับ/ทั้งสอง) + ระยะเวลา หรือถาวร (0 วัน = ถาวร)
    *   **Suspension Middleware**: ตรวจสอบ `passengerSuspendedUntil` / `driverSuspendedUntil` ก่อนทุก Action

*   **การเก็บรักษาข้อมูล 90 วัน (Retention Purge)** (`retentionPurge.js`):
    *   Cron Job ทำงานทุกวันเวลา 02:00 UTC ด้วย `node-cron`
    *   ลบ `ChatMessage`, `VoiceCallLog` ที่หมดอายุ, Archive `ChatSession`
    *   ป้องกัน Session ที่มี Dispute ที่ยังไม่แก้ไขจากการถูกลบ
    *   บันทึกผลการ Purge ลง `SystemLog`
    *   **สอดคล้องกับ พ.ร.บ.คอมพิวเตอร์ฯ พ.ศ. 2560 มาตรา 26** (เก็บข้อมูลจราจร 90 วัน)

---

### 📍 ระบบแผนที่และตำแหน่ง (Map & Location Features)

*   **Composable ใหม่สำหรับแผนที่** (`useRouteMap.js`, `usePlace.js`, `useMapBounds.js`, `useGeolocation.js`, `useReverseGeocode.js`, `useVehicleTracking.js`):
    *   `useRouteMap`: จัดการแผนที่เส้นทางแบบครบวงจร
    *   `usePlace`: ค้นหาสถานที่จาก Google Places API + จัดเก็บ `SavedPlace` และ `RecentSearch`
    *   `useMapBounds`: คำนวณขอบเขตแผนที่
    *   `useGeolocation`: ดึงตำแหน่ง GPS ปัจจุบันของผู้ใช้
    *   `useReverseGeocode`: แปลงพิกัด GPS เป็นชื่อสถานที่
    *   `useVehicleTracking`: ติดตามตำแหน่งรถแบบ Real-time

*   **Province Overlay**: แสดง Overlay จังหวัดบนแผนที่

*   **Direction Sharing**: ปรับปรุง UI/Logic สำหรับแชร์เส้นทางในแชท

*   **Green Pickup Pin**: แสดง Pin สีเขียวที่จุดรับผู้โดยสาร พร้อม Directions Route บนแผนที่

---

### 👨‍💼 แดชบอร์ดผู้ดูแลระบบ (Admin Dashboard)

*   **หน้าจัดการใหม่ทั้งหมด** (`pages/admin/`):
    *   **Dashboard สรุปสถิติ**: จำนวนผู้ใช้, เส้นทาง, การจอง, รีวิว, แชท, รายได้
    *   **Chat Logs Viewer**: เรียกดูทุก Session + ข้อความที่ถูก Archive
    *   **Review Moderation**: ดู/แก้ไข Disputes, ซ่อนรีวิว
    *   **Chat Report Management**: ตรวจสอบ/ยกเลิกรายงานข้อความ
    *   **Security Settings**: เปิด/ปิด Rate Limiting, Profanity Filter, Content Filter, Blacklist Check
    *   **CRON Management**: ดูและควบคุม Retention Purge + Chat Lifecycle Jobs
    *   **System Logs**: Export เป็น CSV (รองรับ UTF-8 BOM สำหรับภาษาไทยใน Excel)
    *   **User Suspension**: จัดการพักการใช้งานแบบ Role-based
    *   **Driver Verifications**, **Vehicle Management**, **Route Management**, **Booking Management**

*   **Admin Components ใหม่**: `AdminHeader.vue`, `AdminSidebar.vue`

---

### 🎨 การปรับปรุง UI/UX (UI/UX Improvements)

*   **Dark Mode** (`useDarkMode.js`):
    *   บันทึกใน localStorage, เคารพ `prefers-color-scheme` ของระบบ
    *   ใช้ Tailwind `dark` class toggle
    *   ครอบคลุมทุกหน้ารวมถึง `/profile/my-vehicle`

*   **Components ใหม่ที่สร้างขึ้น**:
    *   `ChatBubble.vue`: ข้อความฟองสนทนา (สีน้ำเงินขวา = ของฉัน, สีเทาซ้าย = ผู้อื่น)
    *   `QuickReply.vue`: แผง Quick Reply พร้อมการจัดการ Shortcut
    *   `StarRating.vue`: Component ให้ดาว 1-5 แบบ Interactive
    *   `ReviewCard.vue`: การ์ดแสดงรีวิวพร้อม Tags และ Avatar
    *   `ToastNotification.vue` / `ToastWrapper.vue`: ระบบ Toast แจ้งเตือน
    *   `ConfirmModal.vue`: Modal ยืนยันการทำรายการ
    *   `ProfileSidebar.vue`: Sidebar โปรไฟล์ผู้ใช้

*   **ปรับปรุงหน้าเดินทาง (Trips Pages)**:
    *   รวมหน้า Trips ให้เป็น Unified Experience
    *   อัปเดต Header Navigation

*   **ปรับปรุง Booking Flow**:
    *   ป้องกันการจองซ้ำ (Duplicate Booking Prevention)
    *   เพิ่ม Loading State ที่ Frontend
    *   ปรับปรุง Error Handling ให้ชัดเจน
    *   เพิ่ม Server Logs สำหรับ Booking Errors

*   **Profile Menu & Navigation**:
    *   ปรับปรุงเมนูโปรไฟล์, Map Navigation
    *   เพิ่มเมนู Dark Mode Toggle

---

### 🗄️ การเปลี่ยนแปลงฐานข้อมูล (Database Schema Changes)

*   **Models ใหม่ 14 ตาราง**:

    | Model | วัตถุประสงค์ |
    |-------|-------------|
    | `ChatSession` | แชทกลุ่มต่อเส้นทาง พร้อมวงจรชีวิต (ACTIVE → ENDED → READ_ONLY → ARCHIVED) |
    | `ChatSessionParticipant` | Many-to-many: ผู้ใช้ ↔ แชทเซสชัน |
    | `ChatMessage` | ข้อความพร้อมกรองเนื้อหา, Unsend, Edit Metadata |
    | `VoiceCallLog` | Metadata การโทร (ระยะเวลา, สถานะ) พร้อม Retention 90 วัน |
    | `ChatReport` | รายงานข้อความจากผู้ใช้ |
    | `ChatLog` | สำเนาข้อความที่ถูก Archive (สำหรับ Admin Audit) |
    | `ArrivalNotification` | บันทึกการแจ้งเตือน GPS พร้อม Deduplication |
    | `NotificationLog` | Audit Trail สำหรับทุกการแจ้งเตือน |
    | `RideReview` | รีวิวจากผู้โดยสาร (Immutable) พร้อมตัวเลือกไม่ระบุตัวตน |
    | `ReviewDispute` | การโต้แย้งรีวิวจากคนขับ |
    | `DriverStats` | สถิติคะแนนคนขับแบบ Aggregate |
    | `SavedPlace` | สถานที่บันทึกของผู้ใช้ (บ้าน, ที่ทำงาน, กำหนดเอง) |
    | `RecentSearch` | ประวัติการค้นหาสถานที่ล่าสุด |
    | `QuickReplyShortcut` | ข้อความตอบกลับด่วนกำหนดเอง |

*   **Enums ใหม่ 8 รายการ**: `ChatSessionStatus`, `MessageType`, `RadiusType`, `ReviewStatus`, `DisputeStatus`, `ReportStatus`, `ReportReason`, `DisputeReason`

*   **Models ที่แก้ไข**:
    *   **User**: เพิ่ม `passengerSuspendedUntil`, `driverSuspendedUntil` + Relations ใหม่ 10 รายการ
    *   **Booking**: เพิ่ม `completedAt` (หน้าต่างรีวิว), `noShowDeadline` (นับถอยหลัง No-Show)
    *   **BookingStatus enum**: เพิ่ม `NO_SHOW`
    *   **NotificationType enum**: เพิ่ม `CHAT`, `ARRIVAL`, `REVIEW`

---

### 🧪 Testing Coverage / การทดสอบ

*   **Unit Tests (Jest)** — 21 ไฟล์ทดสอบใน `server/src/__tests__/`:

    | ไฟล์ทดสอบ | ขอบเขต |
    |-----------|--------|
    | `chat-service.test.js` (621 บรรทัด) | Quick Reply, sendMessage, Content Filter, Session Lifecycle, Unsend, Location Sharing |
    | `arrival-notification.test.js` (619 บรรทัด) | GPS 3-tier Triggers, Email, In-App, Deduplication, Manual Trigger |
    | `review-immutability.test.js` | หน้าต่าง 7 วัน, Anonymization, Immutability Guarantee |
    | `content-filter.test.js` | Phone Masking, URL Blocking, Profanity Masking, Clean Text Passthrough |
    | `profanity-filter.test.js` | ตรวจจับไทย/อังกฤษ, Masking, Whitelist, Normalization, Spaced-out Words |
    | `admin-suspension.test.js` | Role Validation, Duration Calculation, Permanent Suspension |
    | `trip-lifecycle.test.js` (916 บรรทัด) | Full Booking Flow: Create → Confirm → Start → Board → Complete → End |
    | `dashboard-service.test.js` | Admin Statistics Aggregation |
    | `gps-distance.test.js` | Haversine Formula Accuracy |
    | `blacklist-banned-role.test.js` | Blacklist Check by Role |
    | `session-timeout.test.js` | Session Timeout Behavior |
    | `systemlog-delete-retention.test.js` | SystemLog Immutability |
    | + อีก 9 ไฟล์ | ครอบคลุม Edge Cases อื่นๆ |

*   **E2E Tests (Playwright)** — `realtime-chat.spec.ts` (605 บรรทัด, 12 Scenarios):

    | Scenario | สิ่งที่ทดสอบ |
    |----------|-------------|
    | 1 | แชท Real-time สองทิศทาง |
    | 2 | Quick Reply (ข้อความสำเร็จรูป) |
    | 3 | สร้าง Quick Reply ใหม่ + ส่ง |
    | 4 | ลบ Quick Reply |
    | 5 | อัปโหลดรูปภาพ (ปฏิเสธ PDF + รับ JPG/PNG) |
    | 6 | แชร์ตำแหน่ง (ลิงก์ Google Maps) |
    | 7 | หยุดแชร์ตำแหน่ง (Revocation) |
    | 8 | ปฏิเสธข้อความว่าง |
    | 9 | Refresh หน้าข้อมูลยังคงอยู่ (Persistence) |
    | 10 | ขาดการเชื่อมต่อ/กลับมา (Resilience) |
    | 11 | แก้ไขข้อความ 3 ครั้ง + ดูประวัติการแก้ไข |
    | 12 | Unsend ข้อความแบบ Real-time |

*   **Robot Framework Tests** — `epic2_arrival_notification.robot` (235 บรรทัด, 9 กรณีทดสอบ):
    *   E2E GPS Simulation ด้วยพิกัดจริงในขอนแก่น (Central → มข.)
    *   ตรวจสอบ UI กระดิ่งแจ้งเตือน (Notification Bell)
    *   ยืนยัน GPS Notification ทั้ง 3 ประเภทถูกบันทึก
    *   Manual Arrival Trigger
    *   ตรวจสอบสถานะการส่ง Email
    *   ตรวจสอบการแจ้งเตือนฝั่งผู้โดยสาร
    *   ใช้ Dynamic `booking_id` จาก API แทน Hardcoded

---

### ⚙️ โครงสร้างและ Dependencies (Infrastructure)

*   **Dependencies ใหม่ที่เพิ่ม**:
    *   `socket.io` / `socket.io-client` — WebSocket Real-time Communication
    *   `node-cron` — Scheduled Tasks (Retention Purge, Chat Lifecycle)
    *   `nodemailer` — Email Delivery (SMTP/Gmail)
    *   `express-rate-limit` — API Rate Limiting
    *   Cloudinary SDK — Image Upload/CDN สำหรับรูปภาพในแชท

*   **Architecture Pattern**:
    *   Service-Controller-Route Layered Architecture + Validation Middleware
    *   Composable Pattern (Vue 3 Composition API) สำหรับ Client-side
    *   Socket.IO สำหรับทุกฟีเจอร์ Real-time (Chat, Tracking, Notifications, Presence)

---

### 🐛 Bug Fixes / การแก้ไขบั๊ก

*   **Booking System**:
    *   แก้ไข Duplicate Booking — ป้องกันผู้โดยสารจองซ้ำในเส้นทางเดียวกัน
    *   ปรับปรุง Error Handling สำหรับ Booking Errors ให้แสดงข้อความชัดเจน
    *   เพิ่ม Server-side Logging สำหรับวินิจฉัยปัญหาการจอง

*   **Chat System**:
    *   แก้ไข Arrival Alert Watcher ให้ตรวจจับ Notification ใหม่ได้อย่างน่าเชื่อถือ
    *   แก้ไข Edit/Unsend UI ด้วย Three-dots Menu + Real-time Updates
    *   คืนค่า Edit/Unsend UI หลังจากถูกลบออกโดยไม่ตั้งใจ

*   **Admin Verification**:
    *   ปรับปรุงกระบวนการ Admin Verification พร้อม UI Fixes

*   **General**:
    *   แก้ไข Text Gap ในหน้า Review และ Chat
    *   แก้ไข Share Direction UI/Logic
    *   แก้ไข Prisma Schema Conflicts เมื่อ Merge branches

---

### 📄 เอกสารประกอบ Sprint 2 (Documentation)

*   **เอกสารที่สร้างใหม่**:
    *   Sprint 2 Backlog Overview (`sprint2-backlog-overview.md`)
    *   Epic 1: Secure In-App Messaging Backlog (`epic1-secure-messaging.md`)
    *   Epic 2: In-Chat Arrival Notification Backlog (`epic2-arrival-notification.md`)
    *   Epic 3: Ride Review & Rating System Backlog (`epic3-review-rating.md`)
    *   Database Schema Documentation (`database.md`) — พร้อม ER Diagram แบบ Mermaid
    *   AI Declaration / การประกาศการใช้ปัญญาประดิษฐ์ (`Declare_AI.md`)

---

## Contributors / ผู้ร่วมพัฒนา

| ผู้พัฒนา | ช่วงเวลาหลัก | ขอบเขตงาน |
|----------|-------------|-----------|
| @kriangkraiii | 26 ก.พ. — 4 มี.ค. 2026 | Architecture, Socket.IO, Chat, Tracking, Map, Admin, Security, DB Schema, Dark Mode, Booking Flow |
| @4mpcln | 28 ก.พ. — 3 มี.ค. 2026 | Playwright E2E Tests (12 Scenarios), Chat UI, Direction Sharing |
| @conan2547 | 28 ก.พ. — 3 มี.ค. 2026 | Robot Framework Tests, Arrival Notification, Review Workflow, Chat Edit/Unsend, CI/CD |
