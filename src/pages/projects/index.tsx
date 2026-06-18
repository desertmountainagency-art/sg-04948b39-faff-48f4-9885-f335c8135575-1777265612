import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Plus, FolderOpen, AlertTriangle, CheckCircle2, ChevronRight,
  Loader2, X, Github, Globe
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const PLATFORMS = ["github", "lovable", "replit", "bolt", "cursor", "v0", "other"] as const;
type Platform = (typeof PLATFORMS)[number];

interface Project {
  id: string;
  name: string;
  repository_url: string;
  platform: Platform | null;
  description: string | null;
  created_at: string;
  last_scan?: {
    status: string;
    critical_count: number;
    warning_count: number;
    completed_at: string | null;
  } | null;
}

export default function Projects() {
  const { user, session, loading: authLoading } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const platformRef = useRef<HTMLSelectElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth?redirectTo=/projects"); return; }
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  async function fetchProjects() {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from("projects")
      .select("id, name, repository_url, platform, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    // Fetch last scan for each project in a single query
    const projectIds = data.map((p) => p.id);
    const { data: scans } = await supabase
      .from("scans")
      .select("project_id, status, critical_count, warning_count, completed_at, created_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false });

    // Group: keep most recent scan per project
    const latestByProject = new Map<string, typeof scans extends (infer T)[] | null ? T : never>();
    for (const scan of scans ?? []) {
      if (!scan.project_id) continue;
      if (!latestByProject.has(scan.project_id)) {
        latestByProject.set(scan.project_id, scan);
      }
    }

    setProjects(
      data.map((p) => ({
        ...p,
        platform: p.platform as Platform | null,
        last_scan: latestByProject.get(p.id) ?? null,
      }))
    );
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.access_token) return;
    setCreating(true);
    setFormError(null);

    const body = {
      name: nameRef.current?.value.trim(),
      repositoryUrl: urlRef.current?.value.trim(),
      platform: platformRef.current?.value || undefined,
      description: descRef.current?.value.trim() || undefined,
    };

    const res = await fetch("/api/projects/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    setCreating(false);

    if (!res.ok) {
      setFormError(json.error ?? "Failed to create project");
      return;
    }

    setShowForm(false);
    router.push(`/projects/${json.project.id}`);
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const platformIcon = (p: Platform | null) => {
    if (p === "github") return <Github className="w-3.5 h-3.5 text-text-muted" />;
    return <Globe className="w-3.5 h-3.5 text-text-muted" />;
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout breadcrumbs={[{ label: "Projects" }]}>
        <ProjectsSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbs={[{ label: "Projects" }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Projects</h1>
            <p className="text-sm text-text-muted mt-1">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setFormError(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-accent-cyan text-background text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Project
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-surface-1 border border-accent-cyan/30 rounded-xl p-5 space-y-4 relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 p-1 text-text-muted hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-sm font-bold tracking-widest uppercase text-foreground">New Project</h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-text-muted">Project Name *</label>
                  <input
                    ref={nameRef}
                    required
                    placeholder="My App"
                    maxLength={120}
                    className="w-full px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-foreground placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-text-muted">Platform</label>
                  <select
                    ref={platformRef}
                    className="w-full px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all"
                  >
                    <option value="">Select platform…</option>
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-text-muted">Repository / Site URL *</label>
                <input
                  ref={urlRef}
                  required
                  type="url"
                  placeholder="https://github.com/you/repo"
                  className="w-full px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-foreground placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest uppercase text-text-muted">Description</label>
                <textarea
                  ref={descRef}
                  rows={2}
                  placeholder="Optional — brief project description"
                  maxLength={500}
                  className="w-full px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-foreground placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all resize-none"
                />
              </div>

              {formError && (
                <p className="text-xs text-destructive">{formError}</p>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-accent-cyan text-background text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 transition-all disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 border border-border rounded-lg text-xs font-bold tracking-widest uppercase text-text-muted hover:text-foreground hover:border-border-subtle transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Project list */}
        {projects.length === 0 && !showForm ? (
          <EmptyProjects onNew={() => setShowForm(true)} />
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block bg-surface-1 border border-border rounded-xl p-5 hover:border-border-subtle transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center flex-shrink-0">
                    {platformIcon(project.platform)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-accent-cyan transition-colors">
                        {project.name}
                      </h3>
                      {project.platform && (
                        <span className="text-[9px] font-bold tracking-widest uppercase text-text-dim bg-surface-2 px-1.5 py-0.5 rounded">
                          {project.platform}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-dim font-mono truncate">{project.repository_url}</p>
                    {project.description && (
                      <p className="text-xs text-text-muted">{project.description}</p>
                    )}
                    <p className="text-[10px] text-text-dim">Created {formatDate(project.created_at)}</p>
                  </div>

                  {/* Last scan badge */}
                  <div className="shrink-0 text-right space-y-1">
                    {project.last_scan ? (
                      <>
                        {project.last_scan.status === "completed" && (
                          <div className="flex items-center gap-2 justify-end">
                            {project.last_scan.critical_count > 0 ? (
                              <span className="flex items-center gap-1 text-[10px] font-mono text-destructive">
                                <AlertTriangle className="w-3 h-3" />
                                {project.last_scan.critical_count} crit
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-mono text-accent-green">
                                <CheckCircle2 className="w-3 h-3" />
                                Clean
                              </span>
                            )}
                          </div>
                        )}
                        <p className={cn(
                          "text-[10px] font-bold tracking-widest uppercase",
                          project.last_scan.status === "completed" ? "text-accent-green" :
                          project.last_scan.status === "failed" ? "text-destructive" :
                          "text-accent-cyan"
                        )}>
                          {project.last_scan.status}
                        </p>
                      </>
                    ) : (
                      <p className="text-[10px] text-text-dim uppercase tracking-widest">No scans</p>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-text-dim group-hover:text-accent-cyan transition-colors flex-shrink-0 mt-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function EmptyProjects({ onNew }: { onNew: () => void }) {
  return (
    <div className="bg-surface-1 border border-border rounded-xl p-12 text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center mx-auto">
        <FolderOpen className="w-7 h-7 text-text-dim" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">No projects yet</p>
        <p className="text-xs text-text-muted mt-1">Add a repository or live site to start scanning.</p>
      </div>
      <button
        onClick={onNew}
        className="inline-flex items-center gap-2 px-4 py-2 bg-accent-cyan text-background text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        New Project
      </button>
    </div>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-32 bg-surface-2 rounded" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 bg-surface-1 border border-border rounded-xl" />
      ))}
    </div>
  );
}
