# 🏁 Sprint 2 — Backlog Documentation

> **Project:** Drive To Survive — Ride-Sharing/Carpooling Platform
> **Sprint Goal:** Deliver Secure Communication, Smart Arrival Alerts, and Post-Ride Review capabilities
> **Team:** Group 4/4 — Software Engineering Sprint
> **Date:** 2026-02-27
> **Tech Stack:** Nuxt 3 (Client) + Express (Server) + Prisma ORM

---

## 📋 Sprint Overview

This Sprint delivers **3 Epics** that form the core post-booking experience:

| # | Epic | Business Value |
|---|------|---------------|
| 1 | 🔒 Secure In-App Messaging | Privacy-first communication between driver & passenger |
| 2 | 📍 In-Chat Arrival Notification | GPS-driven automated alerts with 3-tier radius triggers |
| 3 | ⭐ Ride Review & Rating System | Post-ride trust & quality assurance with immutable reviews |

---

## 🚨 Critical Business Rules (ข้อบังคับทางธุรกิจ)

### Rule 1: Notification Channels
- ✅ **Web App (In-App/Push) + Email** only — ❌ NO SMS
- **3 GPS Radius Thresholds:** 5 km → 1 km → 0 km (arrived)
- **Every** notification trigger → logged to `SystemLog` table (for auditing/การตรวจสอบ)

### Rule 2: Review Immutability & Data Privacy (PDPA)
- Reviews are **IMMUTABLE** — no edit, no delete by any user
- Late review allowed via "History" menu — **within 7 days** only
- **Account Deletion (การลบบัญชี):** Reviews → anonymized to "Anonymous Passenger" (Soft Delete / การทำ Soft Delete) — driver statistics preserved

### Rule 3: Chat Retention (พ.ร.บ. คอมพิวเตอร์)
- Chat history + voice call metadata → **retained 90 days exactly**
- After 90 days → **automated purge/archive** (Cron Job / Scheduled Task)
- Compliant with Thai Computer Crime Act (พ.ร.บ.ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์)

---

## 📂 Document Index

| File | Content |
|------|---------|
| [Epic 1 — Messaging](./epic1-secure-messaging.md) | User Stories, Acceptance Criteria, Edge Cases, Architecture |
| [Epic 2 — Arrival Notification](./epic2-arrival-notification.md) | User Stories, Acceptance Criteria, Edge Cases, Architecture |
| [Epic 3 — Review & Rating](./epic3-review-rating.md) | User Stories, Acceptance Criteria, Edge Cases, Architecture |

---

## 🗄️ High-Level Database Tables (New for Sprint 2)

```
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│   ChatSession        │  │   ArrivalNotification│  │   RideReview         │
├──────────────────────┤  ├──────────────────────┤  ├──────────────────────┤
│ id                   │  │ id                   │  │ id                   │
│ bookingId (FK)       │  │ bookingId (FK)       │  │ bookingId (FK)       │
│ driverId (FK)        │  │ driverId (FK)        │  │ passengerId (FK)     │
│ passengerId (FK)     │  │ passengerId (FK)     │  │ driverId (FK)        │
│ status (ACTIVE/ENDED)│  │ radiusType (5/1/0km) │  │ rating (1-5)         │
│ createdAt            │  │ channel (APP/EMAIL)  │  │ tags[]               │
│ endedAt              │  │ status (SENT/FAILED) │  │ comment (nullable)   │
│ retentionExpiresAt   │  │ triggeredAt          │  │ isAnonymous          │
└──────┬───────────────┘  │ logId (FK→SystemLog) │  │ displayName          │
       │                  └──────────────────────┘  │ status (ACTIVE/ANON) │
┌──────▼───────────────┐                            │ createdAt            │
│   ChatMessage        │  ┌──────────────────────┐  │ submittedAt          │
├──────────────────────┤  │   VoiceCallLog       │  └──────────────────────┘
│ id                   │  ├──────────────────────┤
│ sessionId (FK)       │  │ id                   │  ┌──────────────────────┐
│ senderId (FK)        │  │ sessionId (FK)       │  │   ReviewDispute      │
│ type (TEXT/LOCATION/ │  │ callerId (FK)        │  ├──────────────────────┤
│       QUICK_REPLY)   │  │ receiverId (FK)      │  │ id                   │
│ content (encrypted)  │  │ duration             │  │ reviewId (FK)        │
│ isFiltered           │  │ status               │  │ driverId (FK)        │
│ isUnsent             │  │ createdAt            │  │ reason               │
│ unsendDeadline       │  │ retentionExpiresAt   │  │ status (PENDING/     │
│ createdAt            │  └──────────────────────┘  │   RESOLVED/REJECTED) │
│ retentionExpiresAt   │                            │ adminNote            │
└──────────────────────┘  ┌──────────────────────┐  │ createdAt            │
                          │   ChatReport         │  └──────────────────────┘
┌──────────────────────┐  ├──────────────────────┤
│  NotificationLog     │  │ id                   │  ┌──────────────────────┐
│  (extends SystemLog) │  │ sessionId (FK)       │  │   DriverStats        │
├──────────────────────┤  │ reporterId (FK)      │  ├──────────────────────┤
│ id                   │  │ messageId (FK)       │  │ driverId (FK, unique)│
│ type                 │  │ reason               │  │ totalRides           │
│ channel              │  │ status               │  │ avgRating            │
│ recipientId          │  │ createdAt            │  │ totalReviews         │
│ payload (JSON)       │  └──────────────────────┘  │ tagCounts (JSON)     │
│ status               │                            │ updatedAt            │
│ createdAt            │                            └──────────────────────┘
└──────────────────────┘
```
