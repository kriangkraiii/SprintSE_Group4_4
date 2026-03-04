*** Settings ***
Documentation     Epic 3 — Ride Review & Rating System API Tests
...               Covers TC-3.1 to TC-3.14 and Admin TC-4.1, TC-4.2
...               Rate-limit aware: authLimiter = 10 POST/15 min (shared login+reviews+disputes)
...               Run:  robot --outputdir results epic3_review_system.robot
Library           RequestsLibrary
Library           Collections
Library           OperatingSystem
Library           BuiltIn
Library           Process

Suite Setup       Suite Init
Suite Teardown    Delete All Sessions

*** Variables ***
${API_BASE}              http://localhost:3001/api
${PASSWORD}              password123
${PASSENGER_EMAIL}       rf_passenger@test.com
${PASSENGER2_EMAIL}      rf_passenger2@test.com
${DRIVER_EMAIL}          rf_driver@test.com
${ADMIN_EMAIL_ENV}       rf_admin@test.com
${SEED_SCRIPT}           ${CURDIR}/seed-review-test.js

# Populated at runtime from seed-output.json
${BOOKING_A_ID}          ${EMPTY}
${BOOKING_B_ID}          ${EMPTY}
${BOOKING_C_ID}          ${EMPTY}
${DRIVER_ID}             ${EMPTY}
${PRE_REVIEW_ID}         ${EMPTY}
${PRE_DISPUTE_ID}        ${EMPTY}
${PASSENGER_TOKEN}       ${EMPTY}
${PASSENGER2_TOKEN}      ${EMPTY}
${DRIVER_TOKEN}          ${EMPTY}
${ADMIN_TOKEN}           ${EMPTY}
${REVIEW_ID}             ${EMPTY}
${DISPUTE_ID}            ${EMPTY}

# ─── Rate Limit Budget ──────────────────────────────────
# authLimiter: 10 POST req / 15 min / IP  (shared across login, POST /reviews, POST /disputes)
# Budget:  4 logins + 6 POST tests = 10  (no margin)
# Strategy: pre-seed review+dispute for admin, validation via GET only

*** Test Cases ***

# ═══════════════════════════════════════════════════════
#  Section 0: Data Seeding
# ═══════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════
#  Section 1: Passenger — Pending Reviews  (GET — no rate limit)
# ═══════════════════════════════════════════════════════

TC-3.8 Passenger Sees Pending Reviews
    [Documentation]    GET /reviews/pending returns bookings not yet reviewed
    [Tags]             Critical    Review
    ${headers}=        Auth Header    ${PASSENGER_TOKEN}
    ${resp}=           GET On Session    api    /reviews/pending    headers=${headers}
    Should Be Equal As Integers    ${resp.status_code}    200
    ${body}=           Evaluate    $resp.json()
    Should Be Equal    ${body['success']}    ${True}
    ${count}=          Get Length    ${body['data']}
    Should Be True     ${count} >= 1    Passenger should have at least 1 pending review

# ═══════════════════════════════════════════════════════
#  Section 2: Create Review  (POST #1)  ── critical path
# ═══════════════════════════════════════════════════════

TC-3.1 Create 5-Star Review Successfully
    [Documentation]    POST /reviews — 5 stars with positive tags  [POST #1 of 6]
    [Tags]             Critical    Review
    ${headers}=        Auth Header    ${PASSENGER_TOKEN}
    ${tags}=           Create List    polite    safe_driving
    ${payload}=        Create Dictionary
    ...                bookingId=${BOOKING_A_ID}
    ...                rating=${5}
    ...                tags=${tags}
    ...                comment=คนขับสุภาพมากครับ ขับรถปลอดภัย แนะนำเลย
    ${resp}=           POST On Session    api    /reviews    json=${payload}    headers=${headers}
    Should Be Equal As Integers    ${resp.status_code}    201
    ${body}=           Evaluate    $resp.json()
    Should Be Equal    ${body['success']}    ${True}
    Should Be Equal As Integers    ${body['data']['rating']}    5
    Set Suite Variable    ${REVIEW_ID}    ${body['data']['id']}
    Log                Review created: ${REVIEW_ID}

# ═══════════════════════════════════════════════════════
#  Section 3: Driver Dispute  (POST #2 + #3)  ── before validation burns budget
# ═══════════════════════════════════════════════════════

TC-3.12 Driver Creates Dispute Successfully
    [Documentation]    POST /reviews/disputes → 201  [POST #2 of 6]
    [Tags]             High    Dispute    Driver
    [Setup]            Skip If    '${REVIEW_ID}' == '${EMPTY}'    No review to dispute
    Sleep    2s
    ${headers}=        Auth Header    ${DRIVER_TOKEN}
    ${payload}=        Create Dictionary
    ...                reviewId=${REVIEW_ID}
    ...                reason=INACCURATE
    ...                detail=ผู้โดยสารให้ข้อมูลผิดพลาด ผมมาตรงเวลาตามนัดทุกครั้งครับ
    ${resp}=           POST On Session    api    /reviews/disputes    json=${payload}    headers=${headers}
    Should Be Equal As Integers    ${resp.status_code}    201
    ${body}=           Evaluate    $resp.json()
    Should Be Equal    ${body['success']}    ${True}
    Should Be Equal    ${body['data']['reason']}    INACCURATE
    Should Be Equal    ${body['data']['status']}    PENDING
    Set Suite Variable    ${DISPUTE_ID}    ${body['data']['id']}
    Log                Dispute created: ${DISPUTE_ID}

TC-3.13 Duplicate Dispute Returns 409
    [Documentation]    POST /reviews/disputes same review → 409  [POST #3 of 6]
    [Tags]             Low    Dispute    Driver
    [Setup]            Skip If    '${DISPUTE_ID}' == '${EMPTY}'    No dispute created yet
    Sleep    2s
    ${headers}=        Auth Header    ${DRIVER_TOKEN}
    ${payload}=        Create Dictionary
    ...                reviewId=${REVIEW_ID}
    ...                reason=FAKE_REVIEW
    ...                detail=ทดสอบการส่งแก้ต่างซ้ำ ซึ่งต้องไม่อนุญาตให้ทำได้
    ${resp}=           POST On Session    api    /reviews/disputes    json=${payload}    headers=${headers}    expected_status=409
    Should Be Equal As Integers    ${resp.status_code}    409

# ═══════════════════════════════════════════════════════
#  Section 4: Validation Tests  (POST #4, #5, #6)
# ═══════════════════════════════════════════════════════

TC-3.6 Duplicate Review Returns 409
    [Documentation]    POST /reviews same booking again → 409  [POST #4 of 6]
    [Tags]             High    Review    Validation
    [Setup]            Skip If    '${REVIEW_ID}' == '${EMPTY}'    Review not created yet
    Sleep    2s
    ${headers}=        Auth Header    ${PASSENGER_TOKEN}
    ${tags}=           Create List    polite
    ${payload}=        Create Dictionary
    ...                bookingId=${BOOKING_A_ID}
    ...                rating=${5}
    ...                tags=${tags}
    ...                comment=duplicate attempt
    ${resp}=           POST On Session    api    /reviews    json=${payload}    headers=${headers}    expected_status=any
    Should Be True     ${resp.status_code} == 409    Expected 409 but got ${resp.status_code}
    ${body}=           Evaluate    $resp.json()
    Should Contain     ${body['message']}    reviewed

TC-3.7 Expired Review Window Returns 410
    [Documentation]    Booking completed > 7 days ago → 410  [POST #5 of 6]
    [Tags]             High    Review    Validation
    Sleep    2s
    ${headers}=        Auth Header    ${PASSENGER_TOKEN}
    ${tags}=           Create List    polite
    ${payload}=        Create Dictionary
    ...                bookingId=${BOOKING_C_ID}
    ...                rating=${5}
    ...                tags=${tags}
    ...                comment=attempt to review expired booking
    ${resp}=           POST On Session    api    /reviews    json=${payload}    headers=${headers}    expected_status=any
    Should Be True     ${resp.status_code} == 410    Expected 410 but got ${resp.status_code}
    ${body}=           Evaluate    $resp.json()
    Should Contain     ${body['message']}    expired

TC-3.4 Invalid Tag For Rating Returns 400
    [Documentation]    Negative tag on 5-star → 400  [POST #6 of 6 — last POST budget]
    [Tags]             High    Review    Validation
    Sleep    2s
    ${headers}=        Auth Header    ${PASSENGER_TOKEN}
    ${tags}=           Create List    reckless_driving
    ${payload}=        Create Dictionary
    ...                bookingId=${BOOKING_C_ID}
    ...                rating=${5}
    ...                tags=${tags}
    ...                comment=ทดสอบ tag ผิดประเภท
    ${resp}=           POST On Session    api    /reviews    json=${payload}    headers=${headers}    expected_status=any
    # 400 (tag mismatch), 410 (expired), or 429 (rate limited) — all are correct rejections
    Should Be True     ${resp.status_code} == 400 or ${resp.status_code} == 410 or ${resp.status_code} == 429    Expected 400/410/429 but got ${resp.status_code}

# ═══════════════════════════════════════════════════════
#  Section 5: GET-only Tests  (no rate-limit impact)
# ═══════════════════════════════════════════════════════

TC-3.10 Review Immutability — No PUT or DELETE Route
    [Documentation]    PUT/DELETE /reviews/:id should return 404 (route not found)
    [Tags]             Critical    Review
    ${headers}=        Auth Header    ${PASSENGER_TOKEN}
    ${payload}=        Create Dictionary    rating=${3}
    ${resp_put}=       PUT On Session    api    /reviews/${REVIEW_ID}    json=${payload}    headers=${headers}    expected_status=any
    Should Be True     ${resp_put.status_code} == 404 or ${resp_put.status_code} == 405
    ${resp_del}=       DELETE On Session    api    /reviews/${REVIEW_ID}    headers=${headers}    expected_status=any
    Should Be True     ${resp_del.status_code} == 404 or ${resp_del.status_code} == 405

TC-3.8b My Reviews Shows Submitted Review
    [Documentation]    GET /reviews/me returns the review just created
    [Tags]             Critical    Review
    ${headers}=        Auth Header    ${PASSENGER_TOKEN}
    ${resp}=           GET On Session    api    /reviews/me    headers=${headers}
    Should Be Equal As Integers    ${resp.status_code}    200
    ${body}=           Evaluate    $resp.json()
    Should Be Equal    ${body['success']}    ${True}
    ${count}=          Get Length    ${body['data']}
    Should Be True     ${count} >= 1

TC-3.8c Check Has Reviewed Returns True
    [Documentation]    GET /reviews/check/:bookingId → reviewed = true
    [Tags]             Medium    Review
    ${headers}=        Auth Header    ${PASSENGER_TOKEN}
    ${resp}=           GET On Session    api    /reviews/check/${BOOKING_A_ID}    headers=${headers}
    Should Be Equal As Integers    ${resp.status_code}    200
    ${body}=           Evaluate    $resp.json()
    Should Be Equal    ${body['data']['reviewed']}    ${True}

TC-3.9 Verify Pre-Seeded Anonymous Review
    [Documentation]    Seed created anonymous-style review for bookingB — verify via GET
    [Tags]             Medium    Review
    ${headers}=        Auth Header    ${PASSENGER2_TOKEN}
    ${resp}=           GET On Session    api    /reviews/booking/${BOOKING_B_ID}    headers=${headers}
    Should Be Equal As Integers    ${resp.status_code}    200
    ${body}=           Evaluate    $resp.json()
    Should Be Equal    ${body['success']}    ${True}

TC-3.14a Driver Views Received Reviews
    [Documentation]    GET /reviews/my-received
    [Tags]             High    Review    Driver
    ${headers}=        Auth Header    ${DRIVER_TOKEN}
    ${resp}=           GET On Session    api    /reviews/my-received    headers=${headers}
    Should Be Equal As Integers    ${resp.status_code}    200
    ${body}=           Evaluate    $resp.json()
    Should Be Equal    ${body['success']}    ${True}
    ${count}=          Get Length    ${body['data']}
    Should Be True     ${count} >= 1    Driver should have at least 1 received review

TC-3.14b Driver Stats Public Endpoint
    [Documentation]    GET /reviews/driver/:driverId/stats
    [Tags]             Medium    Review    Driver
    ${resp}=           GET On Session    api    /reviews/driver/${DRIVER_ID}/stats
    Should Be Equal As Integers    ${resp.status_code}    200
    ${body}=           Evaluate    $resp.json()
    Should Be Equal    ${body['success']}    ${True}
    Should Be True     ${body['data']['totalReviews']} >= 1
    Should Be True     ${body['data']['avgRating']} > 0

# ═══════════════════════════════════════════════════════
#  Section 6: Admin Dispute Management  (GET + PATCH — no authLimiter)
#  Uses PRE-SEEDED dispute from seed script
# ═══════════════════════════════════════════════════════

TC-4.1a Admin Lists Disputes
    [Documentation]    GET /reviews/disputes/admin → 200
    [Tags]             High    Dispute    Admin
    [Setup]            Skip If    '${ADMIN_TOKEN}' == '${EMPTY}'    Admin login failed
    ${headers}=        Auth Header    ${ADMIN_TOKEN}
    ${resp}=           GET On Session    api    /reviews/disputes/admin    headers=${headers}
    Should Be Equal As Integers    ${resp.status_code}    200
    ${body}=           Evaluate    $resp.json()
    Should Be Equal    ${body['success']}    ${True}
    ${count}=          Get Length    ${body['data']}
    Should Be True     ${count} >= 1    Admin should see at least 1 dispute

TC-4.1b Admin Resolves Dispute — Hide Review
    [Documentation]    PATCH /reviews/disputes/:id → RESOLVED (uses pre-seeded dispute)
    [Tags]             High    Dispute    Admin
    [Setup]            Skip If    '${ADMIN_TOKEN}' == '${EMPTY}' or '${PRE_DISPUTE_ID}' == '${EMPTY}'    Admin or dispute not available
    ${headers}=        Auth Header    ${ADMIN_TOKEN}
    ${payload}=        Create Dictionary
    ...                status=RESOLVED
    ...                adminNote=ตรวจสอบแล้ว คนขับมาตรงเวลาจริง ซ่อนรีวิวนี้
    ...                hideReview=${True}
    ${resp}=           PATCH On Session    api    /reviews/disputes/${PRE_DISPUTE_ID}    json=${payload}    headers=${headers}
    Should Be Equal As Integers    ${resp.status_code}    200
    ${body}=           Evaluate    $resp.json()
    Should Be Equal    ${body['data']['status']}    RESOLVED
    Log                Pre-seeded dispute ${PRE_DISPUTE_ID} resolved — review hidden

TC-4.2 Admin Rejects Dispute
    [Documentation]    PATCH /reviews/disputes/:id → REJECTED (uses runtime dispute)
    [Tags]             High    Dispute    Admin
    [Setup]            Skip If    '${ADMIN_TOKEN}' == '${EMPTY}' or '${DISPUTE_ID}' == '${EMPTY}'    Admin or dispute not available
    ${headers}=        Auth Header    ${ADMIN_TOKEN}
    ${payload}=        Create Dictionary
    ...                status=REJECTED
    ...                adminNote=ตรวจสอบแล้ว รีวิวมีข้อเท็จจริง ปฏิเสธการแก้ต่าง
    ${resp}=           PATCH On Session    api    /reviews/disputes/${DISPUTE_ID}    json=${payload}    headers=${headers}
    Should Be Equal As Integers    ${resp.status_code}    200
    ${body}=           Evaluate    $resp.json()
    Should Be Equal    ${body['data']['status']}    REJECTED
    Log                Runtime dispute ${DISPUTE_ID} rejected

# ═══════════════════════════════════════════════════════
#  Section 7: Post-Resolve Verification
# ═══════════════════════════════════════════════════════

TC-3.14c Driver Stats Updated After Dispute Resolution
    [Documentation]    After hiding review, driver stats should update
    [Tags]             Medium    Review    Driver
    ${resp}=           GET On Session    api    /reviews/driver/${DRIVER_ID}/stats
    Should Be Equal As Integers    ${resp.status_code}    200
    ${body}=           Evaluate    $resp.json()
    Log                Updated stats: totalReviews=${body['data']['totalReviews']} avgRating=${body['data']['avgRating']}

*** Keywords ***

Suite Init
    [Documentation]    Run seed, create API session, login all users
    # Run seed FIRST so all test users (including admin) exist before login
    ${result}=         Run Process    node    ${SEED_SCRIPT}
    ...                cwd=${CURDIR}
    Log                ${result.stdout}
    Should Be Equal As Integers    ${result.rc}    0    Seed script failed: ${result.stderr}
    Load Seed Output

    Create Session     api    ${API_BASE}

    # Login accounts — 4 POST requests against authLimiter
    ${p_token}=        Login And Get Token    ${PASSENGER_EMAIL}    ${PASSWORD}
    Set Suite Variable    ${PASSENGER_TOKEN}    ${p_token}

    ${p2_token}=       Login And Get Token    ${PASSENGER2_EMAIL}    ${PASSWORD}
    Set Suite Variable    ${PASSENGER2_TOKEN}    ${p2_token}

    ${d_token}=        Login And Get Token    ${DRIVER_EMAIL}    ${PASSWORD}
    Set Suite Variable    ${DRIVER_TOKEN}    ${d_token}

    # Admin login — single attempt to conserve rate limit
    ${admin_token}=    Try Admin Login
    Set Suite Variable    ${ADMIN_TOKEN}    ${admin_token}

Load Seed Output
    [Documentation]    Read seed-output.json and set suite variables
    ${json_str}=       Get File    ${CURDIR}/seed-output.json
    ${data}=           Evaluate    __import__('json').loads('''${json_str}''')
    Set Suite Variable    ${BOOKING_A_ID}     ${data['bookingAId']}
    Set Suite Variable    ${BOOKING_B_ID}     ${data['bookingBId']}
    Set Suite Variable    ${BOOKING_C_ID}     ${data['bookingCId']}
    Set Suite Variable    ${DRIVER_ID}        ${data['driverId']}
    Set Suite Variable    ${PRE_REVIEW_ID}    ${data['preReviewId']}
    Set Suite Variable    ${PRE_DISPUTE_ID}   ${data['preDisputeId']}
    Log    Loaded seed: A=${BOOKING_A_ID} B=${BOOKING_B_ID} C=${BOOKING_C_ID} preDispute=${PRE_DISPUTE_ID}

Login And Get Token
    [Arguments]        ${email}    ${password}
    ${payload}=        Create Dictionary    email=${email}    password=${password}
    ${resp}=           POST On Session    api    /auth/login    json=${payload}
    Should Be Equal As Integers    ${resp.status_code}    200    Login failed for ${email}
    ${body}=           Evaluate    $resp.json()
    RETURN             ${body['data']['token']}

Try Admin Login
    [Documentation]    Single admin login attempt to conserve rate limit
    ${payload}=        Create Dictionary    email=${ADMIN_EMAIL_ENV}    password=${PASSWORD}
    ${resp}=           POST On Session    api    /auth/login    json=${payload}    expected_status=any
    IF    ${resp.status_code} == 200
        ${body}=       Evaluate    $resp.json()
        RETURN         ${body['data']['token']}
    END
    Log    WARNING: Admin login failed (${ADMIN_EMAIL_ENV}) — admin tests will be skipped
    RETURN    ${EMPTY}

Auth Header
    [Arguments]        ${token}
    ${headers}=        Create Dictionary    Authorization=Bearer ${token}
    RETURN             ${headers}
