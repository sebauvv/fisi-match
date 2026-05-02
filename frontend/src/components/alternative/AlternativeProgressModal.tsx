import { useEffect, useState } from 'react';

interface Props {
  isVisible: boolean;
}

const STEPS = [
  'Analizando idea de tesis',
  'Infiriendo habilidades requeridas',
  'Comparando con perfil del estudiante',
  'Detectando brechas de conocimiento',
  'Generando temas alternativos con LLM',
  'Compilando reporte final',
];

export function AlternativeProgressModal({ isVisible }: Props) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
      let step = 0;
      
      const interval = setInterval(() => {
        if (step < STEPS.length - 1) {
          step++;
          setCurrentStep(step);
        } else {
          clearInterval(interval);
        }
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 w-[420px] shadow-2xl flex flex-col items-center gap-2 animate-in zoom-in-95 duration-200">
        
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        
        <h2 className="font-serif text-xl text-slate-900 dark:text-white text-center">
          Buscando temas alternativos
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center">
          Esto puede tomar unos segundos...
        </p>

        <div className="w-full flex flex-col gap-0">
          {STEPS.map((text, idx) => {
            const isDone = idx < currentStep;
            const isActive = idx === currentStep;
            
            return (
              <div 
                key={idx}
                className={`flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0 text-sm transition-colors duration-300 ${
                  isDone 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : isActive 
                      ? 'text-slate-900 dark:text-white font-medium' 
                      : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  isDone 
                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                    : isActive 
                      ? 'border-blue-500 relative before:absolute before:inset-[-4px] before:rounded-full before:animate-ping before:border-2 before:border-blue-500/50' 
                      : 'border-slate-200 dark:border-slate-700'
                }`}>
                  {isDone && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3L3 5L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                {text}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
