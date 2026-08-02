# Flock Yeah QC checklist
# Usage: powershell -File scripts/qc-check.ps1
$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
if (-not (Test-Path (Join-Path $Root "hens.html"))) {
  $Root = (Get-Location).Path
}
Set-Location $Root

$fail = 0
$pass = 0

function Check {
  param([string]$Name, [bool]$Ok, [string]$Detail)
  if ($Ok) {
    Write-Host ("PASS  " + $Name) -ForegroundColor Green
    $script:pass++
  } else {
    Write-Host ("FAIL  " + $Name + " -- " + $Detail) -ForegroundColor Red
    $script:fail++
  }
}

Write-Host ""
Write-Host ("=== Flock Yeah QC ===")
Write-Host ("Root: " + $Root)
Write-Host ""

$required = @(
  "hens.html","whos-who.html","herd.html","shop.html","ops.html","checkout-success.html","index.html",
  "css/hens.css",
  "js/flock-data.js","js/hen-voice.js","js/hen-cam.js","js/lineup.js","js/shop.js","js/stripe-config.js","js/solforge-bridge.js",
  "CHAT-HANDOFF.md","README.md","SECURITY.md","TRANSFER.md",
  "designs/plasma/henrietta-plasma.svg","designs/plasma/cluck-plasma.svg","designs/plasma/flock-yeah-mark.svg",
  "designs/print/logos/flock-yeah-wordmark.svg","designs/print/logos/flock-yeah-badge.svg",
  "assets/hens/henrietta.svg","assets/hens/cluck.svg","assets/hens/clucky.svg",
  "assets/horses/lincoln.svg","assets/horses/tia.svg"
)
foreach ($f in $required) {
  Check -Name ("file:" + $f) -Ok (Test-Path $f) -Detail "missing"
}

$css = Get-Content "css/hens.css" -Raw
Check -Name "color:emerald" -Ok ($css -match "#047857") -Detail "missing #047857"
Check -Name "color:cream" -Ok ($css -match "#f7f4ef") -Detail "missing #f7f4ef"
Check -Name "color:gold" -Ok ($css -match "#d97706") -Detail "missing #d97706"
Check -Name "color:charcoal" -Ok ($css -match "#1a1816") -Detail "missing #1a1816"

$data = Get-Content "js/flock-data.js" -Raw
foreach ($id in @("henrietta","scratch","cluck","daisy","pepper","maple")) {
  Check -Name ("hen:" + $id) -Ok ($data -match ("id:\s*`"" + $id + "`"")) -Detail "hen id missing"
}
Check -Name "no-cluck-norris-id" -Ok (-not ($data -match 'id:\s*"cluck-norris"')) -Detail "legacy id present"
foreach ($id in @("lincoln","grace","winchester","tia")) {
  Check -Name ("horse:" + $id) -Ok ($data -match ("id:\s*`"" + $id + "`"")) -Detail "horse id missing"
}
Check -Name "no-buster" -Ok (-not ($data -match "Buster|buster")) -Detail "Buster should not be in roster"
Check -Name "no-thunder-horse" -Ok (-not ($data -match 'id:\s*"thunder"|name:\s*"Thunder"')) -Detail "Thunder horse should not be in roster"

$plasmaRefs = Select-String -Path "js\*.js","ops.html","README.md" -Pattern "designs/plasma" -Quiet
Check -Name "path:designs/plasma refs" -Ok ([bool]$plasmaRefs) -Detail "missing designs/plasma refs"
$stalePrint = Select-String -Path "js\*.js" -Pattern "svg=print/|under print/" -Quiet
Check -Name "no stale print/ in JS" -Ok (-not $stalePrint) -Detail "stale print/ path in JS"
Check -Name "thesis:no ALPR" -Ok ($data -match "ALPR") -Detail "thesis missing"
Check -Name "brand tagline" -Ok ($data -match "Keep flocks for the birds") -Detail "tagline missing"

$hens = Get-Content "hens.html" -Raw
Check -Name "hens:commentary" -Ok ($hens -match 'id="cam-commentary"') -Detail "cam-commentary missing"
Check -Name "hens:stage-photo" -Ok ($hens -match 'id="stage-photo"') -Detail "stage-photo missing"
Check -Name "hens:scripts" -Ok (($hens -match "flock-data.js") -and ($hens -match "hen-cam.js") -and ($hens -match "hen-voice.js")) -Detail "script tags incomplete"

$herd = Get-Content "herd.html" -Raw
Check -Name "herd:lineup mode" -Ok ($herd -match 'data-lineup="horses"') -Detail "herd missing data-lineup=horses"
Check -Name "herd:lineup.js" -Ok ($herd -match "lineup.js") -Detail "herd missing lineup.js"

$secretHit = Select-String -Path "js\*.js","*.html","*.md" -Pattern "sk_live_|sk_test_|BEGIN RSA" -Quiet
Check -Name "no secret-looking keys" -Ok (-not $secretHit) -Detail "possible secret material found"

$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
  foreach ($js in Get-ChildItem "js\*.js") {
    & node --check $js.FullName 2>$null | Out-Null
    Check -Name ("syntax:" + $js.Name) -Ok ($LASTEXITCODE -eq 0) -Detail "node --check failed"
  }
} else {
  Write-Host "SKIP  node --check (node not installed)" -ForegroundColor Yellow
}

$remote = git remote get-url origin 2>$null
Check -Name "git:origin flock repo" -Ok ($remote -match "Chicken-Coop-Commentary|flock-yeah") -Detail ("origin=" + $remote)

Write-Host ""
Write-Host ("=== Result: " + $pass + " passed, " + $fail + " failed ===")
Write-Host ""
if ($fail -gt 0) { exit 1 } else { exit 0 }
