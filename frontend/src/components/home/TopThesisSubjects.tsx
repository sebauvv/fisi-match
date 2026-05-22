import { useEffect, useState } from 'react';
import { metadataApi, type ThesisSubjectItem } from '../../api/metadataApi';

export default function TopThesisSubjects() {
  const [subjects, setSubjects] = useState<ThesisSubjectItem[]>([]);

  useEffect(() => {
    metadataApi.getThesisSubjects()
      .then(data => {
        const sorted = [...data].sort((a, b) => b.thesis_count - a.thesis_count).slice(0, 8);
        setSubjects(sorted);
      })
      .catch(() => {});
  }, []);

  if (!subjects.length) return null;
  const max = subjects[0]?.thesis_count || 1;
  const colors = ['#5B8DEF', '#3D8B5E', '#C4893D', '#8B5CF6', '#C44545', '#4F6D7A', '#EC4899', '#06B6D4'];

  return (
    <div className="rounded-2xl border border-border bg-bg-surface p-5 dark:border-dark-border dark:bg-dark-bg-surface">
      <h4 className="mb-4 text-sm font-semibold text-text-primary dark:text-dark-text-primary">
        Temas de Tesis Populares
      </h4>
      <div className="space-y-2.5">
        {subjects.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-text-secondary dark:text-dark-text-secondary">{s.name}</p>
              <div className="mt-0.5 h-1.5 rounded-full bg-bg-surface-alt dark:bg-dark-bg-surface-alt">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(s.thesis_count / max) * 100}%`, background: colors[i % colors.length] }} />
              </div>
            </div>
            <span className="shrink-0 text-xs font-semibold text-text-primary dark:text-dark-text-primary">
              {s.thesis_count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
