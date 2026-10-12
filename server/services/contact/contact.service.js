// server/services/contact/contact.service.js
// Contact Us emails — sent through Microsoft 365 like invoices (.env: MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET, MS_SMTP_USER).
//  1) Acknowledgement to the visitor: "we'll respond within 24 hours"
//  2) Notification to our own inbox (MS_SMTP_USER), reply-to = the visitor
import { getTransporter, isMailConfigured, senderAddress } from "../paymentInvoice/mailer.js";

const BRAND = "MotorDesk";
const SUPPORT_PHONE = "+91 7795692753";

const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const nl2br = (s) => escapeHtml(s).replace(/\r?\n/g, "<br>");

const shell = (title, body) => `<!doctype html>
<html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
        <tr><td style="background:#001F3F;color:#ffffff;padding:22px 28px">
          <div style="font-size:20px;font-weight:bold">${BRAND}</div>
          <div style="font-size:12px;opacity:.75;margin-top:4px">${escapeHtml(title)}</div>
        </td></tr>
        <tr><td style="padding:28px;font-size:14px;line-height:1.6;color:#334155">${body}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

const quote = (message) =>
  `<div style="margin-top:8px;padding:14px 16px;background:#f8fafc;border-left:3px solid #001F3F;border-radius:6px;color:#0f172a">${nl2br(message)}</div>`;

export class ContactMailError extends Error {}

/**
 * Sends both emails. Throws ContactMailError if our own notification could not
 * be delivered (so the visitor is told to retry). A failed acknowledgement is
 * reported but does not fail the request — we still have their message.
 */
export async function sendContactEmails({ name, email, message, ip }) {
  if (!isMailConfigured()) {
    throw new ContactMailError("Email is not configured on the server (MS_TENANT_ID / MS_CLIENT_ID / MS_CLIENT_SECRET / MS_SMTP_USER).");
  }
  const transporter = getTransporter();
  const from = `"${BRAND} Support" <${senderAddress()}>`;
  const receivedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

  // 1) Notify our inbox first — this is the one that must not be lost
  try {
    await transporter.sendMail({
      from,
      to: senderAddress(),
      replyTo: { name, address: email },
      subject: `New contact enquiry from ${name}`,
      html: shell(
        "New Contact Us submission",
        `<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px">
           <tr><td style="padding:4px 16px 4px 0;color:#64748b">Name</td><td><b>${escapeHtml(name)}</b></td></tr>
           <tr><td style="padding:4px 16px 4px 0;color:#64748b">Email</td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
           <tr><td style="padding:4px 16px 4px 0;color:#64748b">Received</td><td>${escapeHtml(receivedAt)}</td></tr>
         </table>
         <p style="margin:18px 0 0;font-weight:bold;color:#0f172a">Message</p>${quote(message)}
         <p style="margin:18px 0 0;font-size:12px;color:#94a3b8">Reply to this email to respond directly to ${escapeHtml(name)}.${ip ? ` · IP ${escapeHtml(ip)}` : ""}</p>`,
      ),
      text: `New contact enquiry\n\nName: ${name}\nEmail: ${email}\nReceived: ${receivedAt}\n\n${message}`,
    });
  } catch (err) {
    console.error("📨 Contact notification failed:", err?.message || err);
    throw new ContactMailError("Could not send your message right now. Please try again shortly.");
  }

  // 2) Acknowledge the visitor
  try {
    await transporter.sendMail({
      from,
      to: { name, address: email },
      replyTo: senderAddress(),
      subject: `We've received your message — ${BRAND}`,
      html: shell(
        "Support",
        `<p style="margin:0 0 12px;color:#0f172a;font-size:15px">Hi ${escapeHtml(name)},</p>
         <p style="margin:0 0 12px">Thank you for contacting ${BRAND}. We've received your message and our team will get back to you <b>within 24 hours</b>.</p>
         <p style="margin:0 0 4px">For anything urgent, call us on <b>${SUPPORT_PHONE}</b>.</p>
         <p style="margin:20px 0 0;font-weight:bold;color:#0f172a">Your message</p>${quote(message)}
         <p style="margin:24px 0 0">Regards,<br>${BRAND} Support Team</p>`,
      ),
      text:
        `Hi ${name},\n\nThank you for contacting ${BRAND}. We've received your message and our team will get back to you within 24 hours.\n` +
        `For anything urgent, call us on ${SUPPORT_PHONE}.\n\nYour message:\n${message}\n\nRegards,\n${BRAND} Support Team`,
    });
    return { acknowledged: true };
  } catch (err) {
    console.error("📨 Contact acknowledgement failed:", err?.message || err);
    return { acknowledged: false };
  }
}