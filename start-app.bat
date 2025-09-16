@echo off
echo ========================================
echo Smart Shift Tracker - Complete Setup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    echo Then run this script again.
    pause
    exit /b 1
)

echo ✅ Node.js is installed
node --version
npm --version
echo.

REM Navigate to project directory
echo 📁 Navigating to project directory...
cd /d "C:\Users\cactu\OneDrive\Desktop\app\smart-shift-tracker-main"
if errorlevel 1 (
    echo ERROR: Could not find project directory!
    pause
    exit /b 1
)

echo ✅ In project directory
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies!
    echo Trying with --force flag...
    call npm install --force
    if errorlevel 1 (
        echo ERROR: Still failed to install dependencies!
        pause
        exit /b 1
    )
)

echo ✅ Dependencies installed successfully
echo.

REM Apply database fixes
echo 🔧 Applying database fixes...
if exist "apply-shift-fixes.js" (
    call node apply-shift-fixes.js
    echo ✅ Database fixes applied
) else (
    echo ⚠️ Database fix script not found, skipping...
)
echo.

REM Start development server
echo 🚀 Starting development server...
echo.
echo ========================================
echo Your app will be available at:
echo http://localhost:5173
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

call npm run dev

pause