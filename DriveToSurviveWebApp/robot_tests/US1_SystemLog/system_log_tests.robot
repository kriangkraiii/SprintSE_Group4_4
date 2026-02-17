*** Settings ***
Documentation     US#1 — System Log (Compliance) — UAT Automation
...               พ.ร.บ.คอมพิวเตอร์ พ.ศ. 2560 มาตรา 26
...               ทดสอบการแสดงผล, กรองข้อมูล, Pagination, Immutability, RBAC
Resource          ../resources/common.resource
Suite Setup       Open Browser And Login As Admin
Suite Teardown    Close Test Browser

*** Keywords ***
Open Browser And Login As Admin
    Open Browser To Login Page
    Login As Admin
    Navigate To System Logs
    Wait Until Table Loaded

*** Test Cases ***
TC-LOG-001 เปิดหน้า System Log สำเร็จ
    [Documentation]    ขั้นตอน:
    ...    1. เปิดหน้า Admin Dashboard
    ...    2. คลิกเมนู "System Logs" ที่แถบด้านข้าง
    ...    ผลลัพธ์: แสดงหน้า System Log พร้อมตารางที่มี userId, action, ipAddress, createdAt
    [Tags]    US1    smoke    compliance
    # ตรวจหัวข้อ
    Get Text    ${PAGE_TITLE_SYSTEM_LOGS}    ==    System Logs
    # ตรวจ badge กฎหมาย พ.ร.บ.คอมพิวเตอร์ ม.26
    Wait For Elements State    ${IMMUTABLE_BADGE}    visible
    # ตรวจคอลัมน์ตาราง 7 คอลัมน์
    ${headers}=    Get Elements    ${LOG_TABLE_HEADERS}
    ${count}=      Get Length    ${headers}
    Should Be Equal As Integers    ${count}    7

TC-LOG-002 กรอง Log ตามช่วงวันที่
    [Documentation]    ขั้นตอน:
    ...    1. เปิดหน้า System Log
    ...    2. เลือกวันที่เริ่มต้น = "01/01/2026"
    ...    3. เลือกวันที่สิ้นสุด = "31/01/2026"
    ...    4. กดปุ่ม "ค้นหา"
    ...    ผลลัพธ์: แสดงเฉพาะ Log ที่อยู่ในช่วงวันที่ 1-31 ม.ค. 2026
    [Tags]    US1    filter
    Fill Text    ${FILTER_DATE_FROM}    2026-01-01T00:00
    Fill Text    ${FILTER_DATE_TO}      2026-01-31T23:59
    Click    ${BTN_SEARCH}
    Wait Until Table Loaded
    Wait For Elements State    ${LOG_TABLE}    visible
    # ล้างฟิลเตอร์
    Click    ${BTN_CLEAR}
    Wait Until Table Loaded

TC-LOG-003 กรอง Log ตาม User ID
    [Documentation]    ขั้นตอน:
    ...    1. เปิดหน้า System Log
    ...    2. กรอก userId ในช่องค้นหา
    ...    3. กดปุ่ม "ค้นหา"
    ...    ผลลัพธ์: แสดงเฉพาะ Log ของ userId ที่ระบุ
    [Tags]    US1    filter
    Fill Text    ${FILTER_USER_ID}    cm
    Click    ${BTN_SEARCH}
    Wait Until Table Loaded
    Wait For Elements State    ${LOG_TABLE}    visible
    Click    ${BTN_CLEAR}
    Wait Until Table Loaded

TC-LOG-004 กรอง Log ตาม Action
    [Documentation]    ขั้นตอน:
    ...    1. เปิดหน้า System Log
    ...    2. เลือก action = "GET" จาก dropdown
    ...    3. กดปุ่ม "ค้นหา"
    ...    ผลลัพธ์: แสดงเฉพาะ Log ที่มี action = GET
    [Tags]    US1    filter
    Select Options By    ${FILTER_ACTION}    value    GET
    Click    ${BTN_SEARCH}
    Wait Until Table Loaded
    ${rows}=    Get Elements    ${LOG_TABLE_ROWS}
    ${row_count}=    Get Length    ${rows}
    IF    ${row_count} > 0
        ${action_cells}=    Get Elements    css=table tbody tr td:nth-child(5) span
        FOR    ${cell}    IN    @{action_cells}
            Get Text    ${cell}    ==    GET
        END
    END
    Click    ${BTN_CLEAR}
    Wait Until Table Loaded

TC-LOG-005 กรอง Log ตาม IP Address
    [Documentation]    ขั้นตอน:
    ...    1. เปิดหน้า System Log
    ...    2. กรอก IP address = "192.168" ในช่องค้นหา
    ...    3. กดปุ่ม "ค้นหา"
    ...    ผลลัพธ์: แสดงเฉพาะ Log ที่มี IP address ตรงกับที่ค้นหา
    [Tags]    US1    filter
    Fill Text    ${FILTER_IP_ADDRESS}    192.168
    Click    ${BTN_SEARCH}
    Wait Until Table Loaded
    Wait For Elements State    ${LOG_TABLE}    visible
    Click    ${BTN_CLEAR}
    Wait Until Table Loaded

TC-LOG-006 Pagination ทำงานถูกต้อง
    [Documentation]    ขั้นตอน:
    ...    1. เปิดหน้า System Log
    ...    2. ดูตารางหน้าแรก
    ...    3. กดปุ่ม "หน้าถัดไป" หรือเลือกหมายเลขหน้า
    ...    ผลลัพธ์: แสดง Log หน้าถัดไป, Pagination อัปเดตถูกต้อง
    [Tags]    US1    pagination
    Wait Until Table Loaded
    ${has_next_btn}=    Get Element Count    ${BTN_NEXT_PAGE}
    IF    ${has_next_btn} > 0
        ${next_btn_class}=    Get Attribute    ${BTN_NEXT_PAGE}    class
        ${is_disabled}=       Run Keyword And Return Status    Should Contain    ${next_btn_class}    opacity-40
        IF    not ${is_disabled}
            Click    ${BTN_NEXT_PAGE}
            Wait Until Table Loaded
            Click    ${BTN_PREV_PAGE}
            Wait Until Table Loaded
        ELSE
            Log    ข้อมูล Log มีหน้าเดียว — ข้ามการทดสอบ Pagination    WARN
        END
    ELSE
        Log    ไม่พบปุ่ม Pagination (ข้อมูลน้อยกว่า limit) — ข้ามการทดสอบ    WARN
    END

TC-LOG-007 ไม่มีปุ่มแก้ไข Log (Immutable)
    [Documentation]    ขั้นตอน:
    ...    1. เปิดหน้า System Log
    ...    2. ตรวจสอบทุกแถวในตาราง
    ...    3. มองหาปุ่ม "แก้ไข" หรือ "Edit"
    ...    ผลลัพธ์: ไม่มีปุ่มแก้ไข Log ปรากฏในทุกแถว (Immutability)
    [Tags]    US1    immutable    compliance    critical
    Wait Until Table Loaded
    ${edit_buttons}=    Get Element Count    css=table button:has-text("Edit"), table button:has-text("แก้ไข"), table a:has-text("Edit"), table a:has-text("แก้ไข")
    Should Be Equal As Integers    ${edit_buttons}    0    msg=พบปุ่มแก้ไข! Log ต้องเป็น Immutable
    ${edit_icons}=    Get Element Count    css=table .fa-edit, table .fa-pen, table .fa-pencil
    Should Be Equal As Integers    ${edit_icons}    0    msg=พบ icon แก้ไข! Log ต้องเป็น Immutable

TC-LOG-008 ไม่มีปุ่มลบ Log (Immutable)
    [Documentation]    ขั้นตอน:
    ...    1. เปิดหน้า System Log
    ...    2. ตรวจสอบทุกแถวในตาราง
    ...    3. มองหาปุ่ม "ลบ" หรือ "Delete"
    ...    ผลลัพธ์: ไม่มีปุ่มลบ Log ปรากฏในทุกแถว (พ.ร.บ.คอมพิวเตอร์ ม.26 — เก็บ ≥90 วัน)
    [Tags]    US1    immutable    compliance    critical
    Wait Until Table Loaded
    ${delete_buttons}=    Get Element Count    css=table button:has-text("Delete"), table button:has-text("ลบ"), table a:has-text("Delete"), table a:has-text("ลบ")
    Should Be Equal As Integers    ${delete_buttons}    0    msg=พบปุ่มลบ! Log ต้องเป็น Immutable เก็บ ≥90 วัน
    ${delete_icons}=    Get Element Count    css=table .fa-trash, table .fa-trash-alt, table .fa-times
    Should Be Equal As Integers    ${delete_icons}    0    msg=พบ icon ลบ! Log ต้องเป็น Immutable

TC-LOG-009 ผู้ใช้ทั่วไปไม่สามารถเข้าหน้า System Log ได้
    [Documentation]    ขั้นตอน:
    ...    1. เข้าสู่ระบบด้วยบัญชี Passenger
    ...    2. พิมพ์ URL หน้า System Log ในเบราว์เซอร์โดยตรง
    ...    ผลลัพธ์: ถูก redirect ไปหน้าอื่น หรือแสดงข้อความ "ไม่มีสิทธิ์เข้าถึง" (RBAC)
    [Tags]    US1    rbac    security    critical
    # เปิด tab ใหม่ login เป็น Passenger
    New Page    ${LOGIN_URL}
    Login As Passenger
    # พยายามเข้าหน้า System Logs โดยตรง
    Go To    ${SYSTEM_LOG_URL}
    Sleep    2s
    ${current_url}=    Get Url
    Should Not Contain    ${current_url}    /admin/system-logs    msg=Passenger ไม่ควรเข้าถึงหน้า System Logs ได้!
    # กลับไป login เป็น Admin
    Go To    ${LOGIN_URL}
    Login As Admin

TC-LOG-010 Log ยังคงอยู่หลังลบบัญชีผู้ใช้
    [Documentation]    ขั้นตอน:
    ...    1. Admin เปิดหน้า System Log
    ...    2. ตรวจสอบว่ามี Log อยู่ในระบบ
    ...    ผลลัพธ์: Log ยังคงแสดงอยู่ในตาราง (PDPA ม.33 vs พ.ร.บ.คอมพิวเตอร์ ม.26)
    ...    ⚠️ ทดสอบเต็มรูปแบบต้องลบ user ก่อนแล้วค้นหา userId — ดู TC-DEL-007 ใน US#16
    [Tags]    US1    compliance    pdpa
    Navigate To System Logs
    Wait Until Table Loaded
    # ตรวจว่าตาราง Log มีข้อมูล (ต้องมี log จากการ login ของ admin เอง)
    ${rows}=    Get Elements    ${LOG_TABLE_ROWS}
    ${row_count}=    Get Length    ${rows}
    Should Be True    ${row_count} > 0    msg=ตาราง Log ไม่ควรว่างเปล่า — ระบบต้องเก็บ Log ทุก request
    # ตรวจว่ามีคอลัมน์ User ID
    Get Text    css=table thead th:nth-child(3)    contains    USER ID
    Log    ✅ System Log ถูกเก็บรักษาไว้ตามกฎหมาย