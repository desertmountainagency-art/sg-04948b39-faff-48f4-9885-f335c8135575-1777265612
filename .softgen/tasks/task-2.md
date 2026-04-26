---
title: Home Screen - Scan Launcher
status: done
priority: high
type: feature
tags: [home, input]
created_by: agent
created_at: 2026-04-26T00:30:18Z
position: 2
---

## Notes
Primary landing screen where users paste repository URLs and initiate scans. Shows vibecheck.dev branding, input field with scan button, and supported platform integrations grid.

## Checklist
- [ ] Create ScanLauncher component with hero heading and description
- [ ] Build RepositoryInput component with text field and SCAN button
- [ ] Create IntegrationGrid showing 5 platforms: GitHub, Lovable, Replit, Bolt, Cursor
- [ ] Add touch-optimized input states and button feedback
- [ ] Implement mock scan initiation that transitions to progress view

## Acceptance
- Logo and "Connect your project" heading display with proper styling
- Input field accepts URLs and enables scan button
- Integration logos display in grid/horizontal scroll