/**
 * Plain-HTML email templates for vibecheck.dev transactional emails.
 *
 * Each template returns { subject, html, text } so the caller can send
 * both MIME parts and a plain-text fallback in a single send call.
 */

const BRAND_CYAN = "#00f0ff";
const BRAND_BG = "#0a0a0a";
const BRAND_SURFACE = "#0d0d0d";
const BRAND_BORDER = "#222";
const BRAND_TEXT = "#e0e0e0";
const BRAND_MUTED = "#888";
const BRAND_RED = "#ff4d4d";
const BRAND_GREEN = "#00ff9d";
const BRAND_YELLOW = "#ff9900";

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>vibecheck.dev</title>
</head>
<body style="margin:0;padding:0;background:${BRAND_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${BRAND_TEXT};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_BG};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:${BRAND_SURFACE};border:1px solid ${BRAND_BORDER};border-radius:8px;padding:8px 12px;">
                    <span style="font-size:14px;font-weight:600;color:${BRAND_TEXT};">vibecheck<span style="color:${BRAND_CYAN};">.dev</span></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:${BRAND_SURFACE};border:1px solid ${BRAND_BORDER};border-radius:12px;padding:32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:11px;color:${BRAND_MUTED};letter-spacing:0.05em;">
                You're receiving this because you have a vibecheck.dev account.<br/>
                &copy; ${new Date().getFullYear()} vibecheck.dev — All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function label(text: string, color = BRAND_MUTED): string {
  return `<p style="margin:0 0 4px;font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${color};">${text}</p>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${BRAND_TEXT};">${text}</h1>`;
}

function para(text: string): string {
  return `<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${BRAND_MUTED};">${text}</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid ${BRAND_BORDER};margin:20px 0;" />`;
}

function statRow(label: string, value: string, color = BRAND_TEXT): string {
  return `<tr>
    <td style="padding:8px 0;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND_MUTED};">${label}</td>
    <td style="padding:8px 0;font-size:13px;font-family:monospace;color:${color};text-align:right;">${value}</td>
  </tr>`;
}

function ctaButton(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:8px;padding:12px 24px;background:${BRAND_CYAN};color:${BRAND_BG};font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;border-radius:8px;">${text}</a>`;
}

// ─── Scan Completed ───────────────────────────────────────────────────────────

export interface ScanCompletedParams {
  userEmail: string;
  targetUrl: string;
  auditId: string;
  criticalCount: number;
  warningCount: number;
  passedCount: number;
  scanReportUrl: string;
}

export function scanCompletedTemplate(p: ScanCompletedParams): { subject: string; html: string; text: string } {
  const hasCritical = p.criticalCount > 0;
  const statusColor = hasCritical ? BRAND_RED : BRAND_GREEN;
  const statusText = hasCritical ? "Action Required" : "Vibe Checked ✓";

  const html = baseLayout(`
    ${label("Security Audit Complete", statusColor)}
    ${heading(statusText)}
    ${para(`Your security scan of <strong style="color:${BRAND_TEXT};font-family:monospace;">${p.targetUrl}</strong> has finished.`)}

    ${divider()}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${statRow("Audit ID", p.auditId)}
      ${statRow("Critical", String(p.criticalCount), p.criticalCount > 0 ? BRAND_RED : BRAND_TEXT)}
      ${statRow("Warnings", String(p.warningCount), p.warningCount > 0 ? BRAND_YELLOW : BRAND_TEXT)}
      ${statRow("Passed Checks", String(p.passedCount), BRAND_GREEN)}
    </table>

    ${hasCritical
      ? para(`<strong style="color:${BRAND_RED};">${p.criticalCount} critical ${p.criticalCount === 1 ? "vulnerability" : "vulnerabilities"}</strong> need your immediate attention. Review the full report and apply the suggested patches.`)
      : para("No critical vulnerabilities were found. Your project is in good shape — keep scanning regularly to stay ahead of new threats.")
    }

    ${ctaButton("View Full Report", p.scanReportUrl)}
  `);

  const text = [
    `vibecheck.dev — Security Audit Complete`,
    ``,
    `Status: ${statusText}`,
    `Target: ${p.targetUrl}`,
    `Audit ID: ${p.auditId}`,
    ``,
    `Critical: ${p.criticalCount}`,
    `Warnings: ${p.warningCount}`,
    `Passed:   ${p.passedCount}`,
    ``,
    `View full report: ${p.scanReportUrl}`,
  ].join("\n");

  return {
    subject: hasCritical
      ? `[vibecheck.dev] ⚠ ${p.criticalCount} critical ${p.criticalCount === 1 ? "issue" : "issues"} found — ${p.targetUrl}`
      : `[vibecheck.dev] Scan complete — ${p.targetUrl}`,
    html,
    text,
  };
}

// ─── Critical Vulnerability Found ─────────────────────────────────────────────

export interface CriticalVulnParams {
  userEmail: string;
  targetUrl: string;
  auditId: string;
  criticalCount: number;
  topFindings: { title: string; cwe?: string }[];
  scanReportUrl: string;
}

export function criticalVulnTemplate(p: CriticalVulnParams): { subject: string; html: string; text: string } {
  const findingItems = p.topFindings
    .slice(0, 3)
    .map(
      (f) => `<li style="margin-bottom:8px;font-size:13px;color:${BRAND_TEXT};">
        <strong style="color:${BRAND_RED};">${escapeHtml(f.title)}</strong>
        ${f.cwe ? `<span style="margin-left:8px;font-size:10px;font-family:monospace;color:${BRAND_MUTED};background:#1a0000;padding:2px 6px;border-radius:4px;">${f.cwe}</span>` : ""}
      </li>`
    )
    .join("");

  const html = baseLayout(`
    ${label("Critical Alert", BRAND_RED)}
    ${heading(`${p.criticalCount} critical ${p.criticalCount === 1 ? "vulnerability" : "vulnerabilities"} detected`)}
    ${para(`A security scan of <strong style="color:${BRAND_TEXT};font-family:monospace;">${p.targetUrl}</strong> found critical issues that require immediate action.`)}

    ${divider()}

    <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${BRAND_MUTED};">Top Findings</p>
    <ul style="margin:0 0 20px;padding-left:16px;">
      ${findingItems}
    </ul>

    ${divider()}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${statRow("Audit ID", p.auditId)}
      ${statRow("Target", p.targetUrl)}
    </table>

    ${para("Open the full report to see patch diffs and step-by-step remediation guidance for each finding.")}

    ${ctaButton("Review & Fix Vulnerabilities", p.scanReportUrl)}
  `);

  const topList = p.topFindings
    .slice(0, 3)
    .map((f) => `  - ${f.title}${f.cwe ? ` (${f.cwe})` : ""}`)
    .join("\n");

  const text = [
    `vibecheck.dev — Critical Vulnerability Alert`,
    ``,
    `${p.criticalCount} critical ${p.criticalCount === 1 ? "vulnerability" : "vulnerabilities"} found in: ${p.targetUrl}`,
    `Audit ID: ${p.auditId}`,
    ``,
    `Top findings:`,
    topList,
    ``,
    `View full report: ${p.scanReportUrl}`,
  ].join("\n");

  return {
    subject: `[vibecheck.dev] 🚨 Critical: ${p.criticalCount} ${p.criticalCount === 1 ? "vulnerability" : "vulnerabilities"} in ${p.targetUrl}`,
    html,
    text,
  };
}

// ─── Subscription Updated ─────────────────────────────────────────────────────

export type SubscriptionEvent = "activated" | "cancelled" | "renewed" | "payment_failed" | "reactivated";

export interface SubscriptionUpdatedParams {
  userEmail: string;
  plan: string;
  event: SubscriptionEvent;
  periodEnd?: string; // ISO date
  dashboardUrl: string;
}

const SUBSCRIPTION_COPY: Record<SubscriptionEvent, { heading: string; body: string; label: string; color: string }> = {
  activated: {
    label: "Subscription Activated",
    color: BRAND_GREEN,
    heading: "Welcome to Pro!",
    body: "Your Pro subscription is now active. Enjoy unlimited scans, priority analysis, and full access to all security features.",
  },
  cancelled: {
    label: "Subscription Cancelled",
    color: BRAND_RED,
    heading: "Subscription cancelled",
    body: "Your subscription has been cancelled. You'll retain Pro access until the end of your current billing period. After that, your account will revert to the free plan.",
  },
  renewed: {
    label: "Subscription Renewed",
    color: BRAND_GREEN,
    heading: "Subscription renewed",
    body: "Your subscription has been renewed successfully. Thank you for continuing to use vibecheck.dev!",
  },
  payment_failed: {
    label: "Payment Failed",
    color: BRAND_RED,
    heading: "Payment failed",
    body: "We were unable to process your subscription payment. Please update your payment method to avoid losing access to Pro features.",
  },
  reactivated: {
    label: "Subscription Reactivated",
    color: BRAND_CYAN,
    heading: "Subscription reactivated",
    body: "Your subscription cancellation has been reversed. Your plan will continue to renew normally at the end of the billing period.",
  },
};

export function subscriptionUpdatedTemplate(p: SubscriptionUpdatedParams): { subject: string; html: string; text: string } {
  const copy = SUBSCRIPTION_COPY[p.event];
  const formattedPeriodEnd = p.periodEnd
    ? new Date(p.periodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  const html = baseLayout(`
    ${label(copy.label, copy.color)}
    ${heading(copy.heading)}
    ${para(copy.body)}

    ${divider()}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${statRow("Plan", p.plan.charAt(0).toUpperCase() + p.plan.slice(1), copy.color)}
      ${formattedPeriodEnd ? statRow(p.event === "cancelled" ? "Access Until" : "Next Renewal", formattedPeriodEnd) : ""}
    </table>

    ${p.event === "payment_failed"
      ? ctaButton("Update Payment Method", p.dashboardUrl)
      : ctaButton("Go to Dashboard", p.dashboardUrl)}
  `);

  const text = [
    `vibecheck.dev — ${copy.label}`,
    ``,
    copy.heading,
    ``,
    copy.body,
    ``,
    `Plan: ${p.plan}`,
    formattedPeriodEnd ? `${p.event === "cancelled" ? "Access until" : "Next renewal"}: ${formattedPeriodEnd}` : "",
    ``,
    `Dashboard: ${p.dashboardUrl}`,
  ].filter(Boolean).join("\n");

  const subjectMap: Record<SubscriptionEvent, string> = {
    activated: `[vibecheck.dev] Pro subscription activated`,
    cancelled: `[vibecheck.dev] Subscription cancelled`,
    renewed: `[vibecheck.dev] Subscription renewed`,
    payment_failed: `[vibecheck.dev] Payment failed — action required`,
    reactivated: `[vibecheck.dev] Subscription reactivated`,
  };

  return { subject: subjectMap[p.event], html, text };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
