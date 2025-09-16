@echo off
echo.
echo ===========================================
echo   SUPABASE RLS POLICY FIX - INSTRUCTIONS
echo ===========================================
echo.
echo The automated fix cannot work due to Supabase limitations.
echo You need to run SQL manually in the Supabase Dashboard.
echo.
echo STEPS:
echo ------
echo 1. Go to https://supabase.com/dashboard/projects
echo 2. Open your project: depeamhvogstuynlqudi
echo 3. Go to SQL Editor ^(left sidebar^)
echo 4. Click "New Query"
echo 5. Copy and paste the contents of manual-rls-fix.sql
echo 6. Click "Run" to execute the SQL
echo.
echo ===========================================
echo   MANUAL SQL TO COPY:
echo ===========================================
echo.
type manual-rls-fix.sql
echo.
echo ===========================================
echo   AFTER RUNNING THE SQL:
echo ===========================================
echo.
echo Try your company signup again. The "Permission denied"
echo error should be fixed.
echo.
echo If you still get errors, the tables might not exist.
echo Run CREATE_TENANT_TABLES.sql first, then this fix.
echo.
pause
