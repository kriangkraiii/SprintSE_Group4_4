*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${LOGIN_URL}    http://localhost:3000/login
${CHAT_URL}     http://localhost:3000/chat/cmmb0myrb000cusc450b390oz
${IDENTIFIER}   test1
${PASSWORD}     Cp12345678

*** Test Cases ***
Test 01: Login And Spam 100 Messages
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

    ${start}=    Get Time    epoch

    FOR    ${i}    IN RANGE    1    101

        Wait Until Element Is Enabled    css=[data-testid="chat-input"]    timeout=5s

        Clear Element Text    css=[data-testid="chat-input"]
        Input Text            css=[data-testid="chat-input"]    Spam message ${i}

        Wait Until Element Is Enabled    css=[data-testid="send-btn"]    timeout=5s
        Click Button          css=[data-testid="send-btn"]

        Sleep    0.1s

    END

    ${end}=    Get Time    epoch
    ${duration}=    Evaluate    ${end} - ${start}
    Log To Console    100 messages took ${duration} seconds

    Sleep    3s
    Close Browser