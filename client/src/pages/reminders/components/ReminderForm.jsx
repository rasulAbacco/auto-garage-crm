// client/src/pages/reminders/components/ReminderForm.jsx
// Used inside a modal on RemindersList. Saves { clientId, serviceDate (ISO), note }.
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FiUser,
  FiCalendar,
  FiFileText,
  FiSend,
  FiInfo,
  FiSearch,
  FiLoader,
  FiAlertCircle,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import axios from "axios";
import { useTheme } from "../../../contexts/ThemeContext";
import {
  FieldLabel,
  Plate,
  tk,
  btnBase,
} from "../../clients/components/clientUi";

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
const listOf = (d) => (Array.isArray(d) ? d : d?.data || d?.clients || []);

// value for <input type="datetime-local">
const toLocalInput = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const addMonths = (m) => {
  const d = new Date();
  d.setMonth(d.getMonth() + m);
  d.setHours(10, 0, 0, 0);
  return toLocalInput(d);
};
const QUICK = [
  { label: "1 month", m: 1 },
  { label: "3 months", m: 3 },
  { label: "6 months", m: 6 },
  { label: "1 year", m: 12 },
];
const fmt = (d) =>
  d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function ReminderForm({
  clients = [],
  refreshReminders,
  onCancel,
}) {
  const { isDark } = useTheme();
  const t = tk(isDark);

  const [form, setForm] = useState({
    clientId: "",
    serviceDate: addMonths(3),
    note: "",
  });
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [localClients, setLocalClients] = useState(clients);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const boxRef = useRef(null);

  useEffect(() => {
    if (clients.length) return setLocalClients(clients);
    axios
      .get(`${API_URL}/api/clients`, getAuthConfig())
      .then((res) => setLocalClients(listOf(res.data)))
      .catch((e) => console.error("Failed to load clients:", e));
  }, [clients]);

  // local search first, then the server (list may be paginated)
  useEffect(() => {
    if (!open) return;
    const q = query.trim().toLowerCase();
    setResults(
      (q
        ? localClients.filter((c) =>
            [c.fullName, c.regNumber, c.phone]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(q)),
          )
        : localClients
      ).slice(0, 20),
    );
    if (!q) return;
    const h = setTimeout(() => {
      axios
        .get(
          `${API_URL}/api/clients?limit=20&q=${encodeURIComponent(query.trim())}`,
          getAuthConfig(),
        )
        .then((res) =>
          setResults((prev) => {
            const seen = new Set(prev.map((c) => c.id));
            return [
              ...prev,
              ...listOf(res.data).filter((c) => !seen.has(c.id)),
            ].slice(0, 20);
          }),
        )
        .catch(() => {});
    }, 300);
    return () => clearTimeout(h);
  }, [query, open, localClients]);

  useEffect(() => {
    const onDown = (e) =>
      boxRef.current && !boxRef.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const alerts = useMemo(() => {
    const d = new Date(form.serviceDate);
    if (isNaN(d)) return null;
    const a15 = new Date(d);
    a15.setDate(a15.getDate() - 15);
    const a7 = new Date(d);
    a7.setDate(a7.getDate() - 7);
    const now = new Date();
    return { a15, a7, past15: a15 < now, past7: a7 < now };
  }, [form.serviceDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clientId) return setMessage("Please choose a client.");
    if (!form.serviceDate) return setMessage("Please pick the service date.");
    try {
      setLoading(true);
      setMessage("");
      await axios.post(
        `${API_URL}/api/reminders`,
        {
          clientId: Number(form.clientId),
          // browser local (IST) time → ISO, so the server stores the exact moment picked
          serviceDate: new Date(form.serviceDate).toISOString(),
          note: form.note,
        },
        getAuthConfig(),
      );
      setForm({ clientId: "", serviceDate: addMonths(3), note: "" });
      setClient(null);
      refreshReminders?.();
    } catch (error) {
      console.error("Error saving reminder:", error);
      setMessage(
        error.response?.data?.message ||
          "Couldn't save the reminder. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputCls = `h-11 w-full rounded-xl border-2 px-3.5 text-[14px] font-semibold outline-none transition ${t.input} ${
    isDark ? "[color-scheme:dark]" : ""
  }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-5">
      {/* client */}
      <div ref={boxRef} className="relative">
        <FieldLabel
          icon={<FiUser size={12} />}
          label="Client"
          required
          isDark={isDark}
        />
        {client ? (
          <div
            className={`flex items-center gap-3 rounded-xl border-2 p-3 ${t.inner}`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[14px] font-black ${t.chipNavy}`}
            >
              {client.fullName?.charAt(0)?.toUpperCase() || "C"}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`truncate text-[14px] font-black ${t.heading}`}>
                {client.fullName}
              </p>
              <p className={`truncate text-[12px] ${t.muted}`}>
                {[client.vehicleMake, client.vehicleModel]
                  .filter(Boolean)
                  .join(" ")}
                {client.phone ? ` · ${client.phone}` : ""}
              </p>
            </div>
            <Plate value={client.regNumber} size="sm" />
            <button
              type="button"
              onClick={() => {
                setClient(null);
                setForm((f) => ({ ...f, clientId: "" }));
                setOpen(true);
              }}
              className={`${btnBase} h-8 border-2 px-2.5 ${t.btnGhost}`}
            >
              Change
            </button>
          </div>
        ) : (
          <>
            <div className="relative">
              <FiSearch
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder="Search name, reg number or phone"
                autoComplete="off"
                className={`${inputCls} pl-10`}
              />
            </div>
            {open && (
              <div
                className={`absolute z-40 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border-2 shadow-2xl ${t.menu}`}
              >
                {results.length ? (
                  results.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setClient(c);
                        setForm((f) => ({ ...f, clientId: c.id }));
                        setQuery("");
                        setOpen(false);
                        setMessage("");
                      }}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-[14px] ${t.option}`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-bold">
                          {c.fullName}
                        </span>
                        <span
                          className={`block truncate text-[12px] ${t.muted}`}
                        >
                          {[c.vehicleMake, c.vehicleModel]
                            .filter(Boolean)
                            .join(" ")}
                        </span>
                      </span>
                      <Plate value={c.regNumber} size="sm" />
                    </button>
                  ))
                ) : (
                  <p className={`px-3 py-3 text-[14px] ${t.muted}`}>
                    No client found.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* date */}
      <div>
        <FieldLabel
          icon={<FiCalendar size={12} />}
          label="Next service date"
          required
          isDark={isDark}
        />
        <div className="mb-2 grid grid-cols-4 gap-1.5">
          {QUICK.map((q) => {
            const v = addMonths(q.m);
            const on = form.serviceDate.slice(0, 10) === v.slice(0, 10);
            return (
              <button
                key={q.m}
                type="button"
                onClick={() => setForm((f) => ({ ...f, serviceDate: v }))}
                className={`h-9 rounded-lg border-2 text-[12px] font-black uppercase tracking-wider transition ${
                  on ? `border-transparent ${t.chipNavy}` : t.btnGhost
                }`}
              >
                {q.label}
              </button>
            );
          })}
        </div>
        <input
          type="datetime-local"
          value={form.serviceDate}
          min={toLocalInput(new Date())}
          onChange={(e) =>
            setForm((f) => ({ ...f, serviceDate: e.target.value }))
          }
          className={inputCls}
          required
        />
      </div>

      {/* note */}
      <div>
        <FieldLabel
          icon={<FiFileText size={12} />}
          label="Note"
          isDark={isDark}
        />
        <textarea
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          placeholder="e.g. Periodic service due, customer prefers mornings"
          rows={2}
          className={`w-full resize-none rounded-xl border-2 px-3.5 py-2.5 text-[14px] font-medium outline-none transition ${t.input}`}
        />
      </div>

      {/* alert preview */}
      <div
        className={`flex items-start gap-3 rounded-xl border-2 p-3 ${t.inner}`}
      >
        <FiInfo size={14} className={`mt-0.5 shrink-0 ${t.heading}`} />
        <div className="space-y-1.5 text-[12px]">
          <p className={t.body}>
            WhatsApp reminders go to the client automatically:
          </p>
          {alerts ? (
            <div className="flex flex-wrap gap-1.5">
              {[
                ["15 days before", alerts.a15, alerts.past15],
                ["7 days before", alerts.a7, alerts.past7],
              ].map(([l, d, past]) => (
                <span
                  key={l}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-bold ${
                    past
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                      : "border-green-500/30 bg-green-500/10 text-green-600"
                  }`}
                >
                  <FaWhatsapp size={12} /> {l}: {fmt(d)}
                  {past ? " (already passed)" : ""}
                </span>
              ))}
            </div>
          ) : (
            <p className={t.muted}>
              Pick a date to see when the alerts will go out.
            </p>
          )}
        </div>
      </div>

      {message && (
        <p className="flex items-center gap-2 text-[14px] font-semibold text-red-500">
          <FiAlertCircle size={14} /> {message}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className={`${btnBase} h-11 border-2 ${t.btnGhost}`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`${btnBase} h-11 ${t.btnPrimary} shadow-xl`}
        >
          {loading ? (
            <FiLoader size={14} className="animate-spin" />
          ) : (
            <FiSend size={14} />
          )}
          {loading ? "Saving…" : "Save reminder"}
        </button>
      </div>
    </form>
  );
}
