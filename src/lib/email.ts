import { Resend } from "resend";
import type {
  ScanCompletedParams,
  CriticalVulnParams,
  SubscriptionUpdatedParams,
  SubscriptionEvent,
} from "./email-templates";
import {
  scanCompletedTemplate,
  criticalVulnTemplate,
  subscriptionUpdatedTemplate,
} from "./email-templates";

const FROM_ADDRESS = process.env.RESEND_FROM ?? "noreply@vibecheck.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://vibecheck.dev";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY is not set — emails will not be sent");
    return null;
  }
  return new Resend(key);
}

interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
}

async function send(to: string, subject: string, html: string, text: string): Promise<SendResult> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "RESEND_API_KEY not configured" };

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[email] Send failed:", message);
    return { ok: false, error: message };
  }
}

// ─── Public senders ───────────────────────────────────────────────────────────

export async function sendScanCompleted(params: Omit<ScanCompletedParams, "scanReportUrl"> & {
  projectId?: string | null;
  scanId: string;
}): Promise<SendResult> {
  const { projectId, scanId, ...rest } = params;
  const scanReportUrl = projectId
    ? `${APP_URL}/projects/${projectId}/scans/${scanId}`
    : `${APP_URL}/dashboard`;

  const { subject, html, text } = scanCompletedTemplate({ ...rest, scanReportUrl });
  return send(params.userEmail, subject, html, text);
}

export async function sendCriticalVuln(params: Omit<CriticalVulnParams, "scanReportUrl"> & {
  projectId?: string | null;
  scanId: string;
}): Promise<SendResult> {
  const { projectId, scanId, ...rest } = params;
  const scanReportUrl = projectId
    ? `${APP_URL}/projects/${projectId}/scans/${scanId}`
    : `${APP_URL}/dashboard`;

  const { subject, html, text } = criticalVulnTemplate({ ...rest, scanReportUrl });
  return send(params.userEmail, subject, html, text);
}

export async function sendSubscriptionUpdated(params: Omit<SubscriptionUpdatedParams, "dashboardUrl">): Promise<SendResult> {
  const dashboardUrl = `${APP_URL}/dashboard`;
  const { subject, html, text } = subscriptionUpdatedTemplate({ ...params, dashboardUrl });
  return send(params.userEmail, subject, html, text);
}
