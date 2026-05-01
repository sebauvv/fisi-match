import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { alignmentApi } from '../api/alignmentApi';
import { updateStudent, getStudent } from '../api/studentApi';
import type { AlignmentReport } from '../types/alignment';
import { AlignmentSidebar } from '../components/alignment/AlignmentSidebar';
import { AlignmentEmptyState } from '../components/alignment/AlignmentEmptyState';
import { AlignmentReportDetails } from '../components/alignment/AlignmentReportDetails';
import { AlignmentProgressModal } from '../components/alignment/AlignmentProgressModal';

export default function AlignmentEvaluatorPage() {
  const { user, token } = useAuth();
  const studentId = user?.student_id;
  const [reports, setReports] = useState<AlignmentReport[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [initialIdea, setInitialIdea] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId && token) {
      loadInitialData();
    }
  }, [studentId, token]);

  const loadInitialData = async () => {
    try {
      if (!studentId || !token) return;
      
      const [reportsData, studentData] = await Promise.all([
        alignmentApi.getAlignmentReports(studentId, token),
        getStudent(studentId, token)
      ]);

      setReports(reportsData);
      if (studentData.thesis_idea) {
        setInitialIdea(studentData.thesis_idea);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading data');
    }
  };

  const handleGenerateReport = async (idea: string) => {
    if (!studentId || !token) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      await updateStudent(studentId, token, { thesis_idea: idea });
      const newReport = await alignmentApi.generateAlignmentReport(studentId, token);
      setReports(prev => [newReport, ...prev]);
      setActiveReportId(newReport.id);
    } catch (err: any) {
      setError(err.message || 'Error al generar el reporte');
      setIsGenerating(false);
    } finally {
      setTimeout(() => setIsGenerating(false), 500);
    }
  };

  const activeReport = reports.find(r => r.id === activeReportId);

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden bg-bg-primary text-text-primary font-sans border border-border rounded-xl dark:bg-dark-bg-primary dark:text-dark-text-primary dark:border-dark-border">
      <AlignmentSidebar
        reports={reports}
        activeReportId={activeReportId}
        onSelectReport={setActiveReportId}
        onGenerateReport={handleGenerateReport}
        isGenerating={isGenerating}
        initialIdea={initialIdea}
      />
      
      <main className="flex-1 overflow-y-auto p-8 relative">
        {error && (
          <div className="bg-error-soft text-error p-4 rounded-xl border border-[#EEC8C8] text-sm mb-6 dark:bg-dark-error-soft dark:text-dark-error dark:border-dark-error">
            {error}
          </div>
        )}
        
        {activeReport ? (
          <AlignmentReportDetails report={activeReport} />
        ) : (
          <AlignmentEmptyState />
        )}
      </main>

      <AlignmentProgressModal isOpen={isGenerating} />
    </div>
  );
}
