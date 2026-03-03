*** Settings ***
Library    SeleniumLibrary
Suite Setup    Open Browser To Chat
Suite Teardown    Close Browser

*** Variables ***
${LOGIN_URL}    http://localhost:3000/login
${CHAT_URL}     http://localhost:3000/chat/cmmb0myrb000cusc450b390oz
${IDENTIFIER}   test1
${PASSWORD}     Cp12345678
${TEST_MESSAGE}    Robot Test Message

*** Keywords ***
Open Browser To Chat
    Open Browser    ${LOGIN_URL}    edge

    Wait Until Element Is Visible    css=[data-testid="identifier-input"]    timeout=10s

    Click Element    css=[data-testid="identifier-input"]
    Press Keys       css=[data-testid="identifier-input"]    CTRL+A
    Press Keys       css=[data-testid="identifier-input"]    BACKSPACE
    Input Text       css=[data-testid="identifier-input"]    ${IDENTIFIER}

    Click Element    css=[data-testid="password-input"]
    Press Keys       css=[data-testid="password-input"]    CTRL+A
    Press Keys       css=[data-testid="password-input"]    BACKSPACE
    Input Text       css=[data-testid="password-input"]    ${PASSWORD}

    Sleep    1s

    Click Button     css=[data-testid="login-btn"]

    Wait Until Location Does Not Contain    /login    timeout=10s

    Go To    ${CHAT_URL}
    Wait Until Element Is Visible    css=[data-testid="chat-input"]    timeout=10s
    Wait Until Element Is Enabled    css=[data-testid="chat-input"]    timeout=10s

    

Send Message
    Input Text    css=[data-testid="chat-input"]    ${TEST_MESSAGE}
    Click Button    css=[data-testid="send-btn"]
    Wait Until Page Contains    ${TEST_MESSAGE}

Open Message Menu
    # hover ข้อความล่าสุด
    Wait Until Element Is Visible    xpath=(//div[@data-testid="chat-message"])[last()]    timeout=10s
    Mouse Over    xpath=(//div[@data-testid="chat-message"])[last()]

    # รอปุ่ม 3 จุดของข้อความล่าสุด
    Wait Until Element Is Visible    xpath=(//button[@data-testid="message-menu-btn"])[last()]    timeout=10s
    Click Element    xpath=(//button[@data-testid="message-menu-btn"])[last()]

    Wait Until Element Is Visible    css=[data-testid="edit-message-btn"]    timeout=10s

Edit Message

    [Arguments]    ${round}
    Open Message Menu

    Wait Until Element Is Enabled    css=[data-testid="edit-message-btn"]
    Click Element    css=[data-testid="edit-message-btn"]

    Wait Until Element Is Visible    css=[data-testid="chat-input"]
    Wait Until Element Is Enabled    css=[data-testid="chat-input"]

    Click Element    css=[data-testid="chat-input"]
    Clear Element Text    css=[data-testid="chat-input"]
    Input Text    css=[data-testid="chat-input"]    Edit ครั้งที่ ${round}

    Wait Until Element Is Enabled    css=[data-testid="send-btn"]    timeout=10s

    Click Button    css=[data-testid="send-btn"]

    Wait Until Page Contains    Edit ครั้งที่ ${round}

    Close Toast If Present

Close Toast If Present
    Run Keyword And Ignore Error
    ...    Wait Until Element Is Visible    css=[data-testid="toast-close-btn"]    timeout=3s

    Run Keyword And Ignore Error
    ...    Click Element    css=[data-testid="toast-close-btn"]

    Sleep    0.5s

Unsend Message
    Open Message Menu

    Click Element    css=[data-testid="unsend-message-btn"]

    Wait Until Page Does Not Contain    Edit ครั้งที่ 3    timeout=10s

    Wait Until Page Contains    ลบข้อความแล้ว    timeout=10s

    Close Toast If Present
    
*** Test Cases ***

Test 01 - Edit Message 3 Times
    Input Text    css=[data-testid="chat-input"]    ${TEST_MESSAGE}
    Click Button    css=[data-testid="send-btn"]
    Wait Until Element Is Visible    xpath=(//div[@data-testid="chat-message"])[last()]
    Wait Until Page Contains    ${TEST_MESSAGE}

    FOR    ${i}    IN RANGE    1    4
        Edit Message    ${i}
    END

Test 02 - Edit Button Should Be Disabled After 3 Edits
    Open Message Menu
    Element Should Be Disabled    css=[data-testid="edit-message-btn"]

Test 03 - Unsend Message
    Unsend Message