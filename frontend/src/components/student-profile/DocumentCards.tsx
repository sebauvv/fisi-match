import { FileText, Monitor, User, Check } from 'lucide-react';

interface DocumentCardsProps {
  hasHistorial: boolean;
  hasMatricula: boolean;
  hasCv: boolean;
  onViewHistorial: () => void;
  onViewMatricula: () => void;
  onUploadHistorial: () => void;
  onUploadMatricula: () => void;
  onUploadCv: () => void;
}

interface DocItem {
  key: 'historial' | 'matricula' | 'cv';
  title: string;
  icon: typeof FileText;
  iconBg: string;
  iconColor: string;
  hasFile: boolean;
  onView: () => void;
  onUpload: () => void;
}

export default function DocumentCards({
  hasHistorial,
  hasMatricula,
  hasCv,
  onViewHistorial,
  onViewMatricula,
  onUploadHistorial,
  onUploadMatricula,
  onUploadCv,
}: DocumentCardsProps) {
  const docs: DocItem[] = [
    {
      key: 'historial',
      title: 'Historial Académico',
      icon: FileText,
      iconBg: 'bg-accent-soft dark:bg-dark-accent-soft',
      iconColor: 'text-accent dark:text-dark-accent',
      hasFile: hasHistorial,
      onView: onViewHistorial,
      onUpload: onUploadHistorial,
    },
    {
      key: 'matricula',
      title: 'Reporte de Matrícula',
      icon: Monitor,
      iconBg: 'bg-warning-soft dark:bg-dark-warning-soft',
      iconColor: 'text-warning dark:text-dark-warning',
      hasFile: hasMatricula,
      onView: onViewMatricula,
      onUpload: onUploadMatricula,
    },
    {
      key: 'cv',
      title: 'Currículum Vitae',
      icon: User,
      iconBg: 'bg-success-soft dark:bg-dark-success-soft',
      iconColor: 'text-success dark:text-dark-success',
      hasFile: hasCv,
      onView: () => {}, // CV no tiene visor PDF dedicado en este flujo
      onUpload: onUploadCv,
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-bg-surface transition-colors dark:border-dark-border dark:bg-dark-bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4 dark:border-dark-border">
        <span className="flex items-center gap-2 text-sm font-bold text-text-primary dark:text-dark-text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-accent dark:bg-dark-accent" />
          Documentos Académicos
        </span>
        <span className="text-[11px] text-text-muted dark:text-dark-text-muted">
          Haz clic en un documento para actualizar
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
        {docs.map((doc) => (
          <div key={doc.key} className="flex flex-col">
            <button
              onClick={doc.onUpload}
              className={`relative rounded-xl border p-4 text-center transition-all duration-200 hover:-translate-y-0.5 ${
                doc.hasFile
                  ? 'border-success bg-success-soft/20 dark:border-dark-success dark:bg-dark-success-soft/20'
                  : 'border-dashed border-border hover:border-accent hover:bg-accent-soft/30 dark:border-dark-border dark:hover:border-dark-accent dark:hover:bg-dark-accent-soft/30'
              }`}
            >
              {doc.hasFile && (
                <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-success text-white dark:bg-dark-success">
                  <Check className="h-3 w-3" />
                </div>
              )}
              <div
                className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg ${doc.iconBg} ${doc.iconColor}`}
              >
                <doc.icon className="h-5 w-5" />
              </div>
              <p className="text-[13px] font-semibold text-text-primary dark:text-dark-text-primary">
                {doc.title}
              </p>
              <p
                className={`mt-0.5 text-[11px] ${
                  doc.hasFile
                    ? 'font-medium text-success dark:text-dark-success'
                    : 'text-text-muted dark:text-dark-text-muted'
                }`}
              >
                {doc.hasFile ? 'Actualizado' : 'Sin archivo · Click para subir'}
              </p>
            </button>

            <div className="mt-2 flex items-center justify-center gap-2">
              {doc.hasFile && doc.key !== 'cv' && (
                <button
                  onClick={doc.onView}
                  className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-accent transition-colors hover:bg-accent-soft dark:text-dark-accent dark:hover:bg-dark-accent-soft"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Ver PDF
                </button>
              )}
              <button
                onClick={doc.onUpload}
                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-accent transition-colors hover:bg-accent-soft dark:text-dark-accent dark:hover:bg-dark-accent-soft"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {doc.hasFile ? 'Actualizar' : 'Subir'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
