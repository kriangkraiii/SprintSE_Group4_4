*** Settings ***
Documentation     API tests for OCR ID-card front blacklist guard.
...               Covers new behavior: when OCR reads national ID in blacklist,
...               endpoint POST /api/ocr/id-card/front must return HTTP 403.
Library           RequestsLibrary
Library           Collections
Library           OperatingSystem
Library           BuiltIn
Suite Setup       Setup API Session

*** Variables ***
${API_BASE_URL}                        http://localhost:3001/api
${ADMIN_EMAIL}                         admin@example.com
${ADMIN_PASSWORD}                      secure_password

# รูปที่ OCR อ่านได้แน่นอนว่าเป็นเลขนี้ (ต้องเตรียมไฟล์เอง)
${BLACKLISTED_NATIONAL_ID}             1234567890123
${OCR_FRONT_IMAGE_BLACKLISTED_PATH}    ${CURDIR}/fixtures/id-front-blacklisted.jpg

# รูปที่ OCR อ่านได้และ "ไม่" อยู่ใน blacklist (optional test)
${OCR_FRONT_IMAGE_NON_BLACKLIST_PATH}  ${CURDIR}/fixtures/id-front-non-blacklisted.jpg

${BLACKLIST_REASON_PREFIX}             robot-e2e-ocr-blacklist

*** Test Cases ***
OCR Front Should Reject Blacklisted National ID
    [Documentation]    1) Admin login
    ...                2) Add NATIONAL_ID to blacklist
    ...                3) Call OCR front endpoint with image of same ID
    ...                4) Expect HTTP 403 + blacklist message
    ${token}=          Admin Login And Get Token
    ${reason}=         Build Unique Blacklist Reason
    ${entry_id}=       Add National ID To Blacklist    ${token}    ${BLACKLISTED_NATIONAL_ID}    ${reason}

    ${response}=       Call OCR Front API    ${OCR_FRONT_IMAGE_BLACKLISTED_PATH}
    Should Be Equal As Integers    ${response.status_code}    403

    ${body}=           Evaluate    $response.json()
    Should Be Equal    ${body['success']}    ${False}
    Should Be Equal As Integers    ${body['statusCode']}    403
    Should Contain     ${body['message']}    บัญชีดำ

    Run Keyword If     ${entry_id} != ${None}    Remove Blacklist Entry By Id    ${token}    ${entry_id}

OCR Front Should Allow Non-Blacklisted National ID
    [Documentation]    Optional positive case for comparison.
    ...                Requires a fixture image whose ID is not in blacklist.
    File Should Exist  ${OCR_FRONT_IMAGE_NON_BLACKLIST_PATH}

    ${response}=       Call OCR Front API    ${OCR_FRONT_IMAGE_NON_BLACKLIST_PATH}
    Should Be Equal As Integers    ${response.status_code}    200

    ${body}=           Evaluate    $response.json()
    Should Be Equal    ${body['success']}    ${True}
    Should Contain     ${body['message']}    OCR completed
    Dictionary Should Contain Key    ${body}    data

*** Keywords ***
Setup API Session
    Create Session     api    ${API_BASE_URL}

Build Unique Blacklist Reason
    ${ts}=             Evaluate    __import__('datetime').datetime.utcnow().strftime('%Y%m%d%H%M%S')
    ${reason}=         Set Variable    ${BLACKLIST_REASON_PREFIX}-${ts}
    RETURN             ${reason}

Admin Login And Get Token
    ${payload}=        Create Dictionary
    ...                email=${ADMIN_EMAIL}
    ...                password=${ADMIN_PASSWORD}

    ${response}=       POST On Session    api    /auth/login    json=${payload}
    Should Be Equal As Integers    ${response.status_code}    200

    ${body}=           Evaluate    $response.json()
    ${token}=          Set Variable    ${body['data']['token']}
    RETURN             ${token}

Add National ID To Blacklist
    [Arguments]        ${token}    ${national_id}    ${reason}
    ${headers}=        Create Dictionary    Authorization=Bearer ${token}
    ${payload}=        Create Dictionary
    ...                nationalId=${national_id}
    ...                reason=${reason}

    ${response}=       POST On Session    api    /blacklist    json=${payload}    headers=${headers}

    # 201 = เพิ่มสำเร็จ, 409 = มีอยู่แล้ว
    ${status}=         Set Variable    ${response.status_code}
    Run Keyword If     ${status} == 201    RETURN Added Blacklist Entry Id    ${response}
    Run Keyword If     ${status} == 409    RETURN    ${None}

    Fail               Unexpected status from POST /blacklist: ${status}

RETURN Added Blacklist Entry Id
    [Arguments]        ${response}
    ${body}=           Evaluate    $response.json()
    ${entry_id}=       Set Variable    ${body['data']['id']}
    RETURN             ${entry_id}

Remove Blacklist Entry By Id
    [Arguments]        ${token}    ${entry_id}
    ${headers}=        Create Dictionary    Authorization=Bearer ${token}
    ${response}=       DELETE On Session    api    /blacklist/${entry_id}    headers=${headers}
    Should Be Equal As Integers    ${response.status_code}    200

Call OCR Front API
    [Arguments]        ${image_path}
    File Should Exist  ${image_path}

    ${image_name}=     Evaluate    __import__('os').path.basename(r'''${image_path}''')
    ${file_obj}=       Evaluate    open(r'''${image_path}''', 'rb')

    ${file_tuple}=     Create List    ${image_name}    ${file_obj}    image/jpeg
    ${files}=          Create Dictionary    image=${file_tuple}

    ${response}=       POST On Session    api    /ocr/id-card/front    files=${files}
    Evaluate           $file_obj.close()
    RETURN             ${response}

