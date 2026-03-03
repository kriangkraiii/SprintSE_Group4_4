# 📋 Sprint 2 — Test Cases Document

> **Project:** DriveToSurvive Ride-Sharing Web Application
> **Sprint:** 2 — Secure Messaging, Arrival Notification, Ride Review
> **Prepared for:** QA Testers
> **Date:** 2026-02-27
> **Version:** 1.0

---

## 📌 สารบัญ (Table of Contents)

1. [Epic 1: Secure In-App Messaging](#epic-1-secure-in-app-messaging)
2. [Epic 2: In-Chat Arrival Notification](#epic-2-in-chat-arrival-notification)
3. [Epic 3: Ride Review & Rating System](#epic-3-ride-review--rating-system)
4. [Admin Features](#admin-features)
5. [Cross-Cutting Concerns](#cross-cutting-concerns)

---

## 🔑 Test Account Setup

| Role | Username | Password | หมายเหตุ |
|------|----------|----------|---------|
| Admin | admin | admin123 | สร้างอัตโนมัติเมื่อเริ่มระบบ |
| Passenger | (สร้างใหม่) | — | ลงทะเบียนผ่าน /register |
| Driver | (สร้างใหม่) | — | ลงทะเบียน + ยืนยันตัวตน |

---

## Epic 1: Secure In-App Messaging

### TC-1.1: สร้าง Chat Session เมื่อจองสำเร็จ

| Field | Detail |
|-------|--------|
| **Pre-condition** | Passenger มี booking status = CONFIRMED |
| **Steps** | 1. Passenger เข้าหน้า Chat List (`/chat`) <br> 2. ตรวจสอบว่ามี session ปรากฏ <br> 3. คลิกเข้า session |
| **Expected** | ✅ Chat session สร้างอัตโนมัติ มีชื่อ Driver แสดง <br> ✅ สถานะ "🟢 ออนไลน์" หรือ "🔴 จบแล้ว" |
| **Priority** | High |

---

### TC-1.2: ส่งข้อความปกติ

| Field | Detail |
|-------|--------|
| **Pre-condition** | อยู่ในหน้าแชท session ที่ ACTIVE |
| **Steps** | 1. พิมพ์ข้อความ "สวัสดีครับ" <br> 2. กด Enter หรือปุ่มส่ง |
| **Expected** | ✅ ข้อความปรากฏในแชทฝั่งผู้ส่ง (ฟองแชทสีฟ้า ชิดขวา) <br> ✅ อีกฝ่ายเห็นข้อความ (ฟองสีเทา ชิดซ้าย) |
| **Priority** | High |

---

### TC-1.3: Content Filter — เบอร์โทร

| Field | Detail |
|-------|--------|
| **Pre-condition** | อยู่ในหน้าแชท session ที่ ACTIVE |
| **Steps** | 1. พิมพ์ "เบอร์ผม 081-234-5678" <br> 2. กดส่ง |
| **Expected** | ✅ ข้อความที่แสดง = "เบอร์ผม XXX-XXX-XXXX" <br> ✅ `originalContent` เก็บข้อความจริงไว้ใน DB <br> ✅ `isFiltered = true` |
| **Priority** | High |

---

### TC-1.4: Content Filter — URL

| Field | Detail |
|-------|--------|
| **Pre-condition** | อยู่ในหน้าแชท |
| **Steps** | 1. พิมพ์ "ดูข้อมูลที่ https://example.com" <br> 2. กดส่ง |
| **Expected** | ✅ Server reject ด้วย HTTP 400 "Message contains blocked URL" <br> ✅ ข้อความไม่ถูกส่ง |
| **Priority** | High |

---

### TC-1.5: Content Filter — คำหยาบ

| Field | Detail |
|-------|--------|
| **Pre-condition** | อยู่ในหน้าแชท |
| **Steps** | 1. พิมพ์ข้อความที่มีคำหยาบ (ภาษาไทยหรืออังกฤษ) <br> 2. กดส่ง |
| **Expected** | ✅ คำหยาบถูกแทนที่ด้วย `***` <br> ✅ `originalContent` เก็บข้อความจริง <br> ✅ `isFiltered = true` |
| **Priority** | Medium |

---

### TC-1.6: Unsend ข้อความ (ภายใน 2 นาที)

| Field | Detail |
|-------|--------|
| **Pre-condition** | ส่งข้อความไปแล้วไม่เกิน 2 นาที |
| **Steps** | 1. คลิกที่ข้อความที่ตนเองส่ง <br> 2. เลือก "ลบข้อความ" |
| **Expected** | ✅ ข้อความเปลี่ยนเป็น "ข้อความถูกลบ / Message unsent" <br> ✅ `isUnsent = true` <br> ✅ อีกฝ่ายเห็นว่าข้อความถูกลบ |
| **Priority** | Medium |

---

### TC-1.7: Unsend ข้อความ (เกิน 2 นาที)

| Field | Detail |
|-------|--------|
| **Pre-condition** | ส่งข้อความไปแล้วเกิน 2 นาที |
| **Steps** | 1. พยายาม unsend ข้อความเก่า |
| **Expected** | ✅ Server reject ด้วย HTTP 400 "Unsend window expired (2 minutes)" |
| **Priority** | Medium |

---

### TC-1.8: Quick Reply — Passenger

| Field | Detail |
|-------|--------|
| **Pre-condition** | Passenger อยู่ในหน้าแชท session ACTIVE |
| **Steps** | 1. กดปุ่ม ⚡ (ตอบกลับด่วน) ข้างช่องพิมพ์ <br> 2. เลือกข้อความ เช่น "รับทราบค่ะ/ครับ" |
| **Expected** | ✅ แผง Quick Reply ปรากฏขึ้นเหนือ input <br> ✅ เห็น 4 ข้อความสำเร็จรูปสำหรับ Passenger <br> ✅ เมื่อเลือก → ข้อความถูกส่งอัตโนมัติ <br> ✅ แผง Quick Reply ปิดลง |
| **Priority** | Medium |

---

### TC-1.9: Quick Reply — Driver

| Field | Detail |
|-------|--------|
| **Pre-condition** | Driver อยู่ในหน้าแชท session ACTIVE |
| **Steps** | 1. กดปุ่ม ⚡ <br> 2. ตรวจสอบว่าเห็น template สำหรับ Driver |
| **Expected** | ✅ เห็น 4 ข้อความสำเร็จรูปสำหรับ Driver (เช่น "กำลังไปรับครับ") <br> ✅ ส่งอัตโนมัติเมื่อเลือก |
| **Priority** | Medium |

---

### TC-1.10: แชร์ตำแหน่ง GPS

| Field | Detail |
|-------|--------|
| **Pre-condition** | อยู่ในแชท session ACTIVE + เบราว์เซอร์รองรับ Geolocation |
| **Steps** | 1. กดปุ่ม 📍 ที่ header ของแชท <br> 2. อนุญาตให้เข้าถึง GPS |
| **Expected** | ✅ ข้อความแชร์ตำแหน่งปรากฏ (type = LOCATION) <br> ✅ Toast "แชร์ตำแหน่งแล้ว" |
| **Priority** | Medium |

---

### TC-1.11: รายงานข้อความ

| Field | Detail |
|-------|--------|
| **Pre-condition** | อยู่ในแชท session ACTIVE |
| **Steps** | 1. คลิกที่ข้อความของอีกฝ่าย <br> 2. เลือก "รายงาน" <br> 3. เลือกเหตุผล (HARASSMENT / SPAM / INAPPROPRIATE / PRIVACY_VIOLATION / OTHER) <br> 4. กด "ส่งรายงาน" |
| **Expected** | ✅ Modal รายงานปรากฏ <br> ✅ เลือกเหตุผลได้ <br> ✅ ส่งสำเร็จ → Toast "รายงานแล้ว" <br> ✅ ปรากฏใน Admin Chat Reports |
| **Priority** | High |

---

### TC-1.12: รายงานข้อความ — ซ้ำ

| Field | Detail |
|-------|--------|
| **Steps** | 1. รายงานข้อความที่เคยรายงานแล้ว |
| **Expected** | ✅ Server reject ด้วย HTTP 409 "Already reported" |
| **Priority** | Low |

---

### TC-1.13: แชทที่จบแล้ว (Read-Only)

| Field | Detail |
|-------|--------|
| **Pre-condition** | Session status = ENDED |
| **Steps** | 1. เปิดแชท session ที่ ENDED |
| **Expected** | ✅ ข้อความทั้งหมดยังเห็นได้ <br> ✅ ช่องพิมพ์หายไป → แสดง "🔒 แชทนี้ถูกปิดแล้ว — อ่านอย่างเดียว" <br> ✅ ไม่มีปุ่มแชร์ตำแหน่ง |
| **Priority** | Medium |

---

### TC-1.14: WebSocket Real-time

| Field | Detail |
|-------|--------|
| **Pre-condition** | เปิดแชทจาก 2 เบราว์เซอร์ (Driver + Passenger) |
| **Steps** | 1. ฝ่ายหนึ่งส่งข้อความ <br> 2. ดูอีกเบราว์เซอร์ |
| **Expected** | ✅ ข้อความปรากฏแบบ real-time (ไม่ต้อง refresh) <br> ✅ Typing indicator แสดงเมื่อกำลังพิมพ์ |
| **Priority** | High |

---

## Epic 2: In-Chat Arrival Notification

### TC-2.1: Notification 5 กม.

| Field | Detail |
|-------|--------|
| **Pre-condition** | Booking status = CONFIRMED, driver กำลังเดินทาง |
| **Steps** | 1. เรียก API `POST /api/arrival-notifications/check` ด้วย GPS ที่ห่างจากจุดรับ ~4 กม. |
| **Expected** | ✅ Notification `FIVE_KM` ถูกสร้าง <br> ✅ Passenger ได้รับ in-app notification "🚗 คนขับใกล้ถึงแล้ว" <br> ✅ อีเมลถูกส่ง (ถ้ามี email ที่ valid) <br> ✅ ArrivalNotification record ถูกบันทึก |
| **Priority** | High |

---

### TC-2.2: Notification 1 กม.

| Field | Detail |
|-------|--------|
| **Steps** | 1. เรียก API ด้วย GPS ที่ห่างจากจุดรับ ~0.8 กม. |
| **Expected** | ✅ Notification `ONE_KM` ถูกสร้าง <br> ✅ "🚗 คนขับใกล้ถึงมาก" |
| **Priority** | High |

---

### TC-2.3: Notification 0 กม. (ถึงแล้ว)

| Field | Detail |
|-------|--------|
| **Steps** | 1. เรียก API ด้วย GPS ที่ห่างจากจุดรับ ~0.05 กม. |
| **Expected** | ✅ Notification `ZERO_KM` ถูกสร้าง <br> ✅ "✅ คนขับถึงจุดรับแล้ว!" <br> ✅ **No-Show countdown เริ่มนับ 20 นาทีอัตโนมัติ** |
| **Priority** | Critical |

---

### TC-2.4: Manual Arrival Trigger

| Field | Detail |
|-------|--------|
| **Pre-condition** | Driver เป็นเจ้าของ booking |
| **Steps** | 1. เรียก API `POST /api/arrival-notifications/manual` ด้วย bookingId |
| **Expected** | ✅ Notification `MANUAL` ถูกสร้าง <br> ✅ "✅ คนขับแจ้งว่าถึงแล้ว" <br> ✅ No-Show countdown เริ่มนับ |
| **Priority** | High |

---

### TC-2.5: Manual Arrival — Cooldown 5 นาที

| Field | Detail |
|-------|--------|
| **Steps** | 1. กด Manual Trigger ครั้งแรก → สำเร็จ <br> 2. กดอีกครั้งภายใน 5 นาที |
| **Expected** | ✅ ครั้งแรก → สำเร็จ <br> ✅ ครั้งที่สอง → HTTP 429 "Already notified recently. Please wait." |
| **Priority** | Medium |

---

### TC-2.6: Deduplication — ไม่ส่ง Notification ซ้ำ

| Field | Detail |
|-------|--------|
| **Steps** | 1. ส่ง GPS ที่ 4 กม. → ได้ FIVE_KM <br> 2. ส่ง GPS ที่ 3 กม. อีกครั้ง |
| **Expected** | ✅ ครั้งที่สอง → newNotifications = [] (ไม่มี notification ใหม่) <br> ✅ crossedRadii ยังแสดง FIVE_KM |
| **Priority** | High |

---

### TC-2.7: Notification History (Audit)

| Field | Detail |
|-------|--------|
| **Steps** | 1. เรียก `GET /api/arrival-notifications/{bookingId}` |
| **Expected** | ✅ แสดงรายการ notifications ทั้งหมดเรียงตามเวลา <br> ✅ มี radiusType, driverLat, driverLon, appStatus, emailStatus |
| **Priority** | Low |

---

## No-Show Countdown

### TC-2.8: No-Show Countdown — เริ่มนับ

| Field | Detail |
|-------|--------|
| **Pre-condition** | Driver ถึงจุดรับ (0KM หรือ MANUAL trigger) |
| **Steps** | 1. ตรวจ noShowDeadline ใน Booking |
| **Expected** | ✅ `noShowDeadline` ถูกตั้งเป็น now + 20 นาที <br> ✅ `GET /api/no-show/{bookingId}/status` → `active: true, remainingSeconds: ~1200` |
| **Priority** | High |

---

### TC-2.9: No-Show — ยกเลิกเมื่อรับผู้โดยสาร

| Field | Detail |
|-------|--------|
| **Steps** | 1. Driver รับผู้โดยสารแล้ว → booking status เปลี่ยนเป็น IN_PROGRESS |
| **Expected** | ✅ noShowDeadline ถูก clear เป็น null |
| **Priority** | High |

---

### TC-2.10: No-Show — Execute (ผู้โดยสารไม่มา)

| Field | Detail |
|-------|--------|
| **Pre-condition** | noShowDeadline <= ปัจจุบัน (หมดเวลาแล้ว) |
| **Steps** | 1. Driver เรียก `POST /api/no-show/{bookingId}/execute` |
| **Expected** | ✅ Booking status → `no_show` <br> ✅ noShowDeadline → null <br> ✅ Passenger ได้รับ notification "ถูกยกเลิก: ไม่มาตามนัด" <br> ✅ SystemLog บันทึก action `BOOKING_NO_SHOW` |
| **Priority** | Critical |

---

### TC-2.11: No-Show — ยังไม่หมดเวลา

| Field | Detail |
|-------|--------|
| **Pre-condition** | noShowDeadline ยังไม่ถึง |
| **Steps** | 1. Driver พยายาม execute no-show |
| **Expected** | ✅ HTTP 400 "ยังไม่หมดเวลา No-Show countdown" |
| **Priority** | Medium |

---

## Epic 3: Ride Review & Rating System

### TC-3.1: สร้างรีวิว (5 ดาว)

| Field | Detail |
|-------|--------|
| **Pre-condition** | Booking status = COMPLETED, ภายใน 7 วัน |
| **Steps** | 1. เข้าหน้า `/reviews/create?bookingId=xxx` <br> 2. เลือก 5 ดาว <br> 3. เลือก tag "polite" <br> 4. เขียนความเห็น "ดีมากครับ" <br> 5. กด Submit |
| **Expected** | ✅ รีวิวถูกสร้างสำเร็จ <br> ✅ Driver stats อัปเดต (avgRating, totalReviews, tagCounts) <br> ✅ redirect กลับหน้า reviews |
| **Priority** | Critical |

---

### TC-3.2: สร้างรีวิว (1-2 ดาว) — ต้องมี comment 10 ตัวอักษร

| Field | Detail |
|-------|--------|
| **Steps** | 1. เลือก 2 ดาว <br> 2. เลือก tag "reckless_driving" <br> 3. เขียนความเห็น "แย่" (4 ตัว) <br> 4. กด Submit |
| **Expected** | ✅ ปุ่ม Submit **disabled** <br> ✅ แสดงข้อความ "ต้องเขียนความเห็นอย่างน้อย 10 ตัวอักษร" <br> ✅ เมื่อเขียนครบ 10 ตัว → ปุ่ม Submit กดได้ |
| **Priority** | Critical |

---

### TC-3.3: สร้างรีวิว (1-3 ดาว) — ต้องเลือก tag

| Field | Detail |
|-------|--------|
| **Steps** | 1. เลือก 3 ดาว <br> 2. ไม่เลือก tag <br> 3. กด Submit |
| **Expected** | ✅ ปุ่ม Submit **disabled** <br> ✅ แสดงข้อความ "ต้องเลือก tag อย่างน้อย 1 รายการ" |
| **Priority** | Critical |

---

### TC-3.4: Tag Validation ตาม Rating

| Field | Detail |
|-------|--------|
| **Steps** | 1. เลือก 5 ดาว → ลองเลือก negative tag เช่น "reckless_driving" |
| **Expected** | ✅ Server reject: "Invalid tags for this rating" <br> ✅ 4-5 ดาว = positive tags เท่านั้น <br> ✅ 1-3 ดาว = negative tags เท่านั้น |
| **Priority** | High |

---

### TC-3.5: Profanity Check ในรีวิว

| Field | Detail |
|-------|--------|
| **Steps** | 1. เขียน comment ที่มีคำหยาบ <br> 2. กด Submit |
| **Expected** | ✅ Server reject: "Review contains inappropriate language" <br> ✅ ข้อความไม่ถูกบันทึก |
| **Priority** | High |

---

### TC-3.6: Duplicate Review Prevention

| Field | Detail |
|-------|--------|
| **Steps** | 1. รีวิว booking ที่เคยรีวิวแล้ว |
| **Expected** | ✅ HTTP 409 "Already reviewed" |
| **Priority** | High |

---

### TC-3.7: Review Window — 7 วัน

| Field | Detail |
|-------|--------|
| **Pre-condition** | Booking completedAt > 7 วันที่แล้ว |
| **Steps** | 1. พยายามรีวิว booking ที่เกิน 7 วัน |
| **Expected** | ✅ HTTP 410 "Review period expired (7 days)" |
| **Priority** | High |

---

### TC-3.8: Retroactive Review (รีวิวย้อนหลัง)

| Field | Detail |
|-------|--------|
| **Pre-condition** | Passenger มี booking COMPLETED ภายใน 7 วัน แต่ยังไม่ได้รีวิว |
| **Steps** | 1. Login กลับเข้ามา <br> 2. ไปที่ `/reviews` <br> 3. ดู "Pending Reviews" |
| **Expected** | ✅ `GET /reviews/pending` แสดงรายการ booking ที่ยังไม่ได้รีวิว <br> ✅ กดรีวิวย้อนหลังได้ <br> ✅ หลังรีวิว → booking หายจากรายการ pending |
| **Priority** | Critical |

---

### TC-3.9: Anonymous Review

| Field | Detail |
|-------|--------|
| **Steps** | 1. ทำรีวิวแบบ Anonymous (checkbox) <br> 2. ดูรีวิวจากหน้า Driver profile |
| **Expected** | ✅ displayName = "Anonymous Passenger" <br> ✅ ไม่แสดงชื่อจริง |
| **Priority** | Medium |

---

### TC-3.10: Review Immutability (ห้ามแก้ไข/ลบ)

| Field | Detail |
|-------|--------|
| **Steps** | 1. ตรวจสอบว่าไม่มีปุ่ม "แก้ไข" หรือ "ลบ" บนรีวิว <br> 2. ลอง call API `PUT /reviews/:id` หรือ `DELETE /reviews/:id` |
| **Expected** | ✅ ไม่มีปุ่ม edit/delete ใน UI <br> ✅ API → HTTP 404 (ไม่มี route) |
| **Priority** | Critical |

---

### TC-3.11: Account Deletion → Review Anonymization

| Field | Detail |
|-------|--------|
| **Pre-condition** | Passenger มีรีวิวอยู่ในระบบแล้ว |
| **Steps** | 1. Passenger ลบบัญชี <br> 2. ดูรีวิวจากหน้า Driver profile |
| **Expected** | ✅ รีวิวยังแสดงอยู่ <br> ✅ displayName → "Anonymous Passenger" <br> ✅ status → "ANONYMIZED" <br> ✅ **Rating + comment + tags ไม่เปลี่ยน** |
| **Priority** | Critical |

---

### TC-3.12: Driver Dispute

| Field | Detail |
|-------|--------|
| **Pre-condition** | Driver มีรีวิวที่ตนได้รับ |
| **Steps** | 1. Driver เรียก `POST /reviews/disputes` ด้วย reviewId + reason + detail <br> 2. ตรวจหน้า Admin |
| **Expected** | ✅ Dispute ถูกสร้าง status = PENDING <br> ✅ ปรากฏในหน้า Admin Sprint 2 → tab Disputes |
| **Priority** | High |

---

### TC-3.13: Driver Dispute — Duplicate

| Field | Detail |
|-------|--------|
| **Steps** | 1. Driver dispute รีวิวเดิมซ้ำ |
| **Expected** | ✅ HTTP 409 "Already disputed" |
| **Priority** | Low |

---

### TC-3.14: ดูสถิติ Driver (Public)

| Field | Detail |
|-------|--------|
| **Steps** | 1. เรียก `GET /reviews/driver/{driverId}/stats` |
| **Expected** | ✅ แสดง avgRating, totalReviews, tagCounts <br> ✅ ไม่รวมรีวิวที่ HIDDEN |
| **Priority** | Medium |

---

## Admin Features

### TC-4.1: Admin — Resolve Dispute (ซ่อนรีวิว)

| Field | Detail |
|-------|--------|
| **Pre-condition** | Admin login, มี dispute status = PENDING |
| **Steps** | 1. ไปที่ `/admin/sprint2` → tab "Review Disputes" <br> 2. กด "✅ ซ่อนรีวิว" |
| **Expected** | ✅ Dispute status → RESOLVED <br> ✅ รีวิวที่เกี่ยวข้อง status → HIDDEN <br> ✅ Driver stats อัปเดตใหม่ (ไม่รวมรีวิวที่ซ่อน) |
| **Priority** | High |

---

### TC-4.2: Admin — Reject Dispute

| Field | Detail |
|-------|--------|
| **Steps** | 1. กด "❌ ปฏิเสธ" |
| **Expected** | ✅ Dispute status → REJECTED <br> ✅ รีวิวยังแสดงปกติ |
| **Priority** | High |

---

### TC-4.3: Admin — Resolve Chat Report

| Field | Detail |
|-------|--------|
| **Pre-condition** | มี chat report status = PENDING |
| **Steps** | 1. ไปที่ `/admin/sprint2` → tab "Chat Reports" <br> 2. กด "✅ แก้ไขแล้ว" หรือ "ปิด" |
| **Expected** | ✅ Report status อัปเดต <br> ✅ Filter ตาม status ทำงาน |
| **Priority** | High |

---

### TC-4.4: Admin — Suspend User (เฉพาะ Passenger)

| Field | Detail |
|-------|--------|
| **Steps** | 1. ไปที่ `/admin/sprint2` → tab "การระงับผู้ใช้" <br> 2. ใส่ User ID → กด "ค้นหา" <br> 3. เลือก Role = "เฉพาะ Passenger", Duration = 7 วัน <br> 4. ใส่เหตุผล <br> 5. กด "🚫 ระงับ" |
| **Expected** | ✅ `passengerSuspendedUntil` = now + 7 วัน <br> ✅ `driverSuspendedUntil` = null (ไม่ถูกระงับ) <br> ✅ แสดง badge "🔴 Passenger: ระงับ" + "🟢 Driver: ปกติ" <br> ✅ SystemLog บันทึก action SUSPEND <br> ✅ ผู้ใช้ยังขับรถได้ แต่จองเป็นผู้โดยสารไม่ได้ |
| **Priority** | Critical |

---

### TC-4.5: Admin — Suspend User (เฉพาะ Driver)

| Field | Detail |
|-------|--------|
| **Steps** | 1. เลือก Role = "เฉพาะ Driver" <br> 2. กด "🚫 ระงับ" |
| **Expected** | ✅ `driverSuspendedUntil` ถูกตั้ง <br> ✅ `passengerSuspendedUntil` = null <br> ✅ ผู้ใช้จองเป็นผู้โดยสารได้ แต่สร้าง route/ขับรถไม่ได้ |
| **Priority** | Critical |

---

### TC-4.6: Admin — Suspend User (ทั้งสอง Role)

| Field | Detail |
|-------|--------|
| **Steps** | 1. เลือก Role = "ทั้งสอง Role", Duration = ถาวร <br> 2. กด "🚫ระงับ" |
| **Expected** | ✅ ทั้ง `passengerSuspendedUntil` และ `driverSuspendedUntil` ถูกตั้งเป็น 2099-12-31 <br> ✅ ผู้ใช้ใช้งานไม่ได้ทั้งสอง role |
| **Priority** | High |

---

### TC-4.7: Admin — Unsuspend User

| Field | Detail |
|-------|--------|
| **Pre-condition** | ผู้ใช้ถูกระงับอยู่ |
| **Steps** | 1. เลือก Role ที่จะปลด <br> 2. กด "✅ ปลดระงับ" |
| **Expected** | ✅ ค่า `*SuspendedUntil` ถูก clear เป็น null <br> ✅ SystemLog บันทึก action UNSUSPEND <br> ✅ badge เปลี่ยนเป็น "🟢 ปกติ" |
| **Priority** | High |

---

### TC-4.8: Admin — ดูรายชื่อผู้ถูกระงับ

| Field | Detail |
|-------|--------|
| **Steps** | 1. ไปที่ tab "การระงับผู้ใช้" <br> 2. ดูตาราง "รายชื่อผู้ถูกระงับ" |
| **Expected** | ✅ แสดงเฉพาะผู้ใช้ที่ `*SuspendedUntil > now` <br> ✅ แสดง username, role, วันที่หมดระงับ |
| **Priority** | Medium |

---

### TC-4.9: Admin — Export System Logs (JSON)

| Field | Detail |
|-------|--------|
| **Steps** | 1. ไปที่ tab "Export Logs" <br> 2. เลือกช่วงวันที่ <br> 3. กด "📥 Export JSON" |
| **Expected** | ✅ ไฟล์ `.json` ถูกดาวน์โหลด <br> ✅ มี `exportedAt`, `totalRecords`, `data` <br> ✅ ข้อมูลตามช่วงเวลาที่เลือก |
| **Priority** | High |

---

### TC-4.10: Admin — Export System Logs (CSV)

| Field | Detail |
|-------|--------|
| **Steps** | 1. กด "📥 Export CSV" |
| **Expected** | ✅ ไฟล์ `.csv` ถูกดาวน์โหลด <br> ✅ เปิดใน Excel ได้ → ภาษาไทยแสดงถูกต้อง (BOM) |
| **Priority** | High |

---

### TC-4.11: Admin — Export Chat Session (สำหรับตำรวจ)

| Field | Detail |
|-------|--------|
| **Steps** | 1. ใส่ Chat Session ID <br> 2. กด "📥 Export Chat" |
| **Expected** | ✅ ไฟล์ `.json` ถูกดาวน์โหลด <br> ✅ มี `legalNotice` (พ.ร.บ.คอมพิวเตอร์) <br> ✅ มีข้อมูล: session, booking, participants (ชื่อ, email, เบอร์), messages, reports, arrivalNotifications <br> ✅ ข้อความแสดงทั้ง `content` และ `originalContent` (กรณีถูก filter) |
| **Priority** | Critical |

---

## Cross-Cutting Concerns

### TC-5.1: 90-day Retention Cron Job

| Field | Detail |
|-------|--------|
| **Steps** | 1. ตรวจสอบ log เมื่อ server เริ่มต้น |
| **Expected** | ✅ แสดง "[RetentionPurge] Cron job scheduled (daily 02:00 UTC)" <br> ✅ ลบ ChatMessages ที่ `retentionExpiresAt < cutoff` <br> ✅ ลบ VoiceCallLogs ที่หมดอายุ <br> ✅ Archive sessions ที่หมดอายุ <br> ✅ **ข้ามเคสที่มี PENDING report/dispute** <br> ✅ SystemLog บันทึก action `RETENTION_PURGE` |
| **Priority** | High |

---

### TC-5.2: Socket.IO Connection

| Field | Detail |
|-------|--------|
| **Steps** | 1. ตรวจ server log เมื่อเริ่มต้น <br> 2. ลอง connect ด้วย Socket.IO client + JWT token |
| **Expected** | ✅ "[WS] Socket.IO server initialized" <br> ✅ "[WS] User connected: {userId}" <br> ✅ `presence-update` event ถูก broadcast |
| **Priority** | High |

---

### TC-5.3: Socket.IO — Invalid Token

| Field | Detail |
|-------|--------|
| **Steps** | 1. ลอง connect ด้วย token ที่ไม่ถูกต้อง |
| **Expected** | ✅ Connection ถูก reject: "Invalid token" |
| **Priority** | Medium |

---

### TC-5.4: Navigation — Chat & Reviews Links

| Field | Detail |
|-------|--------|
| **Steps** | 1. ดู Navigation menu (Desktop + Mobile) |
| **Expected** | ✅ มีลิงก์ "Chat" ไปยัง `/chat` <br> ✅ มีลิงก์ "Reviews" ไปยัง `/reviews` <br> ✅ ทั้ง Desktop dropdown และ Mobile menu |
| **Priority** | Low |

---

### TC-5.5: Unit Tests (Automated)

| Field | Detail |
|-------|--------|
| **Steps** | 1. Run `cd DriveToSurviveWebApp/server && npx jest --verbose` |
| **Expected** | ✅ **86/86 tests pass** <br> ✅ 12 test suites ทั้งหมดผ่าน |
| **Priority** | Critical |

---

## 📊 Test Coverage Summary

| Epic / Feature | Total TCs | Critical | High | Medium | Low |
|----------------|-----------|----------|------|--------|-----|
| Epic 1: Secure Messaging | 14 | 0 | 4 | 8 | 2 |
| Epic 2: Arrival Notification | 7 | 2 | 3 | 2 | 0 |
| No-Show Countdown | 4 | 2 | 2 | 0 | 0 |
| Epic 3: Review & Rating | 14 | 5 | 5 | 2 | 2 |
| Admin Features | 11 | 3 | 6 | 1 | 1 |
| Cross-Cutting | 5 | 1 | 2 | 1 | 1 |
| **Total** | **55** | **13** | **22** | **14** | **6** |

---

## 📝 Notes for Testers

1. **ลำดับ test ที่แนะนำ:** Epic 3 → Epic 1 → Epic 2 → Admin → Cross-Cutting
2. **Environment:** Dev server `http://localhost:3001` (API) + `http://localhost:3000` (Frontend)
3. **Database:** ต้อง run `npx prisma db push` ก่อน test ครั้งแรก
4. **ข้อมูลเบื้องต้น:** Admin account สร้างอัตโนมัติ, ต้องสร้าง User/Booking ด้วยตนเอง
5. **ทุก API ต้องแนบ `Authorization: Bearer <token>`** ยกเว้น endpoints สาธารณะ
6. **Thai Text:** ตรวจสอบว่าภาษาไทยแสดงถูกต้องทั้ง UI, API response, และ CSV export
