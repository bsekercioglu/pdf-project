import path from 'path';
import fs from 'fs-extra';
import { prisma } from '@/lib/db';
import { getUserOutputPath, ensureUserOutputDir } from './upload';

const OUTPUT_BASE = process.env.OUTPUT_FOLDER || path.join(process.cwd(), 'outputs');

/** İşlenen dosyayı kullanıcı klasörüne kaydeder ve veritabanına ekler. Dosya zaten fullPath'ta yazılmış olmalı. */
export async function registerUserFile(
  userId: string,
  sourcePath: string,
  originalName: string,
  fileType: 'pdf' | 'zip' | 'txt' | 'png'
): Promise<{ storagePath: string; fullPath: string }> {
  await ensureUserOutputDir(userId);
  const ext = path.extname(originalName) || (fileType === 'pdf' ? '.pdf' : fileType === 'zip' ? '.zip' : fileType === 'png' ? '.png' : '.txt');
  const filename = path.basename(sourcePath);
  const storagePath = `${userId}/${filename}`;
  const fullPath = path.join(OUTPUT_BASE, storagePath);
  if (sourcePath !== fullPath) {
    await fs.copy(sourcePath, fullPath);
  }
  const stat = await fs.stat(fullPath);
  await prisma.userFile.create({
    data: {
      userId,
      filename,
      originalName,
      fileType,
      storagePath,
      size: stat.size,
    },
  });
  return { storagePath, fullPath };
}
