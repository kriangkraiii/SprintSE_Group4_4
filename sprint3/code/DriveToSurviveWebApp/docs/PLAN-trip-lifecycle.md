# 🚗 Trip Lifecycle, Notifications & Driver Actions

## สรุปปัญหาปัจจุบัน

| #   | ปัญหา                                                                             | สถานะปัจจุบันในระบบ                                                                                                                         |
| --- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **แจ้งเตือน 5km/1km/ถึงแล้ว** ไม่ทำงาน (ทั้ง in-app และ email)                    | Backend มี `checkAndNotify()` ครบแล้ว แต่ **ไม่มี Frontend เรียกใช้** — Tracking page ไม่ส่ง GPS ไป API                                     |
| 2   | **คนขับไม่มีปุ่มยอมรับ/ปฏิเสธ**                                                   | Backend มี `PATCH /bookings/:id/status` ครบ, Frontend มีปุ่ม **"ยืนยันคำขอ"** และ **"ปฏิเสธ"** ใน myTrips อยู่แล้ว — ต้องตรวจว่าทำไมไม่แสดง |
| 3   | **ไม่มีปุ่ม action ระหว่างทริป** เช่น รับผู้โดยสาร, ถึงจุดหมาย, สิ้นสุดการเดินทาง | ไม่มีเลย — ต้องเพิ่มทั้ง Backend + Frontend                                                                                                 |

---

## 🧠 Brainstorm

### Issue 1: Proximity Notifications (5km/1km/Arrived)

**Root Cause:** Backend `arrivalNotification.service.js` มี `checkAndNotify()` พร้อมแจ้งเตือนทั้ง in-app + email ครบ แต่ Tracking page (`/tracking/[routeId]`) ไม่ได้ส่ง GPS coordinates ไปเรียก API เลย

#### Option A: **GPS Polling จาก Tracking Page** ⭐ แนะนำ

- Tracking page ส่ง driver GPS ทุก 15-30 วินาที ไป `POST /arrival-notifications/:bookingId/check`
- ใช้ `navigator.geolocation.watchPosition()` ฝั่ง client
- ✅ ง่าย, ใช้ API ที่มีอยู่แล้ว
- ❌ ต้องเปิดหน้า tracking ไว้

#### Option B: **Background GPS via Service Worker**

- ✅ ทำงานแม้ปิดหน้า
- ❌ ซับซ้อนมาก, browser support จำกัด

#### Option C: **Socket.io real-time GPS stream**

- ✅ real-time, latency ต่ำ
- ❌ ต้อง refactor tracking page ใหม่

> **💡 เลือก Option A** — ใช้ API เดิม + polling จาก tracking page

---

### Issue 2: Driver Accept/Reject Buttons

**Root Cause:** ปุ่มมีอยู่แล้ว (บรรทัด 445-447 ของ myTrips) แต่ต้องตรวจว่า:

1. Booking ที่ดึงมามี `status: 'pending'` จริงหรือไม่
2. Role toggle ใน myTrips อยู่ในโหมด "คนขับ" หรือเปล่า
3. API `/bookings/:id/status` ถูกเรียกถูกต้องไหม

> **💡 แก้ไข:** ตรวจสอบ + debug ว่า booking status ที่ได้จาก API เป็น lowercase ตรงกับ condition `item.status === 'pending'`

---

### Issue 3: Trip Lifecycle Action Buttons (Grab/Bolt-style)

**สถานะปัจจุบัน:** BookingStatus enum มี `IN_PROGRESS` แล้วแต่ไม่มี UI ใช้

#### Flow ที่เสนอ (ยึดตาม Grab/Bolt):

```
CONFIRMED → [🚗 เริ่มเดินทาง] → IN_TRANSIT (Route)
         → [👤 รับผู้โดยสารแล้ว] → IN_PROGRESS (Booking)
         → [📍 ถึงจุดหมายแล้ว] → COMPLETED (Booking + Route)
```

| ปุ่ม                    | ใครกด | เปลี่ยน Status                                       | เงื่อนไข               |
| ----------------------- | ----- | ---------------------------------------------------- | ---------------------- |
| **🚗 เริ่มเดินทาง**     | คนขับ | Route → `IN_TRANSIT`                                 | Route = AVAILABLE/FULL |
| **👤 รับผู้โดยสารแล้ว** | คนขับ | Booking → `IN_PROGRESS`                              | Booking = CONFIRMED    |
| **📍 ส่งผู้โดยสารแล้ว** | คนขับ | Booking → `COMPLETED`                                | Booking = IN_PROGRESS  |
| **✅ สิ้นสุดเดินทาง**   | คนขับ | Route → `COMPLETED`, Bookings ที่เหลือ → `COMPLETED` | Route = IN_TRANSIT     |

---

## 📋 Proposed Changes

### Phase 1: Fix Proximity Notifications

#### [MODIFY] [tracking/[routeId].vue](file:///Users/kriangkrai/Developer/Projects/Git_soften/SprintSE_Group4_4/DriveToSurviveWebApp/client/pages/tracking/[routeId].vue)

- เพิ่ม GPS polling สำหรับคนขับ: `watchPosition()` → POST `/arrival-notifications/:bookingId/check` ทุก 15 วินาที
- แสดง toast/banner เมื่อผู้โดยสารได้รับ arrival-alert ผ่าน socket

---

### Phase 2: Debug Driver Accept/Reject

#### [MODIFY] [myTrips/index.vue](file:///Users/kriangkrai/Developer/Projects/Git_soften/SprintSE_Group4_4/DriveToSurviveWebApp/client/pages/myTrips/index.vue)

- ตรวจสอบว่า booking status ที่ได้จาก API ตรงกับ condition `'pending'` (lowercase)
- เพิ่ม console debug ชั่วคราวเพื่อหาปัญหา

---

### Phase 3: Trip Lifecycle Action Buttons

#### Backend

##### [MODIFY] [booking.service.js](file:///Users/kriangkrai/Developer/Projects/Git_soften/SprintSE_Group4_4/DriveToSurviveWebApp/server/src/services/booking.service.js)

- เพิ่ม logic ใน `updateBookingStatus()` สำหรับ `IN_PROGRESS` และ `COMPLETED`
- ส่ง notification ให้ผู้โดยสารเมื่อ status เปลี่ยน

##### [MODIFY] [route.service.js](file:///Users/kriangkrai/Developer/Projects/Git_soften/SprintSE_Group4_4/DriveToSurviveWebApp/server/src/services/route.service.js) (หรือสร้าง endpoint ใหม่)

- เพิ่ม `startTrip()`: Route → IN_TRANSIT
- เพิ่ม `endTrip()`: Route → COMPLETED + Bookings ที่เหลือ → COMPLETED

#### Frontend

##### [MODIFY] [myTrips/index.vue](file:///Users/kriangkrai/Developer/Projects/Git_soften/SprintSE_Group4_4/DriveToSurviveWebApp/client/pages/myTrips/index.vue)

- เพิ่มปุ่ม action ตาม status ของ booking/route:
  - **Route card**: "🚗 เริ่มเดินทาง"ถ้าเริ่มเดินทางแล้วจะไม่มีปุ่มนี้แ / "✅ สิ้นสุดเดินทาง"ถ้าสิ้นสุดแล้วจะไม่มีปุ่มนี้และทริปจะจบลง
  - **Booking card**: "👤 รับผู้โดยสารแล้ว" / "📍 ส่งผู้โดยสารแล้ว"ในผู้โดยสารทุกคน
- เพิ่ม status badge สำหรับ `in_progress` และ `in_transit`
-เพิ่ม ปุ่มฝั่งผู้โดยสารว่าขึ้นรถแล้วถ้ากดแล้วจะไม่มีปุ่มนี้
ปุ่มฝั่งผู้โดยสารวและคนขับจะแยกกันห้ามแสดงให้อีกฝ่ายเห็นใช้ของใครของมัน

---

## ลำดับการทำงาน

| #   | งาน                                   | ความเร่งด่วน |
| --- | ------------------------------------- | ------------ |
| 1   | Debug ปุ่มยอมรับ/ปฏิเสธ (Phase 2)     | 🔴 สูง       |
| 2   | เพิ่มปุ่ม Trip Lifecycle (Phase 3)    | 🔴 สูง       |
| 3   | Fix Proximity Notifications (Phase 1) | 🟡 กลาง      |

---

## Verification Plan

1. **ปุ่มยอมรับ/ปฏิเสธ**: Login เป็น driver → myTrips → mode คนขับ → ดูว่ามีปุ่มหรือไม่
2. **Trip Lifecycle**: สร้าง booking → CONFIRM → กด "เริ่มเดินทาง" → "รับผู้โดยสาร" → "ส่งผู้โดยสาร" → verify status change
3. **Notifications**: เปิด tracking page → verify GPS polling → ตรวจ notification in-app + email log
