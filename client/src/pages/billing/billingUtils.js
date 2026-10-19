// client/src/pages/billing/billingUtils.js
// Shared money maths for the billing form, invoice and proforma (so they always agree).

export const num = (v) => (Number.isFinite(+v) ? +v : 0);

export const rowBase = (r) => num(r.quantity) * num(r.unitPrice);
export const rowCgst = (r) => (rowBase(r) * num(r.cgstRate)) / 100;
export const rowSgst = (r) => (rowBase(r) * num(r.sgstRate)) / 100;
export const rowTotal = (r) => rowBase(r) + rowCgst(r) + rowSgst(r);

/** Totals for a list of cost items + a flat discount amount. */
export const calcTotals = (items = [], discount = 0) => {
  let partsAmount = 0,
    laborAmount = 0,
    partsCgst = 0,
    partsSgst = 0,
    laborCgst = 0,
    laborSgst = 0;
  items.forEach((r) => {
    const b = rowBase(r);
    if (r.type === "labor") {
      laborAmount += b;
      laborCgst += rowCgst(r);
      laborSgst += rowSgst(r);
    } else {
      partsAmount += b;
      partsCgst += rowCgst(r);
      partsSgst += rowSgst(r);
    }
  });
  const taxable = partsAmount + laborAmount;
  const tax = partsCgst + partsSgst + laborCgst + laborSgst;
  const netAmount = taxable + tax;
  const discountAmount = num(discount);
  const amountAfterDiscount = netAmount - discountAmount;
  const roundedAmount = Math.floor(amountAfterDiscount);
  const roundOffAmount = amountAfterDiscount - roundedAmount;
  return {
    partsAmount,
    laborAmount,
    partsCgst,
    partsSgst,
    laborCgst,
    laborSgst,
    taxable,
    tax,
    netAmount,
    discountAmount,
    amountAfterDiscount,
    roundedAmount,
    roundOffAmount,
  };
};

/** Group items by tax rate for the "CGST @ 9% on ₹…" lines. kind = "cgstRate" | "sgstRate" */
export const taxGroups = (items = [], kind = "cgstRate") => {
  const groups = {};
  items.forEach((it) => {
    const rate = num(it[kind]);
    const key = rate.toFixed(2);
    if (!groups[key]) groups[key] = { rate: key, taxable: 0, taxAmount: 0 };
    groups[key].taxable += rowBase(it);
    groups[key].taxAmount += (rowBase(it) * rate) / 100;
  });
  return Object.values(groups).filter((g) => g.taxable > 0);
};

/** Indian-system amount in words: 125000 → "One Lakh Twenty Five Thousand Only" */
export const numberToWords = (value) => {
  let n = Math.floor(Math.abs(num(value)));
  if (n === 0) return "Zero Only";
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const two = (x) =>
    x < 20 ? ones[x] : `${tens[Math.floor(x / 10)]} ${ones[x % 10]}`.trim();
  const three = (x) =>
    x >= 100
      ? `${ones[Math.floor(x / 100)]} Hundred ${two(x % 100)}`.trim()
      : two(x);

  const parts = [];
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (crore) parts.push(`${crore >= 100 ? three(crore) : two(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thousand) parts.push(`${two(thousand)} Thousand`);
  if (n) parts.push(three(n));
  return `${parts.join(" ").replace(/\s+/g, " ").trim()} Only`;
};

export const money = (v) =>
  `₹${num(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
