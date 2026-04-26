---
title: Finding Details - Vulnerability Explorer
status: done
priority: medium
type: feature
tags: [findings, remediation]
created_by: agent
created_at: 2026-04-26T00:30:18Z
position: 5
---

## Notes
Scrollable list of specific vulnerabilities with severity badges, plain-English descriptions, and code patch blocks showing vulnerable vs. secure code with copy button.

## Checklist
- [ ] Create FindingCard component with severity border coloring (red/orange)
- [ ] Add severity badge display (CRITICAL, WARNING, INFO)
- [ ] Build description section with risk explanation in plain language
- [ ] Create CodePatchBlock with horizontal scroll, red "Vulnerable" and green "Secure" sections
- [ ] Add "Copy Patch" button with clipboard functionality
- [ ] Display 5-8 mock findings covering common issues: SQL injection, XSS, exposed API keys, weak auth

## Acceptance
- Findings list scrolls vertically on mobile
- Code blocks scroll horizontally without breaking layout
- Copy button successfully copies patch to clipboard
- Severity colors match design system (red/orange borders)