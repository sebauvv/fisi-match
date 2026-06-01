import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface PdfViewerModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

export default function PdfViewerModal({ url, title, onClose }: PdfViewerModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-hidden bg-black/60 px-4 pt-20 backdrop-blur-sm">
      <div className="relative flex h-[80vh] w-full max-w-4xl flex-col rounded-2xl border border-border bg-bg-surface shadow-2xl dark:border-dark-border dark:bg-dark-bg-surface">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 dark:border-dark-border">
          <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary dark:text-dark-text-muted dark:hover:bg-dark-bg-hover dark:hover:text-dark-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden rounded-b-2xl">
          <iframe src={url} className="h-full w-full border-0" title={title} />
        </div>
      </div>
    </div>,
    document.body
  );
}
