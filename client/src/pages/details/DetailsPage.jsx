// client/src/pages/details/DetailsPage.jsx  (Car CRM – RC scanner)
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import {
  FiCheckCircle,
  FiUsers,
  FiAlertTriangle,
  FiLoader,
  FiCamera,
  FiDatabase,
  FiActivity,
  FiRefreshCw,
  FiSearch,
  FiArrowLeft,
  FiLock,
  FiFileText,
  FiZap,
} from "react-icons/fi";
import { useTheme } from "../../contexts/ThemeContext";
import OCRUploader from "./components/OCRUploader";
import OCRResults from "./components/OCRResults";
import OCRHistory from "./components/OCRHistory";
import OCRDebugPanel from "./components/OCRDebugPanel";
import { processImage } from "./utils/OCRProcessor.js";
import { loadHistory, deleteRecord, clearHistory } from "./utils/storageUtils";
import {
  PageHeading,
  SectionCard,
  Plate,
  Modal,
  tk,
  btnBase,
} from "../clients/components/clientUi";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
const BASIC_DAILY_LIMIT = 10;
const listOf = (d) => (Array.isArray(d) ? d : d?.clients || d?.data || []);
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

const DetailsPage = () => {
  const { isDark } = useTheme();
  const t = tk(isDark);
  const [searchParams] = useSearchParams();
  const urlClientId = searchParams.get("clientId");
  const urlClientName = searchParams.get("clientName");

  const [clientId, setClientId] = useState(urlClientId || "");
  const [clientName, setClientName] = useState(urlClientName || "");
  const [clientObj, setClientObj] = useState(null);
  const [clientList, setClientList] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientError, setClientError] = useState(null);
  const [clientQuery, setClientQuery] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [clientResults, setClientResults] = useState([]);
  const clientBoxRef = useRef(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [rawOcrText, setRawOcrText] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("idle"); // idle | running | done | error
  const [debugInfo, setDebugInfo] = useState({});
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [historyData, setHistoryData] = useState([]);

  const [dailyUsage, setDailyUsage] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isBasic = user?.plan === "BASIC";
  const processingRef = useRef(false);

  /* ---------- clients ---------- */
  useEffect(() => {
    if (urlClientId) return;
    (async () => {
      setLoadingClients(true);
      setClientError(null);
      try {
        if (!localStorage.getItem("token"))
          throw new Error("Please log in again.");
        const res = await fetch(`${API_BASE}/api/clients`, {
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error(`Failed to load clients (${res.status})`);
        setClientList(listOf(await res.json()));
      } catch (err) {
        console.error("Error fetching clients:", err);
        setClientError(err.message);
      } finally {
        setLoadingClients(false);
      }
    })();
  }, [urlClientId]);

  // linked from a client page: load that client for the header card
  useEffect(() => {
    if (!urlClientId) return;
    fetch(`${API_BASE}/api/clients/${urlClientId}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => c && setClientObj(c))
      .catch(() => {});
  }, [urlClientId]);

  // client search (local list, then server)
  useEffect(() => {
    if (!clientOpen) return;
    const q = clientQuery.trim().toLowerCase();
    setClientResults(
      (q
        ? clientList.filter((c) =>
            [c.fullName, c.regNumber, c.phone]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(q)),
          )
        : clientList
      ).slice(0, 20),
    );
    if (!q) return;
    const h = setTimeout(() => {
      fetch(
        `${API_BASE}/api/clients?limit=20&q=${encodeURIComponent(clientQuery.trim())}`,
        { headers: authHeaders() },
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!d) return;
          setClientResults((prev) => {
            const seen = new Set(prev.map((c) => c.id));
            return [...prev, ...listOf(d).filter((c) => !seen.has(c.id))].slice(
              0,
              20,
            );
          });
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(h);
  }, [clientQuery, clientOpen, clientList]);

  useEffect(() => {
    const onDown = (e) =>
      clientBoxRef.current &&
      !clientBoxRef.current.contains(e.target) &&
      setClientOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  /* ---------- history ---------- */
  useEffect(() => {
    if (!clientId) return setHistoryData([]);
    loadHistory(clientId)
      .then((d) => setHistoryData(Array.isArray(d) ? d : []))
      .catch((err) => console.error("Error loading OCR history:", err));
  }, [clientId]);

  /* ---------- daily usage (BASIC) ---------- */
  useEffect(() => {
    const today = new Date().toLocaleDateString();
    const usage = JSON.parse(localStorage.getItem("ocr_usage") || "{}");
    if (usage.date !== today) {
      localStorage.setItem(
        "ocr_usage",
        JSON.stringify({ date: today, count: 0 }),
      );
      setDailyUsage(0);
    } else setDailyUsage(usage.count || 0);
  }, []);

  /* ---------- OCR ---------- */
  const handleStartOCR = async (image) => {
    if (!image || processingRef.current) return;
    if (isBasic && dailyUsage >= BASIC_DAILY_LIMIT) {
      setShowUpgrade(true);
      return;
    }
    processingRef.current = true;
    setError(null);
    setParsedData(null);
    setIsEditing(false);
    setOcrProgress(0);
    setOcrStatus("running");
    try {
      const result = await processImage(image, (p) =>
        setOcrProgress(Math.round(p * 100)),
      );
      setParsedData(result.parsed);
      setRawOcrText(result.text);
      setDebugInfo({
        confidence: result.confidence,
        quality:
          result.confidence >= 80
            ? "High"
            : result.confidence >= 60
              ? "Medium"
              : "Low",
        extractedFields: Object.entries(result.parsed || {}).filter(
          ([k, v]) => v && !["ocrConfidence", "extractedDate"].includes(k),
        ).length,
        textLength: result.text?.length || 0,
      });
      setOcrProgress(100);
      setOcrStatus("done");
    } catch (err) {
      setError(`OCR failed: ${err.message}`);
      setOcrStatus("error");
    } finally {
      processingRef.current = false;
    }
  };

  const handleSave = async (data) => {
    if (!clientId) {
      toast.error("Choose a client first, then save.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/ocr/upload`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          clientId: Number(clientId) || clientId,
          rawText: rawOcrText,
          parsedData: JSON.stringify(data),
          confidence: debugInfo.confidence || 0,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 400 && body.duplicate) {
        toast.error(`Duplicate! This RC is registered to ${body.clientName}`);
        return;
      }
      if (!res.ok) throw new Error(body.message || "Failed to save record");

      if (isBasic) {
        const today = new Date().toLocaleDateString();
        const usage = JSON.parse(localStorage.getItem("ocr_usage") || "{}");
        const count = usage.date === today ? (usage.count || 0) + 1 : 1;
        localStorage.setItem(
          "ocr_usage",
          JSON.stringify({ date: today, count }),
        );
        setDailyUsage(count);
      }
      if (body.record) setHistoryData((prev) => [body.record, ...prev]);
      toast.success("RC details saved");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setParsedData(null);
    setRawOcrText("");
    setEditedData({});
    setIsEditing(false);
    setError(null);
    setOcrProgress(0);
    setOcrStatus("idle");
    setDebugInfo({});
  };

  const pickClient = (c) => {
    setClientId(c.id);
    setClientName(c.fullName);
    setClientObj(c);
    setClientQuery("");
    setClientOpen(false);
  };

  const running = ocrStatus === "running";

  return (
    <div className="min-h-screen lg:ml-16">
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontSize: 14 } }}
      />
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
        <div className="space-y-3">
          {urlClientId && (
            <Link
              to={`/clients/${urlClientId}`}
              className={`inline-flex items-center gap-1.5 text-[12px] font-black uppercase tracking-[0.15em] ${t.muted} ${isDark ? "hover:text-white" : "hover:text-[#001F3F]"}`}
            >
              <FiArrowLeft size={14} /> Back to client
            </Link>
          )}
          <PageHeading
            isDark={isDark}
            badge="OCR · processed on this device"
            title="RC"
            accent="scanner."
            subtitle="Snap or upload an RC — details are read automatically and saved to the client."
            right={
              ocrStatus !== "idle" && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={running}
                  className={`${btnBase} h-10 border-2 px-4 ${t.btnGhost}`}
                >
                  <FiRefreshCw size={14} /> New scan
                </button>
              )
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* left: capture + progress */}
          <div className="min-w-0 space-y-4 sm:space-y-5">
            <SectionCard
              isDark={isDark}
              icon={FiCamera}
              step="01"
              title="Capture RC"
              subtitle="Camera or a photo from your gallery"
            >
              <OCRUploader
                isDark={isDark}
                onImageSelect={setSelectedImage}
                onImageCaptured={handleStartOCR}
                selectedImage={selectedImage}
                onReset={handleReset}
                busy={running}
              />

              {ocrStatus !== "idle" && (
                <div
                  className={`mt-4 rounded-xl border-2 p-3 ${
                    ocrStatus === "error"
                      ? "border-red-500/30 bg-red-500/10"
                      : ocrStatus === "done"
                        ? "border-green-500/30 bg-green-500/10"
                        : t.inner
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span
                      className={`flex items-center gap-2 text-[14px] font-bold ${
                        ocrStatus === "error"
                          ? "text-red-500"
                          : ocrStatus === "done"
                            ? "text-green-600"
                            : t.heading
                      }`}
                    >
                      {running && (
                        <FiLoader size={14} className="animate-spin" />
                      )}
                      {ocrStatus === "done" && <FiCheckCircle size={14} />}
                      {ocrStatus === "error" && <FiAlertTriangle size={14} />}
                      {running
                        ? "Reading the RC…"
                        : ocrStatus === "done"
                          ? "Scan complete — check the details below"
                          : error || "Scan failed"}
                    </span>
                    <span className={`text-[14px] font-black ${t.heading}`}>
                      {ocrProgress}%
                    </span>
                  </div>
                  <div
                    className={`h-2 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-slate-200"}`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        ocrStatus === "error"
                          ? "bg-red-500"
                          : ocrStatus === "done"
                            ? "bg-green-500"
                            : isDark
                              ? "bg-white"
                              : "bg-[#001F3F]"
                      }`}
                      style={{ width: `${ocrProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </SectionCard>
          </div>

          {/* right: client + quality */}
          <div className="space-y-4 sm:space-y-5 lg:sticky lg:top-20 lg:self-start">
            <SectionCard
              isDark={isDark}
              icon={FiUsers}
              title="Client"
              subtitle={
                clientId
                  ? "Scans are saved to this client"
                  : "Needed before you save"
              }
            >
              {clientId ? (
                <div
                  className={`flex items-center gap-3 rounded-xl border-2 p-3 ${t.inner}`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[14px] font-black ${t.chipNavy}`}
                  >
                    {(clientName || "C").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-[14px] font-black ${t.heading}`}
                    >
                      {clientName || clientObj?.fullName || "Selected client"}
                    </p>
                    {clientObj?.regNumber ? (
                      <Plate value={clientObj.regNumber} size="sm" />
                    ) : (
                      <p className="text-[12px] font-bold text-green-600">
                        Linked
                      </p>
                    )}
                  </div>
                  {!urlClientId && (
                    <button
                      type="button"
                      onClick={() => {
                        setClientId("");
                        setClientName("");
                        setClientObj(null);
                        setClientOpen(true);
                      }}
                      className={`${btnBase} h-8 border-2 px-2.5 ${t.btnGhost}`}
                    >
                      Change
                    </button>
                  )}
                </div>
              ) : loadingClients ? (
                <p className={`flex items-center gap-2 text-[14px] ${t.muted}`}>
                  <FiLoader size={14} className="animate-spin" /> Loading
                  clients…
                </p>
              ) : clientError ? (
                <p className="rounded-xl border-2 border-red-500/30 bg-red-500/10 p-3 text-[14px] font-semibold text-red-500">
                  {clientError}
                </p>
              ) : (
                <div ref={clientBoxRef} className="relative">
                  <div className="relative">
                    <FiSearch
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <input
                      value={clientQuery}
                      onChange={(e) => {
                        setClientQuery(e.target.value);
                        setClientOpen(true);
                      }}
                      onFocus={() => setClientOpen(true)}
                      placeholder="Search name, reg no or phone"
                      autoComplete="off"
                      className={`h-11 w-full rounded-xl border-2 pl-10 pr-3 text-[14px] font-semibold outline-none transition ${t.input}`}
                    />
                  </div>
                  {clientOpen && (
                    <div
                      className={`mt-2 max-h-60 w-full overflow-y-auto rounded-xl border-2 ${t.menu}`}
                    >
                      {clientResults.length ? (
                        clientResults.map((c) => (
                          <button
                            type="button"
                            key={c.id}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => pickClient(c)}
                            className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-[14px] ${t.option}`}
                          >
                            <span className="min-w-0">
                              <span className="block truncate font-bold">
                                {c.fullName}
                              </span>
                              <span
                                className={`block truncate text-[12px] ${t.muted}`}
                              >
                                {[c.vehicleMake, c.vehicleModel]
                                  .filter(Boolean)
                                  .join(" ")}
                              </span>
                            </span>
                            <Plate value={c.regNumber} size="sm" />
                          </button>
                        ))
                      ) : (
                        <p className={`px-3 py-3 text-[14px] ${t.muted}`}>
                          No client found.
                        </p>
                      )}
                    </div>
                  )}
                  <p className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-amber-600">
                    <FiAlertTriangle size={12} /> Choose a client before saving
                    the scan
                  </p>
                </div>
              )}
            </SectionCard>

            {isBasic && (
              <div className={`rounded-2xl border-2 p-4 ${t.card}`}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[12px] font-black uppercase tracking-[0.15em] text-slate-400">
                    Today's scans
                  </span>
                  <span
                    className={`text-[14px] font-black ${dailyUsage >= BASIC_DAILY_LIMIT ? "text-red-500" : t.heading}`}
                  >
                    {dailyUsage} / {BASIC_DAILY_LIMIT}
                  </span>
                </div>
                <div
                  className={`h-2 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}
                >
                  <div
                    className={`h-full rounded-full ${dailyUsage >= BASIC_DAILY_LIMIT ? "bg-red-500" : dailyUsage >= 7 ? "bg-amber-500" : "bg-green-500"}`}
                    style={{
                      width: `${Math.min(100, (dailyUsage / BASIC_DAILY_LIMIT) * 100)}%`,
                    }}
                  />
                </div>
                <p className={`mt-2 text-[12px] ${t.muted}`}>
                  Basic plan.{" "}
                  <a href="/upgrade" className="font-bold underline">
                    Upgrade
                  </a>{" "}
                  for unlimited scans.
                </p>
              </div>
            )}

            <SectionCard
              isDark={isDark}
              icon={FiActivity}
              title="Quality report"
            >
              <OCRDebugPanel isDark={isDark} debugInfo={debugInfo} />
            </SectionCard>
          </div>
        </div>

        {/* results */}
        {parsedData && (
          <SectionCard
            isDark={isDark}
            icon={FiDatabase}
            step="02"
            title="Extracted details"
            subtitle="Check, fix anything wrong, then save"
          >
            <OCRResults
              isDark={isDark}
              parsedData={parsedData}
              rawOcrText={rawOcrText}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              editedData={editedData}
              setEditedData={setEditedData}
              onSave={handleSave}
            />
          </SectionCard>
        )}

        {/* history */}
        {clientId && (
          <SectionCard
            isDark={isDark}
            icon={FiFileText}
            step={parsedData ? "03" : "02"}
            title="Saved scans"
            subtitle={clientName || "This client"}
          >
            <OCRHistory
              isDark={isDark}
              historyData={historyData}
              onDelete={async (id) => {
                try {
                  await deleteRecord(id);
                  setHistoryData(await loadHistory(clientId));
                  toast.success("Scan deleted");
                } catch (e) {
                  toast.error(e.message);
                }
              }}
              onClear={async () => {
                const ok = await clearHistory(clientId);
                if (ok) {
                  setHistoryData([]);
                  toast.success("All scans cleared");
                } else toast.error("Couldn't clear all scans");
              }}
            />
          </SectionCard>
        )}

        <p
          className={`flex items-center justify-center gap-2 pb-2 text-center text-[12px] ${t.muted}`}
        >
          <FiLock size={12} /> Text is read on this device (Tesseract.js); only
          the details you save are sent to the server.
        </p>
      </div>

      {/* daily limit */}
      <Modal
        isDark={isDark}
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        icon={FiZap}
        title="Daily scan limit reached"
        maxW="max-w-md"
      >
        <div className="space-y-4 p-4 sm:p-5">
          <div className={`rounded-xl border-2 p-3 ${t.inner}`}>
            <div className="mb-2 flex items-center justify-between text-[14px]">
              <span className={t.muted}>Basic plan</span>
              <span className="font-black text-red-500">
                {BASIC_DAILY_LIMIT}/{BASIC_DAILY_LIMIT} used today
              </span>
            </div>
            <div className="h-2 rounded-full bg-red-500" />
          </div>
          <p className={`text-[14px] ${t.body}`}>
            Upgrade to <b className={t.heading}>Standard</b> or{" "}
            <b className={t.heading}>Premium</b> for unlimited RC scanning. Your
            limit resets tomorrow.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["Standard", ["Unlimited OCR", "Priority support"]],
              ["Premium", ["Everything in Standard", "Advanced features"]],
            ].map(([name, feats]) => (
              <div key={name} className={`rounded-xl border-2 p-3 ${t.inner}`}>
                <p
                  className={`text-[14px] font-black uppercase tracking-tight ${t.heading}`}
                >
                  {name}
                </p>
                <ul className="mt-1 space-y-1">
                  {feats.map((f) => (
                    <li
                      key={f}
                      className={`flex items-center gap-1.5 text-[12px] ${t.body}`}
                    >
                      <FiCheckCircle
                        size={12}
                        className="shrink-0 text-green-500"
                      />{" "}
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShowUpgrade(false)}
              className={`${btnBase} h-11 border-2 ${t.btnGhost}`}
            >
              Maybe later
            </button>
            <button
              type="button"
              onClick={() => (window.location.href = "/upgrade")}
              className={`${btnBase} h-11 ${t.btnPrimary} shadow-xl`}
            >
              Upgrade now
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DetailsPage;
