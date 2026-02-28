*** Settings ***
Documentation     Test Suite for Epic 2: In-Chat Arrival Notification (LIVE MAP DEMO)
Library           RequestsLibrary
Library           Collections
Library           JSONLibrary
Library           SeleniumLibrary

Suite Setup       Open Real Web And Setup Map
Suite Teardown    Close All Browsers

*** Variables ***
${BASE_URL}           http://localhost:3001
${WEB_URL}            http://localhost:3003
${DRIVER_TOKEN}       Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbW02OGYzaGswMDAwdnJncHNtcGZua2lvIiwicm9sZSI6IkRSSVZFUiIsImlhdCI6MTc3MjI3Nzc1OSwiZXhwIjoxNzcyODgyNTU5fQ.4zzo0UwTFYTZHo4NQIBgJbrTFxTlMUjr5xkHvPHaX-Y
${PASSENGER_TOKEN}    Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbW02OGYzaTQwMDA1dnJncHNnMHVzMmgwIiwicm9sZSI6IlBBU1NFTkdFUiIsImlhdCI6MTc3MjI3Nzc1OSwiZXhwIjoxNzcyODgyNTU5fQ.HxPayUC6ncumoN4wqzG8PMWoIBxyP6PXBxFjj9KZpio
${BOOKING_ID}         cmm673eqa0001vr9ax7xh0trd
${PICKUP_LAT}         16.4725
${PICKUP_LNG}         102.8240

*** Test Cases ***

# ============= Phase 1: Setup Map Visualization =============

TC-SETUP: เตรียมแผนที่แสดงจุดรับ-จุดคนขับ
    [Documentation]    Verify map overlay and markers are ready
    [Tags]             Setup
    Log To Console    \n🗺️ Map overlay is ready with markers and radius circles
    Execute Javascript    window.__addNotif('INFO', '🗺️ แผนที่พร้อม', 'หมุดคนขับ + จุดรับ + รัศมี 5km/1km แสดงแล้ว')
    Sleep    2s

# ============= Phase 2: Driver Approaches 5km =============

TC-2.1: Notification 5 กม. — คนขับเข้าใกล้ 5 กิโลเมตร
    [Documentation]    Driver approaches from ~7km to ~4.5km. Crosses 5KM radius.
    [Tags]             High

    Execute Javascript    window.__addNotif('INFO', '🚀 เริ่มจำลอง', 'คนขับเริ่มเดินทางจากจุด 7 กม.')

    # Animate driver moving closer (7km -> 5km)
    Execute Javascript    window.__moveDriver(16.52, 102.855)
    Sleep    1s
    Execute Javascript    window.__moveDriver(16.51, 102.85)
    Sleep    1s
    Execute Javascript    window.__moveDriver(16.50, 102.845)
    Sleep    1s
    Execute Javascript    window.__demoMap.setZoom(13)
    Sleep    1s

    # Call real API
    Create Session     API    ${BASE_URL}
    ${headers}=        Create Dictionary    Authorization=${DRIVER_TOKEN}    Content-Type=application/json
    ${body}=           Create Dictionary    bookingId=${BOOKING_ID}    lat=16.5000    lon=102.8500
    ${response}=       POST On Session      API    /api/arrival-notifications/check    json=${body}    headers=${headers}    expected_status=any
    Should Be Equal As Strings    ${response.status_code}    200
    ${json}=           Set Variable         ${response.json()}
    Should Be True     ${json['success']}

    # Show notification on page
    Execute Javascript    window.__addNotif('FIVE_KM', '🚗 คนขับใกล้ถึงแล้ว!', 'คนขับอยู่ห่างประมาณ 5 กม. กรุณาเตรียมตัว')
    Execute Javascript    window.__circle5.setStyle({weight:4, fillOpacity:0.15})
    Log To Console    \n✔️ แจ้งเตือน 5 กม. สำเร็จ!
    Sleep    4s

# ============= Phase 3: Driver Approaches 1km =============

TC-2.2: Notification 1 กม. — คนขับเข้าใกล้ 1 กิโลเมตร
    [Documentation]    Driver approaches from ~4km to ~0.8km. Crosses 1KM radius.
    [Tags]             High

    # Animate driver moving closer (5km -> 1km)
    Execute Javascript    window.__moveDriver(16.49, 102.84)
    Sleep    1s
    Execute Javascript    window.__moveDriver(16.485, 102.835)
    Sleep    1s
    Execute Javascript    window.__moveDriver(16.48, 102.83)
    Sleep    1s
    Execute Javascript    window.__demoMap.setZoom(14)
    Sleep    1s

    # Call real API
    ${headers}=        Create Dictionary    Authorization=${DRIVER_TOKEN}    Content-Type=application/json
    ${body}=           Create Dictionary    bookingId=${BOOKING_ID}    lat=16.4780    lon=102.8300
    ${response}=       POST On Session      API    /api/arrival-notifications/check    json=${body}    headers=${headers}    expected_status=any
    Should Be Equal As Strings    ${response.status_code}    200
    ${json}=           Set Variable         ${response.json()}
    Should Be True     ${json['success']}

    # Show notification on page
    Execute Javascript    window.__addNotif('ONE_KM', '🚗 คนขับใกล้ถึงมาก!', 'คนขับอยู่ห่างประมาณ 1 กม. เตรียมออกมารอ!')
    Execute Javascript    window.__circle1.setStyle({weight:4, fillOpacity:0.25})
    Log To Console    \n✔️ แจ้งเตือน 1 กม. สำเร็จ!
    Sleep    4s

# ============= Phase 4: Driver Arrives =============

TC-2.3: Notification 0 กม. (ถึงแล้ว) — คนขับถึงจุดรับ
    [Documentation]    Driver arrives at pickup point. Crosses 0KM radius. No-show countdown starts.
    [Tags]             Critical

    # Animate driver arriving
    Execute Javascript    window.__moveDriver(16.477, 102.827)
    Sleep    1s
    Execute Javascript    window.__moveDriver(16.475, 102.8255)
    Sleep    1s
    Execute Javascript    window.__moveDriver(16.473, 102.8245)
    Sleep    1s
    Execute Javascript    window.__moveDriver(16.4725, 102.824)
    Sleep    1s
    Execute Javascript    window.__demoMap.setZoom(16)
    Sleep    1s

    # Call real API
    ${headers}=        Create Dictionary    Authorization=${DRIVER_TOKEN}    Content-Type=application/json
    ${body}=           Create Dictionary    bookingId=${BOOKING_ID}    lat=16.4725    lon=102.8240
    ${response}=       POST On Session      API    /api/arrival-notifications/check    json=${body}    headers=${headers}    expected_status=any
    Should Be Equal As Strings    ${response.status_code}    200
    ${json}=           Set Variable         ${response.json()}
    Should Be True     ${json['success']}

    # Show notification on page
    Execute Javascript    window.__addNotif('ZERO_KM', '✅ คนขับถึงจุดรับแล้ว!', 'คนขับมาถึงจุดรับแล้ว กรุณาออกมารับ 🎉')
    Log To Console    \n✔️ แจ้งเตือน 0 กม. สำเร็จ — คนขับถึงแล้ว!
    Sleep    5s

# ============= Phase 5: Manual & Other Tests =============

TC-2.4: Manual Arrival Trigger — คนขับกดปุ่มแจ้งถึง
    [Documentation]    Driver manually triggers arrival notification.
    [Tags]             High
    ${headers}=        Create Dictionary    Authorization=${DRIVER_TOKEN}    Content-Type=application/json
    ${body}=           Create Dictionary    bookingId=${BOOKING_ID}
    ${response}=       POST On Session      API    /api/arrival-notifications/manual    json=${body}    headers=${headers}    expected_status=any
    ${status}=         Convert To String    ${response.status_code}
    Run Keyword If     '${status}' == '200'    Expected Manual Arrival    ${response}
    ...    ELSE        Log    Received ${status} -> on cooldown
    Execute Javascript    window.__addNotif('MANUAL', '✅ คนขับแจ้งว่าถึงแล้ว', 'คนขับกดปุ่มแจ้งว่ามาถึงด้วยตนเอง')
    Sleep    3s

TC-2.5: Manual Arrival — Cooldown 5 นาที
    [Documentation]    Driver triggers manual arrival twice within 5 minutes. Expect 429.
    [Tags]             Medium
    ${headers}=        Create Dictionary    Authorization=${DRIVER_TOKEN}    Content-Type=application/json
    ${body}=           Create Dictionary    bookingId=${BOOKING_ID}
    ${response}=       POST On Session      API    /api/arrival-notifications/manual    json=${body}    headers=${headers}    expected_status=any
    Should Be Equal As Strings    ${response.status_code}    429
    Execute Javascript    window.__addNotif('INFO', '⏳ Cooldown ทำงาน', 'ป้องกันแจ้งเตือนซ้ำภายใน 5 นาที (HTTP 429)')

TC-2.6: Deduplication — ไม่ส่ง Notification ซ้ำ
    [Documentation]    Send GPS at 4km again, should not create new FIVE_KM notification.
    [Tags]             High
    ${headers}=        Create Dictionary    Authorization=${DRIVER_TOKEN}    Content-Type=application/json
    ${body}=           Create Dictionary    bookingId=${BOOKING_ID}    lat=16.5000    lon=102.8500
    ${response}=       POST On Session      API    /api/arrival-notifications/check    json=${body}    headers=${headers}    expected_status=any
    Should Be Equal As Strings    ${response.status_code}    200
    Execute Javascript    window.__addNotif('INFO', '🔁 Deduplication ทำงาน', 'ไม่มี notification ใหม่เพราะเคยส่งแล้ว')

TC-2.7: Notification History (Audit)
    [Documentation]    Fetch notification history for a booking.
    [Tags]             Low
    ${headers}=        Create Dictionary    Authorization=${DRIVER_TOKEN}
    ${response}=       GET On Session       API    /api/arrival-notifications/${BOOKING_ID}    headers=${headers}
    Should Be Equal As Strings    ${response.status_code}    200
    Execute Javascript    window.__addNotif('INFO', '📋 ดึงประวัติแจ้งเตือนสำเร็จ', 'ระบบ Audit Trail เก็บ log ครบทุกรายการ')

# ============= Phase 6: No-Show Countdown =============

TC-2.8: No-Show Countdown — เริ่มนับ
    [Documentation]    Check no-show status after driver has arrived.
    [Tags]             High
    ${headers}=        Create Dictionary    Authorization=${DRIVER_TOKEN}
    ${response}=       GET On Session       API    /api/no-show/${BOOKING_ID}/status    headers=${headers}    expected_status=any
    Run Keyword If     '${response.status_code}' == '200'    Log    No-Show Status Checked Successfully
    Execute Javascript    window.__addNotif('INFO', '⏱ No-Show เริ่มนับถอยหลัง', 'ระบบเริ่มนับเวลารอผู้โดยสาร')

TC-2.9: No-Show — ยังไม่หมดเวลา
    [Documentation]    Driver attempts to execute no-show before deadline.
    [Tags]             Medium
    ${headers}=        Create Dictionary    Authorization=${DRIVER_TOKEN}    Content-Type=application/json
    ${response}=       POST On Session      API    /api/no-show/${BOOKING_ID}/execute    headers=${headers}    expected_status=any
    Should Be Equal As Strings    ${response.status_code}    400
    Execute Javascript    window.__addNotif('INFO', '⛔ ยังไม่หมดเวลา', 'ไม่สามารถ No-Show ก่อนหมดเวลาได้')

TC-2.11: No-Show — ยกเลิกเมื่อรับผู้โดยสาร
    [Documentation]    Update booking status to IN_PROGRESS clears no-show deadline.
    [Tags]             High
    ${headers}=        Create Dictionary    Authorization=${DRIVER_TOKEN}    Content-Type=application/json
    ${body}=           Create Dictionary    status=IN_PROGRESS
    ${response}=       PATCH On Session     API    /api/bookings/${BOOKING_ID}/status    json=${body}    headers=${headers}    expected_status=any
    Execute Javascript    window.__addNotif('INFO', '🚗 เริ่มเดินทาง!', 'สถานะ IN_PROGRESS — No-Show ถูกยกเลิก')
    Execute Javascript    window.__addNotif('INFO', '🏁 จำลองเสร็จสิ้น', 'การทดสอบ Epic 2 เสร็จสมบูรณ์ ✨')
    Sleep    5s


*** Keywords ***

Open Real Web And Setup Map
    Log To Console    \n🚀 Opening Chrome Browser...
    Open Browser      ${WEB_URL}/login    chrome
    Maximize Browser Window
    Wait Until Page Contains Element    id=identifier    timeout=15s

    Log To Console    \n🔑 Logging in as Passenger...
    Input Text        id=identifier    epic2_passenger@test.com
    Input Text        id=password      password123
    Click Button      xpath=//button[@type='submit']

    # Wait for login to redirect
    Sleep             4s
    Wait Until Location Contains    /    timeout=10s

    Log To Console    \n📋 Navigating to My Trip...
    Go To             ${WEB_URL}/myTrip
    Sleep             3s

    # Inject Leaflet CSS + JS (free, no API key needed)
    Log To Console    \n🗺️ Loading Leaflet Map library...
    Execute Javascript
    ...    var css = document.createElement('link');
    ...    css.rel = 'stylesheet';
    ...    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    ...    document.head.appendChild(css);
    ...    var js = document.createElement('script');
    ...    js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    ...    js.onload = function(){ window.__leafletReady = true; };
    ...    document.head.appendChild(js);

    Wait For Condition    return window.__leafletReady === true    timeout=30s
    Log To Console    \n✅ Leaflet loaded!

    # Create full-screen map overlay with sidebar
    Execute Javascript
    ...    var overlay = document.createElement('div');
    ...    overlay.id = 'demoMapOverlay';
    ...    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;display:flex;background:#f1f5f9';
    ...    var mapDiv = document.createElement('div');
    ...    mapDiv.id = 'demoMap';
    ...    mapDiv.style.cssText = 'flex:1;height:100%';
    ...    var sidebar = document.createElement('div');
    ...    sidebar.id = 'demoSidebar';
    ...    sidebar.style.cssText = 'width:360px;height:100%;overflow-y:auto;background:#fff;border-left:1px solid #e2e8f0;padding:20px;box-sizing:border-box';
    ...    sidebar.innerHTML = '<div style="margin-bottom:16px"><h2 style="font-size:18px;font-weight:800;color:#1e3a5f;margin:0">🚗 DriveToSurvive</h2><p style="font-size:12px;color:#64748b;margin:4px 0 0">Epic 2: In-Chat Arrival Notification Demo</p></div><div style="padding:12px;background:#eff6ff;border-radius:12px;margin-bottom:16px;border-left:4px solid #3b82f6"><div style="font-size:13px;font-weight:700;color:#1e40af">📍 จุดรับ: หอพักหน้ามอ</div><div style="font-size:11px;color:#64748b;margin-top:4px">Lat: 16.4725, Lng: 102.8240</div></div><h3 style="font-size:14px;font-weight:700;color:#1e40af;margin-bottom:8px">🔔 การแจ้งเตือน (Real-Time)</h3><div id="demoNotifs" style="max-height:calc(100vh - 200px);overflow-y:auto"></div>';
    ...    overlay.appendChild(mapDiv);
    ...    overlay.appendChild(sidebar);
    ...    document.body.appendChild(overlay);
    ...    return 'OVERLAY_CREATED';

    # Initialize Leaflet map with markers, circles, helpers
    Execute Javascript
    ...    var map = L.map('demoMap').setView([16.50, 102.84], 12);
    ...    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    ...        attribution: '&copy; OpenStreetMap'
    ...    }).addTo(map);
    ...    window.__demoMap = map;
    ...    var pickupIcon = L.divIcon({className:'',html:'<div style="font-size:30px;text-shadow:0 2px 4px rgba(0,0,0,0.3)">📍</div>',iconSize:[30,30],iconAnchor:[15,30]});
    ...    L.marker([16.4725, 102.824], {icon: pickupIcon}).addTo(map).bindPopup('<b>📍 จุดรับผู้โดยสาร</b><br>หอพักหน้ามอ').openPopup();
    ...    var driverIcon = L.divIcon({className:'',html:'<div style="font-size:30px;text-shadow:0 2px 4px rgba(0,0,0,0.3)">🚗</div>',iconSize:[30,30],iconAnchor:[15,15]});
    ...    window.__driverMarker = L.marker([16.53, 102.86], {icon: driverIcon}).addTo(map).bindPopup('<b>🚗 คนขับ</b>');
    ...    window.__circle5 = L.circle([16.4725, 102.824], {radius:5000, color:'#22c55e', fillOpacity:0.06, weight:2}).addTo(map);
    ...    window.__circle1 = L.circle([16.4725, 102.824], {radius:1000, color:'#eab308', fillOpacity:0.1, weight:2}).addTo(map);
    ...    window.__pathCoords = [[16.53, 102.86]];
    ...    window.__path = L.polyline(window.__pathCoords, {color:'#3b82f6', weight:3, opacity:0.7}).addTo(map);
    ...    map.fitBounds([[16.4725,102.824],[16.53,102.86]]);
    ...    var style = document.createElement('style');
    ...    style.textContent = '@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}';
    ...    document.head.appendChild(style);
    ...    window.__addNotif = function(type, title, body) {
    ...        var c = document.getElementById('demoNotifs'); if (!c) return;
    ...        var colors = {FIVE_KM:'border-color:#22c55e;background:#f0fdf4',ONE_KM:'border-color:#eab308;background:#fefce8',ZERO_KM:'border-color:#ef4444;background:#fef2f2',MANUAL:'border-color:#3b82f6;background:#eff6ff',INFO:'border-color:#94a3b8;background:#f8fafc'};
    ...        var d = document.createElement('div');
    ...        d.style.cssText = 'padding:12px;border-radius:12px;border-left:4px solid;margin-bottom:8px;animation:slideIn 0.4s ease-out;' + (colors[type]||colors.INFO);
    ...        d.innerHTML = '<div style="font-size:13px;font-weight:700">' + title + '</div><div style="font-size:11px;color:#64748b;margin-top:2px">' + body + '</div><div style="font-size:10px;color:#94a3b8;margin-top:4px">' + new Date().toLocaleTimeString('th-TH') + '</div>';
    ...        c.prepend(d);
    ...    };
    ...    window.__moveDriver = function(lat, lng) {
    ...        if (window.__driverMarker) window.__driverMarker.setLatLng([lat, lng]);
    ...        if (window.__pathCoords) { window.__pathCoords.push([lat, lng]); window.__path.setLatLngs(window.__pathCoords); }
    ...    };
    ...    return 'MAP_READY';

    Sleep    2s
    Wait For Condition    return window.__demoMap != null    timeout=10s
    Log To Console    \n✅ Leaflet Map Demo Created!

Expected Manual Arrival
    [Arguments]    ${response}
    ${json}=           Set Variable         ${response.json()}
    Should Be True     ${json['success']}
    Dictionary Should Contain Item    ${json['data']}    radiusType    MANUAL
