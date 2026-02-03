'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [splitType, setSplitType] = useState<'pages' | 'individual' | 'count'>('pages');
  const [pageRanges, setPageRanges] = useState('');
  const [numParts, setNumParts] = useState(2);
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
      formData.append('split_type', splitType);
      if (splitType === 'pages') formData.append('page_ranges', pageRanges);
      if (splitType === 'count') formData.append('num_parts', String(numParts));
      const res = await fetch('/api/pdf/split', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Bir hata oluştu');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('content-disposition')?.includes('zip') ? 'split_pages.zip' : 'split.pdf';
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
      <h1 className="text-2xl font-bold text-green-600 mb-2">PDF Ayırma</h1>
      <p className="text-slate-600 mb-6">PDF dosyalarını sayfa aralıklarına veya parça sayısına göre ayırın.</p>
      <form onSubmit={onSubmit} className="bg-white p-6 rounded-xl shadow border border-slate-200 space-y-4">
        <div>
          <label className="block font-medium text-slate-700 mb-2">PDF Dosyası</label>
          <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-green-50 file:text-green-600" />
        </div>
        <div>
          <label className="block font-medium text-slate-700 mb-2">Ayırma türü</label>
          <select value={splitType} onChange={(e) => setSplitType(e.target.value as any)} className="w-full border border-slate-300 rounded-lg px-3 py-2">
            <option value="pages">Sayfa aralıkları (örn: 1-3,5,7-9)</option>
            <option value="individual">Her sayfa ayrı dosya</option>
            <option value="count">Eşit parçalara böl</option>
          </select>
        </div>
        {splitType === 'pages' && (
          <div>
            <label className="block font-medium text-slate-700 mb-2">Sayfa aralıkları</label>
            <input type="text" value={pageRanges} onChange={(e) => setPageRanges(e.target.value)} placeholder="1-3, 5, 7-9" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
          </div>
        )}
        {splitType === 'count' && (
          <div>
            <label className="block font-medium text-slate-700 mb-2">Parça sayısı</label>
            <input type="number" min={2} value={numParts} onChange={(e) => setNumParts(parseInt(e.target.value, 10) || 2)} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading || !file} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"> {loading ? 'İşleniyor...' : 'Ayır ve İndir'} </button>
      </form>
    </div>
  );
}
