// client/src/bikePages/services/services.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  RefreshCw,
  Wrench,
  Clock,
  Loader,
  IndianRupee,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";
import api from "../../utils/axiosInstance";

const STATUSES = ["Pending", "In Progress", "Completed", "Cancelled"];
const PAGE_SIZES = [10, 30, 50, "all"];

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const serviceTitle = (s) =>
  s.subService?.name ||
  s.subServiceText ||
  s.category?.name ||
  s.categoryText ||
  "Service";

const statusTone = (status, isDark) => {
  switch (status) {
    case "Completed":
      return isDark
        ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/30"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "In Progress":
      return isDark
        ? "bg-blue-500/10 text-blue-300 border-blue-400/30"
        : "bg-blue-50 text-blue-700 border-blue-200";
    case "Cancelled":
      return isDark
        ? "bg-rose-500/10 text-rose-300 border-rose-400/30"
        : "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return isDark
        ? "bg-amber-500/10 text-amber-300 border-amber-400/30"
        : "bg-amber-50 text-amber-700 border-amber-200";
  }
};

export default function Services() {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleting, setDeleting] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/bike-services");
      setServices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch services error:", err);
      toast.error(err.response?.data?.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  /* ---------------- actions ---------------- */
  const updateStatus = async (serviceId, newStatus) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service || service.status === newStatus) return;

    try {
      setUpdatingId(serviceId);
      await api.put(`/api/bike-services/${serviceId}`, {
        clientId: service.clientId,
        categoryId: service.categoryId,
        subServiceId: service.subServiceId,
        categoryText: service.categoryText || "",
        subServiceText: service.subServiceText || "",
        inDate: service.inDate,
        outDate: service.outDate || null,
        expectedDelivery: service.expectedDelivery || null,
        status: newStatus,
        priority: service.priority || "Normal",
        assignedMechanic: service.assignedMechanic || "",
        notes: service.notes || "",
        discountType: service.discountType || "Fixed Amount",
        // the saved discount lives in `discount` (there is no `discountValue` field)
        discountValue: service.discount ?? service.discountValue ?? 0,
        advancePaid: Number(service.advancePaid || 0),
        invoiceStatus: service.invoiceStatus || "draft",
        parsedServiceItems: service.serviceItems || [],
      });
      setServices((prev) =>
        prev.map((s) => (s.id === serviceId ? { ...s, status: newStatus } : s)),
      );
      toast.success(`Marked as ${newStatus}`);
    } catch (err) {
      console.error("Status update error:", err);
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/api/bike-services/${deleting.id}`);
      setServices((prev) => prev.filter((s) => s.id !== deleting.id));
      toast.success("Service deleted");
    } catch (err) {
      console.error("Delete service error:", err);
      toast.error(err.response?.data?.message || "Failed to delete service");
    } finally {
      setDeleting(null);
    }
  };

  /* ---------------- derived ---------------- */
  const counts = useMemo(() => {
    const c = { All: services.length };
    STATUSES.forEach((s) => (c[s] = 0));
    services.forEach((s) => (c[s.status] = (c[s.status] || 0) + 1));
    return c;
  }, [services]);

  const revenue = useMemo(
    () => services.reduce((sum, s) => sum + Number(s.grandTotal || 0), 0),
    [services],
  );
  const due = useMemo(
    () =>
      services
        .filter((s) => s.paymentStatus !== "Paid")
        .reduce((sum, s) => sum + Math.max(0, Number(s.balanceDue || 0)), 0),
    [services],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services
      .filter((s) => statusFilter === "All" || s.status === statusFilter)
      .filter(
        (s) =>
          !q ||
          [
            serviceTitle(s),
            s.category?.name,
            s.categoryText,
            s.client?.ownerName,
            s.client?.regNumber,
            s.client?.phone,
            s.assignedMechanic,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q),
      )
      .sort(
        (a, b) =>
          new Date(b.inDate || b.createdAt) - new Date(a.inDate || a.createdAt),
      );
  }, [services, search, statusFilter]);

  useEffect(() => setPage(1), [search, statusFilter, pageSize]);

  const perPage = pageSize === "all" ? Math.max(filtered.length, 1) : pageSize;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const first = (safePage - 1) * perPage;
  const last = Math.min(first + perPage, filtered.length);
  const pageItems = filtered.slice(first, last);

  /* ---------------- styles ---------------- */
  const t = isDark
    ? {
        page: "bg-gray-900 text-gray-100",
        card: "bg-gray-800 border-gray-700",
        border: "border-gray-700",
        muted: "text-gray-400",
        faint: "text-gray-500",
        thead: "bg-white/[0.03] text-gray-400",
        row: "hover:bg-white/[0.03]",
        input:
          "bg-gray-900 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:ring-blue-400/20 focus:border-blue-400",
        btn2: "border-gray-600 text-gray-200 hover:bg-gray-700",
        icon: "border-gray-600 text-gray-300 hover:bg-gray-700",
        chip: "bg-gray-900 text-gray-200 border-gray-600",
      }
    : {
        page: "bg-gray-50 text-gray-800",
        card: "bg-white border-gray-200",
        border: "border-gray-200",
        muted: "text-gray-500",
        faint: "text-gray-400",
        thead: "bg-gray-50 text-gray-500",
        row: "hover:bg-gray-50/80",
        input:
          "bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 focus:ring-blue-500/15 focus:border-blue-500",
        btn2: "border-gray-300 text-gray-700 hover:bg-gray-50",
        icon: "border-gray-200 text-gray-600 hover:bg-gray-50",
        chip: "bg-gray-100 text-gray-700 border-gray-200",
      };

  const StatusSelect = ({ s }) => (
    <select
      value={s.status || "Pending"}
      disabled={updatingId === s.id}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => updateStatus(s.id, e.target.value)}
      className={`h-7 cursor-pointer rounded-full border px-2 pr-6 text-[12px] font-medium outline-none disabled:opacity-60 ${statusTone(s.status, isDark)}`}
    >
      {STATUSES.map((st) => (
        <option
          key={st}
          value={st}
          className={
            isDark ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"
          }
        >
          {st}
        </option>
      ))}
    </select>
  );

  const Payment = ({ s }) =>
    s.paymentStatus === "Paid" ? (
      <p className="text-[12px] font-medium text-emerald-600">
        Paid
        {s.bikeInvoice?.paymentMode ? ` · ${s.bikeInvoice.paymentMode}` : ""}
      </p>
    ) : Number(s.balanceDue) > 0 ? (
      <p className="text-[12px] font-medium text-rose-500">
        Due {money(s.balanceDue)}
      </p>
    ) : null;

  const stats = [
    {
      label: "Total services",
      value: counts.All,
      icon: Wrench,
      tone: "text-blue-600",
    },
    {
      label: "Pending",
      value: counts.Pending,
      icon: Clock,
      tone: "text-amber-600",
    },
    {
      label: "In progress",
      value: counts["In Progress"],
      icon: Loader,
      tone: "text-indigo-600",
    },
    {
      label: "Revenue",
      value: money(revenue),
      sub: due > 0 ? `${money(due)} due` : null,
      icon: IndianRupee,
      tone: "text-emerald-600",
    },
  ];

  return (
    <div
      className={`min-h-screen px-3 py-4 text-[14px] sm:px-5 lg:px-8 ${t.page}`}
    >
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontSize: "14px" } }}
      />

      <div className="mx-auto max-w-7xl space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className={`text-[12px] font-medium uppercase tracking-[0.14em] ${t.muted}`}
            >
              Services
            </p>
            <h1 className="mt-0.5 text-[16px] font-semibold">Service jobs</h1>
            <p className={`text-[12px] ${t.muted}`}>
              Track every bike in the workshop, from check-in to delivery.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchServices}
              title="Refresh"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md border ${t.btn2}`}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => navigate("/bike-services/add")}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-blue-600 px-4 text-[14px] font-medium text-white hover:bg-blue-700 sm:flex-none"
            >
              <Plus size={15} /> New service
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className={`rounded-lg border p-3.5 ${t.card}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`truncate text-[12px] ${t.muted}`}>
                  {s.label}
                </span>
                <s.icon size={14} className={`shrink-0 ${s.tone}`} />
              </div>
              <div className="mt-1 truncate text-[16px] font-semibold">
                {s.value}
              </div>
              {s.sub && (
                <p className="truncate text-[12px] text-rose-500">{s.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* List card */}
        <div className={`overflow-hidden rounded-lg border ${t.card}`}>
          {/* Toolbar */}
          <div className={`space-y-3 border-b p-3 ${t.border}`}>
            <div className="relative">
              <Search
                size={14}
                className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${t.faint}`}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search service, customer, reg. number, phone or mechanic…"
                className={`h-9 w-full rounded-md border pl-8 pr-8 text-[14px] outline-none transition focus:ring-2 ${t.input}`}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 ${t.faint}`}
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
              {["All", ...STATUSES].map((st) => {
                const active = statusFilter === st;
                return (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition ${
                      active ? "border-blue-600 bg-blue-600 text-white" : t.btn2
                    }`}
                  >
                    {st}
                    <span
                      className={`rounded-full px-1.5 text-[12px] ${active ? "bg-white/20" : isDark ? "bg-gray-700" : "bg-gray-100"}`}
                    >
                      {counts[st] || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-12 animate-pulse rounded-md ${isDark ? "bg-gray-700/50" : "bg-gray-100"}`}
                />
              ))}
            </div>
          ) : pageItems.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <AlertCircle size={22} className={`mx-auto ${t.faint}`} />
              <p className="mt-2 text-[14px] font-medium">
                {services.length
                  ? "No services match your filters"
                  : "No services yet"}
              </p>
              <p className={`mt-0.5 text-[12px] ${t.muted}`}>
                {services.length
                  ? "Try another search or status."
                  : "Create the first service job for a customer's bike."}
              </p>
              {!services.length && (
                <button
                  onClick={() => navigate("/bike-services/add")}
                  className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-4 text-[14px] font-medium text-white hover:bg-blue-700"
                >
                  <Plus size={15} /> New service
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full text-left">
                  <thead className={t.thead}>
                    <tr className="text-[12px] font-medium uppercase tracking-wide">
                      <th className="px-4 py-2.5 font-medium">Service</th>
                      <th className="px-4 py-2.5 font-medium">
                        Customer / bike
                      </th>
                      <th className="px-4 py-2.5 font-medium">In date</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 text-right font-medium">
                        Amount
                      </th>
                      <th className="px-4 py-2.5 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${isDark ? "divide-white/5" : "divide-gray-100"}`}
                  >
                    {pageItems.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => navigate(`/bike-services/${s.id}`)}
                        className={`cursor-pointer text-[14px] transition ${t.row}`}
                      >
                        <td className="px-4 py-2.5">
                          <p className="font-medium">{serviceTitle(s)}</p>
                          <p className={`text-[12px] ${t.muted}`}>
                            #{s.id}
                            {s.category?.name || s.categoryText
                              ? ` · ${s.category?.name || s.categoryText}`
                              : ""}
                            {s.priority && s.priority !== "Normal"
                              ? ` · ${s.priority}`
                              : ""}
                          </p>
                        </td>
                        <td className="px-4 py-2.5">
                          <p>{s.client?.ownerName || "—"}</p>
                          <p className={`text-[12px] ${t.muted}`}>
                            {s.client?.regNumber && (
                              <span
                                className={`mr-1 rounded border px-1 font-mono text-[12px] ${t.chip}`}
                              >
                                {s.client.regNumber}
                              </span>
                            )}
                            {[s.client?.bikeBrand, s.client?.bikeModel]
                              .filter(Boolean)
                              .join(" ")}
                          </p>
                        </td>
                        <td className="px-4 py-2.5">
                          <p>{fmtDate(s.inDate)}</p>
                          {s.assignedMechanic && (
                            <p className={`text-[12px] ${t.muted}`}>
                              {s.assignedMechanic}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusSelect s={s} />
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          <p className="font-medium">{money(s.grandTotal)}</p>
                          <Payment s={s} />
                        </td>
                        <td
                          className="px-4 py-2.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/bike-services/${s.id}`)}
                              title="View"
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${t.icon}`}
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={() => setDeleting(s)}
                              title="Delete"
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${isDark ? "border-gray-600 text-rose-300 hover:bg-rose-500/10" : "border-gray-200 text-rose-600 hover:bg-rose-50"}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div
                className={`divide-y md:hidden ${isDark ? "divide-white/5" : "divide-gray-100"}`}
              >
                {pageItems.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5"
                    onClick={() => navigate(`/bike-services/${s.id}`)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-medium">
                          {serviceTitle(s)}
                        </p>
                        <p className={`truncate text-[12px] ${t.muted}`}>
                          {s.client?.ownerName || "—"}
                          {s.client?.regNumber
                            ? ` · ${s.client.regNumber}`
                            : ""}
                        </p>
                        <p className={`text-[12px] ${t.faint}`}>
                          {fmtDate(s.inDate)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[14px] font-medium">
                          {money(s.grandTotal)}
                        </p>
                        <Payment s={s} />
                      </div>
                    </div>
                    <div
                      className="mt-2.5 flex items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <StatusSelect s={s} />
                      <button
                        onClick={() => setDeleting(s)}
                        className={`inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[12px] font-medium ${isDark ? "border-gray-600 text-rose-300" : "border-gray-200 text-rose-600"}`}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div
                className={`flex flex-col items-center justify-between gap-2 border-t px-4 py-2.5 sm:flex-row ${t.border}`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <label
                    className={`flex items-center gap-2 text-[12px] ${t.muted}`}
                  >
                    Rows
                    <select
                      value={pageSize}
                      onChange={(e) =>
                        setPageSize(
                          e.target.value === "all"
                            ? "all"
                            : Number(e.target.value),
                        )
                      }
                      className={`h-8 rounded-md border px-2 text-[12px] outline-none ${t.input}`}
                    >
                      {PAGE_SIZES.map((s) => (
                        <option key={s} value={s}>
                          {s === "all" ? "All" : s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className={`text-[12px] ${t.muted}`}>
                    {first + 1}–{last} of {filtered.length}
                  </p>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={safePage === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border disabled:cursor-not-allowed disabled:opacity-40 ${t.icon}`}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <span className="px-2 text-[12px]">
                      Page {safePage} of {totalPages}
                    </span>
                    <button
                      disabled={safePage === totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border disabled:cursor-not-allowed disabled:opacity-40 ${t.icon}`}
                      aria-label="Next page"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className={`w-full max-w-sm rounded-lg border p-5 shadow-xl ${t.card}`}
          >
            <h3 className="text-[16px] font-semibold">Delete service?</h3>
            <p
              className={`mt-1.5 text-[14px] ${isDark ? "text-gray-300" : "text-gray-600"}`}
            >
              <b>{serviceTitle(deleting)}</b> for{" "}
              {deleting.client?.ownerName || "this customer"} (
              {fmtDate(deleting.inDate)}) will be removed.
            </p>
            <p className="mt-1 text-[12px] text-rose-500">
              This can't be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleting(null)}
                className={`h-9 rounded-md border px-4 text-[14px] font-medium ${t.btn2}`}
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
