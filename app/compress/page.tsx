'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CompressPage() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Bir PDF dosyası seçin.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('quality', quality);
      const res = await fetch('/api/pdf/compress', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Bir hata oluştu');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'compressed.pdf';
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
      <h1 className="text-2xl font-bold text-slate-700 mb-2">PDF Sıkıştırma</h1>
      <p className="text-slate-600 mb-6">PDF dosya boyutunu küçültün.</p>
      <form onSubmit={onSubmit} className="bg-white p-6 rounded-xl shadow border border-slate-200 space-y-4">
        <div>
          <label className="block font-medium text-slate-700 mb-2">PDF Dosyası</label>
          <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-slate-100 file:text-slate-700" />
        </div>
        <div>
          <label className="block font-medium text-slate-700 mb-2">Kalite</label>
          <select value={quality} onChange={(e) => setQuality(e.target.value as any)} className="w-full border border-slate-300 rounded-lg px-3 py-2">
            <option value="high">Yüksek</option>
            <option value="medium">Orta</option>
            <option value="low">Düşük (daha küçük dosya)</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading || !file} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50"> {loading ? 'İşleniyor...' : 'Sıkıştır ve İndir'} </button>
      </form>
    </div>
  );
}
