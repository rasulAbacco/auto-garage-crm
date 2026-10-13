// client/src/pages/reminders/components/ReminderCard.jsx
import React, { useState } from "react";
import {
  FiUser,
  FiCalendar,
  FiTrash2,
  FiCheckCircle,
  FiMessageSquare,
  FiLoader,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useTheme } from "../../../contexts/ThemeContext";

export default function ReminderCard({
  reminder,
  client,
  onDelete,
  onComplete,
  index,
}) {
  const { isDark } = useTheme();
  const [busy, setBusy] = useState(null); // "delete" | "complete" | null

  const isCompleted = Boolean(reminder.sent15 && reminder.sent7);

  const dateObj = new Date(reminder.serviceDate);
  const validDate = !isNaN(dateObj.getTime());
  const formattedDate = validDate
    ? dateObj.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "No date";
  const formattedTime = validDate
    ? dateObj.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const handleComplete = async () => {
    if (!onComplete || busy) return;
    setBusy("complete");
    try {
      await onComplete(reminder.id);
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || busy) return;
    setBusy("delete");
    try {
      await onDelete(reminder.id);
    } finally {
      setBusy(null);
    }
  };

  const displayClient = client || reminder.client;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 20) * 0.03 }}
      className={`group flex flex-col md:flex-row items-start md:items-center justify-between p-5 transition-colors ${
        isDark
          ? "hover:bg-gray-800/40 border-gray-800 text-gray-100"
          : "hover:bg-gray-50 border-gray-100 text-gray-900"
      } ${index !== 0 ? "border-t" : ""} ${isCompleted ? "opacity-70" : ""}`}
    >
      {/* SECTION 1: CLIENT & VEHICLE */}
      <div className="flex items-start gap-4 w-full md:w-1/4">
        <div
          className={`hidden sm:flex w-10 h-10 rounded-lg items-center justify-center shrink-0 mt-1 ${
            isDark ? "bg-gray-800 text-blue-400" : "bg-blue-50 text-blue-600"
          }`}
        >
          <FiUser size={20} />
        </div>
        <div className="overflow-hidden">
          <h3 className="font-bold text-sm md:text-base truncate">
            {displayClient?.fullName || `Client #${reminder.clientId}`}
          </h3>
          <p
            className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            {[displayClient?.vehicleMake, displayClient?.vehicleModel]
              .filter(Boolean)
              .join(" ")}
            {displayClient?.regNumber ? ` · ${displayClient.regNumber}` : ""}
          </p>
        </div>
      </div>

      {/* SECTION 2: NOTE */}
      <div className="flex-1 w-full md:px-6 mt-3 md:mt-0">
        {reminder.note ? (
          <div
            className={`flex items-start gap-2 p-3 rounded-xl border border-dashed text-sm leading-relaxed ${
              isDark
                ? "bg-gray-900/50 border-gray-700 text-gray-300"
                : "bg-gray-50 border-gray-200 text-gray-600"
            }`}
          >
            <FiMessageSquare
              size={16}
              className="mt-0.5 shrink-0 opacity-60 text-blue-500"
            />
            <span className="break-words">{reminder.note}</span>
          </div>
        ) : (
          <div className="text-xs italic opacity-30 px-3">No note provided</div>
        )}
      </div>

      {/* SECTION 3: DATE & STATUS */}
      <div className="flex items-center justify-between md:justify-end gap-6 mt-4 md:mt-0 w-full md:w-auto">
        <div className="flex flex-col text-sm font-semibold whitespace-nowrap">
          <span className="flex items-center gap-2">
            <FiCalendar className="text-blue-500" size={14} />
            {formattedDate}
          </span>
          {formattedTime && (
            <span
              className={`text-xs font-normal ml-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              {formattedTime}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              isCompleted
                ? "bg-green-500/10 text-green-500 border-green-500/20"
                : "bg-blue-500/10 text-blue-500 border-blue-500/20"
            }`}
          >
            {isCompleted ? "Completed" : "Pending"}
          </div>

          <div className="flex items-center gap-1">
            {!isCompleted && (
              <button
                type="button"
                title="Mark as completed"
                onClick={handleComplete}
                disabled={!!busy}
                className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark
                    ? "hover:bg-green-500/20 text-gray-400 hover:text-green-500"
                    : "hover:bg-green-100 text-green-500 hover:text-green-700"
                }`}
              >
                {busy === "complete" ? (
                  <FiLoader size={18} className="animate-spin" />
                ) : (
                  <FiCheckCircle size={18} />
                )}
              </button>
            )}
            <button
              type="button"
              title="Delete reminder"
              onClick={handleDelete}
              disabled={!!busy}
              className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark
                  ? "hover:bg-red-500/20 text-gray-400 hover:text-red-500"
                  : "hover:bg-red-100 text-red-500 hover:text-red-700"
              }`}
            >
              {busy === "delete" ? (
                <FiLoader size={18} className="animate-spin" />
              ) : (
                <FiTrash2 size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
