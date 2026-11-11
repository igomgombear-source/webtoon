# 검수용 로컬 서버 (Windows PowerShell 5.1 기본 기능만 사용, 설치할 것 없음)
#   저장소 루트를 http://localhost:<Port>/ 로 띄운다.
#   검수 창이 POST /__qa/result, /__qa/baseline 으로 보낸 내용을 tools/qa/out/ 에 저장한다.
# 보통은 run.ps1 이 자동으로 켜고 끈다. 손으로 띄울 때:
#   powershell -ExecutionPolicy Bypass -File tools\qa\serve.ps1 -Port 8765
#   → 브라우저에서 http://localhost:8765/tools/qa/qa.html
param([int]$Port = 8765)
$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$Out = Join-Path $PSScriptRoot 'out'
New-Item -ItemType Directory -Force $Out | Out-Null
$mime = @{ '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8';
  '.json' = 'application/json; charset=utf-8'; '.md' = 'text/plain; charset=utf-8'; '.txt' = 'text/plain; charset=utf-8';
  '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.webp' = 'image/webp'; '.gif' = 'image/gif';
  '.svg' = 'image/svg+xml'; '.ico' = 'image/x-icon'; '.woff' = 'font/woff'; '.woff2' = 'font/woff2' }
$posts = @{ '__qa/result' = 'result.json'; '__qa/baseline' = 'baseline.json' }

$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
Write-Output "QA server: $Root -> http://localhost:$Port/"
while ($l.IsListening) {
  $ctx = $l.GetContext(); $req = $ctx.Request; $res = $ctx.Response
  try {
    $path = [Uri]::UnescapeDataString($req.Url.AbsolutePath).TrimStart('/')
    if ($req.HttpMethod -eq 'POST' -and $posts.ContainsKey($path)) {
      $ms = New-Object IO.MemoryStream; $req.InputStream.CopyTo($ms)
      [IO.File]::WriteAllBytes((Join-Path $Out $posts[$path]), $ms.ToArray())
      Write-Output "saved $($posts[$path]) ($($ms.Length) bytes)"
      $res.StatusCode = 204
    } else {
      if ($path -eq '' -or $path.EndsWith('/')) { $path += 'index.html' }
      $file = [IO.Path]::GetFullPath((Join-Path $Root ($path -replace '/', '\')))
      if ($file.StartsWith($Root, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $file -PathType Leaf)) {
        $bytes = [IO.File]::ReadAllBytes($file)
        $ext = [IO.Path]::GetExtension($file).ToLower()
        $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
        $res.AddHeader('Cache-Control', 'no-store')
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      } else { $res.StatusCode = 404 }
    }
  } catch { $res.StatusCode = 500 }
  $res.Close()
}
