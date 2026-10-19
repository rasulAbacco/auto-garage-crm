// Shared bits for the Marketplace pages (Bookings / Packages / Pricing) – MotorDesk navy theme.
// Put this file in the same folder as the three Marketplace pages.
// Text sizes used: 12px, 14px, 16px.
import React from "react";
import { FiAlertCircle, FiTruck, FiDroplet } from "react-icons/fi";
import { FaCar, FaMotorcycle } from "react-icons/fa";
import { tk } from "../clients/components/clientUi";

export {
  tk,
  btnBase,
  PageHeading,
  ConfirmDialog,
  fmtMoney,
} from "../clients/components/clientUi";

/* ---------- workspace detection (same rules as before, in one place) ---------- */
export function detectCrmType() {
  let type = "CAR";
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(window.atob(base64));
      if (payload?.crmType) type = String(payload.crmType).toUpperCase();
    } catch (e) {
      console.error("Token decoding failed:", e);
    }
  }

  const path = window.location.pathname.toLowerCase();
  const host = window.location.hostname;
  const stored = localStorage.getItem("crmType")?.toUpperCase();

  if (["CAR", "BIKE", "WASHING"].includes(stored)) type = stored;
  else if (path.includes("/bike") || host.includes("bike")) type = "BIKE";
  else if (path.includes("/wash") || host.includes("wash")) type = "WASHING";
  else if (path.includes("/car") || host.includes("car")) type = "CAR";

  return type;
}

export const CRM_META = {
  CAR: { label: "Car garage", icon: FaCar },
  BIKE: { label: "Bike garage", icon: FaMotorcycle },
  WASHING: { label: "Washing centre", icon: FiDroplet },
};

// Car shell already pads the page and needs room for the rail; bike / wash shells have no padding.
export const pageWrap = (crmType) =>
  crmType === "CAR"
    ? "min-h-screen lg:ml-20"
    : "min-h-screen p-3 sm:p-5 lg:p-6";

/* ---------- workspace chip ---------- */
export function CrmChip({ crmType, isDark }) {
  const m = CRM_META[crmType] || { label: crmType, icon: FiTruck };
  const Icon = m.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-black uppercase tracking-[0.15em] ${
        isDark
          ? "border-white/10 bg-white/5 text-white"
          : "border-[#CBD5E1] bg-white text-[#001F3F]"
      }`}
    >
      <Icon size={12} /> {m.label}
    </span>
  );
}

/* ---------- stat tile ---------- */
export function StatTile({
  isDark,
  title,
  value,
  icon: Icon,
  chip,
  className = "",
  onClick,
  active,
}) {
  const t = tk(isDark);
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`rounded-2xl border-2 p-3 text-left transition sm:p-4 ${t.card} ${onClick ? "hover:-translate-y-0.5" : ""} ${
        active ? (isDark ? "!border-white/40" : "!border-[#001F3F]") : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] font-bold uppercase leading-tight tracking-wider text-slate-400">
          {title}
        </p>
        {Icon && (
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${chip || t.chipNavy}`}
          >
            <Icon size={14} />
          </div>
        )}
      </div>
      <p
        className={`mt-2 truncate text-[16px] font-black tracking-tight ${t.heading}`}
      >
        {value}
      </p>
    </Tag>
  );
}

/* ---------- square switch ---------- */
export function Switch({ on, isDark, onClick, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={Boolean(on)}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-lg border-2 transition-colors disabled:opacity-50 ${
        on
          ? isDark
            ? "border-white bg-white"
            : "border-[#001F3F] bg-[#001F3F]"
          : isDark
            ? "border-white/10 bg-white/10"
            : "border-[#CBD5E1] bg-[#E2E8F0]"
      }`}
    >
      <span
        className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-md shadow transition-all ${
          on
            ? `left-[22px] ${isDark ? "bg-[#001F3F]" : "bg-white"}`
            : `left-0.5 ${isDark ? "bg-slate-400" : "bg-white"}`
        }`}
      />
    </button>
  );
}

/* ---------- live / off pill (no dot) ---------- */
export function LivePill({ on, onText = "Live", offText = "Off" }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[12px] font-black uppercase tracking-wider ${
        on
          ? "border-green-500/30 bg-green-500/10 text-green-600"
          : "border-slate-500/30 bg-slate-500/10 text-slate-500"
      }`}
    >
      {on ? onText : offText}
    </span>
  );
}

/* ---------- banners / empty / loading ---------- */
export function ErrorBar({ message, onDismiss, onRetry }) {
  if (!message) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-red-500/30 bg-red-500/10 px-4 py-3 text-[14px] font-semibold text-red-500">
      <span className="flex min-w-0 items-center gap-2">
        <FiAlertCircle size={16} className="shrink-0" />
        <span className="break-words">{message}</span>
      </span>
      <span className="flex shrink-0 gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-[12px] font-black uppercase tracking-wider hover:underline"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-[12px] font-black uppercase tracking-wider hover:underline"
          >
            Dismiss
          </button>
        )}
      </span>
    </div>
  );
}

export function EmptyState({ isDark, icon: Icon, title, text, action }) {
  const t = tk(isDark);
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border-2 px-4 py-12 text-center ${t.card}`}
    >
      {Icon && (
        <div
          className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border-2 text-slate-400 ${t.inner}`}
        >
          <Icon size={20} />
        </div>
      )}
      <h3
        className={`text-[14px] font-black uppercase tracking-tight ${t.heading}`}
      >
        {title}
      </h3>
      {text && <p className={`mt-1 max-w-sm text-[14px] ${t.muted}`}>{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SkeletonCards({ isDark, rows = 3, h = "h-28" }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`${h} animate-pulse rounded-2xl border-2 ${isDark ? "border-white/5 bg-white/5" : "border-[#E2E8F0] bg-white"}`}
        />
      ))}
    </div>
  );
}

export const inr = (v) =>
  `₹${(Number(v) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
export const errText = (e, fallback) =>
  e?.response?.data?.message || e?.message || fallback;
