import { GraduationCap } from 'lucide-react';
import FileDropZone from '../ui/FileDropZone';

interface StepMatriculaProps {
  file: File | null;
  isEgresado: boolean;
  onFileSelect: (f: File) => void;
  onClear: () => void;
  onToggleEgresado: () => void;
  onNext: () => void;
}

export default function StepMatricula({
  file,
  isEgresado,
  onFileSelect,
  onClear,
  onToggleEgresado,
  onNext,
}: StepMatriculaProps) {
  const canProceed = isEgresado || !!file;

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <h2 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">
        Reporte de Matricula
      </h2>
      <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
        Sube el reporte de matricula del ciclo actual. Si eres egresado, marca la casilla.
      </p>

      <FileDropZone
        onFileSelect={onFileSelect}
        file={file}
        onClear={onClear}
        disabled={isEgresado}
        label="Arrastra tu reporte de matricula aqui"
      />

      {/* Toggle egresado */}
      <button
        type="button"
        onClick={onToggleEgresado}
        className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
          isEgresado
            ? 'border-accent bg-accent-soft dark:border-dark-accent dark:bg-dark-accent-soft'
            : 'border-border bg-bg-surface dark:border-dark-border dark:bg-dark-bg-surface'
        }`}
      >
        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
            isEgresado
              ? 'border-accent bg-accent text-white dark:border-dark-accent dark:bg-dark-accent'
              : 'border-border dark:border-dark-border'
          }`}
        >
          {isEgresado && <span className="text-xs font-bold">✓</span>}
        </div>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-text-secondary dark:text-dark-text-secondary" />
          <span className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
            Soy Egresado
          </span>
        </div>
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40 dark:bg-dark-accent dark:hover:bg-dark-accent-hover"
      >
        Siguiente
      </button>
    </div>
  );
}
