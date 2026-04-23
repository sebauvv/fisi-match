import { useCallback, useState } from 'react';
import { Upload, FileCheck, X } from 'lucide-react';

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  file: File | null;
  onClear: () => void;
  disabled?: boolean;
  label?: string;
}

export default function FileDropZone({
  onFileSelect,
  file,
  onClear,
  disabled = false,
  label = 'Arrastra tu archivo PDF aqui',
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile?.type === 'application/pdf') {
        onFileSelect(droppedFile);
      }
    },
    [disabled, onFileSelect],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected?.type === 'application/pdf') {
      onFileSelect(selected);
    }
  };

  if (file) {
    return (
      <div className="flex items-center justify-between rounded-xl border-2 border-dashed border-success/40 bg-success/5 px-6 py-5 dark:border-dark-success/40 dark:bg-dark-success/5">
        <div className="flex items-center gap-3">
          <FileCheck className="h-6 w-6 text-success dark:text-dark-success" />
          <div>
            <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{file.name}</p>
            <p className="text-xs text-text-muted dark:text-dark-text-muted">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-hover hover:text-error dark:text-dark-text-muted dark:hover:bg-dark-bg-hover dark:hover:text-dark-error"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <label
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-all ${
        disabled
          ? 'cursor-not-allowed border-border/30 bg-bg-surface-alt/50 opacity-50 dark:border-dark-border/30 dark:bg-dark-bg-surface-alt/50'
          : isDragging
            ? 'border-accent bg-accent-soft dark:border-dark-accent dark:bg-dark-accent-soft'
            : 'border-border bg-bg-surface hover:border-accent/60 dark:border-dark-border dark:bg-dark-bg-surface dark:hover:border-dark-accent/60'
      }`}
    >
      <Upload
        className={`h-8 w-8 ${disabled ? 'text-text-muted dark:text-dark-text-muted' : 'text-accent dark:text-dark-accent'}`}
      />
      <div className="text-center">
        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{label}</p>
        <p className="mt-1 text-xs text-text-muted dark:text-dark-text-muted">Solo archivos PDF</p>
      </div>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />
    </label>
  );
}
