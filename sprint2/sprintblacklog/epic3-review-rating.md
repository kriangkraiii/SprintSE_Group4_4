# ⭐ Epic 3: Ride Review & Rating System

## 📖 Epic Description & Goal

**Business Value:** สร้างระบบความไว้วางใจในแพลตฟอร์ม ให้ผู้โดยสารประเมินคุณภาพการเดินทาง ด้วยรีวิวที่ไม่สามารถแก้ไข/ลบได้ (Immutable) พร้อมรองรับ PDPA ในกรณีลบบัญชี ด้วยการ Anonymize ข้อมูลแทนการลบ

**Goal:** Implement a post-ride review system with 1-5 star ratings, conditional tags, profanity filtering, immutable reviews, anonymous display option, 7-day late review window, driver dispute mechanism, and PDPA-compliant account deletion anonymization.

---

## 📝 User Stories

### US-3.1: Post-Ride Review Prompt
> **As a** passenger whose trip just ended,
> **I want to** be prompted to rate and review my ride immediately,
> **So that** I can provide feedback while the experience is fresh.

#### ✅ Acceptance Criteria

**AC-3.1.1 — Happy Path: Review Prompt Displayed**
```gherkin
Given booking "BK-001" status changes to "COMPLETED"
When the passenger's app detects the trip completion
Then a review modal is displayed with:
  - 1-5 star selector
  - Tag chips (conditional on rating)
  - Optional text feedback area
  - "ส่งรีวิว / Submit Review" button
  - "ข้ามไปก่อน / Skip for now" button
```

**AC-3.1.2 — Happy Path: Skip and Review Later**
```gherkin
Given the passenger taps "Skip for now"
When the review modal closes
Then NO review is created
And the booking is marked as "REVIEW_PENDING"
And the passenger can access it via History menu within 7 days
```

**AC-3.1.3 — Negative: Review After 7-Day Window**
```gherkin
Given booking "BK-001" was completed on 2026-02-20
And the current date is 2026-02-28 (8 days later)
When the passenger navigates to History and selects "BK-001"
Then the "Write Review" button is disabled/hidden
And a message shows "หมดเวลารีวิว (7 วัน) / Review period expired (7 days)"
And no review can be submitted for this booking
```

---

### US-3.2: Star Rating with Conditional Tags
> **As a** passenger,
> **I want** to select a star rating and relevant tags,
> **So that** my feedback is structured and useful for the community.

#### ✅ Acceptance Criteria

**AC-3.2.1 — Happy Path: Positive Rating (4-5 Stars)**
```gherkin
Given the passenger selects 4 or 5 stars
When the tag selection area loads
Then ONLY positive tags are displayed:
  | th               | en              |
  | สุภาพ            | Polite          |
  | ขับปลอดภัย        | Safe driving    |
  | รถสะอาด          | Clean car       |
  | ตรงเวลา          | On time         |
  | บทสนทนาดี         | Good conversation|
And text feedback is OPTIONAL
```

**AC-3.2.2 — Happy Path: Negative Rating (1-3 Stars)**
```gherkin
Given the passenger selects 1, 2, or 3 stars
When the tag selection area loads
Then ONLY negative tags are displayed:
  | th               | en               |
  | ขับเร็ว/อันตราย    | Reckless driving |
  | ไม่สุภาพ          | Impolite         |
  | รถไม่สะอาด        | Dirty car        |
  | มาช้า             | Late arrival     |
  | ไม่ตรงเส้นทาง      | Wrong route      |
And tag selection is MANDATORY (at least 1)
```

**AC-3.2.3 — Boundary: Rating Switch Mid-Selection**
```gherkin
Given the passenger selected 5 stars and chose tag "Polite"
When the passenger changes the rating to 2 stars
Then the positive tags are cleared
And negative tags are displayed
And the passenger must re-select tags
```

---

### US-3.3: Mandatory Text Feedback for Low Ratings
> **As a** system,
> **I want** to require text feedback when a 1-2 star review is given,
> **So that** we have context for serious complaints.

#### ✅ Acceptance Criteria

**AC-3.3.1 — Happy Path: Text Required for 1-2 Stars**
```gherkin
Given the passenger selects 1 or 2 stars
When the review form is displayed
Then the text feedback field shows "* จำเป็น / Required"
And the "Submit" button is disabled until text is entered (minimum 10 characters)
```

**AC-3.3.2 — Negative: Submit Empty Text on 1-2 Stars**
```gherkin
Given the passenger selects 1 star with no text
When they attempt to submit
Then the system shows error "กรุณาระบุเหตุผล (อย่างน้อย 10 ตัวอักษร) / Please provide a reason (min. 10 chars)"
And the review is NOT submitted
```

**AC-3.3.3 — Happy Path: Text Optional for 3-5 Stars**
```gherkin
Given the passenger selects 3, 4, or 5 stars
When the review form is displayed
Then the text feedback field shows "ไม่จำเป็น / Optional"
And the "Submit" button is enabled without text
```

---

### US-3.4: Profanity Filter on Review Submission
> **As a** system administrator,
> **I want** reviews containing profanity to be blocked from submission,
> **So that** the review system remains professional and safe.

#### ✅ Acceptance Criteria

**AC-3.4.1 — Happy Path: Clean Review Submitted**
```gherkin
Given the passenger writes "คนขับสุภาพมากครับ ขับดี"
When the profanity filter scans the text
Then no profanity is detected
And the review is submitted successfully
```

**AC-3.4.2 — Negative: Profanity Detected → Submission Blocked**
```gherkin
Given the passenger writes a review containing profanity (Thai or English)
When the profanity filter scans the text
Then the submission is BLOCKED (not just filtered — fully rejected)
And the system shows: "กรุณาแก้ไขคำหยาบ / Please remove inappropriate language"
And the profane words are highlighted in the text field
And the review is NOT persisted in the database
```

**AC-3.4.3 — Negative: Circumvention Attempt**
```gherkin
Given the passenger uses character substitution (e.g., "fU©k", "ค ว ย")
When the profanity filter processes with normalization
Then the filter detects the circumvention attempt
And blocks submission with the same error message
```

---

### US-3.5: Driver Public Statistics Update
> **As a** passenger browsing drivers,
> **I want** to see an accurate average rating and total review count,
> **So that** I can make informed booking decisions.

#### ✅ Acceptance Criteria

**AC-3.5.1 — Happy Path: Stats Recalculated**
```gherkin
Given driver "D-001" had stats: avgRating = 4.5, totalReviews = 100
When a new review with rating = 5 is submitted
Then the system recalculates:
  | field        | value                    |
  | avgRating    | (4.5*100 + 5) / 101 ≈ 4.50 |
  | totalReviews | 101                      |
And the DriverStats table is updated atomically
And the driver's public profile reflects the new stats
```

**AC-3.5.2 — Happy Path: Tag Counts Updated**
```gherkin
Given the new review includes tags ["Polite", "Safe driving"]
When stats are recalculated
Then DriverStats.tagCounts JSON increments:
  { "polite": previousCount + 1, "safe_driving": previousCount + 1 }
```

---

### US-3.6: Driver Dispute Mechanism (โต้แย้งรีวิว)
> **As a** driver,
> **I want** to dispute a review I believe is fake or malicious,
> **So that** an admin can investigate and protect my reputation.

#### ✅ Acceptance Criteria

**AC-3.6.1 — Happy Path: Dispute Filed**
```gherkin
Given driver "D-001" views a review "RV-050" with 1 star
When the driver taps "โต้แย้งรีวิว / Dispute Review"
And selects reason: "Fake review / รีวิวปลอม"
And provides explanation text (min. 20 characters)
And submits the dispute
Then a ReviewDispute record is created:
  | field    | value       |
  | reviewId | RV-050      |
  | driverId | D-001       |
  | reason   | FAKE_REVIEW |
  | status   | PENDING     |
And the driver sees "ส่งคำโต้แย้งแล้ว / Dispute submitted"
And the review remains publicly visible (NOT hidden during investigation)
```

**AC-3.6.2 — Happy Path: Admin Resolution**
```gherkin
Given admin reviews dispute for "RV-050"
When admin marks dispute as "RESOLVED" with action "REVIEW_HIDDEN"
Then the review is flagged as hidden from public view
And DriverStats are recalculated excluding the hidden review
And both driver and passenger receive notification of the outcome
```

**AC-3.6.3 — Negative: Duplicate Dispute**
```gherkin
Given driver "D-001" already has a PENDING dispute for review "RV-050"
When the driver attempts another dispute for the same review
Then the system returns "คุณโต้แย้งรีวิวนี้แล้ว / Already disputed"
And no duplicate record is created
```

---

### US-3.7: Review Immutability (ไม่สามารถแก้ไข/ลบ)
> **As a** system,
> **I want** submitted reviews to be permanent and uneditable,
> **So that** the review ecosystem maintains trust and integrity.

#### ✅ Acceptance Criteria

**AC-3.7.1 — Immutability: No Edit**
```gherkin
Given a review "RV-100" has been submitted
When the passenger navigates to their review in History
Then there is NO "Edit" or "แก้ไข" button visible
And the API endpoint PUT /api/reviews/:id returns HTTP 405 Method Not Allowed
```

**AC-3.7.2 — Immutability: No User Delete**
```gherkin
Given a review "RV-100" has been submitted
When the passenger or driver calls DELETE /api/reviews/:id
Then the system returns HTTP 403 Forbidden with message:
  "รีวิวไม่สามารถลบได้ / Reviews cannot be deleted"
And the review remains in the database unchanged
```

**AC-3.7.3 — Admin Override: Only Hide, Never Delete**
```gherkin
Given an admin resolves a dispute and decides to remove a review
When the admin takes action
Then the review is soft-hidden (status = "HIDDEN") NOT deleted from DB
And the review data is preserved for legal/audit purposes
```

---

### US-3.8: Anonymous Review Option & Account Deletion Anonymization
> **As a** passenger,
> **I want** the option to submit my review anonymously,
> **So that** I can give honest feedback without fear of retaliation.

> **As a** system compliant with PDPA,
> **I want** to anonymize reviews when a user deletes their account,
> **So that** driver statistics are preserved while user privacy is protected.

#### ✅ Acceptance Criteria

**AC-3.8.1 — Happy Path: Anonymous Review at Submission**
```gherkin
Given the passenger is submitting a review
When they toggle "ส่งแบบไม่ระบุตัวตน / Submit anonymously"
Then the review is saved with:
  | field       | value               |
  | isAnonymous | true                |
  | displayName | "ผู้โดยสารนิรนาม / Anonymous Passenger" |
And the driver sees the review as "Anonymous Passenger" with no link to the user
And the passengerId is still stored internally (for admin/audit access only)
```

**AC-3.8.2 — Critical: Account Deletion → Anonymization (การทำ Soft Delete)**
```gherkin
Given passenger "P-001" (name: "Kriangkrai") has submitted reviews [RV-100, RV-105, RV-110]
When "P-001" requests account deletion (DELETE /api/users/me)
Then the user account is soft-deleted (status = "DELETED")
And ALL their reviews are updated:
  | field       | value               |
  | displayName | "Anonymous Passenger"|
  | status      | "ANONYMIZED"        |
And the passengerId field is RETAINED (for internal reference)
And the driver's DriverStats remain UNCHANGED (ratings preserved)
And the review text, rating, and tags remain INTACT
```

**AC-3.8.3 — Verification: Stats Integrity After Deletion**
```gherkin
Given driver "D-001" had avgRating = 4.2 calculated from 50 reviews
And 5 of those reviews were from passenger "P-001"
When "P-001" deletes their account
Then driver "D-001" avgRating remains 4.2
And totalReviews remains 50
And the 5 reviews now show "Anonymous Passenger" but ratings are unchanged
```

---

### US-3.9: Private Feedback to Driver
> **As a** passenger,
> **I want** to send private feedback visible only to the driver,
> **So that** I can give constructive advice without public visibility.

#### ✅ Acceptance Criteria

**AC-3.9.1 — Happy Path: Private Note**
```gherkin
Given the review form has a "ข้อเสนอแนะส่วนตัว / Private note to driver" field
When the passenger writes "แนะนำเปิดแอร์เย็นกว่านี้ครับ"
And submits the review
Then the private note is stored in the review record as "privateFeedback"
And the driver sees the private note in their review detail page
And the private note is NOT visible on the public profile
And other passengers CANNOT see this note
```

---

## ⚠️ Edge Cases & Exceptions

### Edge Case 1: Concurrent Rating Submissions
- Passenger opens review on phone AND tablet, submits on both at ~same time
- **Handling:** `UNIQUE(bookingId, passengerId)` constraint on `RideReview`. First `INSERT` succeeds, second gets `DUPLICATE_KEY` error → return "คุณรีวิวไปแล้ว / Already reviewed". Use database-level uniqueness, NOT application-level checks.

### Edge Case 2: Review Window Boundary (Exactly at 7-Day Mark)
- Passenger opens review form at day 6, hour 23, minute 59. Submits at day 7, hour 0, minute 1.
- **Handling:** Check `reviewDeadline` server-side at submission time (NOT at form load). If `NOW() > booking.completedAt + 7 days`, reject with 410 Gone. Grace period: 0 (strict). Form should show remaining time.

### Edge Case 3: Profanity Filter False Positive
- A legitimate Thai word is flagged as profanity (e.g., "ฟัก" = pumpkin/squash)
- **Handling:** Maintain a whitelist of Thai words that are false positives. Use contextual analysis (bigram/trigram). If confidence < 80%, allow submission but flag for admin review instead of blocking.

### Edge Case 4: Driver Stats Recalculation Race Condition
- 3 reviews submitted within 1 second for the same driver
- **Handling:** Use atomic database operations: `UPDATE DriverStats SET avgRating = (avgRating * totalReviews + :newRating) / (totalReviews + 1), totalReviews = totalReviews + 1 WHERE driverId = :id`. Single atomic SQL update, no read-then-write pattern.

### Edge Case 5: Account Re-registration After Deletion
- User deletes account, reviews anonymized, then re-registers with same email
- **Handling:** New account gets a new userId. Old anonymized reviews remain "Anonymous Passenger" permanently. There is NO mechanism to re-link old reviews to the new account. This is by design for PDPA compliance.

---

## 🗄️ Database & Architectural Considerations

### Tables
| Table | Purpose | Key Constraints |
|-------|---------|----------------|
| `RideReview` | Immutable review storage | `UNIQUE(bookingId, passengerId)`, No UPDATE/DELETE API |
| `ReviewDispute` | Driver-initiated disputes | `UNIQUE(reviewId, driverId)` |
| `DriverStats` | Materialized view of aggregated ratings | `UNIQUE(driverId)`, atomic updates |

### Architecture Decisions

1. **Immutability Enforcement (Multi-Layer):**
   - **API Layer:** No PUT/DELETE endpoints for reviews
   - **Middleware:** Request interceptor rejects any mutation attempts
   - **Database:** Prisma middleware / DB trigger that prevents UPDATE on `rating`, `comment`, `tags` columns
   - **Audit:** All admin actions on reviews (hide/dispute resolve) are logged in SystemLog

2. **Anonymization Strategy (PDPA Compliant):**
   ```sql
   -- Triggered when user requests account deletion
   UPDATE "RideReview"
   SET "displayName" = 'Anonymous Passenger',
       "status" = 'ANONYMIZED'
   WHERE "passengerId" = :deletedUserId;
   -- DO NOT null out passengerId (needed for internal audit)
   -- DO NOT delete the review records
   ```

3. **Stats Update Pattern:**
   - Async event: `review.created` → Queue job → Atomic DriverStats update
   - Avoid recalculating from all reviews each time (O(n) → O(1))
   - Nightly reconciliation job verifies stats accuracy

4. **Profanity Filter:**
   - Pipeline: `Input → Normalize (remove spaces/special chars) → Dictionary match → Context check → Block or Allow`
   - Dictionaries: Thai profanity list + English profanity list
   - Block at **submission** (not just display) — review does not enter DB if profanity detected

5. **7-Day Window:**
   - `reviewDeadline` = `booking.completedAt + 7 days`
   - Server-side validation only (client countdown is informational)
   - After deadline: booking `reviewStatus` = `EXPIRED`

6. **Account Deletion Flow:**
   ```
   User DELETE /api/users/me →
     1. Soft-delete User (status = DELETED)
     2. Anonymize RideReview records
     3. Anonymize ChatMessage sender display
     4. Keep all data for 90-day retention
     5. After 90 days: purge PII fields only (keep anonymized reviews forever)
   ```
