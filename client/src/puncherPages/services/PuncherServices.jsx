// src/puncherPages/services/PuncherServices.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { Wrench, PlusCircle, Car, Bike, Edit2, Trash2, Receipt, Clock, CheckCircle2 } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { puncherApi, inr, fmtDate, prettyEnum, statusClass } from "../puncherApi";
import usePuncherShop from "../usePuncherShop";
import ServiceFormModal from "./ServiceFormModal";
import {
  PageShell,
  PageHeader,
  StatCard,
  PrimaryButton,
  GhostButton,
  SearchInput,
  Segmented,
  Loading,
  ErrorBox,
  EmptyState,
  Modal,
  cx,
} from "../PuncherUI";

const STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export default function PuncherServices() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { catalog } = usePuncherShop();

  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [formOpen, setFormOpen] = useState(params.get("new") === "1");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([puncherApi("/services"), puncherApi("/clients")]);
      setServices(s);
      setClients(c);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter(
      (s) =>
        (statusFilter === "ALL" || s.status === statusFilter) &&
        (!q || [s.serviceName, s.client?.fullName, s.client?.phone, s.client?.regNumber].filter(Boolean).some((v) => v.toLowerCase().includes(q))),
    );
  }, [services, search, statusFilter]);

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    if (params.get("new")) setParams({}, { replace: true });
  };

  const changeStatus = async (s, status) => {
    const prev = s.status;
    setServices((list) => list.map((x) => (x.id === s.id ? { ...x, status } : x)));
    try {
      await puncherApi(`/services/${s.id}/status`, { method: "PATCH", body: { status } });
      toast.success(`Marked ${prettyEnum(status).toLowerCase()}`);
    } catch (e) {
      setServices((list) => list.map((x) => (x.id === s.id ? { ...x, status: prev } : x)));
      toast.error(e.message);
    }
  };

  const confirmDelete = async () => {
    try {
      await puncherApi(`/services/${deleting.id}`, { method: "DELETE" });
      toast.success("Service deleted");
      setServices((list) => list.filter((x) => x.id !== deleting.id));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const count = (st) => services.filter((s) => s.status === st).length;
  const unbilledValue = services.filter((s) => !s.billing && s.status !== "CANCELLED").reduce((sum, s) => sum + s.totalPrice, 0);

  return (
    <PageShell>
      <Toaster position="top-right" />
      <PageHeader
        isDark={isDark}
        title="Services"
        subtitle="Puncture repairs, tyre and wheel jobs"
        action={
          <PrimaryButton onClick={() => setFormOpen(true)}>
            <PlusCircle className="w-4 h-4" /> New Service
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard isDark={isDark} title="Total Jobs" value={services.length} icon={Wrench} gradient="from-sky-500 to-blue-600" />
        <StatCard isDark={isDark} title="Open Jobs" value={count("PENDING") + count("IN_PROGRESS")} icon={Clock} gradient="from-amber-500 to-orange-600" />
        <StatCard isDark={isDark} title="Completed" value={count("COMPLETED")} icon={CheckCircle2} gradient="from-emerald-500 to-green-600" />
        <StatCard isDark={isDark} title="Not Yet Billed" value={inr(unbilledValue)} icon={Receipt} gradient="from-violet-500 to-purple-600" />
      </div>

      <div className="flex flex-col gap-3 mb-6 lg:flex-row lg:items-center">
        <div className="flex-1">
          <SearchInput isDark={isDark} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by service, client, phone or registration..." aria-label="Search services" />
        </div>
        <div className="overflow-x-auto">
          <Segmented
            isDark={isDark}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: "ALL", label: "All" }, ...STATUSES.map((s) => ({ value: s, label: prettyEnum(s) }))]}
          />
        </div>
      </div>

      <ErrorBox message={error} isDark={isDark} />

      {loading ? (
        <Loading isDark={isDark} label="Loading services..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          isDark={isDark}
          icon={Wrench}
          title={services.length ? "No matching services" : "No services yet"}
          text={services.length ? "Try a different filter" : "Log your first puncture or tyre job"}
          action={!services.length && <PrimaryButton onClick={() => setFormOpen(true)}><PlusCircle className="w-4 h-4" /> New Service</PrimaryButton>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <div
              key={s.id}
              className={cx(
                "flex flex-col gap-4 p-5 rounded-xl border-2 transition-all hover:shadow-lg lg:flex-row lg:items-center lg:justify-between",
                isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100",
              )}
            >
              <div className="flex items-center min-w-0 gap-4">
                <div className="flex items-center justify-center w-12 h-12 text-white rounded-2xl shrink-0 bg-gradient-to-br from-sky-400 to-blue-500">
                  {s.vehicleType === "CAR" ? <Car className="w-6 h-6" /> : <Bike className="w-6 h-6" />}
                </div>
                <div className="min-w-0">
                  <p className={cx("text-lg font-bold truncate", isDark ? "text-white" : "text-gray-900")}>
                    {s.serviceName}{s.quantity > 1 ? ` × ${s.quantity}` : ""}
                  </p>
                  <p className="text-sm text-gray-500">
                    <button onClick={() => navigate(`/puncher-clients/${s.client?.id}`)} className="font-medium hover:text-sky-500">
                      {s.client?.fullName}
                    </button>
                    {s.client?.regNumber ? ` · ${s.client.regNumber}` : ""} · {fmtDate(s.serviceDate)}
                    {s.tyrePosition ? ` · ${prettyEnum(s.tyrePosition)}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className={cx("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>{inr(s.totalPrice)}</span>
                <select
                  aria-label="Change status"
                  value={s.status}
                  onChange={(e) => changeStatus(s, e.target.value)}
                  className={cx("px-3 py-2 rounded-lg text-xs font-semibold border-0 outline-none cursor-pointer", statusClass(s.status, isDark))}
                >
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>{prettyEnum(st)}</option>
                  ))}
                </select>
                {s.billing ? (
                  <GhostButton isDark={isDark} onClick={() => navigate(`/puncher-billing/${s.billing.id}`)}>
                    <Receipt className="w-4 h-4" /> {s.billing.invoiceNumber}
                  </GhostButton>
                ) : (
                  <>
                    {s.status !== "CANCELLED" && (
                      <GhostButton isDark={isDark} onClick={() => navigate(`/puncher-billing?new=1&clientId=${s.clientId}`)}>
                        <Receipt className="w-4 h-4" /> Bill
                      </GhostButton>
                    )}
                    <GhostButton isDark={isDark} aria-label="Edit service" onClick={() => { setEditing(s); setFormOpen(true); }}>
                      <Edit2 className="w-4 h-4" />
                    </GhostButton>
                    <GhostButton isDark={isDark} aria-label="Delete service" onClick={() => setDeleting(s)} className="hover:!text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </GhostButton>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ServiceFormModal
        open={formOpen}
        onClose={closeForm}
        service={editing}
        clients={clients}
        catalog={catalog}
        defaultClientId={params.get("clientId")}
        isDark={isDark}
        onSaved={load}
      />

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        isDark={isDark}
        title="Delete service?"
        footer={
          <>
            <GhostButton isDark={isDark} onClick={() => setDeleting(null)}>Cancel</GhostButton>
            <button onClick={confirmDelete} className="px-5 py-2.5 font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700">Delete</button>
          </>
        }
      >
        <p className={isDark ? "text-gray-300" : "text-gray-600"}>
          Delete <b>{deleting?.serviceName}</b> for {deleting?.client?.fullName}? This cannot be undone.
        </p>
      </Modal>
    </PageShell>
  );
}
