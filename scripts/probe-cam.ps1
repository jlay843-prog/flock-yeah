# Probe Flock Yeah LAN test camera
# Usage: powershell -File scripts/probe-cam.ps1 [-HostIp 192.168.68.116]
param([string]$HostIp = "192.168.68.116")

Write-Host ""
Write-Host ("=== Probe " + $HostIp + " ===")
$ping = Test-Connection -ComputerName $HostIp -Count 2 -Quiet
Write-Host ("Ping: " + $ping)

$neigh = Get-NetNeighbor -IPAddress $HostIp -ErrorAction SilentlyContinue
if ($neigh) {
  Write-Host ("MAC:  " + $neigh.LinkLayerAddress)
  if ($neigh.LinkLayerAddress -match "^EC-71-DB") {
    Write-Host "Vendor hint: Reolink (EC-71-DB)"
  }
}

$ports = @(80, 443, 554, 8000, 8080, 8554, 9000, 8001)
foreach ($p in $ports) {
  $ok = Test-NetConnection -ComputerName $HostIp -Port $p -WarningAction SilentlyContinue -InformationLevel Quiet
  $state = if ($ok) { "OPEN" } else { "closed" }
  Write-Host ("Port {0,-5} {1}" -f $p, $state)
}

Write-Host ""
Write-Host "Browser needs HTTP snapshot (80) and/or RTSP (554) then HLS proxy."
Write-Host "Port 9000 alone = Reolink app/client protocol (not usable in hens.html)."
Write-Host "See CAM-SETUP.md"
Write-Host ""
