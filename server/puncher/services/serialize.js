// server/puncher/services/serialize.js
// Prisma returns Decimal objects for money columns — convert to numbers for the UI.

const MONEY_FIELDS = [
  "unitPrice",
  "totalPrice",
  "subtotal",
  "discount",
  "gstPercent",
  "gstAmount",
  "grandTotal",
  "amount",
];

export const toNum = (v) => (v === null || v === undefined ? 0 : Number(v));

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export function serialize(value) {
  if (Array.isArray(value)) return value.map(serialize);
  if (!value || typeof value !== "object" || value instanceof Date) return value;

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (MONEY_FIELDS.includes(k)) out[k] = toNum(v);
    else if (v && typeof v === "object" && !(v instanceof Date)) out[k] = serialize(v);
    else out[k] = v;
  }
  return out;
}
