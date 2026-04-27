import { Link } from 'react-router-dom';
import { type RecommendationResult } from '../../api/recommendationApi';
import { FileText, BookOpen, Quote, ShieldCheck } from 'lucide-react';

interface AdvisorRecommendationResultProps {
  data: RecommendationResult;
}

export default function AdvisorRecommendationResult({ data }: AdvisorRecommendationResultProps) {
  return (
    <div className="mt-8 animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-serif text-text-primary dark:text-dark-text-primary">Resultados Obtenidos</h2>
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">
            Recomendaciones basadas en IA generativa (Nova Lite) finalizadas en {data.elapsed_seconds}s
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success dark:bg-dark-success/10 dark:text-dark-success rounded-full text-[0.8rem] font-medium border border-success/20">
          <ShieldCheck size={16} /> Completado Exitosamente
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
