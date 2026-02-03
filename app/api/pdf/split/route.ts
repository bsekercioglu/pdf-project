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
    const splitType = (formData.get('split_type') as string) || 'pages';
    const pageRanges = (formData.get('page_ranges') as string) || '';
    const numParts = parseInt(String(formData.get('num_parts') || '2'), 10);
    tempDir = await getTempDir();
    const inputPath = await saveUploadedFile(file, tempDir);
    const processor = new PDFProcessor();
    let outputFiles: string[] = [];
    if (splitType === 'pages') {
      outputFiles = await processor.splitByPages(inputPath, pageRanges);
    } else if (splitType === 'individual') {
      outputFiles = await processor.splitIndividualPages(inputPath);
    } else {
      outputFiles = await processor.splitByCount(inputPath, numParts);
    }
    await fs.remove(inputPath).catch(() => {});
    await cleanupDir(tempDir);
    if (outputFiles.length === 0) {
      return NextResponse.json({ success: false, error: 'Hiç çıktı dosyası oluşturulamadı' }, { status: 400 });
    }
    await ensureUserOutputDir(session.id);
    if (outputFiles.length === 1) {
      const outputFilename = `split_${uuidv4()}.pdf`;
      const outputPath = getUserOutputPath(session.id, outputFilename);
      await fs.move(outputFiles[0], outputPath);
      await registerUserFile(session.id, outputPath, 'split.pdf', 'pdf');
      const buffer = await fs.readFile(outputPath);
      return new NextResponse(buffer, {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="split.pdf"' },
      });
    }
    const zip = new AdmZip();
    for (let i = 0; i < outputFiles.length; i++) {
      zip.addLocalFile(outputFiles[i], '', `part_${i + 1}.pdf`);
      await fs.remove(outputFiles[i]).catch(() => {});
    }
    const zipFilename = `split_${uuidv4()}.zip`;
    const zipPath = getUserOutputPath(session.id, zipFilename);
    zip.writeZip(zipPath);
    await registerUserFile(session.id, zipPath, 'split_pages.zip', 'zip');
    const buffer = await fs.readFile(zipPath);
    return new NextResponse(buffer, {
      headers: { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="split_pages.zip"' },
    });
  } catch (err) {
    if (tempDir) await cleanupDir(tempDir).catch(() => {});
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'PDF ayırma hatası' }, { status: 500 });
  }
}
