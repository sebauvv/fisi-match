import { useState } from 'react';
import { jsPDF } from 'jspdf';
import type { AlternativeRecommendationResponse } from '../../types/alternative';
import type { AlignmentReport } from '../../types/alignment';

interface Props {
  data: AlternativeRecommendationResponse;
  report: AlignmentReport;
}

export function AlternativeReportDetails({ data, report }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentW = pageW - margin * 2;
      let y = margin;

      const checkPageBreak = (needed: number) => {
        if (y + needed > pageH - margin) {
          pdf.addPage();
          y = margin;
        }
      };

      const addWrappedText = (text: string, x: number, startY: number, maxWidth: number, lineHeight: number): number => {
        const lines = pdf.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          checkPageBreak(lineHeight);
          pdf.text(line, x, startY);
          startY += lineHeight;
          y = startY;
        });
        return startY;
      };

      // ── Encabezado ────────────────────────────────────────────
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 30, 30);
      pdf.text('Recomendación de Temas Alternativos', margin, y);
      y += 7;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120, 120, 120);
      const fechaGeneracion = new Date().toLocaleDateString('es-PE', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      pdf.text(`Generado el ${fechaGeneracion}`, margin, y);
      y += 5;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageW - margin, y);
      y += 9;

      // ── Idea de tesis ─────────────────────────────────────────
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(60, 60, 60);
      checkPageBreak(8);
      pdf.text('IDEA ANALIZADA', margin, y);
      y += 5;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(80, 80, 80);
      y = addWrappedText(`"${report.thesis_idea}"`, margin + 3, y, contentW - 3, 5);
      y += 4;

      // ── Score ─────────────────────────────────────────────────
      checkPageBreak(14);
      pdf.setFontSize(26);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(5, 150, 105);
      pdf.text(`${report.score_pct}%`, margin, y);
      const scoreTextW = pdf.getStringUnitWidth(`${report.score_pct}%`) * 26 / pdf.internal.scaleFactor;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120, 120, 120);
      pdf.text('Alineación con el tema', margin + scoreTextW + 3, y - 1);
      y += 7;

      // ── Resumen ────────────────────────────────────────────────
      checkPageBreak(8);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(60, 60, 60);
      pdf.text('RESUMEN', margin, y);
      y += 5;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      y = addWrappedText(data.summary, margin, y, contentW, 5);
      y += 6;

      // ── Habilidades Faltantes ──────────────────────────────────
      if (data.skill_gaps_to_close.length > 0) {
        checkPageBreak(10);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 30, 30);
        pdf.text('HABILIDADES FALTANTES', margin, y);
        y += 2;
        pdf.setDrawColor(217, 119, 6);
        pdf.setLineWidth(0.5);
        pdf.line(margin, y, margin + 60, y);
        pdf.setLineWidth(0.2);
        y += 6;

        data.skill_gaps_to_close.forEach((gap, idx) => {
          checkPageBreak(16);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(30, 30, 30);
          pdf.text(`${idx + 1}. ${gap.skill}`, margin, y);
          y += 5;

          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(80, 80, 80);
          y = addWrappedText(gap.resource, margin + 4, y, contentW - 4, 4.5);

          pdf.setFontSize(8);
          pdf.setTextColor(37, 99, 235);
          checkPageBreak(6);
          pdf.text(`Tiempo estimado: ${gap.estimated_time}`, margin + 4, y);
          y += 7;
        });
        y += 2;
      }

      // ── Cursos Recomendados ────────────────────────────────────
      if (data.recommended_courses.length > 0) {
        checkPageBreak(10);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 30, 30);
        pdf.text('CURSOS RECOMENDADOS', margin, y);
        y += 2;
        pdf.setDrawColor(37, 99, 235);
        pdf.setLineWidth(0.5);
        pdf.line(margin, y, margin + 60, y);
        pdf.setLineWidth(0.2);
        y += 6;

        data.recommended_courses.forEach((course, idx) => {
          checkPageBreak(16);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(30, 30, 30);
          pdf.text(`${idx + 1}. ${course.name}`, margin, y);
          y += 4.5;

          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(37, 99, 235);
          checkPageBreak(5);
          pdf.text(course.platform, margin + 4, y);
          y += 4.5;

          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(80, 80, 80);
          pdf.setFontSize(9);
          y = addWrappedText(course.reason, margin + 4, y, contentW - 4, 4.5);
          y += 4;
        });
        y += 2;
      }

      // ── Proyectos Prácticos ────────────────────────────────────
      if (data.mini_projects.length > 0) {
        checkPageBreak(10);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 30, 30);
        pdf.text('PROYECTOS PRÁCTICOS', margin, y);
        y += 2;
        pdf.setDrawColor(5, 150, 105);
        pdf.setLineWidth(0.5);
        pdf.line(margin, y, margin + 60, y);
        pdf.setLineWidth(0.2);
        y += 6;

        data.mini_projects.forEach((project, idx) => {
          checkPageBreak(16);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(30, 30, 30);
          pdf.text(`${idx + 1}. ${project.title}`, margin, y);
          y += 5;

          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(80, 80, 80);
          y = addWrappedText(project.description, margin + 4, y, contentW - 4, 4.5);
          y += 2;

          if (project.skills_covered.length > 0) {
            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            checkPageBreak(5);
            const skillsLine = `Skills: ${project.skills_covered.join(' · ')}`;
            y = addWrappedText(skillsLine, margin + 4, y, contentW - 4, 4.5);
          }
          y += 4;
        });
        y += 2;
      }

      // ── Temas Alternativos ─────────────────────────────────────
      if (data.alternative_topics.length > 0) {
        checkPageBreak(10);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 30, 30);
        pdf.text('TEMAS ALTERNATIVOS SUGERIDOS', margin, y);
        y += 2;
        pdf.setDrawColor(99, 102, 241);
        pdf.setLineWidth(0.5);
        pdf.line(margin, y, margin + 75, y);
        pdf.setLineWidth(0.2);
        y += 6;

        data.alternative_topics.forEach((topic, idx) => {
          checkPageBreak(20);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(30, 30, 30);
          pdf.text(`Opción ${String(idx + 1).padStart(2, '0')} · ${topic.title}`, margin, y);
          y += 5;

          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(80, 80, 80);
          y = addWrappedText(topic.justification, margin + 4, y, contentW - 4, 4.5);
          y += 2;

          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(37, 99, 235);
          checkPageBreak(5);
          pdf.text('Diferencia con tu tema actual:', margin + 4, y);
          y += 4.5;

          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(80, 80, 80);
          y = addWrappedText(topic.delta_from_current, margin + 4, y, contentW - 4, 4.5);
          y += 6;
        });
      }

      // ── Pie de página en todas las páginas ────────────────────
      const totalPages = (pdf.internal as any).getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(180, 180, 180);
        pdf.text('FisiMatch · Recomendación de Temas Alternativos', margin, pageH - 8);
        pdf.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' });
      }

      const filename = `recomendacion-alternativa-${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('Ocurrió un error al generar el PDF. Inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30 dark:bg-slate-900/30 w-full animate-in fade-in duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl text-slate-900 dark:text-white leading-tight">
              Recomendación de Temas Alternativos
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Análisis detallado de brechas, recursos recomendados y temas alternativos para tu perfil.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Generado · {new Date().toLocaleDateString()}
            </span>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Generando...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1v9M4 7l4 4 4-4M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Descargar PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-t-2xl" />
          
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
            <svg width="12" height="12" viewBox="0 0 10 10" fill="currentColor">
              <circle cx="5" cy="5" r="4.5" stroke="currentColor" strokeWidth="1" fill="none"/>
              <circle cx="5" cy="5" r="1.5"/>
            </svg>
            Idea analizada
          </div>
          
          <div className="text-sm text-slate-600 dark:text-slate-400 italic mb-6 leading-relaxed border-l-2 border-slate-200 dark:border-slate-700 pl-4">
            "{report.thesis_idea}"
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-serif text-5xl leading-none text-emerald-600 dark:text-emerald-400">
                  {report.score_pct}
                </span>
                <span className="text-xl text-emerald-600 dark:text-emerald-400 font-medium">%</span>
              </div>
              <div className="text-xs font-semibold tracking-wider uppercase text-slate-500 mt-2">
                Alineación con el tema
              </div>
            </div>
            <span className="px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800 w-fit">
              Alineación
            </span>
          </div>

          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 mb-6 overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-1000 ease-out"
              style={{ width: `${report.score_pct}%` }}
            />
          </div>

          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {data.summary}
          </p>
        </div>

        {/* Skill Gaps */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                ⚡
              </div>
              <h3 className="font-serif text-lg text-slate-900 dark:text-white">Habilidades Faltantes</h3>
            </div>
            <span className="sm:ml-auto bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider w-fit">
              {data.skill_gaps_to_close.length} habilidades
            </span>
          </div>
          <div className="flex flex-col">
            {data.skill_gaps_to_close.map((gap, idx) => (
              <div key={idx} className="flex items-start gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-white mb-1.5 leading-snug">
                    {gap.skill}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2.5">
                    {gap.resource}
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full uppercase tracking-wider">
                    ⏱ {gap.estimated_time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Courses */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                📚
              </div>
              <h3 className="font-serif text-lg text-slate-900 dark:text-white">Cursos Recomendados</h3>
            </div>
            <span className="sm:ml-auto bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider w-fit">
              {data.recommended_courses.length} cursos
            </span>
          </div>
          <div className="flex flex-col">
            {data.recommended_courses.map((course, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="shrink-0 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-blue-100 dark:border-blue-800 mt-1 whitespace-nowrap">
                  {course.platform}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-white mb-1.5 leading-snug">
                    {course.name}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {course.reason}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mini Projects */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                🔧
              </div>
              <h3 className="font-serif text-lg text-slate-900 dark:text-white">Proyectos Prácticos</h3>
            </div>
            <span className="sm:ml-auto bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider w-fit">
              {data.mini_projects.length} proyectos
            </span>
          </div>
          <div className="flex flex-col">
            {data.mini_projects.map((project, idx) => (
              <div key={idx} className="px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="text-sm font-medium text-slate-900 dark:text-white mb-2 leading-snug">
                  {project.title}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {project.description}
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.skills_covered.map((skill, sIdx) => (
                    <span key={sIdx} className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alternative Topics */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                🔀
              </div>
              <h3 className="font-serif text-lg text-slate-900 dark:text-white">Temas Alternativos</h3>
            </div>
            <span className="sm:ml-auto bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider w-fit">
              {data.alternative_topics.length} sugerencias
            </span>
          </div>
          <div className="flex flex-col">
            {data.alternative_topics.map((topic, idx) => (
              <ExpandableTopic key={idx} topic={topic} index={idx} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function ExpandableTopic({ topic, index }: { topic: any, index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="px-4 sm:px-6 py-6 border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div 
        className="cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="font-serif text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
          Opción {String(index + 1).padStart(2, '0')}
        </div>
        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium text-slate-900 dark:text-white leading-snug">
            {topic.title}
          </div>
          <button className="self-start text-blue-600 dark:text-blue-400 flex items-center gap-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
            {isOpen ? 'Ocultar' : 'Ver justificación'}
            <svg 
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 12 12" 
              fill="none"
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
          {topic.justification}
        </p>
        <div className="bg-slate-50 dark:bg-slate-900 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5">
            Diferencia con tu tema actual
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {topic.delta_from_current}
          </p>
        </div>
      </div>
    </div>
  );
}
