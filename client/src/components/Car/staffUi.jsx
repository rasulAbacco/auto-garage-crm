// client/src/components/Car/staffUi.jsx
// Shared bits for the Car staff + payroll pages – MotorDesk navy theme.
// Builds on the client-page design file. Text sizes used: 12px, 14px, 16px.
import React, { useState } from "react";
import { CheckCircle2, Clock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { tk, FieldLabel } from "../../pages/clients/components/clientUi";

export {
  tk,
  btnBase,
  Modal,
  ConfirmDialog,
  PageHeading,
  TextField,
  FieldLabel,
  fmtDate,
} from "../../pages/clients/components/clientUi";

/* ---------- helpers ---------- */
export const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export const inr = (v) => `₹${Math.round(n(v)).toLocaleString("en-IN")}`;

export const initials = (name = "") =>
  String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
].map((label, i) => ({ label, value: i + 1 }));

export const monthName = (m) =>
  MONTHS.find((x) => x.value === Number(m))?.label || "";

export const staffCode = (id) => `#${String(id ?? "").padStart(4, "0")}`;

/* ---------- avatar (navy initials) ---------- */
export function Avatar({ name, isDark, size = "md" }) {
  const box =
    size === "lg"
      ? "h-12 w-12 text-[16px]"
      : size === "sm"
        ? "h-8 w-8 text-[12px]"
        : "h-10 w-10 text-[14px]";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl font-black tracking-wider ${box} ${
        isDark ? "bg-white text-[#001F3F]" : "bg-[#001F3F] text-white"
      }`}
    >
      {initials(name)}
    </div>
  );
}

/* ---------- stat tile ---------- */
export function StatTile({
  isDark,
  title,
  value,
  sub,
  icon: Icon,
  chip,
  className = "",
}) {
  const t = tk(isDark);
  return (
    <div className={`rounded-2xl border-2 p-3 sm:p-4 ${t.card} ${className}`}>
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
      {sub && <p className={`text-[12px] font-medium ${t.muted}`}>{sub}</p>}
    </div>
  );
}

/* ---------- salary status pill ---------- */
const STATUS = {
  PAID: {
    cls: "bg-green-500/10 text-green-600 border-green-500/30",
    icon: CheckCircle2,
    label: "Paid",
  },
  HOLD: {
    cls: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    icon: Clock,
    label: "On hold",
  },
  UNPAID: {
    cls: "bg-red-500/10 text-red-500 border-red-500/30",
    icon: AlertCircle,
    label: "Unpaid",
  },
};

export function StatusPill({ status }) {
  const s = STATUS[String(status || "").toUpperCase()] || STATUS.UNPAID;
  const Icon = s.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg border px-2 py-0.5 text-[12px] font-black uppercase tracking-wider ${s.cls}`}
    >
      <Icon size={12} />
      {s.label}
    </span>
  );
}

/* ---------- empty / error states ---------- */
export function EmptyState({ isDark, icon: Icon, title, text, action }) {
  const t = tk(isDark);
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      {Icon && (
        <div
          className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border-2 ${t.inner} text-slate-400`}
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

export function ErrorBar({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-red-500/30 bg-red-500/10 px-4 py-3 text-[14px] font-semibold text-red-500">
      <span className="flex items-center gap-2">
        <AlertCircle size={16} className="shrink-0" />
        {message}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 text-[12px] font-black uppercase tracking-wider hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/* ---------- loading rows ---------- */
export function SkeletonRows({ isDark, rows = 4 }) {
  return (
    <div className="space-y-2 p-3 sm:p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`h-14 animate-pulse rounded-xl ${isDark ? "bg-white/5" : "bg-[#F8FAFC]"}`}
        />
      ))}
    </div>
  );
}

/* ---------- password field with show/hide ---------- */
export function PasswordField({
  isDark,
  label,
  icon,
  required,
  className = "",
  ...props
}) {
  const t = tk(isDark);
  const [show, setShow] = useState(false);
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <FieldLabel
          icon={icon}
          label={label}
          required={required}
          isDark={isDark}
        />
      )}
      <div className="relative">
        <input
          {...props}
          required={required}
          type={show ? "text" : "password"}
          className={`h-11 w-full rounded-xl border-2 px-3.5 pr-11 text-[14px] font-semibold outline-none transition ${t.input}`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:text-slate-200"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

/* ---------- small numeric input (payroll grid) ---------- */
export function MiniNumber({ isDark, className = "", ...props }) {
  const t = tk(isDark);
  return (
    <input
      type="number"
      min="0"
      inputMode="decimal"
      {...props}
      className={`h-9 w-full rounded-lg border-2 px-2.5 text-[14px] font-semibold outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${t.input} ${className}`}
    />
  );
}
