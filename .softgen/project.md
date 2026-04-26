# vibecheck.dev Mobile Companion

## Vision
A mobile-optimized security audit companion for developers using AI code-generation tools (Cursor, Lovable, v0). Users paste repository links, view real-time scanning progress, and review detailed vulnerability reports with expert human verification notes.

## Design
Dark mode only. Technical, serious, highly polished aesthetic — "hackable but professional."

Colors (HSL):
- `--background: 0 0% 4% (deepest black #0A0A0A)`
- `--surface-1: 0 0% 5% (dark grey #0C0C0C)`
- `--surface-2: 0 0% 7% (lighter grey #111111)`
- `--border: 0 0% 13% (#222222)`
- `--border-subtle: 0 0% 20% (#333333)`
- `--foreground: 0 0% 88% (light grey #E0E0E0)`
- `--muted-foreground: 0 0% 53% (#888888)`
- `--dim-foreground: 0 0% 33% (#555555)`
- `--accent-cyan: 186 100% 50% (neon cyan #00F0FF)`
- `--accent-green: 154 100% 50% (neon green #00FF94)`
- `--destructive: 0 100% 65% (neon red #FF4E4E)`
- `--warning: 38 100% 50% (neon orange #FF9F00)`

Typography:
- Headers/Body: Inter (sans-serif, clean)
- Monospace/Data: JetBrains Mono (audit IDs, code blocks, labels)

Style direction: Heavy use of small (10-11px), bold, uppercase text with wide letter-spacing for labels and metadata. Dark cards with subtle borders. Neon accent highlights on interactive elements.

## Features
- **Scan Launcher**: Repository URL input, one-tap scan initiation, platform integrations display
- **Live Progress**: Terminal-style progress view with animated scanning steps
- **Report Dashboard**: Severity metrics, vibe badge status, expert security review notes
- **Findings Explorer**: Detailed vulnerability list with code patches and remediation guidance
- **Mobile Navigation**: Bottom tab bar for quick screen switching