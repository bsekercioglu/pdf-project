import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { cleanupExpiredFiles } from '@/lib/cleanup';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Oturum gerekli.' }, { status: 401 });
  }
  try {
    await cleanupExpiredFiles();
    const files = await prisma.userFile.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({
      success: true,
      files: files.map((f) => ({
        id: f.id,
        originalName: f.originalName,
        fileType: f.fileType,
        size: f.size,
        createdAt: f.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('Files list error:', err);
    return NextResponse.json(
      { success: false, error: 'Dosya listesi alınamadı.' },
      { status: 500 }
    );
  }
}
