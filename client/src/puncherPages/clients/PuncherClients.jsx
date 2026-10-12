// src/puncherPages/clients/PuncherClients.jsx  — "Client Name" page
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { Users, PlusCircle, Phone, Car, Bike, Eye, Edit2, Trash2, Hash } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { puncherApi, fmtDate, VEHICLE_LABEL } from "../puncherApi";
import usePuncherShop from "../usePuncherShop";
import ClientFormModal from "./ClientFormModal";
import {
  PageShell,
  PageHeader,
  StatCard,
  PrimaryButton,
  SearchInput,
  Segmented,
  Loading,
  ErrorBox,
  EmptyState,
  Modal,
  GhostButton,
  cx,
} from "../PuncherUI";

export default function PuncherClients() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { catalog } = usePuncherShop();
  const vehicleTypes = catalog?.vehicleTypes || ["CAR", "BIKE"];

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("ALL");
  const [formOpen, setFormOpen] = useState(params.get("new") === "1");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setClients(await puncherApi("/clients"));
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
    return clients.filter(
      (c) =>
        (vehicleFilter === "ALL" || c.vehicleType === vehicleFilter) &&
        (!q ||
          [c.fullName, c.phone, c.regNumber, c.vehicleMake, c.vehicleModel]
            .filter(Boolean)
            .some((v) => v.toLowerCase().includes(q))),
    );
  }, [clients, search, vehicleFilter]);

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    if (params.get("new")) setParams({}, { replace: true });
  };

  const confirmDelete = async () => {
    try {
      await puncherApi(`/clients/${deleting.id}`, { method: "DELETE" });
      toast.success("Client deleted");
      setClients((cs) => cs.filter((c) => c.id !== deleting.id));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const count = (t) => clients.filter((c) => c.vehicleType === t).length;

  return (
    <PageShell>
      <Toaster position="top-right" />
      <PageHeader
        isDark={isDark}
        title="Client Name"
        subtitle="Customers and their vehicles"
        action={
          <PrimaryButton onClick={() => setFormOpen(true)}>
            <PlusCircle className="w-4 h-4" /> Add Client
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
        <StatCard isDark={isDark} title="Total Clients" value={clients.length} icon={Users} gradient="from-sky-500 to-blue-600" />
        {vehicleTypes.includes("CAR") && (
          <StatCard isDark={isDark} title="Car Clients" value={count("CAR")} icon={Car} gradient="from-violet-500 to-purple-600" />
        )}
        {vehicleTypes.includes("BIKE") && (
          <StatCard isDark={isDark} title="Bike Clients" value={count("BIKE")} icon={Bike} gradient="from-emerald-500 to-green-600" />
        )}
      </div>

      <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center">
        <div className="flex-1">
          <SearchInput
            isDark={isDark}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, vehicle or registration..."
            aria-label="Search clients"
          />
        </div>
        {vehicleTypes.length > 1 && (
          <Segmented
            isDark={isDark}
            value={vehicleFilter}
            onChange={setVehicleFilter}
            options={[
              { value: "ALL", label: "All" },
              { value: "CAR", label: "Car" },
              { value: "BIKE", label: "Bike" },
            ]}
          />
        )}
      </div>

      <ErrorBox message={error} isDark={isDark} />

      {loading ? (
        <Loading isDark={isDark} label="Loading clients..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          isDark={isDark}
          icon={Users}
          title={clients.length ? "No matching clients" : "No clients yet"}
          text={clients.length ? "Try a different search" : "Add your first customer to start logging puncture jobs"}
          action={
            !clients.length && (
              <PrimaryButton onClick={() => setFormOpen(true)}>
                <PlusCircle className="w-4 h-4" /> Add Client
              </PrimaryButton>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className={cx(
                "flex flex-col gap-4 p-5 rounded-xl border-2 transition-all hover:shadow-lg md:flex-row md:items-center md:justify-between",
                isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100",
              )}
            >
              <div className="flex items-center min-w-0 gap-4">
                <div className="flex items-center justify-center w-12 h-12 text-white rounded-2xl shrink-0 bg-gradient-to-br from-sky-400 to-blue-500">
                  {c.vehicleType === "CAR" ? <Car className="w-6 h-6" /> : <Bike className="w-6 h-6" />}
                </div>
                <div className="min-w-0">
                  <p className={cx("text-lg font-bold truncate", isDark ? "text-white" : "text-gray-900")}>{c.fullName}</p>
                  <div className="flex flex-wrap text-sm text-gray-500 gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {c.phone}
                    </span>
                    {c.regNumber && (
                      <span className="flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" /> {c.regNumber}
                      </span>
                    )}
                    <span>
                      {VEHICLE_LABEL[c.vehicleType]}
                      {c.vehicleMake ? ` · ${c.vehicleMake} ${c.vehicleModel || ""}` : ""}
                    </span>
                    <span>
                      {c._count?.services || 0} services · since {fmtDate(c.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <GhostButton isDark={isDark} onClick={() => navigate(`/puncher-clients/${c.id}`)} aria-label={`View ${c.fullName}`}>
                  <Eye className="w-4 h-4" /> View
                </GhostButton>
                <GhostButton
                  isDark={isDark}
                  onClick={() => {
                    setEditing(c);
                    setFormOpen(true);
                  }}
                  aria-label={`Edit ${c.fullName}`}
                >
                  <Edit2 className="w-4 h-4" />
                </GhostButton>
                <GhostButton isDark={isDark} onClick={() => setDeleting(c)} aria-label={`Delete ${c.fullName}`} className="hover:!text-red-500">
                  <Trash2 className="w-4 h-4" />
                </GhostButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <ClientFormModal
        open={formOpen}
        onClose={closeForm}
        client={editing}
        vehicleTypes={vehicleTypes}
        isDark={isDark}
        onSaved={load}
      />

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        isDark={isDark}
        title="Delete client?"
        footer={
          <>
            <GhostButton isDark={isDark} onClick={() => setDeleting(null)}>
              Cancel
            </GhostButton>
            <button onClick={confirmDelete} className="px-5 py-2.5 font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700">
              Delete
            </button>
          </>
        }
      >
        <p className={isDark ? "text-gray-300" : "text-gray-600"}>
          This removes <b>{deleting?.fullName}</b> along with all of their services and bills. This cannot be undone.
        </p>
      </Modal>
    </PageShell>
  );
}
