import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
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
    const watermarkType = (formData.get('watermark_type') as string) || 'text';
    const watermarkText = (formData.get('watermark_text') as string) || '';
    const watermarkImageFile = formData.get('watermark_image') as File | null;
    tempDir = await getTempDir();
    const inputPath = await saveUploadedFile(file, tempDir);
    await ensureUserOutputDir(session.id);
    const outputFilename = `watermarked_${uuidv4()}.pdf`;
    const outputPath = getUserOutputPath(session.id, outputFilename);
    const processor = new PDFProcessor();
    if (watermarkType === 'text') {
      if (!watermarkText.trim()) {
        await cleanupDir(tempDir);
        return NextResponse.json({ success: false, error: 'Metin filigran için bir metin giriniz!' }, { status: 400 });
      }
      await processor.addTextWatermark(inputPath, outputPath, watermarkText);
    } else {
      if (!watermarkImageFile) {
        await cleanupDir(tempDir);
        return NextResponse.json({ success: false, error: 'Görsel filigran için bir resim dosyası seçiniz!' }, { status: 400 });
      }
      const watermarkPath = await saveUploadedFile(watermarkImageFile, tempDir);
      await processor.addImageWatermark(inputPath, outputPath, watermarkPath);
      await fs.remove(watermarkPath).catch(() => {});
    }
    await fs.remove(inputPath).catch(() => {});
    await cleanupDir(tempDir);
    await registerUserFile(session.id, outputPath, 'watermarked.pdf', 'pdf');
    const buffer = await fs.readFile(outputPath);
    return new NextResponse(buffer, {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="watermarked.pdf"' },
    });
  } catch (err) {
    if (tempDir) await cleanupDir(tempDir).catch(() => {});
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Filigran hatası' }, { status: 500 });
  }
}
