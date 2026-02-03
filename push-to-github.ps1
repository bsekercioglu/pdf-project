# Next.js projesini https://github.com/bsekercioglu/pdf-project.git adresine gönderir
# PowerShell'de: .\push-to-github.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path .git)) {
    Write-Host "Git init yapiliyor..."
    git init
    git remote add origin https://github.com/bsekercioglu/pdf-project.git
}

# Mevcut remote'u kontrol et / güncelle
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    git remote add origin https://github.com/bsekercioglu/pdf-project.git
} elseif ($remote -ne "https://github.com/bsekercioglu/pdf-project.git") {
    git remote set-url origin https://github.com/bsekercioglu/pdf-project.git
}

Write-Host "Dosyalar ekleniyor..."
git add .
git status --short

Write-Host "Commit yapiliyor..."
git commit -m "PDF Isleme Merkezi - Next.js (giris, kayit, kullanici dosyalari, 1 ay otomatik silme)" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Commit atlandi (degisiklik yok veya zaten commit edilmis)."
}

Write-Host "GitHub'a gonderiliyor (main branch)..."
git branch -M main 2>$null
git push -u origin main

Write-Host "Tamamlandi: https://github.com/bsekercioglu/pdf-project"
