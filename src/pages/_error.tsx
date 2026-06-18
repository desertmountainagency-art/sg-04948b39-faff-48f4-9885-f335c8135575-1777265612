import type { NextPageContext } from "next";
import Link from "next/link";
import { Shield, RefreshCw } from "lucide-react";

interface ErrorProps {
  statusCode?: number;
}

export default function ErrorPage({ statusCode }: ErrorProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold tracking-widest uppercase text-destructive">
            {statusCode ? `Error ${statusCode}` : "Client Error"}
          </p>
          <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
          <p className="text-sm text-text-muted leading-relaxed">
            {statusCode === 500
              ? "An internal server error occurred. Our team has been notified."
              : statusCode === 404
                ? "The page you're looking for doesn't exist."
                : "An unexpected error occurred. Please try again."}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-accent-cyan text-background font-bold text-xs tracking-widest uppercase rounded-lg hover:bg-accent-cyan/90 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full px-5 py-3 border border-border rounded-lg text-sm font-medium text-text-muted hover:text-foreground hover:border-border-subtle transition-all"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};
