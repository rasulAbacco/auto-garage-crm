// client/src/pages/reminders/components/ReminderCard.jsx
import React, { useState } from "react";
import {
  FiTrash2,
  FiCheck,
  FiMessageSquare,
  FiLoader,
  FiPhone,
  FiClock,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { useTheme } from "../../../contexts/ThemeContext";
import { Plate, tk } from "../../clients/components/clientUi";

/* ---------- shared helpers (also used by RemindersList) ---------- */

// A reminder is "completed" once both WhatsApp alerts have gone out
export const isReminderCompleted = (r) => Boolean(r?.sent15 && r?.sent7);

export function getReminderStatus(reminder) {
  if (isReminderCompleted(reminder))
    return { status: "completed", label: "Completed" };
  if (!reminder?.serviceDate) return { status: "unknown", label: "No date" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(reminder.serviceDate);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d - today) / 86400000);
  if (diffDays < 0)
    return {
      status: "overdue",
      label: `${Math.abs(diffDays)}d overdue`,
      diffDays,
    };
  if (diffDays === 0) return { status: "today", label: "Today", diffDays };
  if (diffDays === 1)
    return { status: "upcoming", label: "Tomorrow", diffDays };
  return { status: "upcoming", label: `In ${diffDays} days`, diffDays };
}

const STATUS_CLS = {
  overdue: "bg-red-500/10 text-red-500 border-red-500/30",
  today: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  upcoming: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  completed: "bg-green-500/10 text-green-600 border-green-500/30",
  unknown: "bg-slate-500/10 text-slate-500 border-slate-500/30",
};

/* ---------- card ---------- */

export default function ReminderCard({
  reminder,
  client,
  onDelete,
  onComplete,
}) {
  const { isDark } = useTheme();
  const t = tk(isDark);
  const [busy, setBusy] = useState(null); // "delete" | "complete" | null

  const st = getReminderStatus(reminder);
  const done = st.status === "completed";
  const c = client || reminder.client || {};

  const d = new Date(reminder.serviceDate);
  const valid = !isNaN(d.getTime());
  const day = valid ? d.toLocaleDateString("en-IN", { day: "2-digit" }) : "--";
  const mon = valid ? d.toLocaleDateString("en-IN", { month: "short" }) : "";
  const year = valid ? d.getFullYear() : "";
  const time = valid
    ? d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "";

  const run = async (kind, fn) => {
    if (!fn || busy) return;
    setBusy(kind);
    try {
      await fn(reminder.id);
    } finally {
      setBusy(null);
    }
  };

  const pill = (sent, label) => (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-px text-[12px] font-bold ${
        sent
          ? "border-green-500/30 bg-green-500/10 text-green-600"
          : isDark
            ? "border-white/10 text-slate-500"
            : "border-[#CBD5E1] text-slate-400"
      }`}
    >
      <FaWhatsapp size={12} /> {label} {sent ? "sent" : "due"}
    </span>
  );

  return (
    <div
      className={`flex gap-3 rounded-2xl border-2 p-3 transition sm:p-4 ${t.card} ${done ? "opacity-70" : ""} ${
        st.status === "overdue" ? "!border-red-500/40" : ""
      }`}
    >
      {/* date tile */}
      <div
        className={`flex w-14 shrink-0 flex-col items-center justify-center rounded-xl py-2 text-center ${
          st.status === "overdue"
            ? "bg-red-600 text-white"
            : st.status === "today"
              ? "bg-amber-500 text-white"
              : t.chipNavy
        }`}
      >
        <span className="text-[16px] font-black leading-none">{day}</span>
        <span className="text-[12px] font-bold uppercase">{mon}</span>
        <span className="text-[12px] opacity-70">{year}</span>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`truncate text-[14px] font-black ${t.heading}`}>
              {c.fullName || `Client #${reminder.clientId}`}
            </p>
            <div
              className={`mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] ${t.muted}`}
            >
              <Plate value={c.regNumber} size="sm" />
              {[c.vehicleMake, c.vehicleModel].filter(Boolean).join(" ") && (
                <span>
                  {[c.vehicleMake, c.vehicleModel].filter(Boolean).join(" ")}
                </span>
              )}
              {c.phone && (
                <a
                  href={`tel:${c.phone}`}
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  <FiPhone size={12} /> {c.phone}
                </a>
              )}
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2 py-px text-[12px] font-bold ${STATUS_CLS[st.status]}`}
          >
            {st.label}
          </span>
        </div>

        {reminder.note ? (
          <p
            className={`flex items-start gap-2 rounded-xl border-2 border-dashed px-3 py-2 text-[12px] ${t.inner} ${t.body}`}
          >
            <FiMessageSquare
              size={12}
              className="mt-0.5 shrink-0 text-slate-400"
            />
            <span className="break-words">{reminder.note}</span>
          </p>
        ) : null}

        <div
          className={`flex flex-wrap items-center justify-between gap-2 border-t-2 pt-2 ${t.line}`}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {time && (
              <span
                className={`inline-flex items-center gap-1 text-[12px] font-semibold ${t.muted}`}
              >
                <FiClock size={12} /> {time}
              </span>
            )}
            {pill(reminder.sent15, "15-day")}
            {pill(reminder.sent7, "7-day")}
          </div>
          <div className="flex items-center gap-1.5">
            {!done && (
              <button
                type="button"
                title="Mark as completed"
                onClick={() => run("complete", onComplete)}
                disabled={!!busy}
                className="inline-flex h-8 items-center gap-1 rounded-lg border-2 border-green-500/30 px-2.5 text-[12px] font-black uppercase tracking-wider text-green-600 transition hover:bg-green-500/10 disabled:opacity-50"
              >
                {busy === "complete" ? (
                  <FiLoader size={12} className="animate-spin" />
                ) : (
                  <FiCheck size={12} />
                )}
                Done
              </button>
            )}
            <button
              type="button"
              title="Delete reminder"
              aria-label="Delete reminder"
              onClick={() => run("delete", onDelete)}
              disabled={!!busy}
              className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-red-500/30 text-red-500 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              {busy === "delete" ? (
                <FiLoader size={12} className="animate-spin" />
              ) : (
                <FiTrash2 size={14} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
