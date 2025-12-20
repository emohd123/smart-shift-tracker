$ErrorActionPreference = "Stop"

function Fail($msg) {
  Write-Host ""
  Write-Host "ERROR: $msg" -ForegroundColor Red
  exit 1
}

Set-Location (Split-Path -Parent $PSScriptRoot)

$projectRef = (Get-Content "supabase/config.toml" | Select-String '^project_id\s*=' | ForEach-Object { $_.Line.Split('"')[1] }) | Select-Object -First 1
if (-not $projectRef) { Fail "Could not read project_id from supabase/config.toml" }

if (-not $env:SUPABASE_ACCESS_TOKEN) { Fail "SUPABASE_ACCESS_TOKEN is not set. Set it and restart your terminal/Cursor." }
if (-not $env:SUPABASE_DB_PASSWORD) { Fail "SUPABASE_DB_PASSWORD is not set. Set it to your Supabase project Postgres password." }

Write-Host "Deploying Supabase backend for project: $projectRef"

Write-Host ""
Write-Host "Linking project..."
npx -y supabase@latest link --project-ref $projectRef --yes

Write-Host ""
Write-Host "Pushing DB migrations (dry-run)..."
npx -y supabase@latest db push --linked --yes --dry-run --password $env:SUPABASE_DB_PASSWORD

Write-Host ""
Write-Host "Applying DB migrations..."
npx -y supabase@latest db push --linked --yes --password $env:SUPABASE_DB_PASSWORD

Write-Host ""
Write-Host "Deploying Edge Functions..."
npx -y supabase@latest functions deploy --project-ref $projectRef --use-api --no-verify-jwt

Write-Host ""
Write-Host "✅ Backend/db deploy complete."


