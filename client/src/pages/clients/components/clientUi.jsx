// client/src/pages/clients/components/clientUi.jsx
// Shared UI pieces for the Car client pages – MotorDesk navy theme.
// Text sizes used: 12px, 14px, 16px.
import React, { useState } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";
import { FaCar } from "react-icons/fa";

/* ---------- helpers ---------- */
export const toCode = (v = "") =>
  String(v)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

export const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt)
    ? "—"
    : dt.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

export const fmtMoney = (n) =>
  `₹${(Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const statusClass = (s = "") => {
  const k = String(s).toLowerCase();
  if (["paid", "completed", "done", "delivered"].some((x) => k.includes(x)))
    return "bg-green-500/10 text-green-600 border-green-500/30";
  if (
    ["progress", "pending", "partial", "unpaid", "open"].some((x) =>
      k.includes(x),
    )
  )
    return "bg-amber-500/10 text-amber-600 border-amber-500/30";
  if (["cancel", "overdue", "reject"].some((x) => k.includes(x)))
    return "bg-red-500/10 text-red-500 border-red-500/30";
  return "bg-slate-500/10 text-slate-500 border-slate-500/30";
};

/* ---------- theme tokens ---------- */
export const tk = (isDark) =>
  isDark
    ? {
        card: "bg-[#001F3F] border-white/5 shadow-2xl shadow-black/20",
        cardHead: "bg-white/5 border-white/5",
        inner: "bg-white/5 border-white/10",
        line: "border-white/5",
        heading: "text-white",
        body: "text-slate-300",
        muted: "text-slate-400",
        input:
          "bg-white/5 border-white/10 text-white placeholder-slate-500 focus:border-white/40 focus:bg-white/10",
        chipNavy: "bg-white text-[#001F3F]",
        btnPrimary: "bg-white text-[#001F3F] hover:bg-blue-50",
        btnGhost: "border-white/10 text-slate-200 hover:bg-white/5",
        hoverRow: "hover:bg-white/10",
        menu: "bg-[#000814] border-white/10",
        option: "hover:bg-white/10 text-white",
      }
    : {
        card: "bg-white border-[#CBD5E1] shadow-sm",
        cardHead: "bg-[#F8FAFC] border-[#CBD5E1]",
        inner: "bg-[#F8FAFC] border-[#E2E8F0]",
        line: "border-[#CBD5E1]",
        heading: "text-[#001F3F]",
        body: "text-slate-600",
        muted: "text-slate-500",
        input:
          "bg-[#F8FAFC] border-[#CBD5E1] text-[#001F3F] placeholder-slate-400 focus:border-[#001F3F] focus:bg-white",
        chipNavy: "bg-[#001F3F] text-white",
        btnPrimary: "bg-[#001F3F] text-white hover:bg-black",
        btnGhost: "border-[#CBD5E1] text-[#001F3F] hover:bg-[#F8FAFC]",
        hoverRow: "hover:border-[#001F3F]/40",
        menu: "bg-white border-[#CBD5E1]",
        option: "hover:bg-[#F8FAFC] text-[#001F3F]",
      };

export const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-xl text-[12px] font-black uppercase tracking-[0.15em] transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";

/* ---------- section card ---------- */
export function SectionCard({
  isDark,
  icon: Icon,
  step,
  title,
  subtitle,
  right,
  children,
  bodyClass = "p-4 sm:p-5",
  className = "",
}) {
  const t = tk(isDark);
  return (
    <section
      className={`overflow-hidden rounded-2xl border-2 ${t.card} ${className}`}
    >
      <div
        className={`flex items-center gap-3 border-b-2 px-4 py-3 sm:px-5 ${t.cardHead}`}
      >
        {Icon && (
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${t.chipNavy}`}
          >
            <Icon size={14} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2
            className={`truncate text-[14px] font-black uppercase tracking-tight ${t.heading}`}
          >
            {title}
          </h2>
          {subtitle && (
            <p className={`truncate text-[12px] font-medium ${t.muted}`}>
              {subtitle}
            </p>
          )}
        </div>
        {right}
        {step && (
          <span className="hidden text-[12px] font-black italic tracking-widest text-slate-400 sm:inline">
            {step}
          </span>
        )}
      </div>
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

/* ---------- form fields ---------- */
export function FieldLabel({ icon, label, required, isDark, htmlFor }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`mb-1.5 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider ${
        isDark ? "text-slate-300" : "text-[#001F3F]"
      }`}
    >
      {icon && <span className="text-slate-400">{icon}</span>}
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
  );
}

export function TextField({
  icon,
  label,
  required,
  isDark,
  className = "",
  inputClassName = "",
  hint,
  ...props
}) {
  const t = tk(isDark);
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
      <input
        required={required}
        {...props}
        className={`h-11 w-full rounded-xl border-2 px-3.5 text-[14px] font-semibold outline-none transition ${t.input} ${inputClassName}`}
      />
      {hint && <p className={`mt-1 text-[12px] ${t.muted}`}>{hint}</p>}
    </div>
  );
}

export function SelectField({
  icon,
  label,
  required,
  isDark,
  options = [],
  placeholder,
  className = "",
  ...props
}) {
  const t = tk(isDark);
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
        <select
          required={required}
          {...props}
          className={`h-11 w-full cursor-pointer appearance-none rounded-xl border-2 px-3.5 pr-9 text-[14px] font-semibold outline-none transition ${t.input} ${
            isDark ? "[&>option]:bg-[#000814]" : ""
          }`}
        >
          <option value="">{placeholder || `Select ${label || ""}`}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
          ▼
        </span>
      </div>
    </div>
  );
}

/* ---------- number plate ---------- */
export const Plate = ({ value, size = "md" }) =>
  value ? (
    <span
      className={`inline-flex items-center rounded-md border-2 border-[#001F3F] bg-white font-mono font-black uppercase tracking-wider text-[#001F3F] shadow-sm ${
        size === "sm" ? "px-1.5 py-px text-[12px]" : "px-2.5 py-1 text-[14px]"
      }`}
    >
      {value}
    </span>
  ) : null;

/* ---------- vehicle image with graceful fallback ---------- */
export function VehicleImage({ src, alt = "Vehicle", className = "", label }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#001F3F] to-[#000814] text-white/40 ${className}`}
      >
        <FaCar size={28} />
        {label && (
          <span className="px-2 text-center text-[12px] font-bold uppercase tracking-widest">
            {label}
          </span>
        )}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
      onError={() => setFailed(true)}
      draggable="false"
    />
  );
}

/* ---------- modal shell ---------- */
export function Modal({
  isDark,
  open,
  onClose,
  title,
  icon: Icon,
  subtitle,
  children,
  footer,
  maxW = "max-w-2xl",
}) {
  const t = tk(isDark);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[#000814]/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[92vh] w-full ${maxW} flex-col overflow-hidden rounded-t-2xl border-2 sm:rounded-2xl ${t.card}`}
      >
        <div
          className={`flex items-center gap-3 border-b-2 px-4 py-3 ${t.cardHead}`}
        >
          {Icon && (
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${t.chipNavy}`}
            >
              <Icon size={14} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3
              className={`truncate text-[14px] font-black uppercase tracking-tight ${t.heading}`}
            >
              {title}
            </h3>
            {subtitle && (
              <p className={`truncate text-[12px] ${t.muted}`}>{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`flex h-8 w-8 items-center justify-center rounded-xl border-2 ${t.btnGhost}`}
          >
            <FiX size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className={`border-t-2 p-3 sm:p-4 ${t.line}`}>{footer}</div>
        )}
      </div>
    </div>
  );
}

/* ---------- confirm dialog ---------- */
export function ConfirmDialog({
  isDark,
  open,
  title,
  message,
  confirmText = "Confirm",
  tone = "danger",
  onConfirm,
  onCancel,
  busy,
}) {
  const t = tk(isDark);
  if (!open) return null;
  const confirmCls =
    tone === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : tone === "success"
        ? "bg-green-600 text-white hover:bg-green-700"
        : t.btnPrimary;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#000814]/60 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        className={`w-full max-w-sm overflow-hidden rounded-2xl border-2 ${t.card}`}
      >
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                tone === "danger"
                  ? "bg-red-500/10 text-red-500"
                  : tone === "success"
                    ? "bg-green-500/10 text-green-500"
                    : t.chipNavy
              }`}
            >
              <FiAlertTriangle size={16} />
            </div>
            <div>
              <h3
                className={`text-[16px] font-black uppercase tracking-tight ${t.heading}`}
              >
                {title}
              </h3>
              {message && (
                <p className={`mt-1 text-[14px] ${t.muted}`}>{message}</p>
              )}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onCancel}
              className={`${btnBase} h-10 border-2 ${t.btnGhost}`}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onConfirm}
              className={`${btnBase} h-10 ${confirmCls}`}
            >
              {busy ? "Please wait…" : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- page heading ---------- */
export function PageHeading({ isDark, badge, title, accent, subtitle, right }) {
  const t = tk(isDark);
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {badge && (
          <span
            className={`mb-2 inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-[12px] font-black uppercase tracking-[0.2em] ${
              isDark
                ? "border-white/10 bg-white/5 text-white"
                : "border-slate-200 bg-white text-[#001F3F]"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            {badge}
          </span>
        )}
        <h1
          className={`text-[16px] font-black uppercase tracking-tight ${t.heading}`}
        >
          {title}{" "}
          {accent && (
            <span className="font-light lowercase italic">{accent}</span>
          )}
        </h1>
        {subtitle && (
          <p className={`text-[12px] font-medium sm:text-[14px] ${t.muted}`}>
            {subtitle}
          </p>
        )}
      </div>
      {right && (
        <div className="flex flex-wrap items-center gap-2">{right}</div>
      )}
    </div>
  );
}
