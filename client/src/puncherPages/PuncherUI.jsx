// src/puncherPages/PuncherUI.jsx
// Shared building blocks for the Puncher Shop pages, matching the Washing / Bike CRM look.
import React, { useEffect } from "react";
import { X, RefreshCw, AlertCircle } from "lucide-react";
import { statusClass, prettyEnum } from "./puncherApi";

export const cx = (...c) => c.filter(Boolean).join(" ");

export function PageShell({ children }) {
  return <div className="min-h-screen p-4 md:p-8">{children}</div>;
}

export function PageHeader({ title, subtitle, action, isDark }) {
  return (
    <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-transparent md:text-4xl bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text">
          {title}
        </h1>
        {subtitle && (
          <p className={cx("mt-1 text-sm", isDark ? "text-gray-400" : "text-gray-600")}>{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, isDark, className = "" }) {
  return (
    <div
      className={cx(
        "rounded-2xl border-2 p-6 transition-all duration-300",
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({ title, value, icon: Icon, gradient, isDark, hint }) {
  return (
    <div
      className={cx(
        "border-2 rounded-xl p-5 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group",
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={cx("text-sm font-semibold mb-1", isDark ? "text-gray-400" : "text-gray-600")}>{title}</p>
          <p className={cx("text-2xl md:text-3xl font-bold truncate", isDark ? "text-white" : "text-gray-900")}>{value}</p>
          {hint && <p className={cx("text-xs mt-1", isDark ? "text-gray-500" : "text-gray-500")}>{hint}</p>}
        </div>
        <div
          className={cx(
            "w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg transition-transform duration-500 group-hover:scale-110",
            gradient,
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 shadow-lg hover:shadow-xl hover:from-sky-600 hover:to-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, isDark, className = "", ...props }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium border-2 transition-all active:scale-95 disabled:opacity-50",
        isDark
          ? "border-gray-600 text-gray-200 hover:bg-gray-700"
          : "border-gray-200 text-gray-700 hover:bg-gray-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Badge({ status, isDark, label }) {
  return (
    <span className={cx("px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap", statusClass(status, isDark))}>
      {label || prettyEnum(status)}
    </span>
  );
}

const inputCls = (isDark) =>
  cx(
    "w-full px-4 py-3 rounded-xl border-2 outline-none transition-all text-sm",
    isDark
      ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-sky-500"
      : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-sky-400",
  );

/** Form field. Use `group` when the control is a set of buttons (not a single input). */
export function Field({ label, required, isDark, children, hint, group }) {
  const Wrapper = group ? "div" : "label";
  return (
    <Wrapper className="block" {...(group ? { role: "group", "aria-label": label } : {})}>
      <span className={cx("block mb-1.5 text-sm font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="block mt-1 text-xs text-gray-500">{hint}</span>}
    </Wrapper>
  );
}

export function Input({ isDark, className = "", ...props }) {
  return <input {...props} className={cx(inputCls(isDark), className)} />;
}

export function Select({ isDark, className = "", children, ...props }) {
  return (
    <select {...props} className={cx(inputCls(isDark), className)}>
      {children}
    </select>
  );
}

export function TextArea({ isDark, className = "", ...props }) {
  return <textarea rows={3} {...props} className={cx(inputCls(isDark), className)} />;
}

export function SearchInput({ isDark, ...props }) {
  return <input type="search" {...props} className={inputCls(isDark)} />;
}

export function Modal({ open, onClose, title, isDark, children, footer, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className={cx(
          "w-full max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg",
          isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900",
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className={cx("flex items-center justify-between px-6 py-4 border-b", isDark ? "border-gray-700" : "border-gray-100")}>
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className={cx("p-2 rounded-lg", isDark ? "hover:bg-gray-700" : "hover:bg-gray-100")}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer && (
          <div className={cx("flex justify-end gap-3 px-6 py-4 border-t", isDark ? "border-gray-700" : "border-gray-100")}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Loading({ isDark, label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <RefreshCw className="mb-4 text-sky-500 animate-spin" size={40} />
      <p className={cx("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>{label}</p>
    </div>
  );
}

export function ErrorBox({ message, isDark }) {
  if (!message) return null;
  return (
    <div
      className={cx(
        "flex items-center gap-3 p-4 mb-4 rounded-xl border-2",
        isDark ? "bg-red-900/20 border-red-800 text-red-400" : "bg-red-50 border-red-200 text-red-600",
      )}
    >
      <AlertCircle size={20} className="shrink-0" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, isDark, action }) {
  return (
    <div
      className={cx(
        "flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl border-2 border-dashed",
        isDark ? "border-gray-700 bg-gray-800/50" : "border-gray-300 bg-white",
      )}
    >
      <Icon size={52} className={cx("mb-4", isDark ? "text-gray-600" : "text-gray-400")} />
      <p className={cx("text-lg font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>{title}</p>
      {text && <p className="mt-1 text-sm text-gray-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Segmented({ options, value, onChange, isDark }) {
  return (
    <div className={cx("inline-flex p-1 rounded-xl border-2 gap-1", isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50")}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            "px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
            value === o.value
              ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow"
              : isDark
                ? "text-gray-400 hover:text-white"
                : "text-gray-600 hover:text-gray-900",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
