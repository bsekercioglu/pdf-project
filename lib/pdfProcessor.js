const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { PDFDocument, rgb } = require('pdf-lib');
const pdf2pic = require('pdf2pic');
const sharp = require('sharp');
const AdmZip = require('adm-zip');

const getTempDir = () => path.join(process.env.TEMP_FOLDER || process.cwd(), 'temp_files', 'temp');

class PDFProcessor {
  constructor() {
    this.tempDir = getTempDir();
    fs.ensureDirSync(this.tempDir);
  }

  async mergePdfs(inputFiles, outputPath) {
    const mergedPdf = await PDFDocument.create();
    for (let i = 0; i < inputFiles.length; i++) {
      const filePath = inputFiles[i];
      if (!(await fs.pathExists(filePath))) throw new Error(`Dosya bulunamadı: ${filePath}`);
      const fileSize = (await fs.stat(filePath)).size;
      if (fileSize === 0) continue;
      const pdfBytes = await fs.readFile(filePath);
      const pdf = await PDFDocument.load(pdfBytes);
      const pageIndices = pdf.getPageIndices();
      const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    await fs.ensureDir(path.dirname(outputPath));
    const mergedPdfBytes = await mergedPdf.save();
    await fs.writeFile(outputPath, mergedPdfBytes);
    return true;
  }

  async splitByPages(inputFile, pageRanges) {
    const pdfBytes = await fs.readFile(inputFile);
    const pdf = await PDFDocument.load(pdfBytes);
    const outputFiles = [];
    const ranges = (pageRanges || '').split(',');
    for (let i = 0; i < ranges.length; i++) {
      const rangeStr = ranges[i].trim();
      if (!rangeStr) continue;
      let pages = [];
      if (rangeStr.includes('-')) {
        const [start, end] = rangeStr.split('-').map((p) => parseInt(p.trim(), 10));
        pages = Array.from({ length: end - start + 1 }, (_, idx) => start - 1 + idx);
      } else {
        pages = [parseInt(rangeStr, 10) - 1];
      }
      const newPdf = await PDFDocument.create();
      for (const pageNum of pages) {
        if (pageNum >= 0 && pageNum < pdf.getPageCount()) {
          const [copiedPage] = await newPdf.copyPages(pdf, [pageNum]);
          newPdf.addPage(copiedPage);
        }
      }
      if (newPdf.getPageCount() > 0) {
        const outputFilename = `split_${i + 1}_${uuidv4()}.pdf`;
        const outputPath = path.join(this.tempDir, outputFilename);
        await fs.writeFile(outputPath, await newPdf.save());
        outputFiles.push(outputPath);
      }
    }
    return outputFiles;
  }

  async splitIndividualPages(inputFile) {
    const pdfBytes = await fs.readFile(inputFile);
    const pdf = await PDFDocument.load(pdfBytes);
    const outputFiles = [];
    for (let pageNum = 0; pageNum < pdf.getPageCount(); pageNum++) {
      const newPdf = await PDFDocument.create();
      const [copiedPage] = await newPdf.copyPages(pdf, [pageNum]);
      newPdf.addPage(copiedPage);
      const outputPath = path.join(this.tempDir, `page_${pageNum + 1}_${uuidv4()}.pdf`);
      await fs.writeFile(outputPath, await newPdf.save());
      outputFiles.push(outputPath);
    }
    return outputFiles;
  }

  async splitByCount(inputFile, numParts) {
    const pdfBytes = await fs.readFile(inputFile);
    const pdf = await PDFDocument.load(pdfBytes);
    const totalPages = pdf.getPageCount();
    const pagesPerPart = Math.floor(totalPages / numParts);
    const remainder = totalPages % numParts;
    const outputFiles = [];
    let currentPage = 0;
    for (let part = 0; part < numParts; part++) {
      const newPdf = await PDFDocument.create();
      const pagesInThisPart = pagesPerPart + (part < remainder ? 1 : 0);
      for (let i = 0; i < pagesInThisPart && currentPage < totalPages; i++) {
        const [copiedPage] = await newPdf.copyPages(pdf, [currentPage]);
        newPdf.addPage(copiedPage);
        currentPage++;
      }
      if (newPdf.getPageCount() > 0) {
        const outputPath = path.join(this.tempDir, `part_${part + 1}_${uuidv4()}.pdf`);
        await fs.writeFile(outputPath, await newPdf.save());
        outputFiles.push(outputPath);
      }
    }
    return outputFiles;
  }

  async compressPdf(inputFile, outputFile, quality = 'medium') {
    const qualitySettings = {
      high: { dpi: 150, quality: 80 },
      medium: { dpi: 120, quality: 65 },
      low: { dpi: 100, quality: 45 },
    };
    const pdfBytes = await fs.readFile(inputFile);
    const pdf = await PDFDocument.load(pdfBytes);
    pdf.setTitle('');
    pdf.setAuthor('');
    pdf.setSubject('');
    pdf.setKeywords([]);
    pdf.setProducer('');
    pdf.setCreator('');
    const now = new Date();
    pdf.setCreationDate(now);
    pdf.setModificationDate(now);
    const compressedBytes = await pdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
      updateFieldAppearances: false,
      compress: true,
    });
    await fs.writeFile(outputFile, compressedBytes);
    return true;
  }

  async extractImages(inputFile) {
    const convert = pdf2pic.fromPath(inputFile, {
      density: 100,
      saveFilename: 'page',
      savePath: this.tempDir,
      format: 'png',
      width: 2000,
      height: 2000,
    });
    const results = await convert.bulk(-1);
    const imageFiles = [];
    for (let i = 0; i < results.length; i++) {
      const imagePath = path.join(this.tempDir, `image_${i + 1}_${uuidv4()}.png`);
      await fs.move(results[i].path, imagePath);
      imageFiles.push(imagePath);
    }
    return imageFiles;
  }

  async extractText(inputFile) {
    const pdfParse = require('pdf-parse');
    const pdfBuffer = await fs.readFile(inputFile);
    const data = await pdfParse(pdfBuffer);
    return data.text || '';
  }

  async deletePages(inputFile, outputFile, pagesToDelete) {
    const pdfBytes = await fs.readFile(inputFile);
    const pdf = await PDFDocument.load(pdfBytes);
    const newPdf = await PDFDocument.create();
    const toDelete = (pagesToDelete || '')
      .split(',')
      .map((p) => parseInt(p.trim(), 10) - 1)
      .filter((p) => !Number.isNaN(p));
    for (let pageNum = 0; pageNum < pdf.getPageCount(); pageNum++) {
      if (!toDelete.includes(pageNum)) {
        const [copiedPage] = await newPdf.copyPages(pdf, [pageNum]);
        newPdf.addPage(copiedPage);
      }
    }
    await fs.writeFile(outputFile, await newPdf.save());
    return true;
  }

  async reorderPages(inputFile, outputFile, newOrder) {
    const pdfBytes = await fs.readFile(inputFile);
    const pdf = await PDFDocument.load(pdfBytes);
    const newPdf = await PDFDocument.create();
    const order = (newOrder || '')
      .split(',')
      .map((p) => parseInt(p.trim(), 10) - 1)
      .filter((p) => !Number.isNaN(p) && p >= 0 && p < pdf.getPageCount());
    for (const pageNum of order) {
      const [copiedPage] = await newPdf.copyPages(pdf, [pageNum]);
      newPdf.addPage(copiedPage);
    }
    await fs.writeFile(outputFile, await newPdf.save());
    return true;
  }

  async encryptPdf(inputFile, outputFile, password) {
    const pdfBytes = await fs.readFile(inputFile);
    const pdf = await PDFDocument.load(pdfBytes);
    const bytes = await pdf.save({
      userPassword: password,
      ownerPassword: password,
      permissions: { printing: 'allowAll', modifying: 'allowAll', copying: 'allowAll' },
    });
    await fs.writeFile(outputFile, bytes);
    return true;
  }

  async decryptPdf(inputFile, outputFile, password) {
    const pdfBytes = await fs.readFile(inputFile);
    const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    await fs.writeFile(outputFile, await pdf.save());
    return true;
  }

  async addTextWatermark(inputFile, outputFile, watermarkText) {
    const pdfBytes = await fs.readFile(inputFile);
    const pdf = await PDFDocument.load(pdfBytes);
    const asciiText = String(watermarkText)
      .replace(/İ/g, 'I').replace(/ı/g, 'i').replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
      .replace(/Ü/g, 'U').replace(/ü/g, 'u').replace(/Ş/g, 'S').replace(/ş/g, 's')
      .replace(/Ç/g, 'C').replace(/ç/g, 'c').replace(/Ö/g, 'O').replace(/ö/g, 'o');
    const pages = pdf.getPages();
    for (const page of pages) {
      const { width, height } = page.getSize();
      page.drawText(asciiText, {
        x: width / 2 - 100,
        y: height / 2,
        size: 30,
        color: rgb(0.7, 0.7, 0.7),
        opacity: 0.3,
        rotate: { type: 'degrees', angle: 45 },
      });
    }
    await fs.writeFile(outputFile, await pdf.save());
    return true;
  }

  async addImageWatermark(inputFile, outputFile, watermarkImagePath) {
    if (!(await fs.pathExists(watermarkImagePath))) throw new Error('Filigran dosyası bulunamadı');
    const pdfBytes = await fs.readFile(inputFile);
    const pdf = await PDFDocument.load(pdfBytes);
    const ext = path.extname(watermarkImagePath).toLowerCase();
    const imageBytes = await fs.readFile(watermarkImagePath);
    const watermarkImage = ext === '.png' ? await pdf.embedPng(imageBytes) : await pdf.embedJpg(imageBytes);
    const pages = pdf.getPages();
    for (const page of pages) {
      const { width, height } = page.getSize();
      page.drawImage(watermarkImage, {
        x: width / 2 - 100,
        y: height / 2 - 50,
        width: 200,
        height: 100,
        opacity: 0.3,
      });
    }
    await fs.writeFile(outputFile, await pdf.save());
    return true;
  }

  async pdfToImages(inputFile) {
    const convert = pdf2pic.fromPath(inputFile, {
      density: 200,
      saveFilename: 'page',
      savePath: this.tempDir,
      format: 'png',
      width: 2000,
      height: 2000,
    });
    const results = await convert.bulk(50);
    const imageFiles = [];
    for (let i = 0; i < results.length; i++) {
      const imagePath = path.join(this.tempDir, `page_${i + 1}_${uuidv4()}.png`);
      await fs.move(results[i].path, imagePath);
      imageFiles.push(imagePath);
    }
    return imageFiles;
  }
}

module.exports = PDFProcessor;
