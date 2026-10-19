// client/src/pages/clients/ClientsList.jsx  (Car CRM – client directory)
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiUser,
  FiPhone,
  FiMail,
  FiCreditCard,
  FiHash,
  FiAlertCircle,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiUserPlus,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiUsers,
  FiLayers,
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";
import { Toaster, toast } from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";
import {
  PageHeading,
  Plate,
  VehicleImage,
  Modal,
  ConfirmDialog,
  tk,
  btnBase,
} from "./components/clientUi";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
const LIMIT = 12;

export default function ClientsList() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const t = tk(isDark);

  const [q, setQ] = useState("");
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const goLogin = useCallback(() => {
    localStorage.removeItem("token");
    navigate("/login");
  }, [navigate]);

  const fetchClients = useCallback(
    async (pageToFetch = 1, search = "") => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        if (!token) return goLogin();

        const url = `${API_BASE}/api/clients?page=${pageToFetch}&limit=${LIMIT}${search ? `&q=${encodeURIComponent(search)}` : ""}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) return goLogin();
        if (!res.ok) throw new Error("Couldn't load clients");

        const text = await res.text();
        let json = {};
        try {
          json = text ? JSON.parse(text) : {};
        } catch {
          throw new Error("Server returned an invalid response");
        }
        setData(json.data || []);
        setTotal(json.total || 0);
        setPage(json.page || pageToFetch);
      } catch (err) {
        console.error("Fetch clients failed:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [goLogin],
  );

  // first load + debounced search (runs once on mount too)
  useEffect(() => {
    const h = setTimeout(() => fetchClients(1, q.trim()), q ? 350 : 0);
    return () => clearTimeout(h);
  }, [q, fetchClients]);

  const confirmDelete = async () => {
    const id = toDelete?.id;
    if (!id || isNaN(Number(id))) {
      toast.error("Invalid client ID");
      setToDelete(null);
      return;
    }
    try {
      setDeleting(true);
      const token = localStorage.getItem("token");
      if (!token) return goLogin();
      const res = await fetch(`${API_BASE}/api/clients/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return goLogin();
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to delete client");
      }
      toast.success("Client deleted");
      setSelectedClient(null);
      // step back a page if we just removed the last card on this page
      const nextPage = data.length === 1 && page > 1 ? page - 1 : page;
      fetchClients(nextPage, q.trim());
    } catch (err) {
      console.error("Delete client failed:", err);
      toast.error(err.message);
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const from = total ? (page - 1) * LIMIT + 1 : 0;
  const to = Math.min(page * LIMIT, total);
  const openEdit = (c) =>
    navigate(`/clients/${c.id}/edit`, { state: { clientData: c } });

  return (
    <div className="min-h-screen lg:ml-20">
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontSize: 14 } }}
      />

      <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-5">
        <PageHeading
          isDark={isDark}
          badge="Client registry"
          title="Clients"
          accent="directory."
          subtitle="Every customer and their vehicle, searchable in one place."
          right={
            <Link
              to="/clients/new"
              className={`${btnBase} h-10 px-4 ${t.btnPrimary} shadow-lg`}
            >
              <FiUserPlus size={14} /> Add client
            </Link>
          }
        />

        {/* search + stats */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <FiSearch
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, phone, email or reg no…"
              className={`h-11 w-full rounded-xl border-2 pl-10 pr-10 text-[14px] font-semibold outline-none transition ${t.input}`}
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                aria-label="Clear search"
                className={`absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg ${t.muted} ${t.hoverRow}`}
              >
                <FiX size={14} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MiniStat
              isDark={isDark}
              icon={FiUsers}
              label="Clients"
              value={total}
            />
            <MiniStat
              isDark={isDark}
              icon={FiLayers}
              label="On page"
              value={data.length}
            />
            <MiniStat
              isDark={isDark}
              icon={FiCalendar}
              label="Page"
              value={`${page}/${totalPages}`}
            />
          </div>
        </div>

        {/* error */}
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-red-500/30 bg-red-500/10 px-4 py-3 text-[14px] font-semibold text-red-500">
            <span className="flex items-center gap-2">
              <FiAlertCircle size={16} /> {error}
            </span>
            <button
              onClick={() => fetchClients(page, q.trim())}
              className="inline-flex items-center gap-1 text-[12px] font-black uppercase tracking-wider hover:underline"
            >
              <FiRefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* list */}
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`h-[300px] animate-pulse rounded-2xl ${isDark ? "bg-white/5" : "bg-slate-200"}`}
              />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div
            className={`rounded-2xl border-2 px-4 py-14 text-center ${t.card}`}
          >
            <div
              className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${t.chipNavy}`}
            >
              <FiUser size={18} />
            </div>
            <p
              className={`text-[16px] font-black uppercase tracking-tight ${t.heading}`}
            >
              {q ? "No matches" : "No clients yet"}
            </p>
            <p className={`mt-1 text-[14px] ${t.muted}`}>
              {q
                ? `Nothing found for "${q}". Try another name or number.`
                : "Add your first client to get started."}
            </p>
            {!q && (
              <Link
                to="/clients/new"
                className={`${btnBase} mt-4 h-10 px-4 ${t.btnPrimary}`}
              >
                <FiUserPlus size={14} /> Add client
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {data.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                isDark={isDark}
                onView={() => navigate(`/clients/${client.id}`)}
                onEdit={() => openEdit(client)}
                onDelete={() => setToDelete(client)}
                onQuickView={() => setSelectedClient(client)}
              />
            ))}
          </div>
        )}

        {/* pagination */}
        {total > 0 && (
          <div
            className={`flex flex-col items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 sm:flex-row ${t.card}`}
          >
            <p className={`text-[12px] font-semibold ${t.muted}`}>
              Showing <b className={t.heading}>{from}</b>–
              <b className={t.heading}>{to}</b> of{" "}
              <b className={t.heading}>{total}</b>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => page > 1 && fetchClients(page - 1, q.trim())}
                disabled={page <= 1 || loading}
                className={`${btnBase} h-9 border-2 px-3 ${t.btnGhost}`}
              >
                <FiChevronLeft size={14} /> Prev
              </button>
              <span
                className={`flex h-9 min-w-[64px] items-center justify-center rounded-xl px-3 text-[12px] font-black ${t.chipNavy}`}
              >
                {page} / {totalPages}
              </span>
              <button
                onClick={() =>
                  page < totalPages && fetchClients(page + 1, q.trim())
                }
                disabled={page >= totalPages || loading}
                className={`${btnBase} h-9 border-2 px-3 ${t.btnGhost}`}
              >
                Next <FiChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* quick view */}
      <Modal
        isDark={isDark}
        open={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        icon={FaCar}
        title="Vehicle details"
        subtitle={selectedClient?.fullName}
        footer={
          selectedClient && (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => navigate(`/clients/${selectedClient.id}`)}
                className={`${btnBase} h-10 ${t.btnPrimary}`}
              >
                <FiEye size={14} /> View
              </button>
              <button
                onClick={() => openEdit(selectedClient)}
                className={`${btnBase} h-10 border-2 ${t.btnGhost}`}
              >
                <FiEdit size={14} /> Edit
              </button>
              <button
                onClick={() => setToDelete(selectedClient)}
                className={`${btnBase} h-10 border-2 border-red-500/40 text-red-500 hover:bg-red-500/10`}
              >
                <FiTrash2 size={14} /> Delete
              </button>
            </div>
          )
        }
      >
        {selectedClient && (
          <div className="space-y-4 p-4">
            <div
              className={`relative overflow-hidden rounded-xl border-2 ${t.inner}`}
            >
              <VehicleImage
                src={selectedClient.carImage}
                className="h-52 w-full !object-contain"
                label={`${selectedClient.vehicleMake || ""} ${selectedClient.vehicleModel || ""}`}
              />
              <div className="absolute bottom-2 left-2">
                <Plate value={selectedClient.regNumber} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <InfoItem
                isDark={isDark}
                icon={FiPhone}
                label="Phone"
                value={selectedClient.phone}
                href={selectedClient.phone && `tel:${selectedClient.phone}`}
              />
              <InfoItem
                isDark={isDark}
                icon={FiMail}
                label="Email"
                value={selectedClient.email}
                href={selectedClient.email && `mailto:${selectedClient.email}`}
              />
              <InfoItem
                isDark={isDark}
                icon={FaCar}
                label="Vehicle"
                value={`${selectedClient.vehicleMake || ""} ${selectedClient.vehicleModel || ""}`.trim()}
              />
              <InfoItem
                isDark={isDark}
                icon={FiCalendar}
                label="Year"
                value={selectedClient.vehicleYear}
              />
              <InfoItem
                isDark={isDark}
                icon={FiCreditCard}
                label="Reg no."
                value={selectedClient.regNumber}
                mono
              />
              <InfoItem
                isDark={isDark}
                icon={FiHash}
                label="VIN / Chassis"
                value={selectedClient.vin}
                mono
              />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isDark={isDark}
        open={!!toDelete}
        title="Delete client?"
        message={`${toDelete?.fullName || "This client"} and their vehicle details will be removed. This can't be undone.`}
        confirmText="Delete"
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

/* ───────────── pieces ───────────── */

function MiniStat({ isDark, icon: Icon, label, value }) {
  const t = tk(isDark);
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 ${t.card}`}
    >
      <div
        className={`hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:flex ${t.chipNavy}`}
      >
        <Icon size={12} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[12px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className={`truncate text-[14px] font-black ${t.heading}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function ClientCard({ client, isDark, onView, onEdit, onDelete, onQuickView }) {
  const t = tk(isDark);
  const vehicle =
    `${client.vehicleMake || ""} ${client.vehicleModel || ""}`.trim();
  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:-translate-y-0.5 ${t.card} ${isDark ? "" : "hover:border-[#001F3F]"}`}
    >
      {/* image */}
      <button
        type="button"
        onClick={onQuickView}
        className="relative block h-36 w-full overflow-hidden text-left"
        aria-label="Quick view"
      >
        <VehicleImage
          src={client.carImage}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
          label={vehicle}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#000814]/70 via-transparent to-transparent" />
        <div className="absolute bottom-2 left-2">
          <Plate value={client.regNumber} size="sm" />
        </div>
        {client.vehicleYear && (
          <span className="absolute right-2 top-2 rounded-md bg-[#000814]/70 px-1.5 py-px text-[12px] font-bold text-white backdrop-blur">
            {client.vehicleYear}
          </span>
        )}
      </button>

      {/* body */}
      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[14px] font-black ${t.chipNavy}`}
          >
            {client.fullName?.charAt(0)?.toUpperCase() || "C"}
          </div>
          <div className="min-w-0">
            <p className={`truncate text-[14px] font-black ${t.heading}`}>
              {client.fullName || "Unnamed client"}
            </p>
            <p className={`truncate text-[12px] font-semibold ${t.muted}`}>
              {vehicle || "Vehicle not set"}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 text-[12px] font-medium">
          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              className={`flex items-center gap-2 ${t.body} hover:underline`}
            >
              <FiPhone size={12} className="shrink-0 text-slate-400" />
              <span className="truncate">{client.phone}</span>
            </a>
          )}
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className={`flex items-center gap-2 ${t.body} hover:underline`}
            >
              <FiMail size={12} className="shrink-0 text-slate-400" />
              <span className="truncate">{client.email}</span>
            </a>
          )}
        </div>

        <div
          className={`mt-auto grid grid-cols-3 gap-2 border-t-2 pt-3 ${t.line}`}
        >
          <button
            onClick={onView}
            className={`${btnBase} h-9 ${t.btnPrimary}`}
            title="View details"
          >
            <FiEye size={14} /> <span className="hidden sm:inline">View</span>
          </button>
          <button
            onClick={onEdit}
            className={`${btnBase} h-9 border-2 ${t.btnGhost}`}
            title="Edit client"
          >
            <FiEdit size={14} /> <span className="hidden sm:inline">Edit</span>
          </button>
          <button
            onClick={onDelete}
            className={`${btnBase} h-9 border-2 border-red-500/30 text-red-500 hover:bg-red-500/10`}
            title="Delete client"
          >
            <FiTrash2 size={14} />{" "}
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ isDark, icon: Icon, label, value, href, mono }) {
  const t = tk(isDark);
  const content = (
    <>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.chipNavy}`}
      >
        <Icon size={12} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p
          className={`truncate text-[14px] font-bold ${t.heading} ${mono ? "font-mono" : ""}`}
        >
          {value || "—"}
        </p>
      </div>
    </>
  );
  const cls = `flex items-center gap-3 rounded-xl border-2 p-3 ${t.inner}`;
  return href ? (
    <a href={href} className={`${cls} hover:underline`}>
      {content}
    </a>
  ) : (
    <div className={cls}>{content}</div>
  );
}
