// client/src/pages/clients/ClientDetail.jsx  (Car CRM – client profile)
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FiEdit,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCreditCard,
  FiHash,
  FiCalendar,
  FiTool,
  FiDollarSign,
  FiPlus,
  FiArrowLeft,
  FiTrash2,
  FiFileText,
  FiCamera,
  FiEye,
  FiUsers,
  FiUserCheck,
  FiDroplet,
  FiAlertCircle,
  FiLoader,
  FiUpload,
  FiGrid,
} from "react-icons/fi";
import { BsFuelPumpFill } from "react-icons/bs";
import { FaWhatsapp, FaCar } from "react-icons/fa";
import { Toaster, toast } from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";
import OCRResults from "../details/components/OCRResults";
import { processImage } from "../details/utils/OCRProcessor.js";
import {
  Plate,
  VehicleImage,
  Modal,
  ConfirmDialog,
  tk,
  btnBase,
  fmtDate,
  fmtMoney,
  statusClass,
} from "./components/clientUi";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

const parseOcr = (r) => {
  const p = r?.parsedData;
  if (!p) return {};
  if (typeof p === "string") {
    try {
      return JSON.parse(p) || {};
    } catch {
      return {};
    }
  }
  return p;
};

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const t = tk(isDark);

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [ocrRecords, setOcrRecords] = useState([]);
  const [isLoadingOCR, setIsLoadingOCR] = useState(false);
  const [ocrParsed, setOcrParsed] = useState(null);
  const [ocrRaw, setOcrRaw] = useState("");
  const [ocrBusy, setOcrBusy] = useState(false);
  const [selectedOCR, setSelectedOCR] = useState(null);
  const [ocrToDelete, setOcrToDelete] = useState(null);

  const [confirmWa, setConfirmWa] = useState(false);
  const [sendingWa, setSendingWa] = useState(false);
  const ocrFileRef = useRef(null);

  const authFail = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  /* ---------- client ---------- */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) return authFail();
        const res = await fetch(`${API_BASE}/api/clients/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) return authFail();
        if (!res.ok)
          throw new Error(
            res.status === 404 ? "Client not found" : "Failed to load client",
          );
        setClient(await res.json());
      } catch (err) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ---------- OCR history ---------- */
  const fetchOCR = async () => {
    try {
      setIsLoadingOCR(true);
      const token = localStorage.getItem("token");
      if (!token) return authFail();
      const res = await fetch(`${API_BASE}/api/ocr/history?clientId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return authFail();
      if (!res.ok) throw new Error("Failed to fetch OCR records");
      const data = await res.json();
      setOcrRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("OCR fetch failed:", err);
    } finally {
      setIsLoadingOCR(false);
    }
  };

  useEffect(() => {
    if (id) fetchOCR();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDeleteOCR = async () => {
    const recordId = ocrToDelete?.id;
    setOcrToDelete(null);
    if (!recordId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/ocr/${recordId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return authFail();
      if (!res.ok) throw new Error("Failed to delete OCR record");
      setOcrRecords((prev) => prev.filter((r) => r.id !== recordId));
      toast.success("OCR record deleted");
    } catch (err) {
      toast.error(err.message || "Delete failed");
    }
  };

  /* scan an RC right here (adds to this client's OCR records) */
  const handleOcrFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setOcrBusy(true);
      const image = await readAsDataUrl(file);
      const result = await processImage(image);
      setOcrParsed(result?.parsed || {});
      setOcrRaw(result?.text || "");
      setActiveTab("ocr");
    } catch (err) {
      toast.error("OCR failed: " + (err?.message || "unknown error"));
    } finally {
      setOcrBusy(false);
    }
  };

  const handleSaveOCR = async (data) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/ocr/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId: parseInt(id, 10),
          rawText: ocrRaw,
          parsedData: JSON.stringify(data),
          confidence: data?.ocrConfidence || 85,
        }),
      });
      if (res.status === 401) return authFail();
      if (!res.ok)
        throw new Error((await res.text()) || "Failed to save OCR record");
      const responseData = await res.json();
      if (responseData?.record)
        setOcrRecords((prev) => [responseData.record, ...prev]);
      setOcrParsed(null);
      setOcrRaw("");
      toast.success("OCR data saved");
    } catch (err) {
      toast.error(err.message || "Failed to save OCR data");
    }
  };

  const handleScanNavigate = () => {
    const q = new URLSearchParams({
      clientId: id,
      clientName: client?.fullName || "",
    }).toString();
    navigate(`/details?${q}`);
  };

  const sendWhatsApp = async () => {
    try {
      setSendingWa(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/clients/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sendWhatsApp: true }),
      });
      if (res.ok) toast.success("WhatsApp receipt sent!");
      else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || "Failed to send WhatsApp");
      }
    } catch (err) {
      console.error("WhatsApp error:", err);
      toast.error("Error connecting to server");
    } finally {
      setSendingWa(false);
      setConfirmWa(false);
    }
  };

  /* ---------- states ---------- */
  if (loading)
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 lg:ml-16">
        <FiLoader className={`animate-spin ${t.heading}`} size={24} />
        <p className={`text-[14px] font-semibold ${t.muted}`}>
          Loading client…
        </p>
      </div>
    );

  if (error)
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4 lg:ml-16">
        <div
          className={`w-full max-w-md overflow-hidden rounded-2xl border-2 ${t.card}`}
        >
          <div className="p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
              <FiAlertCircle size={20} />
            </div>
            <h3
              className={`text-[16px] font-black uppercase tracking-tight ${t.heading}`}
            >
              Couldn't load client
            </h3>
            <p className={`mt-1 text-[14px] ${t.muted}`}>{error}</p>
            <div className="mt-5 flex justify-center gap-2">
              <Link
                to="/clients"
                className={`${btnBase} h-10 border-2 px-4 ${t.btnGhost}`}
              >
                <FiArrowLeft size={14} /> Clients
              </Link>
              <button
                onClick={() => window.location.reload()}
                className={`${btnBase} h-10 px-4 ${t.btnPrimary}`}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  if (!client) return null;

  /* ---------- derived ---------- */
  const services = client.services || [];
  const invoices = client.invoices || [];
  const lastService = services[0]?.date ? fmtDate(services[0].date) : "—";
  const totalBilled = invoices.reduce(
    (s, i) => s + (Number(i.grandTotal || i.totalAmount) || 0),
    0,
  );
  const vehicle =
    `${client.vehicleMake || ""} ${client.vehicleModel || ""}`.trim();

  const TABS = [
    { key: "overview", label: "Overview", icon: FiGrid },
    {
      key: "services",
      label: "Services",
      icon: FiTool,
      count: services.length,
    },
    {
      key: "invoices",
      label: "Invoices",
      icon: FiDollarSign,
      count: invoices.length,
    },
    {
      key: "ocr",
      label: "RC scans",
      icon: FiFileText,
      count: ocrRecords.length,
    },
  ];

  const sel = selectedOCR ? parseOcr(selectedOCR) : {};

  return (
    <div className="min-h-screen lg:ml-16">
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontSize: 14 } }}
      />
      <input
        ref={ocrFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleOcrFile}
      />

      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
        {/* ── top actions ── */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            to="/clients"
            className={`inline-flex items-center gap-1.5 text-[12px] font-black uppercase tracking-[0.15em] ${t.muted} ${
              isDark ? "hover:text-white" : "hover:text-[#001F3F]"
            }`}
          >
            <FiArrowLeft size={14} /> Clients
          </Link>
          <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
            <button
              onClick={() => setConfirmWa(true)}
              className={`${btnBase} h-10 bg-green-600 px-4 text-white shadow-lg hover:bg-green-700`}
            >
              <FaWhatsapp size={14} /> Receipt
            </button>
            <button
              onClick={handleScanNavigate}
              className={`${btnBase} h-10 border-2 px-4 ${t.btnGhost}`}
            >
              <FiCamera size={14} /> Scan RC
            </button>
            <button
              onClick={() =>
                navigate(`/clients/${id}/edit`, {
                  state: { clientData: client },
                })
              }
              className={`${btnBase} h-10 px-4 ${t.btnPrimary} shadow-lg`}
            >
              <FiEdit size={14} /> Edit
            </button>
          </div>
        </div>

        {/* ── hero ── */}
        <div className={`overflow-hidden rounded-2xl border-2 ${t.card}`}>
          <div className="grid grid-cols-1 md:grid-cols-5">
            <div className="relative md:col-span-2">
              <VehicleImage
                src={client.carImage}
                className="h-52 w-full sm:h-64 md:h-full md:min-h-[280px]"
                label={vehicle}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#000814]/60 via-transparent to-transparent md:bg-gradient-to-r" />
              <div className="absolute bottom-3 left-3">
                <Plate value={client.regNumber} />
              </div>
            </div>

            <div className="space-y-5 p-4 sm:p-6 md:col-span-3">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[16px] font-black shadow-lg ${t.chipNavy}`}
                >
                  {client.fullName?.charAt(0)?.toUpperCase() || "C"}
                </div>
                <div className="min-w-0">
                  <h1
                    className={`truncate text-[16px] font-black uppercase tracking-tight ${t.heading}`}
                  >
                    {client.fullName}
                  </h1>
                  <p
                    className={`truncate text-[14px] font-semibold ${t.muted}`}
                  >
                    {vehicle || "Vehicle not set"}
                    {client.vehicleYear ? (
                      <span className="font-light italic">
                        {" "}
                        · {client.vehicleYear}
                      </span>
                    ) : null}
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-px text-[12px] font-bold text-green-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />{" "}
                    Active
                  </span>
                </div>
              </div>

              <div
                className={`flex items-end justify-between gap-4 rounded-xl border-2 p-3 ${t.inner}`}
              >
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Lifetime value
                  </p>
                  <p className={`text-[16px] font-black ${t.heading}`}>
                    {fmtMoney(totalBilled)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Visits
                  </p>
                  <p className={`text-[16px] font-black ${t.heading}`}>
                    {services.length}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Spec
                  isDark={isDark}
                  icon={BsFuelPumpFill}
                  label="Fuel"
                  value={client.fuel}
                />
                <Spec
                  isDark={isDark}
                  icon={FiUsers}
                  label="Seats"
                  value={client.seats}
                />
                <Spec
                  isDark={isDark}
                  icon={FiDroplet}
                  label="Colour"
                  value={client.color}
                />
                <Spec
                  isDark={isDark}
                  icon={FaCar}
                  label="Body"
                  value={client.bodyType}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── contact & vehicle info ── */}
        <div className={`overflow-hidden rounded-2xl border-2 ${t.card}`}>
          <div
            className={`flex items-center gap-3 border-b-2 px-4 py-3 sm:px-5 ${t.cardHead}`}
          >
            <FiUserCheck size={14} className={t.heading} />
            <h2
              className={`text-[14px] font-black uppercase tracking-tight ${t.heading}`}
            >
              Contact & vehicle
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-4">
            <Info
              isDark={isDark}
              icon={FiPhone}
              label="Phone"
              value={client.phone}
              href={client.phone && `tel:${client.phone}`}
            />
            <Info
              isDark={isDark}
              icon={FiMail}
              label="Email"
              value={client.email}
              href={client.email && `mailto:${client.email}`}
            />
            <Info
              isDark={isDark}
              icon={FiMapPin}
              label="Address"
              value={client.address}
            />
            <Info
              isDark={isDark}
              icon={FiCalendar}
              label="Last service"
              value={lastService}
            />
            <Info
              isDark={isDark}
              icon={FiCreditCard}
              label="Registration"
              value={client.regNumber}
              mono
            />
            <Info
              isDark={isDark}
              icon={FiHash}
              label="VIN / Chassis"
              value={client.vin}
              mono
            />
            <Info
              isDark={isDark}
              icon={FiUserCheck}
              label="Advisor"
              value={client.advisorName}
            />
            <Info
              isDark={isDark}
              icon={FiUsers}
              label="Received by"
              value={client.receiverName || client.staffPerson}
            />
          </div>
        </div>

        {/* ── tabs ── */}
        <div className={`overflow-hidden rounded-2xl border-2 ${t.card}`}>
          <div
            className={`flex flex-col gap-3 border-b-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 ${t.cardHead}`}
          >
            <div
              className={`flex gap-1 overflow-x-auto rounded-xl border-2 p-1 ${isDark ? "border-white/10 bg-[#000814]/40" : "border-[#CBD5E1] bg-white"}`}
            >
              {TABS.map((tab) => {
                const on = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[12px] font-black uppercase tracking-wider transition ${
                      on
                        ? t.chipNavy
                        : `${t.muted} ${isDark ? "hover:text-white" : "hover:text-[#001F3F]"}`
                    }`}
                  >
                    <tab.icon size={12} />
                    {tab.label}
                    {tab.count > 0 && (
                      <span
                        className={`rounded-md px-1.5 text-[12px] ${on ? (isDark ? "bg-[#001F3F]/10" : "bg-white/20") : isDark ? "bg-white/10" : "bg-slate-100"}`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {activeTab === "services" && (
              <Link
                to="/services/new"
                state={{ customerId: client.id }}
                className={`${btnBase} h-9 px-4 ${t.btnPrimary}`}
              >
                <FiPlus size={14} /> Add service
              </Link>
            )}
            {activeTab === "invoices" && (
              <Link
                to="/billing/new"
                state={{ customerId: client.id }}
                className={`${btnBase} h-9 bg-green-600 px-4 text-white hover:bg-green-700`}
              >
                <FiPlus size={14} /> Create invoice
              </Link>
            )}
            {activeTab === "ocr" && (
              <button
                onClick={() => ocrFileRef.current?.click()}
                disabled={ocrBusy}
                className={`${btnBase} h-9 px-4 ${t.btnPrimary}`}
              >
                {ocrBusy ? (
                  <FiLoader size={14} className="animate-spin" />
                ) : (
                  <FiUpload size={14} />
                )}
                {ocrBusy ? "Reading…" : "Upload RC photo"}
              </button>
            )}
          </div>

          <div className="p-3 sm:p-4">
            {/* overview */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Stat
                  isDark={isDark}
                  title="Last service"
                  value={lastService}
                  icon={FiCalendar}
                />
                <Stat
                  isDark={isDark}
                  title="Total services"
                  value={services.length}
                  icon={FiTool}
                />
                <Stat
                  isDark={isDark}
                  title="Total billed"
                  value={fmtMoney(totalBilled)}
                  icon={FiDollarSign}
                />
              </div>
            )}

            {/* services */}
            {activeTab === "services" &&
              (services.length ? (
                <div className="space-y-2">
                  {services.map((s) => (
                    <Row
                      key={s.id}
                      isDark={isDark}
                      icon={FiTool}
                      title={s.type || "Service"}
                      meta={`${fmtDate(s.date)} · ${fmtMoney(s.cost)}`}
                      note={s.notes}
                      status={s.status}
                    />
                  ))}
                </div>
              ) : (
                <Empty
                  isDark={isDark}
                  icon={FiTool}
                  text="No service records yet."
                />
              ))}

            {/* invoices */}
            {activeTab === "invoices" &&
              (invoices.length ? (
                <div className="space-y-2">
                  {invoices.map((inv) => (
                    <Row
                      key={inv.id}
                      isDark={isDark}
                      icon={FiFileText}
                      title={`Invoice #${inv.invoiceNumber || inv.id}`}
                      meta={`${fmtDate(inv.createdAt)} · ${fmtMoney(inv.grandTotal || inv.totalAmount)}`}
                      status={inv.status}
                    />
                  ))}
                </div>
              ) : (
                <Empty
                  isDark={isDark}
                  icon={FiDollarSign}
                  text="No invoices yet."
                />
              ))}

            {/* OCR */}
            {activeTab === "ocr" && (
              <div className="space-y-3">
                {ocrParsed && (
                  <div className={`rounded-xl border-2 p-3 ${t.inner}`}>
                    <OCRResults
                      isDark={isDark}
                      parsedData={ocrParsed}
                      rawOcrText={ocrRaw}
                      onSave={handleSaveOCR}
                    />
                  </div>
                )}

                {isLoadingOCR ? (
                  <div className="flex items-center justify-center gap-2 py-10">
                    <FiLoader
                      className={`animate-spin ${t.heading}`}
                      size={16}
                    />
                    <span className={`text-[14px] ${t.muted}`}>
                      Loading RC scans…
                    </span>
                  </div>
                ) : ocrRecords.length ? (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {ocrRecords.map((r) => {
                      const p = parseOcr(r);
                      return (
                        <div
                          key={r.id}
                          className={`flex items-center gap-3 rounded-xl border-2 p-3 ${t.inner}`}
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.chipNavy}`}
                          >
                            <FiFileText size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`truncate text-[14px] font-bold ${t.heading}`}
                            >
                              {p.ownerName || "Unknown owner"}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2">
                              {p.regNo && <Plate value={p.regNo} size="sm" />}
                              <span className={`text-[12px] ${t.muted}`}>
                                {new Date(r.createdAt).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedOCR(r)}
                            title="View"
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 ${t.btnGhost}`}
                          >
                            <FiEye size={14} />
                          </button>
                          <button
                            onClick={() => setOcrToDelete(r)}
                            title="Delete"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  !ocrParsed && (
                    <Empty
                      isDark={isDark}
                      icon={FiFileText}
                      text="No RC scans saved for this client."
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── OCR record modal ── */}
      <Modal
        isDark={isDark}
        open={!!selectedOCR}
        onClose={() => setSelectedOCR(null)}
        icon={FiFileText}
        title="RC scan details"
        subtitle={
          selectedOCR
            ? `Scanned ${new Date(selectedOCR.createdAt).toLocaleString("en-IN")}`
            : ""
        }
        maxW="max-w-5xl"
      >
        {selectedOCR && (
          <div className="space-y-5 p-4 sm:p-5">
            <OcrGroup isDark={isDark} title="Vehicle identification">
              <KV
                isDark={isDark}
                label="Registration number"
                value={sel.regNo}
                mono
              />
              <KV
                isDark={isDark}
                label="Registration date"
                value={sel.regDate}
              />
              <KV
                isDark={isDark}
                label="Chassis number"
                value={sel.chassisNo}
                mono
              />
              <KV
                isDark={isDark}
                label="Engine number"
                value={sel.engineNo}
                mono
              />
              <KV isDark={isDark} label="Maker" value={sel.maker || sel.mfr} />
              <KV
                isDark={isDark}
                label="Model / variant"
                value={[sel.model, sel.variant].filter(Boolean).join(" / ")}
              />
            </OcrGroup>
            <OcrGroup isDark={isDark} title="Specifications">
              <KV
                isDark={isDark}
                label="Vehicle class"
                value={sel.vehicleClass}
              />
              <KV
                isDark={isDark}
                label="Body type"
                value={sel.body || sel.bodyType}
              />
              <KV
                isDark={isDark}
                label="Colour"
                value={sel.colour || sel.color}
              />
              <KV
                isDark={isDark}
                label="Fuel"
                value={sel.fuel || sel.fuelType}
              />
              <KV isDark={isDark} label="Wheel base" value={sel.wheelBase} />
              <KV isDark={isDark} label="MFG date" value={sel.mfgDate} />
              <KV
                isDark={isDark}
                label="Seating"
                value={sel.seating || sel.seatingCapacity}
              />
              <KV isDark={isDark} label="Cylinders" value={sel.noOfCyl} />
              <KV
                isDark={isDark}
                label="Unladen weight"
                value={sel.unladenWt}
              />
              <KV isDark={isDark} label="CC" value={sel.cc} />
            </OcrGroup>
            <OcrGroup isDark={isDark} title="Validity">
              <KV
                isDark={isDark}
                label="Reg / FC valid upto"
                value={sel.regFcUpto}
              />
              <KV
                isDark={isDark}
                label="Fitness upto"
                value={sel.fitUpto || sel.fitnessUpto}
              />
              <KV
                isDark={isDark}
                label="Insurance upto"
                value={sel.insuranceUpto}
              />
              <KV isDark={isDark} label="Tax upto" value={sel.taxUpto} />
            </OcrGroup>
            <OcrGroup isDark={isDark} title="Ownership">
              <KV isDark={isDark} label="Owner name" value={sel.ownerName} />
              <KV isDark={isDark} label="S/W/D of" value={sel.swdOf} />
              <KV isDark={isDark} label="Address" value={sel.address} wide />
            </OcrGroup>
            {selectedOCR.rawText && (
              <div>
                <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Raw OCR text
                </p>
                <pre
                  className={`max-h-60 overflow-auto whitespace-pre-wrap rounded-xl border-2 p-3 text-[12px] ${t.inner} ${t.body}`}
                >
                  {selectedOCR.rawText}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isDark={isDark}
        open={confirmWa}
        tone="success"
        title="Send receipt?"
        message={`Send the "Vehicle received" WhatsApp message to ${client.fullName || "this client"}${client.phone ? ` (${client.phone})` : ""}.`}
        confirmText="Send"
        busy={sendingWa}
        onCancel={() => setConfirmWa(false)}
        onConfirm={sendWhatsApp}
      />
      <ConfirmDialog
        isDark={isDark}
        open={!!ocrToDelete}
        title="Delete RC scan?"
        message="This saved scan will be removed permanently."
        confirmText="Delete"
        onCancel={() => setOcrToDelete(null)}
        onConfirm={handleDeleteOCR}
      />
    </div>
  );
}

/* ───────────── small pieces ───────────── */

function Spec({ isDark, icon: Icon, label, value }) {
  const t = tk(isDark);
  return (
    <div className={`rounded-xl border-2 p-2.5 ${t.inner}`}>
      <div className="flex items-center gap-1.5 text-slate-400">
        <Icon size={12} />
        <span className="text-[12px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className={`mt-1 truncate text-[14px] font-black ${t.heading}`}>
        {value || "—"}
      </p>
    </div>
  );
}

function Info({ isDark, icon: Icon, label, value, href, mono }) {
  const t = tk(isDark);
  const inner = (
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
          title={value || ""}
        >
          {value || "—"}
        </p>
      </div>
    </>
  );
  const cls = `flex items-center gap-3 rounded-xl border-2 p-3 ${t.inner}`;
  return href ? (
    <a href={href} className={`${cls} hover:underline`}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function Stat({ isDark, title, value, icon: Icon }) {
  const t = tk(isDark);
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border-2 p-4 ${t.inner}`}
    >
      <div className="min-w-0">
        <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
          {title}
        </p>
        <p className={`truncate text-[16px] font-black ${t.heading}`}>
          {value}
        </p>
      </div>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.chipNavy}`}
      >
        <Icon size={16} />
      </div>
    </div>
  );
}

function Row({ isDark, icon: Icon, title, meta, note, status }) {
  const t = tk(isDark);
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border-2 p-3 transition ${t.inner} ${t.hoverRow}`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.chipNavy}`}
      >
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[14px] font-bold ${t.heading}`}>{title}</p>
        <p className={`text-[12px] font-medium ${t.muted}`}>{meta}</p>
        {note && (
          <p className={`mt-1 line-clamp-2 text-[12px] ${t.body}`}>{note}</p>
        )}
      </div>
      {status && (
        <span
          className={`shrink-0 rounded-full border px-2 py-px text-[12px] font-bold ${statusClass(status)}`}
        >
          {status}
        </span>
      )}
    </div>
  );
}

function Empty({ isDark, icon: Icon, text }) {
  const t = tk(isDark);
  return (
    <div className="py-10 text-center">
      <div
        className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? "bg-white/5 text-slate-500" : "bg-[#F8FAFC] text-slate-400"}`}
      >
        <Icon size={16} />
      </div>
      <p className={`text-[14px] font-semibold ${t.muted}`}>{text}</p>
    </div>
  );
}

function OcrGroup({ isDark, title, children }) {
  const t = tk(isDark);
  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <h4
          className={`text-[12px] font-black uppercase tracking-[0.2em] ${t.heading}`}
        >
          {title}
        </h4>
        <div
          className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-[#CBD5E1]"}`}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

function KV({ isDark, label, value, mono, wide }) {
  const t = tk(isDark);
  return (
    <div
      className={`rounded-xl border-2 p-3 ${t.inner} ${wide ? "sm:col-span-2 lg:col-span-3" : ""}`}
    >
      <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p
        className={`mt-0.5 break-words text-[14px] font-bold ${t.heading} ${mono ? "font-mono" : ""}`}
      >
        {value || "—"}
      </p>
    </div>
  );
}
