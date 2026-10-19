// client/src/pages/clients/ClientForm.jsx  (Car CRM – add / edit client)
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import {
  FiSave,
  FiX,
  FiCamera,
  FiUpload,
  FiArrowLeft,
  FiUserCheck,
  FiLock,
  FiLoader,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { Toaster, toast } from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";

import PersonalInfoSection from "./components/PersonalInfoSection";
import VehicleInfoSection from "./components/VehicleInfoSection";
import ImageUploader from "./components/ImageUploader";
import {
  SectionCard,
  TextField,
  PageHeading,
  Plate,
  VehicleImage,
  tk,
  btnBase,
  toCode,
} from "./components/clientUi";

import { processImage } from "../details/utils/OCRProcessor.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  const response = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }
  return response;
};

const EMPTY_FORM = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleYear: "",
  regNumber: "",
  vin: "",
  color: "",
  fuel: "",
  seats: "",
  notes: "",
  carImage: "",
  adImage: "",
  damageImages: [],
  advisorName: "",
};

/* ---------- OCR normalisation helpers ---------- */
const CLEANWORDS = [
  "india",
  "ltd",
  "limited",
  "pvt",
  "private",
  "motors",
  "motor",
  "automobiles",
  "automobile",
  "company",
];
const normalizeText = (s = "") =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "")
    .trim();
const cleanBrand = (s = "") => {
  let t = String(s).toLowerCase();
  CLEANWORDS.forEach((w) => (t = t.replace(w, "")));
  return t.replace(/[^a-z]/gi, "").trim();
};
const levenshtein = (a, b) => {
  const m = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) m[i][0] = i;
  for (let j = 0; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      m[i][j] = Math.min(
        m[i - 1][j] + 1,
        m[i][j - 1] + 1,
        m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return m[a.length][b.length];
};
const fuzzyMatch = (input, list) => {
  if (!input || !list.length) return "";
  const target = normalizeText(input);
  let best = "";
  let score = Infinity;
  list.forEach((item) => {
    const d = levenshtein(target, normalizeText(item));
    if (d < score) {
      score = d;
      best = item;
    }
  });
  return best;
};
const extractFuel = (s = "") => {
  const parts = String(s)
    .split(/\/|,| |-|\(|\)/)
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  const found = parts.find((p) =>
    ["petrol", "diesel", "cng", "electric", "hyb"].includes(p),
  );
  return found ? found.charAt(0).toUpperCase() + found.slice(1) : "";
};
const extractSeats = (s = "") => String(s).match(/\b[2-9]\b/)?.[0] || "";

/* image file → jpeg data URL (waits for the image to load) */
const fileToJpeg = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg"));
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });

export default function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const t = tk(isDark);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const effectivePlan = user?.plan || "BASIC";
  const canScanRC = user?.plan !== "BASIC";

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);
  const [loadingClient, setLoadingClient] = useState(false);
  const [isProcessingRC, setIsProcessingRC] = useState(false);

  const [carMakes, setCarMakes] = useState([]);
  const [carModels, setCarModels] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [seatOptions, setSeatOptions] = useState([]);

  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  const [advisorInput, setAdvisorInput] = useState("");
  const [advisorSuggestions, setAdvisorSuggestions] = useState([]);
  const [advisorOpen, setAdvisorOpen] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  /* ---------- models for a make ---------- */
  const fetchCarModels = async (makeName) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/api/cars/local-models?make=${encodeURIComponent(makeName)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      const models = (data.models || []).map((m, i) => ({
        id: i + 1,
        name: m.name,
        thumbnailUrl: m.thumbnailUrl,
        heroUrl: m.heroUrl,
        yearVariants: m.yearVariants || {},
      }));
      setCarModels(models);
      return models;
    } catch (e) {
      console.log("Models load error", e);
      return [];
    }
  };

  /* ---------- OCR → form patch (only fills fields it actually found) ---------- */
  const mapOcrToForm = async (parsed = {}) => {
    const patch = {};
    const put = (k, v) => {
      if (v !== undefined && v !== null && String(v).trim() !== "")
        patch[k] = v;
    };
    const grab = (keys) => {
      for (const k of keys) {
        if (parsed[k]) return parsed[k];
        const found = Object.keys(parsed).find((x) =>
          x.toLowerCase().includes(k.toLowerCase()),
        );
        if (found) return parsed[found];
      }
      return "";
    };

    put("regNumber", toCode(grab(["reg", "registration"])));
    put("fullName", grab(["owner"]));
    put("address", grab(["address"]));
    put("vin", toCode(grab(["vin", "chassis"])));
    put(
      "vehicleYear",
      String(grab(["year", "mfg"])).match(/\b(19|20)\d{2}\b/)?.[0],
    );
    put("color", grab(["color", "colour"]));
    put("fuel", extractFuel(grab(["fuel"])));
    put("seats", extractSeats(grab(["seat", "seating"])));

    const rawMake = grab(["make", "manufacturer", "maker", "brand"]);
    const cleanedMake = cleanBrand(rawMake);
    const direct = cleanedMake
      ? carMakes.find((m) => cleanBrand(m.make).includes(cleanedMake))
      : null;
    const makeName =
      direct?.make ||
      fuzzyMatch(
        rawMake,
        carMakes.map((m) => m.make),
      );
    put("vehicleMake", makeName || rawMake);

    const rawModel = grab(["model", "variant"]);
    let modelName = rawModel;
    if (makeName) {
      try {
        const models = await fetchCarModels(makeName);
        modelName =
          fuzzyMatch(
            rawModel,
            (models || []).map((m) => m.name),
          ) || rawModel;
      } catch (err) {
        console.error("Model match error:", err);
      }
    }
    put("vehicleModel", modelName);
    return patch;
  };

  /* ---------- RC file ---------- */
  const handleRCFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setIsProcessingRC(true);
    try {
      const dataUrl = await fileToJpeg(file);
      const ocr = await processImage(dataUrl);
      const patch = await mapOcrToForm(ocr?.parsed || {});
      const filled = Object.keys(patch).length;
      setForm((prev) => ({ ...prev, ...patch }));
      if (filled)
        toast.success(
          `RC scanned — ${filled} field${filled > 1 ? "s" : ""} filled`,
        );
      else
        toast.error("Couldn't read details from this RC. Try a clearer photo.");
    } catch (err) {
      console.error(err);
      toast.error("RC scan failed");
    } finally {
      setIsProcessingRC(false);
    }
  };

  /* ---------- staff suggestions ---------- */
  const loadAdvisors = async (q = "") => {
    try {
      const r = await apiRequest(
        `/api/car-staff/search-mechanics${q ? `?q=${encodeURIComponent(q)}` : ""}`,
      );
      const data = await r.json();
      setAdvisorSuggestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error searching staff:", err);
      setAdvisorSuggestions([]);
    }
  };

  useEffect(() => {
    if (!advisorOpen) return;
    const h = setTimeout(() => loadAdvisors(advisorInput.trim()), 250);
    return () => clearTimeout(h);
  }, [advisorInput, advisorOpen]);

  /* ---------- meta ---------- */
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/cars/meta`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setFuelTypes(data.fuelTypes || []);
        setSeatOptions(data.seats || []);
      } catch (err) {
        console.error("Meta load error", err);
      }
    })();
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/cars/local-makes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setCarMakes(data.makes || []);
      } catch (err) {
        console.error("Makes load error", err);
      }
    })();
  }, []);

  /* ---------- edit mode ---------- */
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoadingClient(true);
        let data = location.state?.clientData;
        if (!data) {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_BASE}/api/clients/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Client not found");
          data = await res.json();
        }
        setForm((prev) => ({ ...prev, ...data }));
        setAdvisorInput(data.advisorName || "");
        if (data.vehicleMake) await fetchCarModels(data.vehicleMake);
      } catch (err) {
        console.error("Edit load failed:", err);
        toast.error("Failed to load client for editing");
      } finally {
        setLoadingClient(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, location.state]);

  /* ---------- auto car image from local dataset ---------- */
  useEffect(() => {
    const { vehicleMake: make, vehicleModel: model, vehicleYear: year } = form;
    if (!make || !model) return;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${API_BASE}/api/cars/local-image?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${encodeURIComponent(
            year || "",
          )}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (res.ok) {
          setForm((prev) => ({
            ...prev,
            carImage: data.heroUrl || data.thumbnailUrl || prev.carImage,
          }));
        }
      } catch (err) {
        console.error("Local image fetch error", err);
      }
    })();
  }, [form.vehicleMake, form.vehicleModel, form.vehicleYear]);

  /* ---------- save ---------- */
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/clients${id ? `/${id}` : ""}`, {
        method: id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          advisorName: advisorInput,
          sendWhatsApp,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Save failed");
      toast.success(
        sendWhatsApp ? "Client saved & WhatsApp sent!" : "Client saved!",
      );
      navigate("/clients");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openRC = (useCamera) => {
    if (useCamera && navigator.mediaDevices?.getUserMedia)
      cameraInputRef.current?.click();
    else fileInputRef.current?.click();
  };

  if (loadingClient) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 lg:ml-16">
        <FiLoader className={`animate-spin ${t.heading}`} size={24} />
        <p className={`text-[14px] font-semibold ${t.muted}`}>
          Loading client…
        </p>
      </div>
    );
  }

  const vehicleTitle = [form.vehicleMake, form.vehicleModel]
    .filter(Boolean)
    .join(" ");

  /* save/cancel buttons – reused in the sidebar (desktop) and sticky bar (phone) */
  const actions = (
    <>
      <button
        type="button"
        onClick={() => navigate("/clients")}
        className={`${btnBase} h-11 flex-1 border-2 px-4 ${t.btnGhost}`}
      >
        <FiX size={14} /> Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className={`${btnBase} h-11 flex-[2] px-4 ${t.btnPrimary} shadow-xl`}
      >
        {loading ? (
          <FiLoader size={14} className="animate-spin" />
        ) : (
          <FiSave size={14} />
        )}
        {loading ? "Saving…" : id ? "Update client" : "Save client"}
      </button>
    </>
  );

  const whatsappToggle = (
    <label
      className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 p-3 ${t.inner}`}
    >
      <span className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
          <FaWhatsapp size={16} />
        </span>
        <span>
          <span className={`block text-[14px] font-bold ${t.heading}`}>
            WhatsApp receipt
          </span>
          <span className={`block text-[12px] ${t.muted}`}>
            Send "vehicle received" message
          </span>
        </span>
      </span>
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={sendWhatsApp}
          onChange={(e) => setSendWhatsApp(e.target.checked)}
        />
        <span
          className={`h-6 w-11 rounded-full transition peer-checked:bg-green-500 ${isDark ? "bg-white/15" : "bg-slate-300"}`}
        />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );

  return (
    <div
      className="min-h-screen lg:ml-16"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontSize: 14 } }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleRCFile}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleRCFile}
      />

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-7xl space-y-4 pb-24 sm:space-y-5 lg:pb-8"
      >
        {/* ── header ── */}
        <div className="space-y-3">
          <Link
            to="/clients"
            className={`inline-flex items-center gap-1.5 text-[12px] font-black uppercase tracking-[0.15em] ${t.muted} ${isDark ? "hover:text-white" : "hover:text-[#001F3F]"}`}
          >
            <FiArrowLeft size={14} /> Clients
          </Link>
          <PageHeading
            isDark={isDark}
            badge={id ? "Editing record" : "New record"}
            title={id ? "Edit" : "New"}
            accent="client."
            subtitle="Customer, vehicle and check-in photos in one place."
            right={
              canScanRC ? (
                <>
                  <button
                    type="button"
                    onClick={() => openRC(true)}
                    disabled={isProcessingRC}
                    className={`${btnBase} h-10 px-4 ${t.btnPrimary} shadow-lg`}
                  >
                    {isProcessingRC ? (
                      <FiLoader size={14} className="animate-spin" />
                    ) : (
                      <FiCamera size={14} />
                    )}
                    {isProcessingRC ? "Scanning…" : "Scan RC"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openRC(false)}
                    disabled={isProcessingRC}
                    className={`${btnBase} h-10 border-2 px-4 ${t.btnGhost}`}
                    title="Upload RC photo"
                  >
                    <FiUpload size={14} /> Upload RC
                  </button>
                </>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-xl border-2 border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] font-bold text-amber-600">
                  <FiLock size={12} /> RC auto-fill: Standard & Premium plans
                </span>
              )
            }
          />
        </div>

        {isProcessingRC && (
          <div
            className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 ${t.inner}`}
          >
            <FiLoader className={`animate-spin ${t.heading}`} size={16} />
            <p className={`text-[14px] font-semibold ${t.heading}`}>
              Reading RC… details will fill in automatically.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* ── left: sections ── */}
          <div className="min-w-0 space-y-4 sm:space-y-5">
            <PersonalInfoSection
              form={form}
              setForm={setForm}
              isDark={isDark}
            />

            {/* advisor */}
            <SectionCard
              isDark={isDark}
              icon={FiUserCheck}
              step="02"
              title="Service advisor"
              subtitle="Who is handling this customer"
              bodyClass="p-4 sm:p-5"
            >
              <div className="relative max-w-md">
                <TextField
                  isDark={isDark}
                  label="Advisor / mechanic"
                  icon={<FiUserCheck size={12} />}
                  value={advisorInput}
                  onChange={(e) => {
                    setAdvisorInput(e.target.value);
                    setAdvisorOpen(true);
                  }}
                  onFocus={() => setAdvisorOpen(true)}
                  onBlur={() => setTimeout(() => setAdvisorOpen(false), 150)}
                  placeholder="Type or pick a staff member"
                  autoComplete="off"
                />
                {advisorOpen && advisorSuggestions.length > 0 && (
                  <div
                    className={`absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border-2 shadow-2xl ${t.menu}`}
                  >
                    {advisorSuggestions.map((staff) => (
                      <button
                        type="button"
                        key={staff.id ?? staff.name}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setAdvisorInput(staff.name);
                          setAdvisorOpen(false);
                        }}
                        className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-[14px] ${t.option}`}
                      >
                        <span className="flex items-center gap-2 font-semibold">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-lg text-[12px] font-black ${t.chipNavy}`}
                          >
                            {staff.name?.charAt(0)?.toUpperCase()}
                          </span>
                          {staff.name}
                        </span>
                        {staff.role && (
                          <span
                            className={`rounded-md border px-1.5 py-px text-[12px] font-bold uppercase tracking-wider ${t.inner} ${t.muted}`}
                          >
                            {staff.role}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>

            <VehicleInfoSection
              form={form}
              setForm={setForm}
              isDark={isDark}
              userPlan={effectivePlan}
              carMakes={carMakes}
              carModels={carModels}
              fetchCarModels={fetchCarModels}
              fuelTypes={fuelTypes}
              seatOptions={seatOptions}
            />

            <ImageUploader
              form={form}
              setForm={setForm}
              isDark={isDark}
              isImageUploaded={!!form.carImage}
            />

            {/* WhatsApp toggle – phone/tablet (desktop has it in the sidebar) */}
            <div className="lg:hidden">{whatsappToggle}</div>
          </div>

          {/* ── right: summary (desktop) ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              <div className={`overflow-hidden rounded-2xl border-2 ${t.card}`}>
                <VehicleImage
                  src={form.carImage}
                  className="h-44 w-full"
                  label={vehicleTitle || "Vehicle preview"}
                />
                <div className="space-y-3 p-4">
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      Summary
                    </p>
                    <p
                      className={`truncate text-[16px] font-black uppercase tracking-tight ${t.heading}`}
                    >
                      {form.fullName || "New customer"}
                    </p>
                    <p className={`truncate text-[14px] ${t.muted}`}>
                      {vehicleTitle || "Vehicle not selected"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Plate value={form.regNumber} />
                    {form.vehicleYear && (
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[12px] font-bold ${t.inner} ${t.heading}`}
                      >
                        {form.vehicleYear}
                      </span>
                    )}
                    {form.fuel && (
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[12px] font-bold ${t.inner} ${t.heading}`}
                      >
                        {form.fuel}
                      </span>
                    )}
                  </div>
                  {whatsappToggle}
                  <div className="flex gap-2">{actions}</div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* sticky save bar – phone/tablet (sits above the bottom nav) */}
        <div
          className={`fixed inset-x-0 z-30 border-t-2 p-3 backdrop-blur lg:hidden ${isDark ? "border-white/5 bg-[#000814]/95" : "border-[#CBD5E1] bg-white/95"}`}
          style={{ bottom: "calc(66px + env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex max-w-xl gap-2">{actions}</div>
        </div>
      </form>
    </div>
  );
}
