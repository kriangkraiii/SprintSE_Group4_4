# 📍 Epic 2: In-Chat Arrival Notification

## 📖 Epic Description & Goal

**Business Value:** เพิ่มประสบการณ์ที่ดีให้ผู้โดยสาร ด้วยการแจ้งเตือนอัตโนมัติตามระยะ GPS 3 ระดับ (5km, 1km, 0km) ผ่าน Web App + Email พร้อมบันทึก System Log ทุกรายการเพื่อการตรวจสอบ (Audit Trail)

**Goal:** Deliver automated, GPS-based multi-tier proximity notifications via In-App + Email channels, with full audit logging, manual fallback, and No-Show countdown integration.

---

## 📝 User Stories

### US-2.1: Automated 3-Tier GPS Proximity Notification
> **As a** passenger with a confirmed booking,
> **I want to** receive automatic notifications when my driver reaches 5 km, 1 km, and 0 km from my pickup location,
> **So that** I can prepare for pickup at the right time.

#### ✅ Acceptance Criteria

**AC-2.1.1 — Happy Path: 5 km Notification**
```gherkin
Given booking "BK-001" is active and driver is en route
When the driver's GPS position enters the 5 km radius of the passenger's pickup point
Then the system sends an In-App push notification:
  "🚗 คนขับอยู่ห่างประมาณ 5 กม. / Driver is ~5 km away"
And the system sends an Email notification to the passenger's registered email
And a record is created in NotificationLog:
  | field       | value       |
  | type        | ARRIVAL     |
  | channel     | APP + EMAIL |
  | radiusType  | 5KM         |
  | status      | SENT        |
  | recipientId | passenger   |
And a SystemLog entry is created referencing the NotificationLog ID
```

**AC-2.1.2 — Happy Path: 1 km Notification**
```gherkin
Given the 5 km notification has already been sent for "BK-001"
When the driver's GPS position enters the 1 km radius
Then the system sends In-App notification:
  "🚗 คนขับใกล้ถึงแล้ว ~1 กม. / Driver is ~1 km away"
And the system sends an Email notification
And NotificationLog records: radiusType = "1KM", status = "SENT"
And the 5 km notification is NOT re-sent (deduplication)
```

**AC-2.1.3 — Happy Path: 0 km / Arrived Notification**
```gherkin
Given the 1 km notification has already been sent for "BK-001"
When the driver's GPS position enters the 0 km radius (arrived at pickup)
Then the system sends In-App notification:
  "✅ คนขับถึงจุดรับแล้ว! / Driver has arrived!"
And the system sends Email notification
And NotificationLog records: radiusType = "0KM", status = "SENT"
And the 20-minute No-Show countdown timer starts (see US-2.5)
```

**AC-2.1.4 — Negative: Email Delivery Failure**
```gherkin
Given the email service fails to send (SMTP error/timeout)
When a GPS threshold is crossed
Then the In-App notification is still delivered successfully
And NotificationLog records: channel = "APP", emailStatus = "FAILED"
And the system retries email delivery 3 times with exponential backoff (30s, 60s, 120s)
And if all retries fail, NotificationLog updates: emailStatus = "PERMANENTLY_FAILED"
And an alert is logged in SystemLog for admin review
```

**AC-2.1.5 — Negative: GPS Signal Drop**
```gherkin
Given the driver's GPS signal is lost for > 60 seconds
When the system cannot determine driver position
Then NO automated notification is triggered
And the driver's chat displays: "⚠️ GPS ขาดหาย กรุณากดแจ้งเตือนด้วยตนเอง / GPS lost, please notify manually"
And the fallback manual trigger (US-2.2) becomes prominently displayed
```

**AC-2.1.6 — Boundary: Rapid Radius Crossing (Skip Tier)**
```gherkin
Given the driver is at 6 km and the next GPS update shows 0.8 km (GPS jumped)
When the system processes the position update
Then it sends BOTH the 5 km AND 1 km notifications that were not yet sent
And records both in NotificationLog with correct timestamps
And does NOT send the 0 km notification until 0 km threshold is actually reached
```

---

### US-2.2: Manual Notification Trigger (Fallback)
> **As a** driver whose GPS is unreliable,
> **I want to** manually trigger an arrival notification,
> **So that** the passenger is still informed even when GPS fails.

#### ✅ Acceptance Criteria

**AC-2.2.1 — Happy Path: Manual Trigger**
```gherkin
Given the driver is in an active trip for booking "BK-001"
When the driver taps "แจ้งถึงแล้ว / I've Arrived" button in chat
Then the system sends In-App + Email notification to the passenger:
  "✅ คนขับแจ้งว่าถึงแล้ว (แจ้งด้วยตนเอง) / Driver reports arrival (manual)"
And NotificationLog records: radiusType = "MANUAL", triggerType = "MANUAL"
And the 20-minute No-Show countdown starts
```

**AC-2.2.2 — Negative: Manual Trigger Spam Prevention**
```gherkin
Given the driver already triggered a manual arrival notification
When the driver taps "I've Arrived" again within 5 minutes
Then the system returns "คุณแจ้งไปแล้ว กรุณารอ / Already notified, please wait"
And no duplicate notification is sent
```

**AC-2.2.3 — Negative: Manual Trigger on Inactive Trip**
```gherkin
Given the trip for booking "BK-001" is COMPLETED or CANCELLED
When the driver attempts to manually trigger arrival
Then the button is disabled
And the system shows "ทริปสิ้นสุดแล้ว / Trip has ended"
```

---

### US-2.3: Notification Audit Logging (บันทึกตรวจสอบ)
> **As a** system administrator,
> **I want** every notification trigger to be recorded in the SystemLog,
> **So that** I can audit notification delivery for disputes and compliance.

#### ✅ Acceptance Criteria

**AC-2.3.1 — Happy Path: Full Audit Trail**
```gherkin
Given a notification was triggered for booking "BK-001"
When an admin queries SystemLog with filter { bookingId: "BK-001", type: "ARRIVAL" }
Then the result includes ALL notification events:
  | radiusType | channel     | status | timestamp           |
  | 5KM        | APP + EMAIL | SENT   | 2026-02-27 10:00:00 |
  | 1KM        | APP + EMAIL | SENT   | 2026-02-27 10:15:00 |
  | 0KM        | APP + EMAIL | SENT   | 2026-02-27 10:25:00 |
And each entry includes driver GPS coordinates at trigger time
```

---

### US-2.4: Passenger Quick Replies (ตอบกลับด่วนผู้โดยสาร)
> **As a** passenger who received an arrival notification,
> **I want** to send a quick reply like "Waiting downstairs",
> **So that** the driver knows my exact status.

#### ✅ Acceptance Criteria

**AC-2.4.1 — Happy Path: Quick Reply Options**
```gherkin
Given the passenger receives a "Driver has arrived" notification
When the notification card expands or the chat opens
Then the following quick reply buttons are displayed:
  | th                          | en                      |
  | รอข้างล่างแล้ว               | Waiting downstairs      |
  | กำลังลงไป                   | Coming down now         |
  | รอ 5 นาทีนะคะ/ครับ          | Please wait 5 minutes   |
  | เปลี่ยนจุดรับ                | Change pickup location  |
And tapping a button sends it as a QUICK_REPLY message in the chat
```

**AC-2.4.2 — Negative: Quick Reply After Session Ended**
```gherkin
Given the ChatSession is ENDED
When quick reply buttons are displayed from a cached notification
Then tapping any button shows "เซสชันสิ้นสุดแล้ว / Session ended"
And no message is sent
```

---

### US-2.5: No-Show Countdown Timer (นับถอยหลัง No-Show)
> **As a** driver who has arrived at the pickup,
> **I want** a 20-minute countdown to start automatically,
> **So that** I can cancel the ride as a No-Show if the passenger doesn't appear.

#### ✅ Acceptance Criteria

**AC-2.5.1 — Happy Path: Countdown Starts**
```gherkin
Given the "0KM" or "MANUAL" arrival notification was sent for booking "BK-001"
When the notification is successfully delivered
Then a 20-minute countdown starts on the driver's screen
And the countdown is visible in the chat interface: "⏱️ No-Show: 19:59"
And the passenger also sees the countdown: "⏱️ คนขับรอคุณอยู่ / Driver waiting"
```

**AC-2.5.2 — Happy Path: Countdown Expires → No-Show**
```gherkin
Given the 20-minute countdown reaches 00:00
And the trip has not started (passenger not picked up)
When the countdown expires
Then the driver is shown a "Cancel as No-Show" button
And if tapped, the booking status changes to "NO_SHOW"
And the passenger receives notification: "ถูกยกเลิกเนื่องจากไม่มาตามนัด / Cancelled: No-Show"
And a SystemLog entry records the No-Show event
```

**AC-2.5.3 — Happy Path: Passenger Arrives Before Countdown**
```gherkin
Given the countdown is at 12:30 remaining
When the driver confirms passenger pickup (starts trip)
Then the countdown is cancelled
And the trip status changes to "IN_PROGRESS"
```

**AC-2.5.4 — Negative: Network Disconnect During Countdown**
```gherkin
Given the countdown is running and the driver loses internet
When the connection is restored
Then the countdown resumes from the SERVER-SIDE timestamp (not client-side)
And the remaining time is accurate (server is the source of truth)
```

---

## ⚠️ Edge Cases & Exceptions

### Edge Case 1: GPS Noise / Oscillation at Boundary
- The driver's GPS oscillates between 5.1 km and 4.9 km repeatedly (GPS jitter)
- **Handling:** Implement a **hysteresis buffer** — trigger only when position stays within threshold for ≥ 2 consecutive readings (10-second intervals). This prevents notification spam.
- **DB Impact:** A `lastTriggeredRadius` field on the booking tracks which tiers have fired.

### Edge Case 2: Network Offline at Exactly 0 km
- The driver arrives but both driver and server lose connectivity at the threshold
- **Handling:** The driver's device stores an offline event. When connectivity resumes: (1) Notification is sent, (2) Timestamp reflects actual arrival time from device GPS log, (3) NotificationLog notes `delayed = true`.

### Edge Case 3: Passenger Has Unverified / Invalid Email
- Email notification fails because the passenger's email is invalid or unverified
- **Handling:** In-App notification takes precedence and is always sent. SystemLog marks `emailStatus = "INVALID_RECIPIENT"`. Admin dashboard flags users with repeated email failures. The system does NOT block the ride flow.

### Edge Case 4: Multiple Bookings Overlapping (Driver has batch)
- Driver has 2 active bookings with different passengers at nearby locations
- **Handling:** Each booking has its own `ArrivalNotification` state machine. Radius checks are per-booking against each passenger's specific pickup coordinates. Notifications are scoped to the correct passenger.

### Edge Case 5: No-Show Timer Sync Across Devices
- Driver views countdown on phone and tablet simultaneously
- **Handling:** Timer is server-authoritative. All clients subscribe to a WebSocket event `no-show-timer:{bookingId}` and sync from server epoch. Client-side countdown is visual only.

---

## 🗄️ Database & Architectural Considerations

### Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `ArrivalNotification` | Per-booking per-radius notification record | `bookingId`, `radiusType` (ENUM: 5KM/1KM/0KM/MANUAL), `channel`, `status` |
| `NotificationLog` | Full audit trail (extends SystemLog) | `type`, `payload` (JSON: coords, radius, booking), `status` |

### Architecture Decisions
1. **GPS Processing:** Server receives driver location updates every 10 seconds via WebSocket. Distance calculated using **Haversine formula** (sufficient accuracy for ride-share distances). No external API needed for distance calc.
2. **Deduplication:** `UNIQUE(bookingId, radiusType)` constraint on `ArrivalNotification` prevents double-triggers.
3. **Email Service:** Async queue (Bull/BullMQ with Redis) for email delivery. Retry logic: 3 attempts with backoff. Dead-letter queue for permanent failures.
4. **No-Show Timer:** Server-side timer using Redis TTL key (`noshow:{bookingId}`). Expiry event triggers via Redis Keyspace Notifications → Express handler.
5. **Notification Channels:**
   - **In-App:** WebSocket push → If user offline, store in `Notification` table for later retrieval
   - **Email:** Nodemailer with SMTP/SendGrid. Template-based (Thai + English)
6. **Hysteresis Buffer:** Redis sorted set tracks last 3 GPS readings. Trigger only when median distance < threshold.
