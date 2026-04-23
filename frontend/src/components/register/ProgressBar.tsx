interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export default function ProgressBar({ currentStep, totalSteps, labels }: ProgressBarProps) {
  return (
    <div className="w-full px-2">
      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {labels.map((label, idx) => {
          const step = idx + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <div key={label} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {idx > 0 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors duration-300 ${
                      step <= currentStep
                        ? 'bg-accent dark:bg-dark-accent'
                        : 'bg-border dark:bg-dark-border'
                    }`}
                  />
                )}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-accent text-white dark:bg-dark-accent'
                      : isCurrent
                        ? 'bg-accent text-white shadow-md shadow-accent/30 dark:bg-dark-accent dark:shadow-dark-accent/30'
                        : 'bg-bg-surface-alt text-text-muted dark:bg-dark-bg-surface-alt dark:text-dark-text-muted'
                  }`}
                >
                  {isCompleted ? '✓' : step}
                </div>
                {idx < totalSteps - 1 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors duration-300 ${
                      step < currentStep
                        ? 'bg-accent dark:bg-dark-accent'
                        : 'bg-border dark:bg-dark-border'
                    }`}
                  />
                )}
              </div>
              <span
                className={`mt-2 text-center text-[10px] font-medium leading-tight sm:text-xs ${
                  isCurrent || isCompleted
                    ? 'text-accent dark:text-dark-accent'
                    : 'text-text-muted dark:text-dark-text-muted'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
