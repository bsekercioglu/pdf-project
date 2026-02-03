'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type FileItem = {
  id: string;
  originalName: string;
  fileType: string;
  size: number;
  createdAt: string;
};

export default function MyFilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/files/list');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Liste alınamadı');
      setFiles(data.files || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const download = (id: string) => {
    window.open(`/api/files/download/${id}`, '_blank');
  };

  const remove = async (id: string) => {
    if (!confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Silinemedi');
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Silme hatası');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (s: string) => {
    return new Date(s).toLocaleString('tr-TR');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-blue-600 hover:underline">← Ana Sayfa</Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Benim Dosyalarım</h1>
      <p className="text-slate-600 text-sm mb-6">
        İşlem yaptığınız dosyalar burada listelenir. 1 ay sonra otomatik silinir.
      </p>
      {loading && <p className="text-slate-500">Yükleniyor...</p>}
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {!loading && !error && files.length === 0 && (
        <div className="bg-slate-100 rounded-lg p-6 text-center text-slate-600">
          Henüz dosya yok. PDF işlemlerinden birini kullanarak dosya oluşturabilirsiniz.
        </div>
      )}
      {!loading && files.length > 0 && (
        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-700">Dosya adı</th>
                <th className="px-4 py-3 font-medium text-slate-700">Tür</th>
                <th className="px-4 py-3 font-medium text-slate-700">Boyut</th>
                <th className="px-4 py-3 font-medium text-slate-700">Tarih</th>
                <th className="px-4 py-3 font-medium text-slate-700 w-32">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-800 truncate max-w-[200px]" title={f.originalName}>
                    {f.originalName}
                  </td>
                  <td className="px-4 py-3 text-slate-600 uppercase text-sm">{f.fileType}</td>
                  <td className="px-4 py-3 text-slate-600">{formatSize(f.size)}</td>
                  <td className="px-4 py-3 text-slate-600 text-sm">{formatDate(f.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => download(f.id)}
                      className="text-blue-600 hover:underline mr-3 text-sm"
                    >
                      İndir
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(f.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
