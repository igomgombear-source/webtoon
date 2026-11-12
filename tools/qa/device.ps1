# 1화 모바일 측정 (휴대폰 화면·CPU·통신 속도 흉내) — 설치할 것 없음: PowerShell 5.1 + Edge/Chrome + Git
#
#   powershell -ExecutionPolicy Bypass -File tools\qa\device.ps1                 # 기본 기기 5종 측정
#   powershell -ExecutionPolicy Bypass -File tools\qa\device.ps1 -Profiles iphone-se,galaxy-a
#   powershell -ExecutionPolicy Bypass -File tools\qa\device.ps1 -Shots           # + 시각 검수용 컷별 캡처
#   powershell -ExecutionPolicy Bypass -File tools\qa\device.ps1 -NoHas           # + :has() 미지원 브라우저 흉내 비교
#
# Chromium(Edge/Chrome) 개발자 도구 프로토콜로 휴대폰 화면 크기·픽셀 밀도·터치·User-Agent·CPU 감속·통신 속도를 흉내 낸 뒤
# tools/qa/device-probe.js 를 뷰어 안에서 돌려 로딩·스크롤·메모리·잘림을 잰다.
# 주의: 엔진은 Chromium 하나뿐이다. iOS Safari(WebKit)·실제 휴대폰 결과가 아니다. 숫자는 기기 간 비교와 회귀 확인용.
#
# 결과: tools/qa/out/device-report.json, device-report.txt, (옵션) out/shots/<기기>/cut-NN.png, out/shots/no-has/
param(
  [string[]]$Profiles = @(),
  [int]$Port = 8766,
  [int]$DebugPort = 9333,
  [int]$Speed = 1200,
  [switch]$Shots,
  [string]$ShotProfile = 'iphone-se',
  [switch]$NoHas,
  [string]$Ep = 'ep01',
  [string]$Browser = ''
)
$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}
$Repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Out = Join-Path $PSScriptRoot 'out'
New-Item -ItemType Directory -Force $Out | Out-Null
$utf8 = New-Object Text.UTF8Encoding($false)

# ---------- 기기 프로필 ----------
# cpu: Chromium CPU 감속 배수 (이 PC 대비). net: 아래 통신 프로필
$iosUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
$andUA = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36'
$all = [ordered]@{
  'iphone-se'  = @{ label = 'iPhone SE 급 (375×667 @2x)';       w = 375; h = 667; dpr = 2;     ua = $iosUA; cpu = 2; net = '4g' }
  'iphone-15'  = @{ label = 'iPhone 15 급 (393×852 @3x)';       w = 393; h = 852; dpr = 3;     ua = $iosUA; cpu = 1; net = '4g' }
  'galaxy-a'   = @{ label = '갤럭시 A 보급형 급 (360×800 @3x)'; w = 360; h = 800; dpr = 3;     ua = $andUA; cpu = 4; net = '4g' }
  'pixel-7'    = @{ label = 'Pixel 7 급 (412×915 @2.625x)';     w = 412; h = 915; dpr = 2.625; ua = $andUA; cpu = 2; net = '4g' }
  'slow-3g'    = @{ label = '느린 통신 시험 (375×667 @2x, 3G)'; w = 375; h = 667; dpr = 2;     ua = $andUA; cpu = 4; net = '3g' }
  'narrow-320' = @{ label = '좁은 화면 (320×568 @2x)';           w = 320; h = 568; dpr = 2;     ua = $andUA; cpu = 2; net = '4g' }
}
$nets = @{
  '4g' = @{ label = '4G (9Mbps, 지연 60ms)';    down = 9.0; up = 1.5; lat = 60 }
  '3g' = @{ label = '3G (1.6Mbps, 지연 300ms)'; down = 1.6; up = 0.75; lat = 300 }
}
# powershell -File 로 부르면 '-Profiles a,b' 가 문자열 하나로 들어오므로 쉼표로 나눈다
$Profiles = @($Profiles | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })
if (-not $Profiles.Count) { $Profiles = @($all.Keys | Where-Object { $_ -ne 'narrow-320' }) }   # narrow-320 은 -Profiles 로 따로
foreach ($p in $Profiles) { if (-not $all.Contains($p)) { Write-Output "알 수 없는 기기: $p (가능: $($all.Keys -join ', '))"; exit 2 } }

# ---------- 브라우저 ----------
if (-not $Browser) {
  $cands = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
             "$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
             "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe")
  $Browser = $cands | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
}
if (-not $Browser) { Write-Output 'Edge 또는 Chrome 을 찾지 못했습니다.'; exit 2 }

# ---------- CDP 클라이언트 ----------
$script:ws = $null; $script:seq = 0
$script:buf = New-Object byte[] 4194304
function Receive-Cdp {
  $ms = New-Object IO.MemoryStream
  do {
    $seg = New-Object 'ArraySegment[byte]' -ArgumentList @(, $script:buf)
    $t = $script:ws.ReceiveAsync($seg, [Threading.CancellationToken]::None)
    if (-not $t.Wait(240000)) { throw '브라우저 응답 없음 (240초)' }
    $r = $t.Result
    $ms.Write($script:buf, 0, $r.Count)
  } while (-not $r.EndOfMessage)
  return [Text.Encoding]::UTF8.GetString($ms.ToArray())
}
function Cdp([string]$method, $params = @{}, [switch]$Raw) {
  $script:seq++; $id = $script:seq
  $json = @{ id = $id; method = $method; params = $params } | ConvertTo-Json -Depth 12 -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $seg = New-Object 'ArraySegment[byte]' -ArgumentList @(, $bytes)
  $script:ws.SendAsync($seg, [Net.WebSockets.WebSocketMessageType]::Text, $true, [Threading.CancellationToken]::None).Wait()
  $prefix = '{"id":' + $id + ','
  while ($true) {
    $txt = Receive-Cdp
    if ($txt.StartsWith($prefix)) {
      if ($txt.Contains('"error":{') -and -not $txt.Contains('"result":')) { throw "CDP $method 실패: $($txt.Substring(0, [Math]::Min(300, $txt.Length)))" }
      if ($Raw) { return $txt }
      return ($txt | ConvertFrom-Json).result
    }
  }
}
function Eval-Js([string]$expr, [int]$timeoutMs = 600000) {
  $r = Cdp 'Runtime.evaluate' @{ expression = $expr; awaitPromise = $true; returnByValue = $true; timeout = $timeoutMs }
  if ($r.exceptionDetails) { throw "페이지 스크립트 오류: $($r.exceptionDetails.exception.description)" }
  return $r.result.value
}
function Open-Page([string]$url) {
  $null = Cdp 'Page.navigate' @{ url = 'about:blank' }
  $null = Cdp 'Network.clearBrowserCache'
  $null = Cdp 'Page.navigate' @{ url = $url }
  for ($i = 0; $i -lt 300; $i++) {
    Start-Sleep -Milliseconds 200
    try { if (Eval-Js "document.readyState === 'complete' && !!document.querySelector('section[id^=cut-]')" 5000) { return } } catch {}
  }
  throw "페이지가 열리지 않음: $url"
}
function Set-Device($d, $n) {
  $null = Cdp 'Emulation.setDeviceMetricsOverride' @{ width = $d.w; height = $d.h; deviceScaleFactor = $d.dpr; mobile = $true; screenWidth = $d.w; screenHeight = $d.h }
  $null = Cdp 'Emulation.setUserAgentOverride' @{ userAgent = $d.ua }
  $null = Cdp 'Emulation.setTouchEmulationEnabled' @{ enabled = $true; maxTouchPoints = 5 }
  $null = Cdp 'Emulation.setCPUThrottlingRate' @{ rate = $d.cpu }
  $null = Cdp 'Network.emulateNetworkConditions' @{ offline = $false; latency = $n.lat; downloadThroughput = [int]($n.down * 125000); uploadThroughput = [int]($n.up * 125000) }
}
function Save-Shot($clip, [string]$file) {
  $txt = Cdp 'Page.captureScreenshot' @{ format = 'png'; captureBeyondViewport = $true; clip = $clip } -Raw
  $m = [regex]::Match($txt, '"data":"([^"]+)"')
  if ($m.Success) { [IO.File]::WriteAllBytes($file, [Convert]::FromBase64String($m.Groups[1].Value)) }
}
$prepJs = @'
(async function () {
  /* 캡처용: 등장 효과·지연 로딩을 끄고 모든 그림을 다 불러온 뒤 상단 바를 숨긴다 */
  document.querySelectorAll('.reveal').forEach(function (e) { e.classList.add('is-in'); });
  var bar = document.getElementById('topbar'); if (bar) bar.style.display = 'none';
  var imgs = Array.prototype.slice.call(document.images);
  imgs.forEach(function (i) { i.loading = 'eager'; });
  await Promise.all(imgs.map(function (i) { return i.complete ? 0 : new Promise(function (r) { i.onload = i.onerror = r; setTimeout(r, 30000); }); }));
  await Promise.all(imgs.map(function (i) { return i.decode ? i.decode().catch(function () {}) : 0; }));
  await new Promise(function (r) { setTimeout(r, 1700); });
  return JSON.stringify(Array.prototype.map.call(document.querySelectorAll('section[id^=cut-]'), function (s) {
    var b = s.getBoundingClientRect(); return { no: +s.id.slice(4), y: b.top + scrollY, h: b.height, mood: s.getAttribute('data-mood') || '' };
  }));
})()
'@
$stripHasJs = @'
(function () {
  /* :has() 를 모르는 브라우저(iOS Safari 15.3 이하 등)는 :has 가 든 규칙 전체를 버린다 → 같은 상태를 만든다 */
  var n = 0;
  Array.prototype.forEach.call(document.styleSheets, function (sh) {
    var rules; try { rules = sh.cssRules; } catch (e) { return; }
    for (var i = rules.length - 1; i >= 0; i--) { if (rules[i].selectorText && rules[i].selectorText.indexOf(':has(') >= 0) { sh.deleteRule(i); n++; } }
  });
  return n;
})()
'@

# ---------- 실행 ----------
$server = Start-Process powershell -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSScriptRoot\serve.ps1`"", '-Port', $Port) -WindowStyle Hidden -PassThru
$profileDir = Join-Path $env:TEMP ('webtoon-device-' + [guid]::NewGuid().ToString('N'))
$br = $null
$report = [ordered]@{ startedAt = (Get-Date).ToString('s'); engine = ''; profiles = @(); notes = 'Chromium 흉내 측정. iOS Safari·실기기 결과 아님.' }
try {
  for ($i = 0; $i -lt 50; $i++) { Start-Sleep -Milliseconds 200; try { $null = Invoke-WebRequest -UseBasicParsing "http://localhost:$Port/index.html" -TimeoutSec 2; break } catch {} }
  $br = Start-Process $Browser -ArgumentList @('--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    "--remote-debugging-port=$DebugPort", '--remote-allow-origins=*', "--user-data-dir=`"$profileDir`"", '--window-size=500,1000', 'about:blank') -PassThru
  $wsUrl = $null
  for ($i = 0; $i -lt 100 -and -not $wsUrl; $i++) {
    Start-Sleep -Milliseconds 200
    try {
      $targets = (Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:$DebugPort/json/list" -TimeoutSec 2).Content | ConvertFrom-Json
      foreach ($t in $targets) { if ($t.type -eq 'page') { $wsUrl = [string]$t.webSocketDebuggerUrl; break } }   # PS 5.1 은 배열을 한 덩어리로 넘기므로 foreach
    } catch {}
  }
  if (-not $wsUrl) { throw '브라우저 디버깅 포트에 연결하지 못함' }
  $script:ws = New-Object Net.WebSockets.ClientWebSocket
  $script:ws.ConnectAsync([Uri]$wsUrl, [Threading.CancellationToken]::None).Wait()
  $null = Cdp 'Page.enable'; $null = Cdp 'Network.enable'; $null = Cdp 'Performance.enable'; $null = Cdp 'Network.setCacheDisabled' @{ cacheDisabled = $true }
  $report.engine = (Cdp 'Browser.getVersion').product

  $probe = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'device-probe.js'), $utf8)
  $url = "http://localhost:$Port/index.html?device=1#$Ep"
  foreach ($p in $Profiles) {
    $d = $all[$p]; $n = $nets[$d.net]
    Write-Output "측정: $($d.label) · CPU ×$($d.cpu) · $($n.label)"
    Set-Device $d $n
    Open-Page $url
    $res = Eval-Js ($probe.Trim() + "({ speed: $Speed })") | ConvertFrom-Json
    $pm = @{}; (Cdp 'Performance.getMetrics').metrics | ForEach-Object { $pm[$_.name] = $_.value }
    $res | Add-Member profile $p; $res | Add-Member label $d.label; $res | Add-Member cpu $d.cpu; $res | Add-Member net $n.label
    $res | Add-Member cdp ([ordered]@{ JSHeapUsedMB = [math]::Round($pm['JSHeapUsedSize'] / 1MB, 1); Nodes = $pm['Nodes']; LayoutCount = $pm['LayoutCount']; RecalcStyleCount = $pm['RecalcStyleCount'];
      LayoutMs = [math]::Round($pm['LayoutDuration'] * 1000); StyleMs = [math]::Round($pm['RecalcStyleDuration'] * 1000); ScriptMs = [math]::Round($pm['ScriptDuration'] * 1000); TaskMs = [math]::Round($pm['TaskDuration'] * 1000) })
    $report.profiles += $res
  }

  if ($Shots -or $NoHas) {
    $d = $all[$ShotProfile]; Set-Device $d @{ down = 1000; up = 1000; lat = 0 }; $null = Cdp 'Emulation.setCPUThrottlingRate' @{ rate = 1 }
  }
  if ($Shots) {
    $dir = Join-Path $Out ('shots\' + $ShotProfile); New-Item -ItemType Directory -Force $dir | Out-Null
    Write-Output "시각 검수 캡처: $($d.label), 컷 70개"
    Open-Page $url
    $cuts = Eval-Js $prepJs | ConvertFrom-Json
    foreach ($c in $cuts) {
      Save-Shot @{ x = 0; y = $c.y; width = $d.w; height = $c.h; scale = 1 } (Join-Path $dir ('cut-{0:D2}.png' -f $c.no))
    }
    $report.shots = "out/shots/$ShotProfile ($($cuts.Count)장)"
  }
  if ($NoHas) {
    $dir = Join-Path $Out 'shots\no-has'; New-Item -ItemType Directory -Force $dir | Out-Null
    Write-Output ':has() 미지원 흉내: 분위기가 바뀌는 경계 캡처 (같은 위치를 :has 있음/없음으로)'
    Open-Page $url
    $cuts = Eval-Js $prepJs | ConvertFrom-Json
    $bounds = @(); for ($k = 0; $k -lt $cuts.Count - 1; $k++) { if ($cuts[$k].mood -ne $cuts[$k + 1].mood) { $bounds += $cuts[$k] } }
    $hasH = Eval-Js 'document.documentElement.scrollHeight'
    foreach ($c in $bounds) { Save-Shot @{ x = 0; y = $c.y + $c.h - 260; width = $d.w; height = 360; scale = 1 } (Join-Path $dir ('cut-{0:D2}-has.png' -f $c.no)) }
    $removed = Eval-Js $stripHasJs
    Start-Sleep -Milliseconds 500
    $noH = Eval-Js 'document.documentElement.scrollHeight'
    foreach ($c in $bounds) { Save-Shot @{ x = 0; y = $c.y + $c.h - 260; width = $d.w; height = 360; scale = 1 } (Join-Path $dir ('cut-{0:D2}-nohas.png' -f $c.no)) }
    $overflowNo = Eval-Js 'Array.prototype.filter.call(document.querySelectorAll("#app *"), function (e) { var b = e.getBoundingClientRect(); return !e.closest(".art") && b.width && (b.right > document.documentElement.clientWidth + 0.5 || b.left < -0.5); }).length'
    $report.noHas = [ordered]@{ removedRules = $removed; moodBoundaries = $bounds.Count; boundaryCuts = ($bounds | ForEach-Object { $_.no }) -join ','; heightWithHas = $hasH; heightWithoutHas = $noH; overflowWithoutHas = $overflowNo; shots = 'out/shots/no-has' }
  }
} finally {
  if ($script:ws) { try { $script:ws.Dispose() } catch {} }
  if ($br) { cmd /c "taskkill /T /F /PID $($br.Id) >nul 2>nul" }
  if ($server) { cmd /c "taskkill /T /F /PID $($server.Id) >nul 2>nul" }
  Start-Sleep -Milliseconds 300
  Remove-Item -Recurse -Force $profileDir -ErrorAction SilentlyContinue
}

# ---------- 결과 ----------
$json = $report | ConvertTo-Json -Depth 12
[IO.File]::WriteAllText((Join-Path $Out 'device-report.json'), $json, $utf8)
$clipOk = $null
try { $clipOk = ([IO.File]::ReadAllText((Join-Path $PSScriptRoot 'known-issues.json'), $utf8) | ConvertFrom-Json).__textClip } catch {}
$L = New-Object System.Collections.Generic.List[string]
$L.Add("1화 모바일 측정  $($report.engine)  $($report.startedAt)")
$L.Add('※ Chromium 흉내 측정 — iOS Safari·실제 휴대폰 결과가 아님')
foreach ($r in $report.profiles) {
  $L.Add('')
  $L.Add("[$($r.label) · CPU ×$($r.cpu) · $($r.net)]")
  $L.Add(("  첫 화면   DOM 준비 {0}ms · 큰 그림 표시(LCP) {1}ms · 첫 화면 그림 {2}개 {3:N0}KB · 화면 3개 아래 그림 미리 받음 {4}개" -f $r.load.domContentLoaded, $r.load.lcp, $r.load.imagesRequested, ($r.load.imageBytes / 1KB), $r.load.farImagesRequested))
  $L.Add(("  스크롤   {0:N0}px 를 {1}px/s 로 {2:N1}초 · 프레임 중앙 {3}ms / 95% {4}ms / 최대 {5}ms · 50ms 넘는 프레임 {6}개 · 긴 작업 {7}개({8}ms) · CLS {9}" -f $r.scroll.height, $r.scroll.speed, ($r.scroll.ms / 1000), $r.scroll.frameP50, $r.scroll.frameP95, $r.scroll.frameMax, $r.scroll.over50, $r.scroll.longTasks, $r.scroll.longTaskMs, $r.scroll.cls))
  $L.Add(("  빈 그림   화면에 들어왔을 때 아직 안 뜬 컷 {0}개 · 대기 중앙 {1}ms / 최대 {2}ms · 빈 그림이 보인 프레임 {3}개" -f $r.scroll.blankCuts, $r.scroll.blankWaitP50, $r.scroll.blankWaitMax, $r.scroll.blankFrames))
  if ($r.scroll.worstWaits.Count) { $L.Add('             오래 기다린 컷: ' + (($r.scroll.worstWaits | ForEach-Object { "$($_.cut)컷 $($_.ms)ms" }) -join ', ')) }
  if ($r.scroll.slowFrames.Count) { $L.Add('             느린 프레임 위치: ' + (($r.scroll.slowFrames | ForEach-Object { "$($_.cut)컷 $($_.ms)ms" }) -join ', ')) }
  $L.Add(("  메모리   JS 힙 {0}MB · 그림 디코딩 추정: 전체 파일 {1}개 {2}MB / 화면 주변(위 1·아래 2화면) 최대 {3}MB ({4}컷 부근) · 가장 큰 그림 {5}×{6} · DOM {7}개 · 그림 요청 {8}개 {9:N1}MB" -f $r.cdp.JSHeapUsedMB, $r.memory.uniqueImages, $r.memory.decodedImagesMB, $r.memory.peakWindowMB, $r.memory.peakWindowCut, $r.memory.largestImage.w, $r.memory.largestImage.h, $r.memory.domNodes, $r.memory.totalImageRequests, ($r.memory.totalImageBytes / 1MB)))
  $L.Add(("  작업 시간  스크립트 {0}ms · 레이아웃 {1}ms({2}회) · 스타일 {3}ms({4}회)" -f $r.cdp.ScriptMs, $r.cdp.LayoutMs, $r.cdp.LayoutCount, $r.cdp.StyleMs, $r.cdp.RecalcStyleCount))
  $c = $r.checks
  $L.Add(("  검사     가로 넘침 {0}개 · 글자 잘림 {1}개 · 그림 밖 말풍선 {2}개 (겹친 대사 {3}개 중) · 깨진 그림 {4}개 · lazy 없는 그림 {5}개 · 문서 폭 {6}/{7}" -f $c.overflow.Count, $c.clipped.Count, $c.bubbleOutside.Count, $c.overlayLines, $c.broken.Count, $c.notLazy, $c.docScrollWidth, $c.clientWidth))
  foreach ($x in $c.clipped) {
    $intended = $clipOk -and ($clipOk.cuts -contains [int]$x.cut) -and ($clipOk.classes -contains ($x.el -replace '^[a-z0-9]+\.', ''))
    $label = if ($intended) { '의도된 말줄임' } else { '글자 잘림' }
    $L.Add("             ${label}: $($x.cut)컷 <$($x.el)> '$($x.text)' (내용 $($x.sw)×$($x.sh) / 상자 $($x.cw)×$($x.ch))")
  }
  foreach ($x in $c.bubbleOutside) { $L.Add("             그림 밖 말풍선: $($x.cut)컷 '$($x.text)'") }
  foreach ($x in $c.overflow) { $L.Add("             가로 넘침: $($x.cut)컷 <$($x.el)> $($x.left)~$($x.right)") }
  if ($c.smallText.Count) {
    $byPx = @{}; foreach ($x in $c.smallText) { $k = [string]$x.px; if (-not $byPx[$k]) { $byPx[$k] = New-Object System.Collections.Generic.List[string] }; $byPx[$k].Add([string]$x.cut) }
    $L.Add('             12px 미만 글자: ' + (($byPx.Keys | Sort-Object { [double]$_ } | ForEach-Object { "$($_)px → 컷 " + (($byPx[$_] | Select-Object -Unique) -join ',') }) -join ' · '))
  }
}
if ($report.noHas) {
  $h = $report.noHas
  $L.Add(''); $L.Add('[:has() 미지원 흉내]')
  $L.Add("  지운 규칙 $($h.removedRules)개 · 분위기 경계 $($h.moodBoundaries)곳 (컷 $($h.boundaryCuts) 아래) · 문서 높이 $($h.heightWithHas) → $($h.heightWithoutHas) · 가로 넘침 $($h.overflowWithoutHas)개 · 캡처 $($h.shots)")
}
if ($report.shots) { $L.Add(''); $L.Add("시각 검수 캡처: $($report.shots)") }
[IO.File]::WriteAllLines((Join-Path $Out 'device-report.txt'), $L, $utf8)
$L | ForEach-Object { Write-Output $_ }
