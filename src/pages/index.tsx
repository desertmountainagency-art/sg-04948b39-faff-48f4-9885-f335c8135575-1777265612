"use client";

import { useState } from "react";
import { SEO } from "@/components/SEO";
import { BottomNav } from "@/components/BottomNav";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"scan" | "reports" | "settings">("scan");

  return (
    <>
      <SEO
        title="vibecheck.dev - AI Security Audits for Vibe-Coded Apps"
        description="Mobile companion for AI-powered security audits. Scan your Cursor, Lovable, or v0 projects for vulnerabilities."
      />
      
      <div className="min-h-screen bg-background pb-16">
        <main className="container py-8">
          {activeTab === "scan" && (
            <div className="space-y-8">
              {/* Logo */}
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-semibold">
                  vibecheck<span className="text-accent-cyan">.dev</span>
                </h1>
                <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
                  AI Security Audits
                </p>
              </div>

              {/* Hero */}
              <div className="space-y-3">
                <h2 className="text-sm font-bold tracking-widest uppercase text-foreground">
                  Connect your project
                </h2>
                <p className="text-sm text-text-muted leading-relaxed">
                  Paste your repository URL or live site to scan for vulnerabilities in AI-generated code.
                </p>
              </div>

              {/* Input Form */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Repository or live URL..."
                  className="w-full px-4 py-3 bg-surface-1 border border-border rounded-lg text-sm text-foreground placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all"
                />
                <button className="w-full px-6 py-3 bg-accent-cyan text-background font-bold text-sm tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 active:scale-[0.98] transition-all">
                  SCAN
                </button>
              </div>

              {/* Integrations */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
                  Supported Platforms
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {["GitHub", "Lovable", "Replit", "Bolt", "Cursor", "v0"].map((platform) => (
                    <div
                      key={platform}
                      className="px-3 py-2 bg-surface-1 border border-border-subtle rounded text-center text-xs font-mono text-text-muted"
                    >
                      {platform}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "reports" && (
            <div className="text-center py-16 space-y-2">
              <p className="text-sm text-text-muted">No scans yet</p>
              <p className="text-[10px] text-text-dim uppercase tracking-widest">Start your first audit</p>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="text-center py-16 space-y-2">
              <p className="text-sm text-text-muted">Settings</p>
              <p className="text-[10px] text-text-dim uppercase tracking-widest">Coming soon</p>
            </div>
          )}
        </main>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </>
  );
}