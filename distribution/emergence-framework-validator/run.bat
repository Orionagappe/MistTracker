@echo off
REM EMERGENCE FRAMEWORK 2.0 - VALIDATOR SETUP AND RUN
REM Windows batch script - requires Node.js to be installed

echo ============================================================================
echo EMERGENCE VALIDATION FRAMEWORK 2.0 - INDEPENDENT VALIDATOR
echo ============================================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from https://nodejs.org/
    echo Then run this script again.
    pause
    exit /b 1
)

REM Check Node version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js version: %NODE_VERSION%
echo.

REM Run validator
echo Running validator.cjs...
echo.
node validator.cjs %*
set VALIDATOR_EXIT=%errorlevel%

echo.
if %VALIDATOR_EXIT% equ 0 (
    echo ============================================================================
    echo SUCCESS: Framework validated. Results saved to validation-results.json
    echo ============================================================================
) else (
    echo ============================================================================
    echo FAILURE: One or more tests failed. See details above.
    echo ============================================================================
)

pause
exit /b %VALIDATOR_EXIT%
