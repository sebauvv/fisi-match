import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { alignmentApi } from '../api/alignmentApi';
import { alternativeApi } from '../api/alternativeApi';
import type { AlignmentReport } from '../types/alignment';
import type { AlternativeRecommendationResponse } from '../types/alternative';
import { AlternativeSidebar } from '../components/alternative/AlternativeSidebar';
import { AlternativeEmptyState } from '../components/alternative/AlternativeEmptyState';
import { AlternativeReportDetails } from '../components/alternative/AlternativeReportDetails';
import { AlternativeProgressModal } from '../components/alternative/AlternativeProgressModal';

export default function AlternativeRecommenderPage() {
  const { user, token } = useAuth();
  const studentId = user?.student_id;
  
  const [alignmentReports, setAlignmentReports] = useState<AlignmentReport[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [alternativeData, setAlternativeData] = useState<Record<string, AlternativeRecommendationResponse>>({});
  
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReports() {
      if (!studentId || !token) return;
      try {
        setIsLoadingReports(true);
        const reports = await alignmentApi.getAlignmentReports(studentId, token);
        setAlignmentReports(reports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } catch (err: any) {
        setError(err.message || 'Error al cargar reportes de alineamiento');
      } finally {
        setIsLoadingReports(false);
      }
    }
    fetchReports();
  }, [studentId, token]);

  const handleSelectReport = (id: string) => {
    setActiveReportId(id);
    setError(null);
  };

  const handleGenerate = async (id: string) => {
    if (!studentId || !token) return;
    if (alternativeData[id]) return; // Already generated/cached

    try {
      setIsGenerating(true);
      setError(null);
      const data = await alternativeApi.generateAlternativeRecommendations(studentId, id, token);
      
      setAlternativeData(prev => ({
        ...prev,
        [id]: data
      }));
      // Simulate the modal completion time before turning off isGenerating
      setTimeout(() => {
        setIsGenerating(false);
      }, 500); 
    } catch (err: any) {
      setError(err.message || 'Error al generar recomendaciones alternativas');
      setIsGenerating(false); // Stop loading if error
    }
  };

  const activeReport = alignmentReports.find(r => r.id === activeReportId);
  const activeData = activeReportId ? alternativeData[activeReportId] : null;

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden bg-bg-primary text-text-primary font-sans border border-border rounded-xl dark:bg-dark-bg-primary dark:text-dark-text-primary dark:border-dark-border relative">
      
      {/* Sidebar with history */}
      <div className={`shrink-0 md:flex ${activeReportId ? 'hidden md:block' : 'w-full md:w-auto'}`}>
        <AlternativeSidebar 
          alignmentReports={alignmentReports}
          activeReportId={activeReportId}
          onSelectReport={handleSelectReport}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      </div>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col relative overflow-y-auto bg-white dark:bg-slate-950 ${!activeReportId ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Back button for mobile */}
        {activeReportId && (
          <div className="md:hidden p-4 border-b border-slate-200 dark:border-slate-800 flex items-center bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
            <button 
              onClick={() => setActiveReportId(null)}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Volver a los análisis
            </button>
          </div>
        )}
        
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-sm border border-red-200 dark:border-red-800 shadow-sm flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 13A6 6 0 1 0 7 1a6 6 0 0 0 0 12zM7 4v3M7 9.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {error}
            <button onClick={() => setError(null)} className="ml-2 hover:text-red-800 dark:hover:text-red-200">
              ✕
            </button>
          </div>
        )}

        {isLoadingReports ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : !activeReportId ? (
          <AlternativeEmptyState />
        ) : activeData && activeReport ? (
          <AlternativeReportDetails data={activeData} report={activeReport} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 p-8 text-center animate-in fade-in duration-300">
            <div className="max-w-md">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6 shadow-sm">
                🎯
              </div>
              <h2 className="font-serif text-xl text-slate-900 dark:text-white mb-2">
                Idea Seleccionada
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 italic border-l-4 border-slate-300 dark:border-slate-700 pl-3">
                "{activeReport?.thesis_idea}"
              </p>
              <button
                onClick={() => handleGenerate(activeReportId)}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Generar Recomendaciones
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </main>

      <AlternativeProgressModal isVisible={isGenerating} />
      
    </div>
  );
}
