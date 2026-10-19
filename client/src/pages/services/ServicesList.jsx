// client/src/pages/services/ServicesList.jsx  (Car CRM – services)
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiTool,
  FiPlus,
  FiSearch,
  FiFileText,
  FiAlertCircle,
  FiCalendar,
  FiX,
  FiEye,
  FiRefreshCw,
  FiSliders,
  FiChevronRight,
} from "react-icons/fi";
import { FaRupeeSign, FaWhatsapp } from "react-icons/fa";
import { useTheme } from "../../contexts/ThemeContext";
import {
  PageHeading,
  Plate,
  tk,
  btnBase,
  fmtDate,
  fmtMoney,
} from "../clients/components/clientUi";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

const apiRequest = (url) =>
  fetch(`${API_BASE}${url}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

const STATUS_STYLE = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  processing: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  paid: "bg-green-500/10 text-green-600 border-green-500/30",
};
const statusCls = (s) =>
  STATUS_STYLE[String(s || "").toLowerCase()] ||
  "bg-slate-500/10 text-slate-500 border-slate-500/30";

const APPROVAL = {
  PENDING: {
    label: "Waiting approval",
    cls: "text-amber-600 bg-amber-500/10 border-amber-500/30",
  },
  APPROVED: {
    label: "Approved",
    cls: "text-green-600 bg-green-500/10 border-green-500/30",
  },
  REJECTED: {
    label: "Rejected",
    cls: "text-red-500 bg-red-500/10 border-red-500/30",
  },
  CONDITION_REQUESTED: {
    label: "With conditions",
    cls: "text-orange-500 bg-orange-500/10 border-orange-500/30",
  },
  READY_SENT: {
    label: "Vehicle ready",
    cls: "text-blue-500 bg-blue-500/10 border-blue-500/30",
  },
};

const serviceDate = (s) => s.date || s.serviceInDate || s.createdAt;
const amountOf = (s) =>
  Number(s.cost) || Number(s.partsCost || 0) + Number(s.laborCost || 0);
const subNames = (s) =>
  (s.subServices?.length
    ? s.subServices.map((x) => x.name)
    : s.subService?.name
      ? [s.subService.name]
      : []
  ).filter(Boolean);
const titleOf = (s) => subNames(s).join(", ") || s.type || "General service";

export default function ServicesList() {
  const { isDark } = useTheme();
  const t = tk(isDark);
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiRequest("/api/services");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to fetch services");
      setServices(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
    (async () => {
      try {
        const res = await apiRequest("/api/services/list");
        const data = await res.json();
        if (res.ok) setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading categories:", err);
      }
    })();
  }, [loadServices]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const from = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const to = endDate ? new Date(`${endDate}T23:59:59.999`) : null; // include the whole end day
    return services.filter((s) => {
      const matchesSearch =
        !q ||
        [
          s.client?.fullName,
          s.client?.regNumber,
          s.client?.phone,
          s.status,
          s.category?.name,
          s.assignedMechanic,
          ...subNames(s),
          String(s.id),
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      const matchesCategory = selectedCategory
        ? s.category?.id === Number(selectedCategory)
        : true;
      const matchesStatus = selectedStatus
        ? s.status?.toLowerCase() === selectedStatus.toLowerCase()
        : true;
      const d = new Date(serviceDate(s));
      const matchesDate = (!from || d >= from) && (!to || d <= to);
      return matchesSearch && matchesCategory && matchesStatus && matchesDate;
    });
  }, [search, services, selectedCategory, selectedStatus, startDate, endDate]);

  const totalRevenue = services.reduce((sum, s) => sum + amountOf(s), 0);
  const filteredRevenue = filtered.reduce((sum, s) => sum + amountOf(s), 0);
  const pendingCount = services.filter(
    (s) => s.status?.toLowerCase() === "pending",
  ).length;
  const activeFilters = [
    selectedCategory,
    selectedStatus,
    startDate,
    endDate,
  ].filter(Boolean).length;
  const clearAll = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedStatus("");
    setStartDate("");
    setEndDate("");
  };

  const inputCls = `h-11 w-full rounded-xl border-2 px-3 text-[14px] font-semibold outline-none transition ${t.input} ${
    isDark ? "[&>option]:bg-[#000814] [color-scheme:dark]" : ""
  }`;

  return (
    <div className="min-h-screen lg:ml-20">
      <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-5">
        <PageHeading
          isDark={isDark}
          badge="Workshop jobs"
          title="Services"
          accent="ledger."
          subtitle="Every job card, its approval status and amount."
          right={
            <Link
              to="/services/new"
              className={`${btnBase} h-10 px-4 ${t.btnPrimary} shadow-lg`}
            >
              <FiPlus size={14} /> New service
            </Link>
          }
        />

        {/* stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            isDark={isDark}
            icon={FiTool}
            label="Total services"
            value={services.length}
          />
          <Stat
            isDark={isDark}
            icon={FiFileText}
            label="Showing"
            value={filtered.length}
          />
          <Stat
            isDark={isDark}
            icon={FiAlertCircle}
            label="Pending"
            value={pendingCount}
            tone="amber"
          />
          <Stat
            isDark={isDark}
            icon={FaRupeeSign}
            label={activeFilters || search ? "Filtered value" : "Total value"}
            value={fmtMoney(
              activeFilters || search ? filteredRevenue : totalRevenue,
            )}
            tone="green"
          />
        </div>

        {/* search + filters */}
        <div className={`rounded-2xl border-2 p-3 sm:p-4 ${t.card}`}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <FiSearch
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="search"
                placeholder="Search client, reg no, phone, mechanic, job #…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputCls} pl-10`}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`${btnBase} relative h-11 border-2 px-3 lg:hidden ${t.btnGhost}`}
              aria-label="Filters"
            >
              <FiSliders size={14} />
              {activeFilters > 0 && (
                <span
                  className={`absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[12px] ${t.chipNavy}`}
                >
                  {activeFilters}
                </span>
              )}
            </button>
          </div>

          <div
            className={`${showFilters ? "grid" : "hidden"} mt-3 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid lg:grid-cols-4`}
          >
            <FilterBox label="Category">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`${inputCls} cursor-pointer`}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FilterBox>
            <FilterBox label="Payment status">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={`${inputCls} cursor-pointer`}
              >
                <option value="">All status</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Paid">Paid</option>
              </select>
            </FilterBox>
            <FilterBox label="From">
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputCls}
              />
            </FilterBox>
            <FilterBox label="To">
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputCls}
              />
            </FilterBox>
          </div>

          {(activeFilters > 0 || search) && (
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className={`text-[12px] font-semibold ${t.muted}`}>
                {filtered.length} of {services.length} services match
              </p>
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1 text-[12px] font-black uppercase tracking-wider text-red-500 hover:underline"
              >
                <FiX size={12} /> Clear
              </button>
            </div>
          )}
        </div>

        {/* error */}
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-red-500/30 bg-red-500/10 px-4 py-3 text-[14px] font-semibold text-red-500">
            <span className="flex items-center gap-2">
              <FiAlertCircle size={16} /> {error}
            </span>
            <button
              onClick={loadServices}
              className="inline-flex items-center gap-1 text-[12px] font-black uppercase tracking-wider hover:underline"
            >
              <FiRefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* list */}
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
                <FiTool size={18} />
              </div>
              <p
                className={`text-[16px] font-black uppercase tracking-tight ${t.heading}`}
              >
                No services found
              </p>
              <p className={`mt-1 text-[14px] ${t.muted}`}>
                {activeFilters || search
                  ? "Try changing or clearing the filters."
                  : "Create your first job card to get started."}
              </p>
              <div className="mt-4 flex justify-center gap-2">
                {(activeFilters > 0 || search) && (
                  <button
                    onClick={clearAll}
                    className={`${btnBase} h-10 border-2 px-4 ${t.btnGhost}`}
                  >
                    Clear filters
                  </button>
                )}
                <Link
                  to="/services/new"
                  className={`${btnBase} h-10 px-4 ${t.btnPrimary}`}
                >
                  <FiPlus size={14} /> New service
                </Link>
              </div>
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
                        "Service",
                        "Client / vehicle",
                        "Date",
                        "WhatsApp",
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
                    {filtered.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => navigate(`/services/${s.id}`)}
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
                              <FiTool size={14} />
                            </div>
                            <div className="min-w-0">
                              <p
                                className={`max-w-[260px] truncate text-[14px] font-bold ${t.heading}`}
                                title={titleOf(s)}
                              >
                                {titleOf(s)}
                              </p>
                              <p className={`text-[12px] ${t.muted}`}>
                                #{s.id} · {s.category?.name || "Uncategorized"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p
                            className={`text-[14px] font-semibold ${t.heading}`}
                          >
                            {s.client?.fullName || "Unknown client"}
                          </p>
                          <div className="mt-0.5">
                            <Plate value={s.client?.regNumber} size="sm" />
                          </div>
                        </td>
                        <td
                          className={`whitespace-nowrap px-4 py-3 text-[14px] ${t.body}`}
                        >
                          {fmtDate(serviceDate(s))}
                        </td>
                        <td className="px-4 py-3">
                          <ApprovalBadge
                            status={s.approvalStatus}
                            isDark={isDark}
                          />
                        </td>
                        <td
                          className={`whitespace-nowrap px-4 py-3 text-right text-[14px] font-black ${t.heading}`}
                        >
                          {fmtMoney(amountOf(s))}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-[12px] font-bold ${statusCls(s.status)}`}
                          >
                            {s.status || "Unknown"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/services/${s.id}`);
                            }}
                            className={`${btnBase} h-8 border-2 px-3 ${t.btnGhost}`}
                          >
                            <FiEye size={12} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* phone / tablet cards */}
              <div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2 sm:p-3 lg:hidden">
                {filtered.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => navigate(`/services/${s.id}`)}
                    className={`flex flex-col gap-2 rounded-xl border-2 p-3 text-left transition ${t.inner} ${t.hoverRow}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className={`truncate text-[14px] font-black ${t.heading}`}
                        >
                          {s.client?.fullName || "Unknown client"}
                        </p>
                        <p
                          className={`truncate text-[12px] font-semibold ${t.muted}`}
                        >
                          {titleOf(s)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-px text-[12px] font-bold ${statusCls(s.status)}`}
                      >
                        {s.status || "—"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Plate value={s.client?.regNumber} size="sm" />
                      <span
                        className={`inline-flex items-center gap-1 text-[12px] ${t.muted}`}
                      >
                        <FiCalendar size={12} /> {fmtDate(serviceDate(s))}
                      </span>
                    </div>
                    <div
                      className={`flex items-center justify-between gap-2 border-t-2 pt-2 ${t.line}`}
                    >
                      <ApprovalBadge
                        status={s.approvalStatus}
                        isDark={isDark}
                      />
                      <span
                        className={`flex items-center gap-1 text-[14px] font-black ${t.heading}`}
                      >
                        {fmtMoney(amountOf(s))}{" "}
                        <FiChevronRight size={14} className="text-slate-400" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────── pieces ───────── */

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

function FilterBox({ label, children }) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      {children}
    </div>
  );
}

function ApprovalBadge({ status, isDark }) {
  const meta = APPROVAL[status];
  if (!meta) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[12px] font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}
      >
        <FaWhatsapp size={12} /> Not sent
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-px text-[12px] font-bold ${meta.cls}`}
    >
      <FaWhatsapp size={12} /> {meta.label}
    </span>
  );
}
