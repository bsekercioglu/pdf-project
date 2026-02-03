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
    const operation = (formData.get('operation') as string) || 'delete';
    const pagesToDelete = (formData.get('pages_to_delete') as string) || '';
    const newOrder = (formData.get('new_order') as string) || '';
    tempDir = await getTempDir();
    const inputPath = await saveUploadedFile(file, tempDir);
    await ensureUserOutputDir(session.id);
    const outputFilename = `processed_${uuidv4()}.pdf`;
    const outputPath = getUserOutputPath(session.id, outputFilename);
    const processor = new PDFProcessor();
    if (operation === 'delete') {
      await processor.deletePages(inputPath, outputPath, pagesToDelete);
    } else {
      await processor.reorderPages(inputPath, outputPath, newOrder);
    }
    await fs.remove(inputPath).catch(() => {});
    await cleanupDir(tempDir);
    await registerUserFile(session.id, outputPath, 'processed.pdf', 'pdf');
    const buffer = await fs.readFile(outputPath);
    return new NextResponse(buffer, {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="processed.pdf"' },
    });
  } catch (err) {
    if (tempDir) await cleanupDir(tempDir).catch(() => {});
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Sayfa işleme hatası' }, { status: 500 });
  }
}
