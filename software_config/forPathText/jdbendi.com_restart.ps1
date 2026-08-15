$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=== Closing ===" -ForegroundColor Cyan
& (Join-Path $here "jdbendi.com_close.ps1")

Write-Host "=== Starting ===" -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$(Join-Path $here 'jdbendi.com_start.cmd')`"" -WindowStyle Hidden

Write-Host ""
Write-Host "Restart done." -ForegroundColor Green
Start-Sleep -Seconds 2
