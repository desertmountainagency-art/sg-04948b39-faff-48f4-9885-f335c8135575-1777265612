import { useState, useEffect } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

interface ScanProgressProps {
  targetUrl: string;
  onComplete: () => void;
}

const scanSteps = [
  { id: 1, label: "Cloning source code...", duration: 2000 },
  { id: 2, label: "Running AI Static Analysis...", duration: 3000 },
  { id: 3, label: "Probing API endpoints...", duration: 2500 },
  { id: 4, label: "Checking authentication flows...", duration: 2000 },
  { id: 5, label: "Finalizing security report...", duration: 1500 },
];

export function ScanProgress({ targetUrl, onComplete }: ScanProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (currentStep >= scanSteps.length) {
      setTimeout(onComplete, 800);
      return;
    }

    const stepDuration = scanSteps[currentStep].duration;
    const progressIncrement = (100 / scanSteps.length) / (stepDuration / 50);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const nextProgress = prev + progressIncrement;
        if (nextProgress >= ((currentStep + 1) / scanSteps.length) * 100) {
          return ((currentStep + 1) / scanSteps.length) * 100;
        }
        return nextProgress;
      });
    }, 50);

    const stepTimer = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, stepDuration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimer);
    };
  }, [currentStep, onComplete]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase font-mono">
          Scan In Progress
        </p>
        <p className="text-sm text-foreground font-mono truncate">{targetUrl}</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-text-muted">Progress</span>
          <span className="text-lg font-bold font-mono text-accent-cyan">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-cyan transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Terminal Output */}
      <div className="bg-surface-1 border border-border rounded-lg p-4 space-y-3 min-h-[240px]">
        <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-accent-green/60" />
          </div>
          <span className="text-[9px] font-mono text-text-dim uppercase tracking-wider">
            vibecheck.ai.engine
          </span>
        </div>

        <div className="space-y-2 font-mono text-xs">
          {scanSteps.map((step, index) => {
            const isComplete = index < currentStep;
            const isActive = index === currentStep;
            const isPending = index > currentStep;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-2 transition-opacity duration-300 ${
                  isPending ? "opacity-30" : "opacity-100"
                }`}
              >
                {isComplete && (
                  <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
                )}
                {isActive && (
                  <Loader2 className="w-4 h-4 text-accent-cyan flex-shrink-0 mt-0.5 animate-spin" />
                )}
                {isPending && (
                  <div className="w-4 h-4 flex-shrink-0 mt-0.5 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-text-dim" />
                  </div>
                )}
                <span
                  className={
                    isActive ? "text-foreground" : isComplete ? "text-text-muted" : "text-text-dim"
                  }
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}