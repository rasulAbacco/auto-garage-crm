// client/src/pages/services/ServiceDetail.jsx  (Car CRM – job card)
import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiPrinter,
  FiFileText,
  FiClipboard,
  FiCalendar,
  FiUser,
  FiTool,
  FiClock,
  FiMapPin,
  FiPhone,
  FiMail,
  FiCheckCircle,
  FiImage,
  FiAlertCircle,
  FiTag,
  FiEdit,
  FiLoader,
  FiSend,
  FiLock,
} from "react-icons/fi";
import { FaRupeeSign, FaWhatsapp } from "react-icons/fa";
import { useTheme } from "../../contexts/ThemeContext";
import { Toaster, toast } from "react-hot-toast";
import {
  Plate,
  ConfirmDialog,
  Modal,
  tk,
  btnBase,
  fmtDate,
  fmtMoney,
} from "../clients/components/clientUi";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

const APPROVAL = {
  PENDING: {
    label: "Waiting for customer",
    cls: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  },
  APPROVED: {
    label: "Approved by customer",
    cls: "bg-green-500/10 text-green-600 border-green-500/30",
  },
  REJECTED: {
    label: "Rejected by customer",
    cls: "bg-red-500/10 text-red-500 border-red-500/30",
  },
  CONDITION_REQUESTED: {
    label: "Approved with conditions",
    cls: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  },
  READY_SENT: {
    label: "Vehicle ready (sent)",
    cls: "bg-green-500/10 text-green-600 border-green-500/30",
  },
};

const STATUS_CLS = {
  paid: "bg-green-500/10 text-green-600 border-green-500/30",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  processing: "bg-blue-500/10 text-blue-500 border-blue-500/30",
};

const apiRequest = (url, options = {}) => {
  const token = localStorage.getItem("token");
  return fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
};

const num = (v) => (Number.isFinite(+v) ? +v : 0);
const lineTotal = (i) =>
  num(i.quantity) *
  num(i.unitPrice) *
  (1 + (num(i.cgstRate) + num(i.sgstRate)) / 100);
const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export default function ServiceDetail() {
  const { id } = useParams();
  const { isDark } = useTheme();
  const t = tk(isDark);

  const [service, setService] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [waError, setWaError] = useState("");
  const [confirmReady, setConfirmReady] = useState(false);
  const [sendingReady, setSendingReady] = useState(false);
  const [preview, setPreview] = useState(null);

  const loadService = useCallback(async () => {
    try {
      const res = await apiRequest(`/api/services/${id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to load service");
      setService(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadService();
  }, [loadService]);

  const sendWhatsAppApproval = async () => {
    try {
      setSendingWhatsApp(true);
      setWaError("");
      const res = await apiRequest(`/api/services/${service.id}/whatsapp`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to send WhatsApp");
      toast.success("Approval request sent on WhatsApp");
      await loadService();
    } catch (err) {
      setWaError(err.message);
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const handleSendReadyAlert = async () => {
    try {
      setSendingReady(true);
      const res = await fetch(`${API_BASE}/api/services/${id}/whatsapp-ready`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        toast.success("Ready alert sent & marked as Paid");
        loadService();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || "Failed to update status");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSendingReady(false);
      setConfirmReady(false);
    }
  };

  /* ---------- states ---------- */
  if (loading)
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 lg:ml-16">
        <FiLoader className={`animate-spin ${t.heading}`} size={24} />
        <p className={`text-[14px] font-semibold ${t.muted}`}>
          Loading service…
        </p>
      </div>
    );

  if (error || !service)
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4 lg:ml-16">
        <div
          className={`w-full max-w-md rounded-2xl border-2 p-6 text-center ${t.card}`}
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <FiAlertCircle size={20} />
          </div>
          <h3
            className={`text-[16px] font-black uppercase tracking-tight ${t.heading}`}
          >
            Couldn't load service
          </h3>
          <p className={`mt-1 text-[14px] ${t.muted}`}>
            {error || "Service not found"}
          </p>
          <Link
            to="/services"
            className={`${btnBase} mt-5 h-10 px-4 ${t.btnPrimary}`}
          >
            <FiArrowLeft size={14} /> Back to services
          </Link>
        </div>
      </div>
    );

  /* ---------- calculations ---------- */
  const costItems = service.serviceCostItems || [];
  const totalAmount = costItems.reduce((s, i) => s + lineTotal(i), 0);
  const subtotalOf = (type) =>
    costItems
      .filter((i) => i.type === type)
      .reduce((s, i) => s + (num(i.totalCost) || lineTotal(i)), 0);
  const partsSubtotal = subtotalOf("part");
  const laborSubtotal = subtotalOf("labor");
  const discount = num(service.discount);
  const advance = num(service.advancePaid);
  const grandTotal = totalAmount - discount;
  const balance =
    service.balanceDue != null ? num(service.balanceDue) : grandTotal - advance;

  const approval = APPROVAL[service.approvalStatus];
  const approvalLocked = ["PENDING", "APPROVED"].includes(
    service.approvalStatus,
  );
  const readySent = service.approvalStatus === "READY_SENT";
  const client = service.client;
  const subs = service.subServices?.length
    ? service.subServices
    : service.subService
      ? [service.subService]
      : [];
  const priorityUrgent =
    String(service.priority || "").toLowerCase() === "urgent";

  return (
    <div className="min-h-screen lg:ml-16">
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontSize: 14 } }}
      />

      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
        {/* ── header ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Link
              to="/services"
              className={`mb-2 inline-flex items-center gap-1.5 text-[12px] font-black uppercase tracking-[0.15em] ${t.muted} ${
                isDark ? "hover:text-white" : "hover:text-[#001F3F]"
              }`}
            >
              <FiArrowLeft size={14} /> Services
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <h1
                className={`text-[16px] font-black uppercase tracking-tight ${t.heading}`}
              >
                Service <span className="font-light italic">#{service.id}</span>
              </h1>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[12px] font-bold ${STATUS_CLS[String(service.status).toLowerCase()] || STATUS_CLS.pending}`}
              >
                {service.status || "Pending"}
              </span>
              {priorityUrgent && (
                <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-[12px] font-bold text-red-500">
                  Urgent
                </span>
              )}
            </div>
            <p className={`text-[12px] font-medium sm:text-[14px] ${t.muted}`}>
              {client?.fullName || "No client"} ·{" "}
              {[client?.vehicleMake, client?.vehicleModel]
                .filter(Boolean)
                .join(" ") || "Vehicle"}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:flex">
            {readySent ? (
              <span
                className={`${btnBase} h-10 border-2 border-green-500/30 bg-green-500/10 px-4 text-green-600`}
              >
                <FiCheckCircle size={14} /> Ready sent
              </span>
            ) : (
              <button
                onClick={() => setConfirmReady(true)}
                className={`${btnBase} h-10 bg-green-600 px-4 text-white shadow-lg hover:bg-green-700`}
              >
                <FiSend size={14} /> Ready
              </button>
            )}
            <button
              onClick={() => window.print()}
              className={`${btnBase} h-10 border-2 px-4 ${t.btnGhost}`}
            >
              <FiPrinter size={14} /> Print
            </button>
            {service.approvalStatus !== "APPROVED" ? (
              <Link
                to={`/services/${id}/edit`}
                className={`${btnBase} h-10 px-4 ${t.btnPrimary} shadow-lg`}
              >
                <FiEdit size={14} /> Edit
              </Link>
            ) : (
              <span
                className={`${btnBase} h-10 border-2 px-4 opacity-60 ${t.btnGhost}`}
                title="Approved jobs can't be edited"
              >
                <FiLock size={14} /> Locked
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
          {/* ── left ── */}
          <div className="min-w-0 space-y-4 sm:space-y-5 lg:col-span-2">
            {/* service info */}
            <Card isDark={isDark} icon={FiTool} title="Service information">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Info
                  isDark={isDark}
                  icon={FiTag}
                  label="Category"
                  value={service.category?.name}
                />
                <Info
                  isDark={isDark}
                  icon={FiUser}
                  label="Mechanic"
                  value={service.assignedMechanic || "Unassigned"}
                />
                <Info
                  isDark={isDark}
                  icon={FiCalendar}
                  label="Vehicle in"
                  value={fmtDateTime(service.serviceInDate || service.date)}
                />
                <Info
                  isDark={isDark}
                  icon={FiClock}
                  label="Expected delivery"
                  value={fmtDateTime(service.expectedDelivery)}
                />
                {service.serviceOutDate && (
                  <Info
                    isDark={isDark}
                    icon={FiCheckCircle}
                    label="Vehicle out"
                    value={fmtDateTime(service.serviceOutDate)}
                  />
                )}
                <Info
                  isDark={isDark}
                  icon={FiAlertCircle}
                  label="Priority"
                  value={service.priority || "Normal"}
                />
              </div>

              <div className="mt-4">
                <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-slate-400">
                  Work included
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {subs.length ? (
                    subs.map((sub, i) => (
                      <span
                        key={sub.id || i}
                        className={`rounded-lg border-2 px-2.5 py-1 text-[12px] font-bold ${t.inner} ${t.heading}`}
                      >
                        {sub.name}
                      </span>
                    ))
                  ) : (
                    <span className={`text-[14px] italic ${t.muted}`}>
                      General service
                    </span>
                  )}
                </div>
              </div>

              {(service.notes || service.internalNotes) && (
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {service.notes && (
                    <div className={`rounded-xl border-2 p-3 ${t.inner}`}>
                      <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                        Customer notes
                      </p>
                      <p
                        className={`mt-1 whitespace-pre-line text-[14px] ${t.body}`}
                      >
                        {service.notes}
                      </p>
                    </div>
                  )}
                  {service.internalNotes && (
                    <div className="rounded-xl border-2 border-amber-500/30 bg-amber-500/5 p-3">
                      <p className="flex items-center gap-1 text-[12px] font-bold uppercase tracking-wider text-amber-600">
                        <FiLock size={12} /> Internal notes
                      </p>
                      <p
                        className={`mt-1 whitespace-pre-line text-[14px] italic ${t.body}`}
                      >
                        {service.internalNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* client & vehicle */}
            <Card isDark={isDark} icon={FiUser} title="Client & vehicle">
              {client ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[16px] font-black ${t.chipNavy}`}
                      >
                        {client.fullName?.charAt(0)?.toUpperCase() || "C"}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/clients/${client.id}`}
                          className={`block truncate text-[14px] font-black hover:underline ${t.heading}`}
                        >
                          {client.fullName}
                        </Link>
                        <p className={`text-[12px] ${t.muted}`}>
                          Client #{client.id}
                        </p>
                      </div>
                    </div>
                    <div className={`space-y-1.5 text-[14px] ${t.body}`}>
                      {client.phone && (
                        <a
                          href={`tel:${client.phone}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <FiPhone size={14} className="text-slate-400" />{" "}
                          {client.phone}
                        </a>
                      )}
                      {client.email && (
                        <a
                          href={`mailto:${client.email}`}
                          className="flex items-center gap-2 truncate hover:underline"
                        >
                          <FiMail size={14} className="text-slate-400" />{" "}
                          {client.email}
                        </a>
                      )}
                      {client.address && (
                        <p className="flex items-start gap-2">
                          <FiMapPin
                            size={14}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />{" "}
                          {client.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={`rounded-xl border-2 p-3 ${t.inner}`}>
                    <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                      Vehicle
                    </p>
                    <p className={`mt-1 text-[14px] font-black ${t.heading}`}>
                      {[client.vehicleMake, client.vehicleModel]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </p>
                    <p className={`text-[12px] ${t.muted}`}>
                      {client.vehicleYear || "Year not set"}
                    </p>
                    <div className="mt-2">
                      <Plate value={client.regNumber} />
                    </div>
                  </div>
                </div>
              ) : (
                <p className={`py-6 text-center text-[14px] italic ${t.muted}`}>
                  No client attached
                </p>
              )}
            </Card>

            {/* media */}
            <Card
              isDark={isDark}
              icon={FiImage}
              title="Photos"
              right={
                <span className={`text-[12px] font-bold ${t.muted}`}>
                  {service.mediaFiles?.length || 0}
                </span>
              }
            >
              {service.mediaFiles?.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {service.mediaFiles.map((file) => (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => setPreview(file)}
                      className={`group relative aspect-square overflow-hidden rounded-xl border-2 ${t.inner}`}
                    >
                      <img
                        src={file.mediaUrl}
                        alt={file.fileName || "Photo"}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.opacity = "0.2";
                        }}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 ${t.inner}`}
                >
                  <FiImage size={18} className="mb-2 text-slate-400" />
                  <span className={`text-[14px] ${t.muted}`}>
                    No photos uploaded
                  </span>
                </div>
              )}
            </Card>
          </div>

          {/* ── right ── */}
          <div className="space-y-4 sm:space-y-5 lg:sticky lg:top-20 lg:self-start">
            {/* cost summary */}
            <Card
              isDark={isDark}
              icon={FaRupeeSign}
              title="Cost summary"
              right={
                <span className={`text-[12px] font-bold ${t.muted}`}>
                  {costItems.length} items
                </span>
              }
            >
              <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
                {costItems.length ? (
                  costItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start justify-between gap-3 border-b border-dashed pb-2 last:border-0 ${t.line}`}
                    >
                      <div className="min-w-0">
                        <p
                          className={`truncate text-[14px] font-bold ${t.heading}`}
                        >
                          {item.name || `Item ${idx + 1}`}
                        </p>
                        <p className={`text-[12px] ${t.muted}`}>
                          {num(item.quantity)} × {fmtMoney(item.unitPrice)}
                          {num(item.cgstRate) + num(item.sgstRate) > 0
                            ? ` · GST ${num(item.cgstRate) + num(item.sgstRate)}%`
                            : ""}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`text-[14px] font-black ${t.heading}`}>
                          {fmtMoney(lineTotal(item))}
                        </p>
                        <span
                          className={`rounded-md px-1.5 text-[12px] font-bold capitalize ${isDark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-500"}`}
                        >
                          {item.type === "labor" ? "Labour" : "Part"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`py-4 text-center text-[14px] ${t.muted}`}>
                    No cost items added
                  </p>
                )}
              </div>

              <div
                className={`mt-3 space-y-1.5 rounded-xl border-2 p-3 ${t.inner}`}
              >
                <SumRow
                  isDark={isDark}
                  label="Parts"
                  value={fmtMoney(partsSubtotal)}
                />
                <SumRow
                  isDark={isDark}
                  label="Labour"
                  value={fmtMoney(laborSubtotal)}
                />
                {discount > 0 && (
                  <SumRow
                    isDark={isDark}
                    label="Discount"
                    value={`− ${fmtMoney(discount)}`}
                  />
                )}
                {advance > 0 && (
                  <SumRow
                    isDark={isDark}
                    label="Advance paid"
                    value={`− ${fmtMoney(advance)}`}
                    green
                  />
                )}
                <div className={`my-2 border-t-2 ${t.line}`} />
                <div className="flex items-end justify-between">
                  <span className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Total
                  </span>
                  <span className={`text-[16px] font-black ${t.heading}`}>
                    {fmtMoney(grandTotal)}
                  </span>
                </div>
                {(advance > 0 || service.balanceDue != null) && (
                  <div className="flex items-end justify-between">
                    <span className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Balance due
                    </span>
                    <span
                      className={`text-[16px] font-black ${balance > 0 ? "text-red-500" : "text-green-600"}`}
                    >
                      {fmtMoney(balance)}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* actions */}
            <Card isDark={isDark} icon={FaWhatsapp} title="Approval & invoice">
              <div className={`rounded-xl border-2 p-3 ${t.inner}`}>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[12px] font-bold uppercase tracking-wider ${t.muted}`}
                  >
                    WhatsApp approval
                  </span>
                  <span
                    className={`rounded-full border px-2 py-px text-[12px] font-bold ${approval?.cls || "border-slate-500/30 bg-slate-500/10 text-slate-500"}`}
                  >
                    {approval?.label || "Not sent"}
                  </span>
                </div>
                {service.approvalAt && (
                  <p className={`mt-1.5 text-[12px] ${t.muted}`}>
                    Updated {fmtDateTime(service.approvalAt)}
                  </p>
                )}
              </div>

              {waError && (
                <p className="mt-2 text-[12px] font-semibold text-red-500">
                  {waError}
                </p>
              )}

              <button
                type="button"
                disabled={sendingWhatsApp || approvalLocked}
                onClick={sendWhatsAppApproval}
                className={`${btnBase} mt-3 h-11 w-full ${
                  approvalLocked
                    ? service.approvalStatus === "APPROVED"
                      ? "border-2 border-green-500/30 bg-green-500/10 text-green-600 !opacity-100"
                      : "border-2 border-amber-500/30 bg-amber-500/10 text-amber-600 !opacity-100"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {sendingWhatsApp ? (
                  <FiLoader size={14} className="animate-spin" />
                ) : (
                  <FaWhatsapp size={14} />
                )}
                {service.approvalStatus === "APPROVED"
                  ? "Approved on WhatsApp"
                  : service.approvalStatus === "PENDING"
                    ? "Waiting for customer"
                    : sendingWhatsApp
                      ? "Sending…"
                      : service.approvalStatus
                        ? "Resend approval"
                        : "Send for approval"}
              </button>

              <Link
                to="/billing/new"
                state={{ serviceId: service.id, clientId: client?.id }}
                className={`${btnBase} mt-2 h-11 w-full ${t.btnPrimary} shadow-xl`}
              >
                <FiClipboard size={14} /> Generate invoice
              </Link>
            </Card>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isDark={isDark}
        open={confirmReady}
        tone="success"
        title="Vehicle ready?"
        message={`Send the "vehicle ready" WhatsApp to ${client?.fullName || "the client"} and mark this service as Paid.`}
        confirmText="Send & mark paid"
        busy={sendingReady}
        onCancel={() => setConfirmReady(false)}
        onConfirm={handleSendReadyAlert}
      />

      <Modal
        isDark={isDark}
        open={!!preview}
        onClose={() => setPreview(null)}
        icon={FiFileText}
        title={preview?.fileName || "Photo"}
        maxW="max-w-4xl"
      >
        {preview && (
          <img
            src={preview.mediaUrl}
            alt={preview.fileName || "Photo"}
            className="max-h-[75vh] w-full object-contain"
          />
        )}
      </Modal>
    </div>
  );
}

/* ───────── pieces ───────── */

function Card({ isDark, icon: Icon, title, right, children }) {
  const t = tk(isDark);
  return (
    <section className={`overflow-hidden rounded-2xl border-2 ${t.card}`}>
      <div
        className={`flex items-center gap-3 border-b-2 px-4 py-3 ${t.cardHead}`}
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${t.chipNavy}`}
        >
          <Icon size={14} />
        </div>
        <h2
          className={`flex-1 truncate text-[14px] font-black uppercase tracking-tight ${t.heading}`}
        >
          {title}
        </h2>
        {right}
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}

function Info({ isDark, icon: Icon, label, value }) {
  const t = tk(isDark);
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border-2 p-3 ${t.inner}`}
    >
      <Icon size={14} className="shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className={`truncate text-[14px] font-bold ${t.heading}`}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function SumRow({ isDark, label, value, green }) {
  const t = tk(isDark);
  return (
    <div className="flex items-center justify-between text-[14px]">
      <span className={t.muted}>{label}</span>
      <span className={`font-bold ${green ? "text-green-600" : t.heading}`}>
        {value}
      </span>
    </div>
  );
}
