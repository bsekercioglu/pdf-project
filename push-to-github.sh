#!/bin/bash
# Next.js projesini https://github.com/bsekercioglu/pdf-project.git adresine gönderir
# Ubuntu/Linux: chmod +x push-to-github.sh && ./push-to-github.sh

set -e
cd "$(dirname "$0")"

if [ ! -d .git ]; then
  echo "Git init yapılıyor..."
  git init
  git remote add origin https://github.com/bsekercioglu/pdf-project.git
fi

git remote set-url origin https://github.com/bsekercioglu/pdf-project.git 2>/dev/null || true

echo "Dosyalar ekleniyor..."
git add .
git status --short

echo "Commit yapılıyor..."
git commit -m "PDF İşleme Merkezi - Next.js (giriş, kayıt, kullanıcı dosyaları, 1 ay otomatik silme)" || echo "Commit atlandı (değişiklik yok)."

echo "GitHub'a gönderiliyor (main branch)..."
git branch -M main
git push -u origin main

echo "Tamamlandı: https://github.com/bsekercioglu/pdf-project"
