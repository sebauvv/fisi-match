import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import CoursesModal from '../ui/CoursesModal';
import type { AcademicPeriod } from '../../types/student';

interface AcademicRecordSectionProps {
  periods: AcademicPeriod[];
}

export default function AcademicRecordSection({ periods }: AcademicRecordSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="rounded-xl border border-border bg-bg-surface transition-colors dark:border-dark-border dark:bg-dark-bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 dark:border-dark-border">
          <span className="flex items-center gap-2 text-sm font-bold text-text-primary dark:text-dark-text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-warning dark:bg-dark-warning" />
            Registro Académico
          </span>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-accent transition-colors hover:bg-accent-soft dark:text-dark-accent dark:hover:bg-dark-accent-soft"
          >
            Ver todo
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
            {periods.length > 0 ? (
              <span>
                <span className="font-semibold text-text-primary dark:text-dark-text-primary">
                  {periods.reduce((acc, p) => acc + p.cursos.length, 0)}
                </span>{' '}
                cursos registrados en{' '}
                <span className="font-semibold text-text-primary dark:text-dark-text-primary">
                  {periods.length}
                </span>{' '}
                periodos académicos.
              </span>
            ) : (
              'No hay cursos registrados aún. Sube tu historial académico para ver tu registro.'
            )}
          </p>
        </div>
      </div>

      {open && <CoursesModal periods={periods} onClose={() => setOpen(false)} />}
    </>
  );
}
