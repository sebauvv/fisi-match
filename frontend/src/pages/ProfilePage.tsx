import { useState, useEffect } from 'react';
import { User, GraduationCap, BookOpen, FileText, Calendar, Building, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FileDropZone from '../components/ui/FileDropZone';

export default function ProfilePage() {
    const { user } = useAuth();
    const [pdfModal, setPdfModal] = useState<{ url: string; title: string } | null>(null);
    const [uploadModal, setUploadModal] = useState<{ type: 'historial' | 'matricula' | 'cv'; title: string } | null>(null);
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    useEffect(() => {
        if (pdfModal || uploadModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [pdfModal, uploadModal]);

    if (!user) return null;

    const infoRows = [
        { label: 'Código', value: user.estudiante.codigo_matricula, icon: GraduationCap },
        { label: 'Facultad', value: user.estudiante.facultad, icon: Building },
        { label: 'Programa', value: user.estudiante.escuela, icon: BookOpen },
        { label: 'Especialidad', value: user.estudiante.plan, icon: FileText },
        { label: 'Periodo Académico', value: user.periodos_academicos.length > 0 ? user.periodos_academicos[user.periodos_academicos.length - 1].periodo : '—', icon: Calendar },
    ];

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
        setUploadFile(null);
        setUploadModal({ type, title: titles[type] });
    };

    const handleUploadSubmit = () => {
        if (!uploadFile || !uploadModal) return;
        // TODO: Integrate with API to re-process the uploaded PDF
        console.log(`Uploading ${uploadModal.type}:`, uploadFile.name);
        setUploadModal(null);
        setUploadFile(null);
    };

    // Extract skills from cv_text as bullet points
    const skills = user.cv_text
        ? user.cv_text
            .split('\n')
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
            .slice(0, 20)
        : [];

    return (
        <div className="flex flex-col gap-4">
            <h3 className="text-center text-lg font-semibold uppercase tracking-wide text-text-muted dark:text-dark-text-muted">
                Perfil del Estudiante
            </h3>

            {/*usuario*/}
            <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-bg-surface p-6 dark:border-dark-border dark:bg-dark-bg-surface">
                <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent dark:bg-dark-accent/10 dark:text-dark-accent">
                        <User className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-base font-semibold text-text-primary dark:text-dark-text-primary">
                            {user.estudiante.nombres_apellidos}
                        </h2>
                        <p className="text-xs text-text-muted dark:text-dark-text-muted">Estudiante</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
                {/*informacion personal*/}
                <div className="rounded-2xl border border-border bg-bg-surface p-5 dark:border-dark-border dark:bg-dark-bg-surface">
                    <h4 className="mb-4 text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                        Información Personal
                    </h4>
                    <div className="space-y-3">
                        {infoRows.map(({ label, value, icon: Icon }) => (
                            <div key={label} className="flex items-start gap-3">
                                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-text-muted dark:text-dark-text-muted" />
                                <div>
                                    <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted dark:text-dark-text-muted">
                                        {label}
                                    </p>
                                    <p className="text-sm text-text-primary dark:text-dark-text-primary">{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {/*informacion academica*/}
                <div className="flex flex-col gap-5">
                    {/* Historial Academico */}
                    <div className="rounded-2xl border border-border bg-bg-surface p-5 dark:border-dark-border dark:bg-dark-bg-surface">
                        <div className="mb-4 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                                Historial Academico
                            </h4>
                            <button
                                onClick={() => handleOpenUpload('historial')}
                                className="text-sm font-semibold text-yellow-500 hover:text-yellow-400 transition-colors"
                            >
                                Actualizar
                            </button>
                        </div>
                        <button
                            onClick={() => handleViewPdf('historial')}
                            className="w-full px-4 py-2 rounded-xl border border-border bg-bg-surface dark:border-dark-border dark:bg-dark-bg-surface text-sm text-text-muted dark:text-dark-text-muted hover:bg-bg-hover dark:hover:bg-dark-bg-hover transition-colors"
                        >
                            Ver todo
                        </button>
                    </div>

                    {/* Matricula Actual */}
                    <div className="rounded-2xl border border-border bg-bg-surface p-5 dark:border-dark-border dark:bg-dark-bg-surface">
                        <div className="mb-4 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                                Matricula Actual
                            </h4>
                            <button
                                onClick={() => handleOpenUpload('matricula')}
                                className="text-sm font-semibold text-yellow-500 hover:text-yellow-400 transition-colors"
                            >
                                Actualizar
                            </button>
                        </div>
                        <button
                            onClick={() => handleViewPdf('matricula')}
                            className="w-full px-4 py-2 rounded-xl border border-border bg-bg-surface dark:border-dark-border dark:bg-dark-bg-surface text-sm text-text-muted dark:text-dark-text-muted hover:bg-bg-hover dark:hover:bg-dark-bg-hover transition-colors"
                        >
                            Ver todo
                        </button>
                    </div>

                    {/* Habilidades */}
                    <div className="rounded-2xl border border-border bg-bg-surface p-5 dark:border-dark-border dark:bg-dark-bg-surface">
                        <div className="mb-4 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                                Habilidades
                            </h4>
                            <button
                                onClick={() => handleOpenUpload('cv')}
                                className="text-sm font-semibold text-yellow-500 hover:text-yellow-400 transition-colors"
                            >
                                Actualizar
                            </button>
                        </div>
                        {skills.length > 0 ? (
                            <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                {skills.map((skill, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-text-primary dark:text-dark-text-primary">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent dark:bg-dark-accent" />
                                        {skill}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-text-muted dark:text-dark-text-muted">
                                No se encontraron habilidades. Sube tu CV para extraerlas.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* PDF Viewer Modal */}
            {pdfModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-hidden bg-black/60 backdrop-blur-sm px-4 pt-20">
                    <div className="relative flex h-[80vh] w-full max-w-4xl flex-col rounded-2xl border border-border bg-bg-surface shadow-2xl dark:border-dark-border dark:bg-dark-bg-surface">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border px-6 py-4 dark:border-dark-border">
                            <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                                {pdfModal.title}
                            </h3>
                            <button
                                onClick={() => setPdfModal(null)}
                                className="rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary dark:text-dark-text-muted dark:hover:bg-dark-bg-hover dark:hover:text-dark-text-primary"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        {/* PDF iframe */}
                        <div className="flex-1 overflow-hidden rounded-b-2xl">
                            <iframe
                                src={pdfModal.url}
                                className="h-full w-full border-0"
                                title={pdfModal.title}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {uploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-bg-surface p-6 shadow-2xl dark:border-dark-border dark:bg-dark-bg-surface">
                        {/* Header */}
                        <div className="mb-5 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary">
                                {uploadModal.title}
                            </h3>
                            <button
                                onClick={() => { setUploadModal(null); setUploadFile(null); }}
                                className="rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary dark:text-dark-text-muted dark:hover:bg-dark-bg-hover dark:hover:text-dark-text-primary"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="mb-4 text-sm text-text-secondary dark:text-dark-text-secondary">
                            Sube el nuevo archivo PDF para reemplazar el documento actual.
                        </p>

                        <FileDropZone
                            onFileSelect={setUploadFile}
                            file={uploadFile}
                            onClear={() => setUploadFile(null)}
                            label="Arrastra tu archivo PDF aquí"
                        />

                        <button
                            onClick={handleUploadSubmit}
                            disabled={!uploadFile}
                            className="mt-5 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40 dark:bg-dark-accent dark:hover:bg-dark-accent-hover"
                        >
                            Subir documento
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}