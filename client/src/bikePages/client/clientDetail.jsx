// client/src/bikePages/client/clientDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Edit2,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  X,
  Trash2,
  Save,
  Bike,
  RotateCw,
  AlertCircle,
  IndianRupee,
  Wrench,
  Calendar,
  Plus,
  FileText,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Toaster, toast } from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";
import api from "../../utils/axiosInstance";

/** Reg. / chassis numbers: CAPITAL letters + digits only */
const toCode = (value = "") =>
  String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const imageSrc = (img) => {
  if (!img) return null;
  if (img.startsWith("data:image") || img.startsWith("http")) return img;
  return `${import.meta.env.VITE_API_BASE_URL || ""}${img}`;
};

const getTokens = (isDark) =>
  isDark
    ? {
        page: "bg-gray-900 text-gray-100",
        card: "bg-gray-800 border-gray-700",
        border: "border-gray-700",
        muted: "text-gray-400",
        faint: "text-gray-500",
        input:
          "bg-gray-900 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-blue-400 focus:ring-blue-400/20",
        btn2: "border-gray-600 text-gray-200 hover:bg-gray-700",
        row: "hover:bg-white/[0.03]",
        chip: "bg-gray-900 text-gray-200 border-gray-600",
        soft: "bg-gray-900/50",
      }
    : {
        page: "bg-gray-50 text-gray-800",
        card: "bg-white border-gray-200",
        border: "border-gray-200",
        muted: "text-gray-500",
        faint: "text-gray-400",
        input:
          "bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/15",
        btn2: "border-gray-300 text-gray-700 hover:bg-gray-50",
        row: "hover:bg-gray-50",
        chip: "bg-gray-100 text-gray-700 border-gray-200",
        soft: "bg-gray-50",
      };

const statusTone = (status, isDark) => {
  const s = String(status || "").toLowerCase();
  if (["completed", "paid"].includes(s))
    return isDark
      ? "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20"
      : "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  if (["in progress"].includes(s))
    return isDark
      ? "bg-blue-500/10 text-blue-300 ring-blue-400/20"
      : "bg-blue-50 text-blue-700 ring-blue-600/20";
  if (["cancelled"].includes(s))
    return isDark
      ? "bg-rose-500/10 text-rose-300 ring-rose-400/20"
      : "bg-rose-50 text-rose-700 ring-rose-600/20";
  return isDark
    ? "bg-amber-500/10 text-amber-300 ring-amber-400/20"
    : "bg-amber-50 text-amber-700 ring-amber-600/20";
};

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const t = getTokens(isDark);

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("services");
  const [isEditMode, setIsEditMode] = useState(location?.state?.edit || false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sendingWa, setSendingWa] = useState(false);

  const [activeImage, setActiveImage] = useState("");
  const [clientServices, setClientServices] = useState([]);
  const [clientInvoices, setClientInvoices] = useState([]);

  /* ---------------- data ---------------- */
  useEffect(() => {
    if (!id) return;

    const fetchClient = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/api/bikes/${id}`);
        const data = res.data || {};
        setClient(data);
        setFormData({
          ...data,
          regNumber: toCode(data.regNumber),
          vin: toCode(data.vin),
        });
        setActiveImage(data.adImage || data.bikeImage || data.carImage || "");
      } catch (err) {
        console.error("Fetch client error:", err);
        const msg =
          err.response?.data?.message || err.message || "Failed to load client";
        setError(msg);
        toast.error(msg);
        if (err.response?.status === 403 || err.response?.status === 404) {
          setTimeout(() => navigate("/bike-clients"), 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchServices = async () => {
      try {
        const res = await api.get("/api/bike-services");
        const list = Array.isArray(res.data) ? res.data : [];
        setClientServices(
          list
            .filter((s) => Number(s.clientId) === Number(id))
            .sort(
              (a, b) =>
                new Date(b.inDate || b.createdAt) -
                new Date(a.inDate || a.createdAt),
            ),
        );
      } catch (err) {
        console.error("Fetch services error:", err);
      }
    };

    const fetchInvoices = async () => {
      try {
        const res = await api.get("/api/bike-invoices");
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setClientInvoices(
          list
            .filter((inv) => Number(inv.bikeId) === Number(id))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        );
      } catch (err) {
        console.error("Fetch invoices error:", err);
      }
    };

    fetchClient();
    fetchServices();
    fetchInvoices();
  }, [id, navigate]);

  /* ---------------- derived ---------------- */
  const lastService = clientServices[0]?.inDate || clientServices[0]?.createdAt;
  const totalBilled = useMemo(
    () =>
      clientInvoices.reduce(
        (sum, inv) => sum + Number(inv.grandTotal || inv.totalAmount || 0),
        0,
      ),
    [clientInvoices],
  );
  const balanceDue = useMemo(
    () =>
      clientInvoices
        .filter((inv) => String(inv.status).toLowerCase() !== "paid")
        .reduce(
          (sum, inv) => sum + Number(inv.balanceDue ?? inv.grandTotal ?? 0),
          0,
        ),
    [clientInvoices],
  );

  /* ---------------- actions ---------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleCodeChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: toCode(value) }));
  };

  const handleUpdateClient = async () => {
    if (
      !formData.ownerName?.trim() ||
      !formData.phone?.trim() ||
      !formData.regNumber
    ) {
      toast.error("Name, phone and registration number are required");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...formData,
        regNumber: toCode(formData.regNumber),
        vin: toCode(formData.vin),
      };
      await api.put(`/api/bikes/${id}`, payload);
      const res = await api.get(`/api/bikes/${id}`);
      setClient(res.data);
      setFormData({
        ...res.data,
        regNumber: toCode(res.data.regNumber),
        vin: toCode(res.data.vin),
      });
      setIsEditMode(false);
      toast.success("Client updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update client");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClient = async () => {
    try {
      await api.delete(`/api/bikes/${id}`);
      toast.success("Client deleted");
      navigate("/bike-clients");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete client");
    } finally {
      setConfirmDelete(false);
    }
  };

  const handleManualWhatsApp = async () => {
    if (
      !window.confirm(
        `Send 'Vehicle Received' message to ${client?.phone || "this client"}?`,
      )
    )
      return;
    try {
      setSendingWa(true);
      await api.put(`/api/bikes/${id}`, { sendWhatsApp: true });
      toast.success("WhatsApp receipt sent");
    } catch (err) {
      console.error("WhatsApp error:", err);
      toast.error(err.response?.data?.message || "Failed to send WhatsApp");
    } finally {
      setSendingWa(false);
    }
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    setFormData({
      ...client,
      regNumber: toCode(client.regNumber),
      vin: toCode(client.vin),
    });
  };

  /* ---------------- states ---------------- */
  if (loading) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${t.page}`}
      >
        <RotateCw className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className={`min-h-screen p-6 ${t.page}`}>
        <Toaster />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle size={28} className="mb-3 text-rose-500" />
          <p className="text-[14px] font-medium">
            {error || "Client not found"}
          </p>
          <button
            onClick={() => navigate("/bike-clients")}
            className="mt-4 h-9 rounded-md bg-blue-600 px-4 text-[14px] font-medium text-white hover:bg-blue-700"
          >
            Back to clients
          </button>
        </div>
      </div>
    );
  }

  const fullName = client.ownerName || client.fullName || "Unknown";
  const bikeName =
    [
      client.bikeBrand || client.vehicleMake,
      client.bikeModel || client.vehicleModel,
    ]
      .filter(Boolean)
      .join(" ") || "Bike";
  const damageImages = Array.isArray(client.damageImages)
    ? client.damageImages
    : [];
  const mainImage = client.adImage || client.bikeImage || client.carImage || "";
  const gallery = [mainImage, ...damageImages].filter(Boolean);

  const tabs = [
    { key: "services", label: "Services", count: clientServices.length },
    { key: "invoices", label: "Invoices", count: clientInvoices.length },
    { key: "photos", label: "Photos", count: gallery.length },
  ];

  return (
    <div
      className={`min-h-screen px-3 py-4 text-[14px] sm:px-5 lg:px-8 ${t.page}`}
    >
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontSize: "14px" } }}
      />

      <div className="mx-auto max-w-6xl space-y-4">
        {/* Top bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => navigate("/bike-clients")}
            className={`inline-flex items-center gap-1.5 self-start text-[12px] font-medium ${t.muted} hover:text-blue-600`}
          >
            <ArrowLeft size={14} /> Back to clients
          </button>

          <div className="grid grid-cols-3 gap-2 sm:flex">
            {isEditMode ? (
              <>
                <span className="hidden sm:block" />
                <button
                  onClick={cancelEdit}
                  className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-[14px] font-medium ${t.btn2}`}
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  onClick={handleUpdateClient}
                  disabled={saving}
                  className="col-span-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-blue-600 px-4 text-[14px] font-medium text-white hover:bg-blue-700 disabled:opacity-60 sm:col-span-1"
                >
                  {saving ? (
                    <RotateCw size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleManualWhatsApp}
                  disabled={sendingWa}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 text-[14px] font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  title="Send 'Vehicle Received' on WhatsApp"
                >
                  <FaWhatsapp size={14} />{" "}
                  <span className="hidden sm:inline">Send</span> Receipt
                </button>
                <button
                  onClick={() => setIsEditMode(true)}
                  className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-[14px] font-medium ${t.btn2}`}
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-[14px] font-medium ${isDark ? "border-gray-600 text-rose-300 hover:bg-rose-500/10" : "border-gray-300 text-rose-600 hover:bg-rose-50"}`}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className={`overflow-hidden rounded-lg border ${t.card}`}>
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
            {/* Photo */}
            <div
              className={`relative flex h-48 items-center justify-center md:h-full md:min-h-[220px] ${t.soft} border-b md:border-b-0 md:border-r ${t.border}`}
            >
              {imageSrc(activeImage || mainImage) ? (
                <img
                  src={imageSrc(activeImage || mainImage)}
                  alt={bikeName}
                  className="h-full w-full object-contain p-3"
                />
              ) : (
                <Bike size={40} className={t.faint} />
              )}
              {gallery.length > 1 && (
                <div className="absolute bottom-2 left-2 right-2 flex gap-1.5 overflow-x-auto">
                  {gallery.slice(0, 6).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(img)}
                      className={`h-9 w-9 shrink-0 overflow-hidden rounded border-2 bg-white ${
                        (activeImage || mainImage) === img
                          ? "border-blue-500"
                          : "border-transparent opacity-80 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={imageSrc(img)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-4 sm:p-5">
              {!isEditMode ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h1 className="truncate text-[16px] font-semibold">
                        {fullName}
                      </h1>
                      <p className={`text-[14px] ${t.muted}`}>{bikeName}</p>
                    </div>
                    {client.regNumber && (
                      <span
                        className={`rounded border px-2 py-1 font-mono text-[14px] font-semibold tracking-wider ${t.chip}`}
                      >
                        {toCode(client.regNumber)}
                      </span>
                    )}
                  </div>

                  <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                    <Info t={t} icon={Phone} label="Phone">
                      {client.phone ? (
                        <a
                          href={`tel:${client.phone}`}
                          className="hover:underline"
                        >
                          {client.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </Info>
                    <Info t={t} icon={Mail} label="Email">
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
                    </Info>
                    <Info
                      t={t}
                      icon={MapPin}
                      label="Address"
                      className="sm:col-span-2"
                    >
                      {client.address || "—"}
                    </Info>
                  </dl>

                  <div
                    className={`mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t pt-4 sm:grid-cols-4 ${t.border}`}
                  >
                    <Spec t={t} label="Chassis / VIN" mono>
                      {toCode(client.vin) || "—"}
                    </Spec>
                    <Spec t={t} label="Year">
                      {client.bikeYear || "—"}
                    </Spec>
                    <Spec t={t} label="Colour">
                      {client.color || "—"}
                    </Spec>
                    <Spec t={t} label="Fuel">
                      {client.fuel || "—"}
                    </Spec>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p
                      className={`mb-2 text-[12px] font-semibold uppercase tracking-wide ${t.muted}`}
                    >
                      Customer
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <EditField
                        t={t}
                        label="Owner name"
                        required
                        name="ownerName"
                        value={formData.ownerName}
                        onChange={handleChange}
                      />
                      <EditField
                        t={t}
                        label="Phone"
                        required
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                      <EditField
                        t={t}
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                      <EditField
                        t={t}
                        label="Address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div>
                    <p
                      className={`mb-2 text-[12px] font-semibold uppercase tracking-wide ${t.muted}`}
                    >
                      Bike
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <EditField
                        t={t}
                        label="Brand"
                        name="bikeBrand"
                        value={formData.bikeBrand}
                        onChange={handleChange}
                      />
                      <EditField
                        t={t}
                        label="Model"
                        name="bikeModel"
                        value={formData.bikeModel}
                        onChange={handleChange}
                      />
                      <EditField
                        t={t}
                        label="Registration number"
                        required
                        name="regNumber"
                        value={formData.regNumber}
                        onChange={handleCodeChange}
                        code
                        maxLength={15}
                        placeholder="KA01AB1234"
                      />
                      <EditField
                        t={t}
                        label="Chassis / VIN number"
                        name="vin"
                        value={formData.vin}
                        onChange={handleCodeChange}
                        code
                        maxLength={25}
                      />
                      <EditField
                        t={t}
                        label="Year"
                        name="bikeYear"
                        type="number"
                        value={formData.bikeYear}
                        onChange={handleChange}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <EditField
                          t={t}
                          label="Colour"
                          name="color"
                          value={formData.color}
                          onChange={handleChange}
                        />
                        <div>
                          <label className="mb-1 block text-[12px] font-medium">
                            Fuel
                          </label>
                          <select
                            name="fuel"
                            value={formData.fuel || ""}
                            onChange={handleChange}
                            className={`h-9 w-full rounded-md border px-3 text-[14px] outline-none focus:ring-2 ${t.input}`}
                          >
                            <option value="">Select</option>
                            <option value="Petrol">Petrol</option>
                            <option value="Electric">Electric</option>
                            <option value="Hybrid">Hybrid</option>
                            <option value="CNG">CNG</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-medium">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes || ""}
                      onChange={handleChange}
                      rows={3}
                      className={`w-full resize-none rounded-md border px-3 py-2 text-[14px] outline-none focus:ring-2 ${t.input}`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        {!isEditMode && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat
              t={t}
              icon={Wrench}
              tone="text-blue-600"
              label="Services"
              value={clientServices.length}
            />
            <Stat
              t={t}
              icon={Calendar}
              tone="text-indigo-600"
              label="Last service"
              value={fmtDate(lastService)}
            />
            <Stat
              t={t}
              icon={IndianRupee}
              tone="text-emerald-600"
              label="Total billed"
              value={money(totalBilled)}
            />
            <Stat
              t={t}
              icon={AlertCircle}
              tone="text-rose-600"
              label="Pending"
              value={money(balanceDue)}
            />
          </div>
        )}

        {/* Notes (view) */}
        {!isEditMode && client.notes && (
          <div
            className={`rounded-lg border px-4 py-3 ${isDark ? "border-amber-500/20 bg-amber-500/10" : "border-amber-200 bg-amber-50"}`}
          >
            <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-amber-600">
              <FileText size={12} /> Notes
            </p>
            <p
              className={`mt-1 whitespace-pre-wrap text-[14px] ${isDark ? "text-gray-200" : "text-gray-700"}`}
            >
              {client.notes}
            </p>
          </div>
        )}

        {/* Tabs */}
        {!isEditMode && (
          <div className={`overflow-hidden rounded-lg border ${t.card}`}>
            <div
              className={`flex items-center justify-between gap-2 border-b px-2 ${t.border}`}
            >
              <div className="flex overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-[14px] font-medium transition ${
                      activeTab === tab.key
                        ? "border-blue-600 text-blue-600"
                        : `border-transparent ${t.muted} hover:text-blue-600`
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`rounded-full px-1.5 text-[12px] ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
              {activeTab !== "photos" && (
                <button
                  onClick={() =>
                    activeTab === "services"
                      ? navigate("/bike-services/add", {
                          state: { bikeId: Number(id) },
                        })
                      : navigate("/bill/new", {
                          state: {
                            bikeId: Number(id),
                            clientName: fullName,
                            vehicle: bikeName,
                          },
                        })
                  }
                  className="mr-1 inline-flex h-8 shrink-0 items-center gap-1 rounded-md bg-blue-600 px-3 text-[12px] font-medium text-white hover:bg-blue-700"
                >
                  <Plus size={13} />{" "}
                  {activeTab === "services" ? "New service" : "New invoice"}
                </button>
              )}
            </div>

            {/* Services */}
            {activeTab === "services" &&
              (clientServices.length ? (
                <ul
                  className={`divide-y ${isDark ? "divide-white/5" : "divide-gray-100"}`}
                >
                  {clientServices.map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => navigate(`/bike-services/${s.id}`)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${t.row}`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${isDark ? "bg-blue-500/15 text-blue-300" : "bg-blue-50 text-blue-600"}`}
                        >
                          <Wrench size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-medium">
                            {s.subService?.name ||
                              s.subServiceText ||
                              s.category?.name ||
                              s.categoryText ||
                              "Service"}
                          </p>
                          <p className={`truncate text-[12px] ${t.muted}`}>
                            {fmtDate(s.inDate || s.createdAt)}
                            {s.assignedMechanic
                              ? ` · ${s.assignedMechanic}`
                              : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[14px] font-medium">
                            {money(s.grandTotal)}
                          </p>
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset ${statusTone(s.status, isDark)}`}
                          >
                            {s.status || "Pending"}
                          </span>
                        </div>
                        <ChevronRight
                          size={15}
                          className={`shrink-0 ${t.faint}`}
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty
                  t={t}
                  icon={Wrench}
                  text="No services yet for this bike."
                />
              ))}

            {/* Invoices */}
            {activeTab === "invoices" &&
              (clientInvoices.length ? (
                <ul
                  className={`divide-y ${isDark ? "divide-white/5" : "divide-gray-100"}`}
                >
                  {clientInvoices.map((inv) => (
                    <li key={inv.id}>
                      <button
                        onClick={() => navigate(`/bill/${inv.id}`)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${t.row}`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${isDark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-600"}`}
                        >
                          <IndianRupee size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono text-[14px] font-medium">
                            #{inv.invoiceNumber || inv.id}
                          </p>
                          <p className={`truncate text-[12px] ${t.muted}`}>
                            {fmtDate(inv.createdAt)}
                            {inv.paymentMode ? ` · ${inv.paymentMode}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[14px] font-medium">
                            {money(inv.grandTotal || inv.totalAmount)}
                          </p>
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[12px] font-medium ring-1 ring-inset ${statusTone(inv.status, isDark)}`}
                          >
                            {inv.status || "Pending"}
                          </span>
                        </div>
                        <ChevronRight
                          size={15}
                          className={`shrink-0 ${t.faint}`}
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty
                  t={t}
                  icon={IndianRupee}
                  text="No invoices yet for this bike."
                />
              ))}

            {/* Photos */}
            {activeTab === "photos" &&
              (gallery.length ? (
                <div className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-5 lg:grid-cols-6">
                  {gallery.map((img, i) => (
                    <a
                      key={i}
                      href={imageSrc(img)}
                      target="_blank"
                      rel="noreferrer"
                      className={`group relative aspect-square overflow-hidden rounded-md border ${t.border}`}
                    >
                      <img
                        src={imageSrc(img)}
                        alt=""
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 text-[12px] text-white">
                        {i === 0 && mainImage
                          ? "Bike"
                          : `Damage ${mainImage ? i : i + 1}`}
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <Empty
                  t={t}
                  icon={ImageIcon}
                  text="No photos added. Use Edit on the client form to add some."
                />
              ))}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className={`w-full max-w-sm rounded-lg border p-5 shadow-xl ${t.card}`}
          >
            <h3 className="text-[16px] font-semibold">Delete client?</h3>
            <p
              className={`mt-1.5 text-[14px] ${isDark ? "text-gray-300" : "text-gray-600"}`}
            >
              <b>{fullName}</b> ({toCode(client.regNumber) || "no reg."}) will
              be removed.
            </p>
            <p className="mt-1 text-[12px] text-rose-500">
              This can't be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className={`h-9 rounded-md border px-4 text-[14px] font-medium ${t.btn2}`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClient}
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

/* ---------- small building blocks (outside the component so inputs keep focus) ---------- */
function Info({ t, icon: Icon, label, children, className = "" }) {
  return (
    <div className={`flex items-start gap-2.5 ${className}`}>
      <Icon size={14} className={`mt-0.5 shrink-0 ${t.faint}`} />
      <div className="min-w-0">
        <dt className={`text-[12px] ${t.muted}`}>{label}</dt>
        <dd className="text-[14px]">{children}</dd>
      </div>
    </div>
  );
}

function Spec({ t, label, children, mono }) {
  return (
    <div className="min-w-0">
      <p className={`text-[12px] ${t.muted}`}>{label}</p>
      <p
        className={`truncate text-[14px] font-medium ${mono ? "font-mono tracking-wide" : ""}`}
      >
        {children}
      </p>
    </div>
  );
}

function Stat({ t, icon: Icon, tone, label, value }) {
  return (
    <div className={`rounded-lg border p-3.5 ${t.card}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`truncate text-[12px] ${t.muted}`}>{label}</span>
        <Icon size={14} className={`shrink-0 ${tone}`} />
      </div>
      <div className="mt-1 truncate text-[16px] font-semibold">{value}</div>
    </div>
  );
}

function Empty({ t, icon: Icon, text }) {
  return (
    <div className="px-4 py-10 text-center">
      <Icon size={20} className={`mx-auto ${t.faint}`} />
      <p className={`mt-2 text-[14px] ${t.muted}`}>{text}</p>
    </div>
  );
}

function EditField({
  t,
  label,
  required,
  name,
  value,
  onChange,
  type = "text",
  code,
  maxLength,
  placeholder,
}) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-medium">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete="off"
        {...(code ? { autoCapitalize: "characters", spellCheck: false } : {})}
        className={`h-9 w-full rounded-md border px-3 text-[14px] outline-none transition focus:ring-2 ${t.input} ${
          code ? "font-mono uppercase tracking-wide" : ""
        }`}
      />
    </div>
  );
}
