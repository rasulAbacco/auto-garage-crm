// client/src/pages/billing/BillingList.jsx  (Car CRM – invoices)
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiEye,
  FiTrash2,
  FiPlus,
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiEdit,
  FiSearch,
  FiX,
  FiRefreshCw,
  FiCalendar,
  FiChevronRight,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import { Toaster, toast } from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";
import {
  PageHeading,
  Plate,
  ConfirmDialog,
  tk,
  btnBase,
  fmtDate,
} from "../clients/components/clientUi";
import { money, num } from "./billingUtils";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const fetchWithAuth = async (url, options = {}) => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("authToken");
  if (!token) throw new Error("No authentication token found");
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    window.location.href = "/login";
  }
  return response;
};

const STATUS = {
  paid: "bg-green-500/10 text-green-600 border-green-500/30",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  "partially paid": "bg-blue-500/10 text-blue-500 border-blue-500/30",
  overdue: "bg-red-500/10 text-red-500 border-red-500/30",
};
const statusCls = (s) =>
  STATUS[String(s || "").toLowerCase()] ||
  "bg-slate-500/10 text-slate-500 border-slate-500/30";
const FILTERS = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "pending", label: "Pending" },
  { key: "partially paid", label: "Partial" },
  { key: "overdue", label: "Overdue" },
];
const invDate = (inv) => inv.date || inv.createdAt;
const isOverdue = (inv) =>
  inv.dueDate &&
  String(inv.status).toLowerCase() !== "paid" &&
  new Date(inv.dueDate) < new Date(new Date().toDateString());

export default function BillingList() {
  const { isDark } = useTheme();
  const t = tk(isDark);
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchWithAuth(`${API_URL}/api/invoices`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to fetch invoices");
      setInvoices(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(
    () =>
      invoices.reduce(
        (acc, inv) => {
          const amt = num(inv.grandTotal);
          const s = String(inv.status || "").toLowerCase();
          acc.total += 1;
          acc.totalAmount += amt;
          if (s === "paid") {
            acc.paid += 1;
            acc.paidAmount += amt;
          } else {
            acc.unpaid += 1;
            acc.unpaidAmount += amt;
          }
          return acc;
        },
        {
          total: 0,
          totalAmount: 0,
          paid: 0,
          paidAmount: 0,
          unpaid: 0,
          unpaidAmount: 0,
        },
      ),
    [invoices],
  );

  const counts = useMemo(() => {
    const c = { all: invoices.length };
    invoices.forEach((i) => {
      const k = String(i.status || "").toLowerCase();
      c[k] = (c[k] || 0) + 1;
    });
    return c;
  }, [invoices]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchesQuery =
        !term ||
        [
          inv.invoiceNumber,
          inv.client?.fullName,
          inv.client?.phone,
          inv.client?.regNumber,
          inv.vehicle,
          inv.notes,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term));
      const matchesStatus =
        filterStatus === "all" ||
        String(inv.status || "").toLowerCase() === filterStatus;
      return matchesQuery && matchesStatus;
    });
  }, [query, invoices, filterStatus]);

  const confirmDelete = async () => {
    const id = toDelete?.id;
    if (!id) return;
    try {
      setDeleting(true);
      const res = await fetchWithAuth(`${API_URL}/api/invoices/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to delete invoice");
      }
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      toast.success("Invoice deleted");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  const iconBtn = `flex h-8 w-8 items-center justify-center rounded-lg border-2 transition ${t.btnGhost}`;

  return (
    <div className="min-h-screen lg:ml-20">
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontSize: 14 } }}
      />
      <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-5">
        <PageHeading
          isDark={isDark}
          badge="Billing ledger"
          title="Invoices"
          accent="& payments."
          subtitle="Your billing history, payments and what's still due."
          right={
            <Link
              to="/billing/new"
              className={`${btnBase} h-10 px-4 ${t.btnPrimary} shadow-lg`}
            >
              <FiPlus size={14} /> New invoice
            </Link>
          }
        />

        {/* stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            isDark={isDark}
            icon={FiFileText}
            label="Invoices"
            value={stats.total}
          />
          <Stat
            isDark={isDark}
            icon={FaRupeeSign}
            label="Total billed"
            value={money(stats.totalAmount)}
          />
          <Stat
            isDark={isDark}
            icon={FiCheckCircle}
            label={`Paid · ${stats.paid}`}
            value={money(stats.paidAmount)}
            tone="green"
          />
          <Stat
            isDark={isDark}
            icon={FiClock}
            label={`Unpaid · ${stats.unpaid}`}
            value={money(stats.unpaidAmount)}
            tone="amber"
          />
        </div>

        {/* search + status chips */}
        <div className={`space-y-3 rounded-2xl border-2 p-3 sm:p-4 ${t.card}`}>
          <div className="relative">
            <FiSearch
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="search"
              placeholder="Search invoice no, client, phone, reg no…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`h-11 w-full rounded-xl border-2 pl-10 pr-3 text-[14px] font-semibold outline-none transition ${t.input}`}
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {FILTERS.map((f) => {
              const on = filterStatus === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilterStatus(f.key)}
                  className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg border-2 px-3 text-[12px] font-black uppercase tracking-wider transition ${
                    on ? `border-transparent ${t.chipNavy}` : `${t.btnGhost}`
                  }`}
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
            {(query || filterStatus !== "all") && (
              <button
                onClick={() => {
                  setQuery("");
                  setFilterStatus("all");
                }}
                className="ml-auto inline-flex shrink-0 items-center gap-1 px-2 text-[12px] font-black uppercase tracking-wider text-red-500 hover:underline"
              >
                <FiX size={12} /> Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-red-500/30 bg-red-500/10 px-4 py-3 text-[14px] font-semibold text-red-500">
            <span className="flex items-center gap-2">
              <FiAlertCircle size={16} /> {error}
            </span>
            <button
              onClick={load}
              className="inline-flex items-center gap-1 text-[12px] font-black uppercase tracking-wider hover:underline"
            >
              <FiRefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        <div className={`overflow-hidden rounded-2xl border-2 ${t.card}`}>
          {loading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-16 animate-pulse rounded-xl ${isDark ? "bg-white/5" : "bg-slate-100"}`}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <div
                className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${t.chipNavy}`}
              >
                <FiFileText size={18} />
              </div>
              <p
                className={`text-[16px] font-black uppercase tracking-tight ${t.heading}`}
              >
                No invoices found
              </p>
              <p className={`mt-1 text-[14px] ${t.muted}`}>
                {query || filterStatus !== "all"
                  ? "Try another search or status."
                  : "Create your first invoice to get started."}
              </p>
              <Link
                to="/billing/new"
                className={`${btnBase} mt-4 h-10 px-4 ${t.btnPrimary}`}
              >
                <FiPlus size={14} /> New invoice
              </Link>
            </div>
          ) : (
            <>
              {/* desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr
                      className={`border-b-2 ${t.line} ${isDark ? "bg-white/5" : "bg-[#F8FAFC]"}`}
                    >
                      {[
                        "Invoice",
                        "Client",
                        "Date",
                        "Due",
                        "Amount",
                        "Status",
                        "",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className={`whitespace-nowrap px-4 py-3 text-[12px] font-black uppercase tracking-[0.15em] text-slate-400 ${
                            i === 4
                              ? "text-right"
                              : i === 5
                                ? "text-center"
                                : ""
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((inv) => (
                      <tr
                        key={inv.id}
                        onClick={() => navigate(`/billing/${inv.id}`)}
                        className={`cursor-pointer border-b transition-colors last:border-0 ${
                          isDark
                            ? "border-white/5 hover:bg-white/5"
                            : "border-[#E2E8F0] hover:bg-[#F8FAFC]"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.chipNavy}`}
                            >
                              <FiFileText size={14} />
                            </div>
                            <p
                              className={`font-mono text-[14px] font-bold ${t.heading}`}
                            >
                              {inv.invoiceNumber}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p
                            className={`text-[14px] font-semibold ${t.heading}`}
                          >
                            {inv.client?.fullName || "Walk-in customer"}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <Plate value={inv.client?.regNumber} size="sm" />
                            {inv.client?.phone && (
                              <span className={`text-[12px] ${t.muted}`}>
                                {inv.client.phone}
                              </span>
                            )}
                          </div>
                        </td>
                        <td
                          className={`whitespace-nowrap px-4 py-3 text-[14px] ${t.body}`}
                        >
                          {fmtDate(invDate(inv))}
                        </td>
                        <td
                          className={`whitespace-nowrap px-4 py-3 text-[14px] ${isOverdue(inv) ? "font-bold text-red-500" : t.body}`}
                        >
                          {inv.dueDate ? fmtDate(inv.dueDate) : "—"}
                        </td>
                        <td
                          className={`whitespace-nowrap px-4 py-3 text-right text-[14px] font-black ${t.heading}`}
                        >
                          {money(inv.grandTotal)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-[12px] font-bold ${statusCls(inv.status)}`}
                          >
                            {inv.status || "Unknown"}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/billing/${inv.id}`)}
                              className={iconBtn}
                              title="View"
                            >
                              <FiEye size={14} />
                            </button>
                            <button
                              onClick={() =>
                                navigate(`/billing/${inv.id}/edit`)
                              }
                              className={iconBtn}
                              title="Edit"
                            >
                              <FiEdit size={14} />
                            </button>
                            <button
                              onClick={() => setToDelete(inv)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
                              title="Delete"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* phone / tablet cards */}
              <div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2 sm:p-3 lg:hidden">
                {filtered.map((inv) => (
                  <div
                    key={inv.id}
                    className={`rounded-xl border-2 p-3 ${t.inner}`}
                  >
                    <button
                      onClick={() => navigate(`/billing/${inv.id}`)}
                      className="block w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p
                            className={`truncate font-mono text-[14px] font-black ${t.heading}`}
                          >
                            {inv.invoiceNumber}
                          </p>
                          <p
                            className={`truncate text-[12px] font-semibold ${t.muted}`}
                          >
                            {inv.client?.fullName || "Walk-in customer"}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-px text-[12px] font-bold ${statusCls(inv.status)}`}
                        >
                          {inv.status || "—"}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Plate value={inv.client?.regNumber} size="sm" />
                        <span
                          className={`inline-flex items-center gap-1 text-[12px] ${t.muted}`}
                        >
                          <FiCalendar size={12} /> {fmtDate(invDate(inv))}
                        </span>
                        {isOverdue(inv) && (
                          <span className="text-[12px] font-bold text-red-500">
                            Overdue
                          </span>
                        )}
                      </div>
                    </button>
                    <div
                      className={`mt-2 flex items-center justify-between gap-2 border-t-2 pt-2 ${t.line}`}
                    >
                      <span className={`text-[16px] font-black ${t.heading}`}>
                        {money(inv.grandTotal)}
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => navigate(`/billing/${inv.id}/edit`)}
                          className={iconBtn}
                          aria-label="Edit"
                        >
                          <FiEdit size={14} />
                        </button>
                        <button
                          onClick={() => setToDelete(inv)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-red-500/30 text-red-500"
                          aria-label="Delete"
                        >
                          <FiTrash2 size={14} />
                        </button>
                        <button
                          onClick={() => navigate(`/billing/${inv.id}`)}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.chipNavy}`}
                          aria-label="Open"
                        >
                          <FiChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isDark={isDark}
        open={!!toDelete}
        title="Delete invoice?"
        message={`${toDelete?.invoiceNumber || "This invoice"} (${money(toDelete?.grandTotal)}) will be removed permanently.`}
        confirmText="Delete"
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function Stat({ isDark, icon: Icon, label, value, tone }) {
  const t = tk(isDark);
  const chip =
    tone === "green"
      ? "bg-green-500/10 text-green-600"
      : tone === "amber"
        ? "bg-amber-500/10 text-amber-600"
        : t.chipNavy;
  return (
    <div className={`rounded-2xl border-2 p-3 sm:p-4 ${t.card}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] font-bold uppercase leading-tight tracking-wider text-slate-400">
          {label}
        </p>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${chip}`}
        >
          <Icon size={14} />
        </div>
      </div>
      <p
        className={`mt-2 truncate text-[16px] font-black tracking-tight ${t.heading}`}
      >
        {value}
      </p>
    </div>
  );
}
