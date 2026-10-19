// client/src/pages/reports/Reports.jsx  (Car CRM – reports)
import React, { useState, useEffect, useCallback } from "react";
import {
  FiPrinter,
  FiDownload,
  FiBarChart2,
  FiList,
  FiUsers,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";
import { Toaster, toast } from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";
import AnalyticsView from "./AnalyticsView";
import ReportsList from "./ReportsList";
import ClientsReport from "./ClientsReport";
import { PageHeading, tk, btnBase } from "../clients/components/clientUi";

const listOf = (d) =>
  Array.isArray(d)
    ? d
    : d?.data || d?.clients || d?.invoices || d?.services || [];

/* tiny CSV helper (Excel-friendly, with BOM so ₹ and names show correctly) */
export const downloadCSV = (filename, rows) => {
  if (!rows.length) return false;
  const headers = Object.keys(rows[0]);
  const esc = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return true;
};

const d10 = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

const TABS = [
  { key: "analytics", label: "Analytics", icon: FiBarChart2 },
  {
    key: "reports",
    label: "Invoices & services",
    short: "Records",
    icon: FiList,
  },
  { key: "clients", label: "Clients", icon: FiUsers },
];

export default function Reports() {
  const { isDark } = useTheme();
  const t = tk(isDark);
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem("reportMode") || "analytics";
    } catch {
      return "analytics";
    }
  });
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [clientsReport, setClientsReport] = useState([]);
  const [error, setError] = useState(null);

  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in again.");
      setLoading(false);
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    const get = (path) =>
      fetch(`${base}${path}`, { headers }).then(async (r) => {
        if (!r.ok) throw new Error(path);
        return r.json();
      });

    // load everything in parallel; one failing section doesn't blank the others
    const [s, inv, cl, sv, cr] = await Promise.allSettled([
      get("/api/reports/summary"),
      get("/api/invoices"),
      get("/api/clients"),
      get("/api/reports/all-services"),
      get("/api/reports/clients-details"),
    ]);
    if (s.status === "fulfilled") setSummary(s.value);
    if (inv.status === "fulfilled") setInvoices(listOf(inv.value));
    if (cl.status === "fulfilled") setClients(listOf(cl.value));
    if (sv.status === "fulfilled") setServices(listOf(sv.value));
    if (cr.status === "fulfilled") setClientsReport(listOf(cr.value));
    const failed = [s, inv, cl, sv, cr].filter(
      (x) => x.status === "rejected",
    ).length;
    if (failed === 5)
      setError("Couldn't load reports. Check your connection and try again.");
    else if (failed) setError("Some report sections couldn't be loaded.");
    setLoading(false);
  }, [base]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleMode = (m) => {
    setMode(m);
    try {
      localStorage.setItem("reportMode", m);
    } catch {
      /* ignore */
    }
  };

  const handleExport = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    let ok = false;
    if (mode === "clients") {
      ok = downloadCSV(
        `clients_${stamp}.csv`,
        clientsReport.map((c) => ({
          Name: c.fullName,
          Phone: c.phone,
          Email: c.email,
          Year: c.vehicleYear,
          Make: c.vehicleMake,
          Model: c.vehicleModel,
          "Reg No": c.regNumber,
        })),
      );
    } else if (mode === "reports") {
      ok = downloadCSV(
        `invoices_${stamp}.csv`,
        invoices.map((i) => ({
          "Invoice No": i.invoiceNumber || i.id,
          Date: d10(i.date || i.createdAt),
          Client: i.client?.fullName || "",
          Phone: i.client?.phone || "",
          Status: i.status,
          "Grand Total": Number(i.grandTotal || 0).toFixed(2),
        })),
      );
    } else {
      const rows = [];
      const rs = summary?.revenueSummary || {};
      rows.push({
        Section: "Revenue",
        Item: "Total revenue",
        Value: rs.totalRevenue || 0,
      });
      rows.push({
        Section: "Revenue",
        Item: "Paid revenue",
        Value: rs.paidRevenue || 0,
      });
      rows.push({
        Section: "Revenue",
        Item: "Pending revenue",
        Value: rs.pendingRevenue || 0,
      });
      const ss = summary?.serviceSummary || {};
      [
        "totalServices",
        "completedServices",
        "pendingServices",
        "cancelledServices",
        "averageServiceCost",
      ].forEach((k) =>
        rows.push({ Section: "Services", Item: k, Value: ss[k] || 0 }),
      );
      (summary?.invoiceStatusSummary || []).forEach((s2) =>
        rows.push({ Section: "Invoices", Item: s2.status, Value: s2.count }),
      );
      (ss.topServiceTypes || []).forEach((s2) =>
        rows.push({ Section: "Top services", Item: s2.type, Value: s2.total }),
      );
      (summary?.topClients || []).forEach((c) =>
        rows.push({
          Section: "Top clients",
          Item: c.fullName,
          Value: c.totalSpent,
        }),
      );
      ok = downloadCSV(`analytics_${stamp}.csv`, rows);
    }
    if (ok) toast.success("CSV downloaded");
    else toast.error("Nothing to export yet");
  };

  return (
    <div className="min-h-screen lg:ml-20">
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontSize: 14 } }}
      />
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-5">
        <PageHeading
          isDark={isDark}
          badge="Business intelligence"
          title="Reports"
          accent="& analytics."
          subtitle="Revenue, services, invoices and clients in one view."
          right={
            <div className="no-print flex gap-2">
              <button
                onClick={() => window.print()}
                className={`${btnBase} h-10 border-2 px-4 ${t.btnGhost}`}
              >
                <FiPrinter size={14} /> Print
              </button>
              <button
                onClick={handleExport}
                disabled={loading}
                className={`${btnBase} h-10 px-4 ${t.btnPrimary} shadow-lg`}
              >
                <FiDownload size={14} /> Export CSV
              </button>
            </div>
          }
        />

        {/* tabs */}
        <div
          className={`no-print flex gap-1 overflow-x-auto rounded-2xl border-2 p-1.5 ${t.card}`}
        >
          {TABS.map(({ key, label, short, icon: Icon }) => {
            const on = mode === key;
            return (
              <button
                key={key}
                onClick={() => toggleMode(key)}
                className={`flex h-10 flex-1 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-[12px] font-black uppercase tracking-wider transition ${
                  on
                    ? `${t.chipNavy} shadow-lg`
                    : `${t.muted} ${isDark ? "hover:text-white" : "hover:text-[#001F3F]"}`
                }`}
              >
                <Icon size={14} />
                <span className="sm:hidden">{short || label}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-red-500/30 bg-red-500/10 px-4 py-3 text-[14px] font-semibold text-red-500">
            <span className="flex items-center gap-2">
              <FiAlertCircle size={16} /> {error}
            </span>
            <button
              onClick={fetchData}
              className="no-print inline-flex items-center gap-1 text-[12px] font-black uppercase tracking-wider hover:underline"
            >
              <FiRefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-24 animate-pulse rounded-2xl ${isDark ? "bg-white/5" : "bg-slate-200"}`}
                />
              ))}
            </div>
            <div
              className={`h-72 animate-pulse rounded-2xl ${isDark ? "bg-white/5" : "bg-slate-200"}`}
            />
          </div>
        ) : (
          <>
            {mode === "analytics" && (
              <AnalyticsView
                summary={summary}
                invoices={invoices}
                isDark={isDark}
              />
            )}
            {mode === "reports" && (
              <ReportsList
                invoices={invoices}
                clients={clients}
                services={services}
                isDark={isDark}
              />
            )}
            {mode === "clients" && (
              <ClientsReport clients={clientsReport} isDark={isDark} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
