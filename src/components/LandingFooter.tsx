import Link from "next/link";
import { Github, Twitter, Mail } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-surface-1">
      <div className="container mx-auto px-4 max-w-6xl py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              vibecheck<span className="text-accent-cyan">.dev</span>
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              AI-powered security audits for vibe-coded applications.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-center hover:border-accent-cyan hover:text-accent-cyan transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-center hover:border-accent-cyan hover:text-accent-cyan transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="mailto:hello@vibecheck.dev"
                className="w-9 h-9 rounded-lg bg-surface-2 border border-border-subtle flex items-center justify-center hover:border-accent-cyan hover:text-accent-cyan transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">Product</p>
            <div className="space-y-2">
              <Link href="/app" className="block text-sm text-text-muted hover:text-foreground transition-colors">
                Launch App
              </Link>
              <a href="#features" className="block text-sm text-text-muted hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#pricing" className="block text-sm text-text-muted hover:text-foreground transition-colors">
                Pricing
              </a>
              <a href="#" className="block text-sm text-text-muted hover:text-foreground transition-colors">
                Roadmap
              </a>
            </div>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">Resources</p>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-text-muted hover:text-foreground transition-colors">
                Documentation
              </a>
              <a href="#" className="block text-sm text-text-muted hover:text-foreground transition-colors">
                API Reference
              </a>
              <a href="#" className="block text-sm text-text-muted hover:text-foreground transition-colors">
                Security Blog
              </a>
              <a href="#" className="block text-sm text-text-muted hover:text-foreground transition-colors">
                Support
              </a>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">Legal</p>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-text-muted hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="block text-sm text-text-muted hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="#" className="block text-sm text-text-muted hover:text-foreground transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border-subtle flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6 text-xs text-text-dim font-mono">
            <span>VERSION 1.0.0</span>
            <span>•</span>
            <span>99.9% UPTIME</span>
            <span>•</span>
            <span className="text-accent-green">ALL SYSTEMS OPERATIONAL</span>
          </div>
          <p className="text-xs text-text-dim">
            © 2026 vibecheck.dev. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}