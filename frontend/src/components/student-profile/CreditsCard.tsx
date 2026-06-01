import type { CreditsSummary } from '../../types/student';

interface CreditsCardProps {
  summary: CreditsSummary;
}

export default function CreditsCard({ summary }: CreditsCardProps) {
  const required = summary.creditaje_requerido_para_egresar || 0;
  const approved = summary.creditaje_aprobado || 0;
  const progress = required > 0 ? Math.min(100, (approved / required) * 100) : 0;

  const rows = [
    { label: 'Req. para Egresar', value: required, highlight: true },
    { label: 'Creditaje Aprobado', value: approved, success: true },
    { label: 'Obligatorios', value: summary.obligatorios },
    { label: 'De Especialidad', value: summary.de_especialidad },
    { label: 'Electivos Generales', value: summary.electivos_generales },
    { label: 'Electivos Especialidad', value: summary.electivos_de_especialidad },
    { label: 'Optativos', value: summary.optativos },
    { label: 'Alternativos', value: summary.alternativos },
    { label: 'De Otra Especialidad', value: summary.de_otra_especialidad },
    { label: 'Más de una vez', value: summary.mas_de_una_vez },
    { label: 'Otros', value: summary.otros },
    { label: 'Creditaje Faltante', value: summary.creditaje_faltante, warning: true },
  ];

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-5 transition-colors dark:border-dark-border dark:bg-dark-bg-surface">
      <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-text-muted dark:text-dark-text-muted">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        Resumen de Créditos
      </p>

      <div className="mb-4">
        <div className="mb-1 flex justify-between text-[11px] text-text-secondary dark:text-dark-text-secondary">
          <span>Avance académico</span>
          <span>
            {approved} / {required} cr.
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-bg-surface-alt dark:bg-dark-bg-surface-alt">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover transition-all duration-1000 dark:from-dark-accent dark:to-dark-accent-hover"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-0.5">
        {rows.map(({ label, value, highlight, success, warning }) => (
          <div key={label} className="contents">
            <span
              className={`border-b border-border py-1 text-[11px] dark:border-dark-border ${
                highlight
                  ? 'font-bold text-accent dark:text-dark-accent'
                  : success
                    ? 'font-semibold text-success dark:text-dark-success'
                    : warning
                      ? 'font-semibold text-warning dark:text-dark-warning'
                      : 'text-text-secondary dark:text-dark-text-secondary'
              }`}
            >
              {label}
            </span>
            <span
              className={`border-b border-border py-1 text-right text-[11px] dark:border-dark-border ${
                highlight
                  ? 'font-bold text-accent dark:text-dark-accent'
                  : success
                    ? 'font-semibold text-success dark:text-dark-success'
                    : warning
                      ? 'font-semibold text-warning dark:text-dark-warning'
                      : 'font-semibold text-text-primary dark:text-dark-text-primary'
              }`}
            >
              {typeof value === 'number' ? value.toFixed(1) : value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-bg-surface-alt p-3 dark:bg-dark-bg-surface-alt">
        <span className="text-[11px] font-medium text-text-secondary dark:text-dark-text-secondary">Promedio Ponderado</span>
        <span className="font-serif text-2xl text-accent dark:text-dark-accent">
          {summary.promedio_ponderado?.toFixed(2) || '—'}
        </span>
      </div>
    </div>
  );
}
