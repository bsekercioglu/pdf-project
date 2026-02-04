'use client';

import { useState } from 'react';
import Link from 'next/link';
import DropZone from '@/components/FileUpload/DropZone';
import { FileList } from '@/components/FileUpload/FileList';

export default function PasswordPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [operation, setOperation] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const file = files[0] ?? null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Bir PDF dosyası seçin.');
      return;
    }
    if (operation === 'encrypt' && !password.trim()) {
      setError('Şifre girin.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('operation', operation);
      formData.append('password', password);
      const res = await fetch('/api/pdf/password', { method: 'POST', body: formData });
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
      <h1 className="text-2xl font-bold text-indigo-600 mb-2">Şifreleme</h1>
      <p className="text-slate-600 mb-6">PDF'e şifre ekleyin veya mevcut şifreyi kaldırın.</p>
      <form onSubmit={onSubmit} className="bg-white p-6 rounded-xl shadow border border-slate-200 space-y-4">
        <div>
          <label className="block font-medium text-slate-700 mb-2">PDF Dosyası</label>
          <DropZone
            onFiles={(f) => setFiles(f.slice(0, 1))}
            accept=".pdf"
            label="PDF dosyasını buraya sürükleyin veya tıklayın"
            hint="Tek dosya"
            accentColor="indigo"
          />
          <FileList files={files} onRemove={(i) => setFiles((prev) => prev.filter((_, idx) => idx !== i))} acceptLabel="dosya" />
        </div>
        <div>
          <label className="block font-medium text-slate-700 mb-2">İşlem</label>
          <select value={operation} onChange={(e) => setOperation(e.target.value as 'encrypt' | 'decrypt')} className="w-full border border-slate-300 rounded-lg px-3 py-2">
            <option value="encrypt">Şifrele</option>
            <option value="decrypt">Şifreyi kaldır</option>
          </select>
        </div>
        <div>
          <label className="block font-medium text-slate-700 mb-2">{operation === 'encrypt' ? 'Şifre' : 'Mevcut şifre (açmak için)'}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Şifre" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading || !file} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"> {loading ? 'İşleniyor...' : 'Uygula ve İndir'} </button>
      </form>
    </div>
  );
}
