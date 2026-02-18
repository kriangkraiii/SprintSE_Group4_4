*** Settings ***
Library    RequestsLibrary
Library    Collections
Library    String

*** Variables ***
${API_BASE_URL}             http://localhost:3000/api
${ADMIN_EMAIL}              admin@example.com
${ADMIN_PASSWORD}           adminpassword
${DEFAULT_HEADERS}          {'Content-Type': 'application/json'}

*** Keywords ***
Get Admin Token
    [Documentation]    Logs in as Admin and returns the JWT token.
    &{headers}=    Create Dictionary    Content-Type=application/json
    &{body}=       Create Dictionary    email=${ADMIN_EMAIL}    password=${ADMIN_PASSWORD}
    ${resp}=       POST    ${API_BASE_URL}/auth/login    json=${body}    headers=${headers}    expected_status=200
    ${token}=      Set Variable    ${resp.json()}[data][token]
    RETURN         ${token}

Create User via API
    [Arguments]    ${email}    ${password}    ${first_name}    ${last_name}    ${phone}    ${national_id}
    [Documentation]    Creates a new user via API.
    ${username}=   Fetch From Left    ${email}    @
    &{headers}=    Create Dictionary    Content-Type=application/json
    &{body}=       Create Dictionary    email=${email}    username=${username}    password=${password}    firstName=${first_name}    lastName=${last_name}    phoneNumber=${phone}    nationalIdNumber=${national_id}
    ${resp}=       POST    ${API_BASE_URL}/users    json=${body}    headers=${headers}    expected_status=any
    Log To Console    CREATE USER RESPONSE: ${resp.text}
    Should Be Equal As Strings    ${resp.status_code}    201
    ${user_id}=    Set Variable    ${resp.json()}[data][user][id]
    RETURN         ${user_id}

Delete User via API
    [Arguments]    ${user_id}    ${token}
    [Documentation]    Deletes a user by ID using an Admin token.
    &{headers}=    Create Dictionary    Authorization=Bearer ${token}    Content-Type=application/json
    ${resp}=       DELETE    ${API_BASE_URL}/users/admin/${user_id}    headers=${headers}    expected_status=200

Generate Unique Email
    [Documentation]    Generates a unique email based on timestamp.
    ${random_str}=    Generate Random String    8    [LOWER]
    ${email}=         Set Variable    test_${random_str}@example.com
    RETURN            ${email}

Generate Unique National ID
    [Documentation]    Generates a 13-digit random national ID.
    ${nid}=    Generate Random String    13    [NUMBERS]
    RETURN     ${nid}
