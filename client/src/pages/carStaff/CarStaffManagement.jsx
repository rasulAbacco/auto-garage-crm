// client/src/pages/carStaff/CarStaffManagement.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Eye,
  Users,
  Wallet,
  CheckCircle2,
  Briefcase,
  UserPlus,
  Shield,
  ShieldAlert,
  XCircle,
  Calendar,
  Phone,
  RefreshCw,
  X,
  Loader2,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

import StaffEditModal from "../../components/Car/StaffEditModal";
import StaffViewModal from "../../components/Car/StaffViewModal";
import StaffCreateModal from "../../components/Car/StaffCreateModal";
import StaffLoginCreateModal from "../../components/Car/StaffLoginCreateModal";
import {
  tk,
  btnBase,
  PageHeading,
  ConfirmDialog,
  fmtDate,
  Avatar,
  StatTile,
  EmptyState,
  ErrorBar,
  SkeletonRows,
  inr,
  n,
  staffCode,
} from "../../components/Car/staffUi";

const API = import.meta.env.VITE_API_BASE_URL;
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const estSalary = (s) =>
  n(s.baseSalary) + n(s.bonusDefault) - n(s.extraDeductionsDefault);

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Login on" },
  { key: "inactive", label: "Login off" },
  { key: "none", label: "No login" },
];

const matchFilter = (s, f) => {
  if (f === "active") return Boolean(s.login?.isActive);
  if (f === "inactive") return Boolean(s.login) && !s.login.isActive;
  if (f === "none") return !s.login;
  return true;
};

export default function StaffManagement() {
  const { isDark } = useTheme();
  const t = tk(isDark);

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const [editStaff, setEditStaff] = useState(null);
  const [viewStaff, setViewStaff] = useState(null);
  const [loginStaff, setLoginStaff] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  /* ---------- fetch ---------- */
  const fetchStaff = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/car-staff`, {
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Could not load staff");
      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not load staff");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const refreshQuietly = () => fetchStaff(true);

  /* ---------- actions ---------- */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/api/car-staff/${deleteTarget.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to delete staff");
      }
      toast.success(`${deleteTarget.name} removed`);
      setDeleteTarget(null);
      refreshQuietly();
    } catch (err) {
      toast.error(err.message || "Failed to delete staff");
    } finally {
      setDeleting(false);
    }
  };

  const toggleLogin = async (s) => {
    setTogglingId(s.id);
    try {
      const res = await fetch(`${API}/api/car-staff/${s.id}/toggle`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Could not change login");
      toast.success(s.login?.isActive ? "Login turned off" : "Login turned on");
      await fetchStaff(true);
    } catch (err) {
      toast.error(err.message || "Could not change login");
    } finally {
      setTogglingId(null);
    }
  };

  /* ---------- derived ---------- */
  const filteredStaff = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return staff.filter(
      (s) =>
        matchFilter(s, filter) &&
        (!q ||
          s.name?.toLowerCase().includes(q) ||
          s.role?.toLowerCase().includes(q) ||
          String(s.phone || "").includes(q)),
    );
  }, [staff, searchTerm, filter]);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((f) => [
          f.key,
          staff.filter((s) => matchFilter(s, f.key)).length,
        ]),
      ),
    [staff],
  );

  const stats = useMemo(
    () => ({
      total: staff.length,
      active: staff.filter((s) => s.login?.isActive).length,
      payroll: staff.reduce((acc, s) => acc + estSalary(s), 0),
    }),
    [staff],
  );

  const clearAll = () => {
    setSearchTerm("");
    setFilter("all");
  };

  /* ---------- ui bits ---------- */
  const ActionBtn = ({ icon: Icon, onClick, danger, label }) => (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-xl border-2 transition ${
        danger
          ? isDark
            ? "border-white/10 text-slate-300 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
            : "border-[#CBD5E1] text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
          : t.btnGhost
      }`}
    >
      <Icon size={14} />
    </button>
  );

  const Access = ({ s }) => {
    if (!s.login) {
      return (
        <button
          type="button"
          onClick={() => setLoginStaff(s)}
          className={`inline-flex h-8 items-center gap-1.5 rounded-lg border-2 border-dashed px-3 text-[12px] font-black uppercase tracking-wider transition ${
            isDark
              ? "border-white/20 text-slate-300 hover:border-white/50 hover:text-white"
              : "border-[#CBD5E1] text-slate-500 hover:border-[#001F3F] hover:text-[#001F3F]"
          }`}
        >
          <UserPlus size={14} /> Create login
        </button>
      );
    }
    const on = s.login.isActive;
    const busy = togglingId === s.id;
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[12px] font-black uppercase tracking-wider ${
            on
              ? "border-green-500/30 bg-green-500/10 text-green-600"
              : "border-red-500/30 bg-red-500/10 text-red-500"
          }`}
        >
          {on ? <CheckCircle2 size={12} /> : <ShieldAlert size={12} />}
          {on ? "Active" : "Off"}
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={() => toggleLogin(s)}
          className={`inline-flex h-8 items-center gap-1 rounded-lg border-2 px-2.5 text-[12px] font-black uppercase tracking-wider transition disabled:opacity-50 ${
            on
              ? isDark
                ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                : "border-red-200 text-red-600 hover:bg-red-50"
              : isDark
                ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
                : "border-green-200 text-green-700 hover:bg-green-50"
          }`}
        >
          {busy ? (
            <Loader2 size={12} className="animate-spin" />
          ) : on ? (
            <XCircle size={12} />
          ) : (
            <CheckCircle2 size={12} />
          )}
          {on ? "Revoke" : "Enable"}
        </button>
      </div>
    );
  };

  const Actions = ({ s }) => (
    <div className="flex items-center justify-end gap-1.5">
      <ActionBtn
        icon={Eye}
        label="View details"
        onClick={() => setViewStaff(s)}
      />
      <ActionBtn
        icon={Edit3}
        label="Edit staff"
        onClick={() => setEditStaff(s)}
      />
      <ActionBtn
        icon={Trash2}
        label="Delete"
        danger
        onClick={() => setDeleteTarget(s)}
      />
    </div>
  );

  const rowHover = isDark ? "hover:bg-white/5" : "hover:bg-[#F8FAFC]";
  const th =
    "px-4 py-3 text-[12px] font-black uppercase tracking-wider text-slate-400";

  return (
    <div className="min-h-screen lg:ml-20">
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontSize: 14 } }}
      />

      <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-5">
        <PageHeading
          isDark={isDark}
          title="Staff"
          accent="management."
          subtitle="Your team, their roles, logins and default monthly pay."
          right={
            <>
              <button
                type="button"
                onClick={refreshQuietly}
                aria-label="Refresh"
                title="Refresh"
                className={`${btnBase} h-10 w-10 border-2 ${t.btnGhost}`}
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className={`${btnBase} h-10 px-4 shadow-lg ${t.btnPrimary}`}
              >
                <Plus size={14} strokeWidth={3} /> Add staff
              </button>
            </>
          }
        />

        {/* stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatTile
            isDark={isDark}
            title="Total staff"
            value={stats.total}
            icon={Users}
          />
          <StatTile
            isDark={isDark}
            title="Logins active"
            value={`${stats.active} / ${stats.total}`}
            icon={Shield}
            chip="bg-green-500/10 text-green-600"
          />
          <StatTile
            isDark={isDark}
            className="col-span-2 lg:col-span-1"
            title="Est. monthly payroll"
            value={inr(stats.payroll)}
            sub="Base + bonus − deductions (defaults)"
            icon={Wallet}
            chip="bg-blue-500/10 text-blue-500"
          />
        </div>

        <ErrorBar message={error} onRetry={() => fetchStaff()} />

        {/* list card */}
        <div className={`overflow-hidden rounded-2xl border-2 ${t.card}`}>
          {/* toolbar */}
          <div className={`space-y-3 border-b-2 p-3 sm:p-4 ${t.line}`}>
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, role or phone…"
                className={`h-11 w-full rounded-xl border-2 pl-10 pr-10 text-[14px] font-semibold outline-none transition ${t.input}`}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
              {FILTERS.map((f) => {
                const on = filter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg border-2 px-3 text-[12px] font-black uppercase tracking-wider transition ${
                      on
                        ? isDark
                          ? "border-white bg-white text-[#001F3F]"
                          : "border-[#001F3F] bg-[#001F3F] text-white"
                        : t.btnGhost
                    }`}
                  >
                    {f.label}
                    <span
                      className={`rounded px-1 ${on ? (isDark ? "bg-[#001F3F]/10" : "bg-white/20") : isDark ? "bg-white/10" : "bg-slate-100"}`}
                    >
                      {counts[f.key] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <SkeletonRows isDark={isDark} rows={5} />
          ) : error && !staff.length ? (
            <EmptyState
              isDark={isDark}
              icon={Users}
              title="Staff list unavailable"
              text="Check your connection and tap Retry above."
            />
          ) : filteredStaff.length === 0 ? (
            <EmptyState
              isDark={isDark}
              icon={Users}
              title={staff.length ? "No staff match" : "No staff yet"}
              text={
                staff.length
                  ? "Try a different search or filter."
                  : "Add your first team member to start tracking pay and logins."
              }
              action={
                staff.length ? (
                  <button
                    type="button"
                    onClick={clearAll}
                    className={`${btnBase} h-9 border-2 px-4 ${t.btnGhost}`}
                  >
                    Clear filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className={`${btnBase} h-9 px-4 ${t.btnPrimary}`}
                  >
                    <Plus size={14} /> Add staff
                  </button>
                )
              }
            />
          ) : (
            <>
              {/* desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full border-collapse text-left">
                  <thead className={`border-b-2 ${t.cardHead}`}>
                    <tr>
                      <th className={th}>Employee</th>
                      <th className={th}>Role</th>
                      <th className={th}>Joined</th>
                      <th className={th}>System access</th>
                      <th className={`${th} text-right`}>Est. salary</th>
                      <th className={`${th} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map((s) => (
                      <tr
                        key={s.id}
                        className={`border-b transition last:border-0 ${t.line} ${rowHover}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={s.name} isDark={isDark} />
                            <div className="min-w-0">
                              <p
                                className={`truncate text-[14px] font-black ${t.heading}`}
                              >
                                {s.name}
                              </p>
                              <p
                                className={`text-[12px] font-medium ${t.muted}`}
                              >
                                {staffCode(s.id)}
                                {s.phone ? ` · ${s.phone}` : ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[12px] font-bold ${t.inner} ${t.body}`}
                          >
                            <Briefcase size={12} className="opacity-70" />
                            {s.role || "Staff member"}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-[14px] ${t.body}`}>
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar size={14} className="opacity-60" />
                            {fmtDate(s.createdAt || s.joinDate)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Access s={s} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`font-mono text-[14px] font-black ${isDark ? "text-green-400" : "text-green-700"}`}
                          >
                            {inr(estSalary(s))}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Actions s={s} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* phone / tablet cards */}
              <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:hidden">
                {filteredStaff.map((s) => (
                  <div
                    key={s.id}
                    className={`rounded-2xl border-2 p-3 ${t.inner}`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={s.name} isDark={isDark} />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-[14px] font-black ${t.heading}`}
                        >
                          {s.name}
                        </p>
                        <p
                          className={`truncate text-[12px] font-medium ${t.muted}`}
                        >
                          {s.role || "Staff member"} · {staffCode(s.id)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 font-mono text-[14px] font-black ${isDark ? "text-green-400" : "text-green-700"}`}
                      >
                        {inr(estSalary(s))}
                      </span>
                    </div>

                    <div
                      className={`mt-3 grid grid-cols-2 gap-2 text-[12px] ${t.muted}`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Calendar size={12} />{" "}
                        {fmtDate(s.createdAt || s.joinDate)}
                      </span>
                      {s.phone ? (
                        <a
                          href={`tel:${s.phone}`}
                          className={`flex items-center gap-1.5 truncate font-bold ${t.heading}`}
                        >
                          <Phone size={12} /> {s.phone}
                        </a>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Phone size={12} /> —
                        </span>
                      )}
                    </div>

                    <div
                      className={`mt-3 flex flex-wrap items-center justify-between gap-2 border-t-2 pt-3 ${t.line}`}
                    >
                      <Access s={s} />
                      <Actions s={s} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* modals */}
      {showCreate && (
        <StaffCreateModal
          onClose={() => setShowCreate(false)}
          onSaved={refreshQuietly}
          isDark={isDark}
        />
      )}
      {editStaff && (
        <StaffEditModal
          staff={editStaff}
          onClose={() => setEditStaff(null)}
          onSaved={refreshQuietly}
          isDark={isDark}
        />
      )}
      {viewStaff && (
        <StaffViewModal
          staff={viewStaff}
          onClose={() => setViewStaff(null)}
          onEdit={() => {
            setEditStaff(viewStaff);
            setViewStaff(null);
          }}
          isDark={isDark}
        />
      )}
      {loginStaff && (
        <StaffLoginCreateModal
          staff={loginStaff}
          onClose={() => setLoginStaff(null)}
          onSaved={refreshQuietly}
        />
      )}

      <ConfirmDialog
        isDark={isDark}
        open={Boolean(deleteTarget)}
        title="Delete staff?"
        message={
          deleteTarget
            ? `${deleteTarget.name} will be removed from your staff list. This can't be undone.`
            : ""
        }
        confirmText="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  );
}
