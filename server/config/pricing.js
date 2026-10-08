/* =========================================================
   🔹 REGION PRICING (server-side source of truth)
   Mirrors client/src/payment/PricingPage.jsx → REGION_PRICING.
   The amount charged is ALWAYS computed here — never trusted from the client.
========================================================= */

export const FREE_TRIAL_DAYS = 30;
export const MAX_MONTHS = 24;

export const REGION_PRICING = {
  urban: {
    multiMonthDiscount: 0.1, // 10% for more than one month
    prices: {
      car: { premium: 500, customise: 700 },
      bike: { premium: 500, customise: 700 },
      washing: { premium: 400 },
    },
  },
  rural: {
    multiMonthDiscount: 0.05, // 5% for more than one month
    prices: {
      car: { premium: 350, customise: 500 },
      bike: { premium: 350, customise: 500 },
      washing: { premium: 350 },
    },
  },
};

// Tiers that start with a free trial (no charge at signup)
const TRIAL_TIERS = new Set(["premium", "customise"]);

// Both new tiers get full (PREMIUM) app access — PlanType enum has no CUSTOMISE
const PRISMA_TIER = { premium: "PREMIUM", customise: "PREMIUM" };

/**
 * Validates the pricing selection sent by the client and computes the price.
 * Returns { error } when the selection is invalid.
 */
export function computePricing(input = {}) {
  const category = String(input.category || "").toLowerCase().trim();
  const region = String(input.region || "").toLowerCase().trim();
  const tier = String(input.tier || "").toLowerCase().trim();
  const months = parseInt(input.months, 10);

  const regionCfg = REGION_PRICING[region];
  if (!regionCfg) return { error: `INVALID REGION = ${input.region}` };

  const monthlyPrice = regionCfg.prices?.[category]?.[tier];
  if (!monthlyPrice) {
    return { error: `INVALID PLAN = ${category}/${tier} (${region})` };
  }

  if (!Number.isInteger(months) || months < 1 || months > MAX_MONTHS) {
    return { error: `INVALID MONTHS = ${input.months}` };
  }

  // 1 month = fixed price; 2+ months = region discount
  const discountRate = months > 1 ? regionCfg.multiMonthDiscount : 0;
  const subtotal = monthlyPrice * months;
  const discountAmount = Math.round(subtotal * discountRate);
  const total = subtotal - discountAmount;

  return {
    category,
    region,
    tier,
    months,
    monthlyPrice,
    subtotal,
    discountPercent: Math.round(discountRate * 100),
    discountAmount,
    total,
    isTrialTier: TRIAL_TIERS.has(tier),
    prismaPlan: PRISMA_TIER[tier],
    // Stored in Payment.billingPeriod (addInterval understands all three forms)
    billingPeriod:
      months === 1 ? "monthly" : months === 12 ? "yearly" : `${months}-months`,
    pricingKey: `${region}_${category}_${tier}_${months}m_${total}`,
  };
}

/* =========================================================
   🔹 RAZORPAY PLAN RESOLUTION
   A Razorpay plan has a fixed amount, so each (region, category, tier,
   months, amount) combination needs its own plan:
   billed every `months` months for the discounted total.
   Plans are created on first use and reused afterwards (looked up by
   notes.pricingKey, so restarts don't create duplicates).
========================================================= */
const planCache = new Map();

async function findExistingPlan(razorpay, pricingKey) {
  let skip = 0;
  const count = 100;
  // Scan a bounded number of pages
  for (let page = 0; page < 10; page++) {
    const res = await razorpay.plans.all({ count, skip });
    const items = res?.items || [];
    const match = items.find((p) => p?.notes?.pricingKey === pricingKey);
    if (match) return match.id;
    if (items.length < count) return null;
    skip += count;
  }
  return null;
}

export async function getOrCreateRazorpayPlan(razorpay, pricing) {
  const { pricingKey } = pricing;
  if (planCache.has(pricingKey)) return planCache.get(pricingKey);

  let planId = await findExistingPlan(razorpay, pricingKey);

  if (!planId) {
    const created = await razorpay.plans.create({
      period: "monthly",
      interval: pricing.months, // bill once every N months
      item: {
        name: `${pricing.category} ${pricing.tier} - ${pricing.region} - ${pricing.months} month(s)`,
        amount: Math.round(pricing.total * 100), // paise
        currency: "INR",
        description: `₹${pricing.monthlyPrice}/month x ${pricing.months}, ${pricing.discountPercent}% off`,
      },
      notes: {
        pricingKey,
        region: pricing.region,
        category: pricing.category,
        tier: pricing.tier,
        months: String(pricing.months),
      },
    });
    planId = created.id;
    console.log("RAZORPAY PLAN CREATED:", pricingKey, "→", planId);
  }

  planCache.set(pricingKey, planId);
  return planId;
}