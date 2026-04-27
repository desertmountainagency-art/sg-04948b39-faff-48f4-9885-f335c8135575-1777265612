import Link from "next/link";
import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center group-hover:bg-accent-cyan/20 transition-colors">
              <Shield className="w-5 h-5 text-accent-cyan" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-semibold">
              vibecheck<span className="text-accent-cyan">.dev</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[11px] font-bold tracking-widest text-text-muted hover:text-foreground uppercase transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-[11px] font-bold tracking-widest text-text-muted hover:text-foreground uppercase transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="text-[11px] font-bold tracking-widest text-text-muted hover:text-foreground uppercase transition-colors">
              Pricing
            </a>
            <Link
              href="/app"
              className="px-5 py-2 bg-accent-cyan text-background font-bold text-[11px] tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 transition-all"
            >
              Launch App
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-foreground hover:text-accent-cyan transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 py-4 space-y-4">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold tracking-widest text-text-muted hover:text-foreground uppercase transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold tracking-widest text-text-muted hover:text-foreground uppercase transition-colors"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold tracking-widest text-text-muted hover:text-foreground uppercase transition-colors"
            >
              Pricing
            </a>
            <Link
              href="/app"
              className="block w-full px-5 py-3 bg-accent-cyan text-background font-bold text-sm tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 transition-all text-center"
            >
              Launch App
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}