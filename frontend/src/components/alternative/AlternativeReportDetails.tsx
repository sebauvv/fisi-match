import { useState } from 'react';
import type { AlternativeRecommendationResponse } from '../../types/alternative';
import type { AlignmentReport } from '../../types/alignment';

interface Props {
  data: AlternativeRecommendationResponse;
  report: AlignmentReport;
}

export function AlternativeReportDetails({ data, report }: Props) {
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
          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Generado · {new Date().toLocaleDateString()}
          </span>
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
