// server/puncher/services/billing.service.js
import { round2, toNum } from "./serialize.js";

export class BillingError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Calculates invoice totals.
 * items: [{ quantity, unitPrice }]
 */
export function calculateTotals(items, { discount = 0, gstPercent = 0 } = {}) {
  const subtotal = round2(
    items.reduce((sum, i) => sum + toNum(i.quantity) * toNum(i.unitPrice), 0),
  );
  const safeDiscount = Math.min(Math.max(round2(toNum(discount)), 0), subtotal);
  const safeGst = Math.min(Math.max(toNum(gstPercent), 0), 28);
  const taxable = round2(subtotal - safeDiscount);
  const gstAmount = round2((taxable * safeGst) / 100);
  const grandTotal = round2(taxable + gstAmount);

  return {
    subtotal,
    discount: safeDiscount,
    gstPercent: safeGst,
    gstAmount,
    grandTotal,
  };
}

/**
 * Sequential, per-shop invoice number: PUN<userId>-00001
 * Retries on a unique clash (two invoices created at the same moment).
 */
export async function createWithInvoiceNumber(prisma, userId, createFn) {
  const prefix = `PUN${userId}-`;
  const count = await prisma.puncherBilling.count({ where: { userId } });

  for (let attempt = 0; attempt < 5; attempt++) {
    const invoiceNumber = `${prefix}${String(count + 1 + attempt).padStart(5, "0")}`;
    try {
      return await createFn(invoiceNumber);
    } catch (err) {
      if (err?.code === "P2002") continue; // unique clash → try next number
      throw err;
    }
  }
  throw new BillingError("Could not generate invoice number, please retry", 409);
}
