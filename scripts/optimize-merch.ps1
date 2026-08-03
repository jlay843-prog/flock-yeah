# Generate WebP thumbs (~480px) + full (~960px) for shop merch PNGs.
# Requires ffmpeg on PATH. Run from repo root or any cwd.
$ErrorActionPreference = "Stop"
$root = Join-Path (Split-Path $PSScriptRoot -Parent) "assets\merch"
$thumbs = Join-Path $root "thumbs"
$full = Join-Path $root "full"
New-Item -ItemType Directory -Force -Path $thumbs, $full | Out-Null
$ff = (Get-Command ffmpeg -ErrorAction Stop).Source
$files = Get-ChildItem $root -File | Where-Object { $_.Extension -match '\.(png|jpe?g)$' }
Write-Host "Optimizing $($files.Count) merch images under $root"
$i = 0
foreach ($f in $files) {
  $i++
  $base = [IO.Path]::GetFileNameWithoutExtension($f.Name)
  $tOut = Join-Path $thumbs "$base.webp"
  $fOut = Join-Path $full "$base.webp"
  & $ff -y -hide_banner -loglevel error -i $f.FullName -vf "scale='min(480,iw)':-1" -c:v libwebp -quality 72 -compression_level 5 $tOut
  & $ff -y -hide_banner -loglevel error -i $f.FullName -vf "scale='min(960,iw)':-1" -c:v libwebp -quality 80 -compression_level 5 $fOut
  $tKb = [math]::Round((Get-Item $tOut).Length / 1KB, 1)
  $fKb = [math]::Round((Get-Item $fOut).Length / 1KB, 1)
  $oKb = [math]::Round($f.Length / 1KB, 1)
  Write-Host ("{0,2}/{1} {2}: {3}KB -> thumb {4}KB full {5}KB" -f $i, $files.Count, $base, $oKb, $tKb, $fKb)
}
Write-Host "Done. thumbs=$thumbs full=$full"
