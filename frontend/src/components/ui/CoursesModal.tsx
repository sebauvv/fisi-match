import { X } from 'lucide-react';
import type { AcademicPeriod } from '../../types/student';

interface CoursesModalProps {
  periods: AcademicPeriod[];
  onClose: () => void;
}

export default function CoursesModal({ periods, onClose }: CoursesModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative flex max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl bg-bg-surface shadow-2xl dark:bg-dark-bg-surface">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 dark:border-dark-border">
          <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
            Historial Academico Completo
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-hover dark:text-dark-text-muted dark:hover:bg-dark-bg-hover"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto px-6 py-4">
          {periods.map((period) => (
            <div key={period.periodo} className="mb-6">
              <h3 className="mb-2 text-sm font-semibold text-accent dark:text-dark-accent">
                Periodo {period.periodo}
              </h3>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-text-muted dark:border-dark-border dark:text-dark-text-muted">
                    <th className="py-2 pr-3">Ciclo</th>
                    <th className="py-2 pr-3">Plan</th>
                    <th className="py-2 pr-3">Tipo</th>
                    <th className="py-2 pr-3">Asignatura</th>
                    <th className="py-2 pr-3">Calif.</th>
                    <th className="py-2 pr-3">Cred.</th>
                    <th className="py-2">Sec.</th>
                  </tr>
                </thead>
                <tbody>
                  {period.cursos.map((curso, idx) => (
                    <tr
                      key={`${curso.codigo}-${idx}`}
                      className="border-b border-border/50 dark:border-dark-border/50"
                    >
                      <td className="py-2 pr-3 text-text-primary dark:text-dark-text-primary">{curso.ciclo}</td>
                      <td className="py-2 pr-3 text-text-secondary dark:text-dark-text-secondary">{curso.plan}</td>
                      <td className="py-2 pr-3 text-text-secondary dark:text-dark-text-secondary">{curso.tipo}</td>
                      <td className="py-2 pr-3 font-medium text-text-primary dark:text-dark-text-primary">
                        {curso.asignatura}
                      </td>
                      <td className={`py-2 pr-3 font-semibold ${
                        curso.calificacion === 'En progreso'
                          ? 'text-warning dark:text-dark-warning'
                          : 'text-text-primary dark:text-dark-text-primary'
                      }`}>
                        {curso.calificacion}
                      </td>
                      <td className="py-2 pr-3 text-text-secondary dark:text-dark-text-secondary">{curso.creditos}</td>
                      <td className="py-2 text-text-secondary dark:text-dark-text-secondary">{curso.seccion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
