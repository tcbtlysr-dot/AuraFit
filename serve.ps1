$root = $PSScriptRoot
$port = 5500
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "AuraFit telefon onizleme: http://localhost:$port/"
Write-Host "Durdurmak icin Ctrl+C"

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".svg"  = "image/svg+xml"
  ".ico"  = "image/x-icon"
  ".json" = "application/json"
  ".woff2"= "font/woff2"
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $reqPath = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart("/"))
  if ([string]::IsNullOrWhiteSpace($reqPath)) { $reqPath = "index.html" }

  $full = Join-Path $root $reqPath
  $full = [System.IO.Path]::GetFullPath($full)

  if (-not $full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
    $ctx.Response.StatusCode = 403
    $ctx.Response.Close()
    continue
  }

  if (-not (Test-Path -LiteralPath $full -PathType Leaf)) {
    $ctx.Response.StatusCode = 404
    $bytes = [Text.Encoding]::UTF8.GetBytes("Not found")
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $ctx.Response.Close()
    continue
  }

  $ext = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
  $ctx.Response.ContentType = $(if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" })
  $bytes = [System.IO.File]::ReadAllBytes($full)
  $ctx.Response.ContentLength64 = $bytes.Length
  $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $ctx.Response.Close()
}
