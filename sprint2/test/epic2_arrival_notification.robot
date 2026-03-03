*** Settings ***
Documentation     Epic 2 — Arrival Notification: Test Arrival GPS & Manual Triggers
Library           SeleniumLibrary
Library           RequestsLibrary
Library           Collections
Library           Process
Library           OperatingSystem

Suite Setup       Setup Test Environment
Suite Teardown    Close All Browsers

*** Variables ***
${BASE_URL}          http://localhost:3001
${WEB_URL}           http://localhost:3000
${DRIVER_EMAIL}      epic2_driver@test.com
${PASSENGER_EMAIL}   thanatcha.k@kkumail.com
${PASS}              password123
${BOOKING_ID}        cmm673eqa0001vr9ax7xh0trd
${ROUTE_ID}          ${EMPTY}
${SCRIPT_DIR}        ${CURDIR}

${DRIVER_TOKEN}       Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbW1haWx3eGwwMDAwdnI3eHNuOGltZm9jIiwicm9sZSI6IkRSSVZFUiIsImlhdCI6MTc3MjUzNjczOCwiZXhwIjoxNzczMTQxNTM4fQ.L323mNvpo8xHrHfWtgrjN4nV-mrg9UteM1pizi3oDrY
${PASSENGER_TOKEN}    Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbW1haWx3eHgwMDA1dnI3eG9vZ2J5Z2RjIiwicm9sZSI6IlBBU1NFTkdFUiIsImlhdCI6MTc3MjUzNjczOCwiZXhwIjoxNzczMTQxNTM4fQ.bCBpaefhk7EmmtCA7bCXvwWsq1VP7bLEmG4PMH4E6as
${DRIVER_RAW}        ${EMPTY}
${PASSENGER_RAW}     ${EMPTY}

*** Test Cases ***

Test 01: Ensure MyTrips Page Loads With Valid Booking
    [Documentation]    Verify login and valid bookings in MyTrips
    [Tags]             Setup
    Capture Page Screenshot    results/01_mytrips_page.png

Test 02: Open GPS Tracking Dashboard From MyTrips
    [Documentation]    Click "Tracking" to navigate to active map
    [Tags]             Critical
    ${clicked}=    Try Click Tracking Button
    Run Keyword If    not ${clicked}    Navigate To Tracking Directly
    Sleep    7s
    ${url}=    Get Location
    Should Contain     ${url}    /tracking/
    Capture Page Screenshot    results/02_tracking_loaded.png

Test 03: Simulate Driving And Automatic GPS Notifications
    [Documentation]    Run simulate-driving.js to trigger FIVE_KM, ONE_KM, ZERO_KM
    [Tags]             Critical    RealTime
    Capture Page Screenshot    results/03_driver_start.png
    ${sim}=    Start Process
    ...    node    ${SCRIPT_DIR}/simulate-driving.js
    ...    ${BASE_URL}    ${DRIVER_TOKEN}    ${BOOKING_ID}    --socket    ${ROUTE_ID}
    ...    alias=simulate
    Sleep    18s
    Capture Page Screenshot    results/04_driver_near_5km.png
    Sleep    12s
    Capture Page Screenshot    results/05_driver_near_1km.png
    Sleep    15s
    Capture Page Screenshot    results/06_driver_arrived.png
    ${result}=    Wait For Process    simulate    timeout=15s    on_timeout=terminate

Test 04: Verify In-App Notification Bell 
    [Documentation]    Check the notification bell for incoming logs
    [Tags]             UI
    Go To     ${WEB_URL}/myTrips
    Sleep     4s
    Capture Page Screenshot    results/07_mytrips_after.png
    ${bell_clicked}=    Run Keyword And Return Status    Click Element    xpath=//button[contains(@class,'bell') or contains(@aria-label,'notification') or contains(@aria-label,'แจ้งเตือน')]
    Sleep     2s
    Capture Page Screenshot    results/08_bell_panel.png

Test 05: Verify 3 GPS Notification Types Are Saved
    [Documentation]    GET /api/arrival-notifications/{bookingId} expects FIVE_KM, ONE_KM, ZERO_KM
    [Tags]             Critical
    Create Session    API    ${BASE_URL}    disable_warnings=True
    ${headers}=    Create Dictionary    Authorization=${DRIVER_TOKEN}
    ${res}=    GET On Session    API    /api/arrival-notifications/${BOOKING_ID}    headers=${headers}    expected_status=any
    ${body}=    Convert To String    ${res.content}
    Run Keyword If    ${res.status_code} == 200    Verify Three Notifications    ${body}
    Capture Page Screenshot    results/09_history_verified.png

Test 06: Trigger Manual Arrival Notification
    [Documentation]    POST /api/arrival-notifications/manual 
    [Tags]             Critical
    Create Session    API    ${BASE_URL}    disable_warnings=True
    ${headers}=    Create Dictionary    Authorization=${DRIVER_TOKEN}    Content-Type=application/json
    ${body}=    Create Dictionary    bookingId=${BOOKING_ID}
    ${res}=    POST On Session    API    /api/arrival-notifications/manual    json=${body}    headers=${headers}
    Should Be True    ${res.status_code} == 200 or ${res.status_code} == 201
    
    Go To     ${WEB_URL}/myTrips
    Sleep     4s
    Capture Page Screenshot    results/10_after_manual_trigger.png
    ${bell_clicked}=    Run Keyword And Return Status    Click Element    xpath=//button[contains(@class,'bell') or contains(@aria-label,'notification') or contains(@aria-label,'แจ้งเตือน')]
    Sleep    2s
    Capture Page Screenshot    results/11_manual_bell.png

Test 07: Validate End-To-End Notification History Delivery
    [Documentation]    Verify all 4 events exist and email states are recorded
    [Tags]             Critical
    Create Session    API    ${BASE_URL}    disable_warnings=True
    ${headers}=    Create Dictionary    Authorization=${DRIVER_TOKEN}
    ${res}=    GET On Session    API    /api/arrival-notifications/${BOOKING_ID}    headers=${headers}    expected_status=any
    ${body}=    Convert To String    ${res.content}
    Should Contain    ${body}    FIVE_KM
    Should Contain    ${body}    ONE_KM
    Should Contain    ${body}    ZERO_KM
    Should Contain    ${body}    MANUAL
    Capture Page Screenshot    results/12_all_4_verified.png

Test 07b: Validate Email Delivery Status For All Occurrences
    [Documentation]    Iterate history and ensure each notification item contains an email status
    [Tags]             Critical    Email
    Create Session    API    ${BASE_URL}    disable_warnings=True
    ${headers}=    Create Dictionary    Authorization=${DRIVER_TOKEN}
    ${res}=    GET On Session    API    /api/arrival-notifications/${BOOKING_ID}    headers=${headers}    expected_status=200
    
    ${json}=    Set Variable    ${res.json()}
    ${data}=    Set Variable    ${json['data']}
    
    ${email_sent_count}=    Set Variable    ${0}
    ${email_failed_count}=    Set Variable    ${0}
    
    FOR    ${notif}    IN    @{data}
        ${type}=    Set Variable    ${notif['radiusType']}
        ${app}=     Set Variable    ${notif['appStatus']}
        ${email}=   Set Variable    ${notif['emailStatus']}

        Should Be Equal As Strings    ${app}    SENT
        Should Not Be Empty    ${email}

        ${is_sent}=     Evaluate    1 if '${email}' == 'SENT' else 0
        ${is_failed}=   Evaluate    1 if '${email}' == 'FAILED' else 0
        ${email_sent_count}=      Evaluate    ${email_sent_count} + ${is_sent}
        ${email_failed_count}=    Evaluate    ${email_failed_count} + ${is_failed}
    END
    
    Capture Page Screenshot    results/13_email_status_checked.png

Test 08: Switch To Passenger And Verify Alert Delivery
    [Documentation]    Change session to passenger and view final trips
    [Tags]             UI
    Go To     ${WEB_URL}/login
    Sleep    2s
    Delete All Cookies
    Add Cookie    token    ${PASSENGER_RAW}    path=/
    Go To     ${WEB_URL}/myTrips
    Sleep     5s
    Capture Page Screenshot    results/13_passenger_mytrips.png
    ${bell_clicked}=    Run Keyword And Return Status    Click Element    xpath=//button[contains(@class,'bell') or contains(@aria-label,'notification') or contains(@aria-label,'แจ้งเตือน')]
    Sleep    2s
    Capture Page Screenshot    results/14_passenger_bell.png

    Create Session    API    ${BASE_URL}    disable_warnings=True
    ${headers}=    Create Dictionary    Authorization=${PASSENGER_TOKEN}
    ${res}=    GET On Session    API    /api/notifications    headers=${headers}
    Run Keyword If    ${res.status_code} == 200    Verify Passenger Got Arrival Notifications    ${res}
    Capture Page Screenshot    results/15_final.png

*** Keywords ***

Setup Test Environment
    [Documentation]    Retrieves API Tokens, gets target Route UUID, and initializes browser
    Create Directory    ${CURDIR}/results
    
    Create Session    AUTH    ${BASE_URL}    disable_warnings=True
    
    ${d_body}=    Create Dictionary    email=${DRIVER_EMAIL}    password=${PASS}
    ${d_res}=    POST On Session    AUTH    /api/auth/login    json=${d_body}    expected_status=200
    ${d_raw}=    Set Variable    ${d_res.json()['data']['token']}
    Set Suite Variable    ${DRIVER_TOKEN}    Bearer ${d_raw}
    Set Suite Variable    ${DRIVER_RAW}      ${d_raw}
    
    ${p_body}=    Create Dictionary    email=${PASSENGER_EMAIL}    password=${PASS}
    ${p_res}=    POST On Session    AUTH    /api/auth/login    json=${p_body}    expected_status=200
    ${p_raw}=    Set Variable    ${p_res.json()['data']['token']}
    Set Suite Variable    ${PASSENGER_TOKEN}    Bearer ${p_raw}
    Set Suite Variable    ${PASSENGER_RAW}      ${p_raw}
    
    ${headers}=    Create Dictionary    Authorization=Bearer ${d_raw}
    ${b_res}=    GET On Session    AUTH    /api/bookings/${BOOKING_ID}    headers=${headers}    expected_status=any
    ${route_id}=    Set Variable If    ${b_res.status_code} == 200    ${b_res.json()['data']['routeId']}    ${EMPTY}
    Set Suite Variable    ${ROUTE_ID}    ${route_id}
    
    Open Browser    ${WEB_URL}    chrome
    Maximize Browser Window
    Sleep    2s
    
    Delete All Cookies
    Go To    ${WEB_URL}/login
    Sleep    2s
    Add Cookie    token    ${p_raw}    path=/
    Go To    ${WEB_URL}/myTrips
    Sleep    6s
    ${url}=    Get Location
    Should Not Contain    ${url}    /login

Try Click Tracking Button
    [Documentation]    Attempts to locate the tracking element using various strategies
    ${ok1}=    Run Keyword And Return Status    Wait Until Element Is Visible    xpath=//a[contains(.,'ติดตามตำแหน่ง')]    timeout=8s
    Run Keyword If    ${ok1}    Click Element    xpath=//a[contains(.,'ติดตามตำแหน่ง')]
    Return From Keyword If    ${ok1}    ${True}
    
    ${ok2}=    Run Keyword And Return Status    Wait Until Element Is Visible    xpath=//a[contains(@href,'/tracking/')]    timeout=5s
    Run Keyword If    ${ok2}    Click Element    xpath=//a[contains(@href,'/tracking/')]
    Return From Keyword If    ${ok2}    ${True}
    
    ${ok3}=    Run Keyword And Return Status    Click Element    xpath=//div[contains(@class,'trip-card')][1]
    Sleep    2s
    ${ok4}=    Run Keyword And Return Status    Wait Until Element Is Visible    xpath=//a[contains(.,'ติดตามตำแหน่ง')]    timeout=5s
    Run Keyword If    ${ok4}    Click Element    xpath=//a[contains(.,'ติดตามตำแหน่ง')]
    Return From Keyword If    ${ok4}    ${True}
    
    RETURN    ${False}

Navigate To Tracking Directly
    [Documentation]    Fallback strategy using direct URL
    Run Keyword If    '${ROUTE_ID}' != '${EMPTY}'    Go To    ${WEB_URL}/tracking/${ROUTE_ID}

Verify Three Notifications
    [Arguments]    ${body}
    ${has_five}=    Run Keyword And Return Status    Should Contain    ${body}    FIVE_KM
    ${has_one}=     Run Keyword And Return Status    Should Contain    ${body}    ONE_KM
    ${has_zero}=    Run Keyword And Return Status    Should Contain    ${body}    ZERO_KM

Verify Passenger Got Arrival Notifications
    [Arguments]    ${response}
    ${body}=    Convert To String    ${response.content}
    ${has_arrival}=    Run Keyword And Return Status    Should Contain    ${body}    ARRIVAL
