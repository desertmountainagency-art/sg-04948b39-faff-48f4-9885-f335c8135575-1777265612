import { useState } from "react";
import { Bell, Shield, Zap, Mail, Key, User, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
        {title}
      </h3>
      <div className="bg-surface-1 border border-border rounded-lg divide-y divide-border-subtle">
        {children}
      </div>
    </div>
  );
}

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

function ToggleRow({ icon, label, description, enabled, onToggle }: ToggleRowProps) {
  return (
    <div className="p-4 flex items-center gap-3">
      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded bg-surface-2">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={cn(
          "w-11 h-6 rounded-full transition-colors relative flex-shrink-0",
          enabled ? "bg-accent-cyan" : "bg-surface-2"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-5 h-5 rounded-full bg-background transition-transform",
            enabled ? "left-[22px]" : "left-0.5"
          )}
        />
      </button>
    </div>
  );
}

interface ActionRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}

function ActionRow({ icon, label, description, onClick }: ActionRowProps) {
  return (
    <button
      onClick={onClick}
      className="p-4 flex items-center gap-3 w-full text-left hover:bg-surface-2 transition-colors active:scale-[0.99]"
    >
      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded bg-surface-2">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-text-dim flex-shrink-0" />
    </button>
  );
}

export function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [autoScan, setAutoScan] = useState(false);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
          Preferences & Configuration
        </p>
      </div>

      {/* Account Section */}
      <SettingsSection title="Account">
        <ActionRow
          icon={<User className="w-4 h-4 text-accent-cyan" />}
          label="Profile"
          description="Manage your account details"
          onClick={() => alert("Profile settings coming soon")}
        />
        <ActionRow
          icon={<Key className="w-4 h-4 text-accent-cyan" />}
          label="API Keys"
          description="Manage integration tokens"
          onClick={() => alert("API key management coming soon")}
        />
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection title="Notifications">
        <ToggleRow
          icon={<Bell className="w-4 h-4 text-accent-cyan" />}
          label="Push Notifications"
          description="Get notified when scans complete"
          enabled={notifications}
          onToggle={() => setNotifications(!notifications)}
        />
        <ToggleRow
          icon={<Shield className="w-4 h-4 text-destructive" />}
          label="Critical Alerts"
          description="Instant alerts for critical vulnerabilities"
          enabled={criticalAlerts}
          onToggle={() => setCriticalAlerts(!criticalAlerts)}
        />
        <ToggleRow
          icon={<Mail className="w-4 h-4 text-accent-cyan" />}
          label="Weekly Digest"
          description="Email summary of all scans"
          enabled={weeklyDigest}
          onToggle={() => setWeeklyDigest(!weeklyDigest)}
        />
      </SettingsSection>

      {/* Scan Preferences */}
      <SettingsSection title="Scan Preferences">
        <ToggleRow
          icon={<Zap className="w-4 h-4 text-warning" />}
          label="Auto-Scan"
          description="Automatically scan on git push"
          enabled={autoScan}
          onToggle={() => setAutoScan(!autoScan)}
        />
        <ActionRow
          icon={<Shield className="w-4 h-4 text-accent-cyan" />}
          label="Scan Configuration"
          description="Customize security checks"
          onClick={() => alert("Scan configuration coming soon")}
        />
      </SettingsSection>

      {/* App Info */}
      <div className="pt-4 space-y-2 text-center">
        <p className="text-xs text-text-muted">vibecheck.dev Mobile Companion</p>
        <p className="text-[10px] font-mono text-text-dim">Version 1.0.0-beta</p>
        <p className="text-[9px] text-text-dim uppercase tracking-widest">
          © 2026 vibecheck.dev
        </p>
      </div>
    </div>
  );
}