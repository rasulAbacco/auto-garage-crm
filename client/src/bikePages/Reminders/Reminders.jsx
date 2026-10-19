// bikePages/Reminders/Reminders.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiBell,
  FiPlus,
  FiSearch,
  FiAlertCircle,
  FiCalendar,
  FiClock,
  FiRefreshCw,
} from "react-icons/fi";
import { Toaster, toast } from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";
import api from "../../utils/axiosInstance";

import BikeReminderForm from "./BikeReminderForm";
import BikeReminderCard from "./BikeReminderCard";
import { bucketOf } from "./reminderUtils";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "past", label: "Overdue" },
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "week", label: "This week" },
  { key: "later", label: "Upcoming" },
];

export default function BikeReminders() {
  const { isDark } = useTheme();

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  /* ---------------- data ---------------- */
  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/bike-reminders");
      setReminders(res.data?.data || []);
    } catch (err) {
      console.error("Fetch reminders error:", err);
      toast.error(err.response?.data?.message || "Failed to load reminders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
    api
      .get("/api/bikes")
      .then((res) =>
        setClients(Array.isArray(res.data) ? res.data : res.data?.data || []),
      )
      .catch((err) => {
        console.error("Fetch bikes error:", err);
        toast.error("Failed to load bikes");
      })
      .finally(() => setLoadingClients(false));
  }, [fetchReminders]);

  /* ---------------- derived ---------------- */
  const counts = useMemo(() => {
    const c = {
      all: reminders.length,
      past: 0,
      today: 0,
      tomorrow: 0,
      week: 0,
      later: 0,
    };
    reminders.forEach((r) => (c[bucketOf(r.serviceDate)] += 1));
    return c;
  }, [reminders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reminders.filter((r) => {
      if (filter !== "all" && bucketOf(r.serviceDate) !== filter) return false;
      if (!q) return true;
      const b = r.bike || {};
      return [
        b.ownerName,
        b.bikeBrand,
        b.bikeModel,
        b.regNumber,
        b.phone,
        r.note,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [reminders, search, filter]);

  // Overdue first (most recent at top), then upcoming soonest first
  const sorted = useMemo(() => {
    const past = filtered
      .filter((r) => bucketOf(r.serviceDate) === "past")
      .sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));
    const upcoming = filtered
      .filter((r) => bucketOf(r.serviceDate) !== "past")
      .sort((a, b) => new Date(a.serviceDate) - new Date(b.serviceDate));
    return filter === "all" ? [...upcoming, ...past] : [...past, ...upcoming];
  }, [filtered, filter]);

  /* ---------------- actions ---------------- */
  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (reminder) => {
    setEditing(reminder);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/api/bike-reminders/${deleting.id}`);
      toast.success("Reminder deleted");
      setReminders((prev) => prev.filter((r) => r.id !== deleting.id));
    } catch (err) {
      console.error("Delete reminder error:", err);
      toast.error(err.response?.data?.message || "Failed to delete reminder");
    } finally {
      setDeleting(null);
    }
  };

  /* ---------------- styles ---------------- */
  const page = isDark
    ? "bg-gray-900 text-gray-100"
    : "bg-gray-50 text-gray-800";
  const card = isDark
    ? "border-gray-700 bg-gray-800"
    : "border-gray-200 bg-white";
  const muted = isDark ? "text-gray-400" : "text-gray-500";

  const stats = [
    {
      label: "Total",
      value: counts.all,
      icon: FiBell,
      tone: "text-blue-600",
      key: "all",
    },
    {
      label: "Overdue",
      value: counts.past,
      icon: FiAlertCircle,
      tone: "text-rose-600",
      key: "past",
    },
    {
      label: "Next 7 days",
      value: counts.today + counts.tomorrow + counts.week,
      icon: FiClock,
      tone: "text-amber-600",
      key: "week",
    },
    {
      label: "Upcoming",
      value: counts.later,
      icon: FiCalendar,
      tone: "text-emerald-600",
      key: "later",
    },
  ];

  return (
    <div
      className={`min-h-screen px-3 py-4 text-[14px] sm:px-5 lg:px-8 ${page}`}
    >
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontSize: "14px" } }}
      />

      <div className="mx-auto max-w-5xl space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className={`text-[12px] font-medium uppercase tracking-[0.14em] ${muted}`}
            >
              Reminders
            </p>
            <h1 className="mt-0.5 text-[16px] font-semibold">
              Service reminders
            </h1>
            <p className={`text-[12px] ${muted}`}>
              Customers are alerted 15 and 7 days before their service date.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchReminders}
              title="Refresh"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md border ${isDark ? "border-gray-600 hover:bg-gray-800" : "border-gray-300 bg-white hover:bg-gray-50"}`}
            >
              <FiRefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
            </button>
            <button
              onClick={openCreate}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-blue-600 px-4 text-[14px] font-medium text-white hover:bg-blue-700 sm:flex-none"
            >
              <FiPlus size={15} /> Add reminder
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() =>
                setFilter(filter === s.key && s.key !== "all" ? "all" : s.key)
              }
              className={`rounded-lg border p-3.5 text-left transition ${card} ${
                filter === s.key && s.key !== "all"
                  ? "ring-2 ring-blue-500/40"
                  : ""
              } ${isDark ? "hover:border-gray-600" : "hover:border-gray-300"}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[12px] ${muted}`}>{s.label}</span>
                <s.icon size={14} className={s.tone} />
              </div>
              <div className="mt-1 text-[16px] font-semibold">{s.value}</div>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className={`space-y-3 rounded-lg border p-3 ${card}`}>
          <div className="relative">
            <FiSearch
              size={14}
              className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${muted}`}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, bike, reg. number, phone or note…"
              className={`h-9 w-full rounded-md border pl-8 pr-3 text-[14px] outline-none focus:ring-2 ${
                isDark
                  ? "border-gray-600 bg-gray-900 text-gray-100 placeholder:text-gray-500 focus:ring-blue-400/20"
                  : "border-gray-300 bg-white placeholder:text-gray-400 focus:ring-blue-500/15"
              }`}
            />
          </div>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition ${
                    active
                      ? "border-blue-600 bg-blue-600 text-white"
                      : isDark
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {f.label}
                  <span
                    className={`rounded-full px-1.5 text-[12px] ${active ? "bg-white/20" : isDark ? "bg-gray-700" : "bg-gray-100"}`}
                  >
                    {counts[f.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-24 animate-pulse rounded-lg border ${card}`}
              />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div
            className={`rounded-lg border border-dashed px-4 py-12 text-center ${isDark ? "border-gray-700" : "border-gray-300 bg-white"}`}
          >
            <FiBell size={22} className={`mx-auto ${muted}`} />
            <p className="mt-2 text-[14px] font-medium">
              {reminders.length
                ? "No reminders match your filters"
                : "No reminders yet"}
            </p>
            <p className={`mt-0.5 text-[12px] ${muted}`}>
              {reminders.length
                ? "Try another search or filter."
                : "Add a reminder and the customer will be alerted before their next service."}
            </p>
            {!reminders.length && (
              <button
                onClick={openCreate}
                className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-4 text-[14px] font-medium text-white hover:bg-blue-700"
              >
                <FiPlus size={15} /> Add first reminder
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {sorted.map((r) => (
              <BikeReminderCard
                key={r.id}
                reminder={r}
                onEdit={openEdit}
                onDelete={setDeleting}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add / edit modal */}
      {formOpen && (
        <BikeReminderForm
          reminder={editing}
          clients={clients}
          loadingClients={loadingClients}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSaved={fetchReminders}
        />
      )}

      {/* Delete confirm */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className={`w-full max-w-sm rounded-lg border p-5 shadow-xl ${card}`}
          >
            <h3 className="text-[16px] font-semibold">Delete reminder?</h3>
            <p
              className={`mt-1.5 text-[14px] ${isDark ? "text-gray-300" : "text-gray-600"}`}
            >
              The reminder for{" "}
              <b>{deleting.bike?.ownerName || "this customer"}</b> will be
              removed and no alerts will be sent.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleting(null)}
                className={`h-9 rounded-md border px-4 text-[14px] font-medium ${isDark ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-50"}`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="h-9 rounded-md bg-rose-600 px-4 text-[14px] font-medium text-white hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
