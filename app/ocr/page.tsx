'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function OCRPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Bir dosya seçin (PDF veya görsel).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/ocr/process', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Bir hata oluştu');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('content-disposition')?.includes('zip') ? 'ocr_results.zip' : 'extracted_text.txt';
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
      <h1 className="text-2xl font-bold text-amber-600 mb-2">OCR Tanıma</h1>
      <p className="text-slate-600 mb-6">Görsellerden ve taranmış PDF'lerden metin çıkarın.</p>
      <form onSubmit={onSubmit} className="bg-white p-6 rounded-xl shadow border border-slate-200 space-y-4">
        <div>
          <label className="block font-medium text-slate-700 mb-2">Dosya (PDF, JPG, PNG)</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-amber-50 file:text-amber-700" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading || !file} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"> {loading ? 'İşleniyor...' : 'OCR Çalıştır ve İndir'} </button>
      </form>
    </div>
  );
}
