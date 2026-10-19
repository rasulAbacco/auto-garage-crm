// client/src/bikePages/client/AddClients.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Save,
  Camera,
  User,
  Upload,
  Trash2,
  Image as ImageIcon,
  Bike,
  FileText,
  RotateCw,
  Scan,
  ArrowLeft,
  Check,
  X,
} from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";
import { processImage as BikeprocessImage } from "/src/bikePages/OCRScanner/utils/BikeOCRProcessor.js";
import api from "../../utils/axiosInstance";

const EMPTY_FORM = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  receiverName: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleYear: "",
  regNumber: "",
  vin: "",
  color: "",
  fuel: "",
  notes: "",
  carImage: "",
  adImage: "",
  damageImages: [],
};

/** Reg. / chassis numbers: CAPITAL letters + digits only (spaces, dashes removed) */
const toCode = (value = "") =>
  String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

/* ---------- text helpers for brand / model matching ---------- */
const normalizeBrand = (str = "") =>
  str
    .toLowerCase()
    .replace(/ltd|limited|company|co|motor|motors|corp|corporation/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();

const isBrandMatch = (input, brand) => {
  const inputNorm = normalizeBrand(input);
  const brandNorm = normalizeBrand(brand);
  if (!inputNorm) return false;
  return inputNorm === brandNorm || brandNorm.startsWith(inputNorm);
};

const normalizeModel = (str = "") =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const findBestModelMatch = (typed, models) => {
  if (!typed || !models.length) return null;
  const t = normalizeModel(typed);
  const exact = models.find((m) => normalizeModel(m.name) === t);
  if (exact) return exact;
  const partial = models.find((m) => normalizeModel(m.name).includes(t));
  if (partial) return partial;
  const words = t.split(" ");
  return models.find((m) =>
    words.every((w) => normalizeModel(m.name).includes(w)),
  );
};

export default function AddClients() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const isEdit = Boolean(id && id !== "new");

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);
  const [loadingClient, setLoadingClient] = useState(false);
  const [isProcessingRC, setIsProcessingRC] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [bikeImageLoading, setBikeImageLoading] = useState(false);

  const [bikeMakes, setBikeMakes] = useState([]);
  const [bikeModels, setBikeModels] = useState([]);
  const [selectedBikeMake, setSelectedBikeMake] = useState(null);
  const [showBrandList, setShowBrandList] = useState(false);
  const [brandSelected, setBrandSelected] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const mainFileRef = useRef(null);
  const damageFileRef = useRef(null);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const setCode = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: toCode(e.target.value) }));

  /* ========== LOAD EXISTING CLIENT (EDIT MODE) ========== */
  useEffect(() => {
    const fill = (c) =>
      setForm({
        ...EMPTY_FORM,
        fullName: c.ownerName || c.fullName || "",
        phone: c.phone || "",
        email: c.email || "",
        address: c.address || "",
        receiverName: c.receiverName || "",
        vehicleMake: c.bikeBrand || c.vehicleMake || "",
        vehicleModel: c.bikeModel || c.vehicleModel || "",
        vehicleYear: c.bikeYear || c.vehicleYear || "",
        regNumber: toCode(c.regNumber || ""),
        vin: toCode(c.vin || ""),
        color: c.color || "",
        fuel: c.fuel || "",
        notes: c.notes || "",
        carImage: c.bikeImage || c.carImage || "",
        adImage: c.adImage || "",
        damageImages: Array.isArray(c.damageImages) ? c.damageImages : [],
      });

    if (location?.state?.clientData) {
      fill(location.state.clientData);
      return;
    }
    if (!isEdit) return;

    const fetchClient = async () => {
      try {
        setLoadingClient(true);
        const res = await api.get(`/api/bikes/${id}`);
        fill(res.data || {});
      } catch (err) {
        console.error("Fetch client error:", err);
        toast.error(
          err.response?.data?.message || err.message || "Failed to load client",
        );
        if (err.response?.status === 403 || err.response?.status === 404) {
          setTimeout(() => navigate("/bike-clients"), 2000);
        }
      } finally {
        setLoadingClient(false);
      }
    };
    fetchClient();
  }, [id, isEdit, location?.state, navigate]);

  /* ========== BIKE MAKES / MODELS ========== */
  useEffect(() => {
    api
      .get("/api/bikes-meta/local-makes")
      .then((res) => setBikeMakes(res.data.makes || []))
      .catch((err) => console.error("Bike makes load error", err));
  }, []);

  useEffect(() => {
    if (!form.vehicleMake) {
      setSelectedBikeMake(null);
      setBikeModels([]);
      setBrandSelected(false);
      return;
    }

    if (!brandSelected) {
      const found = bikeMakes.find(
        (b) => normalizeBrand(b.make) === normalizeBrand(form.vehicleMake),
      );
      setSelectedBikeMake(found || null);
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/api/bikes-meta/local-models", {
          params: { make: form.vehicleMake },
        });
        setBikeModels(res.data.models || []);
      } catch (err) {
        console.error("Failed to load models", err);
        setBikeModels([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [form.vehicleMake, bikeMakes, brandSelected]);

  // Auto-fetch a bike picture when make + model are known
  useEffect(() => {
    if (!form.vehicleMake || !form.vehicleModel || !bikeModels.length) return;
    const timer = setTimeout(() => {
      const best = findBestModelMatch(form.vehicleModel, bikeModels);
      if (best) fetchBikeImage(form.vehicleMake, best.name, form.vehicleYear);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.vehicleMake, form.vehicleModel, form.vehicleYear, bikeModels]);

  const fetchBikeImage = async (make, model, year) => {
    const nMake = make.trim();
    const nModel = model.trim();
    if (!nMake || !nModel) return;
    try {
      setBikeImageLoading(true);
      const res = await api.get("/api/bikes-meta/local-image", {
        params: {
          make: nMake.toUpperCase(),
          model: nModel,
          year: year || undefined,
        },
      });
      const img = res.data?.heroUrl || res.data?.thumbnailUrl;
      // keep a manually uploaded photo; only fill when empty or auto-filled before
      setForm((prev) =>
        prev.carImage && prev.carImage.startsWith("data:")
          ? prev
          : { ...prev, carImage: img || "" },
      );
    } catch (err) {
      console.warn("Bike image not found", err?.response?.data);
    } finally {
      setBikeImageLoading(false);
    }
  };

  /* ========== RC SCAN (OCR) ========== */
  const mapBikeOcrToForm = (p = {}) => ({
    fullName: p.ownerName || "",
    regNumber: toCode(p.regNo || ""),
    vehicleMake: p.maker || "",
    vehicleModel: p.vehicleModel || "",
    vehicleYear: p.regDate
      ? p.regDate.match(/\b(19|20)\d{2}\b/)?.[0] || ""
      : "",
    vin: toCode(p.chassisNo || ""),
    color: p.color || "",
    fuel: p.fuel || "",
    address: p.address || "",
  });

  const handleRCFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsProcessingRC(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const result = await BikeprocessImage(ev.target.result);
        const mapped = mapBikeOcrToForm(result?.parsed || {});
        // only overwrite fields the scan actually found
        const found = Object.fromEntries(
          Object.entries(mapped).filter(([, v]) => v),
        );
        setForm((prev) => ({ ...prev, ...found }));
        toast.success(
          Object.keys(found).length
            ? "RC scanned — details filled in"
            : "Couldn't read the RC clearly",
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to scan RC");
      } finally {
        setIsProcessingRC(false);
      }
    };
    reader.onerror = () => {
      toast.error("Could not read the file");
      setIsProcessingRC(false);
    };
    reader.readAsDataURL(file);
  };

  /* ========== IMAGES ========== */
  const toDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFiles = async (files, type = "damage") => {
    try {
      if (!files || !files.length) return;
      if (type === "main") {
        const dataUrl = await toDataUrl(files[0]);
        setForm((prev) => ({ ...prev, carImage: dataUrl }));
        toast.success("Bike photo added");
      } else {
        const urls = await Promise.all(Array.from(files).map(toDataUrl));
        setForm((prev) => ({
          ...prev,
          damageImages: [...(prev.damageImages || []), ...urls],
        }));
        toast.success(
          `${urls.length} photo${urls.length > 1 ? "s" : ""} added`,
        );
      }
    } catch {
      toast.error("Upload failed");
    }
  };

  const removeDamageImage = (index) =>
    setForm((prev) => ({
      ...prev,
      damageImages: prev.damageImages.filter((_, i) => i !== index),
    }));

  /* ========== SUBMIT ========== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const missing = [
      !form.fullName.trim() && "name",
      !form.phone.trim() && "phone",
      !form.vehicleMake.trim() && "make",
      !form.vehicleModel.trim() && "model",
      !form.regNumber && "registration number",
    ].filter(Boolean);
    if (missing.length) {
      toast.error(`Please fill: ${missing.join(", ")}`);
      return;
    }

    const payload = {
      ...form,
      regNumber: toCode(form.regNumber),
      vin: toCode(form.vin),
    };

    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/api/bikes/${id}`, payload);
        toast.success("Client updated");
      } else {
        await api.post("/api/bikes", payload);
        toast.success("Client added");
      }
      navigate("/bike-clients");
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err.response?.data?.message || "Failed to save client");
    } finally {
      setLoading(false);
    }
  };

  /* ========== STYLES ========== */
  const t = isDark
    ? {
        page: "bg-gray-900 text-gray-100",
        card: "bg-gray-800 border-gray-700",
        border: "border-gray-700",
        muted: "text-gray-400",
        input:
          "bg-gray-900 border-gray-600 text-gray-100 placeholder:text-gray-500 focus:border-blue-400 focus:ring-blue-400/20",
        btn2: "border-gray-600 text-gray-200 hover:bg-gray-700",
        tile: "border-gray-600 hover:border-blue-400",
        drop: "border-gray-600 bg-gray-900/40",
      }
    : {
        page: "bg-gray-50 text-gray-800",
        card: "bg-white border-gray-200",
        border: "border-gray-200",
        muted: "text-gray-500",
        input:
          "bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500/15",
        btn2: "border-gray-300 text-gray-700 hover:bg-gray-50",
        tile: "border-gray-200 hover:border-blue-500",
        drop: "border-gray-300 bg-gray-50",
      };
  const inputCls = `h-9 w-full rounded-md border px-3 text-[14px] outline-none transition focus:ring-2 ${t.input}`;
  const codeCls = `${inputCls} font-mono uppercase tracking-wide`;

  if (loadingClient) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${t.page}`}
      >
        <RotateCw className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const matchingBrands = bikeMakes
    .filter((b) => isBrandMatch(form.vehicleMake, b.make))
    .slice(0, 12);
  const modelMatches = bikeModels
    .filter((m) =>
      m.name.toLowerCase().includes(form.vehicleModel.toLowerCase()),
    )
    .slice(0, 10);
  const modelChosen = bikeModels.some(
    (m) => m.name.toLowerCase() === form.vehicleModel.toLowerCase(),
  );

  return (
    <div
      className={`min-h-screen px-3 py-4 text-[14px] sm:px-5 lg:px-8 ${t.page}`}
    >
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontSize: "14px" } }}
      />

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-4xl space-y-4 pb-20"
      >
        {/* Header */}
        <div>
          <button
            type="button"
            onClick={() => navigate("/bike-clients")}
            className={`mb-2 inline-flex items-center gap-1.5 text-[12px] font-medium ${t.muted} hover:text-blue-600`}
          >
            <ArrowLeft size={14} /> Back to clients
          </button>
          <h1 className="text-[16px] font-semibold">
            {isEdit ? "Edit client" : "Add new client"}
          </h1>
          <p className={`text-[12px] ${t.muted}`}>
            Fields marked * are required.
          </p>
        </div>

        {/* RC scan */}
        <div
          className={`flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-blue-500/20 bg-blue-500/10" : "border-blue-200 bg-blue-50"}`}
        >
          <div className="flex items-start gap-2.5">
            <Scan size={16} className="mt-0.5 shrink-0 text-blue-600" />
            <div>
              <p className="text-[14px] font-medium">
                Fill details from the RC
              </p>
              <p className={`text-[12px] ${t.muted}`}>
                Upload or photograph the registration certificate to auto-fill
                the form.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              disabled={isProcessingRC}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 text-[14px] font-medium text-white hover:bg-blue-700 disabled:opacity-60 sm:flex-none"
            >
              {isProcessingRC ? (
                <RotateCw size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              {isProcessingRC ? "Reading…" : "Upload RC"}
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current.click()}
              disabled={isProcessingRC}
              className={`inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border px-3 text-[14px] font-medium disabled:opacity-60 sm:flex-none ${t.btn2} ${isDark ? "" : "bg-white"}`}
            >
              <Camera size={14} /> Camera
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleRCFile}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleRCFile}
            className="hidden"
          />
        </div>

        {/* Customer */}
        <Section t={t} icon={User} title="Customer details">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field t={t} label="Full name" required>
              <input
                value={form.fullName}
                onChange={set("fullName")}
                className={inputCls}
                placeholder="Customer name"
                autoComplete="off"
              />
            </Field>
            <Field t={t} label="Phone number" required>
              <input
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    phone: e.target.value.replace(/[^\d+]/g, "").slice(0, 13),
                  }))
                }
                className={inputCls}
                placeholder="9876543210"
              />
            </Field>
            <Field t={t} label="Email">
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                className={inputCls}
                placeholder="name@example.com"
              />
            </Field>
            <Field t={t} label="Received by">
              <input
                value={form.receiverName}
                onChange={set("receiverName")}
                className={inputCls}
                placeholder="Staff name"
              />
            </Field>
            <Field t={t} label="Address" className="sm:col-span-2">
              <input
                value={form.address}
                onChange={set("address")}
                className={inputCls}
                placeholder="House, street, area, city"
              />
            </Field>
          </div>
        </Section>

        {/* Vehicle */}
        <Section t={t} icon={Bike} title="Bike details">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Make */}
            <Field
              t={t}
              label="Make / brand"
              required
              className="sm:col-span-2"
            >
              <div className="flex items-center gap-2">
                {selectedBikeMake?.logoUrl && (
                  <img
                    src={selectedBikeMake.logoUrl}
                    alt=""
                    className={`h-9 w-9 shrink-0 rounded-md border bg-white object-contain p-1 ${t.border}`}
                  />
                )}
                <input
                  value={form.vehicleMake}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      vehicleMake: e.target.value,
                    }));
                    setShowBrandList(true);
                    setBrandSelected(false);
                    setBikeModels([]);
                    setSelectedBikeMake(null);
                  }}
                  onFocus={() => !brandSelected && setShowBrandList(true)}
                  className={inputCls}
                  placeholder="Start typing, e.g. Honda"
                  autoComplete="off"
                />
                {brandSelected && (
                  <Check size={16} className="shrink-0 text-emerald-500" />
                )}
              </div>
            </Field>

            {showBrandList &&
              !brandSelected &&
              form.vehicleMake &&
              matchingBrands.length > 0 && (
                <div className="sm:col-span-2">
                  <p className={`mb-1.5 text-[12px] ${t.muted}`}>
                    Pick the brand
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {matchingBrands.map((brand) => (
                      <button
                        key={brand.slug}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            vehicleMake: brand.make,
                          }));
                          setSelectedBikeMake(brand);
                          setBrandSelected(true);
                          setShowBrandList(false);
                        }}
                        className={`rounded-md border p-2 text-center transition ${t.tile}`}
                      >
                        <img
                          src={brand.logoUrl}
                          alt=""
                          className="mx-auto mb-1 h-8 object-contain"
                        />
                        <p className="truncate text-[12px] font-medium">
                          {brand.make}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {/* Model */}
            <Field t={t} label="Model" required className="sm:col-span-2">
              <input
                value={form.vehicleModel}
                onChange={set("vehicleModel")}
                className={inputCls}
                placeholder={
                  bikeModels.length
                    ? "Pick below or type the model"
                    : "e.g. Activa 6G"
                }
                autoComplete="off"
              />
            </Field>

            {brandSelected &&
              bikeModels.length > 0 &&
              !modelChosen &&
              modelMatches.length > 0 && (
                <div className="sm:col-span-2">
                  <p className={`mb-1.5 text-[12px] ${t.muted}`}>
                    Pick the model
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {modelMatches.map((model) => (
                      <button
                        key={model.slug}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            vehicleModel: model.name,
                          }))
                        }
                        className={`rounded-md border p-2 text-center transition ${t.tile}`}
                      >
                        {model.thumbnailUrl && (
                          <img
                            src={model.thumbnailUrl}
                            alt=""
                            className="mx-auto mb-1 h-10 object-contain"
                          />
                        )}
                        <p className="truncate text-[12px] font-medium">
                          {model.name}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            <Field
              t={t}
              label="Registration number"
              required
              hint="Capital letters and numbers only, e.g. KA01AB1234"
            >
              <input
                value={form.regNumber}
                onChange={setCode("regNumber")}
                className={codeCls}
                placeholder="KA01AB1234"
                maxLength={15}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
              />
            </Field>
            <Field
              t={t}
              label="Chassis / VIN number"
              hint="Converted to capitals automatically"
            >
              <input
                value={form.vin}
                onChange={setCode("vin")}
                className={codeCls}
                placeholder="ME4JF502XKT123456"
                maxLength={25}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
              />
            </Field>

            <Field t={t} label="Year">
              <input
                type="number"
                min="1950"
                max={new Date().getFullYear() + 1}
                value={form.vehicleYear}
                onChange={set("vehicleYear")}
                className={inputCls}
                placeholder="2022"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field t={t} label="Colour">
                <input
                  value={form.color}
                  onChange={set("color")}
                  className={inputCls}
                  placeholder="Black"
                />
              </Field>
              <Field t={t} label="Fuel">
                <select
                  value={form.fuel}
                  onChange={set("fuel")}
                  className={inputCls}
                >
                  <option value="">Select</option>
                  <option value="Petrol">Petrol</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="CNG">CNG</option>
                </select>
              </Field>
            </div>
          </div>
        </Section>

        {/* Photos */}
        <Section
          t={t}
          icon={ImageIcon}
          title="Photos"
          subtitle="Bike photo and any damage / inspection pictures"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[260px_1fr]">
            {/* Main photo */}
            <div>
              <p className="mb-1 text-[12px] font-medium">Bike photo</p>
              <div
                className={`relative flex h-44 items-center justify-center overflow-hidden rounded-md border border-dashed ${t.drop}`}
              >
                {bikeImageLoading ? (
                  <div
                    className={`flex flex-col items-center text-[12px] ${t.muted}`}
                  >
                    <RotateCw
                      size={16}
                      className="mb-1 animate-spin text-blue-500"
                    />{" "}
                    Finding photo…
                  </div>
                ) : form.carImage ? (
                  <>
                    <img
                      src={form.carImage}
                      alt="Bike"
                      className="h-full w-full object-contain"
                    />
                    <div className="absolute bottom-2 right-2 flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => mainFileRef.current.click()}
                        className="inline-flex h-7 items-center gap-1 rounded-md bg-black/60 px-2 text-[12px] text-white hover:bg-black/75"
                      >
                        <Upload size={12} /> Replace
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, carImage: "" }))
                        }
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white hover:bg-rose-600"
                        title="Remove"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => mainFileRef.current.click()}
                    className={`flex flex-col items-center text-[12px] ${t.muted} hover:text-blue-600`}
                  >
                    <Upload size={18} className="mb-1" />
                    Upload bike photo
                    <span className="mt-0.5 opacity-75">
                      Added automatically when the model is found
                    </span>
                  </button>
                )}
              </div>
              <input
                ref={mainFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files, "main")}
              />
            </div>

            {/* Damage photos */}
            <div>
              <p className="mb-1 text-[12px] font-medium">
                Damage / inspection photos
              </p>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFiles(e.dataTransfer.files, "damage");
                }}
                onClick={() => damageFileRef.current.click()}
                className={`flex h-20 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed text-[12px] transition ${
                  dragOver
                    ? "border-blue-500 bg-blue-500/10 text-blue-600"
                    : `${t.drop} ${t.muted} hover:text-blue-600`
                }`}
              >
                <ImageIcon size={16} /> Drop photos here or click to choose
              </div>
              <input
                ref={damageFileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  handleFiles(e.target.files, "damage");
                  e.target.value = "";
                }}
                className="hidden"
              />

              {form.damageImages?.length > 0 && (
                <div className="mt-2.5 grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {form.damageImages.map((img, idx) => (
                    <div
                      key={idx}
                      className={`group relative aspect-square overflow-hidden rounded-md border ${t.border}`}
                    >
                      <img
                        src={img}
                        alt={`damage-${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeDamageImage(idx)}
                        className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded bg-black/60 text-white opacity-100 hover:bg-rose-600 sm:opacity-0 sm:group-hover:opacity-100"
                        title="Remove"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* Notes */}
        <Section t={t} icon={FileText} title="Notes">
          <textarea
            value={form.notes}
            onChange={set("notes")}
            rows={3}
            placeholder="Anything worth remembering about this customer or bike"
            className={`w-full resize-none rounded-md border px-3 py-2 text-[14px] outline-none transition focus:ring-2 ${t.input}`}
          />
        </Section>

        {/* Sticky action bar */}
        <div
          className={`fixed inset-x-0 bottom-0 z-30 border-t px-3 py-2.5 backdrop-blur sm:px-5 ${isDark ? "border-gray-700 bg-gray-900/90" : "border-gray-200 bg-white/90"}`}
        >
          <div className="mx-auto flex max-w-4xl justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate("/bike-clients")}
              className={`h-9 rounded-md border px-4 text-[14px] font-medium ${t.btn2}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-4 text-[14px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <RotateCw size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {loading ? "Saving…" : isEdit ? "Save changes" : "Save client"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ---------- layout helpers (outside the component so inputs keep focus) ---------- */
function Field({ t, label, required, hint, className = "", children }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-[12px] font-medium">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className={`mt-1 text-[12px] ${t.muted}`}>{hint}</p>}
    </div>
  );
}

function Section({ t, icon: Icon, title, subtitle, children, right }) {
  return (
    <section className={`rounded-lg border ${t.card}`}>
      <div
        className={`flex items-start justify-between gap-3 border-b px-4 py-3 sm:px-5 ${t.border}`}
      >
        <div className="flex items-start gap-2.5">
          <Icon size={16} className="mt-0.5 text-blue-600" />
          <div>
            <h2 className="text-[14px] font-semibold">{title}</h2>
            {subtitle && <p className={`text-[12px] ${t.muted}`}>{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
