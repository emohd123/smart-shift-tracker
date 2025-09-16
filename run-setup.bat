@echo off
echo 🚀 Supabase Database Auto-Setup
echo.

REM Check if service role key is provided
if "%SUPABASE_SERVICE_ROLE_KEY%"=="" (
    echo ❌ Please set your SUPABASE_SERVICE_ROLE_KEY environment variable
    echo.
    echo 📝 Usage:
    echo    set SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
    echo    run-setup.bat
    echo.
    echo 🔑 Get your service role key from:
    echo    Supabase Dashboard → Settings → API → service_role key
    echo.
    pause
    exit /b 1
)

echo 🔧 Running database setup with provided service role key...
node auto-setup-database.js

echo.
echo 🎉 Setup complete! Check the output above for any errors.
pause
