'use client';

import { useState } from 'react';
import Link from 'next/link';

const MAX_FILES = 10;

export default function MergePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const pdfs = selected.filter((f) => f.name.toLowerCase().endsWith('.pdf'));
    setError('');
    setFiles((prev) => {
      const combined = [...prev];
      for (const f of pdfs) {
        if (combined.length >= MAX_FILES) break;
        combined.push(f);
      }
      return combined.slice(0, MAX_FILES);
    });
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setError('');
  };

  const moveFile = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setFiles((prev) => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const handleDragLeave = () => setDragOverIndex(null);
  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (draggedIndex === null) return;
    moveFile(draggedIndex, toIndex);
    setDraggedIndex(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length < 2) {
      setError('En az 2 PDF dosyası seçin.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      const res = await fetch('/api/pdf/merge', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Bir hata oluştu');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
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
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline">← Ana Sayfa</Link>
      </div>
      <h1 className="text-2xl font-bold text-blue-600 mb-2">PDF Birleştirme</h1>
      <p className="text-slate-600 mb-6">Birden fazla PDF dosyasını tek dosyada birleştirin. Sırayı sürükleyerek değiştirebilir, istemediğinizi listeden çıkarabilirsiniz.</p>
      <form onSubmit={onSubmit} className="bg-white p-6 rounded-xl shadow border border-slate-200">
        <label className="block font-medium text-slate-700 mb-2">PDF Dosyaları (en az 2)</label>
        <input
          type="file"
          accept=".pdf"
          multiple
          onChange={onFileChange}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-600"
        />
        <p className="text-sm text-slate-500 mt-1">Maksimum {MAX_FILES} dosya, her biri 50MB&apos;a kadar. Yeni seçtiğiniz dosyalar listeye eklenir.</p>

        {files.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-700 mb-2">Sıra (sürükleyerek değiştirin, birleştirme sırası buradaki gibi olur):</p>
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border bg-slate-50 transition-colors ${
                    draggedIndex === index ? 'opacity-50 border-blue-400' : ''
                  } ${dragOverIndex === index ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
                >
                  <span
                    className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
                    title="Sürükleyerek sırayı değiştir"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                  </span>
                  <span className="flex-1 truncate text-sm text-slate-800" title={file.name}>
                    {index + 1}. {file.name}
                  </span>
                  <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Listeden çıkar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-slate-500">{files.length} dosya • En az 2 olmalı</p>
          </div>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || files.length < 2}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'İşleniyor...' : 'Birleştir ve İndir'}
        </button>
      </form>
    </div>
  );
}
