'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PageOperationsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [operation, setOperation] = useState<'delete' | 'reorder'>('delete');
  const [pagesToDelete, setPagesToDelete] = useState('');
  const [newOrder, setNewOrder] = useState('');
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
      formData.append('operation', operation);
      if (operation === 'delete') formData.append('pages_to_delete', pagesToDelete);
      if (operation === 'reorder') formData.append('new_order', newOrder);
      const res = await fetch('/api/pdf/page-operations', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Bir hata oluştu');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'processed.pdf';
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
      <h1 className="text-2xl font-bold text-violet-600 mb-2">Sayfa İşlemleri</h1>
      <p className="text-slate-600 mb-6">Sayfa silme veya yeniden sıralama.</p>
      <form onSubmit={onSubmit} className="bg-white p-6 rounded-xl shadow border border-slate-200 space-y-4">
        <div>
          <label className="block font-medium text-slate-700 mb-2">PDF Dosyası</label>
          <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-violet-50 file:text-violet-600" />
        </div>
        <div>
          <label className="block font-medium text-slate-700 mb-2">İşlem</label>
          <select value={operation} onChange={(e) => setOperation(e.target.value as any)} className="w-full border border-slate-300 rounded-lg px-3 py-2">
            <option value="delete">Sayfa sil</option>
            <option value="reorder">Sayfa sırala</option>
          </select>
        </div>
        {operation === 'delete' && (
          <div>
            <label className="block font-medium text-slate-700 mb-2">Silinecek sayfa numaraları (virgülle: 1,3,5)</label>
            <input type="text" value={pagesToDelete} onChange={(e) => setPagesToDelete(e.target.value)} placeholder="1, 3, 5" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
          </div>
        )}
        {operation === 'reorder' && (
          <div>
            <label className="block font-medium text-slate-700 mb-2">Yeni sıra (örn: 3,1,2)</label>
            <input type="text" value={newOrder} onChange={(e) => setNewOrder(e.target.value)} placeholder="3, 1, 2" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading || !file} className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"> {loading ? 'İşleniyor...' : 'Uygula ve İndir'} </button>
      </form>
    </div>
  );
}
