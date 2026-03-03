*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${LOGIN_URL}          http://localhost:3000/login
${CHAT_URL}           http://localhost:3000/chat/cmmb0myrb000cusc450b390oz

# Participant User
${USER_PARTICIPANT}   test1
${PASS_PARTICIPANT}   Cp12345678

# Non Participant User
${USER_NON}           kriangkrai.p@kkumail.com
${PASS_NON}           Cp12345678

${TEST_MESSAGE}       Robot Test Message


*** Keywords ***
Open Browser Normal
    Open Browser    about:blank    edge
    Maximize Browser Window

Login With User
    [Arguments]    ${USERNAME}    ${PASSWORD}

    Go To    ${LOGIN_URL}
    Wait Until Element Is Visible    css=[data-testid="identifier-input"]    timeout=10s
    Wait Until Element Is Enabled    css=[data-testid="identifier-input"]    timeout=10s

    Click Element    css=[data-testid="identifier-input"]
    Press Keys       css=[data-testid="identifier-input"]    CTRL+A
    Press Keys       css=[data-testid="identifier-input"]    BACKSPACE
    Input Text       css=[data-testid="identifier-input"]    ${USERNAME}

    Sleep    0.5s

    Click Element    css=[data-testid="password-input"]
    Press Keys       css=[data-testid="password-input"]    CTRL+A
    Press Keys       css=[data-testid="password-input"]    BACKSPACE
    Input Text       css=[data-testid="password-input"]    ${PASSWORD}

    Sleep    0.5s

    Click Button    css=[data-testid="login-btn"]

    Wait Until Location Does Not Contain    /login    timeout=10s


Go To Chat
    Go To    ${CHAT_URL}
    Wait Until Location Contains    /chat    timeout=10s
    


Send Message
    Input Text    css=[data-testid="chat-input"]    ${TEST_MESSAGE}
    Click Button    css=[data-testid="send-btn"]
    Wait Until Element Is Visible    xpath=(//div[@data-testid="chat-message"])[last()]
    Wait Until Page Contains    ${TEST_MESSAGE}

    FOR    ${i}    IN RANGE    1    4
        Edit Message    ${i}
    END

Open Message Menu
    Wait Until Element Is Visible    xpath=(//div[@data-testid="chat-message"])[last()]    timeout=10s
    Mouse Over    xpath=(//div[@data-testid="chat-message"])[last()]
    Wait Until Element Is Visible    xpath=(//button[@data-testid="message-menu-btn"])[last()]    timeout=10s
    Click Element    xpath=(//button[@data-testid="message-menu-btn"])[last()]
    Wait Until Element Is Visible    css=[data-testid="edit-message-btn"]


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


Unsend Message
    Open Message Menu
    Click Element    css=[data-testid="unsend-message-btn"]

    Wait Until Page Does Not Contain    Edit ครั้งที่ 3    timeout=10s
    Wait Until Page Contains    ลบข้อความแล้ว    timeout=10s


Close Toast If Present
    Run Keyword And Ignore Error
    ...    Wait Until Element Is Visible    css=[data-testid="toast-close-btn"]    timeout=3s

    Run Keyword And Ignore Error
    ...    Click Element    css=[data-testid="toast-close-btn"]

    Sleep    0.5s

Spam 100 Messages
    ${start}=    Get Time    epoch

    FOR    ${i}    IN RANGE    1    101
        Clear Element Text    css=[data-testid="chat-input"]
        Input Text            css=[data-testid="chat-input"]    Spam message ${i}
        Click Button          css=[data-testid="send-btn"]
        Sleep    0.05s
    END

    ${end}=    Get Time    epoch
    ${duration}=    Evaluate    ${end} - ${start}
    Log To Console    100 messages took ${duration} seconds



*** Test Cases ***

Test 01 - Access Chat Without Login
    Open Browser Normal
    Go To    ${CHAT_URL}
    Wait Until Location Contains    /login    timeout=10s
    
    Sleep    1s
    Close Browser


Test 02 - Access Chat With Login But Not Participant
    Open Browser Normal
    Login With User    ${USER_NON}    ${PASS_NON}
    Go To Chat

    Page Should Not Contain Element    css=[data-testid="chat-input"]
    Page Should Not Contain Element    css=[data-testid="send-btn"]

    Sleep    1s
    Close Browser


Test 03 - Edit Message 3 Times
    Open Browser Normal
    Login With User    ${USER_PARTICIPANT}    ${PASS_PARTICIPANT}
    Go To Chat
    Wait Until Element Is Visible    css=[data-testid="chat-input"]    timeout=10s
    Wait Until Element Is Enabled    css=[data-testid="chat-input"]    timeout=10s
    Send Message


Test 04 - Edit Button Disabled After 3 Edits
    Open Message Menu
    Element Should Be Disabled    css=[data-testid="edit-message-btn"]


Test 05 - Unsend Message
    Unsend Message
    Close Browser


Test 06 - Login And Spam 100 Messages
    Open Browser Normal
    Login With User    ${USER_PARTICIPANT}    ${PASS_PARTICIPANT}
    Go To Chat

    Wait Until Element Is Visible    css=[data-testid="chat-input"]
    Spam 100 Messages

    Close Browser