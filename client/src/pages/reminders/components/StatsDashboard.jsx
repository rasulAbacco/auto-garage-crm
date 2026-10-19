// client/src/pages/reminders/components/StatsDashboard.jsx
import React from "react";
import { FiBell, FiAlertCircle, FiClock, FiCalendar } from "react-icons/fi";
import { useTheme } from "../../../contexts/ThemeContext";
import { tk } from "../../clients/components/clientUi";

const isCompleted = (r) => Boolean(r.sent15 && r.sent7);

export default function StatsDashboard({
  reminders = [],
  stats,
  onPick,
  active,
}) {
  const { isDark } = useTheme();
  const t = tk(isDark);

  const s = stats || {
    total: reminders.length,
    pending: reminders.filter((r) => !isCompleted(r)).length,
    overdue: reminders.filter(
      (r) => !isCompleted(r) && new Date(r.serviceDate) < new Date(),
    ).length,
    upcoming: reminders.filter((r) => {
      const diff = (new Date(r.serviceDate) - new Date()) / 86400000;
      return !isCompleted(r) && diff >= 0 && diff <= 7;
    }).length,
  };

  const items = [
    {
      key: "all",
      title: "Total",
      value: s.total,
      icon: FiBell,
      chip: t.chipNavy,
    },
    {
      key: "pending",
      title: "Pending",
      value: s.pending,
      icon: FiClock,
      chip: "bg-blue-500/10 text-blue-500",
    },
    {
      key: "overdue",
      title: "Overdue",
      value: s.overdue,
      icon: FiAlertCircle,
      chip: "bg-red-500/10 text-red-500",
    },
    {
      key: "week",
      title: "Next 7 days",
      value: s.upcoming,
      icon: FiCalendar,
      chip: "bg-green-500/10 text-green-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ key, title, value, icon: Icon, chip }) => {
        const clickable = Boolean(onPick);
        const on = active === key;
        return (
          <button
            key={key}
            type="button"
            disabled={!clickable}
            onClick={() => onPick?.(key)}
            className={`rounded-2xl border-2 p-3 text-left transition sm:p-4 ${t.card} ${clickable ? "hover:-translate-y-0.5" : "cursor-default"} ${
              on ? (isDark ? "!border-white/40" : "!border-[#001F3F]") : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12px] font-bold uppercase leading-tight tracking-wider text-slate-400">
                {title}
              </p>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${chip}`}
              >
                <Icon size={14} />
              </div>
            </div>
            <p
              className={`mt-2 text-[16px] font-black tracking-tight ${t.heading}`}
            >
              {value ?? 0}
            </p>
          </button>
        );
      })}
    </div>
  );
}
