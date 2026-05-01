import { useEffect, useState } from 'react';

interface AlignmentProgressModalProps {
  isOpen: boolean;
}

const STEPS = [
  'Analizando idea de tesis',
  'Infiriendo temas requeridos',
  'Consultando historial académico',
  'Procesando CV del estudiante',
  'Resumiendo conocimiento',
  'Evaluando alineamiento con LLM',
  'Generando reporte final',
];

export function AlignmentProgressModal({ isOpen }: AlignmentProgressModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }

    let isMounted = true;

    const advanceSteps = () => {
      setCurrentStep(prev => {
        if (prev >= STEPS.length - 1) return prev; // Stay on last step until modal closes
        const nextStep = prev + 1;
        const delay = nextStep === STEPS.length - 1 ? 2500 : 1200 + Math.random() * 800;
        
        setTimeout(() => {
          if (isMounted) advanceSteps();
        }, delay);

        return nextStep;
      });
    };

    // Start the progression
    setTimeout(() => {
      if (isMounted) advanceSteps();
    }, 1500);

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#1e1e2e8c] z-[200] flex items-center justify-center backdrop-blur-[4px] dark:bg-[#0f1729b3]">
      <div className="bg-bg-surface border border-border rounded-[20px] w-[420px] p-10 flex flex-col items-center gap-6 animate-[modalIn_0.3s_cubic-bezier(0.16,1,0.3,1)] dark:bg-dark-bg-surface dark:border-dark-border">
        <div className="relative w-[60px] h-[60px]">
          <svg viewBox="0 0 60 60" fill="none" className="w-[60px] h-[60px] animate-[spin_1.4s_linear_infinite]">
            <circle cx="30" cy="30" r="24" fill="none" className="stroke-bg-surface-alt dark:stroke-dark-bg-surface-alt" strokeWidth="5" />
            <circle
              cx="30"
              cy="30"
              r="24"
              fill="none"
              className="stroke-accent dark:stroke-dark-accent"
              strokeWidth="5"
              strokeDasharray="150.8"
              strokeDashoffset="113.1"
              strokeLinecap="round"
            />
          </svg>
        </div>
        
        <div>
          <h3 className="font-serif text-[1.25rem] text-center text-text-primary dark:text-dark-text-primary">Generando reporte</h3>
          <p className="text-[13px] text-text-muted text-center mt-1 dark:text-dark-text-muted">Esto puede tomar unos segundos…</p>
        </div>

        <div className="w-full flex flex-col gap-[6px]">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentStep;
            const isActive = idx === currentStep;
            
            return (
              <div
                key={idx}
                className={`flex items-center gap-[10px] text-[13px] p-[6px] px-2 rounded-lg transition-all duration-200 ${
                  isActive ? 'bg-accent-soft text-accent font-medium dark:bg-dark-accent-soft dark:text-dark-accent' : 
                  isDone ? 'text-success dark:text-dark-success' : 'text-text-muted dark:text-dark-text-muted'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <div className={`w-[6px] h-[6px] rounded-full ${
                    isActive ? 'bg-accent dark:bg-dark-accent' :
                    isDone ? 'bg-success dark:bg-dark-success' : 'bg-border dark:bg-dark-border'
                  }`} />
                </div>
                {step}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
