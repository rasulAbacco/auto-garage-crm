// bikePages/Reminders/BikeReminderCard.jsx
import React from "react";
import {
  FiCalendar,
  FiClock,
  FiEdit2,
  FiTrash2,
  FiPhone,
  FiCheckCircle,
  FiCircle,
} from "react-icons/fi";
import { useTheme } from "../../contexts/ThemeContext";
import {
  BUCKET_STYLE,
  alertDatesFor,
  bucketOf,
  formatDate,
  formatTime,
  relativeLabel,
} from "./reminderUtils";

export default function BikeReminderCard({ reminder, onEdit, onDelete }) {
  const { isDark } = useTheme();
  const bike = reminder.bike || {};
  const bucket = bucketOf(reminder.serviceDate);
  const style = BUCKET_STYLE[bucket];
  const time = formatTime(reminder.serviceDate);
  const { d15, d7 } = alertDatesFor(reminder.serviceDate);

  const muted = isDark ? "text-gray-400" : "text-gray-500";
  const initials = (bike.ownerName || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const AlertPill = ({ label, date, sent }) => (
    <span
      title={sent ? "Sent to customer" : "Not sent yet"}
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[12px] ${
        sent
          ? isDark
            ? "bg-emerald-500/10 text-emerald-300"
            : "bg-emerald-50 text-emerald-700"
          : isDark
            ? "bg-white/5 text-gray-400"
            : "bg-gray-100 text-gray-500"
      }`}
    >
      {sent ? <FiCheckCircle size={11} /> : <FiCircle size={11} />}
      {label} · {formatDate(date).replace(/ \d{4}$/, "")}
    </span>
  );

  return (
    <div
      className={`rounded-lg border p-3.5 transition sm:p-4 ${
        isDark
          ? "border-gray-700 bg-gray-800 hover:border-gray-600"
          : "border-gray-200 bg-white hover:border-gray-300"
      } ${bucket === "past" ? "opacity-80" : ""}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
            isDark ? "bg-blue-500/15 text-blue-300" : "bg-blue-50 text-blue-700"
          }`}
        >
          {initials}
        </div>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-[14px] font-semibold">
              {bike.ownerName || "Unknown customer"}
            </p>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset ${isDark ? style.dark : style.light}`}
            >
              {style.label}
            </span>
          </div>

          <p className={`mt-0.5 truncate text-[12px] ${muted}`}>
            {[bike.bikeBrand, bike.bikeModel].filter(Boolean).join(" ") ||
              "Bike"}
            {bike.regNumber ? ` · ${bike.regNumber}` : ""}
            {bike.phone && (
              <>
                {" · "}
                <a
                  href={`tel:${bike.phone}`}
                  className="inline-flex items-center gap-0.5 hover:underline"
                >
                  <FiPhone size={11} /> {bike.phone}
                </a>
              </>
            )}
          </p>

          {reminder.note && (
            <p
              className={`mt-2 line-clamp-2 text-[14px] ${isDark ? "text-gray-300" : "text-gray-700"}`}
            >
              {reminder.note}
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[12px] font-medium ${isDark ? "bg-gray-900 text-gray-200" : "bg-gray-100 text-gray-700"}`}
            >
              <FiCalendar size={11} /> {formatDate(reminder.serviceDate)}
            </span>
            {time && (
              <span
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[12px] ${isDark ? "bg-gray-900 text-gray-300" : "bg-gray-100 text-gray-600"}`}
              >
                <FiClock size={11} /> {time}
              </span>
            )}
            <span className={`text-[12px] ${muted}`}>
              {relativeLabel(reminder.serviceDate)}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <AlertPill label="15-day" date={d15} sent={reminder.sent15} />
            <AlertPill label="7-day" date={d7} sent={reminder.sent7} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
          <button
            onClick={() => onEdit(reminder)}
            title="Edit"
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${isDark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            <FiEdit2 size={13} />
          </button>
          <button
            onClick={() => onDelete(reminder)}
            title="Delete"
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${isDark ? "border-gray-600 text-rose-300 hover:bg-rose-500/10" : "border-gray-200 text-rose-600 hover:bg-rose-50"}`}
          >
            <FiTrash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
