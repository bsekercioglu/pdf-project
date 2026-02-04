'use client';

import { useState } from 'react';
import Link from 'next/link';
import DropZone from '@/components/FileUpload/DropZone';
import { FileList } from '@/components/FileUpload/FileList';

export default function WatermarkPage() {
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkImageFiles, setWatermarkImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const file = pdfFiles[0] ?? null;
  const watermarkImage = watermarkImageFiles[0] ?? null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Bir PDF dosyası seçin.');
      return;
    }
    if (watermarkType === 'text' && !watermarkText.trim()) {
      setError('Filigran metni girin.');
      return;
    }
    if (watermarkType === 'image' && !watermarkImage) {
      setError('Filigran görseli seçin.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('watermark_type', watermarkType);
      if (watermarkType === 'text') formData.append('watermark_text', watermarkText);
      if (watermarkType === 'image' && watermarkImage) formData.append('watermark_image', watermarkImage);
      const res = await fetch('/api/pdf/watermark', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Bir hata oluştu');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'watermarked.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6"><Link href="/" className="text-blue-600 hover:underline">← Ana Sayfa</Link></div>
      <h1 className="text-2xl font-bold text-teal-600 mb-2">Filigran</h1>
      <p className="text-slate-600 mb-6">PDF'lere metin veya görsel filigran ekleyin.</p>
      <form onSubmit={onSubmit} className="bg-white p-6 rounded-xl shadow border border-slate-200 space-y-4">
        <div>
          <label className="block font-medium text-slate-700 mb-2">PDF Dosyası</label>
          <DropZone
            onFiles={(f) => setPdfFiles(f.slice(0, 1))}
            accept=".pdf"
            label="PDF dosyasını buraya sürükleyin veya tıklayın"
            hint="Tek dosya"
            accentColor="teal"
          />
          <FileList files={pdfFiles} onRemove={(i) => setPdfFiles((prev) => prev.filter((_, idx) => idx !== i))} acceptLabel="dosya" />
        </div>
        <div>
          <label className="block font-medium text-slate-700 mb-2">Filigran türü</label>
          <select value={watermarkType} onChange={(e) => setWatermarkType(e.target.value as 'text' | 'image')} className="w-full border border-slate-300 rounded-lg px-3 py-2">
            <option value="text">Metin</option>
            <option value="image">Görsel</option>
          </select>
        </div>
        {watermarkType === 'text' && (
          <div>
            <label className="block font-medium text-slate-700 mb-2">Filigran metni</label>
            <input type="text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} placeholder="Örn: GİZLİDİR" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
          </div>
        )}
        {watermarkType === 'image' && (
          <div>
            <label className="block font-medium text-slate-700 mb-2">Filigran görseli (PNG/JPG)</label>
            <DropZone
              onFiles={(f) => setWatermarkImageFiles(f.slice(0, 1))}
              accept=".png,.jpg,.jpeg"
              label="Filigran görselini buraya sürükleyin veya tıklayın"
              hint="Tek dosya"
              accentColor="teal"
            />
            <FileList files={watermarkImageFiles} onRemove={(i) => setWatermarkImageFiles((prev) => prev.filter((_, idx) => idx !== i))} acceptLabel="görsel" />
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading || !file} className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50"> {loading ? 'İşleniyor...' : 'Filigran Ekle ve İndir'} </button>
      </form>
    </div>
  );
}
