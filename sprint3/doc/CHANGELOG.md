# 📋 Changelog — Sprint 3

> **Branch:** `kriangkraiii_616-4` → `RC(Release-Candidate)`  
> **Project:** DriveToSurvive Web Application  
> **Period:** March 16 – 18, 2026

---

## [2026-03-18]

### 🚀 Features & Improvements

- **Add DriveToSurviveWebApp project (initial)** — โปรเจกต์เว็บแอปหลัก (initial commit) `kriangkraiii`
- **Add FCM push notifications for chat** — ส่ง push notification เมื่อมีข้อความแชทใหม่ `kriangkraiii`
- **Add FCM push support (client + server)** — ติดตั้ง Firebase Cloud Messaging ทั้งฝั่ง client และ server `kriangkraiii`
- **Refactor FCM client plugin and update nuxt config** — ปรับโครงสร้าง FCM plugin ฝั่ง client ให้เป็นระเบียบ `kriangkraiii`
- **Add FCM SW (Service Worker)** — เพิ่ม Service Worker สำหรับรับ notification เบื้องหลัง `kriangkraiii`

### 🐛 Bug Fixes

- **Fix own-message detection and push targets** — แก้ไขปัญหาตรวจจับข้อความตัวเองและเป้าหมายการส่ง push `kriangkraiii`
- **Make notification dispatch fire-and-forget and robust** — ทำให้การส่ง notification ไม่ block request หลัก และจัดการ error ได้ดีขึ้น `kriangkraiii`

### 🔧 Configuration & Maintenance

- **Update index.js** — อัปเดตไฟล์ server หลัก `kriangkraiii`
- **Update schema.prisma** — อัปเดต database schema `kriangkraiii`

### 📄 Documentation

- **Add UserManual.pdf** — เพิ่มคู่มือการใช้งาน `Thanchanok1234`
- **Edit UserManual.md and Delete UserManual.pdf** — แก้ไขคู่มือเป็น Markdown และลบไฟล์ PDF `Thanchanok1234`

### 🔀 Merges

- Merge branch `kriangkraiii_616-4` into `RC(Release-Candidate)` — `kriangkraiii`
- Merge branch `thanchanok.s` into `RC(Release-Candidate)` — `Thanchanok1234`

---

## [2026-03-17]

### 📄 Documentation

- **Edit UserManual.md** — ปรับปรุงคู่มือการใช้งาน `Thanchanok1234`
- **Add A-Dapt Blueprint, UserManual, Sprint Backlog, DeclareAI** — เพิ่มเอกสาร Blueprint, คู่มือ, Sprint Backlog, และ DeclareAI `Thanchanok1234`

### 🧪 Testing

- **test: add comprehensive API tests for Sprint 2 and 3** — เพิ่มชุดทดสอบ API ครอบคลุม Sprint 2 และ 3 `conan2547`
- **เพิ่มเทสแจ้งเตือน** วิธีใช้งาน: `npm run test:arrival` `conan2547`

### 📁 File Management

- **ย้ายไฟล์ UAT_TEST** — จัดระเบียบไฟล์ UAT test cases `conan2547`
- **Upload Sprint3_UAT_TestCases.xlsx** — อัปโหลดไฟล์ทดสอบ UAT Sprint 3 `conan2547`
- **Delete sprint3/test/doc** — ลบโฟลเดอร์ doc ที่ไม่ใช้แล้ว `conan2547`
- **Create doc** — สร้างโฟลเดอร์ doc ใหม่ `conan2547`

### 🔧 Configuration & Maintenance

- **Update fcm.js** — อัปเดต Firebase Cloud Messaging config `kriangkraiii`
- **Move Firebase credentials to ENV vars** — ย้าย Firebase credentials ไปเก็บใน environment variables เพื่อความปลอดภัย `kriangkraiii`
- **Use Firebase env vars with JSON fallback** — ใช้ env vars เป็นหลัก โดยมี JSON file เป็น fallback `kriangkraiii`
- **Update .gitignore** — อัปเดตไฟล์ .gitignore `kriangkraiii`

### 🔀 Merges

- Merge branch `kriangkraiii_616-4` into `RC(Release-Candidate)` — `kriangkraiii`
- Merge branch `thanchanok.s` into `RC(Release-Candidate)` — `Thanchanok1234`

---

## [2026-03-16]

### 🚀 Features

- **Add FCM push notifications & PWA setup** — ติดตั้งระบบ push notification ด้วย Firebase Cloud Messaging พร้อม PWA `kriangkraiii`

### ⏪ Reverts

- **Revert "Add FCM push notifications & PWA setup"** — ย้อน commit FCM/PWA เพื่อแก้ไขก่อน merge ใหม่ `kriangkraiii`

### 📁 File Management

- **delete files in sprint3** — ลบไฟล์เก่าใน sprint3 `kriangkraiii`
- **sprint3** — เพิ่มไฟล์ sprint3 `kriangkraiii`

### 🔧 Configuration

- **Update .gitignore** — อัปเดตไฟล์ .gitignore สำหรับ Firebase credentials `kriangkraiii`

### 🔀 Merges

- Merge branch `RC(Release-Candidate)` into `kriangkraiii_616-4` — `kriangkraiii`
- Merge branch `kriangkraiii_616-4` into `RC(Release-Candidate)` — `kriangkraiii`

---

## 👥 Contributors

| ชื่อ | GitHub | งานหลัก |
|------|--------|---------|
| kriangkraiii | [@kriangkraiii](https://github.com/kriangkraiii) | FCM Push Notifications, PWA, DriveToSurviveWebApp |
| Thanchanok1234 | [@Thanchanok1234](https://github.com/Thanchanok1234) | User Manual, Documentation, Sprint Backlog |
| conan2547 | [@conan2547](https://github.com/conan2547) | API Testing, UAT Test Cases |

---

## 📊 Summary

| หมวดหมู่ | จำนวน |
|-----------|-------|
| 🚀 Features | 6 |
| 🐛 Bug Fixes | 2 |
| 🔧 Config & Maintenance | 7 |
| 📄 Documentation | 4 |
| 🧪 Testing | 2 |
| 📁 File Management | 5 |
| ⏪ Reverts | 1 |
| 🔀 Merges | 7 |
