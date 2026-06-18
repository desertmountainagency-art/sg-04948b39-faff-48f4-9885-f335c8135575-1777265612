import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("bg-surface-2 rounded animate-pulse", className)} />;
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Bone className="h-7 w-32" />
          <Bone className="h-4 w-48" />
        </div>
        <Bone className="h-9 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface-1 border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Bone className="h-3 w-16" />
              <Bone className="h-3.5 w-3.5 rounded-full" />
            </div>
            <Bone className="h-8 w-12" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Bone className="h-3 w-24" />
          <Bone className="h-3 w-16" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface-1 border border-border rounded-lg px-4 py-3 flex items-center gap-4">
            <Bone className="w-2 h-2 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Bone className="h-3 w-48" />
              <Bone className="h-2.5 w-32" />
            </div>
            <Bone className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Bone className="h-7 w-28" />
          <Bone className="h-4 w-20" />
        </div>
        <Bone className="h-9 w-32 rounded-lg" />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-surface-1 border border-border rounded-xl p-5">
          <div className="flex items-start gap-4">
            <Bone className="w-9 h-9 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-40" />
              <Bone className="h-3 w-64" />
              <Bone className="h-3 w-24" />
            </div>
            <Bone className="h-3.5 w-3.5 rounded flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Bone className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Bone className="h-6 w-40" />
            <Bone className="h-3 w-56" />
          </div>
        </div>
        <Bone className="h-9 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface-1 border-2 border-border rounded-lg p-4 space-y-2">
            <Bone className="w-4 h-4 rounded mx-auto" />
            <Bone className="h-8 w-12 mx-auto" />
            <Bone className="h-2.5 w-16 mx-auto" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <Bone className="h-3 w-24" />
        <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
              <Bone className="h-3 w-28" />
              <Bone className="h-3 w-32 hidden sm:block" />
              <Bone className="h-3 w-8 ml-auto" />
              <Bone className="h-3 w-8 hidden sm:block" />
              <Bone className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ScanDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Bone className="h-3 w-24" />
        <Bone className="h-8 w-56" />
        <div className="flex items-center gap-4">
          <Bone className="h-3 w-36" />
          <Bone className="h-3 w-36" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface-1 border-2 border-border rounded-xl p-4 space-y-2">
            <Bone className="w-4 h-4 rounded mx-auto" />
            <Bone className="h-8 w-12 mx-auto" />
            <Bone className="h-2.5 w-16 mx-auto" />
          </div>
        ))}
      </div>
      <div className="bg-surface-1 border-2 border-border rounded-xl p-5 flex items-center gap-4">
        <Bone className="w-14 h-14 rounded-full flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <Bone className="h-3 w-24" />
          <Bone className="h-5 w-40" />
          <Bone className="h-3 w-64" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Bone className="h-3 w-32" />
          <div className="flex gap-2">
            <Bone className="h-6 w-16 rounded-full" />
            <Bone className="h-6 w-20 rounded-full" />
            <Bone className="h-6 w-24 rounded-full" />
          </div>
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface-1 border-2 border-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <Bone className="h-5 w-16 rounded" />
              <Bone className="h-3 w-16" />
              <Bone className="h-4 w-48 ml-2 flex-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OnboardingSkeleton() {
  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <Bone className="h-3 w-20" />
        <Bone className="h-7 w-56" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-3/4" />
      </div>
      <div className="space-y-4">
        <Bone className="h-12 w-full rounded-lg" />
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => <Bone key={i} className="h-16 rounded-lg" />)}
        </div>
      </div>
      <Bone className="h-12 w-full rounded-lg" />
    </div>
  );
}

/** Generic inline error banner — use inside a page when a data fetch fails */
export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-4 bg-destructive/10 border border-destructive/30 rounded-xl">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-destructive font-medium">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex-shrink-0 text-[10px] font-bold tracking-widest uppercase text-destructive border border-destructive/30 px-2.5 py-1 rounded hover:bg-destructive/10 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}
