// server/services/paymentInvoice/invoicePdf.js
// Builds the subscription invoice PDF (A4) with jsPDF.
// Built-in PDF fonts have no ₹ glyph, so amounts are written as "Rs.".
import { jsPDF } from "jspdf";
import { SELLER } from "./seller.js";

const NAVY = [0, 31, 63];
const GREY = [100, 116, 139];
const LIGHT = [241, 245, 249];

const money = (n) =>
  `Rs. ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const date = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

/** @returns {Buffer} */
export function buildInvoicePdf(inv) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  let y = 0;

  // Header band
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(SELLER.name, M, 46);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(SELLER.tagline, M, 64);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("INVOICE", W - M, 50, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("PAID", W - M, 66, { align: "right" });

  // Invoice meta
  y = 136;
  doc.setTextColor(...GREY);
  doc.setFontSize(8);
  doc.text("INVOICE NUMBER", M, y);
  doc.text("INVOICE DATE", M + 170, y);
  doc.text("PAYMENT ID", M + 300, y);
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(inv.invoiceNumber, M, y + 15);
  doc.text(date(inv.paidAt), M + 170, y + 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(String(inv.razorpayPaymentId), M + 300, y + 15);

  // Billed to
  y += 52;
  doc.setTextColor(...GREY);
  doc.setFontSize(8);
  doc.text("BILLED TO", M, y);
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  let by = y + 16;
  const billed = [inv.companyName, inv.customerName].filter(Boolean);
  doc.text(billed[0] || inv.email, M, by);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  for (const line of [billed[1], inv.email, inv.phone, inv.address, inv.gstNumber && `GSTIN: ${inv.gstNumber}`].filter(Boolean)) {
    by += 13;
    doc.text(doc.splitTextToSize(String(line), 250), M, by);
  }

  // Items table
  y = Math.max(by, y + 16) + 34;
  doc.setFillColor(...LIGHT);
  doc.rect(M, y - 14, W - 2 * M, 24, "F");
  doc.setTextColor(...GREY);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", M + 10, y + 2);
  doc.text("AMOUNT", W - M - 10, y + 2, { align: "right" });

  y += 30;
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const descLines = doc.splitTextToSize(inv.description, W - 2 * M - 140);
  doc.text(descLines, M + 10, y);
  doc.text(money(inv.subtotal), W - M - 10, y, { align: "right" });
  y += descLines.length * 13 + 14;
  doc.setDrawColor(226, 232, 240);
  doc.line(M, y, W - M, y);

  // Totals
  y += 22;
  const row = (label, value, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 12 : 10);
    doc.setTextColor(...(bold ? NAVY : GREY));
    doc.text(label, W - M - 250, y);
    doc.setTextColor(...NAVY);
    doc.text(value, W - M - 10, y, { align: "right" });
    y += bold ? 24 : 18;
  };
  row("Subtotal", money(inv.subtotal));
  if (Number(inv.discount) > 0) row(inv.discountLabel || "Discount", `- ${money(inv.discount)}`);
  doc.line(W - M - 260, y - 8, W - M, y - 8);
  y += 6;
  row("Amount Paid", money(inv.amountPaid), true);

  // Paid stamp
  doc.setDrawColor(22, 163, 74);
  doc.setTextColor(22, 163, 74);
  doc.setLineWidth(1.5);
  doc.roundedRect(M, y - 52, 150, 34, 6, 6, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("PAYMENT RECEIVED", M + 75, y - 31, { align: "center" });
  doc.setLineWidth(0.5);

  // Footer
  const H = doc.internal.pageSize.getHeight();
  doc.setTextColor(...GREY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Paid securely via Razorpay. This is a computer-generated invoice and needs no signature.", W / 2, H - 56, { align: "center" });
  doc.text(`${SELLER.name}${SELLER.supportEmail ? `  |  ${SELLER.supportEmail}` : ""}`, W / 2, H - 42, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}
