import path from 'path';
import fs from 'fs-extra';

const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER || 'uploads';
const OUTPUT_FOLDER = process.env.OUTPUT_FOLDER || 'outputs';
const TEMP_FOLDER = process.env.TEMP_FOLDER || path.join(process.cwd(), 'temp_files');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

async function ensureDirs() {
  await fs.ensureDir(UPLOAD_FOLDER);
  await fs.ensureDir(OUTPUT_FOLDER);
  await fs.ensureDir(TEMP_FOLDER);
}

export { UPLOAD_FOLDER, OUTPUT_FOLDER, TEMP_FOLDER, MAX_FILE_SIZE, ensureDirs };
