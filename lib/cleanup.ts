import { prisma } from '@/lib/db';
import fs from 'fs-extra';
import path from 'path';

const OUTPUT_BASE = process.env.OUTPUT_FOLDER || path.join(process.cwd(), 'outputs');
const RETENTION_DAYS = 30;

/** 1 ay (30 gün) öncesinden eski dosya kayıtlarını ve fiziksel dosyaları siler */
export async function cleanupExpiredFiles(): Promise<{ deleted: number; errors: string[] }> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
  const errors: string[] = [];
  let deleted = 0;

  try {
    const oldFiles = await prisma.userFile.findMany({
      where: { createdAt: { lt: cutoff } },
    });
    for (const f of oldFiles) {
      try {
        const filePath = path.join(OUTPUT_BASE, f.storagePath);
        if (await fs.pathExists(filePath)) {
          await fs.remove(filePath);
          deleted++;
        }
        await prisma.userFile.delete({ where: { id: f.id } });
      } catch (e) {
        errors.push(`${f.id}: ${e instanceof Error ? e.message : 'unknown'}`);
      }
    }
  } catch (e) {
    errors.push(e instanceof Error ? e.message : 'cleanup failed');
  }
  return { deleted, errors };
}
