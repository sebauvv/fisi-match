import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProfileHeader from '../components/student-profile/ProfileHeader';
import IdentityCard from '../components/student-profile/IdentityCard';
import CreditsCard from '../components/student-profile/CreditsCard';
import DocumentCards from '../components/student-profile/DocumentCards';
import AcademicRecordSection from '../components/student-profile/AcademicRecordSection';
import SkillsSection from '../components/student-profile/SkillsSection';
import ThesisIdeaSection from '../components/student-profile/ThesisIdeaSection';
import PdfViewerModal from '../components/student-profile/PdfViewerModal';
import UploadModal from '../components/student-profile/UploadModal';
import ThesisIdeaModal from '../components/ui/ThesisIdeaModal';

export default function ProfilePage() {
  const { user } = useAuth();
  const [pdfModal, setPdfModal] = useState<{ url: string; title: string } | null>(null);
  const [uploadModal, setUploadModal] = useState<{ type: 'historial' | 'matricula' | 'cv'; title: string } | null>(null);
  const [showThesisModal, setShowThesisModal] = useState(false);
  const [thesisToast, setThesisToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (pdfModal || uploadModal || showThesisModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [pdfModal, uploadModal, showThesisModal]);

  useEffect(() => {
    if (!thesisToast) return;
    const id = setTimeout(() => setThesisToast(null), 4000);
    return () => clearTimeout(id);
  }, [thesisToast]);

  if (!user) return null;

  const currentPeriod =
    user.periodos_academicos.length > 0
      ? user.periodos_academicos[user.periodos_academicos.length - 1].periodo
      : '—';

  const handleViewPdf = (type: 'historial' | 'matricula') => {
    const url = user.pdf_urls?.[type];
    if (url) {
      setPdfModal({
        url,
        title: type === 'historial' ? 'Historial Académico' : 'Matrícula Actual',
      });
    }
  };

  const handleOpenUpload = (type: 'historial' | 'matricula' | 'cv') => {
    const titles = {
      historial: 'Actualizar Historial Académico',
      matricula: 'Actualizar Matrícula Actual',
      cv: 'Actualizar CV / Habilidades',
    };
    setUploadModal({ type, title: titles[type] });
  };

  const handleUploadSubmit = (file: File) => {
    if (!uploadModal) return;
    // TODO: Integrate with API to re-process the uploaded PDF
    console.log(`Uploading ${uploadModal.type}:`, file.name);
    setUploadModal(null);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mx-auto w-full lg:max-w-[70%]">
        {/* Thesis toast */}
        {thesisToast && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
              thesisToast.type === 'success'
                ? 'border-success/30 bg-success-soft/80 text-success dark:border-dark-success/30 dark:bg-dark-success-soft/80 dark:text-dark-success'
                : 'border-error/30 bg-error-soft/80 text-error dark:border-dark-error/30 dark:bg-dark-error-soft/80 dark:text-dark-error'
            }`}
          >
            {thesisToast.type === 'success' ? (
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {thesisToast.text}
          </div>
        )}

        <ProfileHeader period={currentPeriod} />

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[300px_1fr]">
          {/* Left Column */}
          <div className="flex flex-col gap-4">
            <IdentityCard student={user.estudiante} currentPeriod={currentPeriod} />
            <CreditsCard summary={user.resumen_creditos} />
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-4">
            <DocumentCards
              hasHistorial={!!user.pdf_urls?.historial}
              hasMatricula={!!user.pdf_urls?.matricula}
              hasCv={!!user.pdf_urls?.cv}
              onViewHistorial={() => handleViewPdf('historial')}
              onViewMatricula={() => handleViewPdf('matricula')}
              onUploadHistorial={() => handleOpenUpload('historial')}
              onUploadMatricula={() => handleOpenUpload('matricula')}
              onUploadCv={() => handleOpenUpload('cv')}
            />

            <ThesisIdeaSection onEdit={() => setShowThesisModal(true)} />

            <AcademicRecordSection periods={user.periodos_academicos} />

            <SkillsSection cvText={user.cv_text || ''} />
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {pdfModal && (
        <PdfViewerModal
          url={pdfModal.url}
          title={pdfModal.title}
          onClose={() => setPdfModal(null)}
        />
      )}

      {/* Upload Modal */}
      {uploadModal && (
        <UploadModal
          title={uploadModal.title}
          onClose={() => setUploadModal(null)}
          onSubmit={handleUploadSubmit}
        />
      )}

      {/* Thesis Idea Modal */}
      {showThesisModal && (
        <ThesisIdeaModal
          onClose={() => setShowThesisModal(false)}
          onSuccess={() => {
            setShowThesisModal(false);
            setThesisToast({ type: 'success', text: 'Idea de tesis actualizada exitosamente' });
          }}
          onError={(msg) => {
            setShowThesisModal(false);
            setThesisToast({ type: 'error', text: `Error: ${msg}` });
          }}
        />
      )}
    </div>
  );
}
