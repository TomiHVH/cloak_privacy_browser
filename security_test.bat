@echo off
setlocal enabledelayedexpansion

REM Security Testing Script for Minimal Browser (Windows)
REM This script tests various security features and vulnerabilities

echo 🔒 Security Testing for Minimal Browser
echo ========================================

REM Test results
set /a PASSED=0
set /a FAILED=0
set /a WARNINGS=0

REM Test 1: Check if dangerous protocols are blocked
echo.
echo Testing Protocol Blocking...
if findstr /C:"Blocked dangerous protocol" src\main.rs >nul 2>&1 (
    echo ✅ PASS: Protocol blocking implemented
    set /a PASSED+=1
) else (
    echo ⚠️  WARNING: Protocol blocking not found
    set /a WARNINGS+=1
)

REM Test 2: Check Content Security Policy
echo.
echo Testing Content Security Policy...
if findstr /C:"Content-Security-Policy" src\main.rs >nul 2>&1 (
    echo ✅ PASS: CSP headers are implemented
    set /a PASSED+=1
) else (
    echo ❌ FAIL: CSP headers are not implemented
    set /a FAILED+=1
)

if findstr /C:"object-src 'none'" src\main.rs >nul 2>&1 (
    echo ✅ PASS: object-src 'none' directive found
    set /a PASSED+=1
) else (
    echo ⚠️  WARNING: object-src directive not found
    set /a WARNINGS+=1
)

if findstr /C:"frame-src 'none'" src\main.rs >nul 2>&1 (
    echo ✅ PASS: frame-src 'none' directive found
    set /a PASSED+=1
) else (
    echo ⚠️  WARNING: frame-src directive not found
    set /a WARNINGS+=1
)

REM Test 3: Check XSS Prevention
echo.
echo Testing XSS Prevention...
findstr /C:"innerHTML" src\ui.js >nul 2>&1
if !errorlevel! equ 0 (
    echo ⚠️  WARNING: innerHTML usage found - potential XSS risk
    set /a WARNINGS+=1
) else (
    echo ✅ PASS: No innerHTML usage found
    set /a PASSED+=1
)

findstr /C:"textContent" src\ui.js >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ PASS: textContent is used for safe content insertion
    set /a PASSED+=1
) else (
    echo ⚠️  WARNING: textContent usage not found
    set /a WARNINGS+=1
)

REM Test 4: Check Input Validation
echo.
echo Testing Input Validation...
if findstr /C:"sanitizeUrl" src\ui.js >nul 2>&1 (
    echo ✅ PASS: Input sanitization functions found
    set /a PASSED+=1
) else (
    echo ❌ FAIL: Input sanitization functions not found
    set /a FAILED+=1
)

if findstr /C:"length < 2048" src\ui.js >nul 2>&1 (
    echo ✅ PASS: Input length limits implemented
    set /a PASSED+=1
) else (
    echo ⚠️  WARNING: Input length limits not found
    set /a WARNINGS+=1
)

REM Test 5: Check IPC Security
echo.
echo Testing IPC Security...
if findstr /C:"validate_ipc_command" src\main.rs >nul 2>&1 (
    echo ✅ PASS: IPC command validation implemented
    set /a PASSED+=1
) else (
    echo ❌ FAIL: IPC command validation not implemented
    set /a FAILED+=1
)

if findstr /C:"1024 * 1024" src\main.rs >nul 2>&1 (
    echo ✅ PASS: IPC request size limits implemented
    set /a PASSED+=1
) else (
    echo ⚠️  WARNING: IPC request size limits not found
    set /a WARNINGS+=1
)

REM Test 6: Check Security Headers
echo.
echo Testing Security Headers...
for %%h in (X-Content-Type-Options X-Frame-Options X-XSS-Protection) do (
    if findstr /C:"%%h" src\main.rs >nul 2>&1 (
        echo ✅ PASS: %%h header implemented
        set /a PASSED+=1
    ) else (
        echo ⚠️  WARNING: %%h header not found
        set /a WARNINGS+=1
    )
)

REM Test 7: Check Dependencies
echo.
echo Testing Dependencies...
if findstr /C:"url = \"2.4\"" Cargo.toml >nul 2>&1 (
    echo ✅ PASS: URL validation crate included
    set /a PASSED+=1
) else (
    echo ⚠️  WARNING: URL validation crate not found
    set /a WARNINGS+=1
)

if findstr /C:"panic = \"abort\"" Cargo.toml >nul 2>&1 (
    echo ✅ PASS: Security-focused build profile configured
    set /a PASSED+=1
) else (
    echo ⚠️  WARNING: Security-focused build profile not found
    set /a WARNINGS+=1
)

REM Test 8: Check Documentation
echo.
echo Testing Documentation...
if exist "SECURITY.md" (
    echo ✅ PASS: Security documentation exists
    set /a PASSED+=1
) else (
    echo ❌ FAIL: Security documentation missing
    set /a FAILED+=1
)

if exist "README.md" (
    echo ✅ PASS: README with security information exists
    set /a PASSED+=1
) else (
    echo ❌ FAIL: README missing
    set /a FAILED+=1
)

REM Test 9: Check Build Security
echo.
echo Testing Build Security...
cargo check --quiet >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ PASS: Project compiles successfully
    set /a PASSED+=1
) else (
    echo ❌ FAIL: Project has compilation errors
    set /a FAILED+=1
)

REM Summary
echo.
echo Test Summary
echo =============
echo ✅ Passed: !PASSED!
echo ❌ Failed: !FAILED!
echo ⚠️  Warnings: !WARNINGS!

REM Calculate score
set /a total=!PASSED!+!FAILED!+!WARNINGS!
set /a score=0
if !total! gtr 0 (
    set /a score=!PASSED!*100/!total!
)

echo.
echo 🔒 Security Score: !score!%%

REM Recommendations
if !FAILED! gtr 0 (
    echo.
    echo ❌ Critical issues found! Please fix these before deployment.
    exit /b 1
) else if !WARNINGS! gtr 0 (
    echo.
    echo ⚠️  Warnings found. Consider addressing these for better security.
) else (
    echo.
    echo 🎉 All security tests passed!
)

echo.
echo 🔒 Security testing complete.
pause

