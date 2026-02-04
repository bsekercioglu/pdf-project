[![Deploy to Ubuntu](https://github.com/bsekercioglu/pdf-project/actions/workflows/deploy.yml/badge.svg)](https://github.com/bsekercioglu/pdf-project/actions/workflows/deploy.yml)
# PDF İşleme Merkezi (Next.js)

Tüm PDF işlemleriniz için Next.js tabanlı web uygulaması. Giriş/kayıt, kullanıcıya özel dosya listesi ve 1 ay sonra otomatik silme destekler. Ubuntu üzerinde Docker ile çalıştırılabilir...

## Özellikler

- **Giriş / Kayıt** – E-posta ve şifre ile hesap oluşturma ve giriş
- **Benim Dosyalarım** – İşlem yaptığınız dosyaları listeleme, indirme ve silme
- **1 ay otomatik silme** – 30 günden eski dosyalar sistemden otomatik silinir
- **PDF Birleştirme** – Birden fazla PDF'i tek dosyada birleştir
- **PDF Ayırma** – Sayfa aralıklarına veya parça sayısına göre ayır
- **PDF Sıkıştırma** – Dosya boyutunu küçült
- **Görsel / Metin Çıkarma** – PDF'den görsel veya metin çıkar
- **Sayfa İşlemleri** – Sayfa silme ve yeniden sıralama
- **Şifreleme / Şifre Kaldırma** – PDF şifrele veya aç
- **Filigran** – Metin veya görsel filigran ekle
- **PDF'den Görsel** – Sayfaları PNG'ye dönüştür
- **OCR** – Görsel ve taranmış PDF'lerden metin çıkar

## Veritabanı

Kullanıcı ve dosya kayıtları için **SQLite** (Prisma) kullanılır. Tablolar: `User`, `UserFile`.

## Gereksinimler

- Node.js 18+
- npm 8+

## Yerel Kurulum

```bash
cd pdf-project-nextjs
cp .env.example .env
# .env içinde DATABASE_URL ve JWT_SECRET'ı isteğe göre düzenleyin
npm install
npx prisma db push
npm run dev
```

Uygulama **http://localhost:3005** adresinde çalışır. İlk kullanımda **Kayıt ol** ile hesap oluşturup giriş yapın.

## Üretim (Production)

```bash
npm run build
npm start
```

Port varsayılan olarak **3005** (ortam değişkeni `PORT` ile değiştirilebilir).

## Docker ile Çalıştırma (Ubuntu)

Proje Ubuntu tabanlı bir imaj kullanır; `pdf2pic` için GraphicsMagick kuruludur.

```bash
# İmaj oluştur
docker build -t pdf-project-nextjs .

# Çalıştır (port 3005)
docker run -p 3005:3005 pdf-project-nextjs
```

Tarayıcıda: **http://localhost:3005**

Kalıcı veri için volume kullanımı (veritabanı ve dosyalar):

```bash
docker run -p 3005:3005 \
  -v pdf-data:/app/data \
  -v pdf-outputs:/app/outputs \
  -e JWT_SECRET=your-secret-key \
  pdf-project-nextjs
```

## Ortam Değişkenleri

| Değişken       | Açıklama              | Varsayılan        |
|----------------|------------------------|-------------------|
| `PORT`         | Uygulama portu         | 3005              |
| `DATABASE_URL` | SQLite dosya yolu      | `file:./dev.db`   |
| `JWT_SECRET`   | JWT imza anahtarı      | (örnek .env)      |
| `TEMP_FOLDER`  | Geçici dosya klasörü   | `temp_files`      |
| `OUTPUT_FOLDER`| Çıktı dosya klasörü    | `outputs`         |

## Proje Yapısı

- `app/` – Next.js App Router (sayfalar ve API route'ları)
- `app/login`, `app/register` – Giriş ve kayıt sayfaları
- `app/my-files` – Kullanıcıya ait dosya listesi (indir/sil)
- `lib/` – Auth, Prisma, PDF/OCR modülleri, cleanup
- `prisma/schema.prisma` – User, UserFile modelleri
- `Dockerfile` – Ubuntu + Node 20 + GraphicsMagick

## Lisans

MIT
