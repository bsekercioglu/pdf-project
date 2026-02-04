'use client';

import { useState } from 'react';
import Link from 'next/link';
import DropZone from '@/components/FileUpload/DropZone';
import { FileList } from '@/components/FileUpload/FileList';

const MAX_FILES = 10;

export default function MergePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onFilesAdded = (newFiles: File[]) => {
    setError('');
    setFiles((prev) => [...prev, ...newFiles].slice(0, MAX_FILES));
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
        <DropZone
          onFiles={onFilesAdded}
          accept=".pdf"
          multiple
          maxFiles={MAX_FILES}
          label="PDF dosyalarını buraya sürükleyin veya tıklayın"
          hint={`Maksimum ${MAX_FILES} dosya, her biri 50MB. Yeni seçilenler listeye eklenir.`}
          accentColor="blue"
        />
        <FileList
          files={files}
          onRemove={removeFile}
          onReorder={moveFile}
          reorderable
          acceptLabel="dosya"
        />
        {files.length > 0 && <p className="mt-2 text-sm text-slate-500">En az 2 dosya olmalı.</p>}
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
