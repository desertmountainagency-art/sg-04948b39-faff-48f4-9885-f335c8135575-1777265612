import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  Shield, Github, Globe, ArrowRight, CheckCircle2, Loader2,
  ChevronRight, AlertTriangle, Zap, X
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/hooks/use-onboarding";
import { validateTargetUrl, getScanStatus } from "@/lib/vibecheck";
import { cn } from "@/lib/utils";
import type { ScanRecord } from "@/lib/vibecheck";

const STEPS = [
  { number: 1, label: "Connect repo" },
  { number: 2, label: "Create project" },
  { number: 3, label: "Run scan" },
];

const PLATFORMS = ["github", "lovable", "replit", "bolt", "cursor", "v0", "other"] as const;
type Platform = (typeof PLATFORMS)[number];

type WizardStep = 1 | 2 | 3 | 4; // 4 = done/celebration

export default function Onboarding() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();
  const { completed, loading: onboardingLoading, markComplete } = useOnboarding();

  const [step, setStep] = useState<WizardStep>(1);

  // Step 1 state
  const [repoUrl, setRepoUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  // Step 2 state
  const [projectName, setProjectName] = useState("");
  const [platform, setPlatform] = useState<Platform | "">("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  // Step 3 state
  const [scanning, setScanning] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);
  const [scan, setScan] = useState<ScanRecord | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirect already-authenticated + already-onboarded users
  useEffect(() => {
    if (authLoading || onboardingLoading) return;
    if (!user) { router.replace("/auth?redirectTo=/onboarding"); return; }
    if (completed === true) { router.replace("/dashboard"); return; }
  }, [user, authLoading, completed, onboardingLoading, router]);

  // Derive project name suggestion from URL
  useEffect(() => {
    if (!repoUrl) return;
    try {
      const url = new URL(repoUrl);
      const parts = url.pathname.replace(/^\//, "").split("/");
      // github.com/owner/repo → use repo segment
      const name = parts[parts.length - 1] || parts[0] || "";
      if (name && !projectName) setProjectName(name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
    } catch { /* ignore */ }
    // Detect platform from URL
    if (/github\.com/.test(repoUrl)) setPlatform("github");
    else if (/replit\.com/.test(repoUrl)) setPlatform("replit");
    else if (/bolt\.new/.test(repoUrl)) setPlatform("bolt");
    else if (/lovable\.dev/.test(repoUrl)) setPlatform("lovable");
    else if (/v0\.dev/.test(repoUrl)) setPlatform("v0");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoUrl]);

  // Cleanup poll on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // ─── Step handlers ─────────────────────────────────────────────────────────

  function handleStep1Next() {
    const err = validateTargetUrl(repoUrl.trim());
    if (err) { setUrlError(err); return; }
    setUrlError(null);
    setStep(2);
  }

  async function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.access_token) return;
    setCreating(true);
    setCreateError(null);

    const res = await fetch("/api/projects/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        name: projectName.trim(),
        repositoryUrl: repoUrl.trim(),
        platform: platform || undefined,
        description: description.trim() || undefined,
      }),
    });

    const json = await res.json();
    setCreating(false);

    if (!res.ok) {
      setCreateError(json.error ?? "Failed to create project");
      return;
    }

    setProjectId(json.project.id);
    setStep(3);
  }

  async function handleRunScan() {
    if (!session?.access_token || !projectId || scanning) return;
    setScanning(true);
    setScanError(null);

    const res = await fetch(`/api/projects/${projectId}/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const json = await res.json();
    if (!res.ok) {
      setScanError(json.error ?? "Failed to start scan");
      setScanning(false);
      return;
    }

    setScanId(json.scanId);

    // Poll for completion
    pollRef.current = setInterval(async () => {
      try {
        const { scan: s } = await getScanStatus(json.scanId, session!.access_token);
        if (s.status === "completed" || s.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setScanning(false);
          setScan(s);
          if (s.status === "completed") {
            await markComplete();
            setStep(4);
          } else {
            setScanError(s.error_message ?? "Scan failed — please try again.");
          }
        }
      } catch { /* retry next tick */ }
    }, 2500);
  }

  function handleSkipScan() {
    markComplete().then(() => router.replace("/dashboard"));
  }

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (authLoading || onboardingLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-accent-cyan animate-spin" />
      </div>
    );
  }

  // ─── Celebration / done (step 4) ───────────────────────────────────────────

  if (step === 4 && scan) {
    const hasCritical = scan.critical_count > 0;
    return (
      <>
        <SEO title="Setup Complete — vibecheck.dev" description="" />
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg space-y-8 text-center">
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2",
              hasCritical
                ? "bg-surface-1 border-border"
                : "bg-accent-cyan/10 border-accent-cyan shadow-[0_0_30px_rgba(0,240,255,0.3)]"
            )}>
              <Shield className={cn("w-10 h-10", hasCritical ? "text-text-dim" : "text-accent-cyan")} />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {hasCritical ? "Issues Found" : "Vibe Checked ✓"}
              </h1>
              <p className="text-sm text-text-muted">
                {hasCritical
                  ? `Found ${scan.critical_count} critical issue${scan.critical_count !== 1 ? "s" : ""} — review the findings to fix them.`
                  : "No critical vulnerabilities detected. Your project is looking good!"}
              </p>
            </div>

            {/* Mini summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface-1 border-2 border-destructive/30 rounded-xl p-4 space-y-1">
                <p className="text-2xl font-bold font-mono text-destructive">{scan.critical_count}</p>
                <p className="text-[9px] font-bold tracking-widest uppercase text-text-muted">Critical</p>
              </div>
              <div className="bg-surface-1 border-2 border-warning/30 rounded-xl p-4 space-y-1">
                <p className="text-2xl font-bold font-mono text-warning">{scan.warning_count}</p>
                <p className="text-[9px] font-bold tracking-widest uppercase text-text-muted">Warnings</p>
              </div>
              <div className="bg-surface-1 border-2 border-border-subtle rounded-xl p-4 space-y-1">
                <p className="text-2xl font-bold font-mono text-foreground">{scan.passed_count}</p>
                <p className="text-[9px] font-bold tracking-widest uppercase text-text-muted">Passed</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.replace(`/projects/${projectId}/scans/${scan.id}`)}
                className="w-full px-6 py-3 bg-accent-cyan text-background font-bold text-sm tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 transition-all"
              >
                View Full Report
              </button>
              <button
                onClick={() => router.replace("/dashboard")}
                className="w-full px-6 py-3 border border-border rounded-lg text-sm font-medium text-text-muted hover:text-foreground hover:border-border-subtle transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── Wizard ────────────────────────────────────────────────────────────────

  return (
    <>
      <SEO title="Get Started — vibecheck.dev" description="Connect your project and run your first security audit." />

      <div className="min-h-screen bg-background flex flex-col">
        {/* Top bar */}
        <header className="border-b border-border bg-surface-1">
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-accent-cyan" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-semibold">
                vibecheck<span className="text-accent-cyan">.dev</span>
              </span>
            </div>
            <button
              onClick={handleSkipScan}
              className="text-xs text-text-dim hover:text-text-muted transition-colors flex items-center gap-1"
            >
              Skip setup
              <X className="w-3 h-3" />
            </button>
          </div>
        </header>

        {/* Progress stepper */}
        <div className="border-b border-border bg-surface-1">
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="flex items-center gap-0">
              {STEPS.map((s, i) => {
                const done = step > s.number;
                const active = step === s.number;
                return (
                  <div key={s.number} className="flex items-center flex-1 last:flex-none">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 flex-shrink-0 transition-all",
                        done
                          ? "bg-accent-cyan border-accent-cyan text-background"
                          : active
                            ? "bg-accent-cyan/10 border-accent-cyan text-accent-cyan"
                            : "bg-surface-2 border-border text-text-dim"
                      )}>
                        {done ? <CheckCircle2 className="w-4 h-4" /> : s.number}
                      </div>
                      <span className={cn(
                        "text-[11px] font-bold tracking-widest uppercase hidden sm:block",
                        active ? "text-foreground" : done ? "text-text-muted" : "text-text-dim"
                      )}>
                        {s.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={cn(
                        "flex-1 h-px mx-3 transition-all",
                        step > s.number ? "bg-accent-cyan/50" : "bg-border"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step content */}
        <main className="flex-1 flex items-start justify-center px-4 pt-8 pb-16">
          <div className="w-full max-w-lg">
            {step === 1 && (
              <Step1
                repoUrl={repoUrl}
                setRepoUrl={setRepoUrl}
                urlError={urlError}
                onNext={handleStep1Next}
              />
            )}
            {step === 2 && (
              <Step2
                repoUrl={repoUrl}
                projectName={projectName}
                setProjectName={setProjectName}
                platform={platform}
                setPlatform={setPlatform}
                description={description}
                setDescription={setDescription}
                creating={creating}
                createError={createError}
                onBack={() => setStep(1)}
                onSubmit={handleStep2Submit}
              />
            )}
            {step === 3 && (
              <Step3
                repoUrl={repoUrl}
                projectName={projectName}
                scanning={scanning}
                scanId={scanId}
                scanError={scanError}
                onScan={handleRunScan}
                onSkip={handleSkipScan}
              />
            )}
          </div>
        </main>
      </div>
    </>
  );
}

// ─── Step 1: Connect repo ─────────────────────────────────────────────────────

function Step1({
  repoUrl, setRepoUrl, urlError, onNext,
}: {
  repoUrl: string;
  setRepoUrl: (v: string) => void;
  urlError: string | null;
  onNext: () => void;
}) {
  const quickLinks: { label: string; icon: React.ComponentType<{ className?: string }>; url: string }[] = [
    { label: "GitHub", icon: Github, url: "https://github.com/" },
    { label: "Lovable", icon: Globe, url: "https://lovable.dev/" },
    { label: "Replit", icon: Globe, url: "https://replit.com/" },
    { label: "Bolt", icon: Zap, url: "https://bolt.new/" },
  ];

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <p className="text-[10px] font-bold tracking-widest uppercase text-accent-cyan">Step 1 of 3</p>
        <h1 className="text-2xl font-semibold text-foreground">Connect your repository</h1>
        <p className="text-sm text-text-muted leading-relaxed">
          Paste the URL of your GitHub repo or live site. We support any public repository or deployed application.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-[10px] font-bold tracking-widest uppercase text-text-muted">
            Repository or Site URL
          </label>
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onNext()}
            placeholder="https://github.com/you/your-app"
            className={cn(
              "w-full px-4 py-3 bg-surface-1 border rounded-lg text-sm text-foreground placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all",
              urlError ? "border-destructive/60 focus:ring-destructive/30" : "border-border"
            )}
            autoFocus
          />
          {urlError && <p className="text-xs text-destructive">{urlError}</p>}
        </div>

        {/* Platform shortcuts */}
        <div className="space-y-2">
          <p className="text-[10px] text-text-dim uppercase tracking-widest">Quick start</p>
          <div className="grid grid-cols-4 gap-2">
            {quickLinks.map(({ label, icon: Icon, url }) => (
              <button
                key={label}
                type="button"
                onClick={() => setRepoUrl(url)}
                className="flex flex-col items-center gap-1.5 p-3 bg-surface-1 border border-border rounded-lg hover:border-border-subtle hover:bg-surface-2 transition-all group"
              >
                <Icon className="w-4 h-4 text-text-muted group-hover:text-foreground transition-colors" />
                <span className="text-[10px] text-text-dim group-hover:text-text-muted transition-colors">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!repoUrl.trim()}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent-cyan text-background font-bold text-sm tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Step 2: Create project ───────────────────────────────────────────────────

function Step2({
  repoUrl, projectName, setProjectName, platform, setPlatform,
  description, setDescription, creating, createError, onBack, onSubmit,
}: {
  repoUrl: string;
  projectName: string;
  setProjectName: (v: string) => void;
  platform: Platform | "";
  setPlatform: (v: Platform | "") => void;
  description: string;
  setDescription: (v: string) => void;
  creating: boolean;
  createError: string | null;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-7">
      <div className="space-y-2">
        <p className="text-[10px] font-bold tracking-widest uppercase text-accent-cyan">Step 2 of 3</p>
        <h1 className="text-2xl font-semibold text-foreground">Name your project</h1>
        <p className="text-sm text-text-muted">
          Give this project a name so you can find it again. We&apos;ve pre-filled a suggestion from your URL.
        </p>
      </div>

      {/* URL preview */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-surface-1 border border-border rounded-lg">
        <Globe className="w-3.5 h-3.5 text-text-dim flex-shrink-0" />
        <span className="text-xs font-mono text-text-muted truncate">{repoUrl}</span>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold tracking-widest uppercase text-text-muted">Project Name *</label>
          <input
            required
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="My App"
            maxLength={120}
            className="w-full px-4 py-3 bg-surface-1 border border-border rounded-lg text-sm text-foreground placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all"
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold tracking-widest uppercase text-text-muted">Platform</label>
          <div className="grid grid-cols-4 gap-2">
            {(["github", "lovable", "bolt", "cursor", "replit", "v0", "other"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(platform === p ? "" : p)}
                className={cn(
                  "px-3 py-2 rounded-lg border text-[10px] font-bold tracking-widest uppercase transition-all",
                  platform === p
                    ? "bg-accent-cyan/10 border-accent-cyan text-accent-cyan"
                    : "bg-surface-1 border-border text-text-dim hover:border-border-subtle hover:text-text-muted"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold tracking-widest uppercase text-text-muted">
            Description <span className="text-text-dim normal-case font-normal tracking-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Brief description of what this project does…"
            className="w-full px-4 py-3 bg-surface-1 border border-border rounded-lg text-sm text-foreground placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all resize-none"
          />
        </div>

        {createError && (
          <p className="text-xs text-destructive">{createError}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 border border-border rounded-lg text-sm font-medium text-text-muted hover:text-foreground hover:border-border-subtle transition-all"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!projectName.trim() || creating}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-accent-cyan text-background font-bold text-sm tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {creating ? "Creating…" : "Create Project"}
          {!creating && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </form>
  );
}

// ─── Step 3: Run scan ─────────────────────────────────────────────────────────

function Step3({
  repoUrl, projectName, scanning, scanId, scanError, onScan, onSkip,
}: {
  repoUrl: string;
  projectName: string;
  scanning: boolean;
  scanId: string | null;
  scanError: string | null;
  onScan: () => void;
  onSkip: () => void;
}) {
  const SCAN_STEPS = [
    "Cloning source code…",
    "Running AI static analysis…",
    "Probing API endpoints…",
    "Checking authentication flows…",
    "Finalizing security report…",
  ];
  const [visibleStep, setVisibleStep] = useState(0);

  useEffect(() => {
    if (!scanning) { setVisibleStep(0); return; }
    const delays = [0, 1800, 4000, 6500, 8500];
    const timers = delays.map((d, i) => setTimeout(() => setVisibleStep(i + 1), d));
    return () => timers.forEach(clearTimeout);
  }, [scanning]);

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <p className="text-[10px] font-bold tracking-widest uppercase text-accent-cyan">Step 3 of 3</p>
        <h1 className="text-2xl font-semibold text-foreground">Run your first scan</h1>
        <p className="text-sm text-text-muted leading-relaxed">
          Our AI engine will analyze your project for security vulnerabilities and give you a remediation report.
        </p>
      </div>

      {/* Project card */}
      <div className="bg-surface-1 border border-border rounded-xl p-4 space-y-1">
        <p className="text-xs font-semibold text-foreground">{projectName}</p>
        <p className="text-xs font-mono text-text-dim truncate">{repoUrl}</p>
      </div>

      {/* Scan progress terminal */}
      {scanning && (
        <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-accent-green/60" />
            </div>
            <span className="text-[9px] font-mono text-text-dim uppercase tracking-widest">vibecheck.ai.engine</span>
          </div>
          <div className="p-4 space-y-2 font-mono text-xs min-h-[140px]">
            {SCAN_STEPS.map((label, i) => {
              const done = i < visibleStep - 1;
              const active = i === visibleStep - 1;
              const pending = i >= visibleStep;
              return (
                <div key={label} className={cn("flex items-center gap-2 transition-opacity", pending ? "opacity-25" : "opacity-100")}>
                  {done && <CheckCircle2 className="w-3.5 h-3.5 text-accent-green flex-shrink-0" />}
                  {active && <Loader2 className="w-3.5 h-3.5 text-accent-cyan animate-spin flex-shrink-0" />}
                  {pending && <div className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0"><div className="w-1.5 h-1.5 rounded-full bg-text-dim" /></div>}
                  <span className={active ? "text-foreground" : done ? "text-text-muted" : "text-text-dim"}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {scanError && (
        <div className="flex items-start gap-2 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{scanError}</p>
        </div>
      )}

      {!scanning && !scanId && (
        <button
          onClick={onScan}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent-cyan text-background font-bold text-sm tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 transition-all"
        >
          <Shield className="w-4 h-4" />
          Run Security Scan
        </button>
      )}

      {scanning && (
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent-cyan/50 text-background/70 font-bold text-sm tracking-widest uppercase rounded-lg cursor-not-allowed"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          Scanning…
        </button>
      )}

      <button
        onClick={onSkip}
        disabled={scanning}
        className="w-full text-center text-xs text-text-dim hover:text-text-muted transition-colors disabled:opacity-50"
      >
        Skip for now — I&apos;ll scan later
      </button>
    </div>
  );
}
