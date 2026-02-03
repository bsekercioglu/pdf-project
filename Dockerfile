# PDF İşleme Merkezi - Next.js (Ubuntu tabanlı, port 3005)
FROM node:20-bookworm-slim

# GraphicsMagick (pdf2pic için gerekli)
RUN apt-get update && apt-get install -y --no-install-recommends graphicsmagick \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# Çalışma portu
ENV PORT=3005
EXPOSE 3005

# Geçici, çıktı ve veritabanı klasörleri
ENV TEMP_FOLDER=/app/temp_files
ENV OUTPUT_FOLDER=/app/outputs
ENV DATABASE_URL="file:/app/data/prisma.db"
ENV JWT_SECRET=change-this-in-production

RUN mkdir -p /app/temp_files /app/outputs /app/data

CMD ["sh", "-c", "npx prisma db push --accept-data-loss 2>/dev/null || true && npm start"]
