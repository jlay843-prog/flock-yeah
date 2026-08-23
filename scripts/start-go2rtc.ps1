# Start go2rtc for Nest Cam A HLS (reads cam-secrets.json - never commit the generated yaml).
# Usage (from repo root):
#   powershell -File scripts\start-go2rtc.ps1
# Then hard-refresh hens.html (mode: hls in cam-config.local.js).
param(
  [int]$ApiPort = 1984,
  [string]$StreamName = "nest-a"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$exe = Join-Path $Root "tools\go2rtc\go2rtc.exe"
if (-not (Test-Path $exe)) {
  throw "Missing go2rtc.exe under tools/go2rtc/ - download go2rtc_win64.zip (see CAM-SETUP.md)."
}

$secretsPath = Join-Path $Root "cam-secrets.json"
if (-not (Test-Path $secretsPath)) {
  throw "Missing cam-secrets.json - run scripts/link-cam.ps1 first."
}
$secrets = (Get-Content $secretsPath -Raw).Trim([char]0xFEFF) | ConvertFrom-Json
$hostIp = $secrets.host
$user = [uri]::EscapeDataString([string]$secrets.user)
$pass = [uri]::EscapeDataString([string]$secrets.password)
$channel = if ($null -ne $secrets.channel) { [int]$secrets.channel } else { 0 }
$preview = "h264Preview_0$($channel + 1)_sub"
$rtsp = "rtsp://${user}:${pass}@${hostIp}:554/${preview}"

$cfgDir = Join-Path $Root "tools\go2rtc"
$yamlPath = Join-Path $cfgDir "go2rtc.yaml"
$yaml = @"
# GENERATED - gitignored. From scripts/start-go2rtc.ps1
api:
  listen: ":$ApiPort"
rtsp:
  listen: ":8554"
streams:
  ${StreamName}:
    - $rtsp
"@
[System.IO.File]::WriteAllText($yamlPath, $yaml, [System.Text.UTF8Encoding]::new($false))
Write-Host "Wrote $yamlPath (stream=$StreamName host=$hostIp)"

$busy = Get-NetTCPConnection -LocalPort $ApiPort -State Listen -ErrorAction SilentlyContinue
if ($busy) {
  Write-Host "Port $ApiPort already in use - assuming go2rtc is running."
  Write-Host "HLS: http://127.0.0.1:$ApiPort/api/stream.m3u8?src=$StreamName"
  exit 0
}

Write-Host "Starting go2rtc on :$ApiPort ..."
Write-Host "HLS: http://127.0.0.1:$ApiPort/api/stream.m3u8?src=$StreamName"
Write-Host "UI:  http://127.0.0.1:$ApiPort/"
Start-Process -FilePath $exe -ArgumentList "-c", $yamlPath -WorkingDirectory $cfgDir -WindowStyle Minimized
Start-Sleep -Seconds 2
try {
  $r = Invoke-WebRequest "http://127.0.0.1:$ApiPort/api/streams" -UseBasicParsing -TimeoutSec 5
  Write-Host "go2rtc API OK ($($r.StatusCode))"
} catch {
  Write-Host "WARN: go2rtc API not responding yet - check the minimized window."
}
