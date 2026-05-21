import { useState } from 'react';
import { jsPDF } from 'jspdf';
import type { AlignmentReport } from '../../types/alignment';

interface AlignmentReportDetailsProps {
  report: AlignmentReport;
}

export function AlignmentReportDetails({ report }: AlignmentReportDetailsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const json = report.report_json;

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 75) return 'var(--color-success)';
    if (pct >= 50) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  const getPillClass = (level: string) => {
    switch (level.toLowerCase()) {
      case 'alta': return { bg: 'var(--color-success-soft)', text: 'var(--color-success)', darkBg: 'var(--color-dark-success-soft)', darkText: 'var(--color-dark-success)' };
      case 'media': return { bg: 'var(--color-warning-soft)', text: 'var(--color-warning)', darkBg: 'var(--color-dark-warning-soft)', darkText: 'var(--color-dark-warning)' };
      case 'baja': return { bg: 'var(--color-error-soft)', text: 'var(--color-error)', darkBg: 'var(--color-dark-error-soft)', darkText: 'var(--color-dark-error)' };
      default: return { bg: 'var(--color-bg-surface-alt)', text: 'var(--color-text-secondary)', darkBg: 'var(--color-dark-bg-surface-alt)', darkText: 'var(--color-dark-text-secondary)' };
    }
  };

  const levelText = report.alignment_level === 'Alta' ? 'Altamente Alineada' :
                    report.alignment_level === 'Media' ? 'Parcialmente Alineada' : 'Poco Alineada';

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

      // ── Encabezado ───────────────────────────────────────────
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 30, 30);
      pdf.text('Reporte de Alineamiento de Tesis', margin, y);
      y += 7;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120, 120, 120);
      const fechaGeneracion = new Date().toLocaleDateString('es-PE', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      pdf.text(
        `Generado el ${fechaGeneracion}  ·  Evaluado el ${formatDate(report.created_at)}`,
        margin, y,
      );
      y += 5;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageW - margin, y);
      y += 9;

      // ── Idea de tesis ─────────────────────────────────────────
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(120, 120, 120);
      pdf.text('IDEA DE TESIS EVALUADA', margin, y);
      y += 5;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(40, 40, 40);
      const ideaLines = pdf.splitTextToSize(`"${report.thesis_idea}"`, contentW);
      checkPageBreak(ideaLines.length * 5 + 4);
      pdf.text(ideaLines, margin, y);
      y += ideaLines.length * 5 + 6;

      // ── Score y nivel ─────────────────────────────────────────
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 30, 30);
      pdf.text(`Score de alineamiento: ${report.score_pct} / 100  ·  ${levelText}`, margin, y);
      y += 9;

      // ── Skill bars ────────────────────────────────────────────
      if (json.skill_bars && json.skill_bars.length > 0) {
        checkPageBreak(14);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(120, 120, 120);
        pdf.text('HABILIDADES EVALUADAS', margin, y);
        y += 5;

        for (const bar of json.skill_bars) {
          checkPageBreak(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(60, 60, 60);
          pdf.text(`${bar.name}`, margin + 4, y);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`${bar.percentage}%`, pageW - margin - 10, y);
          y += 5;
        }
        y += 4;
      }

      // ── Fortalezas ────────────────────────────────────────────
      if (json.student_strengths && json.student_strengths.length > 0) {
        checkPageBreak(14);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(120, 120, 120);
        pdf.text('FORTALEZAS', margin, y);
        y += 5;

        for (const str of json.student_strengths) {
          const lines = pdf.splitTextToSize(`• ${str.replace(/^- /, '')}`, contentW - 8);
          checkPageBreak(lines.length * 4.5 + 3);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(60, 60, 60);
          pdf.text(lines, margin + 4, y);
          y += lines.length * 4.5 + 2;
        }
        y += 4;
      }

      // ── Brechas criticas ──────────────────────────────────────
      if (json.skill_gaps && json.skill_gaps.length > 0) {
        checkPageBreak(14);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(120, 120, 120);
        pdf.text('BRECHAS CRITICAS', margin, y);
        y += 5;

        for (const gap of json.skill_gaps) {
          const lines = pdf.splitTextToSize(`• ${gap.replace(/^- /, '')}`, contentW - 8);
          checkPageBreak(lines.length * 4.5 + 3);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(60, 60, 60);
          pdf.text(lines, margin + 4, y);
          y += lines.length * 4.5 + 2;
        }
        y += 4;
      }

      // ── Cursos relevantes ─────────────────────────────────────
      if (json.relevant_courses && json.relevant_courses.length > 0) {
        checkPageBreak(14);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(120, 120, 120);
        pdf.text('CURSOS RELEVANTES', margin, y);
        y += 5;

        for (const course of json.relevant_courses) {
          const lines = pdf.splitTextToSize(`• ${course.name}${course.relevance ? ` — ${course.relevance}` : ''}`, contentW - 8);
          checkPageBreak(lines.length * 4.5 + 3);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(60, 60, 60);
          pdf.text(lines, margin + 4, y);
          y += lines.length * 4.5 + 2;
        }
        y += 4;
      }

      // ── Skills del CV ─────────────────────────────────────────
      if (json.relevant_cv_skills && json.relevant_cv_skills.length > 0) {
        checkPageBreak(14);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(120, 120, 120);
        pdf.text('SKILLS DEL CV', margin, y);
        y += 5;

        const skillList = json.relevant_cv_skills
          .map(s => s.indexOf(':') > 0 ? s.substring(0, s.indexOf(':')) : s)
          .join('  ·  ');
        const skillLines = pdf.splitTextToSize(skillList, contentW - 8);
        checkPageBreak(skillLines.length * 4.5 + 4);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(60, 60, 60);
        pdf.text(skillLines, margin + 4, y);
        y += skillLines.length * 4.5 + 6;
      }

      // ── Justificacion ─────────────────────────────────────────
      checkPageBreak(14);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageW - margin, y);
      y += 6;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(120, 120, 120);
      pdf.text('JUSTIFICACION DEL ANALISIS', margin, y);
      y += 6;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(60, 60, 60);
      const justLines = pdf.splitTextToSize(report.justification, contentW - 4);
      checkPageBreak(justLines.length * 4.5 + 4);
      pdf.text(justLines, margin, y);

      const dateStr = new Date().toISOString().split('T')[0];
      pdf.save(`reporte-alineamiento-${dateStr}.pdf`);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('Ocurrio un error al generar el PDF. Revisa la consola para mas detalles.');
    } finally {
      setIsExporting(false);
    }
  };

  const pillStyle = getPillClass(report.alignment_level);

  // Calculate dash offset for score ring (circumference = 2 * PI * r = 2 * PI * 28 = 175.9)
  const circumference = 175.9;
  const dashoffset = circumference - (report.score_pct / 100) * circumference;

  return (
    <div className="flex flex-col gap-5 animate-[fadeUp_0.4s_ease]">

      {/* Header Card */}
      <div className="bg-bg-surface border border-border rounded-[16px] p-5 sm:p-6 sm:px-7 flex flex-col gap-4 dark:bg-dark-bg-surface dark:border-dark-border">
        <div className="flex flex-col-reverse sm:flex-row items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-text-muted mb-[6px] dark:text-dark-text-muted">
              Idea de tesis evaluada
            </p>
            <h2 className="font-serif text-[1.15rem] text-text-primary leading-[1.4] max-w-[520px] dark:text-dark-text-primary">
              {report.thesis_idea}
            </h2>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="relative w-[72px] h-[72px]">
              <svg viewBox="0 0 72 72" width="72" height="72" className="-rotate-90">
                {/* We use a class for the background circle so we can apply dark mode colors via CSS vars */}
                <circle cx="36" cy="36" r="28" fill="none" className="stroke-bg-surface-alt dark:stroke-dark-bg-surface-alt" strokeWidth="6" />
                <circle
                  cx="36" cy="36" r="28" fill="none"
                  stroke={getScoreColor(report.score_pct)}
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-serif text-[1.1rem] font-normal text-text-primary leading-none dark:text-dark-text-primary">
                  {report.score_pct}
                </span>
                <span className="text-[9px] text-text-muted dark:text-dark-text-muted">/ 100</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="inline-flex items-center gap-[6px] py-[6px] px-[14px] rounded-full text-[13px] font-medium"
            // We use inline styles for dynamic pill styling but allow css var fallback for dark mode
            // In a pure tailwind app we'd map this to classes, but here we can just use the CSS vars
            style={{
              backgroundColor: `var(--current-pill-bg)`,
              color: `var(--current-pill-text)`
            } as React.CSSProperties}
            // We inject the correct CSS vars inline so dark mode toggles them automatically
            ref={(el) => {
              if (el) {
                el.style.setProperty('--current-pill-bg', document.documentElement.classList.contains('dark') ? pillStyle.darkBg : pillStyle.bg);
                el.style.setProperty('--current-pill-text', document.documentElement.classList.contains('dark') ? pillStyle.darkText : pillStyle.text);
              }
            }}
          >
            <span className="w-[7px] h-[7px] rounded-full" style={{ backgroundColor: 'currentColor' }}></span>
            {levelText} · {report.score_pct}%
          </span>
          <div className="flex items-center gap-6 text-[12px] text-text-muted dark:text-dark-text-muted">
            <span className="flex items-center gap-[5px]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              {formatDate(report.created_at)}
            </span>
          </div>
        </div>

        {/* Skill Bars */}
        {json.skill_bars && json.skill_bars.length > 0 && (
          <>
            <div className="h-[1px] bg-border my-4 dark:bg-dark-border" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {json.skill_bars.map((bar, i) => {
                // Determine CSS variable name based on percentage
                let barColorVar = '--color-error';
                let darkBarColorVar = '--color-dark-error';

                if (bar.percentage >= 75) {
                  barColorVar = '--color-success';
                  darkBarColorVar = '--color-dark-success';
                } else if (bar.percentage >= 40) {
                  barColorVar = '--color-accent';
                  darkBarColorVar = '--color-dark-accent';
                }

                return (
                  <div key={i} className="flex flex-col gap-[6px]">
                    <div className="flex justify-between text-[12px] text-text-muted dark:text-dark-text-muted">
                      <span>{bar.name}</span>
                      <span>{bar.percentage}%</span>
                    </div>
                    <div className="h-[6px] bg-bg-surface-alt rounded-full overflow-hidden dark:bg-dark-bg-surface-alt">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${bar.percentage}%`, backgroundColor: `var(--current-bar-color)` } as React.CSSProperties}
                        ref={(el) => {
                          if (el) {
                            el.style.setProperty('--current-bar-color', document.documentElement.classList.contains('dark') ? `var(${darkBarColorVar})` : `var(${barColorVar})`);
                          }
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">

        {/* Fortalezas */}
        <div className="bg-bg-surface border border-border rounded-[14px] p-4 sm:p-5 sm:px-6 flex flex-col gap-4 dark:bg-dark-bg-surface dark:border-dark-border">
          <div className="flex items-center gap-[10px]">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-success-soft text-success dark:bg-dark-success-soft dark:text-dark-success">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-text-primary dark:text-dark-text-primary">Fortalezas</p>
              <p className="text-[12px] text-text-muted dark:text-dark-text-muted">{json.student_strengths?.length || 0} habilidades identificadas</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {json.student_strengths?.map((str, i) => {
              const splitIdx = str.indexOf(':');
              let boldPart = '';
              let restPart = str.replace(/^- /, '');
              if (splitIdx > 0 && splitIdx < 120) {
                boldPart = str.substring(0, splitIdx + 1).replace(/^- /, '');
                restPart = str.substring(splitIdx + 1);
              }

              return (
                <div key={i} className="flex gap-[10px] items-start text-[13px] leading-[1.5] text-text-secondary dark:text-dark-text-secondary">
                  <div className="w-[6px] h-[6px] rounded-full bg-success mt-[6px] shrink-0 dark:bg-dark-success" />
                  <span>
                    {boldPart && <strong className="font-semibold text-text-primary mr-1 dark:text-dark-text-primary">{boldPart}</strong>}
                    {restPart}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Brechas */}
        <div className="bg-bg-surface border border-border rounded-[14px] p-4 sm:p-5 sm:px-6 flex flex-col gap-4 dark:bg-dark-bg-surface dark:border-dark-border">
          <div className="flex items-center gap-[10px]">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-error-soft text-error dark:bg-dark-error-soft dark:text-dark-error">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-text-primary dark:text-dark-text-primary">Brechas críticas</p>
              <p className="text-[12px] text-text-muted dark:text-dark-text-muted">{json.skill_gaps?.length || 0} áreas a reforzar</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {json.skill_gaps?.map((gap, i) => {
              // Extract the prefix (e.g. "Brecha en...:") to bold it
              const splitIdx = gap.indexOf(':');
              let boldPart = '';
              let restPart = gap.replace(/^- /, '');
              if (splitIdx > 0 && splitIdx < 120) {
                boldPart = gap.substring(0, splitIdx + 1).replace(/^- /, '');
                restPart = gap.substring(splitIdx + 1);
              }

              return (
                <div key={i} className="bg-error-soft border border-[#EEC8C8] rounded-lg p-[0.6rem] px-[0.85rem] text-[12.5px] text-[#8B3030] leading-[1.45] dark:bg-dark-error-soft dark:border-dark-error dark:text-red-300">
                  {boldPart && <strong className="font-semibold block mb-[2px] text-error dark:text-red-400">{boldPart}</strong>}
                  {restPart}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cursos relevantes */}
        <div className="bg-bg-surface border border-border rounded-[14px] p-4 sm:p-5 sm:px-6 flex flex-col gap-4 dark:bg-dark-bg-surface dark:border-dark-border">
          <div className="flex items-center gap-[10px]">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-accent-soft text-accent dark:bg-dark-accent-soft dark:text-dark-accent">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-text-primary dark:text-dark-text-primary">Cursos relevantes</p>
              <p className="text-[12px] text-text-muted dark:text-dark-text-muted">{json.relevant_courses?.length || 0} cursos aplicables</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-[6px]">
            {json.relevant_courses?.map((course, i) => (
              <span key={i} className="inline-flex items-center gap-[6px] bg-accent-soft border border-[#C8D8DE] text-accent rounded-lg py-[0.4rem] px-[0.75rem] text-[12px] font-medium dark:bg-dark-accent-soft dark:border-dark-border dark:text-dark-accent" title={course.relevance}>
                {course.name}
              </span>
            ))}
          </div>
        </div>

        {/* Skills CV */}
        <div className="bg-bg-surface border border-border rounded-[14px] p-4 sm:p-5 sm:px-6 flex flex-col gap-4 dark:bg-dark-bg-surface dark:border-dark-border">
          <div className="flex items-center gap-[10px]">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-warning-soft text-warning dark:bg-dark-warning-soft dark:text-dark-warning">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-text-primary dark:text-dark-text-primary">Skills del CV</p>
              <p className="text-[12px] text-text-muted dark:text-dark-text-muted">Habilidades prácticas</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {json.relevant_cv_skills?.map((skill, i) => {
              const splitIdx = skill.indexOf(':');
              const name = splitIdx > 0 ? skill.substring(0, splitIdx) : skill;

              return (
                <div key={i} className="bg-bg-primary border border-border rounded-lg py-[0.5rem] px-[0.75rem] text-[12.5px] text-text-secondary flex items-center gap-[6px] dark:bg-dark-bg-primary dark:border-dark-border dark:text-dark-text-secondary">
                  {name}
                </div>
              );
            })}
          </div>
        </div>

        {/* Justificación */}
        <div className="bg-bg-surface border border-border rounded-[14px] p-4 sm:p-5 sm:px-6 flex flex-col gap-4 lg:col-span-2 dark:bg-dark-bg-surface dark:border-dark-border">
          <div className="flex items-center gap-[10px]">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-accent-soft text-accent dark:bg-dark-accent-soft dark:text-dark-accent">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-text-primary dark:text-dark-text-primary">Justificación del análisis</p>
              <p className="text-[12px] text-text-muted dark:text-dark-text-muted">Evaluación comparativa detallada</p>
            </div>
          </div>
          <p className="text-[13px] text-text-secondary leading-[1.7] whitespace-pre-wrap dark:text-dark-text-secondary">
            {report.justification}
          </p>
        </div>

      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-1 pb-4">
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-[0.65rem] px-[1.25rem] bg-bg-surface text-text-primary border-[1.5px] border-border rounded-[10px] font-sans text-[13.5px] font-medium cursor-pointer transition-all duration-150 hover:bg-bg-hover hover:border-border-focus disabled:opacity-60 disabled:cursor-not-allowed dark:bg-dark-bg-surface dark:text-dark-text-primary dark:border-dark-border dark:hover:bg-dark-bg-hover dark:hover:border-dark-border-focus"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {isExporting ? 'Generando...' : 'Descargar Reporte PDF'}
        </button>
      </div>

    </div>
  );
}
