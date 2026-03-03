*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${LOGIN_URL}    http://localhost:3000/login
${CHAT_URL}     http://localhost:3000/chat/cmmb0myrb000cusc450b390oz
${IDENTIFIER}   kriangkrai.p@kkumail.com
${PASSWORD}     Cp12345678

*** Test Cases ***
Test 01: Access Chat Without Login
    Open Browser    ${CHAT_URL}    edge
    Maximize Browser Window

    Wait Until Location Contains    /login    timeout=10s

    Log To Console    PASS - Redirected to login page
    Close Browser

Test 02: Access Chat With Login But Not Participant

    ${options}=    Evaluate    sys.modules['selenium.webdriver'].EdgeOptions()    sys, selenium.webdriver
    Call Method    ${options}    add_argument    --inprivate

    Create Webdriver    Edge    options=${options}
    Set Selenium Speed    0.5s
    Go To    ${LOGIN_URL}

    Capture Page Screenshot    01-login-page.png

    Wait Until Element Is Visible    css=[data-testid="identifier-input"]    timeout=10s

    Input Text    css=[data-testid="identifier-input"]    ${IDENTIFIER}
    Input Text    css=[data-testid="password-input"]      ${PASSWORD}

    Capture Page Screenshot    03-after-password.png

    Click Button  css=[data-testid="login-btn"]

    Wait Until Location Does Not Contain    /login    timeout=10s

    Capture Page Screenshot    04-after-login.png

    Go To    ${CHAT_URL}

    Wait Until Location Contains    /chat    timeout=10s

    Capture Page Screenshot    05-chat-page.png

    Page Should Not Contain Element    css=[data-testid="chat-input"]

    Page Should Not Contain Element    css=[data-testid="send-btn"]
    
    Capture Page Screenshot    06-no-access.png
    
    Log To Console    PASS - User cannot interact with chat

    Sleep    2s
    Close Browser