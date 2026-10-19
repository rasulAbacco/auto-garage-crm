// bikePages/Reminders/BikeReminderForm.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiX, FiSearch, FiCheck, FiBell, FiInfo } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";
import api from "../../utils/axiosInstance";
import {
  addMonths,
  alertDatesFor,
  formatDate,
  toDateInput,
  toISO,
  toTimeInput,
} from "./reminderUtils";

/**
 * Add / edit a bike service reminder (shown as a modal).
 * Props:
 *  - reminder : existing reminder to edit, or null to create
 *  - clients  : list of bikes from /api/bikes
 *  - loadingClients
 *  - onClose()
 *  - onSaved()
 */
export default function BikeReminderForm({
  reminder,
  clients = [],
  loadingClients,
  onClose,
  onSaved,
}) {
  const { isDark } = useTheme();
  const isEdit = Boolean(reminder);

  const [bikeId, setBikeId] = useState(
    reminder?.bikeId ? String(reminder.bikeId) : "",
  );
  const [serviceDate, setServiceDate] = useState(
    reminder ? toDateInput(reminder.serviceDate) : "",
  );
  const [serviceTime, setServiceTime] = useState(
    reminder ? toTimeInput(reminder.serviceDate) : "",
  );
  const [note, setNote] = useState(reminder?.note || "");
  const [saving, setSaving] = useState(false);

  // Searchable bike picker
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(!isEdit);
  const pickerRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target))
        setPickerOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const selectedBike =
    clients.find((c) => String(c.id) === bikeId) || reminder?.bike;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? clients.filter((c) =>
          [
            c.ownerName,
            c.fullName,
            c.regNumber,
            c.bikeBrand,
            c.bikeModel,
            c.phone,
          ]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q)),
        )
      : clients;
    return list.slice(0, 8);
  }, [clients, query]);

  const todayStr = toDateInput(new Date());
  const alerts = serviceDate
    ? alertDatesFor(new Date(`${serviceDate}T00:00`))
    : null;
  const now = new Date();

  const submit = async (e) => {
    e.preventDefault();
    if (!bikeId) return toast.error("Please select a bike");
    if (!serviceDate) return toast.error("Please choose the service date");

    const payload = {
      bikeId: Number(bikeId),
      serviceDate: toISO(serviceDate, serviceTime),
      note: note.trim() || null,
    };

    try {
      setSaving(true);
      if (isEdit) {
        await api.put(`/api/bike-reminders/${reminder.id}`, payload);
        toast.success("Reminder updated");
      } else {
        await api.post("/api/bike-reminders", payload);
        toast.success("Reminder added");
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error("Save reminder error:", err);
      toast.error(err.response?.data?.message || "Failed to save reminder");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- styles ---------- */
  const card = isDark
    ? "bg-gray-800 border-gray-700 text-gray-100"
    : "bg-white border-gray-200 text-gray-800";
  const muted = isDark ? "text-gray-400" : "text-gray-500";
  const input = `h-9 w-full rounded-md border px-3 text-[14px] outline-none transition focus:ring-2 ${
    isDark
      ? "bg-gray-900 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-blue-400 focus:ring-blue-400/20"
      : "bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/15"
  }`;
  const chip = (active) =>
    `h-7 rounded-full border px-3 text-[12px] font-medium transition ${
      active
        ? "border-blue-600 bg-blue-600 text-white"
        : isDark
          ? "border-gray-600 text-gray-300 hover:bg-gray-700"
          : "border-gray-300 text-gray-600 hover:bg-gray-50"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <form
        onSubmit={submit}
        className={`flex max-h-[92vh] w-full flex-col rounded-t-xl border shadow-xl sm:max-w-lg sm:rounded-lg ${card}`}
      >
        {/* Header */}
        <div
          className={`flex items-start justify-between gap-3 border-b px-5 py-4 ${isDark ? "border-gray-700" : "border-gray-200"}`}
        >
          <div>
            <h2 className="text-[16px] font-semibold">
              {isEdit ? "Edit reminder" : "New service reminder"}
            </h2>
            <p className={`mt-0.5 text-[12px] ${muted}`}>
              The customer is alerted 15 and 7 days before the service date.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-md p-1.5 ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
            aria-label="Close"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {/* Bike picker */}
          <div ref={pickerRef} className="relative">
            <label className="mb-1 block text-[12px] font-medium">
              Bike / customer <span className="text-rose-500">*</span>
            </label>

            {selectedBike && !pickerOpen ? (
              <div
                className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 ${isDark ? "border-gray-600 bg-gray-900" : "border-gray-300 bg-gray-50"}`}
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium">
                    {selectedBike.ownerName || selectedBike.fullName}
                  </p>
                  <p className={`truncate text-[12px] ${muted}`}>
                    {[selectedBike.bikeBrand, selectedBike.bikeModel]
                      .filter(Boolean)
                      .join(" ")}
                    {selectedBike.regNumber
                      ? ` · ${selectedBike.regNumber}`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPickerOpen(true);
                    setQuery("");
                  }}
                  className="shrink-0 text-[12px] font-medium text-blue-600 hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <FiSearch
                    size={14}
                    className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${muted}`}
                  />
                  <input
                    autoFocus={!isEdit}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPickerOpen(true);
                    }}
                    onFocus={() => setPickerOpen(true)}
                    placeholder={
                      loadingClients
                        ? "Loading bikes…"
                        : "Search name, reg. number, phone…"
                    }
                    className={`${input} pl-8`}
                    disabled={loadingClients}
                  />
                </div>

                {pickerOpen && !loadingClients && (
                  <div
                    className={`absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border shadow-lg ${isDark ? "border-gray-600 bg-gray-800" : "border-gray-200 bg-white"}`}
                  >
                    {matches.length === 0 ? (
                      <p className={`px-3 py-2.5 text-[12px] ${muted}`}>
                        {clients.length
                          ? "No bikes match your search"
                          : "No bikes yet — add a client first"}
                      </p>
                    ) : (
                      matches.map((c) => (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => {
                            setBikeId(String(c.id));
                            setPickerOpen(false);
                          }}
                          className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left ${isDark ? "hover:bg-gray-700" : "hover:bg-blue-50"}`}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-medium">
                              {c.ownerName || c.fullName}
                            </p>
                            <p className={`truncate text-[12px] ${muted}`}>
                              {[c.bikeBrand, c.bikeModel]
                                .filter(Boolean)
                                .join(" ")}
                              {c.phone ? ` · ${c.phone}` : ""}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[12px] ${isDark ? "bg-gray-900 text-gray-300" : "bg-gray-100 text-gray-600"}`}
                          >
                            {c.regNumber}
                          </span>
                          {String(c.id) === bikeId && (
                            <FiCheck
                              className="shrink-0 text-blue-600"
                              size={14}
                            />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Date & time */}
          <div>
            <label className="mb-1 block text-[12px] font-medium">
              Next service date <span className="text-rose-500">*</span>
            </label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {[1, 3, 6, 12].map((m) => {
                const value = addMonths(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setServiceDate(value)}
                    className={chip(serviceDate === value)}
                  >
                    {m === 12 ? "1 year" : `${m} month${m > 1 ? "s" : ""}`}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={serviceDate}
                min={isEdit ? undefined : todayStr}
                onChange={(e) => setServiceDate(e.target.value)}
                className={input}
                required
              />
              <input
                type="time"
                value={serviceTime}
                onChange={(e) => setServiceTime(e.target.value)}
                className={input}
                aria-label="Time (optional)"
              />
            </div>
            <p className={`mt-1 text-[12px] ${muted}`}>Time is optional.</p>
          </div>

          {/* Alert preview */}
          {alerts && (
            <div
              className={`flex gap-2.5 rounded-md border px-3 py-2.5 text-[12px] ${isDark ? "border-blue-500/20 bg-blue-500/10 text-blue-200" : "border-blue-200 bg-blue-50 text-blue-800"}`}
            >
              <FiBell size={14} className="mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p>
                  15-day alert: <b>{formatDate(alerts.d15)}</b>
                  {alerts.d15 < now && (
                    <span className="opacity-75"> (date already passed)</span>
                  )}
                </p>
                <p>
                  7-day alert: <b>{formatDate(alerts.d7)}</b>
                  {alerts.d7 < now && (
                    <span className="opacity-75"> (date already passed)</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="mb-1 block text-[12px] font-medium">
              Note <span className={`font-normal ${muted}`}>(optional)</span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder="e.g. Oil change + chain lubrication due"
              className={`w-full resize-none rounded-md border px-3 py-2 text-[14px] outline-none transition focus:ring-2 ${
                isDark
                  ? "bg-gray-900 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-blue-400 focus:ring-blue-400/20"
                  : "bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/15"
              }`}
            />
          </div>

          {isEdit && (
            <p className={`flex items-center gap-1.5 text-[12px] ${muted}`}>
              <FiInfo size={12} /> Changing the date resets both alerts so
              they're sent again.
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className={`flex flex-col-reverse gap-2 border-t px-5 py-3 sm:flex-row sm:justify-end ${isDark ? "border-gray-700" : "border-gray-200"}`}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={`h-9 rounded-md border px-4 text-[14px] font-medium ${isDark ? "border-gray-600 text-gray-200 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-9 rounded-md bg-blue-600 px-4 text-[14px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add reminder"}
          </button>
        </div>
      </form>
    </div>
  );
}
