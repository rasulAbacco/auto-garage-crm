//src/components/DynamicData/DynamicUi.jsx
// Shared bits for the custom tables (dynamic data) components – MotorDesk navy theme.
// Put this file in the same folder as AddRowModal / ColumnManager etc.
// Text sizes used: 12px, 14px, 16px.
import React from "react";
import {
  Type,
  Hash,
  ToggleLeft,
  Calendar,
  AlertCircle,
  Asterisk,
} from "lucide-react";
import { tk } from "../../pages/clients/components/clientUi";

export {
  tk,
  btnBase,
  Modal,
  ConfirmDialog,
  FieldLabel,
  PageHeading,
} from "../../pages/clients/components/clientUi";

export const TYPES = [
  { value: "TEXT", label: "Text", hint: "Names, notes, codes", icon: Type },
  { value: "NUMBER", label: "Number", hint: "Prices, counts, km", icon: Hash },
  {
    value: "BOOLEAN",
    label: "Yes / No",
    hint: "A simple switch",
    icon: ToggleLeft,
  },
  {
    value: "DATE",
    label: "Date",
    hint: "Due dates, joined on",
    icon: Calendar,
  },
];

export const typeMeta = (t) => TYPES.find((x) => x.value === t) || TYPES[0];

/* ---------- type badge ---------- */
export function TypeBadge({ type, isDark }) {
  const m = typeMeta(type);
  const Icon = m.icon;
  const t = tk(isDark);
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg border px-2 py-0.5 text-[12px] font-black uppercase tracking-wider ${t.inner} ${t.body}`}
    >
      <Icon size={12} /> {m.label}
    </span>
  );
}

/* ---------- required marker (no dot) ---------- */
export const RequiredTag = () => (
  <span className="inline-flex items-center gap-0.5 rounded-md bg-red-500/10 px-1.5 py-px text-[12px] font-black uppercase tracking-wider text-red-500">
    <Asterisk size={10} strokeWidth={3} /> Req
  </span>
);

/* ---------- square switch ---------- */
export function Switch({ on, isDark }) {
  return (
    <span
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-lg border-2 transition-colors ${
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
    </span>
  );
}

/* ---------- toggle row (button with label + switch) ---------- */
export function ToggleRow({
  isDark,
  on,
  onToggle,
  label,
  hint,
  icon: Icon,
  disabled,
}) {
  const t = tk(isDark);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={Boolean(on)}
      disabled={disabled}
      onClick={onToggle}
      className={`flex w-full items-center justify-between gap-3 rounded-xl border-2 px-3.5 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
        on
          ? isDark
            ? "border-white/40 bg-white/10"
            : "border-[#001F3F] bg-[#F8FAFC]"
          : t.inner
      }`}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        {Icon && (
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${on ? t.chipNavy : isDark ? "bg-white/5 text-slate-400" : "bg-white text-slate-400"}`}
          >
            <Icon size={14} />
          </span>
        )}
        <span className="min-w-0">
          <span className={`block text-[14px] font-black ${t.heading}`}>
            {label}
          </span>
          {hint && (
            <span className={`block text-[12px] ${t.muted}`}>{hint}</span>
          )}
        </span>
      </span>
      <Switch on={on} isDark={isDark} />
    </button>
  );
}

/* ---------- error / warning banner ---------- */
export function Banner({ tone = "error", children }) {
  if (!children) return null;
  const cls =
    tone === "warning"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
      : "border-red-500/30 bg-red-500/10 text-red-500";
  return (
    <div
      className={`flex items-start gap-2 rounded-xl border-2 px-3 py-2.5 text-[14px] font-semibold ${cls}`}
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

/* ---------- a field for one dynamic column ---------- */
export function DynamicField({
  isDark,
  col,
  value,
  onChange,
  error,
  disabled,
}) {
  const t = tk(isDark);
  const meta = typeMeta(col.type);
  const Icon = meta.icon;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label
          htmlFor={`dyn-${col.id}`}
          className={`flex min-w-0 items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider ${isDark ? "text-slate-300" : "text-[#001F3F]"}`}
        >
          <Icon size={12} className="shrink-0 text-slate-400" />
          <span className="truncate">{col.name}</span>
        </label>
        {col.required && <RequiredTag />}
      </div>

      {col.type === "BOOLEAN" ? (
        <ToggleRow
          isDark={isDark}
          on={Boolean(value)}
          disabled={disabled}
          onToggle={() => onChange(!value)}
          label={value ? "Yes" : "No"}
          hint="Tap to switch"
        />
      ) : (
        <input
          id={`dyn-${col.id}`}
          type={
            col.type === "NUMBER"
              ? "number"
              : col.type === "DATE"
                ? "date"
                : "text"
          }
          inputMode={col.type === "NUMBER" ? "decimal" : undefined}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={
            col.type === "DATE"
              ? undefined
              : `Enter ${String(col.name || "").toLowerCase()}…`
          }
          aria-invalid={Boolean(error)}
          className={`h-11 w-full rounded-xl border-2 px-3.5 text-[14px] font-semibold outline-none transition disabled:opacity-60 ${t.input} ${
            error ? "!border-red-500/60" : ""
          }`}
        />
      )}
      {error && (
        <p className="mt-1 text-[12px] font-bold text-red-500">{error}</p>
      )}
    </div>
  );
}

/* ---------- shared value formatter for add / edit row ---------- */
// A required Yes/No field that was never touched counts as "No" (false), not as missing.
export function formatRowValues(columns, values) {
  const formatted = {};
  const errors = {};

  columns.forEach((col) => {
    const raw = values[col.id];
    const isEmpty = raw === undefined || raw === null || raw === "";

    if (col.required && isEmpty && col.type !== "BOOLEAN") {
      errors[col.id] = `${col.name} is required`;
      return;
    }
    if (isEmpty) {
      formatted[col.id] = col.type === "BOOLEAN" && col.required ? false : null;
      return;
    }
    if (col.type === "NUMBER") {
      const num = Number(raw);
      if (Number.isNaN(num)) {
        errors[col.id] = `${col.name} must be a valid number`;
        return;
      }
      formatted[col.id] = num;
    } else if (col.type === "BOOLEAN") {
      formatted[col.id] = Boolean(raw);
    } else if (col.type === "DATE") {
      if (Number.isNaN(Date.parse(raw))) {
        errors[col.id] = `${col.name} must be a valid date`;
        return;
      }
      formatted[col.id] = raw;
    } else {
      formatted[col.id] = String(raw);
    }
  });

  return { formatted, errors };
}
