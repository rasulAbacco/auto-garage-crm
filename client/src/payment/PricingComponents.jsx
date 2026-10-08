import React, { useState } from "react";
import {
  FiCheck,
  FiZap,
  FiStar,
  FiAward,
  FiChevronRight,
  FiArrowRight,
  FiActivity,
  FiCpu,
  FiShield,
  FiUsers,
  FiClock,
  FiUser,
  FiTerminal,
  FiTruck,
  FiSettings,
  FiPercent,
} from "react-icons/fi";

// --- SUBSCRIPTION PRICE HELPER ---
// 1 month  -> fixed price, no discount
// 2+ months -> region multi-month discount (10% urban / 5% rural)
export const MONTH_OPTIONS = [1, 3, 6, 12];
export const MAX_MONTHS = 24;

export const calcSubscription = (monthlyPrice, months = 1, discount = 0.1) => {
  const m = Math.max(1, Math.min(MAX_MONTHS, Number(months) || 1));
  const price = Number(monthlyPrice) || 0;
  const discountRate = m > 1 ? discount : 0;
  const subtotal = price * m;
  const discountAmount = Math.round(subtotal * discountRate);
  const total = subtotal - discountAmount;
  return {
    months: m,
    subtotal,
    discountRate,
    discountPct: Math.round(discountRate * 100),
    discountAmount,
    total,
    effectiveMonthly: Math.round(total / m),
  };
};

// --- HERO COMPONENT ---
export const Hero = ({
  isDark,
  billingPeriod,
  setBillingPeriod,
  planType,
  setPlanType,
  region = "urban",
  setRegion = () => {},
  regionConfig = { label: "Urban Cities", multiMonthDiscount: 0.1 },
  freeTrialDays = 30,
  months = 1,
  setMonths = () => {},
}) => {
  const discountPct = Math.round((regionConfig.multiMonthDiscount || 0) * 100);
  const offers = [
    {
      icon: FiClock,
      title: `${freeTrialDays} Days Free Trial`,
      desc: "On Premium & Customise packages",
    },
    {
      icon: FiPercent,
      title: `${discountPct}% Discount`,
      desc: "On subscriptions longer than 1 month",
    },
    ...(regionConfig.customiseWebsitePerk
      ? [
          {
            icon: FiAward,
            title: "Website Free For 1 Year",
            desc: `With Customise · Domain ₹${Number(regionConfig.domainCharge || 0).toLocaleString("en-IN")} paid by client`,
          },
        ]
      : []),
  ];

  return (
  <section className="relative z-10 px-6 py-12 sm:py-20">
    <div className="max-w-7xl mx-auto text-center space-y-10 w-full">
      {/* Category Tag */}
      <span className="text-[#001F3F] font-black text-[10px] uppercase tracking-[0.4em] block mb-2">
        Pricing Plans
      </span>
      <div className="space-y-4">
        <h1
          className={`text-5xl lg:text-7xl font-black uppercase ${isDark ? "text-white" : "text-[#001F3F]"}`}
        >
          Flexible Pricing for <br />
          <span className="font-light italic lowercase">
            Every Service Type.
          </span>
        </h1>
      </div>

      {/* Region Selector Tab */}
      <div className="inline-grid grid-cols-2 bg-[#F8FAFC] p-1.5 rounded-2xl border border-[#CBD5E1] w-full max-w-sm mx-auto gap-1 shadow-inner">
        {[
          { id: "urban", label: "Urban Cities" },
          { id: "rural", label: "Rural Areas" },
        ].map((r) => (
          <button
            key={r.id}
            onClick={() => setRegion(r.id)}
            className={`px-4 sm:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${region === r.id
                ? "bg-[#001F3F] text-white shadow-xl"
                : "text-slate-400 hover:text-[#001F3F]"
              }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* --- Region Offers Banner --- */}
      <div className="max-w-7xl mx-auto relative group">
        <div
          className={`p-8 md:p-10 rounded-[2.5rem] border-2 overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 transition-all duration-500 ${isDark
              ? "bg-[#001F3F] border-white/10 shadow-2xl text-white"
              : "bg-[#001F3F] border-[#001F3F] text-white shadow-xl"
            }`}
        >
          {/* Decorative Background Icon */}
          <FiCpu className="absolute right-[-5%] top-[-10%] w-64 h-64 opacity-5 pointer-events-none" />

          <div className="relative z-10 text-center lg:text-left">
            <div className="inline-flex items-center bg-emerald-500 px-3 py-1 rounded-md mb-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-white">
                {regionConfig.label} Offers
              </span>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight italic">
              Start Free. Save More.
            </h3>
          </div>

          <div
            className={`relative z-10 grid grid-cols-1 ${offers.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-4 w-full lg:w-auto`}
          >
            {offers.map((o, i) => (
              <div
                key={i}
                className="border-2 border-white/20 bg-white/5 backdrop-blur-md p-5 rounded-2xl min-w-[200px] text-center"
              >
                <o.icon size={20} className="mx-auto mb-2 text-emerald-400" />
                <p className="text-sm font-black italic uppercase tracking-tight text-white">
                  {o.title}
                </p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-blue-100/60 mt-1 leading-relaxed">
                  {o.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Selector Tab */}
      <div className="mt-12 inline-grid grid-cols-2 sm:flex bg-[#F8FAFC] p-1.5 rounded-2xl border border-[#CBD5E1] w-full max-w-sm sm:max-w-max mx-auto gap-1 sm:gap-0 shadow-inner">
        {["car", "bike", "washing"].map((type) => (
          <button
            key={type}
            onClick={() => setPlanType(type)}
            className={`px-4 sm:px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${planType === type
                ? "bg-[#001F3F] text-white shadow-xl scale-[1.02] sm:scale-100"
                : "text-slate-400 hover:text-[#001F3F]"
              } ${type === "washing" ? "col-span-2 sm:col-span-1" : ""}`}
          >
            {type} CRM
          </button>
        ))}
      </div>

      {/* Subscription Months Selector */}
      <div className="flex flex-col items-center gap-4">
        <span
          className={`text-[11px] font-black uppercase tracking-widest ${isDark ? "text-white" : "text-[#001F3F]"}`}
        >
          Subscription Duration
        </span>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* Quick picks */}
          <div className="inline-flex bg-[#F8FAFC] p-1.5 rounded-2xl border border-[#CBD5E1] gap-1 shadow-inner">
            {MONTH_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={`px-4 sm:px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${months === m
                    ? "bg-[#001F3F] text-white shadow-xl"
                    : "text-slate-400 hover:text-[#001F3F]"
                  }`}
              >
                {m} {m === 1 ? "Month" : "Months"}
              </button>
            ))}
          </div>

          {/* Custom count stepper */}
          <div className="inline-flex items-center bg-[#F8FAFC] p-1.5 rounded-2xl border border-[#CBD5E1] shadow-inner">
            <button
              onClick={() => setMonths(Math.max(1, months - 1))}
              disabled={months <= 1}
              aria-label="Decrease months"
              className="w-10 h-10 rounded-xl text-lg font-black text-[#001F3F] hover:bg-white disabled:opacity-30 transition-all"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={MAX_MONTHS}
              value={months}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setMonths(Number.isNaN(v) ? 1 : Math.max(1, Math.min(MAX_MONTHS, v)));
              }}
              aria-label="Number of months"
              className="w-14 text-center bg-transparent text-sm font-black text-[#001F3F] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              onClick={() => setMonths(Math.min(MAX_MONTHS, months + 1))}
              disabled={months >= MAX_MONTHS}
              aria-label="Increase months"
              className="w-10 h-10 rounded-xl text-lg font-black text-[#001F3F] hover:bg-white disabled:opacity-30 transition-all"
            >
              +
            </button>
          </div>
        </div>

        <span
          className={`text-[10px] font-black uppercase tracking-widest ${months > 1 ? "text-green-600" : "text-slate-400"}`}
        >
          {months > 1
            ? `${discountPct}% discount applied for ${months} months`
            : `1 month at fixed price · choose 2+ months to save ${discountPct}%`}
        </span>
      </div>
    </div>
  </section>
  );
};

// --- PRICING CARD COMPONENT ---
export const PricingCard = ({
  plan,
  billingPeriod,
  months: monthsProp,
  isDark,
  onSelect,
  isPopular,
}) => {
  const Icon = plan.icon;
  const isTrial = plan.freeTrial ?? plan?.name?.toLowerCase().includes("basic");
  const months = monthsProp ?? (billingPeriod === "yearly" ? 12 : 1);

  // 1 month = fixed price; 2+ months = region discount (10% urban / 5% rural)
  const discount = plan.multiMonthDiscount ?? 0.1;
  const discountPct = Math.round(discount * 100);
  const monthlyPrice = plan.numericPrice;
  const sub = calcSubscription(monthlyPrice, months, discount);
  const isMulti = sub.months > 1;
  const effectiveMonthly = sub.effectiveMonthly;
  const lightSurface = isPopular || !isDark;
  const fmt = (n) => Number(n).toLocaleString("en-IN");

  return (
    <div className="relative h-full flex flex-col">
      {/* Plan Ribbon Badge */}
      {plan.badge && (
        <div className="absolute -top-3 left-6 z-20">
          <div className="px-5 py-1.5 rounded-md bg-[#001F3F] text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-md border border-white/10">
            {plan.badge}
          </div>
        </div>
      )}

      <div
        className={`h-full rounded-[2rem] border-2 p-10 flex flex-col transition-all duration-300 ${isPopular
            ? "border-[#001F3F] shadow-2xl bg-white scale-[1.02]"
            : isDark
              ? "bg-[#000814] border-slate-800"
              : "bg-white border-slate-100 shadow-sm"
          }`}
      >
        <div className="flex justify-between items-start mb-10">
          <div
            className={`p-4 rounded-xl ${lightSurface ? "bg-slate-50 text-[#001F3F]" : "bg-slate-800 text-white"}`}
          >
            <Icon size={24} />
          </div>
          <div className="text-right">
            <h3
              className={`text-sm font-black uppercase tracking-widest ${lightSurface ? "text-[#001F3F]" : "text-white"}`}
            >
              {plan.name}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {plan.tagline}
            </p>
          </div>
        </div>

        {/* --- Pricing Interface --- */}
        <div className="mb-4 flex items-baseline gap-2 flex-wrap">
          <span
            className={`text-5xl font-black tracking-tighter ${lightSurface ? "text-[#001F3F]" : "text-white"}`}
          >
            ₹{fmt(effectiveMonthly)}
          </span>

          {/* Regular monthly price struck-through when the multi-month discount applies */}
          {isMulti && (
            <span className="text-xl font-bold text-slate-400 line-through opacity-60 tracking-tight">
              ₹{fmt(monthlyPrice)}
            </span>
          )}

          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            /Month
          </span>
        </div>

        <p className="-mt-2 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {isMulti ? (
            <>
              Total ₹{fmt(sub.total)} for {sub.months} months{" "}
              <span className="text-green-600">(You save ₹{fmt(sub.discountAmount)})</span>
            </>
          ) : (
            <>Total ₹{fmt(sub.total)} for 1 month</>
          )}
        </p>

        {/* Informative Trial / Offer Tags */}
        <div className="mb-10 flex flex-wrap gap-2">
          {isTrial && (
            <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
              30 Days Free Trial
            </span>
          )}
          {plan.websitePerk && (
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
              Website Free 1 Year
            </span>
          )}
          <span className="text-[9px] font-black uppercase tracking-wider text-green-600 bg-green-50 px-2 py-1 rounded-md">
            {discountPct}% Off On Multi-Month
          </span>
        </div>

        <ul className="space-y-5 mb-12 flex-1">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <FiCheck className="text-green-500 stroke-[4]" size={16} />
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${lightSurface ? "text-[#001F3F]" : "text-slate-300"}`}
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* --- Button Design --- */}
        <button
          onClick={() => onSelect(plan)}
          className={`w-full py-5 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all border-2 flex items-center justify-center gap-3 shadow-lg active:scale-95 ${isPopular
              ? "bg-[#001F3F] border-[#001F3F] text-white hover:bg-black"
              : isDark
                ? "bg-transparent border-slate-800 text-white hover:bg-slate-800"
                : "bg-white border-slate-200 text-[#001F3F] hover:border-black"
            }`}
        >
          Select {plan.name} Plan <FiArrowRight className="opacity-50" />
        </button>
      </div>
    </div>
  );
};

// --- TRUST FEATURES SECTION ---
export const TrustSection = ({ isDark }) => (
  <section
    className={`py-20 px-6 border-y ${isDark ? "bg-[#000814] border-slate-800" : "bg-slate-50 border-slate-100"}`}
  >
    <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
      {[
        { icon: FiShield, label: "Secure", desc: "Fully Encrypted Data" },
        { icon: FiActivity, label: "Reliable", desc: "24/7 Customer Support" },
        { icon: FiAward, label: "Guaranteed", desc: "Money-Back Policy" },
        { icon: FiClock, label: "Instant", desc: "Quick Account Setup" },
      ].map((item, i) => (
        <div key={i} className="space-y-2 group">
          <item.icon
            className={`mx-auto transition-colors ${isDark ? "text-slate-400 group-hover:text-white" : "text-slate-400 group-hover:text-[#001F3F]"}`}
            size={24}
          />
          <p
            className={`text-[11px] font-black uppercase tracking-[0.3em] ${isDark ? "text-white" : "text-[#001F3F]"}`}
          >
            {item.label}
          </p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">
            {item.desc}
          </p>
        </div>
      ))}
    </div>
  </section>
);

// --- TESTIMONIALS SECTION ---
export const TestimonialSection = ({ isDark }) => {
  const testimonials = [
    {
      name: "R. Kumar",
      role: "Business Owner",
      icon: <FiUser />,
      text: "Greatly improved our team's daily efficiency. The automated scanning is excellent.",
    },
    {
      name: "P. Sharma",
      role: "Operations Manager",
      icon: <FiTerminal />,
      text: "Outstanding customer service. Our account setup was finished in no time.",
    },
    {
      name: "A. Patel",
      role: "System Administrator",
      icon: <FiSettings />,
      text: "The software is highly dependable and easy to manage. The return on investment is clear.",
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2
            className={`text-3xl font-black uppercase tracking-tighter ${isDark ? "text-white" : "text-[#001F3F]"}`}
          >
            Trusted by{" "}
            <span className="font-light italic lowercase">thousands.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`p-10 rounded-[1.5rem] border-2 transition-all hover:-translate-y-2 ${isDark
                  ? "bg-[#001F3F]/10 border-slate-800"
                  : "bg-white border-slate-100 shadow-xl shadow-slate-100"
                }`}
            >
              <div className="flex items-center gap-5 mb-8">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${isDark
                      ? "bg-slate-800 text-white"
                      : "bg-slate-50 text-[#001F3F] border border-slate-100 shadow-inner"
                    }`}
                >
                  {t.icon}
                </div>
                <div>
                  <p
                    className={`text-xs font-black uppercase italic ${isDark ? "text-white" : "text-[#001F3F]"}`}
                  >
                    {t.name}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {t.role}
                  </p>
                </div>
              </div>
              <p
                className={`text-[10px] font-black uppercase tracking-widest leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                "{t.text}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- STATS SECTION ---
export const StatsSection = ({ isDark }) => (
  <section className="py-24 px-6">
    <div
      className={`max-w-7xl mx-auto rounded-[2rem] p-12 border ${isDark ? "bg-[#001F3F] border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
        {[
          { label: "Active Businesses", val: "50K+" },
          { label: "Platform Uptime", val: "99.9%" },
          { label: "User Rating", val: "4.9/5" },
          { label: "System Speed", val: "<10ms" },
        ].map((stat, i) => (
          <div key={i}>
            <div
              className={`text-4xl font-black mb-1 uppercase ${isDark ? "text-white" : "text-[#001F3F]"}`}
            >
              {stat.val}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// --- FAQ SECTION ---
export const FAQSection = ({ isDark }) => {
  const [open, setOpen] = useState(null);
  const faqs = [
    {
      question: "Can I change my plan later?",
      answer:
        "Yes! You can upgrade or downgrade your plan tier at any time directly from your dashboard settings.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We support UPI, all major credit/debit cards, and net banking options.",
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <h2
          className={`text-2xl font-black uppercase tracking-tighter italic mb-12 text-center ${isDark ? "text-white" : "text-[#001F3F]"}`}
        >
          Frequently Asked{" "}
          <span className="font-light italic lowercase">Questions (FAQ).</span>
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`rounded-xl border transition-all ${isDark ? "border-slate-800 bg-[#001F3F]/10" : "border-slate-100 bg-white"}`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full p-6 text-left flex justify-between items-center group"
              >
                <span
                  className={`text-[11px] font-black uppercase tracking-widest ${isDark ? "text-white" : "text-[#001F3F]"}`}
                >
                  {faq.question}
                </span>
                <FiChevronRight
                  className={`transition-transform duration-300 ${open === i ? "rotate-90" : ""} text-slate-400`}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};