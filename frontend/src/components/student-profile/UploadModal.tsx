import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import FileDropZone from '../ui/FileDropZone';

interface UploadModalProps {
  title: string;
  onClose: () => void;
  onSubmit: (file: File) => void;
}

export default function UploadModal({ title, onClose, onSubmit }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleSubmit = () => {
    if (!file) return;
    onSubmit(file);
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 220);
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-200 ${
        visible ? 'bg-black/60 opacity-100' : 'bg-black/60 opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl border border-border bg-bg-surface p-6 shadow-2xl transition-all duration-250 dark:border-dark-border dark:bg-dark-bg-surface ${
          visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-5 scale-[0.97] opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary">{title}</h3>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary dark:text-dark-text-muted dark:hover:bg-dark-bg-hover dark:hover:text-dark-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-text-secondary dark:text-dark-text-secondary">
          Sube el nuevo archivo PDF para reemplazar el documento actual.
        </p>

        <FileDropZone
          onFileSelect={setFile}
          file={file}
          onClear={() => setFile(null)}
          label="Arrastra tu archivo PDF aquí"
        />

        <button
          onClick={handleSubmit}
          disabled={!file}
          className="mt-5 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40 dark:bg-dark-accent dark:hover:bg-dark-accent-hover"
        >
          Subir documento
        </button>
      </div>
    </div>,
    document.body
  );
}
