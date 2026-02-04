'use client';

import { useState } from 'react';

type Props = {
  files: File[];
  onRemove: (index: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  reorderable?: boolean;
  acceptLabel?: string;
};

export function FileList({ files, onRemove, onReorder, reorderable = false, acceptLabel = 'Dosya' }: Props) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const moveFile = (from: number, to: number) => {
    if (onReorder && from !== to) onReorder(from, to);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (files.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border-2 border-slate-200 bg-slate-50/50 p-4">
      <p className="mb-2 text-sm font-medium text-slate-700">
        {files.length} {acceptLabel} seçildi
        {reorderable ? ' — Sürükleyerek sırayı değiştirin, çıkarmak için çöp kutusuna tıklayın' : ' — İstemezseniz kaldırabilirsiniz'}
      </p>
      <ul className="space-y-2">
        {files.map((file, index) => (
          <li
            key={`${file.name}-${index}-${file.size}`}
            draggable={reorderable}
            onDragStart={reorderable ? () => setDraggedIndex(index) : undefined}
            onDragEnd={reorderable ? () => { setDraggedIndex(null); setDragOverIndex(null); } : undefined}
            onDragOver={reorderable ? (e) => { e.preventDefault(); setDragOverIndex(index); } : undefined}
            onDragLeave={reorderable ? () => setDragOverIndex(null) : undefined}
            onDrop={
              reorderable
                ? (e) => {
                    e.preventDefault();
                    setDragOverIndex(null);
                    if (draggedIndex !== null) moveFile(draggedIndex, index);
                    setDraggedIndex(null);
                  }
                : undefined
            }
            className={`flex items-center gap-3 rounded-lg border bg-white px-3 py-2 transition-colors ${
              draggedIndex === index ? 'opacity-50 border-slate-400' : ''
            } ${dragOverIndex === index ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
          >
            {reorderable && (
              <span className="cursor-grab active:cursor-grabbing text-slate-400" title="Sürükleyerek sırayı değiştir">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </span>
            )}
            <span className="min-w-0 flex-1 truncate text-sm text-slate-800" title={file.name}>
              {reorderable ? `${index + 1}. ${file.name}` : file.name}
            </span>
            <span className="text-xs text-slate-500">{formatSize(file.size)}</span>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Listeden çıkar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
