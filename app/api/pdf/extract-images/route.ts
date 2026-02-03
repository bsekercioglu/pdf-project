import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import AdmZip from 'adm-zip';
import { getSessionFromRequest } from '@/lib/auth';
import { getTempDir, saveUploadedFile, getUserOutputPath, ensureUserOutputDir, cleanupDir } from '@/lib/upload';
import { registerUserFile } from '@/lib/userFiles';
const PDFProcessor = require('@/lib/pdfProcessor');

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Oturum gerekli.' }, { status: 401 });
  }
  let tempDir: string | null = null;
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ success: false, error: 'Lütfen geçerli bir PDF dosyası seçin!' }, { status: 400 });
    }
    tempDir = await getTempDir();
    const inputPath = await saveUploadedFile(file, tempDir);
    const processor = new PDFProcessor();
    const imageFiles = await processor.extractImages(inputPath);
    await fs.remove(inputPath).catch(() => {});
    await cleanupDir(tempDir);
    if (!imageFiles?.length) {
      return NextResponse.json({ success: false, error: 'PDF içinde görsel bulunamadı!' }, { status: 400 });
    }
    await ensureUserOutputDir(session.id);
    if (imageFiles.length === 1) {
      const outputFilename = `image_${uuidv4()}.png`;
      const outputPath = getUserOutputPath(session.id, outputFilename);
      await fs.move(imageFiles[0], outputPath);
      await registerUserFile(session.id, outputPath, 'extracted_image.png', 'png');
      const buffer = await fs.readFile(outputPath);
      return new NextResponse(buffer, {
        headers: { 'Content-Type': 'image/png', 'Content-Disposition': 'attachment; filename="extracted_image.png"' },
      });
    }
    const zip = new AdmZip();
    for (let i = 0; i < imageFiles.length; i++) {
      zip.addLocalFile(imageFiles[i], '', `image_${i + 1}.png`);
      await fs.remove(imageFiles[i]).catch(() => {});
    }
    const zipFilename = `images_${uuidv4()}.zip`;
    const zipPath = getUserOutputPath(session.id, zipFilename);
    zip.writeZip(zipPath);
    await registerUserFile(session.id, zipPath, 'extracted_images.zip', 'zip');
    const buffer = await fs.readFile(zipPath);
    return new NextResponse(buffer, {
      headers: { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="extracted_images.zip"' },
    });
  } catch (err) {
    if (tempDir) await cleanupDir(tempDir).catch(() => {});
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Görsel çıkarma hatası' }, { status: 500 });
  }
}
