import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { metadataApi, type ResearchAreaItem } from '../../api/metadataApi';

export default function TopResearchAreas() {
  const [areas, setAreas] = useState<ResearchAreaItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    metadataApi.getResearchAreas()
      .then(data => {
        const sorted = [...data].sort((a, b) => b.advisor_count - a.advisor_count).slice(0, 8);
        setAreas(sorted);
      })
      .catch(() => {});
  }, []);

  if (!areas.length) return null;
  const max = areas[0]?.advisor_count || 1;

  return (
    <div className="rounded-2xl border border-border bg-bg-surface p-5 dark:border-dark-border dark:bg-dark-bg-surface">
      <h4 className="mb-4 text-sm font-semibold text-text-primary dark:text-dark-text-primary">
        Top Áreas de Investigación
      </h4>
      <div className="space-y-2.5">
        {areas.map(a => (
          <button key={a.id} className="group flex w-full items-center gap-3 text-left"
            onClick={() => navigate(`/explorador-profesores?area=${encodeURIComponent(a.name)}`)}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-text-secondary group-hover:text-accent dark:text-dark-text-secondary dark:group-hover:text-dark-accent transition-colors">
                {a.name}
              </p>
              <div className="mt-0.5 h-1.5 rounded-full bg-bg-surface-alt dark:bg-dark-bg-surface-alt">
                <div className="h-full rounded-full bg-accent/70 dark:bg-dark-accent/70 transition-all duration-700"
                  style={{ width: `${(a.advisor_count / max) * 100}%` }} />
              </div>
            </div>
            <span className="shrink-0 text-xs font-semibold text-text-primary dark:text-dark-text-primary">
              {a.advisor_count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
