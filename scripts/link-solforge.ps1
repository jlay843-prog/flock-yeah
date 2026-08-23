# Link Flock Yeah <-> SolForge without manual paste of payment handles.
param(
  [string]$SolforgeBase = "",
  [string]$FarmSecret = "",
  [string]$SolforgeEnvPath = "",
  [switch]$FromIntegrationWorktree
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$outSecrets = Join-Path $root "solforge-secrets.json"

if ($FromIntegrationWorktree -or -not $SolforgeEnvPath) {
  $candidate = "C:\Users\jlay\Grok\solforge-flock-integration\.env"
  if (Test-Path $candidate) { $SolforgeEnvPath = $candidate }
}

function Read-EnvFile($path) {
  $map = @{}
  if (-not (Test-Path $path)) { return $map }
  Get-Content $path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
      $k = $Matches[1]
      $v = $Matches[2].Trim().Trim('"').Trim("'")
      $map[$k] = $v
    }
  }
  return $map
}

$envMap = @{}
if ($SolforgeEnvPath -and (Test-Path $SolforgeEnvPath)) {
  $envMap = Read-EnvFile $SolforgeEnvPath
  Write-Host "Read SolForge env from: $SolforgeEnvPath" -ForegroundColor DarkGray
}

if (-not $SolforgeBase) {
  if ($envMap["PUBLIC_BASE_URL"]) { $SolforgeBase = $envMap["PUBLIC_BASE_URL"] }
  else { $SolforgeBase = "https://solforge.lonetreeacres.com" }
}
$SolforgeBase = $SolforgeBase.TrimEnd("/")

if (-not $FarmSecret) {
  if ($envMap["FLOCK_FARM_SECRET"]) { $FarmSecret = $envMap["FLOCK_FARM_SECRET"] }
  elseif ($envMap["CRON_SECRET"]) { $FarmSecret = $envMap["CRON_SECRET"] }
}

if (-not $FarmSecret) {
  $bytes = New-Object byte[] 24
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $FarmSecret = -join ($bytes | ForEach-Object { $_.ToString("x2") })
  Write-Host "Generated new FLOCK_FARM_SECRET for local solforge-secrets.json" -ForegroundColor Yellow
}

$payload = @{
  baseUrl    = $SolforgeBase
  farmSecret = $FarmSecret
} | ConvertTo-Json
Set-Content -Path $outSecrets -Value $payload -Encoding UTF8
Write-Host "Wrote $outSecrets (gitignored)" -ForegroundColor Green
Write-Host "  baseUrl=$SolforgeBase"
Write-Host "  farmSecret=SET (hidden)"

try {
  $rails = Invoke-RestMethod -Uri ($SolforgeBase + "/api/payments/rails") -TimeoutSec 15
  $pp = if ($rails.paypal.configured) { "yes (" + $rails.paypal.me + ")" } else { "no" }
  $vn = if ($rails.venmo.configured) { "yes (" + $rails.venmo.username + ")" } else { "no" }
  Write-Host ("Rails API OK - PayPal: {0}  Venmo: {1}" -f $pp, $vn) -ForegroundColor Green
  Write-Host "Flock pay-config.js auto-loads these in the browser." -ForegroundColor Green
} catch {
  Write-Host ("Rails API not reachable yet at {0}/api/payments/rails" -f $SolforgeBase) -ForegroundColor Yellow
  Write-Host ("  " + $_.Exception.Message) -ForegroundColor DarkGray
}

try {
  $headers = @{ Authorization = ("Bearer " + $FarmSecret) }
  $r = Invoke-WebRequest -Uri ($SolforgeBase + "/api/farm/flock-consume") -Headers $headers -UseBasicParsing -TimeoutSec 15
  if ($r.StatusCode -eq 200) {
    Write-Host "flock-consume auth OK" -ForegroundColor Green
  }
} catch {
  $code = "?"
  if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
  Write-Host ("flock-consume probe: HTTP {0} (ok if SolForge not up yet)" -f $code) -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Next: npm run dev then open hens.html" -ForegroundColor Cyan
