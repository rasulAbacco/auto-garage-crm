// src/puncherPages/clients/PuncherClientDetails.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ArrowLeft, Car, Bike, Phone, Mail, MapPin, Hash, Wrench, Receipt, PlusCircle, Edit2 } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { puncherApi, inr, fmtDate, prettyEnum, VEHICLE_LABEL } from "../puncherApi";
import usePuncherShop from "../usePuncherShop";
import ClientFormModal from "./ClientFormModal";
import { PageShell, Card, Badge, Loading, ErrorBox, PrimaryButton, GhostButton, cx } from "../PuncherUI";

export default function PuncherClientDetails() {
  const { id } = useParams();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { catalog } = usePuncherShop();
  const [client, setClient] = useState(null);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const load = async () => {
    try {
      setClient(await puncherApi(`/clients/${id}`));
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!client && !error) return <PageShell><Loading isDark={isDark} /></PageShell>;

  const totalSpent = client?.billings.filter((b) => b.status === "PAID").reduce((s, b) => s + b.grandTotal, 0) || 0;
  const unbilled = client?.services.filter((s) => s.status !== "CANCELLED").length || 0;
  const text = isDark ? "text-white" : "text-gray-900";

  return (
    <PageShell>
      <Toaster position="top-right" />
      <button onClick={() => navigate("/puncher-clients")} className="flex items-center gap-2 mb-6 text-sm font-semibold text-sky-500 hover:text-sky-600">
        <ArrowLeft className="w-4 h-4" /> Back to clients
      </button>
      <ErrorBox message={error} isDark={isDark} />

      {client && (
        <>
          <Card isDark={isDark} className="mb-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center text-white w-14 h-14 rounded-2xl shrink-0 bg-gradient-to-br from-sky-400 to-blue-500">
                  {client.vehicleType === "CAR" ? <Car className="w-7 h-7" /> : <Bike className="w-7 h-7" />}
                </div>
                <div>
                  <h1 className={cx("text-2xl font-bold", text)}>{client.fullName}</h1>
                  <p className="text-sm text-gray-500">
                    {VEHICLE_LABEL[client.vehicleType]}
                    {client.vehicleMake ? ` · ${client.vehicleMake} ${client.vehicleModel || ""}` : ""} · Client since {fmtDate(client.createdAt)}
                  </p>
                  <div className={cx("flex flex-wrap gap-x-5 gap-y-2 mt-3 text-sm", isDark ? "text-gray-300" : "text-gray-700")}>
                    <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-sky-500" /> {client.phone}</span>
                    {client.regNumber && <span className="flex items-center gap-1.5"><Hash className="w-4 h-4 text-sky-500" /> {client.regNumber}</span>}
                    {client.email && <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-sky-500" /> {client.email}</span>}
                    {client.address && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-sky-500" /> {client.address}</span>}
                  </div>
                  {client.notes && <p className="mt-3 text-sm text-gray-500">{client.notes}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <GhostButton isDark={isDark} onClick={() => setEditOpen(true)}><Edit2 className="w-4 h-4" /> Edit</GhostButton>
                <PrimaryButton onClick={() => navigate(`/puncher-services?new=1&clientId=${client.id}`)}>
                  <PlusCircle className="w-4 h-4" /> New Service
                </PrimaryButton>
              </div>
            </div>
            <div className={cx("grid grid-cols-3 gap-4 pt-6 mt-6 border-t", isDark ? "border-gray-700" : "border-gray-100")}>
              {[
                ["Services", client.services.length],
                ["Bills", client.billings.length],
                ["Total Paid", inr(totalSpent)],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{l}</p>
                  <p className={cx("text-xl font-bold", text)}>{v}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card isDark={isDark}>
              <h2 className={cx("flex items-center gap-2 mb-4 text-lg font-bold", text)}><Wrench className="w-5 h-5 text-sky-500" /> Service History</h2>
              {client.services.length === 0 ? (
                <p className="text-sm text-gray-500">No services yet.</p>
              ) : (
                <ul className="space-y-3">
                  {client.services.map((s) => (
                    <li key={s.id} className={cx("flex items-center justify-between gap-3 p-3 rounded-xl", isDark ? "bg-gray-900/60" : "bg-slate-50")}>
                      <div className="min-w-0">
                        <p className={cx("font-semibold truncate", text)}>{s.serviceName}{s.quantity > 1 ? ` × ${s.quantity}` : ""}</p>
                        <p className="text-xs text-gray-500">{fmtDate(s.serviceDate)}{s.tyrePosition ? ` · ${prettyEnum(s.tyrePosition)}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cx("font-semibold", text)}>{inr(s.totalPrice)}</span>
                        <Badge status={s.status} isDark={isDark} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card isDark={isDark}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={cx("flex items-center gap-2 text-lg font-bold", text)}><Receipt className="w-5 h-5 text-sky-500" /> Bills</h2>
                {unbilled > 0 && (
                  <button onClick={() => navigate(`/puncher-billing?new=1&clientId=${client.id}`)} className="text-sm font-semibold text-sky-500 hover:text-sky-600">
                    + Create bill
                  </button>
                )}
              </div>
              {client.billings.length === 0 ? (
                <p className="text-sm text-gray-500">No bills yet.</p>
              ) : (
                <ul className="space-y-3">
                  {client.billings.map((b) => (
                    <li key={b.id}>
                      <button
                        onClick={() => navigate(`/puncher-billing/${b.id}`)}
                        className={cx("w-full flex items-center justify-between gap-3 p-3 rounded-xl text-left transition", isDark ? "bg-gray-900/60 hover:bg-gray-900" : "bg-slate-50 hover:bg-slate-100")}
                      >
                        <div>
                          <p className={cx("font-semibold", text)}>{b.invoiceNumber}</p>
                          <p className="text-xs text-gray-500">{fmtDate(b.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cx("font-semibold", text)}>{inr(b.grandTotal)}</span>
                          <Badge status={b.status} isDark={isDark} />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}

      <ClientFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        client={client}
        vehicleTypes={catalog?.vehicleTypes || ["CAR", "BIKE"]}
        isDark={isDark}
        onSaved={load}
      />
    </PageShell>
  );
}
