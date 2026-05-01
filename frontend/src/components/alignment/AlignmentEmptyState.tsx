export function AlignmentEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-16 px-8 text-text-muted">
      <div className="w-16 h-16 bg-bg-surface-alt rounded-2xl flex items-center justify-center mb-2">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="w-7 h-7 opacity-50"
        >
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="font-serif text-[1.3rem] text-text-secondary">
        Sin reporte generado
      </h3>
      <p className="text-[14px] max-w-[320px] leading-relaxed">
        Ingresa tu idea de tesis y genera un reporte para ver tu alineamiento
        académico.
      </p>
    </div>
  );
}
