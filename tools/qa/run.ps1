# 1화 자동 검수 한 번에 돌리기 (Windows, 설치할 것 없음: PowerShell 5.1 + Edge 또는 Chrome + Git)
#
#   powershell -ExecutionPolicy Bypass -File tools\qa\run.ps1
#   powershell -ExecutionPolicy Bypass -File tools\qa\run.ps1 -Widths 360,375,430
#   powershell -ExecutionPolicy Bypass -File tools\qa\run.ps1 -UpdateBaseline     # 기준 파일 다시 만들기 (이야기 수정이 승인됐을 때만)
#
# 하는 일
#   1) git 으로 파일 목록(out/manifest.json)과 main 브랜치 데이터(out/<ep>.main.js)를 꺼낸다
#   2) 로컬 서버(serve.ps1)를 켜고 헤드리스 브라우저로 tools/qa/qa.html?auto=1 을 연다 (실시간, 지연 로딩도 실제처럼)
#   3) 결과를 out/report.json, out/report.txt 로 저장하고 실패·확인 항목을 출력한다
# 종료 코드: 0 = 실패 없음, 1 = 실패 있음, 2 = 검수를 끝까지 못 돌림
param(
  [string]$Ep = 'ep01',
  [int]$Port = 8765,
  [string[]]$Widths = @(),
  [string[]]$Skip = @(),
  [string]$MainRef = '',
  [switch]$UpdateBaseline,
  [switch]$ShowInfo,
  [string]$Browser = '',
  [int]$TimeoutSec = 900
)
$ErrorActionPreference = 'Stop'
# powershell -File 로 부르면 '-Widths 360,375' 가 문자열 하나로 들어오므로 쉼표로 나눈다
$Widths = @($Widths | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$Skip = @($Skip | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}
$Repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Out = Join-Path $PSScriptRoot 'out'
New-Item -ItemType Directory -Force $Out | Out-Null
$utf8 = New-Object Text.UTF8Encoding($false)

function Git-ToFile([string]$gitArgs, [string]$file) {
  # cmd 리다이렉트는 바이트 그대로 저장한다 (PowerShell 파이프는 한글을 깨뜨릴 수 있음)
  cmd /c "git -C `"$Repo`" -c core.quotepath=off $gitArgs > `"$file`" 2>nul"
  return ($LASTEXITCODE -eq 0)
}

# 1) 파일 목록과 main 데이터
$tmp = Join-Path $Out 'git.tmp'
$null = Git-ToFile 'ls-files' $tmp; $tracked = @([IO.File]::ReadAllLines($tmp, $utf8) | Where-Object { $_ })
$null = Git-ToFile 'ls-files --others --exclude-standard' $tmp; $untracked = @([IO.File]::ReadAllLines($tmp, $utf8) | Where-Object { $_ -and -not $_.StartsWith('tools/qa/out/') })
$null = Git-ToFile 'rev-parse --short HEAD' $tmp; $commit = ([IO.File]::ReadAllText($tmp)).Trim()
$null = Git-ToFile 'rev-parse --abbrev-ref HEAD' $tmp; $branch = ([IO.File]::ReadAllText($tmp)).Trim()
Remove-Item $tmp -ErrorAction SilentlyContinue
if (-not $tracked.Count) { Write-Output 'git 파일 목록을 읽지 못했습니다 (git 설치와 저장소 위치 확인).'; exit 2 }
$manifest = @{ commit = "$branch@$commit"; tracked = $tracked; untracked = $untracked } | ConvertTo-Json -Depth 3 -Compress
[IO.File]::WriteAllText((Join-Path $Out 'manifest.json'), $manifest, $utf8)

$mainFile = Join-Path $Out "$Ep.main.js"
Remove-Item $mainFile -ErrorAction SilentlyContinue
$refs = if ($MainRef) { @($MainRef) } else { @('origin/main', 'main') }
foreach ($r in $refs) { if (Git-ToFile "show ${r}:data/$Ep.js" $mainFile) { Write-Output "main 원본: $r"; break } else { Remove-Item $mainFile -ErrorAction SilentlyContinue } }

# 2) 브라우저 찾기
if (-not $Browser) {
  $cands = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
             "$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
             "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe")
  $Browser = $cands | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
}
if (-not $Browser) { Write-Output 'Edge 또는 Chrome 을 찾지 못했습니다. -Browser 로 경로를 지정하세요.'; exit 2 }

$resultFile = Join-Path $Out ($(if ($UpdateBaseline) { 'baseline.json' } else { 'result.json' }))
Remove-Item $resultFile -ErrorAction SilentlyContinue
$server = Start-Process powershell -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSScriptRoot\serve.ps1`"", '-Port', $Port) -WindowStyle Hidden -PassThru
$profileDir = Join-Path $env:TEMP ("webtoon-qa-" + [guid]::NewGuid().ToString('N'))
$browserProc = $null
try {
  $ok = $false
  for ($i = 0; $i -lt 50 -and -not $ok; $i++) {
    Start-Sleep -Milliseconds 200
    try { $null = Invoke-WebRequest -UseBasicParsing "http://localhost:$Port/tools/qa/qa.html" -TimeoutSec 2; $ok = $true } catch {}
  }
  if (-not $ok) { Write-Output "서버를 켜지 못했습니다 (포트 $Port 사용 중이면 -Port 로 바꾸세요)."; exit 2 }

  $q = "ep=$Ep&" + $(if ($UpdateBaseline) { 'baseline=1' } else { 'auto=1' })
  if ($Widths.Count) { $q += '&widths=' + ($Widths -join ',') }
  if ($Skip.Count) { $q += '&skip=' + ($Skip -join ',') }
  $url = "http://localhost:$Port/tools/qa/qa.html?$q"
  Write-Output "검수 시작: $branch@$commit  $url"
  $browserProc = Start-Process $Browser -ArgumentList @('--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--window-size=1280,1800', "--user-data-dir=`"$profileDir`"", $url) -PassThru
  $t0 = Get-Date
  while (-not (Test-Path $resultFile)) {
    if (((Get-Date) - $t0).TotalSeconds -gt $TimeoutSec) { Write-Output "시간 초과 ($TimeoutSec 초)."; exit 2 }
    Start-Sleep -Seconds 1
  }
  Start-Sleep -Milliseconds 500
} finally {
  if ($browserProc) { cmd /c "taskkill /T /F /PID $($browserProc.Id) >nul 2>nul" }
  if ($server) { cmd /c "taskkill /T /F /PID $($server.Id) >nul 2>nul" }
  Start-Sleep -Milliseconds 300
  Remove-Item -Recurse -Force $profileDir -ErrorAction SilentlyContinue
}

if ($UpdateBaseline) {
  Copy-Item $resultFile (Join-Path $PSScriptRoot "$Ep.baseline.json") -Force
  Write-Output "기준 파일을 다시 만들었습니다: tools/qa/$Ep.baseline.json ($branch@$commit)"
  exit 0
}

# 3) 결과 정리
$json = [IO.File]::ReadAllText($resultFile, $utf8)
[IO.File]::WriteAllText((Join-Path $Out 'report.json'), $json, $utf8)
$rep = $json | ConvertFrom-Json
$name = @{ fail = '실패'; warn = '확인'; info = '참고'; ok = '통과' }
$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("1화 자동 검수  $($rep.commit)  $($rep.finishedAt)")
$lines.Add("실패 $($rep.summary.fail) · 확인 $($rep.summary.warn) · 참고 $($rep.summary.info) · 통과 $($rep.summary.ok)")
foreach ($s in $rep.sections) {
  $lines.Add(''); $lines.Add("[$($s.name)]")
  foreach ($it in $s.items) { $lines.Add(("  {0}  {1} — {2}" -f $name[$it.level], $it.where, $it.msg)) }
}
[IO.File]::WriteAllLines((Join-Path $Out 'report.txt'), $lines, $utf8)
$show = if ($ShowInfo) { 'fail', 'warn', 'info', 'ok' } else { 'fail', 'warn', 'ok' }
Write-Output $lines[0]; Write-Output $lines[1]
foreach ($s in $rep.sections) {
  $items = @($s.items | Where-Object { $show -contains $_.level })
  if ($items.Count) { Write-Output ''; Write-Output "[$($s.name)]"; foreach ($it in $items) { Write-Output ("  {0}  {1} — {2}" -f $name[$it.level], $it.where, $it.msg) } }
}
Write-Output ''; Write-Output "전체 결과: tools/qa/out/report.txt (참고 항목 포함), tools/qa/out/report.json"
if ($rep.summary.fail -gt 0) { exit 1 } else { exit 0 }
