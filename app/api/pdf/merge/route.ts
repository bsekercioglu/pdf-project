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
    const files = formData.getAll('files') as File[];
    const pdfFiles = files.filter((f) => f.name.toLowerCase().endsWith('.pdf'));
    if (pdfFiles.length < 2) {
      return NextResponse.json({ success: false, error: 'En az 2 PDF dosyası seçmelisiniz!' }, { status: 400 });
    }
    tempDir = await getTempDir();
    const paths: string[] = [];
    for (const file of pdfFiles) {
      const p = await saveUploadedFile(file, tempDir);
      paths.push(p);
    }
    await ensureUserOutputDir(session.id);
    const outputFilename = `merged_${uuidv4()}.pdf`;
    const outputPath = getUserOutputPath(session.id, outputFilename);
    const processor = new PDFProcessor();
    await processor.mergePdfs(paths, outputPath);
    await cleanupDir(tempDir);
    await registerUserFile(session.id, outputPath, 'merged.pdf', 'pdf');
    const buffer = await fs.readFile(outputPath);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="merged.pdf"',
      },
    });
  } catch (err) {
    if (tempDir) await cleanupDir(tempDir).catch(() => {});
    const message = err instanceof Error ? err.message : 'PDF birleştirme hatası';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
