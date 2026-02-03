import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';

const TEMP_BASE = process.env.TEMP_FOLDER || path.join(process.cwd(), 'temp_files');
const OUTPUT_BASE = process.env.OUTPUT_FOLDER || path.join(process.cwd(), 'outputs');

export async function getTempDir(): Promise<string> {
  const dir = path.join(TEMP_BASE, `session_${uuidv4()}`);
  await fs.ensureDir(dir);
  return dir;
}

export async function saveUploadedFile(file: File, dir: string): Promise<string> {
  const name = `${uuidv4()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const filePath = path.join(dir, name);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export function getOutputPath(filename: string): string {
  return path.join(OUTPUT_BASE, filename);
}

/** Kullanıcıya özel çıktı klasörü: outputs/{userId}/ */
export function getUserOutputDir(userId: string): string {
  return path.join(OUTPUT_BASE, userId);
}

/** Kullanıcıya özel dosya yolu: outputs/{userId}/{filename} */
export function getUserOutputPath(userId: string, filename: string): string {
  return path.join(OUTPUT_BASE, userId, filename);
}

export async function ensureOutputDir(): Promise<void> {
  await fs.ensureDir(OUTPUT_BASE);
}

export async function ensureUserOutputDir(userId: string): Promise<string> {
  const dir = getUserOutputDir(userId);
  await fs.ensureDir(dir);
  return dir;
}

export async function cleanupDir(dir: string): Promise<void> {
  await fs.remove(dir).catch(() => {});
}
