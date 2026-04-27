import { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface ProgressLoaderModalProps {
  // Called by the parent when the API returns (success or error)
  // If undefined, the modal controls its own pacing as a timed simulation
  isComplete?: boolean;
}

const STEPS = [
  { id: 1, label: "1. Generando embedding de la idea...", done: "Vector generado (1024d)" },
  { id: 2, label: "2. Buscando chunks similares en la base de datos...", done: "50 chunks recuperados con pgvector" },
  { id: 3, label: "3. Calculando scores con peso temporal...", done: "Top 5 asesores rankeados" },
  { id: 4, label: "4. Generando explicaciones RAG (Nova Lite)...", done: "Explicaciones generadas por el LLM" },
];

// First 3 steps are fast (~2s each), step 4 lasts until API responds
const STEP_TIMINGS_MS = [0, 2000, 4000, 6000];

export default function ProgressLoaderModal({ isComplete }: ProgressLoaderModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  // Advance through steps 1–4 on a timer
  useEffect(() => {
    const timers = STEP_TIMINGS_MS.slice(1).map((delay, idx) =>
      setTimeout(() => setCurrentStep(idx + 2), delay)
    );
    const tick = setInterval(() => {
      setElapsed((Date.now() - startRef.current) / 1000);
    }, 200);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(tick);
    };
  }, []);

  // When API signals completion, mark step 4 as done
  const allDone = isComplete === true;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-bg-surface dark:bg-dark-bg-surface w-full max-w-lg rounded-2xl border border-border dark:border-dark-border shadow-2xl p-8 animate-fade-in-up">
        <p className="text-xs uppercase tracking-widest text-text-muted dark:text-dark-text-muted font-semibold mb-6">
          Procesando tu recomendación...
        </p>

        <div className="space-y-6">
          {STEPS.map((step) => {
            const stepDone = allDone
              ? true  // API done → all steps complete
              : step.id < currentStep; // Step already passed
            const stepActive = !stepDone && step.id === currentStep;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-4 transition-opacity duration-500 ${
                  !stepActive && !stepDone ? 'opacity-30' : 'opacity-100'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {stepDone ? (
                    <CheckCircle2 className="w-5 h-5 text-accent dark:text-dark-accent" />
                  ) : stepActive ? (
                    <Loader2 className="w-5 h-5 text-accent dark:text-dark-accent animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-border dark:border-dark-border" />
                  )}
                </div>
                <div>
                  <p className={`text-[0.92rem] font-medium ${
                    stepActive ? 'text-text-primary dark:text-dark-text-primary'
                               : 'text-text-secondary dark:text-dark-text-secondary'
                  }`}>
                    {step.label}
                  </p>
                  <p className={`text-[0.8rem] mt-0.5 transition-all duration-300 ${
                    stepDone || stepActive
                      ? 'text-text-muted dark:text-dark-text-muted max-h-10 opacity-100'
                      : 'max-h-0 opacity-0 overflow-hidden'
                  }`}>
                    {step.done}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-right">
          <span className="text-xs text-text-muted dark:text-dark-text-muted tabular-nums">
            {elapsed.toFixed(1)}s
          </span>
        </div>
      </div>
    </div>
  );
}
