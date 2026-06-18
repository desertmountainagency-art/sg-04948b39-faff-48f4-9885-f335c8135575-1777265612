import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { startScan, getScanStatus } from "@/lib/vibecheck";
import type { ScanRecord } from "@/lib/vibecheck";

interface ScanProgressProps {
  targetUrl: string;
  onComplete: (scan: ScanRecord) => void;
}

// Visual steps shown in the terminal — purely cosmetic while the real job runs
const VISUAL_STEPS = [
  { label: "Cloning source code...", ms: 1800 },
  { label: "Running AI static analysis...", ms: 3500 },
  { label: "Probing API endpoints...", ms: 2500 },
  { label: "Checking authentication flows...", ms: 2200 },
  { label: "Finalizing security report...", ms: 1200 },
];

const POLL_INTERVAL_MS = 2500;
const MAX_POLL_RETRIES = 30; // ~75 s maximum polling

export function ScanProgress({ targetUrl, onComplete }: ScanProgressProps) {
  const { session } = useAuth();
  const [visualStep, setVisualStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const scanIdRef = useRef<string | null>(null);
  const pollCountRef = useRef(0);
  const mountedRef = useRef(true);

  // Drive the cosmetic progress bar independent of real API
  useEffect(() => {
    if (visualStep >= VISUAL_STEPS.length) return;
    const { ms } = VISUAL_STEPS[visualStep];
    const target = ((visualStep + 1) / VISUAL_STEPS.length) * 95; // cap at 95 until done
    const tick = 50;
    const inc = (target - progress) / (ms / tick);

    const iv = setInterval(() => {
      setProgress((p) => Math.min(target, p + inc));
    }, tick);

    const t = setTimeout(() => {
      setVisualStep((s) => s + 1);
    }, ms);

    return () => {
      clearInterval(iv);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visualStep]);

  // Start the real scan once
  useEffect(() => {
    mountedRef.current = true;
    if (!session?.access_token) {
      setError("Not authenticated — please sign in again.");
      return;
    }

    let pollTimer: ReturnType<typeof setTimeout>;

    async function start() {
      try {
        const { scanId } = await startScan(targetUrl, session!.access_token);
        if (!mountedRef.current) return;
        scanIdRef.current = scanId;
        schedulePoll(scanId);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : "Failed to start scan");
      }
    }

    function schedulePoll(scanId: string) {
      pollTimer = setTimeout(() => poll(scanId), POLL_INTERVAL_MS);
    }

    async function poll(scanId: string) {
      if (!mountedRef.current) return;
      pollCountRef.current += 1;

      if (pollCountRef.current > MAX_POLL_RETRIES) {
        setError("Scan is taking too long. Please try again later.");
        return;
      }

      try {
        const { scan } = await getScanStatus(scanId, session!.access_token);
        if (!mountedRef.current) return;

        if (scan.status === "completed") {
          setProgress(100);
          setTimeout(() => {
            if (mountedRef.current) onComplete(scan);
          }, 600);
          return;
        }

        if (scan.status === "failed") {
          setError(scan.error_message || "Scan failed — please try again.");
          return;
        }

        schedulePoll(scanId);
      } catch (err) {
        if (!mountedRef.current) return;
        // Transient network errors: retry a few times before giving up
        if (pollCountRef.current < MAX_POLL_RETRIES) {
          schedulePoll(scanId);
        } else {
          setError(err instanceof Error ? err.message : "Error checking scan status");
        }
      }
    }

    start();

    return () => {
      mountedRef.current = false;
      clearTimeout(pollTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase font-mono">Scan Failed</p>
          <p className="text-sm text-foreground font-mono truncate">{targetUrl}</p>
        </div>
        <div className="bg-surface-1 border-2 border-destructive/40 rounded-lg p-6 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-destructive">Scan error</p>
            <p className="text-xs text-text-muted">{error}</p>
          </div>
        </div>
      </div>
    );
  }

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
          {VISUAL_STEPS.map((step, index) => {
            const isComplete = index < visualStep;
            const isActive = index === visualStep;
            const isPending = index > visualStep;

            return (
              <div
                key={step.label}
                className={`flex items-start gap-2 transition-opacity duration-300 ${
                  isPending ? "opacity-30" : "opacity-100"
                }`}
              >
                {isComplete && <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />}
                {isActive && <Loader2 className="w-4 h-4 text-accent-cyan flex-shrink-0 mt-0.5 animate-spin" />}
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
