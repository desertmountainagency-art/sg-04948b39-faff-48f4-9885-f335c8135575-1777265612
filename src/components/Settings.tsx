import { useState, useEffect } from "react";
import { Bell, Shield, Zap, Mail, Key, User, ChevronRight, Check, Eye, EyeOff, Copy } from "lucide-react";

interface UserSettings {
  profile: {
    name: string;
    email: string;
    apiKey: string;
  };
  notifications: {
    pushEnabled: boolean;
    criticalAlerts: boolean;
    weeklyDigest: boolean;
  };
  scanPreferences: {
    autoScan: boolean;
    deepAnalysis: boolean;
  };
}

const defaultSettings: UserSettings = {
  profile: {
    name: "",
    email: "",
    apiKey: "",
  },
  notifications: {
    pushEnabled: true,
    criticalAlerts: true,
    weeklyDigest: false,
  },
  scanPreferences: {
    autoScan: false,
    deepAnalysis: true,
  },
};

export function Settings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("vibecheck-settings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    localStorage.setItem("vibecheck-settings", JSON.stringify(newSettings));
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 300);
  };

  const handleProfileUpdate = (field: keyof UserSettings["profile"], value: string) => {
    const newSettings = {
      ...settings,
      profile: { ...settings.profile, [field]: value },
    };
    saveSettings(newSettings);
  };

  const handleToggle = (section: "notifications" | "scanPreferences", field: string) => {
    const newSettings = {
      ...settings,
      [section]: { ...settings[section], [field]: !settings[section][field as keyof typeof settings[typeof section]] },
    };
    saveSettings(newSettings);
  };

  const handleCopyApiKey = () => {
    if (settings.profile.apiKey) {
      navigator.clipboard.writeText(settings.profile.apiKey);
      setCopiedApiKey(true);
      setTimeout(() => setCopiedApiKey(false), 2000);
    }
  };

  const generateApiKey = () => {
    const key = `vck_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    handleProfileUpdate("apiKey", key);
  };

  return (
    <div className="space-y-6">
      {/* Header with Save Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold tracking-widest uppercase text-foreground">
            Settings
          </h2>
          <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase mt-1">
            User Preferences
          </p>
        </div>
        {saveStatus === "saved" && (
          <div className="flex items-center gap-1.5 text-accent-green">
            <Check className="w-4 h-4" />
            <span className="text-xs font-mono">Saved</span>
          </div>
        )}
      </div>

      {/* Profile Section */}
      <div className="bg-surface-1 border border-border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-accent-cyan" />
            <span className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
              Account
            </span>
          </div>
          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="text-xs text-accent-cyan hover:text-accent-cyan/80 transition-colors font-mono"
          >
            {isEditingProfile ? "Done" : "Edit"}
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold tracking-widest text-text-muted uppercase block">
              Name
            </label>
            <input
              type="text"
              value={settings.profile.name}
              onChange={(e) => handleProfileUpdate("name", e.target.value)}
              placeholder="Your name"
              disabled={!isEditingProfile}
              className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded text-sm text-foreground placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold tracking-widest text-text-muted uppercase block">
              Email
            </label>
            <input
              type="email"
              value={settings.profile.email}
              onChange={(e) => handleProfileUpdate("email", e.target.value)}
              placeholder="your@email.com"
              disabled={!isEditingProfile}
              className="w-full px-3 py-2 bg-surface-2 border border-border-subtle rounded text-sm text-foreground placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-bold tracking-widest text-text-muted uppercase">
                API Key
              </label>
              {settings.profile.apiKey && (
                <button
                  onClick={handleCopyApiKey}
                  className="flex items-center gap-1 text-[9px] font-mono text-accent-cyan hover:text-accent-cyan/80 transition-colors"
                >
                  {copiedApiKey ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={settings.profile.apiKey}
                  placeholder="No API key set"
                  readOnly
                  className="w-full px-3 py-2 pr-10 bg-surface-2 border border-border-subtle rounded text-xs font-mono text-foreground placeholder:text-text-dim cursor-default"
                />
                {settings.profile.apiKey && (
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground transition-colors"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <button
                onClick={generateApiKey}
                className="px-3 py-2 bg-accent-cyan text-background text-xs font-bold tracking-wider uppercase rounded hover:bg-accent-cyan/90 active:scale-[0.98] transition-all whitespace-nowrap"
              >
                {settings.profile.apiKey ? "Rotate" : "Generate"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-surface-1 border border-border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
          <Bell className="w-4 h-4 text-accent-cyan" />
          <span className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
            Notifications
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Push Notifications</p>
              <p className="text-xs text-text-muted mt-0.5">Receive mobile notifications</p>
            </div>
            <button
              onClick={() => handleToggle("notifications", "pushEnabled")}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.notifications.pushEnabled ? "bg-accent-cyan" : "bg-surface-2 border border-border-subtle"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-background transition-transform ${
                  settings.notifications.pushEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Critical Alerts</p>
              <p className="text-xs text-text-muted mt-0.5">Notify for high-severity findings</p>
            </div>
            <button
              onClick={() => handleToggle("notifications", "criticalAlerts")}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.notifications.criticalAlerts ? "bg-accent-cyan" : "bg-surface-2 border border-border-subtle"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-background transition-transform ${
                  settings.notifications.criticalAlerts ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Weekly Digest</p>
              <p className="text-xs text-text-muted mt-0.5">Summary of all scans</p>
            </div>
            <button
              onClick={() => handleToggle("notifications", "weeklyDigest")}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.notifications.weeklyDigest ? "bg-accent-cyan" : "bg-surface-2 border border-border-subtle"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-background transition-transform ${
                  settings.notifications.weeklyDigest ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Scan Preferences */}
      <div className="bg-surface-1 border border-border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
          <Shield className="w-4 h-4 text-accent-cyan" />
          <span className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
            Scan Preferences
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Auto-Scan on Git Push</p>
              <p className="text-xs text-text-muted mt-0.5">Trigger scans automatically</p>
            </div>
            <button
              onClick={() => handleToggle("scanPreferences", "autoScan")}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.scanPreferences.autoScan ? "bg-accent-cyan" : "bg-surface-2 border border-border-subtle"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-background transition-transform ${
                  settings.scanPreferences.autoScan ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Deep Analysis Mode</p>
              <p className="text-xs text-text-muted mt-0.5">Extended security checks</p>
            </div>
            <button
              onClick={() => handleToggle("scanPreferences", "deepAnalysis")}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.scanPreferences.deepAnalysis ? "bg-accent-cyan" : "bg-surface-2 border border-border-subtle"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-background transition-transform ${
                  settings.scanPreferences.deepAnalysis ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-surface-1 border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
          <Zap className="w-4 h-4 text-accent-cyan" />
          <span className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
            App Info
          </span>
        </div>

        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-text-muted">Version</span>
          <span className="text-sm font-mono text-foreground">1.0.0</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-text-muted">Build</span>
          <span className="text-sm font-mono text-foreground">2026.04.27</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 pb-2">
        <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest">
          © 2026 vibecheck.dev
        </p>
      </div>
    </div>
  );
}