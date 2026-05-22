import type { CreditsSummary } from '../../types/student';

interface Props { credits: CreditsSummary }

const ITEMS = [
  { key: 'obligatorios', label: 'Obligatorios', color: '#4F6D7A' },
  { key: 'de_especialidad', label: 'Especialidad', color: '#5B8DEF' },
  { key: 'electivos_generales', label: 'Electivos Gen.', color: '#3D8B5E' },
  { key: 'electivos_de_especialidad', label: 'Electivos Esp.', color: '#C4893D' },
  { key: 'optativos', label: 'Optativos', color: '#8B5CF6' },
] as const;

export default function CreditProgress({ credits }: Props) {
  const pct = credits.creditaje_requerido_para_egresar
    ? Math.round((credits.creditaje_aprobado / credits.creditaje_requerido_para_egresar) * 100)
    : 0;
  const r = 54, c = 2 * Math.PI * r, offset = c - (c * Math.min(pct, 100)) / 100;

  return (
    <div className="rounded-2xl border border-border bg-bg-surface p-5 dark:border-dark-border dark:bg-dark-bg-surface">
      <h4 className="mb-4 text-sm font-semibold text-text-primary dark:text-dark-text-primary">
        Progreso de Créditos
      </h4>
      <div className="flex items-center gap-6">
        {/* Radial gauge */}
        <div className="relative flex shrink-0 items-center justify-center">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r={r} fill="none" strokeWidth="10"
              className="stroke-bg-surface-alt dark:stroke-dark-bg-surface-alt" />
            <circle cx="65" cy="65" r={r} fill="none" strokeWidth="10"
              strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
              transform="rotate(-90 65 65)"
              className="stroke-accent dark:stroke-dark-accent"
              style={{ transition: 'stroke-dashoffset 1s ease' }} />
          </svg>
          <div className="absolute text-center">
            <p className="text-2xl font-bold text-accent dark:text-dark-accent">{pct}%</p>
            <p className="text-[10px] text-text-muted dark:text-dark-text-muted">completado</p>
          </div>
        </div>
        {/* Bars */}
        <div className="flex-1 space-y-2.5">
          {ITEMS.map(({ key, label, color }) => {
            const val = credits[key as keyof CreditsSummary] as number || 0;
            const max = credits.creditaje_requerido_para_egresar || 1;
            return (
              <div key={key}>
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-secondary dark:text-dark-text-secondary">{label}</span>
                  <span className="font-medium text-text-primary dark:text-dark-text-primary">{val}</span>
                </div>
                <div className="mt-0.5 h-1.5 rounded-full bg-bg-surface-alt dark:bg-dark-bg-surface-alt">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min((val / max) * 100, 100)}%`, background: color }} />
                </div>
              </div>
            );
          })}
          <p className="pt-1 text-[10px] text-text-muted dark:text-dark-text-muted">
            {credits.creditaje_aprobado} / {credits.creditaje_requerido_para_egresar} créditos
          </p>
        </div>
      </div>
    </div>
  );
}
