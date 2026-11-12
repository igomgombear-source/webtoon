# 그림 용량 최적화 (설치할 것 없음: PowerShell 5.1 + Edge/Chrome)
#
#   powershell -ExecutionPolicy Bypass -File tools\qa\optimize.ps1            # 후보만 찾아 out\optimized\ 에 만들고 표로 보여 줌 (원본 그대로)
#   powershell -ExecutionPolicy Bypass -File tools\qa\optimize.ps1 -Apply     # 기준을 통과한 파일만 원본 자리에 덮어씀
#
# 후보
#   1) 컷에서 쓰는 무손실 WebP(VP8L) — 같은 해상도의 고품질 손실 WebP 로 (보통 70~80% 줄어듦)
#   2) 필요한 최대 폭의 2배보다 큰 그림 — 필요 폭 × 1.25 로 줄임
#      필요 폭 = 레이어 가로 % × 본문 최대 720px × 픽셀 밀도 2. 휴대폰(430px × 3 = 1290px)보다 크므로 어떤 기기에서도 화면보다 작아지지 않는다
# 기준: 원본과의 차이 PSNR 42dB 이상 (품질 0.92 → 0.95 → 0.98 순서로 시도), 알파(투명도) 오차 0. 통과 못 하면 원본 유지.
# -Exclude 의 경로(기본: 학생 그림·학생 완성 컷)는 건드리지 않는다. 크기가 바뀐 인물 그림은 data/characters.js 의 size 를 직접 고친다.
param(
  [switch]$Apply,
  [string[]]$Exclude = @('assets/characters/student/', 'assets/cuts/ep01/33.webp', 'assets/cuts/ep01/40-rehearsal.webp', 'assets/cuts/ep01/41-dismissal.webp'),
  [double]$MinPsnr = 42,
  [int]$Port = 8768,
  [string]$Browser = ''
)
$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}
$Exclude = @($Exclude | ForEach-Object { $_ -split ',' } | Where-Object { $_ })
$Repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Out = Join-Path $PSScriptRoot 'out'; $Opt = Join-Path $Out 'optimized'
New-Item -ItemType Directory -Force $Opt | Out-Null
$utf8 = New-Object Text.UTF8Encoding($false)
if (-not $Browser) {
  $Browser = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
               "$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe") |
             Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $Browser) { Write-Output 'Edge 또는 Chrome 을 찾지 못했습니다.'; exit 2 }

$server = Start-Process powershell -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSScriptRoot\serve.ps1`"", '-Port', $Port) -WindowStyle Hidden -PassThru
function Run-Page([string]$query, [string[]]$wait) {
  foreach ($w in $wait) { Remove-Item (Join-Path $Out $w) -ErrorAction SilentlyContinue }
  $prof = Join-Path $env:TEMP ('webtoon-opt-' + [guid]::NewGuid().ToString('N'))
  $p = Start-Process $Browser -ArgumentList @('--headless=new', '--no-first-run', '--disable-extensions', "--user-data-dir=`"$prof`"", "http://localhost:$Port/tools/qa/optimize.html?$query") -PassThru
  $t0 = Get-Date
  while (@($wait | Where-Object { -not (Test-Path (Join-Path $Out $_)) }).Count -and ((Get-Date) - $t0).TotalSeconds -lt 90) { Start-Sleep -Milliseconds 300 }
  Start-Sleep -Milliseconds 300
  cmd /c "taskkill /T /F /PID $($p.Id) >nul 2>nul"; Remove-Item -Recurse -Force $prof -ErrorAction SilentlyContinue
}
try {
  for ($i = 0; $i -lt 50; $i++) { Start-Sleep -Milliseconds 200; try { $null = Invoke-WebRequest -UseBasicParsing "http://localhost:$Port/tools/qa/optimize.html" -TimeoutSec 2; break } catch {} }
  Run-Page 'mode=plan' @('result.json')
  $plan = [IO.File]::ReadAllText((Join-Path $Out 'result.json'), $utf8) | ConvertFrom-Json
  $rows = @()
  foreach ($f in $plan) {
    if (@($Exclude | Where-Object { $f.path.StartsWith($_) }).Count) { continue }
    $width = 0
    if (-not $f.cover -and $f.w -gt $f.needPx * 2) { $width = [int][math]::Ceiling($f.needPx * 1.25) }
    if ($f.kind -ne 'VP8L' -and -not $width) { continue }
    $done = $null
    foreach ($q in 0.92, 0.95, 0.98) {
      $qs = "mode=encode&src=$([Uri]::EscapeDataString($f.path))&q=$q" + $(if ($width) { "&w=$width" } else { '' })
      Run-Page $qs @('result.json', 'baseline.json')
      $m = [IO.File]::ReadAllText((Join-Path $Out 'baseline.json'), $utf8) | ConvertFrom-Json
      if ($m.psnr -ge $MinPsnr -and $m.alphaMaxErr -eq 0) { $done = $m; break }
    }
    $name = $f.path -replace '[\\/]', '__'
    if ($done) { Copy-Item (Join-Path $Out 'result.json') (Join-Path $Opt $name) -Force }
    $rows += [pscustomobject]@{ path = $f.path; before = $f.bytes; after = $(if ($done) { $done.bytes } else { $f.bytes }); from = "$($f.w)x$($f.h)"; to = $(if ($done) { $done.to } else { '-' }); q = $(if ($done) { $done.q } else { '-' }); psnr = $(if ($done) { $done.psnr } else { '실패' }); file = $name; ok = [bool]$done }
  }
} finally {
  if ($server) { cmd /c "taskkill /T /F /PID $($server.Id) >nul 2>nul" }
}
$rows | Format-Table @{ n = '그림'; e = { $_.path } }, @{ n = '전'; e = { '{0:N0}KB' -f ($_.before / 1KB) } }, @{ n = '후'; e = { '{0:N0}KB' -f ($_.after / 1KB) } }, @{ n = '크기'; e = { "$($_.from) → $($_.to)" } }, q, psnr -AutoSize | Out-String -Width 200 | Write-Output
$saved = ($rows | Where-Object ok | Measure-Object -Property before -Sum).Sum - ($rows | Where-Object ok | Measure-Object -Property after -Sum).Sum
Write-Output ("후보 {0}개 · 통과 {1}개 · 줄어든 용량 {2:N2}MB" -f $rows.Count, @($rows | Where-Object ok).Count, ($saved / 1MB))
if ($Apply) {
  foreach ($r in ($rows | Where-Object ok)) { Copy-Item (Join-Path $Opt $r.file) (Join-Path $Repo ($r.path -replace '/', '\')) -Force; Write-Output "적용: $($r.path) $($r.from) → $($r.to)" }
  Write-Output '크기가 바뀐 인물 그림은 data/characters.js 의 size 를 고친 뒤 run.ps1 로 검수하세요.'
} else { Write-Output "결과 파일: tools/qa/out/optimized/ (원본은 그대로). 적용하려면 -Apply" }
