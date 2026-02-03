import { NextResponse } from 'next/server';
import { cleanupExpiredFiles } from '@/lib/cleanup';

/** 1 ayı geçen dosyaları siler. Cron veya manuel tetiklenebilir. */
export async function POST() {
  try {
    const { deleted, errors } = await cleanupExpiredFiles();
    return NextResponse.json({
      success: true,
      deleted,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    console.error('Cleanup error:', err);
    return NextResponse.json(
      { success: false, error: 'Temizlik hatası.' },
      { status: 500 }
    );
  }
}
