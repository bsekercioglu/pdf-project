import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs-extra';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

const OUTPUT_BASE = process.env.OUTPUT_FOLDER || path.join(process.cwd(), 'outputs');

export async function DELETE(
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
    await fs.remove(filePath).catch(() => {});
    await prisma.userFile.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    return NextResponse.json(
      { success: false, error: 'Silme hatası.' },
      { status: 500 }
    );
  }
}
