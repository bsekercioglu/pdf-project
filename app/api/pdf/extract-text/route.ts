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
    tempDir = await getTempDir();
    const inputPath = await saveUploadedFile(file, tempDir);
    const processor = new PDFProcessor();
    const text = await processor.extractText(inputPath);
    await fs.remove(inputPath).catch(() => {});
    await cleanupDir(tempDir);
    if (!text?.trim()) {
      return NextResponse.json({ success: false, error: 'PDF içinde metin bulunamadı!' }, { status: 400 });
    }
    await ensureUserOutputDir(session.id);
    const outputFilename = `extracted_text_${uuidv4()}.txt`;
    const outputPath = getUserOutputPath(session.id, outputFilename);
    await fs.writeFile(outputPath, text, 'utf8');
    await registerUserFile(session.id, outputPath, 'extracted_text.txt', 'txt');
    const buffer = await fs.readFile(outputPath);
    return new NextResponse(buffer, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': 'attachment; filename="extracted_text.txt"' },
    });
  } catch (err) {
    if (tempDir) await cleanupDir(tempDir).catch(() => {});
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Metin çıkarma hatası' }, { status: 500 });
  }
}
