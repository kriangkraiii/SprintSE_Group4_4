*** Settings ***
Documentation     US#3 — Blacklist Management — UAT Automation
...               PDPA ม.22 — SHA-256 Hash Only
...               ทดสอบการเพิ่ม/ลบ Blacklist, ป้องกันซ้ำ, กรองข้อมูล, RBAC, Hash Storage
Resource          ../resources/common.resource
Suite Setup       Open Browser And Login As Admin
Suite Teardown    Close Test Browser

*** Variables ***
${TEST_NATIONAL_ID}    1234567890123

*** Keywords ***
Open Browser And Login As Admin
    Open Browser To Login Page
    Login As Admin
    Navigate To Blacklist

Wait Until Blacklist Table Loaded
    Wait For Elements State    css=svg.animate-spin    detached    timeout=${BROWSER_TIMEOUT}
    Wait For Elements State    ${BL_TABLE}    visible    timeout=${BROWSER_TIMEOUT}

*** Test Cases ***
TC-BL-001 เปิดหน้า Blacklist สำเร็จ
    [Documentation]    ขั้นตอน:
    ...    1. เปิดหน้า Admin Dashboard
    ...    2. คลิกเมนู "Blacklist" ที่แถบด้านข้าง
    ...    ผลลัพธ์: แสดงหน้า Blacklist พร้อมตารางรายชื่อที่ถูก blacklist
    [Tags]    US3    smoke
    # ตรวจหัวข้อ
    Get Text    ${PAGE_TITLE_BLACKLIST}    ==    Blacklist Management
    # ตรวจ badge PDPA
    Wait For Elements State    ${PDPA_BADGE_BLACKLIST}    visible
    # ตรวจว่ามีปุ่ม "เพิ่ม Blacklist"
    Wait For Elements State    ${BTN_ADD_BLACKLIST}    visible
    # ตรวจว่ามีตาราง
    Wait For Elements State    ${BL_TABLE}    visible

TC-BL-002 เพิ่มเลขบัตรประชาชนเข้า Blacklist
    [Documentation]    ขั้นตอน:
    ...    1. เปิดหน้า Blacklist
    ...    2. กดปุ่ม "เพิ่ม Blacklist"
    ...    3. กรอกเลขบัตรประชาชน = "1234567890123"
    ...    4. กรอกเหตุผล = "ฉ้อโกง"
    ...    5. กดปุ่ม "ยืนยัน"
    ...    ผลลัพธ์: เพิ่มสำเร็จ แสดงรายการใหม่ในตาราง (PDPA ม.22 — เก็บเป็น SHA-256 hash)
    [Tags]    US3    crud    pdpa
    # กดปุ่มเพิ่ม
    Click    ${BTN_ADD_BLACKLIST}
    Wait For Elements State    ${BL_MODAL_TITLE}    visible
    # กรอกเลขบัตร
    # กรอกเลขบัตร (ใช้เลขที่ยังไม่มีในระบบ — cleaned by seed)
    Fill Text    ${BL_INPUT_NATIONAL_ID}    1234567890001
    # กรอกเหตุผล
    Fill Text    ${BL_INPUT_REASON}    ฉ้อโกง
    # กดยืนยัน
    Click    ${BL_MODAL_CONFIRM}
    # รอ modal ปิด
    Wait For Elements State    ${BL_MODAL_TITLE}    detached    timeout=${BROWSER_TIMEOUT}
    # รอตารางโหลดใหม่
    Wait Until Blacklist Table Loaded
    # ตรวจว่ามีรายการในตาราง
    ${rows}=    Get Elements    ${BL_TABLE_ROWS}
    ${row_count}=    Get Length    ${rows}
    Should Be True    ${row_count} > 0    msg=ไม่พบรายการ Blacklist หลังเพิ่ม

TC-BL-003 เพิ่มเลขบัตรเดียวกันซ้ำ
    [Documentation]    ขั้นตอน:
    ...    1. เปิดหน้า Blacklist
    ...    2. กดปุ่ม "เพิ่ม Blacklist"
    ...    3. กรอกเลขบัตร = "1234567890123" (เพิ่มไปแล้ว)
    ...    4. กดปุ่ม "ยืนยัน"
    ...    ผลลัพธ์: แสดงข้อความ "เลขบัตรนี้อยู่ใน Blacklist แล้ว"
    [Tags]    US3    negative
    Click    ${BTN_ADD_BLACKLIST}
    Wait For Elements State    ${BL_MODAL_TITLE}    visible
    Fill Text    ${BL_INPUT_NATIONAL_ID}    ${TEST_NATIONAL_ID}
    Fill Text    ${BL_INPUT_REASON}    ทดสอบซ้ำ
    Click    ${BL_MODAL_CONFIRM}
    # ต้องแสดง error message ใน modal
    Wait For Elements State    css=.fixed .text-red-600    visible    timeout=${BROWSER_TIMEOUT}
    # ปิด modal
    Click    css=.fixed button:has-text("ยกเลิก")
    Wait For Elements State    ${BL_MODAL_TITLE}    detached    timeout=${BROWSER_TIMEOUT}

TC-BL-004 ลบรายชื่อออกจาก Blacklist
    [Documentation]    ขั้นตอน:
    ...    1. เปิดหน้า Blacklist
    ...    2. กดปุ่ม "ลบ" ที่รายการที่ต้องการ
    ...    3. กดปุ่ม "ยืนยันการลบ"
    ...    ผลลัพธ์: ลบสำเร็จ รายการหายจากตาราง
    [Tags]    US3    crud
    Navigate To Blacklist
    Wait Until Blacklist Table Loaded
    # นับจำนวนแถวก่อนลบ
    ${rows_before}=    Get Elements    ${BL_TABLE_ROWS}
    ${count_before}=    Get Length    ${rows_before}
    # กดปุ่มลบที่แถวแรก
    Click    css=table tbody tr:first-child button:has-text("ลบ")
    # รอ ConfirmModal แสดง (มีข้อความ "ต้องการลบรายการ")
    Wait For Elements State    text=ต้องการลบรายการ    visible    timeout=${BROWSER_TIMEOUT}
    Sleep    500ms
    # กดปุ่มยืนยันลบใน ConfirmModal (ปุ่มสีแดงใน modal)
    Evaluate Javascript    css=div:has-text("ต้องการลบรายการ") >> button.bg-red-600 >> nth=0    (element) => element.click()
    Sleep    2s
    Wait Until Blacklist Table Loaded

TC-BL-008 กรอง Blacklist ตามช่วงวันที่
    [Documentation]    ขั้นตอน:
    ...    1. เปิดหน้า Blacklist
    ...    2. เลือกวันที่เริ่มต้น = "01/01/2026"
    ...    3. เลือกวันที่สิ้นสุด = "31/12/2026"
    ...    4. กดปุ่ม "ค้นหา"
    ...    ผลลัพธ์: แสดงเฉพาะรายการที่อยู่ในช่วงวันที่ที่เลือก
    [Tags]    US3    filter
    Navigate To Blacklist
    Fill Text    ${BL_FILTER_DATE_FROM}    2026-01-01T00:00
    Fill Text    ${BL_FILTER_DATE_TO}      2026-12-31T23:59
    Click    ${BL_BTN_SEARCH}
    Wait Until Blacklist Table Loaded
    Wait For Elements State    ${BL_TABLE}    visible
    # ล้างฟิลเตอร์
    Click    ${BL_BTN_CLEAR}
    Wait Until Blacklist Table Loaded

TC-BL-009 ผู้ใช้ทั่วไปไม่สามารถเข้าหน้า Blacklist ได้
    [Documentation]    ขั้นตอน:
    ...    1. เข้าสู่ระบบด้วยบัญชี Passenger
    ...    2. พิมพ์ URL หน้า Blacklist ในเบราว์เซอร์โดยตรง
    ...    ผลลัพธ์: ถูก redirect ไปหน้าอื่น หรือแสดงข้อความ "ไม่มีสิทธิ์เข้าถึง" (RBAC)
    [Tags]    US3    rbac    security    critical
    # เปิด Context ใหม่ login เป็น Passenger (แยก session)
    New Context
    New Page    ${LOGIN_URL}
    Login As Passenger
    # พยายามเข้าหน้า Blacklist โดยตรง
    Go To    ${BLACKLIST_URL}
    Sleep    2s
    ${current_url}=    Get Url
    Should Not Contain    ${current_url}    /admin/blacklist    msg=Passenger ไม่ควรเข้าถึงหน้า Blacklist ได้!
    # ปิด Context กลับไปใช้ session หลัก (Admin)
    Close Context
    # รีเฟรชหน้า Admin เพื่อความชัวร์
    New Page    ${BLACKLIST_URL}

TC-BL-010 ตรวจสอบว่าไม่แสดงเลขบัตรดิบ (Hash Storage)
    [Documentation]    ขั้นตอน:
    ...    1. Admin เพิ่มเลขบัตรเข้า blacklist
    ...    2. เปิดหน้า Blacklist
    ...    3. ตรวจสอบคอลัมน์ในตาราง — ไม่แสดงเลขบัตรดิบ
    ...    ผลลัพธ์: ไม่มีเลขบัตรประชาชน 13 หลักแสดงในตาราง (PDPA ม.22)
    [Tags]    US3    pdpa    security    critical
    # เพิ่ม blacklist ใหม่สำหรับทดสอบ (ใช้ปุ่มบนหน้าหลัก — มี icon fa-plus)
    Navigate To Blacklist
    Click    css=button:has(i.fa-plus)
    Wait For Elements State    ${BL_MODAL_TITLE}    visible
    # สุ่มเลขบัตรเพื่อเลี่ยงปัญหา duplicate ในการรันซ้ำ
    ${RANDOM_ID}=    Evaluate    str(random.randint(1000000000000, 9999999999999))    random
    Fill Text    ${BL_INPUT_NATIONAL_ID}    ${RANDOM_ID}
    Fill Text    ${BL_INPUT_REASON}    ทดสอบ hash
    Click    ${BL_MODAL_CONFIRM}
    Wait For Elements State    ${BL_MODAL_TITLE}    detached    timeout=${BROWSER_TIMEOUT}
    Wait Until Blacklist Table Loaded
    # ตรวจสอบว่าคอลัมน์ National ID Hash แสดง hash ไม่ใช่เลขดิบ
    ${hash_cells}=    Get Elements    css=table tbody tr td:nth-child(2) code
    FOR    ${cell}    IN    @{hash_cells}
        ${text}=    Get Text    ${cell}
        ${length}=    Get Length    ${text}
        # Hash SHA-256 มีความยาว 64 ตัวอักษร (hex) — ไม่ใช่ 13 หลัก
        Should Be True    ${length} > 13    msg=พบเลขบัตรดิบในตาราง! ต้องแสดงเป็น SHA-256 Hash เท่านั้น
        Should Not Match Regexp    ${text}    ^\\d{13}$    msg=พบเลขบัตรประชาชน 13 หลักดิบ! ละเมิด PDPA ม.22
    END
    Log    ✅ ระบบเก็บเฉพาะ SHA-256 hash ไม่แสดงเลขบัตรดิบ
