import { SEO } from "@/components/SEO";
import { LandingHeader } from "@/components/LandingHeader";
import { LandingFooter } from "@/components/LandingFooter";
import Link from "next/link";
import { Shield, Zap, Code, Search, CheckCircle2, AlertTriangle, ArrowRight, Github, Terminal, Lock } from "lucide-react";

export default function Home() {
  return (
    <>
      <SEO
        title="vibecheck.dev - AI Security Audits for Vibe-Coded Apps"
        description="Enterprise-grade security audits for AI-generated code. Catch vulnerabilities before deployment with human-verified insights."
      />

      <LandingHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-radial from-accent-cyan/5 via-transparent to-transparent opacity-50" />
        
        <div className="container mx-auto px-4 max-w-6xl relative">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-block px-4 py-2 bg-surface-1 border border-accent-cyan/30 rounded-full">
              <p className="text-[10px] font-bold tracking-widest text-accent-cyan uppercase">
                AI-Powered Security Audits
              </p>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Ship with <span className="text-accent-cyan">confidence</span>.
              <br />
              Not vulnerabilities.
            </h1>

            <p className="text-lg md:text-xl text-text-muted leading-relaxed max-w-2xl mx-auto">
              Enterprise-grade security audits for AI-generated code. Catch SQL injections, XSS, and auth flaws before deployment—with human expert verification.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/app"
                className="px-8 py-4 bg-accent-cyan text-background font-bold text-sm tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 active:scale-[0.98] transition-all inline-flex items-center gap-2"
              >
                Start Free Scan
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="px-8 py-4 bg-surface-1 border border-border text-foreground font-bold text-sm tracking-widest uppercase rounded-lg hover:border-accent-cyan/50 transition-all"
              >
                See How It Works
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="space-y-1">
                <p className="text-2xl font-bold font-mono text-accent-cyan">2,847</p>
                <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">Repos Scanned</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold font-mono text-accent-green">1,293</p>
                <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">Vulnerabilities Found</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold font-mono text-foreground">99.2%</p>
                <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">Accuracy Rate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Example Section */}
      <section className="py-20 bg-surface-1">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <p className="text-[10px] font-bold tracking-widest text-accent-cyan uppercase">
                Real Vulnerabilities Caught
              </p>
              <h2 className="text-3xl md:text-4xl font-bold">
                From risky to secure in <span className="text-accent-cyan">seconds</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Vulnerable Code */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-[10px] font-bold tracking-widest text-destructive uppercase">
                    ❌ Vulnerable
                  </span>
                </div>
                <div className="bg-surface-2 border-2 border-destructive/30 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs font-mono text-foreground">
{`const userId = req.query.id;
const query = 
  "SELECT * FROM users 
   WHERE id = " + userId;
db.query(query);`}
                  </pre>
                </div>
                <p className="text-sm text-text-muted">
                  <span className="text-destructive font-semibold">SQL Injection:</span> User input concatenated directly into query
                </p>
              </div>

              {/* Secure Code */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent-green" />
                  <span className="text-[10px] font-bold tracking-widest text-accent-green uppercase">
                    ✓ Secure
                  </span>
                </div>
                <div className="bg-surface-2 border-2 border-accent-green/30 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs font-mono text-foreground">
{`const userId = req.query.id;
const query = 
  "SELECT * FROM users 
   WHERE id = ?";
db.query(query, [userId]);`}
                  </pre>
                </div>
                <p className="text-sm text-text-muted">
                  <span className="text-accent-green font-semibold">Parameterized:</span> Input properly sanitized with placeholders
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16 space-y-3">
            <p className="text-[10px] font-bold tracking-widest text-accent-cyan uppercase">
              Platform Features
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">
              Built for <span className="text-accent-cyan">modern</span> development
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group bg-surface-1 border border-border rounded-lg p-6 hover:border-accent-cyan/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center mb-4 group-hover:bg-accent-cyan/20 transition-colors">
                <Zap className="w-6 h-6 text-accent-cyan" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-Time Scanning</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                AI engine analyzes your codebase in seconds, identifying vulnerabilities across authentication, data handling, and API endpoints.
              </p>
              <div className="mt-4 pt-4 border-t border-border-subtle">
                <p className="text-[10px] font-bold font-mono tracking-widest text-accent-cyan uppercase">
                  &lt;50ms Response Time
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group bg-surface-1 border border-border rounded-lg p-6 hover:border-accent-cyan/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-accent-green/10 border border-accent-green/30 flex items-center justify-center mb-4 group-hover:bg-accent-green/20 transition-colors">
                <Shield className="w-6 h-6 text-accent-green" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Human Verification</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Expert security engineers review AI findings, providing actionable insights and confirming zero false positives in critical alerts.
              </p>
              <div className="mt-4 pt-4 border-t border-border-subtle">
                <p className="text-[10px] font-bold font-mono tracking-widest text-accent-green uppercase">
                  99.2% Accuracy Rate
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group bg-surface-1 border border-border rounded-lg p-6 hover:border-accent-cyan/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-warning/10 border border-warning/30 flex items-center justify-center mb-4 group-hover:bg-warning/20 transition-colors">
                <Code className="w-6 h-6 text-warning" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Patches</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Get copy-paste code fixes for every vulnerability. Side-by-side comparisons show exactly what changed and why it's secure.
              </p>
              <div className="mt-4 pt-4 border-t border-border-subtle">
                <p className="text-[10px] font-bold font-mono tracking-widest text-warning uppercase">
                  One-Click Copy Patches
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-surface-1">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16 space-y-3">
            <p className="text-[10px] font-bold tracking-widest text-accent-cyan uppercase">
              Simple Process
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">
              Security in <span className="text-accent-cyan">3 steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent-cyan/10 border-2 border-accent-cyan flex items-center justify-center">
                  <span className="text-lg font-bold font-mono text-accent-cyan">1</span>
                </div>
                <h3 className="text-lg font-semibold">Connect Repository</h3>
              </div>
              <p className="text-sm text-text-muted leading-relaxed pl-13">
                Paste your GitHub URL or connect Cursor, Lovable, v0, Bolt, or Replit projects. No code access required.
              </p>
              <div className="mt-4 pl-13">
                <div className="flex items-center gap-2 text-xs text-text-dim font-mono">
                  <Github className="w-3 h-3" />
                  <Terminal className="w-3 h-3" />
                  <Lock className="w-3 h-3" />
                  <span className="text-[10px] uppercase tracking-widest">6 Platforms</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent-cyan/10 border-2 border-accent-cyan flex items-center justify-center">
                  <span className="text-lg font-bold font-mono text-accent-cyan">2</span>
                </div>
                <h3 className="text-lg font-semibold">AI Analysis</h3>
              </div>
              <p className="text-sm text-text-muted leading-relaxed pl-13">
                Our AI engine scans for SQL injection, XSS, auth bypasses, exposed keys, and 50+ vulnerability types in real-time.
              </p>
              <div className="mt-4 pl-13">
                <div className="bg-surface-2 border border-border-subtle rounded p-2 font-mono text-[10px] text-accent-green">
                  <span className="text-text-dim">$</span> Scanning endpoints... <span className="animate-pulse">▊</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent-cyan/10 border-2 border-accent-cyan flex items-center justify-center">
                  <span className="text-lg font-bold font-mono text-accent-cyan">3</span>
                </div>
                <h3 className="text-lg font-semibold">Get Verified Report</h3>
              </div>
              <p className="text-sm text-text-muted leading-relaxed pl-13">
                Receive detailed findings with code patches, severity ratings, and expert notes—all reviewed by human security engineers.
              </p>
              <div className="mt-4 pl-13">
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-destructive/10 border border-destructive/30 rounded text-[9px] font-bold font-mono text-destructive uppercase">
                    2 Critical
                  </div>
                  <div className="px-2 py-1 bg-warning/10 border border-warning/30 rounded text-[9px] font-bold font-mono text-warning uppercase">
                    5 Warnings
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase mb-3">
              Integrations
            </p>
            <h2 className="text-2xl md:text-3xl font-bold">
              Works with your favorite <span className="text-accent-cyan">AI coding tools</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {["GitHub", "Lovable", "Cursor", "v0", "Bolt", "Replit"].map((platform) => (
              <div
                key={platform}
                className="bg-surface-1 border border-border-subtle rounded-lg p-6 flex items-center justify-center hover:border-accent-cyan/30 hover:bg-surface-2 transition-all"
              >
                <span className="text-sm font-mono text-text-muted">{platform}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-surface-1">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16 space-y-3">
            <p className="text-[10px] font-bold tracking-widest text-accent-cyan uppercase">
              Transparent Pricing
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">
              Pay for <span className="text-accent-cyan">scans</span>, not seats
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="bg-background border border-border rounded-lg p-8 space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">Starter</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-mono">$0</span>
                  <span className="text-text-muted text-sm">/month</span>
                </div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
                  <span className="text-text-muted">3 scans per month</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
                  <span className="text-text-muted">AI vulnerability detection</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
                  <span className="text-text-muted">Code patch suggestions</span>
                </li>
              </ul>
              <Link
                href="/app"
                className="block w-full px-6 py-3 bg-surface-1 border border-border text-foreground font-bold text-sm tracking-widest uppercase rounded-lg hover:border-accent-cyan/50 transition-all text-center"
              >
                Start Free
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="bg-background border-2 border-accent-cyan rounded-lg p-8 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-accent-cyan text-background text-[9px] font-bold tracking-widest uppercase">
                Popular
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold tracking-widest text-accent-cyan uppercase">Pro</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-mono text-accent-cyan">$49</span>
                  <span className="text-text-muted text-sm">/month</span>
                </div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
                  <span className="text-foreground font-medium">Unlimited scans</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
                  <span className="text-foreground font-medium">Human expert review</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
                  <span className="text-foreground font-medium">Priority support</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
                  <span className="text-foreground font-medium">API access</span>
                </li>
              </ul>
              <Link
                href="/app"
                className="block w-full px-6 py-3 bg-accent-cyan text-background font-bold text-sm tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 transition-all text-center"
              >
                Get Started
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-background border border-border rounded-lg p-8 space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">Enterprise</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-mono">Custom</span>
                </div>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
                  <span className="text-text-muted">White-label reporting</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
                  <span className="text-text-muted">Dedicated engineer</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
                  <span className="text-text-muted">SLA guarantees</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
                  <span className="text-text-muted">Custom integrations</span>
                </li>
              </ul>
              <a
                href="mailto:enterprise@vibecheck.dev"
                className="block w-full px-6 py-3 bg-surface-1 border border-border text-foreground font-bold text-sm tracking-widest uppercase rounded-lg hover:border-accent-cyan/50 transition-all text-center"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="bg-gradient-to-br from-accent-cyan/10 to-accent-green/10 border border-accent-cyan/30 rounded-2xl p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to secure your <span className="text-accent-cyan">vibe-coded</span> apps?
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Start your first free security audit in under 60 seconds. No credit card required.
            </p>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent-cyan text-background font-bold text-sm tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 active:scale-[0.98] transition-all"
            >
              Launch App Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </>
  );
}