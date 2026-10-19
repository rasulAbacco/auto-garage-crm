// client/src/pages/reminders/RemindersList.jsx  (Car CRM – service reminders)
import React, { useMemo, useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FiPlus,
  FiInbox,
  FiSearch,
  FiX,
  FiCalendar,
  FiBell,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";
import { Toaster, toast } from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";
import StatsDashboard from "./components/StatsDashboard.jsx";
import ReminderForm from "./components/ReminderForm.jsx";
import ReminderCard, {
  isReminderCompleted,
  getReminderStatus,
} from "./components/ReminderCard.jsx";
import {
  PageHeading,
  Modal,
  ConfirmDialog,
  tk,
  btnBase,
} from "../clients/components/clientUi";

export { isReminderCompleted };

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  };
};
const listOf = (d) => (Array.isArray(d) ? d : d?.data || []);

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "overdue", label: "Overdue" },
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
];
const RANGES = [
  { key: "all", label: "All dates" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "year", label: "This year" },
];
// overdue first, then today, then soonest upcoming; completed at the end
const ORDER = { overdue: 0, today: 1, upcoming: 2, unknown: 3, completed: 4 };

export default function RemindersList() {
  const { isDark } = useTheme();
  const t = tk(isDark);

  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [timeRange, setTimeRange] = useState("all");
  const [reminders, setReminders] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchReminders = useCallback(
    async (showSpinner = false) => {
      try {
        if (showSpinner) setLoading(true);
        setLoadError("");
        const [remRes, clientRes] = await Promise.all([
          axios.get(
            `${API_URL}/api/reminders?range=${timeRange}`,
            getAuthConfig(),
          ),
          axios.get(`${API_URL}/api/clients`, getAuthConfig()),
        ]);
        setReminders(listOf(remRes.data));
        setClients(listOf(clientRes.data));
      } catch (error) {
        console.error("Failed to fetch:", error);
        setLoadError("Couldn't load reminders.");
      } finally {
        setLoading(false);
      }
    },
    [timeRange],
  );

  useEffect(() => {
    fetchReminders(true);
  }, [fetchReminders]);

  const confirmDelete = async () => {
    const id = toDelete?.id;
    if (!id) return;
    try {
      setDeleting(true);
      await axios.delete(`${API_URL}/api/reminders/${id}`, getAuthConfig());
      setReminders((prev) => prev.filter((r) => r.id !== id));
      toast.success("Reminder deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete reminder");
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  const handleComplete = async (id) => {
    try {
      const res = await axios.put(
        `${API_URL}/api/reminders/${id}`,
        { completed: true },
        getAuthConfig(),
      );
      const updated = res.data?.data;
      setReminders((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, ...(updated || { sent15: true, sent7: true }) }
            : r,
        ),
      );
      toast.success("Marked as completed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update reminder");
    }
  };

  const clientById = useMemo(
    () => Object.fromEntries(clients.map((c) => [String(c.id), c])),
    [clients],
  );
  const clientOf = (r) => clientById[String(r.clientId)] || r.client;

  const withStatus = useMemo(
    () => reminders.map((r) => ({ r, st: getReminderStatus(r) })),
    [reminders],
  );

  const counts = useMemo(() => {
    const c = { all: reminders.length };
    withStatus.forEach(({ st }) => (c[st.status] = (c[st.status] || 0) + 1));
    return c;
  }, [withStatus, reminders.length]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return withStatus
      .filter(({ r, st }) => {
        const c = clientOf(r) || {};
        const matches =
          !term ||
          [c.fullName, c.regNumber, c.phone, r.note, r.serviceDate]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(term));
        const statusOk =
          filterStatus === "all" ||
          (filterStatus === "pending"
            ? st.status !== "completed"
            : filterStatus === "week"
              ? st.status === "today" ||
                (st.status === "upcoming" && st.diffDays <= 7)
              : st.status === filterStatus);
        return matches && statusOk;
      })
      .sort((a, b) => {
        const o = ORDER[a.st.status] - ORDER[b.st.status];
        if (o) return o;
        const da = new Date(a.r.serviceDate) - new Date(b.r.serviceDate);
        return a.st.status === "completed" ? -da : da;
      })
      .map(({ r }) => r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, withStatus, clientById, filterStatus]);

  const stats = useMemo(
    () => ({
      total: reminders.length,
      pending: reminders.filter((r) => !isReminderCompleted(r)).length,
      overdue: counts.overdue || 0,
      today: counts.today || 0,
      upcoming: withStatus.filter(
        ({ st }) =>
          st.status === "today" ||
          (st.status === "upcoming" && st.diffDays <= 7),
      ).length,
    }),
    [reminders, counts, withStatus],
  );

  const inputCls = `h-11 rounded-xl border-2 px-3 text-[14px] font-semibold outline-none transition ${t.input} ${
    isDark ? "[&>option]:bg-[#000814]" : ""
  }`;

  return (
    <div className="min-h-screen lg:ml-20">
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontSize: 14 } }}
      />
      <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-5">
        <PageHeading
          isDark={isDark}
          badge="Auto WhatsApp alerts"
          title="Service"
          accent="reminders."
          subtitle="Clients get a WhatsApp 15 and 7 days before their next service."
          right={
            <button
              onClick={() => setShowForm(true)}
              className={`${btnBase} h-10 px-4 ${t.btnPrimary} shadow-lg`}
            >
              <FiPlus size={14} /> New reminder
            </button>
          }
        />

        <StatsDashboard
          stats={stats}
          active={filterStatus}
          onPick={(k) => setFilterStatus(k)}
        />

        {/* search + filters */}
        <div className={`space-y-3 rounded-2xl border-2 p-3 sm:p-4 ${t.card}`}>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <FiSearch
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search client, reg number, phone or note…"
                className={`${inputCls} w-full pl-10`}
              />
            </div>
            <div className="relative sm:w-48">
              <FiCalendar
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className={`${inputCls} w-full cursor-pointer pl-9`}
              >
                {RANGES.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {STATUS_TABS.map((f) => {
              const on = filterStatus === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilterStatus(f.key)}
                  className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg border-2 px-3 text-[12px] font-black uppercase tracking-wider transition ${
                    on ? `border-transparent ${t.chipNavy}` : t.btnGhost
                  } ${f.key === "overdue" && !on && counts.overdue ? "!border-red-500/40 !text-red-500" : ""}`}
                >
                  {f.label}
                  <span
                    className={`rounded px-1 ${on ? (isDark ? "bg-[#001F3F]/10" : "bg-white/20") : isDark ? "bg-white/10" : "bg-slate-100"}`}
                  >
                    {counts[f.key] || 0}
                  </span>
                </button>
              );
            })}
            {(q || filterStatus !== "all") && (
              <button
                onClick={() => {
                  setQ("");
                  setFilterStatus("all");
                }}
                className="ml-auto inline-flex shrink-0 items-center gap-1 px-2 text-[12px] font-black uppercase tracking-wider text-red-500 hover:underline"
              >
                <FiX size={12} /> Clear
              </button>
            )}
          </div>
        </div>

        {loadError && (
          <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-red-500/30 bg-red-500/10 px-4 py-3 text-[14px] font-semibold text-red-500">
            <span className="flex items-center gap-2">
              <FiAlertCircle size={16} /> {loadError}
            </span>
            <button
              onClick={() => fetchReminders(true)}
              className="inline-flex items-center gap-1 text-[12px] font-black uppercase tracking-wider hover:underline"
            >
              <FiRefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* list */}
        {loading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`h-36 animate-pulse rounded-2xl ${isDark ? "bg-white/5" : "bg-slate-200"}`}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className={`rounded-2xl border-2 px-4 py-14 text-center ${t.card}`}
          >
            <div
              className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${t.chipNavy}`}
            >
              {reminders.length ? <FiInbox size={18} /> : <FiBell size={18} />}
            </div>
            <p
              className={`text-[16px] font-black uppercase tracking-tight ${t.heading}`}
            >
              {reminders.length ? "No matches" : "No reminders yet"}
            </p>
            <p className={`mt-1 text-[14px] ${t.muted}`}>
              {reminders.length
                ? "Try another search or filter."
                : "Schedule the next service and we'll remind the client on WhatsApp."}
            </p>
            {!reminders.length && (
              <button
                onClick={() => setShowForm(true)}
                className={`${btnBase} mt-4 h-10 px-4 ${t.btnPrimary}`}
              >
                <FiPlus size={14} /> New reminder
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                client={clientOf(reminder)}
                onDelete={() => setToDelete(reminder)}
                onComplete={handleComplete}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        isDark={isDark}
        open={showForm}
        onClose={() => setShowForm(false)}
        icon={FiBell}
        title="New reminder"
        subtitle="Schedule the next service for a client"
        maxW="max-w-lg"
      >
        <ReminderForm
          clients={clients}
          refreshReminders={() => {
            fetchReminders();
            setShowForm(false);
            toast.success("Reminder created");
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <ConfirmDialog
        isDark={isDark}
        open={!!toDelete}
        title="Delete reminder?"
        message={`The reminder for ${clientOf(toDelete || {})?.fullName || "this client"} will be removed and no WhatsApp alerts will be sent.`}
        confirmText="Delete"
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
