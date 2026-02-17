# 🤖 Robot Framework — UAT Automation Tests

ชุดทดสอบ UAT อัตโนมัติสำหรับ DriveToSurviveWebApp ด้วย Robot Framework + Browser Library (Playwright)

ครอบคลุม 3 User Stories:
- **US#1** — System Log (Compliance) — พ.ร.บ.คอมพิวเตอร์ ม.26
- **US#3** — Blacklist Management — PDPA ม.22
- **US#16** — Account Deletion — PDPA ม.33

## 📋 ข้อกำหนดเบื้องต้น

- **Python** 3.9+
- **Node.js** 18+ (สำหรับ Playwright)
- **Frontend** รันอยู่ที่ `http://localhost:3000`
- **Backend** รันอยู่ที่ `http://localhost:3001`

## 🚀 วิธี Setup

### 1. สร้าง Virtual Environment

```bash
cd robot_tests
python3 -m venv venv
source venv/bin/activate
```

### 2. ติดตั้ง Dependencies

```bash
pip install -r requirements.txt
```

### 3. ติดตั้ง Browser (Playwright)

```bash
rfbrowser init
```

### 4. สร้างบัญชีทดสอบ

```bash
cd ../server
node prisma/seed-test-users.js
```

บัญชีที่สร้าง:
| บัญชี | Email | Password |
|--------|-------|----------|
| Admin | admin@example.com | adminpassword |
| Passenger | testpassenger@test.com | Test1234 |
| Delete Test | testdelete@test.com | Test1234 |

## ▶️ วิธีรันเทส

### รันทั้ง 3 Stories

```bash
cd robot_tests
source venv/bin/activate
robot --outputdir results US1_SystemLog/ US3_Blacklist/ US16_AccountDeletion/
```

### รันแยก Story

```bash
# US#1 — System Log
robot --outputdir results US1_SystemLog/

# US#3 — Blacklist
robot --outputdir results US3_Blacklist/

# US#16 — Account Deletion
robot --outputdir results US16_AccountDeletion/
```

### รันเฉพาะ tag

```bash
robot --outputdir results --include smoke US1_SystemLog/ US3_Blacklist/ US16_AccountDeletion/
robot --outputdir results --include compliance US1_SystemLog/ US3_Blacklist/ US16_AccountDeletion/
robot --outputdir results --include critical US1_SystemLog/ US3_Blacklist/ US16_AccountDeletion/
```

### รัน Headless (ไม่เปิดหน้าจอ)

แก้ `common.resource` บรรทัด:
```
New Browser    chromium    headless=true
```

## 📁 โครงสร้างไฟล์

```
robot_tests/
├── README.md
├── requirements.txt
├── resources/
│   └── common.resource
├── US1_SystemLog/
│   └── system_log_tests.robot
├── US3_Blacklist/
│   └── blacklist_tests.robot
└── US16_AccountDeletion/
    └── account_deletion_tests.robot
```

## 📊 ดูผลลัพธ์

หลังรันเสร็จ ผลลัพธ์จะอยู่ใน `results/`:
- **report.html** — สรุปภาพรวม
- **log.html** — รายละเอียดทุก step + screenshots
- **output.xml** — สำหรับ CI/CD integration

## 🏷️ Tags ที่ใช้

| Tag | ความหมาย |
|-----|----------|
| `US1` | User Story #1 — System Log |
| `US3` | User Story #3 — Blacklist |
| `US16` | User Story #16 — Account Deletion |
| `smoke` | Smoke test |
| `compliance` | ทดสอบ compliance กับกฎหมาย |
| `immutable` | ทดสอบ immutability ของ log |
| `filter` | ทดสอบการกรองข้อมูล |
| `pagination` | ทดสอบ pagination |
| `crud` | ทดสอบ CRUD operations |
| `rbac` | ทดสอบ Role-Based Access Control |
| `security` | ทดสอบความปลอดภัย |
| `critical` | Test cases ที่สำคัญมาก |
| `pdpa` | เกี่ยวกับ PDPA |
| `delete` | ทดสอบการลบบัญชี |
| `negative` | Negative test cases |

## 🔗 Test Cases ทั้งหมด

### US#1 — System Log (10 cases)

| TC ID | ชื่อ | Tags |
|-------|------|------|
| TC-LOG-001 | เปิดหน้า System Log สำเร็จ | smoke, compliance |
| TC-LOG-002 | กรอง Log ตามช่วงวันที่ | filter |
| TC-LOG-003 | กรอง Log ตาม User ID | filter |
| TC-LOG-004 | กรอง Log ตาม Action | filter |
| TC-LOG-005 | กรอง Log ตาม IP Address | filter |
| TC-LOG-006 | Pagination ทำงานถูกต้อง | pagination |
| TC-LOG-007 | ไม่มีปุ่มแก้ไข Log (Immutable) | immutable, compliance, critical |
| TC-LOG-008 | ไม่มีปุ่มลบ Log (Immutable) | immutable, compliance, critical |
| TC-LOG-009 | ผู้ใช้ทั่วไปเข้าไม่ได้ (RBAC) | rbac, security, critical |
| TC-LOG-010 | Log ยังอยู่หลังลบบัญชี | compliance, pdpa |

### US#3 — Blacklist (7 cases)

| TC ID | ชื่อ | Tags |
|-------|------|------|
| TC-BL-001 | เปิดหน้า Blacklist สำเร็จ | smoke |
| TC-BL-002 | เพิ่มเลขบัตรเข้า Blacklist | crud, pdpa |
| TC-BL-003 | เพิ่มเลขบัตรเดียวกันซ้ำ | negative |
| TC-BL-004 | ลบรายชื่อออกจาก Blacklist | crud |
| TC-BL-008 | กรอง Blacklist ตามวันที่ | filter |
| TC-BL-009 | ผู้ใช้ทั่วไปเข้าไม่ได้ (RBAC) | rbac, security, critical |
| TC-BL-010 | ไม่แสดงเลขบัตรดิบ (Hash) | pdpa, security, critical |

### US#16 — Account Deletion (7 cases)

| TC ID | ชื่อ | Tags |
|-------|------|------|
| TC-DEL-001 | เปิดหน้าลบบัญชีได้ | smoke |
| TC-DEL-002 | ลบบัญชีพิมพ์ DELETE ยืนยัน | delete, pdpa, critical |
| TC-DEL-003 | ยกเลิกการลบบัญชี | cancel |
| TC-DEL-004 | พิมพ์ไม่ตรง ปุ่ม Disable | validation |
| TC-DEL-005 | ผู้ใช้ที่ลบแล้ว login ไม่ได้ | delete, critical |
| TC-DEL-007 | Log ยังอยู่หลังลบบัญชี | compliance, pdpa, critical |
| TC-DEL-010 | ผู้ใช้ทั่วไปลบบัญชีผู้อื่นไม่ได้ | rbac, security, critical |

## ⚠️ หมายเหตุ

- **TC-DEL-002** จะลบบัญชี `testdelete@test.com` จริง — รัน `node prisma/seed-test-users.js` ใหม่ก่อนรันซ้ำ
- **TC-BL-005, TC-BL-006, TC-BL-007** (Blacklist + Registration) ต้องทดสอบด้วยมือเพราะต้องอัปโหลดรูปบัตร
- **TC-DEL-006** (PII Anonymized) ต้องตรวจสอบด้วยมือผ่านหน้า Admin Users
- **TC-DEL-008, TC-DEL-009** (Admin Delete User) ต้องทดสอบด้วยมือผ่านหน้า Admin Users
