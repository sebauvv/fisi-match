import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { alignmentApi } from '../../api/alignmentApi';
import type { AlignmentReport } from '../../types/alignment';

const LEVEL_COLORS: Record<string, string> = {
  Alta: '#3D8B5E',
  Media: '#C4893D',
  Baja: '#C44545',
};

export default function AlignmentCard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<AlignmentReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) { setLoading(false); return; }
    alignmentApi.getAlignmentReports(user.student_id, token)
      .then(reports => { if (reports.length) setReport(reports[0]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, token]);

  if (loading) return (
    <div className="flex h-40 items-center justify-center rounded-2xl border border-border bg-bg-surface dark:border-dark-border dark:bg-dark-bg-surface">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-r-transparent dark:border-dark-accent dark:border-r-transparent" />
    </div>
  );

  const color = report ? LEVEL_COLORS[report.alignment_level] || '#8E8E9E' : undefined;
  const r = 40, c = 2 * Math.PI * r;

  return (
    <div className="rounded-2xl border border-border bg-bg-surface p-5 dark:border-dark-border dark:bg-dark-bg-surface">
      <h4 className="mb-4 text-sm font-semibold text-text-primary dark:text-dark-text-primary">
        Alineamiento Académico
      </h4>
      {report ? (
        <div className="flex items-center gap-5">
          <div className="relative flex shrink-0 items-center justify-center">
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r={r} fill="none" strokeWidth="7"
                className="stroke-bg-surface-alt dark:stroke-dark-bg-surface-alt" />
              <circle cx="48" cy="48" r={r} fill="none" strokeWidth="7"
                strokeLinecap="round" strokeDasharray={c}
                strokeDashoffset={c - (c * report.score_pct) / 100}
                transform="rotate(-90 48 48)" style={{ stroke: color, transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <span className="absolute text-lg font-bold" style={{ color }}>{report.score_pct}%</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
              style={{ background: color }}>{report.alignment_level}</span>
            <p className="mt-1.5 truncate text-xs text-text-secondary dark:text-dark-text-secondary"
              title={report.thesis_idea}>{report.thesis_idea}</p>
            <button onClick={() => navigate('/reporte-alineamiento')}
              className="mt-2 text-xs font-medium text-accent hover:underline dark:text-dark-accent">
              Ver detalle →
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => navigate('/reporte-alineamiento')}
          className="flex w-full flex-col items-center gap-2 rounded-xl bg-accent/5 py-6 text-center transition-colors hover:bg-accent/10 dark:bg-dark-accent/10 dark:hover:bg-dark-accent/20">
          <Target className="h-8 w-8 text-accent dark:text-dark-accent" />
          <span className="text-sm font-medium text-accent dark:text-dark-accent">Evalúa tu alineamiento</span>
          <span className="text-[11px] text-text-muted dark:text-dark-text-muted">Analiza qué tan preparado estás para tu tema de tesis</span>
        </button>
      )}
    </div>
  );
}
