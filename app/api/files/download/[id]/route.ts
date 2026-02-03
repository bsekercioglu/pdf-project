import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs-extra';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

const OUTPUT_BASE = process.env.OUTPUT_FOLDER || path.join(process.cwd(), 'outputs');

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Oturum gerekli.' }, { status: 401 });
  }
  const id = (await params).id;
  try {
    const file = await prisma.userFile.findFirst({
      where: { id, userId: session.id },
    });
    if (!file) {
      return NextResponse.json({ success: false, error: 'Dosya bulunamadı.' }, { status: 404 });
    }
    const filePath = path.join(OUTPUT_BASE, file.storagePath);
    if (!(await fs.pathExists(filePath))) {
      return NextResponse.json({ success: false, error: 'Dosya diskte bulunamadı.' }, { status: 404 });
    }
    const buffer = await fs.readFile(filePath);
    const contentType =
      file.fileType === 'pdf'
        ? 'application/pdf'
        : file.fileType === 'zip'
          ? 'application/zip'
          : file.fileType === 'png'
            ? 'image/png'
            : 'text/plain; charset=utf-8';
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
      },
    });
  } catch (err) {
    console.error('Download error:', err);
    return NextResponse.json(
      { success: false, error: 'İndirme hatası.' },
      { status: 500 }
    );
  }
}
