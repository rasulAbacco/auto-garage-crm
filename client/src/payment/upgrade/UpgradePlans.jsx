// client/src/components/UpgradePlans.jsx
import React, { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import PaymentModal from "../PaymentModal";
import {
  Zap,
  Star,
  Crown,
  ArrowRight,
  Check,
  Shield,
  Clock,
  TrendingUp,
  Headphones,
  Car,
  BadgeCheck,
} from "lucide-react";
import {
  tk,
  btnBase,
  PageHeading,
} from "../../pages/clients/components/clientUi";

// Same server for local and live builds (the old "http://localhost:1" never worked locally)
const API =
  import.meta.env.VITE_API_BASE_URL ||
  "https://auto-garage-crm-zrxc.onrender.com";
const YEARLY_DISCOUNT = 0.1;

const carPlans = [
  {
    id: "basic",
    name: "Basic",
    tagline: "For small garages",
    numericPrice: 1000,
    icon: Zap,
    features: [
      "Upload RC images (up to 10/day)",
      "Basic OCR extraction",
      "Save history locally",
      "CSV/EXCEL, PDF export",
      "Email support",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    tagline: "Most popular choice",
    numericPrice: 2000,
    icon: Star,
    badge: "POPULAR",
    features: [
      "Unlimited uploads",
      "High-accuracy OCR",
      "Priority support",
      "Export CSV, PDF",
      "SMS/WhatsApp Alerts",
      "Team accounts (up to 3)",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "For growing businesses",
    numericPrice: 3000,
    icon: Crown,
    badge: "BEST VALUE",
    features: [
      "Everything in Standard",
      "Team accounts (up to 10)",
      "Maintenance Alert SMS",
      "Bulk processing",
      "Dedicated manager",
      "Auto Invoice",
      "Staff Salary Management",
      "Online Payment Options",
    ],
  },
];

const bikePlans = [
  { ...carPlans[0], numericPrice: 600 },
  { ...carPlans[1], numericPrice: 1200 },
  { ...carPlans[2], numericPrice: 2000 },
];

const washingPlans = [
  {
    id: "standard",
    name: "Standard",
    tagline: "Most popular choice",
    numericPrice: 500,
    icon: Star,
    badge: "POPULAR",
    features: [
      "Unlimited uploads",
      "Priority support",
      "Export CSV, PDF",
      "SMS/WhatsApp Alerts",
      "Team accounts (up to 3)",
    ],
  },
];

const TRUST = [
  { icon: Shield, label: "Secure payment", desc: "Bank-level encryption" },
  { icon: Clock, label: "Instant access", desc: "Start immediately" },
  { icon: TrendingUp, label: "Cancel anytime", desc: "No commitments" },
  { icon: Headphones, label: "24/7 support", desc: "Always here to help" },
];

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

const inr = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

export default function UpgradePlans() {
  const { isDark } = useTheme();
  const t = tk(isDark);
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planType] = useState("car"); // this page sells the Car garage plans
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = readUser();

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      try {
        const token = localStorage.getItem("token");
        const u = readUser();
        if (!token || !u?.email) return;

        const response = await fetch(
          `${API}/api/payments/user-plan/${encodeURIComponent(u.email)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await response.json();
        // supports both response shapes used by the server
        const plan = (data.success && data.payment) || data.currentPlan || null;
        if (plan) setCurrentPlan(plan);
      } catch (error) {
        console.error("Error fetching current plan:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentPlan();
  }, []);

  const activePlans =
    planType === "bike"
      ? bikePlans
      : planType === "washing"
        ? washingPlans
        : carPlans;

  const isCurrentPlan = (plan) =>
    String(currentPlan?.plan || "").toLowerCase() === plan.name.toLowerCase();

  const handlePlanSelect = (plan) => {
    if (isCurrentPlan(plan)) return;
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const handlePaymentComplete = () => {
    setShowModal(false);
    // full reload into the dashboard so the new plan is picked up everywhere
    window.location.assign("/car-dashboard");
  };

  const priceFor = (plan) => {
    const yearlyTotal = Math.round(
      plan.numericPrice * 12 * (1 - YEARLY_DISCOUNT),
    );
    return billingPeriod === "yearly"
      ? {
          perMonth: Math.round(yearlyTotal / 12),
          total: yearlyTotal,
          saved: plan.numericPrice * 12 - yearlyTotal,
        }
      : { perMonth: plan.numericPrice, total: plan.numericPrice, saved: 0 };
  };

  return (
    <div className="min-h-screen lg:ml-16">
      <div className="mx-auto max-w-[1200px] space-y-4 sm:space-y-6">
        <PageHeading
          isDark={isDark}
          title="Upgrade"
          accent="your plan."
          subtitle="Unlock more features as your garage grows. Change or cancel anytime."
          right={
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-black uppercase tracking-[0.15em] ${
                isDark
                  ? "border-white/10 bg-white/5 text-white"
                  : "border-[#CBD5E1] bg-white text-[#001F3F]"
              }`}
            >
              <Car size={12} /> Car garage plans
            </span>
          }
        />

        {/* current plan + billing switch */}
        <div
          className={`flex flex-col gap-3 rounded-2xl border-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 ${t.card}`}
        >
          {loading ? (
            <div
              className={`h-10 w-56 animate-pulse rounded-xl ${isDark ? "bg-white/5" : "bg-[#F8FAFC]"}`}
            />
          ) : currentPlan ? (
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
                <BadgeCheck size={16} />
              </span>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                  Your current plan
                </p>
                <p className={`text-[14px] font-black ${t.heading}`}>
                  {currentPlan.plan}{" "}
                  {currentPlan.status && (
                    <span className={`font-medium lowercase italic ${t.muted}`}>
                      ({String(currentPlan.status).toLowerCase()})
                    </span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <p className={`text-[14px] font-semibold ${t.muted}`}>
              Pick the plan that fits your garage.
            </p>
          )}

          <div className="flex items-center gap-2">
            <div
              className={`grid grid-cols-2 gap-1 rounded-xl border-2 p-1 ${t.inner}`}
              role="radiogroup"
              aria-label="Billing period"
            >
              {["monthly", "yearly"].map((p) => {
                const on = billingPeriod === p;
                return (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setBillingPeriod(p)}
                    className={`h-9 rounded-lg px-4 text-[12px] font-black uppercase tracking-[0.15em] transition ${
                      on ? t.btnPrimary : `${t.muted} hover:opacity-80`
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <span className="rounded-lg border border-green-500/30 bg-green-500/10 px-2 py-1 text-[12px] font-black uppercase tracking-wider text-green-600">
              Save 10%
            </span>
          </div>
        </div>

        {/* plan cards */}
        <div
          className={
            activePlans.length === 1
              ? "mx-auto max-w-md"
              : "grid grid-cols-1 gap-4 md:grid-cols-3 md:items-stretch"
          }
        >
          {activePlans.map((plan) => {
            const Icon = plan.icon;
            const featured = plan.badge === "POPULAR";
            const isCurrent = isCurrentPlan(plan);
            const price = priceFor(plan);

            // featured card is solid navy (white in dark mode) like the landing page
            const shell = isCurrent
              ? `${t.card} !border-green-500/60`
              : featured
                ? isDark
                  ? "border-white bg-white text-[#001F3F] shadow-2xl shadow-black/30"
                  : "border-[#001F3F] bg-[#001F3F] text-white shadow-2xl shadow-[#001F3F]/20"
                : t.card;
            const head = featured && !isCurrent ? "" : t.heading;
            const muted = featured && !isCurrent ? "opacity-70" : t.muted;
            const chip =
              featured && !isCurrent
                ? isDark
                  ? "bg-[#001F3F] text-white"
                  : "bg-white text-[#001F3F]"
                : t.chipNavy;

            return (
              <article
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border-2 p-4 transition sm:p-5 ${shell} ${featured ? "md:-my-2 md:py-7" : ""}`}
              >
                {(plan.badge || isCurrent) && (
                  <span
                    className={`absolute right-4 top-4 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[12px] font-black uppercase tracking-wider ${
                      isCurrent
                        ? "bg-green-600 text-white"
                        : featured
                          ? isDark
                            ? "bg-[#001F3F] text-white"
                            : "bg-white text-[#001F3F]"
                          : t.chipNavy
                    }`}
                  >
                    {isCurrent ? <Check size={12} /> : <Star size={12} />}
                    {isCurrent
                      ? "Current"
                      : plan.badge === "BEST VALUE"
                        ? "Best value"
                        : "Popular"}
                  </span>
                )}

                <span
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${chip}`}
                >
                  <Icon size={16} />
                </span>

                <h2
                  className={`text-[16px] font-black uppercase tracking-tight ${head}`}
                >
                  {plan.name}
                </h2>
                <p className={`text-[14px] ${muted}`}>{plan.tagline}</p>

                <div
                  className={`my-4 border-y-2 py-3 ${featured && !isCurrent ? (isDark ? "border-[#001F3F]/10" : "border-white/10") : t.line}`}
                >
                  <p className={`flex items-baseline gap-1 ${head}`}>
                    <span className="font-mono text-[16px] font-black">
                      {inr(price.perMonth)}
                    </span>
                    <span className={`text-[14px] font-semibold ${muted}`}>
                      / month
                    </span>
                  </p>
                  <p className={`text-[12px] font-semibold ${muted}`}>
                    {billingPeriod === "yearly" ? (
                      <>
                        {inr(price.total)} billed yearly ·{" "}
                        <span className="font-black text-green-500">
                          save {inr(price.saved)}
                        </span>
                      </>
                    ) : (
                      "Billed monthly"
                    )}
                  </p>
                </div>

                <ul className="mb-5 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-[14px] font-medium"
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                          featured && !isCurrent
                            ? isDark
                              ? "bg-[#001F3F] text-white"
                              : "bg-white/15 text-white"
                            : "bg-green-500/10 text-green-600"
                        }`}
                      >
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span className={featured && !isCurrent ? "" : t.body}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handlePlanSelect(plan)}
                  disabled={isCurrent}
                  className={`${btnBase} h-11 w-full ${
                    isCurrent
                      ? `border-2 ${t.btnGhost}`
                      : featured
                        ? isDark
                          ? "bg-[#001F3F] text-white hover:bg-black"
                          : "bg-white text-[#001F3F] hover:bg-blue-50"
                        : t.btnPrimary
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <Check size={14} /> Your current plan
                    </>
                  ) : (
                    <>
                      Choose {plan.name} <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </article>
            );
          })}
        </div>

        {/* trust row */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {TRUST.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className={`flex items-center gap-3 rounded-2xl border-2 p-3 sm:p-4 ${t.card}`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.chipNavy}`}
              >
                <Icon size={14} />
              </span>
              <div className="min-w-0">
                <p className={`truncate text-[14px] font-black ${t.heading}`}>
                  {label}
                </p>
                <p className={`truncate text-[12px] ${t.muted}`}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PaymentModal
        show={showModal}
        plan={selectedPlan}
        billingPeriod={billingPeriod}
        isDark={isDark}
        planType={planType}
        onClose={() => setShowModal(false)}
        onComplete={handlePaymentComplete}
        userData={user}
        isUpgradePage={true}
      />
    </div>
  );
}
