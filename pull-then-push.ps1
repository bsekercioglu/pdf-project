# Uzak (GitHub) degisiklikleri cek, birlestir, sonra push et
# PowerShell: .\pull-then-push.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Uzak degisiklikler cekiliyor (rebase ile)..."
git pull origin main --rebase

Write-Host "GitHub'a gonderiliyor..."
git push origin main

Write-Host "Tamamlandi."
