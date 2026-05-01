import { useState, useEffect } from 'react';
import type { AlignmentReport } from '../../types/alignment';

interface AlignmentSidebarProps {
  reports: AlignmentReport[];
  activeReportId: string | null;
  onSelectReport: (id: string) => void;
  onGenerateReport: (idea: string) => Promise<void>;
  isGenerating: boolean;
  initialIdea?: string;
}

export function AlignmentSidebar({
  reports,
  activeReportId,
  onSelectReport,
  onGenerateReport,
  isGenerating,
  initialIdea = '',
}: AlignmentSidebarProps) {
  const [idea, setIdea] = useState(initialIdea);

  useEffect(() => {
    setIdea(initialIdea);
  }, [initialIdea]);

  const handleGenerate = () => {
    if (!idea.trim() || isGenerating) return;
    onGenerateReport(idea);
  };

  const getBadgeClass = (level: string) => {
    switch (level.toLowerCase()) {
      case 'alta':
        return 'bg-success-soft text-success';
      case 'media':
        return 'bg-warning-soft text-warning';
      case 'baja':
        return 'bg-error-soft text-error';
      default:
        return 'bg-bg-surface-alt text-text-secondary';
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}, ${d.toLocaleDateString('es-PE')}`;
  };

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days}d`;
  };

  return (
    <aside className="bg-bg-surface border-r border-border flex flex-col p-6 pt-6 pb-6 gap-0 w-[300px] shrink-0 h-full overflow-hidden">
      <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-text-muted mb-3">
        Nueva evaluación
      </p>
      
      <div className="flex flex-col gap-2 mb-5">
        <label className="text-[13px] font-medium text-text-secondary">Idea de tesis</label>
        <textarea
          className="w-full p-3 font-sans text-[13px] leading-relaxed text-text-primary bg-bg-primary border-[1.5px] border-border rounded-[10px] resize-none min-h-[110px] transition-colors duration-200 outline-none focus:border-border-focus focus:bg-white placeholder:text-text-muted"
          placeholder="Describe tu idea de tesis aquí..."
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          disabled={isGenerating}
        />
        <p className="text-[11px] text-text-muted leading-relaxed">
          Se analizará tu historial académico y CV para evaluar el alineamiento.
        </p>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!idea.trim() || isGenerating}
        className="w-full p-3 bg-accent text-white border-none rounded-[10px] font-sans text-[14px] font-medium cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 hover:bg-accent-hover active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mb-7"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        Generar Reporte
      </button>

      <div className="h-[1px] bg-border my-0 mb-6 shrink-0" />
      
      <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-text-muted mb-3">
        Historial de reportes
      </p>

      <div className="flex flex-col gap-[2px] flex-1 overflow-y-auto min-h-0 pr-1 -mr-1">
        {reports.length === 0 ? (
          <p className="text-[12px] text-text-muted text-center py-4">No hay reportes aún.</p>
        ) : (
          reports.map(report => (
            <div
              key={report.id}
              onClick={() => onSelectReport(report.id)}
              className={`p-[0.65rem] px-3 rounded-lg cursor-pointer transition-colors duration-150 flex flex-col gap-[3px] ${
                activeReportId === report.id ? 'bg-accent-soft' : 'hover:bg-bg-hover'
              }`}
            >
              <div className="text-[10px] text-text-muted flex items-center gap-1">
                <span>{getTimeAgo(report.created_at)}</span>
                <span className="mx-[2px]">·</span>
                <span>{formatDate(report.created_at)}</span>
                <span className={`ml-auto inline-block text-[10px] font-medium py-[1px] px-[6px] rounded-full ${getBadgeClass(report.alignment_level)}`}>
                  {report.alignment_level}
                </span>
              </div>
              <div className="text-[12.5px] text-text-primary whitespace-nowrap overflow-hidden text-ellipsis leading-[1.3]">
                {report.thesis_idea}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
