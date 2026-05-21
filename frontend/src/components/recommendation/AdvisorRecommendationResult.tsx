import { useState } from 'react';
import { Link } from 'react-router-dom';
import { type RecommendationResult } from '../../api/recommendationApi';
import { FileText, BookOpen, Quote, ShieldCheck, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface AdvisorRecommendationResultProps {
  data: RecommendationResult;
}

export default function AdvisorRecommendationResult({ data }: AdvisorRecommendationResultProps) {
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

      // Agrega nueva pagina si el contenido restante no cabe
      const checkPageBreak = (needed: number) => {
        if (y + needed > pageH - margin) {
          pdf.addPage();
          y = margin;
        }
      };

      // ── Encabezado ──────────────────────────────────────────
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 30, 30);
      pdf.text('Recomendacion de Asesores', margin, y);
      y += 7;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120, 120, 120);
      const fechaGeneracion = new Date().toLocaleDateString('es-PE', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      pdf.text(
        `Generado el ${fechaGeneracion}  ·  Procesado en ${data.elapsed_seconds}s  ·  Modelo: Nova Lite`,
        margin, y,
      );
      y += 5;

      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageW - margin, y);
      y += 9;

      // ── Un bloque por asesor ─────────────────────────────────
      for (const rec of data.recommendations) {
        checkPageBreak(40);

        // Rango + nombre
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 30, 30);
        pdf.text(`#${rec.rank}  ${rec.advisor_name}`, margin, y);
        y += 6;

        // Score y tesis
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(
          `Score de similitud: ${(rec.score * 100).toFixed(1)}%   ·   ${rec.thesis_count} tesis historicas`,
          margin + 4, y,
        );
        y += 7;

        // Etiqueta justificacion
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(50, 50, 50);
        pdf.text('Justificacion de la IA:', margin + 4, y);
        y += 5;

        // Texto justificacion (con salto de linea automatico)
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(60, 60, 60);
        const justLines = pdf.splitTextToSize(rec.explanation, contentW - 8);
        checkPageBreak(justLines.length * 4.5 + 6);
        pdf.text(justLines, margin + 4, y);
        y += justLines.length * 4.5 + 6;

        // Evidencia central
        if (rec.matching_evidence && rec.matching_evidence.length > 0) {
          checkPageBreak(14);
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(130, 130, 130);
          pdf.text('EVIDENCIA CENTRAL DETECTADA', margin + 4, y);
          y += 5;

          for (const ev of rec.matching_evidence) {
            const typeLabel = ev.content_type === 'thesis' ? 'Tesis' : 'Articulo';
            const evLines = pdf.splitTextToSize(`"${ev.content_text}"`, contentW - 16);
            checkPageBreak(evLines.length * 4 + 10);

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(80, 80, 80);
            pdf.text(
              `[${typeLabel}]  Año: ${ev.year}  ·  Chunk Score: ${(ev.chunk_score * 10).toFixed(2)}`,
              margin + 8, y,
            );
            y += 4;

            pdf.setFont('helvetica', 'italic');
            pdf.setFontSize(8);
            pdf.setTextColor(90, 90, 90);
            pdf.text(evLines, margin + 8, y);
            y += evLines.length * 4 + 5;
          }
        }

        // Separador entre asesores
        pdf.setDrawColor(220, 220, 220);
        pdf.line(margin, y, pageW - margin, y);
        y += 9;
      }

      const dateStr = new Date().toISOString().split('T')[0];
      pdf.save(`recomendacion-asesores-${dateStr}.pdf`);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('Ocurrio un error al generar el PDF. Revisa la consola para mas detalles.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mt-8 animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-serif text-text-primary dark:text-dark-text-primary">Resultados Obtenidos</h2>
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">
            Recomendaciones basadas en IA generativa (Nova Lite) finalizadas en {data.elapsed_seconds}s
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-accent dark:bg-dark-accent hover:bg-accent-hover dark:hover:bg-dark-accent-hover text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download size={15} />
            {isExporting ? 'Generando...' : 'Exportar PDF'}
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success dark:bg-dark-success/10 dark:text-dark-success rounded-full text-[0.8rem] font-medium border border-success/20">
            <ShieldCheck size={16} /> Completado Exitosamente
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {data.recommendations.map((rec) => (
          <div key={rec.advisor_id} className="bg-bg-surface dark:bg-dark-bg-surface border border-border dark:border-dark-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            
            {/* Header (Top Advisor Profile snippet) */}
            <div className="p-5 flex items-start gap-4 border-b border-border dark:border-dark-border bg-linear-to-br from-transparent to-bg-surface-alt/50 dark:to-dark-bg-surface-alt/50">
              <div className="w-12 h-12 bg-accent/10 dark:bg-dark-accent/10 text-accent dark:text-dark-accent rounded-xl flex items-center justify-center text-lg font-bold">
                #{rec.rank}
              </div>
              <div className="flex-1">
                <h3 className="text-[1.1rem] font-medium text-text-primary dark:text-dark-text-primary">
                  {rec.advisor_name}
                </h3>
                <div className="flex gap-4 mt-2">
                  <p className="text-xs text-text-muted dark:text-dark-text-muted flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-warning"></span>
                    Score Modelo: {(rec.score * 100).toFixed(1)}% de Similitud
                  </p>
                  <p className="text-xs text-text-muted dark:text-dark-text-muted flex items-center gap-1.5">
                    <BookOpen size={12} /> {rec.thesis_count} Tesis históricas
                  </p>
                </div>
              </div>
              <Link 
                to={`/explorador-profesores/${rec.advisor_id}`} 
                className="shrink-0 px-4 py-2 border border-border dark:border-dark-border rounded-lg text-sm font-medium text-text-secondary dark:text-dark-text-secondary hover:bg-bg-surface-alt dark:hover:bg-dark-bg-surface-alt transition-colors"
                target="_blank"
              >
                Ver Perfil
              </Link>
            </div>

            {/* Explanation box */}
            <div className="p-5 py-4">
              <div className="flex items-start gap-3">
                <Quote className="w-5 h-5 text-accent/50 shrink-0 mt-0.5" />
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">
                  <strong className="text-text-primary dark:text-dark-text-primary font-medium">Justificación de la IA:</strong> {rec.explanation}
                </p>
              </div>
            </div>

            {/* Evidence items */}
            {rec.matching_evidence && rec.matching_evidence.length > 0 && (
              <div className="p-5 py-4 bg-bg-surface-alt/30 dark:bg-dark-bg-surface-alt/30 border-t border-border/50 dark:border-dark-border/50">
                <h4 className="text-xs font-semibold text-text-muted dark:text-dark-text-muted uppercase tracking-wider mb-3">Evidencia Central Detectada</h4>
                <div className="space-y-3">
                  {rec.matching_evidence.map((evidence, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-bg-surface dark:bg-dark-bg-surface p-3 rounded-lg border border-border/50 dark:border-dark-border/50">
                      <div className="w-8 h-8 rounded-lg bg-bg-primary dark:bg-dark-bg-primary flex items-center justify-center shrink-0 border border-border dark:border-dark-border">
                        {evidence.content_type === 'thesis' ? <BookOpen size={14} className="text-text-muted" /> : <FileText size={14} className="text-text-muted" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-text-primary dark:text-dark-text-primary line-clamp-3 leading-relaxed">
                          "{evidence.content_text}"
                        </p>
                        <div className="flex gap-3 text-[0.7rem] text-text-muted mt-2">
                          <span>• Año: {evidence.year}</span>
                          <span>• Chunk Score: {(evidence.chunk_score * 10).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
