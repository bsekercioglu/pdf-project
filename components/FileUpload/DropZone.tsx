'use client';

import { useRef, useState } from 'react';

type Props = {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
  hint?: string;
  accentColor?: string;
};

const defaultAccent = 'blue';

export default function DropZone({
  onFiles,
  accept = '.pdf',
  multiple = false,
  maxFiles = 1,
  label = 'Dosya yükleyin',
  hint,
  accentColor = defaultAccent,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const borderColor = accentColor === 'blue' ? 'border-blue-400 bg-blue-50' : accentColor === 'green' ? 'border-green-400 bg-green-50' : 'border-slate-400 bg-slate-50';

  const processFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const arr = Array.from(fileList);
    const filtered = accept
      ? arr.filter((f) => {
          const exts = accept.split(',').map((e) => e.trim().toLowerCase());
          const name = f.name.toLowerCase();
          return exts.some((ext) => ext.startsWith('.') ? name.endsWith(ext) : name.endsWith(`.${ext}`));
        })
      : arr;
    const limited = multiple ? filtered.slice(0, maxFiles) : filtered.slice(0, 1);
    if (limited.length) onFiles(limited);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleClick = () => inputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    e.target.value = '';
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${isDragOver ? borderColor : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />
        <p className="text-slate-600 font-medium">{label}</p>
        <p className="mt-1 text-sm text-slate-500">
          {isDragOver ? 'Dosyayı buraya bırakın' : 'Tıklayın veya dosyayı bu alana sürükleyin'}
        </p>
        {hint && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}
