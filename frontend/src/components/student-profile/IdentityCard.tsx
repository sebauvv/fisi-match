import { User, GraduationCap, Building, BookOpen, FileText, Calendar } from 'lucide-react';
import type { StudentInfo } from '../../types/student';

interface IdentityCardProps {
  student: StudentInfo;
  currentPeriod: string;
}

export default function IdentityCard({ student, currentPeriod }: IdentityCardProps) {
  const infoRows = [
    { label: 'Código', value: student.codigo_matricula, icon: GraduationCap, accent: true },
    { label: 'Facultad', value: student.facultad, icon: Building },
    { label: 'Programa', value: student.escuela, icon: BookOpen },
    { label: 'Especialidad', value: student.plan, icon: FileText },
    { label: 'Período Académico', value: currentPeriod, icon: Calendar, accent: true },
  ];

  const initials = student.nombres_apellidos
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-6 text-center transition-colors dark:border-dark-border dark:bg-dark-bg-surface">
      <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-accent bg-accent-soft text-2xl text-accent dark:border-dark-accent dark:bg-dark-accent-soft dark:text-dark-accent">
        {initials || <User className="h-8 w-8" />}
      </div>
      <p className="font-serif text-lg leading-snug text-text-primary dark:text-dark-text-primary">
        {student.nombres_apellidos}
      </p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-text-muted dark:text-dark-text-muted">
        Estudiante de Pregrado
      </p>

      <div className="my-4 h-px bg-border dark:bg-dark-border" />

      <div className="text-left">
        {infoRows.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="flex items-start gap-2 border-b border-border py-2 last:border-b-0 dark:border-dark-border">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-text-muted dark:text-dark-text-muted" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted dark:text-dark-text-muted">
                {label}
              </span>
              <span
                className={`text-sm font-medium ${accent ? 'text-accent dark:text-dark-accent' : 'text-text-primary dark:text-dark-text-primary'}`}
              >
                {value || '—'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
