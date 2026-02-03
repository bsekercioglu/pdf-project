const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');

const getTempDir = () => path.join(process.env.TEMP_FOLDER || process.cwd(), 'temp_files', 'ocr_temp');

class OCRProcessor {
  constructor() {
    this.tempDir = getTempDir();
    fs.ensureDirSync(this.tempDir);
  }

  async processPdf(pdfPath) {
    let extractedText = '';
    try {
      const pdfParse = require('pdf-parse');
      const pdfBuffer = await fs.readFile(pdfPath);
      const data = await pdfParse(pdfBuffer);
      if (data.text && data.text.trim()) {
        extractedText = data.text;
      } else {
        const pdf2pic = require('pdf2pic');
        const convert = pdf2pic.fromPath(pdfPath, {
          density: 200,
          saveFilename: 'page',
          savePath: this.tempDir,
          format: 'png',
          width: 2000,
          height: 2000,
        });
        const results = await convert.bulk(-1);
        for (let i = 0; i < results.length; i++) {
          const { data: { text } } = await Tesseract.recognize(results[i].path, 'tur+eng');
          extractedText += `--- Sayfa ${i + 1} ---\n${text}\n\n`;
          await fs.remove(results[i].path).catch(() => {});
        }
      }
    } catch (e) {
      throw new Error('PDF işlenemedi: ' + (e && e.message));
    }
    if (!extractedText.trim()) throw new Error('Hiç metin çıkarılamadı.');
    const txtPath = path.join(this.tempDir, `ocr_text_${uuidv4()}.txt`);
    await fs.writeFile(txtPath, extractedText, 'utf8');
    return { txtPath, pdfPath: null };
  }

  async processImage(imagePath) {
    const { data: { text } } = await Tesseract.recognize(imagePath, 'tur+eng');
    const txtPath = path.join(this.tempDir, `ocr_text_${uuidv4()}.txt`);
    await fs.writeFile(txtPath, text, 'utf8');
    const pdfPath = path.join(this.tempDir, `ocr_pdf_${uuidv4()}.pdf`);
    const ocrPage = await this.createOcrPage(imagePath, text);
    await this.createOcrPdf([ocrPage], pdfPath);
    return { txtPath, pdfPath };
  }

  async createOcrPage(imagePath, text) {
    const imageBuffer = await fs.readFile(imagePath);
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const imgWidth = metadata.width || 600;
    const imgHeight = metadata.height || 800;
    const pdfWidth = imgWidth * 0.75;
    const pdfHeight = imgHeight * 0.75 + 200;
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([pdfWidth, pdfHeight]);
    const pngBuffer = metadata.format === 'png' ? imageBuffer : await image.png().toBuffer();
    const embeddedImage = await pdf.embedPng(pngBuffer);
    page.drawImage(embeddedImage, { x: 0, y: 200, width: pdfWidth, height: imgHeight * 0.75 });
    page.drawText('OCR ile Çıkarılan Metin:', { x: 10, y: 180, size: 10, color: { r: 0, g: 0, b: 0 } });
    const lines = String(text).split('\n');
    let yPosition = 140;
    for (let i = 0; i < Math.min(lines.length, 20) && yPosition > 20; i++) {
      const line = (lines[i] || '').trim();
      if (line) {
        const displayLine = line.length > 80 ? line.substring(0, 80) + '...' : line;
        page.drawText(displayLine, { x: 10, y: yPosition, size: 8, color: { r: 0, g: 0, b: 0 } });
        yPosition -= 15;
      }
    }
    const tempPdfPath = path.join(this.tempDir, `temp_ocr_${uuidv4()}.pdf`);
    await fs.writeFile(tempPdfPath, await pdf.save());
    return tempPdfPath;
  }

  async createOcrPdf(pages, outputPath) {
    const pdf = await PDFDocument.create();
    for (const pagePath of pages) {
      try {
        const pagePdfBytes = await fs.readFile(pagePath);
        const pagePdf = await PDFDocument.load(pagePdfBytes);
        const copiedPages = await pdf.copyPages(pagePdf, pagePdf.getPageIndices());
        copiedPages.forEach((p) => pdf.addPage(p));
        await fs.remove(pagePath).catch(() => {});
      } catch (_) {}
    }
    await fs.writeFile(outputPath, await pdf.save());
    return true;
  }
}

module.exports = OCRProcessor;
