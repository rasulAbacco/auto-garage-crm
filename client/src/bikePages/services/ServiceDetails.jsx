// client/src/bikePages/services/ServiceDetails.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  IndianRupee,
  Edit2,
  Printer,
  User,
  Phone,
  Mail,
  Bike,
  Wrench,
  CheckCircle,
  Clock,
  AlertCircle,
  Receipt,
  Loader2,
  Image as ImageIcon,
  Package,
  FileText,
  Flag,
  ChevronRight,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Toaster, toast } from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";
import api from "../../utils/axiosInstance";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const approvalMeta = {
  PENDING: { label: "Waiting for customer", tone: "amber" },
  APPROVED: { label: "Approved by customer", tone: "emerald" },
  REJECTED: { label: "Rejected by customer", tone: "rose" },
  CONDITION_REQUESTED: { label: "Approved with conditions", tone: "orange" },
  READY_SENT: { label: "Vehicle ready (sent)", tone: "emerald" },
};

const toneCls = (tone, isDark) =>
  ({
    amber: isDark
      ? "bg-amber-500/10 text-amber-300 ring-amber-400/20"
      : "bg-amber-50 text-amber-700 ring-amber-600/20",
    emerald: isDark
      ? "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20"
      : "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    rose: isDark
      ? "bg-rose-500/10 text-rose-300 ring-rose-400/20"
      : "bg-rose-50 text-rose-700 ring-rose-600/20",
    orange: isDark
      ? "bg-orange-500/10 text-orange-300 ring-orange-400/20"
      : "bg-orange-50 text-orange-700 ring-orange-600/20",
    blue: isDark
      ? "bg-blue-500/10 text-blue-300 ring-blue-400/20"
      : "bg-blue-50 text-blue-700 ring-blue-600/20",
    gray: isDark
      ? "bg-white/5 text-gray-300 ring-white/10"
      : "bg-gray-100 text-gray-600 ring-gray-500/20",
  })[tone];

const statusTone = (status) =>
  ({ Completed: "emerald", "In Progress": "blue", Cancelled: "rose" })[
    status
  ] || "amber";

const getTokens = (isDark) =>
  isDark
    ? {
        page: "bg-gray-900 text-gray-100",
        card: "bg-gray-800 border-gray-700",
        border: "border-gray-700",
        muted: "text-gray-400",
        faint: "text-gray-500",
        thead: "bg-white/[0.03] text-gray-400",
        btn2: "border-gray-600 text-gray-200 hover:bg-gray-700",
        soft: "bg-gray-900/50",
        chip: "bg-gray-900 text-gray-200 border-gray-600",
      }
    : {
        page: "bg-gray-50 text-gray-800",
        card: "bg-white border-gray-200",
        border: "border-gray-200",
        muted: "text-gray-500",
        faint: "text-gray-400",
        thead: "bg-gray-50 text-gray-500",
        btn2: "border-gray-300 text-gray-700 hover:bg-gray-50",
        soft: "bg-gray-50",
        chip: "bg-gray-100 text-gray-700 border-gray-200",
      };

export default function ServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const t = getTokens(isDark);

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [sendingReady, setSendingReady] = useState(false);
  const [confirmReady, setConfirmReady] = useState(false);
  const [waError, setWaError] = useState("");

  const fetchService = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/bike-services/${id}`);
      setService(res.data);
    } catch (err) {
      console.error("Fetch service error:", err);
      toast.error(
        err.response?.data?.message || "Failed to load service details",
      );
      if (err.response?.status === 403 || err.response?.status === 404) {
        setTimeout(() => navigate("/bike-services"), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchService();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ---------------- actions (same endpoints as before) ---------------- */
  const handleSendWhatsAppApproval = async () => {
    try {
      setSendingWhatsApp(true);
      setWaError("");
      await api.post(`/api/bike-service/${id}/whatsapp-approval`);
      await fetchService();
      toast.success("Approval request sent on WhatsApp");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send WhatsApp";
      setWaError(msg);
      toast.error(msg);
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const handleSendReadyAlert = async () => {
    try {
      setSendingReady(true);
      const res = await api.post(`/api/bike-service/${id}/whatsapp-ready`);
      if (res.status === 200) {
        toast.success("Ready alert sent & marked as paid");
        fetchService();
      } else {
        toast.error(res.data?.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to send ready alert");
    } finally {
      setSendingReady(false);
      setConfirmReady(false);
    }
  };

  const goToInvoice = () =>
    navigate("/bill/new", {
      state: {
        id: service.id,
        bikeId: service.client?.id,
        clientName: service.client?.ownerName,
        vehicle:
          `${service.client?.bikeBrand || ""} ${service.client?.bikeModel || ""}`.trim(),
        serviceCategory: service.category?.name || service.categoryText,
        serviceSubCategory: service.subService?.name || service.subServiceText,
        serviceItems: service.serviceItems || [],
        discountType: service.discountType,
        discount: service.discount,
        advancePaid: service.advancePaid,
      },
    });

  /* ---------------- states ---------------- */
  if (loading) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${t.page}`}
      >
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!service) {
    return (
      <div
        className={`flex min-h-screen flex-col items-center justify-center p-6 text-center ${t.page}`}
      >
        <Toaster />
        <AlertCircle size={28} className="mb-3 text-rose-500" />
        <p className="text-[14px] font-medium">Service not found</p>
        <button
          onClick={() => navigate("/bike-services")}
          className="mt-4 h-9 rounded-md bg-blue-600 px-4 text-[14px] font-medium text-white hover:bg-blue-700"
        >
          Back to services
        </button>
      </div>
    );
  }

  const title =
    service.subService?.name ||
    service.subServiceText ||
    service.category?.name ||
    service.categoryText ||
    "Service";
  const items = service.serviceItems || [];
  const media = service.serviceMedia || [];
  const client = service.client || {};
  const approval = approvalMeta[service.approvalStatus];
  const hasInvoice = Boolean(service.bikeInvoice);
  const isPaid = service.paymentStatus === "Paid";

  return (
    <div
      className={`min-h-screen px-3 py-4 text-[14px] sm:px-5 lg:px-8 print:bg-white print:p-0 print:text-black ${t.page}`}
    >
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontSize: "14px" } }}
      />

      <div className="mx-auto max-w-6xl space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <button
              onClick={() => navigate("/bike-services")}
              className={`mb-2 inline-flex items-center gap-1.5 text-[12px] font-medium ${t.muted} hover:text-blue-600 print:hidden`}
            >
              <ArrowLeft size={14} /> Back to services
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[16px] font-semibold">{title}</h1>
              <span
                className={`rounded-full px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset ${toneCls(statusTone(service.status), isDark)}`}
              >
                {service.status || "Pending"}
              </span>
              {service.priority && service.priority !== "Normal" && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset ${toneCls(["High", "Urgent"].includes(service.priority) ? "rose" : "gray", isDark)}`}
                >
                  <Flag size={11} /> {service.priority}
                </span>
              )}
            </div>
            <p className={`text-[12px] ${t.muted}`}>
              Service #{service.id} · {client.ownerName || "Unknown customer"}
              {client.regNumber ? ` · ${client.regNumber}` : ""}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:flex print:hidden">
            {service.approvalStatus === "READY_SENT" ? (
              <span
                className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-[14px] font-medium ring-1 ring-inset ${toneCls("emerald", isDark)}`}
              >
                <CheckCircle size={14} />{" "}
                <span className="hidden sm:inline">Ready alert</span> sent
              </span>
            ) : (
              <button
                onClick={() => setConfirmReady(true)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 text-[14px] font-medium text-white hover:bg-indigo-700"
              >
                <CheckCircle size={14} />{" "}
                <span className="hidden sm:inline">Mark</span> ready
              </button>
            )}
            <button
              onClick={() => window.print()}
              className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-[14px] font-medium ${t.btn2}`}
            >
              <Printer size={14} /> Print
            </button>
            <button
              onClick={() => navigate(`/bike-services/${id}/edit`)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 text-[14px] font-medium text-white hover:bg-blue-700"
            >
              <Edit2 size={14} /> Edit
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* ---------- LEFT ---------- */}
          <div className="space-y-4 lg:col-span-2">
            {/* Job info */}
            <Card t={t} icon={Wrench} title="Job details">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                <Spec t={t} label="Category">
                  {service.category?.name || service.categoryText || "—"}
                </Spec>
                <Spec t={t} label="Sub-service">
                  {service.subService?.name || service.subServiceText || "—"}
                </Spec>
                <Spec t={t} label="Mechanic">
                  {service.assignedMechanic || "Unassigned"}
                </Spec>
                <Spec t={t} label="In date" icon={Calendar}>
                  {fmtDate(service.inDate)}
                </Spec>
                <Spec t={t} label="Expected delivery" icon={Clock}>
                  {fmtDate(service.expectedDelivery)}
                </Spec>
                <Spec t={t} label="Out date" icon={Calendar}>
                  {fmtDate(service.outDate)}
                </Spec>
              </div>

              {service.notes && (
                <div
                  className={`mt-4 rounded-md border px-3 py-2.5 ${isDark ? "border-amber-500/20 bg-amber-500/10" : "border-amber-200 bg-amber-50"}`}
                >
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-amber-600">
                    <FileText size={12} /> Notes
                  </p>
                  <p
                    className={`mt-1 whitespace-pre-wrap text-[14px] ${isDark ? "text-gray-200" : "text-gray-700"}`}
                  >
                    {service.notes}
                  </p>
                </div>
              )}
            </Card>

            {/* Items */}
            <Card
              t={t}
              icon={Package}
              title="Parts & labour"
              right={
                <span className={`text-[12px] ${t.muted}`}>
                  {items.length} item{items.length === 1 ? "" : "s"}
                </span>
              }
              flush
            >
              {items.length === 0 ? (
                <p className={`px-4 py-8 text-center text-[14px] ${t.muted}`}>
                  No parts or labour added yet.
                </p>
              ) : (
                <>
                  {/* desktop */}
                  <div className="hidden overflow-x-auto sm:block">
                    <table className="min-w-full text-left">
                      <thead className={t.thead}>
                        <tr className="text-[12px] font-medium uppercase tracking-wide">
                          <th className="px-4 py-2 font-medium">Item</th>
                          <th className="px-4 py-2 text-right font-medium">
                            Qty
                          </th>
                          <th className="px-4 py-2 text-right font-medium">
                            Rate
                          </th>
                          <th className="px-4 py-2 text-right font-medium">
                            GST
                          </th>
                          <th className="px-4 py-2 text-right font-medium">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody
                        className={`divide-y ${isDark ? "divide-white/5" : "divide-gray-100"}`}
                      >
                        {items.map((item, idx) => (
                          <tr key={item.id || idx} className="text-[14px]">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[12px] font-medium ring-1 ring-inset ${toneCls(item.type === "Part" ? "blue" : "emerald", isDark)}`}
                                >
                                  {item.type}
                                </span>
                                <span>{item.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums">
                              {money(item.unitPrice)}
                            </td>
                            <td
                              className={`px-4 py-2.5 text-right text-[12px] tabular-nums ${t.muted}`}
                            >
                              {Number(item.cgst || 0) + Number(item.sgst || 0)}%
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                              {money(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* mobile */}
                  <ul
                    className={`divide-y sm:hidden ${isDark ? "divide-white/5" : "divide-gray-100"}`}
                  >
                    {items.map((item, idx) => (
                      <li
                        key={item.id || idx}
                        className="flex items-start justify-between gap-3 px-4 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[14px]">{item.name}</p>
                          <p className={`text-[12px] ${t.muted}`}>
                            {item.type} · {item.quantity} ×{" "}
                            {money(item.unitPrice)}
                            {Number(item.cgst || 0) + Number(item.sgst || 0)
                              ? ` · GST ${Number(item.cgst || 0) + Number(item.sgst || 0)}%`
                              : ""}
                          </p>
                        </div>
                        <p className="shrink-0 text-[14px] font-medium">
                          {money(item.total)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>

            {/* Customer */}
            <Card
              t={t}
              icon={User}
              title="Customer & bike"
              right={
                client.id && (
                  <button
                    onClick={() => navigate(`/bikes/${client.id}`)}
                    className="inline-flex items-center gap-0.5 text-[12px] font-medium text-blue-600 hover:underline print:hidden"
                  >
                    View client <ChevronRight size={12} />
                  </button>
                )
              }
            >
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <Spec t={t} label="Owner" icon={User}>
                  {client.ownerName || "—"}
                </Spec>
                <Spec t={t} label="Phone" icon={Phone}>
                  {client.phone ? (
                    <a href={`tel:${client.phone}`} className="hover:underline">
                      {client.phone}
                    </a>
                  ) : (
                    "—"
                  )}
                </Spec>
                <Spec t={t} label="Email" icon={Mail}>
                  {client.email ? (
                    <a
                      href={`mailto:${client.email}`}
                      className="break-all hover:underline"
                    >
                      {client.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </Spec>
                <Spec t={t} label="Bike" icon={Bike}>
                  {[client.bikeBrand, client.bikeModel]
                    .filter(Boolean)
                    .join(" ") || "—"}
                  {client.regNumber && (
                    <span
                      className={`ml-2 rounded border px-1.5 font-mono text-[12px] ${t.chip}`}
                    >
                      {client.regNumber}
                    </span>
                  )}
                </Spec>
              </div>
            </Card>

            {/* Photos */}
            {media.length > 0 && (
              <Card
                t={t}
                icon={ImageIcon}
                title="Photos"
                right={
                  <span className={`text-[12px] ${t.muted}`}>
                    {media.length}
                  </span>
                }
              >
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                  {media.map((m, idx) => {
                    const src =
                      m.r2Url || `${API_BASE}/api/bike-services/media/${m.id}`;
                    return (
                      <a
                        key={m.id || idx}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className={`group relative aspect-square overflow-hidden rounded-md border ${t.border}`}
                        title={m.fileName}
                      >
                        <img
                          src={src}
                          alt={m.fileName || "Service photo"}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                          loading="lazy"
                        />
                      </a>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* ---------- RIGHT ---------- */}
          <div className="space-y-4">
            {/* Billing */}
            <Card t={t} icon={IndianRupee} title="Billing">
              <dl className="space-y-1.5 text-[14px]">
                <Row t={t} label="Parts" value={money(service.partsSubtotal)} />
                <Row
                  t={t}
                  label="Labour"
                  value={money(service.laborSubtotal)}
                />
                <Row t={t} label="CGST" value={money(service.cgstTotal)} />
                <Row t={t} label="SGST" value={money(service.sgstTotal)} />
                {Number(service.discount) > 0 && (
                  <Row
                    t={t}
                    label={`Discount${service.discountType === "Percentage" ? " (%)" : ""}`}
                    value={`− ${money(service.discount)}`}
                    accent="text-rose-500"
                  />
                )}
                {Number(service.advancePaid) > 0 && (
                  <Row
                    t={t}
                    label="Advance paid"
                    value={`− ${money(service.advancePaid)}`}
                    accent="text-emerald-600"
                  />
                )}
              </dl>
              <div className={`mt-3 space-y-1.5 border-t pt-3 ${t.border}`}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[14px] font-semibold">Grand total</span>
                  <span className="text-[16px] font-semibold">
                    {money(service.grandTotal)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className={`text-[14px] ${t.muted}`}>Balance due</span>
                  <span
                    className={`text-[16px] font-semibold ${Number(service.balanceDue) > 0 && !isPaid ? "text-rose-500" : "text-emerald-600"}`}
                  >
                    {isPaid ? "Paid" : money(service.balanceDue)}
                  </span>
                </div>
              </div>

              {/* Invoice status */}
              <div className={`mt-3 rounded-md px-3 py-2 ${t.soft}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[12px] ${t.muted}`}>Invoice</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[12px] font-medium uppercase ring-1 ring-inset ${toneCls(
                      ["sent", "paid"].includes(service.invoiceStatus)
                        ? "emerald"
                        : service.invoiceStatus === "generated"
                          ? "blue"
                          : "gray",
                      isDark,
                    )}`}
                  >
                    {service.invoiceStatus || "draft"}
                  </span>
                </div>
                {hasInvoice && (
                  <p className={`mt-1 text-[12px] ${t.muted}`}>
                    #{service.bikeInvoice.invoiceNumber}
                    {service.paymentStatus && (
                      <span
                        className={
                          isPaid ? "text-emerald-600" : "text-rose-500"
                        }
                      >
                        {" "}
                        · {service.paymentStatus}
                      </span>
                    )}
                    {service.bikeInvoice.paymentMode
                      ? ` · ${service.bikeInvoice.paymentMode}`
                      : ""}
                  </p>
                )}
              </div>

              {hasInvoice ? (
                <button
                  onClick={() =>
                    navigate(
                      `/bill/${service.bikeInvoiceId || service.bikeInvoice.id}`,
                    )
                  }
                  className={`mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md border text-[14px] font-medium print:hidden ${t.btn2}`}
                >
                  <Receipt size={14} /> View invoice
                </button>
              ) : (
                <button
                  onClick={goToInvoice}
                  className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 text-[14px] font-medium text-white hover:bg-emerald-700 print:hidden"
                >
                  <Receipt size={14} /> Create invoice
                </button>
              )}
            </Card>

            {/* WhatsApp approval */}
            <Card
              t={t}
              icon={FaWhatsapp}
              iconClass="text-emerald-500"
              title="Customer approval"
              className="print:hidden"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[12px] ${t.muted}`}>Status</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset ${toneCls(approval?.tone || "gray", isDark)}`}
                >
                  {approval?.label || "Not sent"}
                </span>
              </div>
              {service.approvalAt && (
                <p className={`mt-1 text-[12px] ${t.muted}`}>
                  Updated {new Date(service.approvalAt).toLocaleString("en-IN")}
                </p>
              )}
              {service.approvalNote && (
                <p
                  className={`mt-2 rounded-md px-3 py-2 text-[12px] ${t.soft}`}
                >
                  “{service.approvalNote}”
                </p>
              )}
              {waError && (
                <p className="mt-2 text-[12px] text-rose-500">{waError}</p>
              )}

              <button
                disabled={
                  sendingWhatsApp ||
                  ["PENDING", "APPROVED"].includes(service.approvalStatus)
                }
                onClick={handleSendWhatsAppApproval}
                className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 text-[14px] font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendingWhatsApp ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FaWhatsapp size={14} />
                )}
                {service.approvalStatus === "APPROVED"
                  ? "Approved"
                  : service.approvalStatus === "PENDING"
                    ? "Waiting for reply"
                    : sendingWhatsApp
                      ? "Sending…"
                      : service.approvalStatus
                        ? "Send again"
                        : "Ask for approval"}
              </button>
              <p className={`mt-1.5 text-[12px] ${t.muted}`}>
                Sends an approval request to {client.phone || "the customer"} on
                WhatsApp.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Ready confirm */}
      {confirmReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden">
          <div
            className={`w-full max-w-sm rounded-lg border p-5 shadow-xl ${t.card}`}
          >
            <h3 className="text-[16px] font-semibold">Mark bike as ready?</h3>
            <p
              className={`mt-1.5 text-[14px] ${isDark ? "text-gray-300" : "text-gray-600"}`}
            >
              {client.ownerName || "The customer"} will get a WhatsApp message
              that the bike is ready, and this service will be marked as{" "}
              <b>Paid</b>.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmReady(false)}
                disabled={sendingReady}
                className={`h-9 rounded-md border px-4 text-[14px] font-medium ${t.btn2}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSendReadyAlert}
                disabled={sendingReady}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-indigo-600 px-4 text-[14px] font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {sendingReady && <Loader2 size={14} className="animate-spin" />}
                Notify & mark paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- building blocks ---------- */
function Card({
  t,
  icon: Icon,
  iconClass = "text-blue-600",
  title,
  right,
  children,
  flush,
  className = "",
}) {
  return (
    <section
      className={`overflow-hidden rounded-lg border print:break-inside-avoid print:border-gray-300 ${t.card} ${className}`}
    >
      <div
        className={`flex items-center justify-between gap-3 border-b px-4 py-2.5 ${t.border}`}
      >
        <h2 className="flex items-center gap-2 text-[14px] font-semibold">
          <Icon size={15} className={iconClass} /> {title}
        </h2>
        {right}
      </div>
      <div className={flush ? "" : "p-4"}>{children}</div>
    </section>
  );
}

function Spec({ t, label, icon: Icon, children }) {
  return (
    <div className="min-w-0">
      <p className={`flex items-center gap-1 text-[12px] ${t.muted}`}>
        {Icon && <Icon size={11} />} {label}
      </p>
      <div className="text-[14px] font-medium">{children}</div>
    </div>
  );
}

function Row({ t, label, value, accent }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={t.muted}>{label}</dt>
      <dd className={`tabular-nums ${accent || ""}`}>{value}</dd>
    </div>
  );
}
