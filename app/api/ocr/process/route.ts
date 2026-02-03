import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import AdmZip from 'adm-zip';
import { getSessionFromRequest } from '@/lib/auth';
import { getTempDir, saveUploadedFile, getUserOutputPath, ensureUserOutputDir, cleanupDir } from '@/lib/upload';
import { registerUserFile } from '@/lib/userFiles';
const OCRProcessor = require('@/lib/ocrProcessor');

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Oturum gerekli.' }, { status: 401 });
  }
  let tempDir: string | null = null;
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: 'Lütfen bir dosya seçin!' }, { status: 400 });
    }
    const name = file.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.jpg') && !name.endsWith('.jpeg') && !name.endsWith('.png')) {
      return NextResponse.json({ success: false, error: 'Desteklenen formatlar: PDF, JPG, PNG' }, { status: 400 });
    }
    tempDir = await getTempDir();
    const inputPath = await saveUploadedFile(file, tempDir);
    const ocrProcessor = new OCRProcessor();
    let result: { txtPath: string; pdfPath: string | null };
    if (name.endsWith('.pdf')) {
      result = await ocrProcessor.processPdf(inputPath);
    } else {
      result = await ocrProcessor.processImage(inputPath);
    }
    await fs.remove(inputPath).catch(() => {});
    await cleanupDir(tempDir);
    await ensureUserOutputDir(session.id);
    const outputFiles: string[] = [result.txtPath];
    if (result.pdfPath) outputFiles.push(result.pdfPath);
    if (outputFiles.length === 1) {
      const p = outputFiles[0];
      const isTxt = p.endsWith('.txt');
      const outputFilename = path.basename(p);
      const destFilename = (isTxt ? 'extracted_text_' : 'ocr_') + uuidv4() + (isTxt ? '.txt' : '.pdf');
      const outputPath = getUserOutputPath(session.id, destFilename);
      await fs.move(p, outputPath);
      await registerUserFile(session.id, outputPath, isTxt ? 'extracted_text.txt' : 'ocr.pdf', isTxt ? 'txt' : 'pdf');
      const buffer = await fs.readFile(outputPath);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': isTxt ? 'text/plain; charset=utf-8' : 'application/pdf',
          'Content-Disposition': `attachment; filename="${isTxt ? 'extracted_text.txt' : 'ocr.pdf'}"`,
        },
      });
    }
    const zip = new AdmZip();
    let txtCount = 0;
    let pdfCount = 0;
    const toDelete: string[] = [];
    for (const p of outputFiles) {
      if (p.endsWith('.txt')) {
        txtCount++;
        zip.addLocalFile(p, '', `extracted_text_${txtCount}.txt`);
      } else {
        pdfCount++;
        zip.addLocalFile(p, '', `ocr_pdf_${pdfCount}.pdf`);
      }
      toDelete.push(p);
    }
    const zipFilename = `ocr_${uuidv4()}.zip`;
    const zipPath = getUserOutputPath(session.id, zipFilename);
    zip.writeZip(zipPath);
    for (const p of toDelete) await fs.remove(p).catch(() => {});
    await registerUserFile(session.id, zipPath, 'ocr_results.zip', 'zip');
    const buffer = await fs.readFile(zipPath);
    return new NextResponse(buffer, {
      headers: { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="ocr_results.zip"' },
    });
  } catch (err) {
    if (tempDir) await cleanupDir(tempDir).catch(() => {});
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'OCR hatası' }, { status: 500 });
  }
}
