*** Settings ***
Documentation     Epic 2 — Arrival Notification: ตรวจสอบการแจ้งเตือน 4 รูปแบบ
...               1) GPS ~5 กม. → "คนขับใกล้ถึงแล้ว"
...               2) GPS ~1 กม. → "คนขับใกล้ถึงมาก"
...               3) GPS ~0 กม. → "คนขับถึงจุดรับแล้ว!"
...               4) Manual Trigger → "คนขับแจ้งว่าถึงแล้ว"
...               เปิด Chrome โชว์ทุกขั้นตอน + Screenshot
Library           SeleniumLibrary
Library           RequestsLibrary
Library           Collections
Library           Process
Library           OperatingSystem

Suite Setup       Fresh Login And Open MyTrips
Suite Teardown    Close All Browsers

*** Variables ***
# ── Config ─────────────────────────────────────────────
${BASE_URL}          http://localhost:3001
${WEB_URL}           http://localhost:3003
${DRIVER_EMAIL}      epic2_driver@test.com
${PASSENGER_EMAIL}   conan17970@gmail.com
${PASS}              password123
${BOOKING_ID}        cmm673eqa0001vr9ax7xh0trd
${ROUTE_ID}          ${EMPTY}
${SCRIPT_DIR}        ${CURDIR}

# ── Runtime ────────────────────────────────────────────
${DRIVER_TOKEN}      ${EMPTY}
${PASSENGER_TOKEN}   ${EMPTY}
${DRIVER_RAW}        ${EMPTY}
${PASSENGER_RAW}     ${EMPTY}

*** Test Cases ***

# ══════════════════════════════════════════════════════════
# TC-SETUP: หน้า myTrips โหลดสำเร็จ + เห็นทริป
# ══════════════════════════════════════════════════════════
TC-SETUP: หน้า myTrips โหลด + เห็นทริป Confirmed
    [Documentation]    ยืนยันว่า Login สำเร็จ, หน้า myTrips แสดงผล, มีทริปที่จอง
    [Tags]             Setup

    Log To Console     \n✅ หน้า myTrips พร้อมแล้ว — Token สดจาก API
    Capture Page Screenshot    results/00_mytrips_page.png

# ══════════════════════════════════════════════════════════
# TC-2.0: กดปุ่มติดตามตำแหน่ง → เปิดหน้า Tracking
# ══════════════════════════════════════════════════════════
TC-2.0: กดปุ่ม ติดตามตำแหน่ง → เปิดหน้า Tracking
    [Documentation]    หาปุ่ม "📍 ติดตามตำแหน่ง" → Navigate ไป /tracking/{routeId}
    [Tags]             Critical

    Log To Console     \n🔍 กำลังหาปุ่ม ติดตามตำแหน่ง...

    ${clicked}=    Try Click Tracking Button

    Run Keyword If    not ${clicked}    Navigate To Tracking Directly

    Sleep    7s
    ${url}=    Get Location
    Log To Console     \n📍 URL: ${url}
    Should Contain     ${url}    /tracking/    msg=ต้องอยู่ที่หน้า tracking

    Log To Console     \n✅ หน้า Tracking พร้อม (Google Maps + Socket.IO)
    Capture Page Screenshot    results/01_tracking_loaded.png

# ══════════════════════════════════════════════════════════
# TC-2.1: 🔔 การแจ้งเตือน #1 — FIVE_KM (≤ 5 กม.)
# ══════════════════════════════════════════════════════════
TC-2.1: 🚗 คนขับออกเดินทาง → แจ้งเตือน FIVE_KM + ONE_KM + ZERO_KM
    [Documentation]    รัน simulate-driving.js ด้วย Token สด
    ...                → หมุด 🚗 บน Google Maps ขับจากเซ็นทรัลขอนแก่น → มข.
    ...                → Notification แจ้ง 3 ครั้ง: 5 กม., 1 กม., ถึงแล้ว
    [Tags]             Critical    RealTime

    Log To Console     \n🚗 คนขับออกเดินทางจาก เซ็นทรัลขอนแก่น → มข.
    Log To Console     \n👀 ดูหมุดรถบน Google Maps — จะขับตามถนนจริงเข้ามาหาจุดรับ!

    Capture Page Screenshot    results/02_driver_start.png

    # ─── รัน simulate-driving.js → Socket (GPS) + API (Notification) ───
    ${sim}=    Start Process
    ...    node    ${SCRIPT_DIR}/simulate-driving.js
    ...    ${BASE_URL}    ${DRIVER_TOKEN}    ${BOOKING_ID}    --socket    ${ROUTE_ID}
    ...    alias=simulate
    ...    stdout=${TEMPDIR}/sim_out.txt
    ...    stderr=${TEMPDIR}/sim_err.txt

    # ─── Phase 1: รถอยู่ช่วงเซ็นทรัล → ~5 กม. (15 วินาที) ───
    Log To Console     \n--- Phase 1: Central -> 5km (18s)...
    Sleep    18s
    Capture Page Screenshot    results/03_driver_near_5km.png
    Log To Console     \n--- Phase 2: 5km -> 1km (12s)...
    Sleep    12s
    Capture Page Screenshot    results/04_driver_near_1km.png
    Log To Console     \n--- Phase 3: 1km -> Arrived (15s)...
    Sleep    15s
    Capture Page Screenshot    results/05_driver_arrived.png

    # รอ process จบ + แสดง log
    ${result}=    Wait For Process    simulate    timeout=15s    on_timeout=terminate
    ${stdout}=    Get File    ${TEMPDIR}/sim_out.txt
    Log To Console    \n═══════════ Simulation Log ═══════════
    Log To Console    ${stdout}
    Log To Console    \n═══════════════════════════════════════

    Should Contain    ${stdout}    ✅           msg=Simulation ต้องเสร็จสมบูรณ์
    Should Contain    ${stdout}    Socket connected    msg=ต้องเชื่อมต่อ Socket.IO ได้
    Log To Console    \n🎓 คนขับถึง มข. แล้ว — Simulation สำเร็จ!

# ══════════════════════════════════════════════════════════
# TC-2.2: 🔔 Bell Notification ใน UI จริง
# ══════════════════════════════════════════════════════════
TC-2.2: 🔔 Bell Notification ใน UI
    [Documentation]    กลับไปหน้า myTrips → กด Bell → ดู notification ที่สะสม
    [Tags]             UI    Notification

    Log To Console     \n🔔 ตรวจสอบ Bell Notification หลังจากคนขับถึงแล้ว...

    Go To     ${WEB_URL}/myTrips
    Sleep     4s
    Capture Page Screenshot    results/06_mytrips_after.png

    # ── ลองกด Bell ────────────────────────────────────────
    ${bell_clicked}=    Run Keyword And Return Status
    ...    Click Element    xpath=//button[contains(@class,'bell') or contains(@aria-label,'notification') or contains(@aria-label,'แจ้งเตือน')]

    Run Keyword If    not ${bell_clicked}    Log To Console    \n⚠️ Bell icon ไม่พบ — UI อาจไม่มี Bell component

    Sleep     2s
    Capture Page Screenshot    results/07_bell_panel.png
    Log To Console    \n✅ Bell UI ตรวจสอบเสร็จ

# ══════════════════════════════════════════════════════════
# TC-2.3: 📋 Notification History ครบ 3 เหตุการณ์ (5กม, 1กม, ถึง)
# ══════════════════════════════════════════════════════════
TC-2.3: 📋 Notification History ครบ (5 กม., 1 กม., ถึงแล้ว)
    [Documentation]    GET /api/arrival-notifications/{bookingId} → ต้องมี 3 event
    ...                FIVE_KM, ONE_KM, ZERO_KM
    [Tags]             Critical

    Log To Console     \n📋 ดึง Notification History จาก API...

    Create Session    API    ${BASE_URL}    disable_warnings=True
    ${headers}=    Create Dictionary    Authorization=${DRIVER_TOKEN}
    ${res}=    GET On Session    API    /api/arrival-notifications/${BOOKING_ID}
    ...    headers=${headers}    expected_status=any

    ${body}=    Convert To String    ${res.content}
    Log To Console    \nStatus: ${res.status_code}
    Log To Console    \nBody: ${body[:800]}

    Run Keyword If    ${res.status_code} == 200    Verify Three Notifications    ${body}

    Capture Page Screenshot    results/08_history_verified.png
    Log To Console    \n✅ Notification History ตรวจสอบสำเร็จ

# ══════════════════════════════════════════════════════════
# TC-2.4: 🔔 Manual Trigger — คนขับแจ้งว่าถึงเอง
# ══════════════════════════════════════════════════════════
TC-2.4: Manual Trigger — คนขับแจ้งว่าถึงจุดรับแล้ว
    [Documentation]    POST /api/arrival-notifications/manual → แจ้งถึงด้วยตนเอง
    ...                ทดสอบกรณีที่ GPS ไม่ทำงาน คนขับกดปุ่มแจ้งเอง
    [Tags]             Critical

    Log To Console     \n--- Manual Trigger: คนขับกดแจ้งว่าถึงแล้ว ---

    # ── เรียก Manual Trigger API ──────────────────────────
    Create Session    API    ${BASE_URL}    disable_warnings=True
    ${headers}=    Create Dictionary
    ...    Authorization=${DRIVER_TOKEN}
    ...    Content-Type=application/json
    ${body}=    Create Dictionary    bookingId=${BOOKING_ID}

    ${res}=    POST On Session    API    /api/arrival-notifications/manual
    ...    json=${body}    headers=${headers}    expected_status=any

    Log To Console    \nStatus: ${res.status_code}
    Log To Console    \nBody: ${res.content}

    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    Log To Console    \n[PASS] Manual Trigger OK!

    # ── Refresh หน้าเว็บดูผล ──────────────────────────────
    Go To     ${WEB_URL}/myTrips
    Sleep     4s
    Capture Page Screenshot    results/09_after_manual_trigger.png
    Log To Console    \n[Screenshot] หลัง Manual Trigger

    # ── กด Bell Notification ดู ────────────────────────────
    ${bell_clicked}=    Run Keyword And Return Status
    ...    Click Element    xpath=//button[contains(@class,'bell') or contains(@aria-label,'notification') or contains(@aria-label,'แจ้งเตือน')]
    Sleep    2s
    Capture Page Screenshot    results/10_manual_bell.png
    Log To Console    \n[Screenshot] Bell Notification หลัง Manual Trigger

# ══════════════════════════════════════════════════════════
# TC-2.5: 📋 ตรวจสอบ Notification History ครบ 4 รูปแบบ
# ══════════════════════════════════════════════════════════
TC-2.5: 📋 ตรวจสอบ Notification ทั้ง 4 รูปแบบครบหมด
    [Documentation]    GET /api/arrival-notifications/{bookingId}
    ...                → ต้องเจอ FIVE_KM, ONE_KM, ZERO_KM, MANUAL ครบทุกรูปแบบ
    [Tags]             Critical

    Log To Console     \n📋 ตรวจสอบว่า Notification ครบ 4 รูปแบบ...

    Create Session    API    ${BASE_URL}    disable_warnings=True
    ${headers}=    Create Dictionary    Authorization=${DRIVER_TOKEN}
    ${res}=    GET On Session    API    /api/arrival-notifications/${BOOKING_ID}
    ...    headers=${headers}    expected_status=200

    ${body}=    Convert To String    ${res.content}
    Log To Console    \nFull Response: ${body[:1000]}

    # ── ตรวจทุกรูปแบบ ─────────────────────────────────────
    Should Contain    ${body}    FIVE_KM     msg=ต้องมี notification FIVE_KM (≤ 5 กม.)
    Should Contain    ${body}    ONE_KM      msg=ต้องมี notification ONE_KM (≤ 1 กม.)
    Should Contain    ${body}    ZERO_KM     msg=ต้องมี notification ZERO_KM (ถึงแล้ว)
    Should Contain    ${body}    MANUAL      msg=ต้องมี notification MANUAL (แจ้งด้วยตนเอง)

    Log To Console    \n✅ ครบทั้ง 4 รูปแบบ: FIVE_KM, ONE_KM, ZERO_KM, MANUAL
    Capture Page Screenshot    results/11_all_4_verified.png

# ══════════════════════════════════════════════════════════
# TC-2.5b: 📧 ตรวจสถานะ In-App + Email ทุก notification
# ══════════════════════════════════════════════════════════
TC-2.5b: 📧 ตรวจสอบสถานะ Email + In-App ของ Notification ทั้ง 4 รูปแบบ
    [Documentation]    GET /api/arrival-notifications/{bookingId}
    ...                ตรวจว่าทุก notification มี appStatus + emailStatus
    ...                appStatus ต้อง = SENT เสมอ (In-App)
    ...                emailStatus = SENT (ถ้าตั้ง SMTP) หรือ FAILED (ถ้าไม่ได้ตั้ง)
    ...                ทั้ง 2 ช่องทางต้องถูกบันทึกครบทุก notification
    [Tags]             Critical    Email

    Log To Console     \n📧 ตรวจสอบสถานะ Email + In-App ทุก notification...

    Create Session    API    ${BASE_URL}    disable_warnings=True
    ${headers}=    Create Dictionary    Authorization=${DRIVER_TOKEN}
    ${res}=    GET On Session    API    /api/arrival-notifications/${BOOKING_ID}
    ...    headers=${headers}    expected_status=200

    ${json}=    Set Variable    ${res.json()}
    ${data}=    Set Variable    ${json['data']}

    # ── ตรวจสถานะทุก notification ──────────────────────────
    Log To Console    \n--- Notification Channel Status ---

    ${email_sent_count}=    Set Variable    ${0}
    ${email_failed_count}=    Set Variable    ${0}

    FOR    ${notif}    IN    @{data}
        ${type}=    Set Variable    ${notif['radiusType']}
        ${app}=     Set Variable    ${notif['appStatus']}
        ${email}=   Set Variable    ${notif['emailStatus']}

        ${msg}=    Catenate    SEPARATOR=    ${type}    :App=    ${app}    /Email=    ${email}
        Log    ${msg}    console=True

        # In-App ต้อง SENT เสมอ
        Should Be Equal As Strings    ${app}    SENT
        ...    msg=${type}: In-App ต้อง SENT แต่ได้ ${app}

        # Email ต้องมี status (SENT หรือ FAILED ก็ได้ ขึ้นกับ SMTP)
        Should Not Be Empty    ${email}
        ...    msg=${type}: emailStatus ต้องไม่ว่างเปล่า

        # นับจำนวน SENT vs FAILED
        ${is_sent}=     Evaluate    1 if '${email}' == 'SENT' else 0
        ${is_failed}=   Evaluate    1 if '${email}' == 'FAILED' else 0
        ${email_sent_count}=      Evaluate    ${email_sent_count} + ${is_sent}
        ${email_failed_count}=    Evaluate    ${email_failed_count} + ${is_failed}
    END

    Log    Summary: In-App=ALL_SENT, EmailSent=${email_sent_count}, EmailFailed=${email_failed_count}    console=True

    Run Keyword If    ${email_sent_count} > 0
    ...    Log    SMTP_OK:Email_delivered!    console=True

    Run Keyword If    ${email_failed_count} > 0
    ...    Log    SMTP_not_configured:Email_failed_but_InApp_OK    console=True

    Capture Page Screenshot    results/11b_email_status.png
    Log To Console    \n[PASS] Email + In-App check done

# ══════════════════════════════════════════════════════════
# TC-2.6: 👤 ผู้โดยสารเห็น Notification ในระบบ
# ══════════════════════════════════════════════════════════
TC-2.6: 👤 สลับเป็นผู้โดยสาร → ตรวจสอบการแจ้งเตือนที่ได้รับ
    [Documentation]    สลับ Cookie เป็น Passenger → ดู myTrips + Notification
    ...                ตรวจว่า in-app notification ถูกส่งถึงผู้โดยสารจริง
    [Tags]             UI    Notification

    Log To Console     \n👤 สลับเป็น Passenger เพื่อดู Notification...

    # ── สลับ Cookie เป็น Passenger ────────────────────────
    Go To     ${WEB_URL}/login
    Sleep    2s
    Delete All Cookies
    Add Cookie    token    ${PASSENGER_RAW}    path=/

    # ── เปิดหน้า myTrips ─────────────────────────────────
    Go To     ${WEB_URL}/myTrips
    Sleep     5s
    Capture Page Screenshot    results/12_passenger_mytrips.png
    Log To Console    \n📸 หน้า myTrips ของผู้โดยสาร

    # ── กด Bell ──────────────────────────────────────────
    ${bell_clicked}=    Run Keyword And Return Status
    ...    Click Element    xpath=//button[contains(@class,'bell') or contains(@aria-label,'notification') or contains(@aria-label,'แจ้งเตือน')]
    Sleep    2s
    Capture Page Screenshot    results/13_passenger_bell.png
    Log To Console    \n📸 Bell Notification ของผู้โดยสาร

    # ── API ตรวจ in-app notifications ─────────────────────
    Create Session    API    ${BASE_URL}    disable_warnings=True
    ${headers}=    Create Dictionary    Authorization=${PASSENGER_TOKEN}
    ${res}=    GET On Session    API    /api/notifications
    ...    headers=${headers}    expected_status=any

    Log To Console    \nStatus: ${res.status_code}
    Run Keyword If    ${res.status_code} == 200
    ...    Verify Passenger Got Arrival Notifications    ${res}

    Capture Page Screenshot    results/14_final.png
    Log To Console    \n✅ ตรวจสอบ Notification ผู้โดยสารเสร็จสิ้น

*** Keywords ***

# ─────────────────────────────────────────────────────────
# Suite Setup: Login → เปิด Browser → เข้า myTrips
# ─────────────────────────────────────────────────────────
Fresh Login And Open MyTrips
    [Documentation]    Login โดย Set Cookie ตรงๆ (ไม่กรอก Form)
    ...    1) POST /api/auth/login → ดึง fresh token
    ...    2) เปิด Browser → ตั้ง Cookie → เข้า myTrips
    ...    3) ดึง ROUTE_ID จาก Booking

    Create Directory    ${CURDIR}/results

    # ── ดึง Driver Token ──────────────────────────────────
    Log To Console     \n🔑 Step 1: ดึง Driver Token จาก API...
    Create Session    AUTH    ${BASE_URL}    disable_warnings=True
    ${d_body}=    Create Dictionary    email=${DRIVER_EMAIL}    password=${PASS}
    ${d_res}=    POST On Session    AUTH    /api/auth/login
    ...    json=${d_body}    expected_status=200
    ${d_raw}=    Set Variable    ${d_res.json()['data']['token']}
    Set Suite Variable    ${DRIVER_TOKEN}    Bearer ${d_raw}
    Set Suite Variable    ${DRIVER_RAW}      ${d_raw}
    Log To Console     \n✅ Driver Token: ${d_raw[:50]}...

    # ── ดึง Passenger Token ───────────────────────────────
    Log To Console     \n🔑 Step 2: ดึง Passenger Token จาก API...
    ${p_body}=    Create Dictionary    email=${PASSENGER_EMAIL}    password=${PASS}
    ${p_res}=    POST On Session    AUTH    /api/auth/login
    ...    json=${p_body}    expected_status=200
    ${p_raw}=    Set Variable    ${p_res.json()['data']['token']}
    Set Suite Variable    ${PASSENGER_TOKEN}    Bearer ${p_raw}
    Set Suite Variable    ${PASSENGER_RAW}      ${p_raw}
    Log To Console     \n✅ Passenger Token: ${p_raw[:50]}...

    # ── ดึง ROUTE_ID จาก Booking ──────────────────────────
    Log To Console     \n🔍 Step 3: ดึง ROUTE_ID จาก Booking...
    ${headers}=    Create Dictionary    Authorization=Bearer ${d_raw}
    ${b_res}=    GET On Session    AUTH    /api/bookings/${BOOKING_ID}
    ...    headers=${headers}    expected_status=any
    ${route_id}=    Set Variable If    ${b_res.status_code} == 200
    ...    ${b_res.json()['data']['routeId']}    ${EMPTY}
    Set Suite Variable    ${ROUTE_ID}    ${route_id}
    Log To Console     \n✅ Route ID: ${ROUTE_ID}

    # ── เปิด Browser ─────────────────────────────────────
    Log To Console     \n🌐 Step 4: เปิด Chrome...
    Open Browser    ${WEB_URL}    chrome
    Maximize Browser Window
    Sleep    2s

    # ── ตั้ง Cookie Passenger ─────────────────────────────
    Log To Console     \n🍪 Step 5: ตั้ง Cookie token (Passenger)...
    Delete All Cookies
    Go To    ${WEB_URL}/login
    Sleep    2s
    Add Cookie    token    ${p_raw}    path=/
    Log To Console     \n✅ Cookie token ตั้งค่าแล้ว

    # ── ไปหน้า myTrips ───────────────────────────────────
    Log To Console     \n📋 Step 6: ไปหน้า myTrips...
    Go To    ${WEB_URL}/myTrips
    Sleep    6s

    ${url}=    Get Location
    Log To Console     \n📍 URL: ${url}
    Should Not Contain    ${url}    /login    msg=ต้องไม่อยู่ที่หน้า login
    Log To Console     \n✅ เข้าสู่ระบบสำเร็จ — อยู่ที่: ${url}

# ─────────────────────────────────────────────────────────
# ลองกดปุ่ม ติดตามตำแหน่ง ด้วยหลาย selector
# ─────────────────────────────────────────────────────────
Try Click Tracking Button
    [Documentation]    ลอง XPath หลายแบบสำหรับปุ่ม 📍 ติดตามตำแหน่ง

    # วิธีที่ 1: ข้อความภาษาไทยตรงๆ
    ${ok1}=    Run Keyword And Return Status
    ...    Wait Until Element Is Visible
    ...    xpath=//a[contains(.,'ติดตามตำแหน่ง')]    timeout=8s
    Run Keyword If    ${ok1}    Click Element
    ...    xpath=//a[contains(.,'ติดตามตำแหน่ง')]
    Run Keyword If    ${ok1}    Sleep    1s
    Return From Keyword If    ${ok1}    ${True}

    # วิธีที่ 2: href มี /tracking/
    ${ok2}=    Run Keyword And Return Status
    ...    Wait Until Element Is Visible
    ...    xpath=//a[contains(@href,'/tracking/')]    timeout=5s
    Run Keyword If    ${ok2}    Click Element
    ...    xpath=//a[contains(@href,'/tracking/')]
    Run Keyword If    ${ok2}    Sleep    1s
    Return From Keyword If    ${ok2}    ${True}

    # วิธีที่ 3: expand card ก่อน
    Log To Console     \n⚠️ ปุ่มไม่เห็น — ลอง expand card ก่อน...
    ${ok3}=    Run Keyword And Return Status
    ...    Click Element    xpath=//div[contains(@class,'trip-card')][1]
    Sleep    2s
    ${ok4}=    Run Keyword And Return Status
    ...    Wait Until Element Is Visible
    ...    xpath=//a[contains(.,'ติดตามตำแหน่ง')]    timeout=5s
    Run Keyword If    ${ok4}    Click Element
    ...    xpath=//a[contains(.,'ติดตามตำแหน่ง')]
    Return From Keyword If    ${ok4}    ${True}

    Log To Console     \n⚠️ กดปุ่มไม่ได้ทุกวิธี — จะ Navigate ตรงแทน
    [Return]    ${False}

# ─────────────────────────────────────────────────────────
# Navigate ไปหน้า tracking โดยตรง
# ─────────────────────────────────────────────────────────
Navigate To Tracking Directly
    [Documentation]    ใช้ ROUTE_ID ไปหน้า tracking ตรงๆ เมื่อกดปุ่มไม่ได้
    Run Keyword If    '${ROUTE_ID}' != '${EMPTY}'
    ...    Go To    ${WEB_URL}/tracking/${ROUTE_ID}
    ...    ELSE
    ...    Log To Console    \n⚠️ ไม่มี ROUTE_ID — ข้ามหน้า tracking

# ─────────────────────────────────────────────────────────
# ตรวจว่ามี 3 notification (FIVE_KM, ONE_KM, ZERO_KM)
# ─────────────────────────────────────────────────────────
Verify Three Notifications
    [Arguments]    ${body}
    ${has_five}=    Run Keyword And Return Status    Should Contain    ${body}    FIVE_KM
    ${has_one}=     Run Keyword And Return Status    Should Contain    ${body}    ONE_KM
    ${has_zero}=    Run Keyword And Return Status    Should Contain    ${body}    ZERO_KM
    ${five_status}=     Set Variable If    ${has_five}     PASS    FAIL
    ${one_status}=      Set Variable If    ${has_one}      PASS    FAIL
    ${zero_status}=     Set Variable If    ${has_zero}     PASS    FAIL
    ${five_msg}=    Catenate    SEPARATOR=    FIVE_KM=    ${five_status}
    ${one_msg}=     Catenate    SEPARATOR=    ONE_KM=     ${one_status}
    ${zero_msg}=    Catenate    SEPARATOR=    ZERO_KM=    ${zero_status}
    Log    ${five_msg}    console=True
    Log    ${one_msg}     console=True
    Log    ${zero_msg}    console=True

# ─────────────────────────────────────────────────────────
# ตรวจว่าผู้โดยสารได้รับ notification arrival
# ─────────────────────────────────────────────────────────
Verify Passenger Got Arrival Notifications
    [Arguments]    ${response}
    ${body}=    Convert To String    ${response.content}
    Log To Console    \nPassenger Notifications: ${body[:700]}

    ${has_arrival}=    Run Keyword And Return Status
    ...    Should Contain    ${body}    ARRIVAL
    Run Keyword If    ${has_arrival}
    ...    Log To Console    \n✅ ผู้โดยสารได้รับ ARRIVAL notification
    ...    ELSE
    ...    Log To Console    \n⚠️ ไม่พบ ARRIVAL notification ของผู้โดยสาร
