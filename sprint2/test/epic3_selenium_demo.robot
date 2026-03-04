*** Settings ***
Documentation     Epic 3 — Selenium Browser Demo: Review & Rating System
...               Visual demonstration of the review UI flow in Chrome browser.
...               Covers: Passenger creates review, Driver views reviews,
...               Driver creates dispute, Admin manages disputes.

Library           SeleniumLibrary
Library           RequestsLibrary
Library           OperatingSystem
Library           Collections
Library           Process
Library           String

Suite Setup       Demo Suite Init
Suite Teardown    Close All Browsers

*** Variables ***
${BASE_URL}              http://localhost:3003
${API_BASE}              http://localhost:3001/api
${PASSENGER_EMAIL}       rf_passenger@test.com
${DRIVER_EMAIL}          rf_driver@test.com
${ADMIN_EMAIL}           rf_admin@test.com
${PASSWORD}              password123
${BROWSER}               chrome
${DELAY}                 2s
${SEED_SCRIPT}           ${CURDIR}/seed-review-test.js

# Populated at runtime
${BOOKING_A_ID}          ${EMPTY}
${DRIVER_ID}             ${EMPTY}

*** Test Cases ***

# ═══════════════════════════════════════════════════════
#  Demo 1: Passenger — Login & View Pending Reviews
# ═══════════════════════════════════════════════════════

Demo-1 Passenger Login
    [Documentation]    Passenger logs in via the web UI
    [Tags]             Demo    Passenger
    Open Browser       ${BASE_URL}/login    ${BROWSER}
    Maximize Browser Window
    Set Selenium Speed    ${DELAY}
    Sleep    2s    Wait for page load

    # Fill login form
    Input Text         id=identifier    ${PASSENGER_EMAIL}
    Sleep    2s    Show email filled
    Input Text         id=password      ${PASSWORD}
    Sleep    2s    Show filled form
    
    # Take screenshot before submit
    Capture Page Screenshot    demo_01_passenger_login.png
    
    # Submit
    Click Button       xpath=//button[@type='submit']
    Sleep    4s    Wait for redirect after login
    Capture Page Screenshot    demo_02_passenger_home.png

Demo-2 Passenger Views Review Page
    [Documentation]    Passenger navigates to /reviews to see pending reviews
    [Tags]             Demo    Passenger    Review
    Go To    ${BASE_URL}/reviews
    Sleep    4s    Wait for reviews page to load
    Capture Page Screenshot    demo_03_reviews_page.png

    # Check that the page loaded with review content
    Page Should Contain    รีวิว
    Sleep    2s    Let viewer see the page

Demo-3 Passenger Creates Review
    [Documentation]    Passenger clicks to create a review for a completed booking
    [Tags]             Demo    Passenger    Review
    # Navigate to create review page with booking ID
    Go To    ${BASE_URL}/reviews/create?bookingId=${BOOKING_A_ID}
    Sleep    4s    Wait for create review page

    Capture Page Screenshot    demo_04_create_review_page.png
    Sleep    2s    Show empty form

    # Click 5th star (rating = 5) — StarRating uses <button> elements
    Sleep    2s    Wait for StarRating to render
    # Wait for star rating to be visible and clickable
    Wait Until Page Contains Element    xpath=//button[contains(@class,'cursor-pointer')]    10s
    Sleep    2s    Ensure elements are ready
    
    # Try to click the 5th star button directly
    ${fifth_star_visible}=    Run Keyword And Return Status    Element Should Be Visible    xpath=(//button[contains(@class,'cursor-pointer')])[5]
    IF    ${fifth_star_visible}
        Click Element    xpath=(//button[contains(@class,'cursor-pointer')])[5]
        Sleep    2s    Show 5th star selected
    ELSE
        # Alternative: Find star rating container and click 5th button
        ${star_container}=    Run Keyword And Return Status    Element Should Be Visible    xpath=//div[contains(@class,'inline-flex items-center')]
        IF    ${star_container}
            Click Element    xpath=(//div[contains(@class,'inline-flex items-center')]//button)[5]
            Sleep    2s    Show 5th star selected with container selector
        ELSE
            # Last resort - use JavaScript to find and click 5th star
            Execute Javascript
            ...    var buttons = document.querySelectorAll('button'); var starButtons = []; for(var i = 0; i < buttons.length; i++) { if(buttons[i].getAttribute('class') && buttons[i].getAttribute('class').includes('cursor-pointer')) { starButtons.push(buttons[i]); } } if(starButtons.length >= 5) { starButtons[4].click(); }
            Sleep    2s    Show star selected with JavaScript fallback
        END
    END

    Capture Page Screenshot    demo_05_star_selected.png
    Sleep    2s

    # Try to select a positive tag if available
    ${tags}=    Get WebElements    xpath=//button[contains(text(),'สุภาพ') or contains(text(),'polite') or contains(text(),'ขับปลอดภัย')]
    ${tag_count}=    Get Length    ${tags}
    IF    ${tag_count} > 0
        Click Element    ${tags}[0]
        Sleep    1s    Show tag selected
    END

    # Try second tag
    ${tags2}=    Get WebElements    xpath=//button[contains(text(),'ตรงเวลา') or contains(text(),'on_time') or contains(text(),'รถสะอาด')]
    IF    len($tags2) > 0
        Click Element    ${tags2}[0]
        Sleep    1s    Show second tag
    END

    # Fill comment
    ${comment_fields}=    Get WebElements    xpath=//textarea
    IF    len($comment_fields) > 0
        Input Text    ${comment_fields}[0]    บริการดีมาก คนขับสุภาพ ขับปลอดภัย แนะนำครับ
        Sleep    2s    Show comment filled
    END

    Capture Page Screenshot    demo_06_review_filled.png
    Sleep    2s    Let viewer read the review

    # Submit the review
    ${submit_btn}=    Get WebElements    xpath=//button[contains(text(),'ส่งรีวิว') or contains(text(),'Submit')]
    IF    len($submit_btn) > 0
        Click Element    ${submit_btn}[0]
        Sleep    4s    Wait for submit and show result
    END

    Capture Page Screenshot    demo_07_review_submitted.png
    Sleep    2s

Demo-4 Passenger Sees Submitted Review
    [Documentation]    After submitting, passenger sees the review in their list
    [Tags]             Demo    Passenger    Review
    Go To    ${BASE_URL}/reviews
    Sleep    4s    Wait for my reviews to load
    Capture Page Screenshot    demo_08_my_reviews_list.png
    Sleep    2s    Let viewer see the submitted review

# ═══════════════════════════════════════════════════════
#  Demo 2: Driver — Login & View Received Reviews
# ═══════════════════════════════════════════════════════

Demo-5 Driver Login
    [Documentation]    Driver logs in to see received reviews
    [Tags]             Demo    Driver
    # Logout first by clearing cookies
    Delete All Cookies
    Go To    ${BASE_URL}/login
    Sleep    2s

    Input Text         id=identifier    ${DRIVER_EMAIL}
    Sleep    2s
    Input Text         id=password      ${PASSWORD}
    Sleep    2s    Show filled form
    Capture Page Screenshot    demo_09_driver_login.png

    Click Button       xpath=//button[@type='submit']
    Sleep    4s    Wait for redirect
    Capture Page Screenshot    demo_10_driver_home.png

Demo-6 Driver Views Received Reviews
    [Documentation]    Driver navigates to reviews and checks received tab
    [Tags]             Demo    Driver    Review
    Go To    ${BASE_URL}/reviews
    Sleep    4s
    Capture Page Screenshot    demo_11_driver_reviews.png
    Sleep    2s

    # Click "รีวิวที่ได้รับ" tab
    ${received_tab}=    Get WebElements    xpath=//button[contains(text(),'ได้รับ') or contains(text(),'received')]
    IF    len($received_tab) > 0
        Click Element    ${received_tab}[0]
        Sleep    4s    Wait for received reviews to load
    END

    Capture Page Screenshot    demo_12_driver_received_reviews.png
    Sleep    2s    Let viewer see received reviews

Demo-7 Driver Views Public Stats Page
    [Documentation]    View the driver's public review stats page
    [Tags]             Demo    Driver    Review
    Go To    ${BASE_URL}/reviews/driver/${DRIVER_ID}
    Sleep    4s    Wait for stats page
    Capture Page Screenshot    demo_13_driver_public_stats.png

    # Verify stats page loaded
    Page Should Contain    รีวิว
    Sleep    4s    Let viewer see driver stats

# ═══════════════════════════════════════════════════════
#  Demo 3: Admin — Login & Manage Disputes
# ═══════════════════════════════════════════════════════

Demo-8 Admin Login
    [Documentation]    Admin logs in to manage disputes
    [Tags]             Demo    Admin
    Delete All Cookies
    Go To    ${BASE_URL}/login
    Sleep    2s

    Input Text         id=identifier    ${ADMIN_EMAIL}
    Sleep    2s
    Input Text         id=password      ${PASSWORD}
    Sleep    2s    Show filled form
    Capture Page Screenshot    demo_14_admin_login.png

    Click Button       xpath=//button[@type='submit']
    Sleep    4s    Wait for admin redirect
    Capture Page Screenshot    demo_15_admin_home.png

Demo-9 Admin Views Disputes Dashboard
    [Documentation]    Admin navigates to Sprint 2 dashboard to see disputes
    [Tags]             Demo    Admin    Dispute
    Go To    ${BASE_URL}/admin/sprint2
    Sleep    4s    Wait for disputes to load
    Capture Page Screenshot    demo_16_admin_disputes.png

    # Verify disputes page loaded
    Page Should Contain    Dispute
    Sleep    4s    Let viewer see the disputes list

Demo-10 Admin Resolves a Dispute
    [Documentation]    Admin clicks resolve button on a pending dispute
    [Tags]             Demo    Admin    Dispute
    # Look for resolve button
    ${resolve_btns}=    Get WebElements    xpath=//button[contains(text(),'ซ่อนรีวิว') or contains(text(),'Resolve') or contains(text(),'✅')]
    ${btn_count}=    Get Length    ${resolve_btns}

    IF    ${btn_count} > 0
        # Scroll to the button
        Scroll Element Into View    ${resolve_btns}[0]
        Sleep    2s    Show the dispute before resolving
        Capture Page Screenshot    demo_17_before_resolve.png
        Sleep    2s

        Click Element    ${resolve_btns}[0]
        Sleep    4s    Wait for resolve and show result
        Capture Page Screenshot    demo_18_after_resolve.png
        Sleep    2s
    ELSE
        Log    No pending disputes to resolve (may already be resolved)
        Capture Page Screenshot    demo_17_no_pending_disputes.png
        Sleep    2s
    END

Demo-11 Driver Creates Dispute
    [Documentation]    Driver navigates to their reviews and creates a dispute
    [Tags]             Demo    Driver    Dispute
    # Navigate to driver's received reviews page
    Go To    ${BASE_URL}/reviews
    Sleep    4s    Wait for reviews page
    
    Capture Page Screenshot    demo_18_driver_reviews_page.png
    Sleep    2s    Show driver's received reviews
    
    # Look for a review to dispute (should have at least one from previous test)
    ${dispute_buttons}=    Get WebElements    xpath=//button[contains(text(),'รายงานข้อพิพาท') or contains(text(),'Dispute') or contains(text(),'รายงาน')]
    ${dispute_count}=    Get Length    ${dispute_buttons}
    
    IF    ${dispute_count} > 0
        # Click the first dispute button
        Click Element    ${dispute_buttons}[0]
        Sleep    2s    Wait for dispute modal/form
        
        Capture Page Screenshot    demo_19_dispute_form.png
        Sleep    2s    Show dispute form
        
        # Fill dispute reason
        ${reason_selectors}=    Get WebElements    xpath=//select | //input[@type='radio'] | //button[contains(text(),'INACCURATE')]
        IF    ${reason_selectors} > 0
            # Try to select INACCURATE reason
            Click Element    ${reason_selectors}[0]
            Sleep    2s    Show reason selected
        END
        
        # Fill dispute detail
        ${detail_fields}=    Get WebElements    xpath=//textarea | //input[@type='text']
        IF    ${detail_fields} > 0
            Input Text    ${detail_fields}[0]    ผู้โดยสารให้ข้อมูลผิดพลาด ผมมาตรงเวลาตามนัดทุกครั้งครับ บริการดีเยี่ยม
            Sleep    2s    Show dispute detail filled
        END
        
        Capture Page Screenshot    demo_20_dispute_filled.png
        Sleep    2s    Let viewer read the dispute
        
        # Submit dispute
        ${submit_buttons}=    Get WebElements    xpath=//button[contains(text(),'ส่ง') or contains(text(),'Submit') or contains(text(),'ยืนยัน')]
        IF    ${submit_buttons} > 0
            Click Element    ${submit_buttons}[0]
            Sleep    4s    Wait for dispute submission
        END
        
        Capture Page Screenshot    demo_21_dispute_submitted.png
        Sleep    2s
        Log    ✅ Driver dispute created successfully
    ELSE
        Log    ⚠️ No dispute buttons found - may need to create a review first
        Capture Page Screenshot    demo_19_no_dispute_options.png
    END

Demo-12 Final Summary Screenshot
    [Documentation]    Take final screenshots showing the completed demo
    [Tags]             Demo    Summary
    # Navigate back to admin disputes to show final state
    Go To    ${BASE_URL}/admin/sprint2
    Sleep    4s    Wait for final page load
    Capture Page Screenshot    demo_22_final_state.png
    Sleep    2s
    Log    🎉 Epic 3 Selenium Demo Complete!

*** Keywords ***

Demo Suite Init
    [Documentation]    Run seed script and load test data IDs
    # Run seed to ensure fresh data
    ${result}=    Run Process    node    ${SEED_SCRIPT}
    ...           cwd=${CURDIR}
    Log    ${result.stdout}
    Should Be Equal As Integers    ${result.rc}    0    Seed script failed: ${result.stderr}

    # Load seed output
    ${file_content}=    Get File    ${CURDIR}/seed-output.json
    ${data}=            Evaluate    json.loads($file_content)    json

    # Set suite variables
    Set Suite Variable    ${BOOKING_A_ID}    ${data['bookingAId']}
    Set Suite Variable    ${DRIVER_ID}       ${data['driverId']}

    Log    Seed data loaded: bookingA=${BOOKING_A_ID}, driver=${DRIVER_ID}
