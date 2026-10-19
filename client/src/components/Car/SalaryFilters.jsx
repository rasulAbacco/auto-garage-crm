// client/src/components/Car/SalaryFilters.jsx
import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Download,
  Calendar,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { tk, btnBase, MONTHS } from "./staffUi";

export default function SalaryFilters({
  month,
  year,
  onMonthChange,
  onYearChange,
  onGenerate,
  onDownload,
  disabled,
  isDark: isDarkProp,
}) {
  const theme = useTheme();
  const isDark = isDarkProp ?? theme?.isDark;
  const t = tk(isDark);

  const shift = (delta) => {
    const m0 = Number(month) || new Date().getMonth() + 1;
    const y0 = Number(year) || new Date().getFullYear();
    const d = new Date(y0, m0 - 1 + delta, 1);
    onMonthChange(d.getMonth() + 1);
    onYearChange(d.getFullYear());
  };

  const field = `h-10 rounded-xl border-2 text-[14px] font-bold outline-none transition ${t.input}`;
  const stepBtn = `${btnBase} h-10 w-10 shrink-0 border-2 ${t.btnGhost}`;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="mb-1.5 text-[12px] font-bold uppercase tracking-wider text-slate-400">
          Pay period
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Previous month"
            className={stepBtn}
          >
            <ChevronLeft size={16} />
          </button>
          <div className="relative min-w-0 flex-1 sm:w-44 sm:flex-none">
            <select
              aria-label="Month"
              value={month ?? ""}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              className={`${field} w-full cursor-pointer appearance-none px-3 pr-8 ${isDark ? "[&>option]:bg-[#000814]" : ""}`}
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">
              ▼
            </span>
          </div>
          <div className="relative w-24 shrink-0">
            <Calendar
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              aria-label="Year"
              type="number"
              inputMode="numeric"
              value={year ?? ""}
              onChange={(e) =>
                onYearChange(
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              placeholder="YYYY"
              className={`${field} w-full pl-8 pr-2`}
            />
          </div>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="Next month"
            className={stepBtn}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex">
        <button
          type="button"
          onClick={onGenerate}
          className={`${btnBase} h-10 px-4 shadow-lg ${t.btnPrimary}`}
        >
          <Sparkles size={14} /> Prepare payroll
        </button>
        <button
          type="button"
          onClick={onDownload}
          disabled={disabled}
          className={`${btnBase} h-10 border-2 px-4 ${t.btnGhost}`}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>
    </div>
  );
}
