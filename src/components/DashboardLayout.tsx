import Link from "next/link";
import { useRouter } from "next/router";
import { Shield, LayoutDashboard, FolderOpen, Settings, LogOut, ChevronRight, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import { useOnboarding } from "@/hooks/use-onboarding";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/projects", label: "Projects", icon: FolderOpen },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function DashboardLayout({ children, breadcrumbs }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { plan, isPro } = useSubscription();
  const { completed, loading: onboardingLoading } = useOnboarding();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Gate: send users who haven't finished onboarding back to the wizard
  useEffect(() => {
    if (onboardingLoading) return;
    if (completed === false) router.replace("/onboarding");
  }, [completed, onboardingLoading, router]);

  const isActive = (item: NavItem) =>
    item.exact
      ? router.pathname === item.href
      : router.pathname === item.href || router.pathname.startsWith(item.href + "/");

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={cn(
        "flex flex-col bg-surface-1 border-r border-border",
        mobile ? "w-full h-full" : "w-56 shrink-0"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-md bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center group-hover:bg-accent-cyan/20 transition-colors">
            <Shield className="w-4 h-4 text-accent-cyan" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold">
            vibecheck<span className="text-accent-cyan">.dev</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20"
                  : "text-text-muted hover:text-foreground hover:bg-surface-2"
              )}
            >
              <item.icon className={cn("w-4 h-4", active ? "text-accent-cyan" : "text-text-muted")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border space-y-2">
        {/* Plan badge */}
        <div className="px-3 py-2 bg-surface-2 rounded-lg flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest uppercase text-text-muted">Plan</span>
          <span className={cn(
            "text-[10px] font-bold tracking-widest uppercase",
            isPro ? "text-accent-cyan" : "text-text-dim"
          )}>
            {plan}
          </span>
        </div>

        <Link
          href="/app"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-foreground hover:bg-surface-2 transition-all"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-destructive hover:bg-surface-2 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>

        {user && (
          <p className="px-3 text-[10px] text-text-dim truncate">{user.email}</p>
        )}
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="w-64 h-full">
            <Sidebar mobile />
          </div>
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-surface-1 flex items-center px-4 gap-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 text-text-muted hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1.5 text-xs min-w-0">
              {breadcrumbs.map((crumb, i) => (
                <div key={i} className="flex items-center gap-1.5 min-w-0">
                  {i > 0 && <ChevronRight className="w-3 h-3 text-text-dim flex-shrink-0" />}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-text-muted hover:text-foreground transition-colors truncate"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-foreground font-medium truncate">{crumb.label}</span>
                  )}
                </div>
              ))}
            </nav>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}