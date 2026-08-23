# Flock Yeah local development preview
# Usage: powershell -File scripts/dev.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
if (-not (Test-Path (Join-Path $Root "hens.html"))) {
  $Root = (Get-Location).Path
}
Set-Location $Root

$Port = 8080
if ($env:FLOCK_DEV_PORT) { $Port = [int]$env:FLOCK_DEV_PORT }
$Url = "http://localhost:$Port/hens.html"

$existing = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Port $Port already in use — opening browser to existing server."
  Start-Process $Url
  exit 0
}

Write-Host ""
Write-Host "Flock Yeah DEV"
Write-Host "  Root: $Root"
Write-Host "  URL:  $Url"
Write-Host "  Edit files, save, then refresh the browser."
Write-Host "  Production = push to main (after scripts/qc-check.ps1)."
Write-Host "  Ctrl+C to stop the server."
Write-Host ""

Start-Job -ScriptBlock {
  param($u)
  Start-Sleep -Seconds 1
  Start-Process $u
} -ArgumentList $Url | Out-Null

if (Get-Command node -ErrorAction SilentlyContinue) {
  # Custom server: static files + /cam/snap proxy (token auth via cam-secrets.json)
  $env:FLOCK_DEV_PORT = "$Port"
  node (Join-Path $Root "scripts\dev-server.mjs")
} else {
  Write-Host "Node not found — static only (no /cam/snap proxy). Install Node for live Nest Cam A."
  python -m http.server $Port
}
