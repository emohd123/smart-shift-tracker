$ErrorActionPreference = "Stop"

function Fail($msg) {
  Write-Host ""
  Write-Host "ERROR: $msg" -ForegroundColor Red
  exit 1
}

function Run($label, $command) {
  Write-Host $label
  Invoke-Expression $command
  if ($LASTEXITCODE -ne 0) {
    Fail "Command failed ($LASTEXITCODE): $label"
  }
}

Set-Location (Split-Path -Parent $PSScriptRoot)

$projectRef = (Get-Content "supabase/config.toml" | Select-String '^project_id\s*=' | ForEach-Object { $_.Line.Split('"')[1] }) | Select-Object -First 1
if (-not $projectRef) { Fail "Could not read project_id from supabase/config.toml" }

if (-not $env:SUPABASE_ACCESS_TOKEN) { Fail "SUPABASE_ACCESS_TOKEN is not set. Set it and restart your terminal/Cursor." }
if (-not $env:SUPABASE_DB_PASSWORD) { Fail "SUPABASE_DB_PASSWORD is not set. Set it to your Supabase project Postgres password." }

Write-Host "Deploying Supabase backend for project: $projectRef"

Write-Host ""
Run "Linking project..." "npx -y supabase@latest link --project-ref $projectRef --yes"

Write-Host ""
Run "Pushing DB migrations (dry-run)..." "npx -y supabase@latest db push --linked --yes --dry-run --password $env:SUPABASE_DB_PASSWORD"

Write-Host ""
Run "Applying DB migrations..." "npx -y supabase@latest db push --linked --yes --password $env:SUPABASE_DB_PASSWORD"

Write-Host ""
Write-Host "Deploying Edge Functions..."

$noVerifyJwt = @('stripe-webhook','auto-attendance')
$fnDirs = Get-ChildItem "supabase/functions" -Directory | Select-Object -ExpandProperty Name
foreach ($fn in $fnDirs) {
  $extra = ""
  if ($noVerifyJwt -contains $fn) { $extra = " --no-verify-jwt" }
  Run ("Deploying Function: " + $fn + "...") ("npx -y supabase@latest functions deploy " + $fn + " --project-ref " + $projectRef + " --use-api" + $extra)
}

Write-Host ""
Write-Host "✅ Backend/db deploy complete."


