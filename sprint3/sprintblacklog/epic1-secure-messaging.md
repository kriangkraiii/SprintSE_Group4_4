# 🔒 Epic 1: Secure In-App Messaging

## 📖 Epic Description & Goal

**Business Value:** ให้ผู้โดยสารและคนขับสื่อสารกันได้อย่างปลอดภัย โดยปกป้องข้อมูลส่วนบุคคล (PDPA Compliant) ไม่เปิดเผยเบอร์โทร/นามสกุล และบันทึกประวัติแชทตามกฎหมาย พ.ร.บ.คอมพิวเตอร์ 90 วัน

**Goal:** Provide a session-based, privacy-first real-time chat system with identity masking, content filtering, voice calls, translation, and 90-day compliant data retention.

---

## 📝 User Stories

### US-1.1: Session-Based Chat Initialization
> **As a** passenger with a confirmed booking,
> **I want to** have a chat session automatically created when my booking is confirmed,
> **So that** I can communicate with my driver within a secure, bounded context.

#### ✅ Acceptance Criteria

**AC-1.1.1 — Happy Path: Chat Auto-Creation**
```gherkin
Given a booking with ID "BK-001" has status changed to "CONFIRMED"
When the system processes the booking confirmation event
Then a new ChatSession record is created with:
  | field              | value          |
  | bookingId          | BK-001         |
  | status             | ACTIVE         |
  | retentionExpiresAt | now + 90 days  |
And both driver and passenger can see the chat in their active chats list
```

**AC-1.1.2 — Happy Path: Chat Ends on Trip Completion**
```gherkin
Given a ChatSession for booking "BK-001" is ACTIVE
When the trip status changes to "COMPLETED" or "CANCELLED"
Then the ChatSession status is set to "ENDED"
And the chat becomes read-only for both parties
And a system message "🔒 แชทนี้ถูกปิดแล้ว — This chat has been closed" is appended
```

**AC-1.1.3 — Negative: Duplicate Session Prevention**
```gherkin
Given a ChatSession already exists for booking "BK-001"
When the system attempts to create another session for the same booking
Then no duplicate is created
And the existing session is returned
```

**AC-1.1.4 — Negative: Messaging After Chat Ends**
```gherkin
Given a ChatSession for booking "BK-001" has status "ENDED"
When the passenger or driver attempts to send a message
Then the system returns HTTP 403 with message "Chat session has ended"
And no message is persisted
```

---

### US-1.2: Identity Masking (การปกปิดตัวตน)
> **As a** passenger,
> **I want** the system to show only the driver's first name and profile photo,
> **So that** my full identity and phone number remain private.

#### ✅ Acceptance Criteria

**AC-1.2.1 — Happy Path: First Name Display**
```gherkin
Given a user "Kriangkrai Prasert" with phone "081-XXX-XXXX"
When the chat participant info is loaded
Then the display shows only "Kriangkrai" (first name)
And the last name "Prasert" is NOT included in the API response
And the phone number is NOT included in the API response
```

**AC-1.2.2 — Negative: API Response Leak Prevention**
```gherkin
Given the chat API endpoint "/api/chat/sessions/:id/participants"
When any client inspects the full JSON response
Then the fields "lastName", "phone", "email", "nationalId" are excluded
And only "id", "firstName", "avatarUrl", "role" are present
```

---

### US-1.3: Smart Content Filtering (การกรองเนื้อหา)
> **As a** system administrator,
> **I want** phone numbers, links, and profanity to be automatically filtered in chat,
> **So that** users cannot bypass privacy protections or send harmful content.

#### ✅ Acceptance Criteria

**AC-1.3.1 — Happy Path: Phone Number Masking**
```gherkin
Given a user sends a message containing "โทรหาเบอร์ 081-234-5678 ได้เลย"
When the message is processed by the content filter
Then the stored/displayed message reads "โทรหาเบอร์ ***-***-**** ได้เลย"
And the field "isFiltered" is set to true
```

**AC-1.3.2 — Happy Path: URL/Link Blocking**
```gherkin
Given a user sends "ดูเส้นทางที่ https://maps.google.com/abc"
When the content filter processes the message
Then the URL is replaced with "[ลิงก์ถูกซ่อน / Link hidden]"
And "isFiltered" = true
```

**AC-1.3.3 — Happy Path: Profanity Blur**
```gherkin
Given a user sends a message containing profanity (Thai or English)
When the content filter processes the message
Then each profane word is replaced with "***"
And "isFiltered" = true
```

**AC-1.3.4 — Negative: Filter Bypass Attempts**
```gherkin
Given a user sends "zero eight one 234 5678" (spelled-out phone number)
When the content filter processes the message
Then the system detects the pattern as a potential phone number
And applies masking or flags for review
```

---

### US-1.4: Quick Replies for Drivers (ตอบกลับด่วน)
> **As a** driver,
> **I want** to use pre-defined quick reply buttons while driving,
> **So that** I can respond safely without typing.

#### ✅ Acceptance Criteria

**AC-1.4.1 — Happy Path: Quick Reply Sent**
```gherkin
Given the driver is in an active chat session
When the driver taps quick reply "กำลังไปรับครับ / On my way"
Then a message with type "QUICK_REPLY" is sent
And the message content matches the selected template
And message timestamp is recorded
```

**AC-1.4.2 — System Quick Reply Templates**
```gherkin
Given the system has pre-defined quick replies:
  | th                          | en                    |
  | กำลังไปรับครับ/ค่ะ           | On my way             |
  | ถึงแล้วครับ/ค่ะ              | I've arrived          |
  | รอสักครู่ครับ/ค่ะ             | Please wait a moment  |
  | จอดรอที่จุดนัดพบแล้ว          | Waiting at pickup     |
When the driver opens the quick reply menu
Then all templates are displayed in the user's preferred language
```

---

### US-1.5: In-Chat Report to Admin (แจ้งปัญหา)
> **As a** passenger or driver,
> **I want to** report inappropriate messages directly from the chat,
> **So that** the admin can review and take action.

#### ✅ Acceptance Criteria

**AC-1.5.1 — Happy Path: Report Submission**
```gherkin
Given a message ID "MSG-050" in session "CS-001"
When the user long-presses and selects "Report / แจ้งปัญหา"
And selects a reason: "Harassment / คุกคาม"
And submits the report
Then a ChatReport record is created with:
  | field      | value       |
  | sessionId  | CS-001      |
  | messageId  | MSG-050     |
  | reason     | HARASSMENT  |
  | status     | PENDING     |
And the reporter receives confirmation "รายงานถูกส่งแล้ว / Report submitted"
```

**AC-1.5.2 — Negative: Duplicate Report Prevention**
```gherkin
Given the user already reported message "MSG-050"
When the user attempts to report the same message again
Then the system returns "คุณแจ้งปัญหาข้อความนี้แล้ว / Already reported"
And no duplicate ChatReport is created
```

---

### US-1.6: Online/Offline Status (สถานะออนไลน์)
> **As a** passenger,
> **I want** to see if my driver is currently online,
> **So that** I know if they'll see my message immediately.

#### ✅ Acceptance Criteria

**AC-1.6.1 — Happy Path: Real-time Status**
```gherkin
Given the driver has the app open and WebSocket connected
When the passenger views the chat header
Then a green dot indicator shows "ออนไลน์ / Online"

Given the driver closes the app or disconnects
When the passenger views the chat header within 30 seconds
Then the indicator changes to "ออฟไลน์ / Offline"
And shows "เห็นล่าสุด / Last seen: [timestamp]"
```

---

### US-1.7: In-App Voice Call (โทรในแอป)
> **As a** passenger,
> **I want** to make a voice call to the driver through the app,
> **So that** I can communicate urgently without revealing my real phone number.

#### ✅ Acceptance Criteria

**AC-1.7.1 — Happy Path: Call Initiated**
```gherkin
Given an active ChatSession between passenger and driver
When the passenger taps the "Call" button
Then a WebRTC/VoIP call is initiated
And the driver receives an incoming call notification
And NO real phone numbers are exchanged
```

**AC-1.7.2 — Happy Path: Call Metadata Logged**
```gherkin
Given a voice call between passenger P1 and driver D1 ends
When the call is terminated
Then a VoiceCallLog record is created with:
  | field              | value         |
  | callerId           | P1            |
  | receiverId         | D1            |
  | duration           | [seconds]     |
  | status             | COMPLETED     |
  | retentionExpiresAt | now + 90 days |
```

**AC-1.7.3 — Negative: Call After Session Ends**
```gherkin
Given the ChatSession status is "ENDED"
When a user attempts to initiate a voice call
Then the call button is disabled
And the system shows "ไม่สามารถโทรได้ เซสชันสิ้นสุดแล้ว / Cannot call, session ended"
```

---

### US-1.8: Real-time Translation (แปลภาษาอัตโนมัติ)
> **As a** passenger who speaks a different language,
> **I want** chat messages to be automatically translated,
> **So that** I can understand my driver regardless of language.

#### ✅ Acceptance Criteria

**AC-1.8.1 — Happy Path: Auto Translation**
```gherkin
Given passenger's language preference is "EN" and driver sends "สวัสดีครับ"
When the message is displayed to the passenger
Then the original text "สวัสดีครับ" is shown
And a translated version "Hello" appears below with a "[Translated]" label
```

**AC-1.8.2 — Negative: Translation API Failure**
```gherkin
Given the translation service is unavailable
When a message is sent
Then the original message is still delivered without delay
And a small notice shows "ไม่สามารถแปลได้ / Translation unavailable"
```

---

### US-1.9: Text-to-Speech for Drivers (อ่านข้อความออกเสียง)
> **As a** driver currently driving,
> **I want** incoming messages to be read aloud,
> **So that** I can hear messages hands-free for safety.

#### ✅ Acceptance Criteria

**AC-1.9.1 — Happy Path: TTS Playback**
```gherkin
Given the driver has TTS enabled in settings
And the driver is in an active trip
When a new message arrives from the passenger
Then the system reads the message aloud via device speaker
And a "🔊" indicator appears next to the message
```

**AC-1.9.2 — Boundary: Filtered Content**
```gherkin
Given TTS is enabled and a message contains filtered profanity (stored as "***")
When TTS processes the message
Then the filtered portion is skipped or read as "filtered content"
```

---

### US-1.10: Share Live Location (แชร์ตำแหน่ง)
> **As a** passenger,
> **I want** to share my real-time GPS location in the chat,
> **So that** the driver can find me easily at the pickup point.

#### ✅ Acceptance Criteria

**AC-1.10.1 — Happy Path: Location Shared**
```gherkin
Given an active ChatSession
When the passenger taps "Share Location / แชร์ตำแหน่ง"
And grants GPS permission
Then a message of type "LOCATION" is sent with:
  | field     | value          |
  | lat       | [latitude]     |
  | lng       | [longitude]    |
  | isLive    | true           |
And the driver sees a map pin updating in real-time for 15 minutes
```

**AC-1.10.2 — Negative: GPS Permission Denied**
```gherkin
Given the passenger denies GPS permission
When attempting to share location
Then the system displays "กรุณาเปิด GPS / Please enable GPS"
And no location message is sent
```

---

### US-1.11: Unsend/Delete Message (ลบข้อความ)
> **As a** user,
> **I want** to unsend a message within a time limit,
> **So that** I can retract a mistaken message.

#### ✅ Acceptance Criteria

**AC-1.11.1 — Happy Path: Unsend Within Window**
```gherkin
Given a message "MSG-100" was sent 2 minutes ago
And the unsend time limit is 5 minutes
When the sender selects "Unsend / เลิกส่ง" on MSG-100
Then the message content is replaced with "ข้อความถูกลบ / Message unsent"
And "isUnsent" = true
And both parties see the placeholder text
```

**AC-1.11.2 — Negative: Unsend After Time Limit**
```gherkin
Given a message "MSG-100" was sent 10 minutes ago
And the unsend time limit is 5 minutes
When the sender attempts to unsend MSG-100
Then the system returns "หมดเวลาลบข้อความ / Unsend time expired"
And the original message remains intact
```

**AC-1.11.3 — Law Compliance: Unsent ≠ Purged**
```gherkin
Given a message is "unsent" by the user
When an admin queries the system log within 90 days
Then the original message content is still accessible in the backend audit log
And only the user-facing display shows "Message unsent"
```

---

## ⚠️ Edge Cases & Exceptions

### Edge Case 1: Network Disconnect During Active Chat
- User sends a message but loses internet mid-send
- **Handling:** Client must queue unsent messages locally and retry with exponential backoff. Display "⏳ Sending..." → "❌ Failed. Tap to retry" after 3 failed attempts
- **DB Impact:** No orphaned messages — only persist after server ACK

### Edge Case 2: Concurrent Messages + Content Filter Race Condition
- Both users send messages simultaneously; one contains profanity
- **Handling:** Content filter is applied synchronously **before** `INSERT` into `ChatMessage`. Use a filter middleware on the message creation endpoint. Never store unfiltered content.

### Edge Case 3: 90-Day Retention Boundary
- A chat session spans across the 90-day retention deadline (e.g., dispute in progress)
- **Handling:** If there's an active `ChatReport` with status `PENDING`, **extend retention** for that session until report resolution + 30 days. Cron job must check report status before purging.

### Edge Case 4: WebSocket Reconnection Storm
- Server restart causes all clients to reconnect simultaneously
- **Handling:** Implement connection throttling with jitter. Use a queue (e.g., Redis) for message delivery to prevent message loss during reconnection window.

### Edge Case 5: TTS Reading Sensitive Filtered Content
- The TTS engine might attempt to read masked content (`***`) which sounds odd
- **Handling:** Replace `***` tokens with silence or a natural phrase like "เนื้อหาถูกกรอง" before passing to TTS engine.

---

## 🗄️ Database & Architectural Considerations

### Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `ChatSession` | Session lifecycle per booking | `bookingId` (unique FK), `status`, `retentionExpiresAt` |
| `ChatMessage` | All messages (encrypted at rest) | `sessionId`, `content` (AES-256), `isFiltered`, `isUnsent` |
| `VoiceCallLog` | Call metadata (no audio stored) | `sessionId`, `duration`, `retentionExpiresAt` |
| `ChatReport` | User reports to admin | `messageId`, `reason`, `status` |

### Architecture Decisions
1. **Real-time:** WebSocket (Socket.IO) for messages + presence. Fallback to long-polling.
2. **Encryption:** Messages encrypted at rest (AES-256). TLS in transit.
3. **Content Filter Pipeline:** `Input → Phone Regex → URL Regex → Profanity Dict → Store`
4. **90-Day Cron Job:** Daily scheduled task at 02:00 UTC:
   ```
   DELETE FROM ChatMessage WHERE retentionExpiresAt < NOW() AND session NOT IN (active disputes)
   DELETE FROM VoiceCallLog WHERE retentionExpiresAt < NOW()
   ```
5. **VoIP:** WebRTC peer-to-peer with TURN server fallback. No audio recording stored.
6. **Translation:** External API (Google Translate / DeepL) with caching per language pair. Timeout 3s → fallback to original.
