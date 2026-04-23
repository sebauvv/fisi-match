import FileDropZone from '../ui/FileDropZone';

interface StepCVProps {
  file: File | null;
  onFileSelect: (f: File) => void;
  onClear: () => void;
  onNext: () => void;
}

export default function StepCV({ file, onFileSelect, onClear, onNext }: StepCVProps) {
  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <h2 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">
        Curriculum Vitae
      </h2>
      <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
        Sube el PDF de tu CV. Se extraeran tus habilidades, experiencia y proyectos.
      </p>

      <FileDropZone
        onFileSelect={onFileSelect}
        file={file}
        onClear={onClear}
        label="Arrastra tu CV aqui"
      />

      <button
        type="button"
        onClick={onNext}
        disabled={!file}
        className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40 dark:bg-dark-accent dark:hover:bg-dark-accent-hover"
      >
        Siguiente
      </button>
    </div>
  );
}
