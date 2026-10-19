import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import {
  FiCheckCircle,
  FiCalendar,
  FiUser,
  FiCreditCard,
  FiClock,
  FiActivity,
  FiArrowUpCircle,
  FiChevronDown,
  FiAlertTriangle,
  FiXCircle,
  FiZap,
} from "react-icons/fi";
import { tk, btnBase, PageHeading } from "../clients/components/clientUi";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

const fmtDate = (
  d,
  opts = { day: "numeric", month: "short", year: "numeric" },
) => {
  if (!d) return "N/A";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? "N/A"
    : dt.toLocaleDateString("en-IN", opts);
};
const inr = (v) =>
  v === null || v === undefined || v === ""
    ? "—"
    : `₹${Number(v).toLocaleString("en-IN")}`;

const getUpgradePath = (crmType) => {
  switch (crmType) {
    case "bike":
      return "/bike-plans";
    case "wash":
      return "/washing-upgrade";
    case "car":
    default:
      return "/upgrade";
  }
};

const STATUS_STYLE = {
  TRIAL: {
    pill: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    bar: "bg-amber-500",
    icon: FiZap,
    label: "Free trial",
  },
  ACTIVE: {
    pill: "border-green-500/30 bg-green-500/10 text-green-600",
    bar: "bg-green-500",
    icon: FiCheckCircle,
    label: "Active",
  },
  CANCELLED: {
    pill: "border-red-500/30 bg-red-500/10 text-red-500",
    bar: "bg-red-500",
    icon: FiXCircle,
    label: "Cancelled",
  },
  EXPIRED: {
    pill: "border-red-500/30 bg-red-500/10 text-red-500",
    bar: "bg-red-500",
    icon: FiAlertTriangle,
    label: "Expired",
  },
  PENDING: {
    pill: "border-slate-500/30 bg-slate-500/10 text-slate-500",
    bar: "bg-slate-400",
    icon: FiClock,
    label: "Pending",
  },
};
const styleFor = (s) =>
  STATUS_STYLE[s] || { ...STATUS_STYLE.PENDING, label: s || "Pending" };

export default function Plans() {
  const { isDark } = useTheme();
  const t = tk(isDark);
  const [planInfo, setPlanInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openIndex, setOpenIndex] = useState(null);

  let userEmail;
  try {
    userEmail = JSON.parse(localStorage.getItem("user"))?.email;
  } catch {
    userEmail = undefined;
  }

  useEffect(() => {
    if (!userEmail) {
      setError("We couldn't find your account email. Please sign in again.");
      setLoading(false);
      return;
    }
    const loadPlan = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/payments/user-plan/${encodeURIComponent(userEmail)}`,
        );
        const data = await res.json();
        if (data.currentPlan || data.previousPlan) {
          setPlanInfo({
            current: data.currentPlan,
            previous: data.previousPlan,
            history: data.history || [],
          });
          setError(null);
        } else {
          setError(data.message || "No plans found");
        }
      } catch {
        setError("Failed to fetch plan info");
      } finally {
        setLoading(false);
      }
    };
    loadPlan();
  }, [userEmail]);

  return (
    <div className="min-h-screen lg:ml-16">
      <div className="mx-auto max-w-[1200px] space-y-4 sm:space-y-5">
        <PageHeading
          isDark={isDark}
          title="Plan &"
          accent="billing."
          subtitle="Your MotorDesk subscription, renewal date and payment history."
        />

        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className={`h-40 animate-pulse rounded-2xl border-2 ${isDark ? "border-white/5 bg-white/5" : "border-[#E2E8F0] bg-white"}`}
              />
            ))}
          </div>
        ) : !planInfo ? (
          <div
            className={`flex flex-col items-center rounded-2xl border-2 px-4 py-14 text-center ${t.card}`}
          >
            <div
              className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${t.chipNavy}`}
            >
              <FiCreditCard size={20} />
            </div>
            <h2
              className={`text-[14px] font-black uppercase tracking-tight ${t.heading}`}
            >
              No active{" "}
              <span className="font-light lowercase italic">plan</span>
            </h2>
            <p className={`mt-1 max-w-sm text-[14px] ${t.muted}`}>
              {error || "Subscribe to a plan to see the details here."}
            </p>
            <Link
              to={getUpgradePath(localStorage.getItem("crmType"))}
              className={`${btnBase} mt-4 h-10 px-5 ${t.btnPrimary}`}
            >
              <FiArrowUpCircle size={14} /> See plans
            </Link>
          </div>
        ) : (
          <>
            {planInfo.current && (
              <PlanCard
                title="Current plan"
                data={planInfo.current}
                isDark={isDark}
                isActive
              />
            )}
            {planInfo.previous && (
              <PlanCard
                title="Previous plan"
                data={planInfo.previous}
                isDark={isDark}
                isActive={false}
              />
            )}

            {planInfo.history?.length > 0 && (
              <section
                className={`overflow-hidden rounded-2xl border-2 ${t.card}`}
              >
                <div
                  className={`flex items-center gap-3 border-b-2 px-3 py-3 sm:px-4 ${t.cardHead}`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${t.chipNavy}`}
                  >
                    <FiClock size={14} />
                  </div>
                  <div>
                    <h2
                      className={`text-[14px] font-black uppercase tracking-tight ${t.heading}`}
                    >
                      Billing{" "}
                      <span className="font-light lowercase italic">
                        history
                      </span>
                    </h2>
                    <p className={`text-[12px] ${t.muted}`}>
                      {planInfo.history.length} payment
                      {planInfo.history.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div>
                  {planInfo.history.map((item, index) => (
                    <HistoryItem
                      key={item.id || item.paymentId || index}
                      item={item}
                      isOpen={openIndex === index}
                      toggle={() =>
                        setOpenIndex(openIndex === index ? null : index)
                      }
                      isDark={isDark}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- plan card ---------- */
function PlanCard({ title, data, isDark, isActive }) {
  const t = tk(isDark);
  const status = data.status || "PENDING";
  const isTrial = status === "TRIAL";

  const endDateRaw = isTrial
    ? data.trialEndDate
    : data.nextBillingDate || data.expiryDate;
  const today = new Date();
  const end = endDateRaw ? new Date(endDateRaw) : null;
  const start = new Date(data.createdAt);

  let daysRemaining = 0;
  let progressPercent = 0;
  let shownStatus = status;

  if (end && !Number.isNaN(end.getTime())) {
    const total = end - start;
    daysRemaining = Math.ceil((end - today) / 86400000);
    if (total > 0)
      progressPercent = Math.min(
        100,
        Math.max(0, ((today - start) / total) * 100),
      );
    if (daysRemaining < 0) {
      shownStatus = "EXPIRED";
      daysRemaining = 0;
      progressPercent = 100;
    }
  }

  const st = styleFor(shownStatus);
  const StIcon = st.icon;
  const expiringSoon = isActive && end && daysRemaining <= 3;
  const crmType = localStorage.getItem("crmType");

  const details = [
    { icon: FiUser, label: "Customer", value: data.customerName || "N/A" },
    {
      icon: FiCreditCard,
      label: isTrial ? "Trial value" : "Amount paid",
      value: inr(data.amount),
    },
    {
      icon: FiCalendar,
      label: isTrial ? "Trial started" : "Payment date",
      value: fmtDate(isTrial ? data.createdAt : data.paidAt || data.createdAt),
    },
    {
      icon: FiClock,
      label: isTrial ? "Trial ends on" : "Next payment / expiry",
      value: fmtDate(endDateRaw),
      warn: expiringSoon,
    },
    {
      icon: FiActivity,
      label: "Billing period",
      value: data.billingPeriod || "Monthly",
    },
    {
      icon: FiCheckCircle,
      label: "Payment status",
      value: data.paidAt ? "Successful" : isTrial ? "Free trial" : "Pending",
    },
  ];

  return (
    <section
      className={`overflow-hidden rounded-2xl border-2 ${t.card} ${isActive ? "" : "opacity-80"}`}
    >
      {/* navy hero strip */}
      <div
        className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${isActive ? "bg-[#001F3F] text-white" : t.cardHead}`}
      >
        <div className="min-w-0">
          <p
            className={`text-[12px] font-bold uppercase tracking-[0.2em] ${isActive ? "text-white/60" : "text-slate-400"}`}
          >
            {title}
          </p>
          <h2
            className={`truncate text-[16px] font-black uppercase tracking-tight ${isActive ? "text-white" : t.heading}`}
          >
            {data.plan}{" "}
            {isTrial && (
              <span className="font-light lowercase italic">trial</span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
          <span
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[12px] font-black uppercase tracking-wider ${isActive ? "border-white/20 bg-white/10 text-white" : st.pill}`}
          >
            <StIcon size={12} /> {st.label}
          </span>
          {isActive && end && shownStatus !== "EXPIRED" && (
            <span
              className={`text-[12px] font-bold ${expiringSoon ? "text-amber-300" : "text-white/70"}`}
            >
              {daysRemaining} day{daysRemaining === 1 ? "" : "s"} left
            </span>
          )}
        </div>
      </div>

      {isActive && end && (
        <div
          className={`h-1.5 w-full ${isDark ? "bg-white/10" : "bg-[#E2E8F0]"}`}
        >
          <div
            className={`h-full transition-all duration-500 ${st.bar}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 p-3 sm:p-4 lg:grid-cols-3">
        {details.map(({ icon: Icon, label, value, warn }) => (
          <div
            key={label}
            className={`flex min-w-0 items-start gap-2.5 rounded-xl border-2 p-2.5 ${warn ? "border-red-500/40 bg-red-500/10" : t.inner}`}
          >
            <Icon
              size={14}
              className={`mt-0.5 shrink-0 ${warn ? "text-red-500" : "text-slate-400"}`}
            />
            <div className="min-w-0">
              <p className="truncate text-[12px] font-bold uppercase tracking-wider text-slate-400">
                {label}
              </p>
              <p
                className={`truncate text-[14px] font-black ${warn ? "text-red-500" : t.heading}`}
              >
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {isTrial && isActive && (
        <div
          className={`mx-3 mb-3 flex flex-col gap-3 rounded-xl border-2 border-amber-500/30 bg-amber-500/10 p-3 sm:mx-4 sm:mb-4 sm:flex-row sm:items-center sm:justify-between`}
        >
          <div className="flex items-start gap-2.5">
            <FiArrowUpCircle
              size={16}
              className="mt-0.5 shrink-0 text-amber-600"
            />
            <div>
              <p className={`text-[14px] font-black ${t.heading}`}>
                Your trial ends{" "}
                {daysRemaining
                  ? `in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`
                  : "soon"}
              </p>
              <p className={`text-[12px] ${t.muted}`}>
                Upgrade now to keep your data and every feature.
              </p>
            </div>
          </div>
          <Link
            to={getUpgradePath(crmType)}
            className={`${btnBase} h-10 shrink-0 px-5 shadow-lg ${t.btnPrimary}`}
          >
            Upgrade plan
          </Link>
        </div>
      )}
    </section>
  );
}

/* ---------- history row ---------- */
function HistoryItem({ item, isOpen, toggle, isDark }) {
  const t = tk(isDark);
  const st = styleFor(item.status);
  return (
    <div className={`border-b-2 last:border-0 ${t.line}`}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        className={`flex w-full items-center gap-3 px-3 py-3 text-left transition sm:px-4 ${isDark ? "hover:bg-white/5" : "hover:bg-[#F8FAFC]"}`}
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.status === "ACTIVE" ? "bg-green-500/10 text-green-600" : `${t.inner} border text-slate-400`}`}
        >
          <FiCreditCard size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-[14px] font-black ${t.heading}`}>
            {item.plan}
          </p>
          <p className={`text-[12px] ${t.muted}`}>{fmtDate(item.createdAt)}</p>
        </div>
        <span
          className={`hidden rounded-lg border px-2 py-0.5 text-[12px] font-black uppercase tracking-wider sm:inline ${st.pill}`}
        >
          {st.label}
        </span>
        <span className={`font-mono text-[14px] font-black ${t.heading}`}>
          {inr(item.amount)}
        </span>
        <FiChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="px-3 pb-3 sm:px-4">
          <dl
            className={`grid grid-cols-2 gap-2 rounded-xl border-2 p-3 ${t.inner}`}
          >
            {[
              ["Payment ID", item.paymentId || "—"],
              ["Subscription ID", item.subscriptionId || "—"],
              ["Period", item.billingPeriod || "—"],
              ["Status", st.label],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                  {k}
                </dt>
                <dd
                  className={`break-all font-mono text-[12px] font-bold ${t.heading}`}
                >
                  {v}
                </dd>
              </div>
            ))}
            <p className={`col-span-2 text-[12px] ${t.muted}`}>
              Updated{" "}
              {item.updatedAt
                ? new Date(item.updatedAt).toLocaleString("en-IN")
                : "—"}
            </p>
          </dl>
        </div>
      )}
    </div>
  );
}
