// server/services/paymentInvoice/mailer.js
// Sends email through Microsoft 365 (Microsoft Graph API, app-only / client credentials).
// Used by payment invoices and the Contact Us form. Configure in .env:
//   MS_TENANT_ID=      Directory (tenant) ID of the Entra app registration
//   MS_CLIENT_ID=      Application (client) ID
//   MS_CLIENT_SECRET=  Client secret VALUE (not the secret ID)
//   MS_SMTP_USER=      Mailbox that sends the mail, e.g. support@themotordesk.com
// The app needs the Microsoft Graph *Application* permission "Mail.Send" with admin consent,
// and MS_SMTP_USER must have an Exchange Online mailbox (licensed).
//
// Exposes a nodemailer-style sendMail({ from, to, replyTo, subject, html, text, attachments }).

const GRAPH = "https://graph.microsoft.com/v1.0";

let tokenCache = { token: null, expiresAt: 0 };
let testTransport = null;

const env = () => ({
  tenant: process.env.MS_TENANT_ID?.trim(),
  clientId: process.env.MS_CLIENT_ID?.trim(),
  secret: process.env.MS_CLIENT_SECRET?.trim(),
  user: process.env.MS_SMTP_USER?.trim(),
});

export const isMailConfigured = () => {
  if (testTransport) return true;
  const e = env();
  return Boolean(e.tenant && e.clientId && e.secret && e.user);
};

export const senderAddress = () => env().user;

export class MailError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60_000) return tokenCache.token;

  const { tenant, clientId, secret } = env();
  const res = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: secret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    // e.g. AADSTS7000215 = invalid client secret, AADSTS700016 = app not found in tenant
    const msg = data.error_description?.split("\r\n")[0] || data.error || `HTTP ${res.status}`;
    throw new MailError(`Microsoft sign-in failed: ${msg}`, data.error || "token_error");
  }
  tokenCache = { token: data.access_token, expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000 };
  return tokenCache.token;
}

/** "Name" <a@b.com> | a@b.com | { name, address } → Graph recipient */
function toRecipient(value) {
  if (!value) return null;
  if (typeof value === "object") {
    return { emailAddress: { address: String(value.address).trim(), ...(value.name ? { name: String(value.name) } : {}) } };
  }
  const m = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(String(value));
  if (m) return { emailAddress: { address: m[2].trim(), ...(m[1].trim() ? { name: m[1].trim() } : {}) } };
  return { emailAddress: { address: String(value).trim() } };
}

const toList = (v) => (Array.isArray(v) ? v : v ? [v] : []).map(toRecipient).filter(Boolean);

/** Converts nodemailer-style options to a Graph message */
export function toGraphMessage({ from, to, cc, bcc, replyTo, subject, html, text, attachments = [] }) {
  const sender = senderAddress();
  const fromName = toRecipient(from)?.emailAddress?.name;
  return {
    subject: subject || "",
    body: html ? { contentType: "HTML", content: html } : { contentType: "Text", content: text || "" },
    // Graph can only send as the mailbox itself; keep the display name
    from: { emailAddress: { address: sender, ...(fromName ? { name: fromName } : {}) } },
    toRecipients: toList(to),
    ...(cc ? { ccRecipients: toList(cc) } : {}),
    ...(bcc ? { bccRecipients: toList(bcc) } : {}),
    ...(replyTo ? { replyTo: toList(replyTo) } : {}),
    attachments: attachments.map((a) => ({
      "@odata.type": "#microsoft.graph.fileAttachment",
      name: a.filename,
      contentType: a.contentType || "application/octet-stream",
      contentBytes: Buffer.isBuffer(a.content)
        ? a.content.toString("base64")
        : Buffer.from(String(a.content ?? "")).toString("base64"),
    })),
  };
}

const graphTransport = {
  async sendMail(options) {
    if (!isMailConfigured()) {
      throw new MailError("Email is not configured (MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET, MS_SMTP_USER).", "not_configured");
    }
    const token = await getAccessToken();
    const res = await fetch(`${GRAPH}/users/${encodeURIComponent(senderAddress())}/sendMail`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: toGraphMessage(options), saveToSentItems: true }),
    });
    if (res.status === 202) return { accepted: toList(options.to).map((r) => r.emailAddress.address) };

    const data = await res.json().catch(() => ({}));
    const code = data?.error?.code || `HTTP_${res.status}`;
    if (res.status === 401) tokenCache = { token: null, expiresAt: 0 };
    // ErrorAccessDenied → Mail.Send permission / admin consent missing
    // MailboxNotEnabledForRESTAPI / ResourceNotFound → MS_SMTP_USER has no Exchange Online mailbox
    throw new MailError(`Microsoft Graph sendMail failed (${code}): ${data?.error?.message || res.statusText}`, code);
  },
};

export function getTransporter() {
  return testTransport || graphTransport;
}

/** Tests only: swap in a fake transport (null restores Microsoft Graph). */
export function __setTestTransport(t) {
  testTransport = t;
}

/** Tests only: clear the cached access token. */
export function __resetTokenCache() {
  tokenCache = { token: null, expiresAt: 0 };
}