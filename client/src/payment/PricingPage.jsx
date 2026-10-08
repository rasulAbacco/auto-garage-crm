import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import {
  Hero,
  PricingCard,
  TrustSection,
  StatsSection,
  TestimonialSection,
  FAQSection,
} from "./PricingComponents";
import PaymentModal from "./PaymentModal";
import { FiStar, FiAward, FiCpu } from "react-icons/fi";
import Footer from "../components/Footer.jsx";
import { captureReferralCodeFromLocation } from "../utils/referralCapture";

// --- Region-wise pricing (monthly, ₹) ---
// multiMonthDiscount: applied to any subscription longer than one month.
// customiseWebsitePerk: "Website free for 1 year" + client-paid domain charge.
export const REGION_PRICING = {
  urban: {
    label: "Urban Cities",
    multiMonthDiscount: 0.1,
    customiseWebsitePerk: true,
    domainCharge: 1500,
    prices: {
      car: { premium: 500, customise: 700 },
      bike: { premium: 500, customise: 700 },
      washing: { premium: 400 },
    },
  },
  rural: {
    label: "Rural Areas",
    multiMonthDiscount: 0.05,
    customiseWebsitePerk: false,
    domainCharge: null,
    prices: {
      car: { premium: 350, customise: 500 },
      bike: { premium: 350, customise: 500 },
      washing: { premium: 350 },
    },
  },
};

export const FREE_TRIAL_DAYS = 30;

// Backend plan keys (server/routes/payments.js RAZORPAY_PLAN_MAP)
const API_PLAN_KEYS = {
  car: { premium: "premium", customise: "customise" },
  bike: { premium: "bikepremium", customise: "bikecustomise" },
  washing: { premium: "washpremium" },
};

const PREMIUM_FEATURES = [
  `First ${FREE_TRIAL_DAYS} Days 100% Free`,
  "Unlimited RC Image Uploads",
  "High-Precision OCR",
  "Team Access (10 Logins)",
  "SMS/WhatsApp Protocols",
  "Maintenance Alert Logic",
  "Automated Invoicing",
  "Payroll Management",
  "Advanced Data Export",
  "Priority Support Tier",
];

const WASHING_PREMIUM_FEATURES = [
  `First ${FREE_TRIAL_DAYS} Days 100% Free`,
  "Unlimited Queue Uploads",
  "Team Access (10 Logins)",
  "SMS/WhatsApp Protocols",
  "Automated Invoicing",
  "Payroll Management",
  "Advanced Data Export",
  "Priority Support Tier",
];

export function buildPlans(planType, region) {
  const cfg = REGION_PRICING[region];
  const prices = cfg.prices[planType] || cfg.prices.car;
  const keys = API_PLAN_KEYS[planType] || API_PLAN_KEYS.car;

  const plans = [
    {
      id: "premium",
      name: "Premium Package",
      tagline: `${FREE_TRIAL_DAYS} Days Free Trial`,
      numericPrice: prices.premium,
      icon: FiStar,
      badge: "POPULAR",
      freeTrial: true,
      region,
      multiMonthDiscount: cfg.multiMonthDiscount,
      apiPlanName: keys.premium,
      features:
        planType === "washing" ? WASHING_PREMIUM_FEATURES : PREMIUM_FEATURES,
    },
  ];

  if (prices.customise) {
    plans.push({
      id: "customise",
      name: "Customise Package",
      tagline: `${FREE_TRIAL_DAYS} Days Free Trial`,
      numericPrice: prices.customise,
      icon: FiAward,
      badge: "BEST VALUE",
      freeTrial: true,
      region,
      multiMonthDiscount: cfg.multiMonthDiscount,
      apiPlanName: keys.customise,
      websitePerk: cfg.customiseWebsitePerk,
      domainCharge: cfg.domainCharge,
      features: [
        `First ${FREE_TRIAL_DAYS} Days 100% Free`,
        "Full Premium Features",
        "Customised Business Website",
        ...(cfg.customiseWebsitePerk
          ? [
              "Website Free For 1 Year",
              `Domain Charges ₹${cfg.domainCharge.toLocaleString("en-IN")} (Paid By Client)`,
            ]
          : []),
        "Custom Branding & Workflows",
        "Dedicated Account Manager",
        "Integrated Gateways",
      ],
    });
  }

  return plans;
}

export default function ModernPricingPage() {
  const { isDark } = useTheme();
  const location = useLocation();
  // Number of months the customer subscribes for (1 = fixed price, 2+ = discount)
  const [months, setMonths] = useState(1);
  // Backend only understands monthly / yearly
  const billingPeriod = months >= 12 ? "yearly" : "monthly";
  const setBillingPeriod = (p) => setMonths(p === "yearly" ? 12 : 1);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planType, setPlanType] = useState("car");

  // 🆕 Capture ?ref=CODE from the URL (e.g. /pricing?ref=ABARC002) so it
  // can auto-fill the existing "Reference Code" field in PaymentModal —
  // no UI change, just wiring an existing referral link through to the
  // existing field.
  const referralCode = captureReferralCodeFromLocation(location.search);

  const [region, setRegion] = useState("urban");

  const regionConfig = REGION_PRICING[region];
  const activePlans = buildPlans(planType, region);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setShowModal(true);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-500 pt-32 ${isDark ? "bg-[#000814] text-white" : "bg-white text-[#001F3F]"
        }`}
    >
      {/* --- Section Header --- */}
      <div className="max-w-7xl mx-auto px-6 mb-20 text-center">
        <div
          className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl border mb-8 ${isDark
            ? "bg-white/5 border-white/10"
            : "bg-slate-50 border-slate-200"
            }`}
        >
          <span
            className={`flex gap-3 text-[9px] font-black uppercase tracking-[0.3em] ${isDark ? "text-white" : "text-[#001F3F]"}`}
          >
            <FiCpu size={18} />
            Subscription Protocols
          </span>
        </div>

        {/* Color Correction: Applied #001F3F for Light Mode Headings */}
        <h1
          className={`text-5xl lg:text-7xl font-black tracking-tighter mb-6 uppercase ${isDark ? "text-white" : "text-[#001F3F]"
            }`}
        >
          Pricing{" "}
          <span className="font-light italic lowercase">Infrastructure.</span>
        </h1>

        <p
          className={`text-lg max-w-2xl mx-auto font-medium ${isDark ? "text-slate-400" : "text-slate-500"
            }`}
        >
          Select your location and service type. Start with a{" "}
          {FREE_TRIAL_DAYS}-day free trial on Premium, and save more on
          multi-month subscriptions.
        </p>
      </div>

      {/* --- Control HUD (Billing & Plan Type) --- */}
      <div className="max-w-7xl mx-auto mb-16 px-6">
        <Hero
          isDark={isDark}
          billingPeriod={billingPeriod}
          setBillingPeriod={setBillingPeriod}
          planType={planType}
          setPlanType={setPlanType}
          region={region}
          setRegion={setRegion}
          regionConfig={regionConfig}
          freeTrialDays={FREE_TRIAL_DAYS}
          months={months}
          setMonths={setMonths}
        />
      </div>

      {/* --- Pricing Matrix --- */}
      <section className="relative z-10 px-6 pb-24">
        <div
          className={`max-w-7xl mx-auto gap-8 ${activePlans.length === 1
            ? "flex justify-center"
            : activePlans.length === 2
              ? "grid grid-cols-1 md:grid-cols-2 lg:max-w-4xl"
              : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
        >
          {activePlans.map((plan) => (
            <div
              key={`${region}-${planType}-${plan.id}`}
              className={`animate-in fade-in slide-in-from-bottom-4 duration-500 ${activePlans.length === 1 ? "w-full max-w-md" : ""}`}
            >
              <PricingCard
                plan={plan}
                billingPeriod={billingPeriod}
                months={months}
                isDark={isDark}
                onSelect={handlePlanSelect}
                isPopular={plan.badge === "POPULAR"}
              />
            </div>
          ))}
        </div>
      </section>

      {/* --- Supplemental Registry Sections --- */}
      <div
        className={`border-t ${isDark ? "border-white/5 bg-[#001F3F]/20" : "border-slate-100 bg-slate-50"}`}
      >
        <StatsSection isDark={isDark} />
      </div>

      <TrustSection isDark={isDark} />

      <div className={isDark ? "bg-[#000814]" : "bg-white"}>
        <TestimonialSection isDark={isDark} />
      </div>

      <FAQSection isDark={isDark} />

      {/* --- Transmission Components --- */}
      <PaymentModal
        show={showModal}
        plan={selectedPlan}
        billingPeriod={billingPeriod}
        months={months}
        isDark={isDark}
        planType={planType}
        onClose={() => setShowModal(false)}
        onComplete={() => setShowModal(false)}
        referralCode={referralCode}
      />
    </div>
  );
}