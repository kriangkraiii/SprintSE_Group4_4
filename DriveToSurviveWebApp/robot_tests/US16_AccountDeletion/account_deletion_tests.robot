*** Settings ***
Documentation     US#16 — Account Deletion — UAT Automation
...               PDPA ม.33 — Right to Erasure
...               ทดสอบการลบบัญชี, ยกเลิก, ข้อความยืนยัน, Anonymize, Log Retention
Resource          ../resources/common.resource
Suite Setup       Open Browser To Login Page
Suite Teardown    Close Test Browser

*** Test Cases ***
TC-DEL-001 เปิดหน้าลบบัญชีได้
    [Documentation]    ขั้นตอน:
    ...    1. เปิดหน้า Profile
    ...    2. เลื่อนลงมาที่ส่วน "ลบบัญชีผู้ใช้"
    ...    3. กดปุ่ม "ลบบัญชีของฉัน"
    ...    ผลลัพธ์: แสดง Modal ยืนยันการลบบัญชี
    [Tags]    US16    smoke
    # Login ด้วยบัญชี Passenger (ไม่ใช่บัญชีที่จะลบ)
    Login As Passenger
    Navigate To Profile
    # ตรวจว่ามีส่วน "ลบบัญชีผู้ใช้"
    Wait For Elements State    css=h3:has-text("ลบบัญชีผู้ใช้")    visible
    # กดปุ่ม "ลบบัญชีของฉัน"
    Click    ${BTN_DELETE_ACCOUNT}
    # ตรวจว่า Modal แสดง
    Wait For Elements State    ${DELETE_MODAL_TITLE}    visible
    # ตรวจว่ามี input สำหรับพิมพ์ DELETE
    Wait For Elements State    ${DELETE_CONFIRM_INPUT}    visible
    # ตรวจว่ามีปุ่มยืนยัน
    Wait For Elements State    ${BTN_CONFIRM_DELETE}    visible
    # ปิด modal (ยกเลิก — ไม่ลบจริง)
    Click    ${BTN_CANCEL_DELETE}
    Wait For Elements State    ${DELETE_MODAL_TITLE}    detached    timeout=${BROWSER_TIMEOUT}

TC-DEL-003 ยกเลิกการลบบัญชี
    [Documentation]    ขั้นตอน:
    ...    1. กดปุ่ม "ยกเลิก" ใน Modal
    ...    ผลลัพธ์: Modal ปิด และยังอยู่ที่หน้า Profile
    [Tags]    US16    cancel
    # กดปุ่มลบอีกครั้ง
    Click    ${BTN_DELETE_ACCOUNT}
    Wait For Elements State    ${DELETE_MODAL_TITLE}    visible
    # กดยกเลิก
    Click    ${BTN_CANCEL_DELETE}
    # ตรวจว่า Modal ปิด
    Wait For Elements State    ${DELETE_MODAL_TITLE}    detached    timeout=${BROWSER_TIMEOUT}
    # ตรวจว่ายังอยู่หน้า Profile
    Wait For Elements State    ${PAGE_TITLE_PROFILE}    visible

TC-DEL-004 พิมพ์ข้อความยืนยันไม่ตรง ปุ่มถูก Disable
    [Documentation]    ขั้นตอน:
    ...    1. พิมพ์ "delete" (ตัวเล็ก) ในช่อง input
    ...    ผลลัพธ์: ปุ่มยืนยันถูก disable
    [Tags]    US16    validation
    Click    ${BTN_DELETE_ACCOUNT}
    Wait For Elements State    ${DELETE_MODAL_TITLE}    visible
    # พิมพ์ "delete" ตัวเล็ก
    Fill Text    ${DELETE_CONFIRM_INPUT}    delete
    # ตรวจว่าปุ่มยืนยัน disabled (opacity-40 class)
    ${btn_class}=    Get Attribute    ${BTN_CONFIRM_DELETE}    class
    Should Contain    ${btn_class}    opacity-40    msg=ปุ่มยืนยันไม่ถูก disable เมื่อพิมพ์ "delete" ตัวเล็ก!
    # ล้าง input
    Fill Text    ${DELETE_CONFIRM_INPUT}    ${EMPTY}
    # ปิด modal
    Click    ${BTN_CANCEL_DELETE}

TC-DEL-002 ลบบัญชีโดยพิมพ์ DELETE ยืนยัน
    [Documentation]    ขั้นตอน:
    ...    1. พิมพ์ "DELETE" ในช่อง input
    ...    2. กดปุ่มยืนยัน
    ...    ผลลัพธ์: บัญชีถูกลบ และ redirect ไปหน้า login (PDPA ม.33)
    ...    ⚠️ ใช้บัญชี testdelete@test.com — ลบจริง!
    [Tags]    US16    delete    pdpa    critical
    # Logout จาก Passenger ก่อน
    Go To    ${LOGIN_URL}
    # Login ด้วยบัญชีสำหรับลบ
    Login As Delete User
    Navigate To Profile
    # กดปุ่มลบ
    Click    ${BTN_DELETE_ACCOUNT}
    Wait For Elements State    ${DELETE_MODAL_TITLE}    visible
    # พิมพ์ DELETE
    Fill Text    ${DELETE_CONFIRM_INPUT}    DELETE
    # ตรวจว่าปุ่มยืนยัน enabled
    ${btn_class}=    Get Attribute    ${BTN_CONFIRM_DELETE}    class
    Should Not Contain    ${btn_class}    opacity-40    msg=ปุ่มยืนยันยังถูก disable แม้พิมพ์ DELETE แล้ว!
    # กดยืนยันลบ
    Click    ${BTN_CONFIRM_DELETE}
    # รอ redirect ไปหน้า login
    Wait For Elements State    ${INPUT_IDENTIFIER}    visible    timeout=${BROWSER_TIMEOUT}
    ${current_url}=    Get Url
    Should Contain    ${current_url}    /login    msg=ไม่ถูก redirect ไปหน้า login หลังลบบัญชี!
    Log    ✅ ลบบัญชีสำเร็จ redirect ไปหน้า login

TC-DEL-005 ผู้ใช้ที่ลบบัญชีแล้วเข้าสู่ระบบไม่ได้
    [Documentation]    ขั้นตอน:
    ...    1. ลบบัญชีสำเร็จ (จาก TC-DEL-002)
    ...    2. เปิดหน้า Login
    ...    3. กรอก email และ password เดิม
    ...    4. กดปุ่ม "เข้าสู่ระบบ"
    ...    ผลลัพธ์: เข้าสู่ระบบไม่ได้ แสดงข้อความ error
    [Tags]    US16    delete    critical
    # ลอง login ด้วยบัญชีที่ถูกลบ
    Fill Text    ${INPUT_IDENTIFIER}    ${DELETE_USER_EMAIL}
    Fill Text    ${INPUT_PASSWORD}      ${DELETE_USER_PASSWORD}
    Click    ${BTN_LOGIN}
    # ต้องแสดง error message
    Wait For Elements State    ${ERROR_MESSAGE}    visible    timeout=${BROWSER_TIMEOUT}
    Log    ✅ ผู้ใช้ที่ลบบัญชีแล้วเข้าสู่ระบบไม่ได้

TC-DEL-007 Log ยังคงอยู่หลังลบบัญชี
    [Documentation]    ขั้นตอน:
    ...    1. Admin เข้าสู่ระบบ
    ...    2. เปิดหน้า System Log
    ...    3. ตรวจสอบว่ามี Log อยู่ในระบบ
    ...    ผลลัพธ์: Log ยังคงแสดงอยู่ (พ.ร.บ.คอมพิวเตอร์ ม.26 — เก็บ ≥90 วัน)
    [Tags]    US16    compliance    pdpa    critical
    # Login เป็น Admin
    Login As Admin
    Navigate To System Logs
    Wait Until Table Loaded
    # ตรวจว่ามี Log อยู่ (ต้องมี log จากการ login/delete ก่อนหน้า)
    ${rows}=    Get Elements    ${LOG_TABLE_ROWS}
    ${row_count}=    Get Length    ${rows}
    Should Be True    ${row_count} > 0    msg=ตาราง Log ว่างเปล่า! ระบบต้องเก็บ Log ตาม พ.ร.บ.คอมพิวเตอร์ ม.26
    Log    ✅ System Log ถูกเก็บรักษาไว้หลังลบบัญชี (PDPA vs พ.ร.บ.คอม)

TC-DEL-010 ผู้ใช้ทั่วไปไม่สามารถลบบัญชีผู้อื่นได้
    [Documentation]    ขั้นตอน:
    ...    1. เข้าสู่ระบบด้วยบัญชี Passenger
    ...    2. พิมพ์ URL หน้าจัดการผู้ใช้ในเบราว์เซอร์โดยตรง
    ...    ผลลัพธ์: ถูก redirect ไปหน้าอื่น หรือแสดงข้อความ "ไม่มีสิทธิ์เข้าถึง" (RBAC)
    [Tags]    US16    rbac    security    critical
    # เปิด tab ใหม่ login เป็น Passenger
    New Page    ${LOGIN_URL}
    Login As Passenger
    # พยายามเข้าหน้าจัดการผู้ใช้โดยตรง
    Go To    ${ADMIN_USERS_URL}
    Sleep    2s
    ${current_url}=    Get Url
    Should Not Contain    ${current_url}    /admin/users    msg=Passenger ไม่ควรเข้าถึงหน้าจัดการผู้ใช้ได้!
    Log    ✅ RBAC ป้องกัน Passenger เข้าหน้า Admin Users
