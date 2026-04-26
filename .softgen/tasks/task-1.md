---
title: Design System & Layout Foundation
status: in_progress
priority: urgent
type: feature
tags: [design, foundation]
created_by: agent
created_at: 2026-04-26T00:30:18Z
position: 1
---

## Notes
Set up the core design system with dark theme colors, typography (Inter + JetBrains Mono), and mobile-responsive layout shell. Includes bottom navigation component.

## Checklist
- [ ] Import Inter and JetBrains Mono fonts from Google Fonts
- [ ] Configure CSS variables in globals.css for all dark theme colors
- [ ] Sync color tokens to tailwind.config.ts
- [ ] Create BottomNav component with 3 tabs: Scan, Reports, Settings
- [ ] Update index.tsx with proper dark theme and mobile meta tags
- [ ] Add mobile viewport configuration and safe area handling

## Acceptance
- Dark theme displays correctly with neon cyan accents
- Inter font for body text, JetBrains Mono for monospace elements
- Bottom navigation renders and switches between tab states