import { BookOpen, Pencil } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ThesisIdeaSectionProps {
  onEdit: () => void;
}

export default function ThesisIdeaSection({ onEdit }: ThesisIdeaSectionProps) {
  const { user } = useAuth();
  const idea = user?.thesis_idea;

  return (
    <div className="rounded-xl border border-border bg-bg-surface transition-colors dark:border-dark-border dark:bg-dark-bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4 dark:border-dark-border">
        <span className="flex items-center gap-2 text-sm font-bold text-text-primary dark:text-dark-text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-accent dark:bg-dark-accent" />
          Idea de Tesis
        </span>
        <button
          onClick={onEdit}
          className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-accent transition-colors hover:bg-accent-soft dark:text-dark-accent dark:hover:bg-dark-accent-soft"
        >
          <Pencil className="h-3 w-3" />
          {idea ? 'Actualizar' : 'Agregar'}
        </button>
      </div>
      <div className="px-5 py-4">
        {idea ? (
          <p className="text-sm leading-relaxed text-text-primary dark:text-dark-text-primary">
            {idea}
          </p>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <BookOpen className="h-8 w-8 text-text-muted dark:text-dark-text-muted" />
            <p className="text-sm text-text-muted dark:text-dark-text-muted">
              Aún no has registrado una idea de tesis.
            </p>
            <button
              onClick={onEdit}
              className="mt-1 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-hover dark:bg-dark-accent dark:hover:bg-dark-accent-hover"
            >
              Agregar idea de tesis
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
