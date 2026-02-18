*** Settings ***
Library    Browser
Library    String
Library    Collections
Library    RequestsLibrary

*** Variables ***
${BASE_URL}              http://localhost:3000
${ADMIN_EMAIL}           admin@example.com
${ADMIN_PASSWORD}        adminpassword
${PASSENGER_EMAIL}       testpassenger@test.com
${PASSENGER_PASSWORD}    Test1234
${BROWSER_TIMEOUT}       15s

# Locators — Login Page
${LOGIN_URL}                    ${BASE_URL}/login
${INPUT_IDENTIFIER}             id=identifier
${INPUT_PASSWORD}               id=password
${BTN_LOGIN}                    css=#loginForm button[type="submit"]
${ERROR_MESSAGE}                css=.bg-red-50

# Locators — System Log Page
${SYSTEM_LOG_URL}               ${BASE_URL}/admin/system-logs
${SIDEBAR_SYSTEM_LOGS}          css=a[href="/admin/system-logs"]
${PAGE_TITLE_SYSTEM_LOGS}       css=h1:has-text("System Logs")
${IMMUTABLE_BADGE}              text=Immutable — พ.ร.บ.คอมพิวเตอร์ ม.26

# Locators — System Log Filters
${FILTER_USER_ID}               css=input[placeholder="cuid..."]
${FILTER_IP_ADDRESS}            css=input[placeholder="192.168.x.x"]
${FILTER_ACTION}                css=select
${FILTER_DATE_FROM}             css=input[type="datetime-local"] >> nth=0
${FILTER_DATE_TO}               css=input[type="datetime-local"] >> nth=1
${BTN_SEARCH}                   css=button:has-text("ค้นหา")
${BTN_CLEAR}                    css=button:has-text("ล้าง")

# Locators — System Log Table
${LOG_TABLE}                    css=table
${LOG_TABLE_HEADERS}            css=table thead th
${LOG_TABLE_ROWS}               css=table tbody tr
${NO_DATA_MESSAGE}              text=ไม่พบข้อมูล Log

# Locators — Pagination
${PAGINATION_CONTAINER}         css=.flex.items-center.justify-between.px-4.py-3
${BTN_PREV_PAGE}                css=button:has(i.fa-chevron-left)
${BTN_NEXT_PAGE}                css=button:has(i.fa-chevron-right)

# Locators — Blacklist Page
${BLACKLIST_URL}                     ${BASE_URL}/admin/blacklist
${PAGE_TITLE_BLACKLIST}              css=h1:has-text("Blacklist Management")
${PDPA_BADGE_BLACKLIST}              text=PDPA ม.22 — SHA-256 Hash Only
${BTN_ADD_BLACKLIST}                 css=button:has(i.fa-plus)
${BL_TABLE}                          css=table
${BL_TABLE_ROWS}                     css=table tbody tr
${BL_NO_DATA}                        text=ไม่พบรายการ Blacklist
# Add Blacklist Modal
${BL_MODAL_TITLE}                    css=h2:has-text("เพิ่ม Blacklist")
${BL_INPUT_NATIONAL_ID}              css=input[placeholder="กรอกเลข 13 หลัก"]
${BL_INPUT_REASON}                   css=textarea[placeholder="ระบุเหตุผล (ไม่บังคับ)"]
${BL_MODAL_CONFIRM}                  css=.fixed button:has-text("เพิ่ม Blacklist")
${BL_MODAL_CANCEL}                   css=button:has-text("ยกเลิก")
${BL_MODAL_ERROR}                    css=.text-red-600
# Remove Blacklist
${BL_BTN_REMOVE}                     css=button:has-text("ลบ")
${BL_CONFIRM_REMOVE}                 css=button:has-text("ลบ")
# Blacklist Filters
${BL_FILTER_DATE_FROM}               css=input[type="datetime-local"] >> nth=0
${BL_FILTER_DATE_TO}                 css=input[type="datetime-local"] >> nth=1
${BL_BTN_SEARCH}                     css=button:has-text("ค้นหา")
${BL_BTN_CLEAR}                      css=button:has-text("ล้าง")

# Locators — Profile / Delete Account Page
${PROFILE_URL}                       ${BASE_URL}/profile
${DELETE_USER_EMAIL}                  testdelete@test.com
${DELETE_USER_PASSWORD}               Test1234
${PAGE_TITLE_PROFILE}                css=h1:has-text("โปรไฟล์ของฉัน")
${BTN_DELETE_ACCOUNT}                css=button:has-text("ลบบัญชีของฉัน")
${DELETE_MODAL_TITLE}                css=h2:has-text("ยืนยันการลบบัญชี")
${DELETE_CONFIRM_INPUT}              css=input[placeholder="พิมพ์ DELETE เพื่อยืนยัน"]
${BTN_CONFIRM_DELETE}                css=div.fixed:has(h2:has-text("ยืนยันการลบบัญชี")) button:has-text("ลบบัญชีถาวร")
${BTN_CANCEL_DELETE}                 css=div.fixed:has(h2:has-text("ยืนยันการลบบัญชี")) button:has-text("ยกเลิก")

# Locators — Admin Users Page
${ADMIN_USERS_URL}                   ${BASE_URL}/admin/users

*** Keywords ***
Open Browser To Login Page
    New Browser    chromium    headless=false    slowMo=500ms
    New Context    viewport={'width': 1280, 'height': 800}
    New Page       ${LOGIN_URL}
    Wait For Elements State    ${INPUT_IDENTIFIER}    visible    timeout=${BROWSER_TIMEOUT}

Login As Admin
    [Documentation]    เข้าสู่ระบบด้วยบัญชี Admin
    Fill Text      ${INPUT_IDENTIFIER}    ${ADMIN_EMAIL}
    Fill Text      ${INPUT_PASSWORD}      ${ADMIN_PASSWORD}
    Click          ${BTN_LOGIN}
    Sleep    3s
    ${url}=    Get Url
    Should Not Contain    ${url}    /login    msg=Admin login failed - still on login page

Login As Passenger
    [Documentation]    เข้าสู่ระบบด้วยบัญชี Passenger
    Fill Text      ${INPUT_IDENTIFIER}    ${PASSENGER_EMAIL}
    Fill Text      ${INPUT_PASSWORD}      ${PASSENGER_PASSWORD}
    Click          ${BTN_LOGIN}
    Sleep    3s
    ${url}=    Get Url
    Should Not Contain    ${url}    /login    msg=Passenger login failed - still on login page

Navigate To System Logs
    [Documentation]    เปิดหน้า System Logs ผ่าน sidebar
    Go To    ${SYSTEM_LOG_URL}
    Wait For Elements State    ${PAGE_TITLE_SYSTEM_LOGS}    visible    timeout=${BROWSER_TIMEOUT}

Wait Until Table Loaded
    [Documentation]    รอจนตารางโหลดเสร็จ (ไม่มี loading spinner)
    Wait For Elements State    css=svg.animate-spin    detached    timeout=${BROWSER_TIMEOUT}
    Wait For Elements State    ${LOG_TABLE}    visible    timeout=${BROWSER_TIMEOUT}

Navigate To Blacklist
    [Documentation]    เปิดหน้า Blacklist Management
    Go To    ${BLACKLIST_URL}
    Wait For Elements State    ${PAGE_TITLE_BLACKLIST}    visible    timeout=${BROWSER_TIMEOUT}

Navigate To Profile
    [Documentation]    เปิดหน้า Profile
    Go To    ${PROFILE_URL}
    Wait For Elements State    ${PAGE_TITLE_PROFILE}    visible    timeout=${BROWSER_TIMEOUT}

Login As Delete User
    [Documentation]    เข้าสู่ระบบด้วยบัญชีสำหรับทดสอบลบ
    Fill Text      ${INPUT_IDENTIFIER}    ${DELETE_USER_EMAIL}
    Fill Text      ${INPUT_PASSWORD}      ${DELETE_USER_PASSWORD}
    Click          ${BTN_LOGIN}
    Sleep    3s
    ${url}=    Get Url
    Should Not Contain    ${url}    /login    msg=Delete user login failed - still on login page

Close Test Browser
    Close Browser
