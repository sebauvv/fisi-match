import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = 'Procesando...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-bg-surface px-10 py-8 shadow-2xl dark:bg-dark-bg-surface">
        <Loader2 className="h-10 w-10 animate-spin text-accent dark:text-dark-accent" />
        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{message}</p>
      </div>
    </div>
  );
}
