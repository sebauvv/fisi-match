import type { AlignmentReport } from '../../types/alignment';

interface Props {
  alignmentReports: AlignmentReport[];
  activeReportId: string | null;
  onSelectReport: (id: string) => void;
  onGenerate: (id: string) => void;
  isGenerating: boolean;
}

export function AlternativeSidebar({
  alignmentReports,
  activeReportId,
  onSelectReport,
  onGenerate,
  isGenerating,
}: Props) {
  const activeReport = alignmentReports.find((r) => r.id === activeReportId);

  return (
    <div className="w-full md:w-80 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 h-full overflow-hidden shrink-0">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="font-serif text-lg text-slate-900 dark:text-white mb-4">
          Análisis Recientes
        </h2>
        
        {activeReport ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 mb-4 shadow-sm">
            <div className="text-[10px] font-bold tracking-wider uppercase text-slate-500 mb-2">
              Idea Seleccionada
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3 mb-3">
              "{activeReport.thesis_idea}"
            </p>
            <button
              onClick={() => onGenerate(activeReport.id)}
              disabled={isGenerating}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generar Recomendaciones
            </button>
          </div>
        ) : (
          <div className="text-sm text-slate-500 mb-4 px-2">
            Selecciona un análisis previo para ver alternativas.
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {alignmentReports.length === 0 && (
          <div className="text-sm text-slate-500 p-4 text-center">
            No hay reportes de alineamiento disponibles.
          </div>
        )}
        
        {alignmentReports.map((report) => {
          const isActive = report.id === activeReportId;
          const date = new Date(report.created_at).toLocaleDateString('es-ES', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={report.id}
              onClick={() => onSelectReport(report.id)}
              className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] text-slate-500">{date}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  report.score_pct >= 70 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {report.score_pct}%
                </span>
              </div>
              <p className="text-xs text-slate-900 dark:text-slate-200 line-clamp-2 font-medium">
                "{report.thesis_idea}"
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
