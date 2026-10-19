// client/src/bikePages/client/Clients.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Phone,
  Plus,
  Search,
  RefreshCw,
  Bike,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  X,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import api from "../../utils/axiosInstance";

const PAGE_SIZES = [10, 30, 50, "all"];

const imageSrc = (img) => {
  if (!img) return null;
  if (img.startsWith("data:image") || img.startsWith("http")) return img;
  return `${import.meta.env.VITE_API_BASE_URL || ""}${img}`;
};

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

export default function Clients() {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleting, setDeleting] = useState(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/bikes");
      setClients(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      console.error("Fetch clients error:", err);
      toast.error(err.response?.data?.message || "Failed to load clients");
      setError("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/api/bikes/${deleting.id}`);
      toast.success("Client deleted");
      setClients((prev) => prev.filter((c) => c.id !== deleting.id));
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.response?.data?.message || "Failed to delete client");
    } finally {
      setDeleting(null);
    }
  };

  /* ---------- derived ---------- */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [
        c.ownerName,
        c.fullName,
        c.phone,
        c.bikeBrand,
        c.bikeModel,
        c.regNumber,
        c.vin,
        c.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [clients, search]);

  const addedThisMonth = useMemo(() => {
    const now = new Date();
    return clients.filter((c) => {
      if (!c.createdAt) return false;
      const d = new Date(c.createdAt);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [clients]);

  const brandsCount = useMemo(
    () =>
      new Set(
        clients
          .map((c) => (c.bikeBrand || "").trim().toLowerCase())
          .filter(Boolean),
      ).size,
    [clients],
  );

  const perPage = pageSize === "all" ? Math.max(filtered.length, 1) : pageSize;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const first = (safePage - 1) * perPage;
  const last = Math.min(first + perPage, filtered.length);
  const pageItems = filtered.slice(first, last);

  /* ---------- styles ---------- */
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

  const RegChip = ({ value }) =>
    value ? (
      <span
        className={`inline-block rounded border px-1.5 py-0.5 font-mono text-[12px] font-semibold tracking-wide ${t.chip}`}
      >
        {value}
      </span>
    ) : (
      <span className={t.faint}>—</span>
    );

  const Thumb = ({ client, size = "h-10 w-10" }) => {
    const src = imageSrc(client.adImage || client.bikeImage);
    return src ? (
      <img
        src={src}
        alt=""
        className={`${size} shrink-0 rounded-md border object-cover ${t.border}`}
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
    ) : (
      <div
        className={`${size} flex shrink-0 items-center justify-center rounded-md text-[12px] font-semibold ${isDark ? "bg-blue-500/15 text-blue-300" : "bg-blue-50 text-blue-700"}`}
      >
        {initials(client.ownerName || client.fullName)}
      </div>
    );
  };

  const stats = [
    {
      label: "Total clients",
      value: clients.length,
      icon: Users,
      tone: "text-blue-600",
    },
    {
      label: "Added this month",
      value: addedThisMonth,
      icon: CalendarPlus,
      tone: "text-emerald-600",
    },
    {
      label: "Bike brands",
      value: brandsCount,
      icon: Bike,
      tone: "text-indigo-600",
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
              Clients
            </p>
            <h1 className="mt-0.5 text-[16px] font-semibold">
              Customers & bikes
            </h1>
            <p className={`text-[12px] ${t.muted}`}>
              Manage customer details and their service history.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchClients}
              title="Refresh"
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md border ${t.btn2}`}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => navigate("/editclient/new")}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-blue-600 px-4 text-[14px] font-medium text-white hover:bg-blue-700 sm:flex-none"
            >
              <Plus size={15} /> Add client
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className={`rounded-lg border p-3.5 ${t.card}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`truncate text-[12px] ${t.muted}`}>
                  {s.label}
                </span>
                <s.icon size={14} className={`shrink-0 ${s.tone}`} />
              </div>
              <div className="mt-1 text-[16px] font-semibold">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className={`overflow-hidden rounded-lg border ${t.card}`}>
          {/* Search */}
          <div className={`border-b p-3 ${t.border}`}>
            <div className="relative">
              <Search
                size={14}
                className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${t.faint}`}
              />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name, phone, bike, reg. or chassis number…"
                className={`h-9 w-full rounded-md border pl-8 pr-8 text-[14px] outline-none transition focus:ring-2 ${t.input}`}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 ${t.faint} hover:opacity-80`}
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {error && !loading ? (
            <div
              className={`m-3 flex items-center gap-2 rounded-md border px-3 py-2.5 text-[14px] ${isDark ? "border-rose-500/30 bg-rose-500/10 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-700"}`}
            >
              <AlertCircle size={15} /> {error}
              <button
                onClick={fetchClients}
                className="ml-auto text-[12px] font-medium underline"
              >
                Retry
              </button>
            </div>
          ) : loading ? (
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
              <Users size={22} className={`mx-auto ${t.faint}`} />
              <p className="mt-2 text-[14px] font-medium">
                {clients.length
                  ? "No clients match your search"
                  : "No clients yet"}
              </p>
              <p className={`mt-0.5 text-[12px] ${t.muted}`}>
                {clients.length
                  ? "Try a different name, phone or number."
                  : "Add your first customer to get started."}
              </p>
              {!clients.length && (
                <button
                  onClick={() => navigate("/editclient/new")}
                  className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-4 text-[14px] font-medium text-white hover:bg-blue-700"
                >
                  <Plus size={15} /> Add client
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
                      <th className="px-4 py-2.5 font-medium">Customer</th>
                      <th className="px-4 py-2.5 font-medium">Bike</th>
                      <th className="px-4 py-2.5 font-medium">Reg. number</th>
                      <th className="px-4 py-2.5 font-medium">Phone</th>
                      <th className="px-4 py-2.5 font-medium">Added</th>
                      <th className="px-4 py-2.5 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${isDark ? "divide-white/5" : "divide-gray-100"}`}
                  >
                    {pageItems.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => navigate(`/bikes/${c.id}`)}
                        className={`cursor-pointer text-[14px] transition ${t.row}`}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-3">
                            <Thumb client={c} />
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {c.ownerName || c.fullName || "Unknown"}
                              </p>
                              {c.email && (
                                <p
                                  className={`truncate text-[12px] ${t.muted}`}
                                >
                                  {c.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <p>
                            {[c.bikeBrand, c.bikeModel]
                              .filter(Boolean)
                              .join(" ") || "—"}
                          </p>
                          {(c.bikeYear || c.fuel) && (
                            <p className={`text-[12px] ${t.muted}`}>
                              {[c.bikeYear, c.fuel].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <RegChip value={c.regNumber} />
                        </td>
                        <td className="px-4 py-2.5">
                          {c.phone ? (
                            <a
                              href={`tel:${c.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:underline"
                            >
                              {c.phone}
                            </a>
                          ) : (
                            <span className={t.faint}>—</span>
                          )}
                        </td>
                        <td className={`px-4 py-2.5 text-[12px] ${t.muted}`}>
                          {c.createdAt
                            ? new Date(c.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </td>
                        <td
                          className="px-4 py-2.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/bikes/${c.id}`)}
                              title="View"
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${t.icon}`}
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={() =>
                                navigate(`/bikes/${c.id}`, {
                                  state: { edit: true },
                                })
                              }
                              title="Edit"
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${t.icon}`}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => setDeleting(c)}
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
                {pageItems.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5"
                    onClick={() => navigate(`/bikes/${c.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <Thumb client={c} size="h-11 w-11" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-[14px] font-medium">
                            {c.ownerName || c.fullName || "Unknown"}
                          </p>
                          <RegChip value={c.regNumber} />
                        </div>
                        <p className={`truncate text-[12px] ${t.muted}`}>
                          {[c.bikeBrand, c.bikeModel]
                            .filter(Boolean)
                            .join(" ") || "—"}
                        </p>
                        {c.phone && (
                          <a
                            href={`tel:${c.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className={`mt-0.5 inline-flex items-center gap-1 text-[12px] ${t.muted}`}
                          >
                            <Phone size={11} /> {c.phone}
                          </a>
                        )}
                      </div>
                    </div>
                    <div
                      className="mt-2.5 flex gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          navigate(`/bikes/${c.id}`, { state: { edit: true } })
                        }
                        className={`inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border text-[12px] font-medium ${t.icon}`}
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => setDeleting(c)}
                        className={`inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border text-[12px] font-medium ${isDark ? "border-gray-600 text-rose-300" : "border-gray-200 text-rose-600"}`}
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
                      onChange={(e) => {
                        setPageSize(
                          e.target.value === "all"
                            ? "all"
                            : Number(e.target.value),
                        );
                        setPage(1);
                      }}
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
            <h3 className="text-[16px] font-semibold">Delete client?</h3>
            <p
              className={`mt-1.5 text-[14px] ${isDark ? "text-gray-300" : "text-gray-600"}`}
            >
              <b>{deleting.ownerName || "This client"}</b> (
              {deleting.regNumber || "no reg."}) and their records will be
              removed.
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
