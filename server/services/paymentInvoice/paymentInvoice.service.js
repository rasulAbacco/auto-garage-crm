// server/services/paymentInvoice/paymentInvoice.service.js
/**
 * 🧾 Subscription payment invoices
 *
 * sendPaymentInvoice() is called ONLY from code paths where Razorpay has
 * confirmed a captured payment (verified order signature, subscription.charged
 * webhook, localhost verify). Failed / cancelled payments never reach it, and
 * the ₹5 refundable mandate check is not a charge, so it is never invoiced.
 *
 * - Idempotent: one invoice per Razorpay payment ID (webhook retries are safe).
 * - Never throws: an email problem must not break the payment flow; the
 *   outcome is stored on the PaymentInvoice row (SENT / FAILED / SKIPPED).
 */
import prisma from "../../models/prismaClient.js";
import { buildInvoicePdf } from "./invoicePdf.js";
import { getTransporter, isMailConfigured, senderAddress } from "./mailer.js";
import { SELLER } from "./seller.js";

const CATEGORY_LABEL = {
  car: "Car Garage CRM",
  bike: "Bike Garage CRM",
  washing: "Washing Center CRM",
  puncher: "Puncher Shop CRM",
};

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const cap = (s) => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1).toLowerCase();

const inr = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** "urban_car_premium_3m_1350" → "Car Garage CRM · Premium Plan · Urban · 3 months" */
export function describeFromPricingKey(key) {
  const m = /^(urban|rural)_([a-z]+)_([a-z]+)_(\d+)m_/.exec(String(key || ""));
  if (!m) return null;
  const [, region, category, tier, months] = m;
  const n = Number(months);
  return `${CATEGORY_LABEL[category] || cap(category)} · ${cap(tier)} Plan · ${cap(region)} · ${n} ${n === 1 ? "month" : "months"}`;
}

function describeFromRecord(record) {
  const multi = /^(\d+)-months?$/.exec(String(record?.billingPeriod || ""));
  const period = multi
    ? `${multi[1]} months`
    : record?.billingPeriod === "yearly"
      ? "12 months"
      : "1 month";
  return `MotorDesk ${cap(record?.plan || "Subscription")} Plan · ${period}`;
}

/** Invoice number per IST month: MD-202610-00001 */
async function nextInvoiceNumber(offset = 0) {
  const now = new Date(Date.now() + 5.5 * 3600 * 1000); // IST
  const ym = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const count = await prisma.paymentInvoice.count({
    where: { invoiceNumber: { startsWith: `MD-${ym}-` } },
  });
  return `MD-${ym}-${String(count + 1 + offset).padStart(5, "0")}`;
}

function buildEmailHtml(inv) {
  const discountRow =
    Number(inv.discount) > 0
      ? `<tr><td style="padding:6px 0;color:#64748b">${escapeHtml(inv.discountLabel || "Discount")}</td><td style="padding:6px 0;text-align:right">− ${inr(inv.discount)}</td></tr>`
      : "";
  return `<!doctype html>
<html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
        <tr><td style="background:#001F3F;color:#ffffff;padding:24px 28px">
          <div style="font-size:20px;font-weight:bold">${escapeHtml(SELLER.name)}</div>
          <div style="font-size:12px;opacity:.75;margin-top:4px">${escapeHtml(SELLER.tagline)}</div>
        </td></tr>
        <tr><td style="padding:28px">
          <p style="margin:0 0 12px;font-size:15px">Hi ${escapeHtml(inv.customerName || "there")},</p>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#334155">
            Thank you! We have received your payment. Your invoice <b>${escapeHtml(inv.invoiceNumber)}</b> is attached as a PDF.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:8px 0">
            <tr><td style="padding:6px 0;color:#64748b">Plan</td><td style="padding:6px 0;text-align:right">${escapeHtml(inv.description)}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b">Subtotal</td><td style="padding:6px 0;text-align:right">${inr(inv.subtotal)}</td></tr>
            ${discountRow}
            <tr><td style="padding:10px 0 6px;font-weight:bold">Amount paid</td><td style="padding:10px 0 6px;text-align:right;font-weight:bold;font-size:16px">${inr(inv.amountPaid)}</td></tr>
          </table>
          <p style="margin:16px 0 0;font-size:12px;color:#64748b">
            Payment ID: ${escapeHtml(inv.razorpayPaymentId)}<br>
            Paid on ${new Date(inv.paidAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}
          </p>
        </td></tr>
        <tr><td style="padding:16px 28px;background:#f8fafc;font-size:11px;color:#94a3b8;text-align:center">
          This is an automated email for a successful payment. Please keep the attached invoice for your records.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * @param {object} p
 * @param {string} p.razorpayPaymentId  captured Razorpay payment id (required)
 * @param {number} p.amountPaid         amount actually captured, in rupees
 * @param {Date}   [p.paidAt]
 * @param {"ORDER"|"SUBSCRIPTION_CHARGED"|"LOCAL_VERIFY"} p.source
 * @param {object} p.paymentRecord      Payment row (customer details)
 * @param {string} [p.pricingKey]       e.g. urban_car_premium_3m_1350 (for the line item)
 * @returns {Promise<{status: string, invoiceNumber?: string, error?: string}>}
 */
export async function sendPaymentInvoice({
  razorpayPaymentId,
  amountPaid,
  paidAt = new Date(),
  source,
  paymentRecord,
  pricingKey,
}) {
  try {
    const paid = round2(amountPaid);
    if (!razorpayPaymentId || !(paid > 0) || !paymentRecord?.email) {
      console.warn("🧾 Invoice skipped: missing payment id, amount or email", { razorpayPaymentId, paid });
      return { status: "SKIPPED", error: "Missing payment details" };
    }

    // ---- Idempotency: one invoice per captured payment ----
    let invoice = await prisma.paymentInvoice.findUnique({ where: { razorpayPaymentId } });
    if (invoice?.emailStatus === "SENT") {
      return { status: "SENT", invoiceNumber: invoice.invoiceNumber, duplicate: true };
    }

    if (!invoice) {
      // Send to the registered user email when the account exists
      const user = await prisma.user.findUnique({
        where: { email: paymentRecord.email.toLowerCase() },
        select: { email: true, username: true, companyName: true },
      });

      // Show the multi-month discount only when this charge matches the plan price
      const recordAmount = round2(paymentRecord.amount);
      const original = round2(paymentRecord.originalAmount);
      const showDiscount = Math.abs(recordAmount - paid) < 0.01 && original > paid;
      const subtotal = showDiscount ? original : paid;

      const data = {
        razorpayPaymentId,
        paymentRecordId: paymentRecord.id || null,
        email: (user?.email || paymentRecord.email).toLowerCase(),
        customerName: paymentRecord.customerName || user?.username || null,
        companyName: paymentRecord.companyName || user?.companyName || null,
        gstNumber: paymentRecord.gstNumber || null,
        description: describeFromPricingKey(pricingKey) || describeFromRecord(paymentRecord),
        subtotal,
        discount: round2(subtotal - paid),
        amountPaid: paid,
        paidAt,
        source,
      };

      for (let attempt = 0; attempt < 5 && !invoice; attempt++) {
        try {
          invoice = await prisma.paymentInvoice.create({
            data: { ...data, invoiceNumber: await nextInvoiceNumber(attempt) },
          });
        } catch (err) {
          if (err?.code !== "P2002") throw err;
          // Same payment processed concurrently → use that row
          const existing = await prisma.paymentInvoice.findUnique({ where: { razorpayPaymentId } });
          if (existing) {
            if (existing.emailStatus === "SENT") {
              return { status: "SENT", invoiceNumber: existing.invoiceNumber, duplicate: true };
            }
            invoice = existing;
          }
          // otherwise the invoice number clashed → loop tries the next number
        }
      }
      if (!invoice) throw new Error("Could not allocate an invoice number");
    }

    const view = {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      discount: Number(invoice.discount),
      amountPaid: Number(invoice.amountPaid),
      phone: paymentRecord.phone,
      address: paymentRecord.address,
      discountLabel: paymentRecord.discountPercent
        ? `Multi-month discount (${Number(paymentRecord.discountPercent)}%)`
        : "Discount",
    };

    if (!isMailConfigured()) {
      console.warn("🧾 Invoice not emailed: set MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET and MS_SMTP_USER in .env");
      await prisma.paymentInvoice.update({
        where: { id: invoice.id },
        data: { emailStatus: "SKIPPED", emailError: "Microsoft 365 email (MS_*) not configured" },
      });
      return { status: "SKIPPED", invoiceNumber: invoice.invoiceNumber, error: "SMTP not configured" };
    }

    try {
      await getTransporter().sendMail({
        from: `"${SELLER.name}" <${senderAddress()}>`,
        to: invoice.email,
        subject: `Payment received · Invoice ${invoice.invoiceNumber}`,
        html: buildEmailHtml(view),
        text:
          `Hi ${view.customerName || "there"},\n\nThank you! We have received your payment of ${inr(view.amountPaid)}.\n` +
          `Invoice: ${invoice.invoiceNumber}\nPlan: ${view.description}\nPayment ID: ${razorpayPaymentId}\n\n` +
          `The invoice PDF is attached.\n\n${SELLER.name}`,
        attachments: [
          {
            filename: `${invoice.invoiceNumber}.pdf`,
            content: buildInvoicePdf(view),
            contentType: "application/pdf",
          },
        ],
      });

      await prisma.paymentInvoice.update({
        where: { id: invoice.id },
        data: { emailStatus: "SENT", sentAt: new Date(), emailError: null },
      });
      console.log(`🧾 Invoice ${invoice.invoiceNumber} emailed to ${invoice.email}`);
      return { status: "SENT", invoiceNumber: invoice.invoiceNumber };
    } catch (mailErr) {
      console.error("🧾 Invoice email failed:", mailErr?.message || mailErr);
      await prisma.paymentInvoice.update({
        where: { id: invoice.id },
        data: { emailStatus: "FAILED", emailError: String(mailErr?.message || mailErr).slice(0, 500) },
      });
      return { status: "FAILED", invoiceNumber: invoice.invoiceNumber, error: mailErr?.message };
    }
  } catch (err) {
    console.error("🧾 sendPaymentInvoice error:", err);
    return { status: "FAILED", error: err?.message };
  }
}