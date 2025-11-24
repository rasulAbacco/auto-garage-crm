// ClientForm.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FiSave, FiX, FiEye, FiEyeOff, FiCamera } from "react-icons/fi";
import { Toaster, toast } from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";
import PersonalInfoSection from "./components/PersonalInfoSection";
import VehicleInfoSection from "./components/VehicleInfoSection";
import ImageUploader from "./components/ImageUploader";
import { processImage } from "../details/utils/OCRProcessor.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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
  notes: "",
  carImage: "",
  adImage: "",
  damageImages: [],
};

export default function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);
  const [loadingClient, setLoadingClient] = useState(false);
  const [isProcessingRC, setIsProcessingRC] = useState(false);
  const [isImageUploaded, setIsImageUploaded] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // ========== GET EXISTING CLIENT IF EDIT MODE ==========
  useEffect(() => {
    if (location?.state?.clientData) {
      const c = location.state.clientData;
      setForm({
        ...EMPTY_FORM,
        ...c,
        receiverName: c.receiverName ?? c.staffPerson ?? "",
        damageImages: Array.isArray(c.damageImages) ? c.damageImages : [],
      });
      setIsImageUploaded(!!c.carImage);
      return;
    }

    if (!id) return;

    const fetchClient = async () => {
      try {
        setLoadingClient(true);
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");

        const res = await fetch(`${API_BASE}/api/clients/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let body;
        try {
          body = await res.json();
        } catch (err) {
          body = await res.text();
        }

        if (res.status === 401) {
          localStorage.removeItem("token");
          return navigate("/login");
        }

        if (!res.ok) throw new Error(body?.message || "Failed to load client");

        const data = body || {};
        setForm({
          ...EMPTY_FORM,
          ...data,
          receiverName: data.receiverName ?? data.staffPerson ?? "",
          damageImages: Array.isArray(data.damageImages)
            ? data.damageImages
            : [],
        });
        setIsImageUploaded(!!data.carImage);
      } catch (err) {
        toast.error(err.message || "Failed to load client");
      } finally {
        setLoadingClient(false);
      }
    };
    fetchClient();
  }, [id, location?.state]);

  // ========== OCR AUTOFILL ==========
  const normalizeReg = (s = "") =>
    String(s).toUpperCase().replace(/[^A-Z0-9]/g, "");

  const mapOcrToForm = (parsed = {}) => {
    const mapped = {};

    const get = (keys) => {
      for (let k of keys) {
        if (parsed[k]) return parsed[k];
        const found = Object.keys(parsed).find((p) =>
          p.toLowerCase().includes(k.toLowerCase())
        );
        if (found) return parsed[found];
      }
      return "";
    };

    const reg = get(["reg", "regno", "registration"]);
    if (reg) mapped.regNumber = normalizeReg(reg);

    const owner = get(["owner", "owner name"]);
    if (owner) mapped.fullName = owner;

    const address = get(["address"]);
    if (address) mapped.address = address;

    const vin = get(["vin", "chassis"]);
    if (vin) mapped.vin = vin.replace(/\s+/g, "").toUpperCase();

    const maker = get(["maker", "make", "manufacturer", "mfr"]);
    if (maker) mapped.vehicleMake = maker;

    const model = get(["model", "variant"]);
    if (model) mapped.vehicleModel = model;

    const yearCand = get(["mfg", "year"]);
    if (yearCand) {
      const y = yearCand.match(/\b(19|20)\d{2}\b/);
      if (y) mapped.vehicleYear = y[0];
    }

    const color = get(["color", "colour"]);
    if (color) mapped.color = color;

    const fuel = get(["fuel"]);
    if (fuel) mapped.fuel = fuel;

    return mapped;
  };

  const handleScanButtonClick = () => {
    if (navigator.mediaDevices?.getUserMedia) cameraInputRef.current.click();
    else fileInputRef.current.click();
  };

  const handleRCFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingRC(true);
    try {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        URL.revokeObjectURL(objectUrl);

        const ocr = await processImage(dataUrl);
        const parsed = ocr?.parsed || {};
        const mapped = mapOcrToForm(parsed);

        setForm((prev) => ({ ...prev, ...mapped }));
        toast.success("RC scanned — auto-filled form!");
      };

      img.src = objectUrl;
    } catch (err) {
      toast.error("Failed to scan RC. Try again.");
    } finally {
      setIsProcessingRC(false);
      e.target.value = "";
    }
  };

  // ========== SAVE CLIENT ==========
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const payload = {
        fullName: form.fullName || "",
        phone: form.phone || "",
        email: form.email || "",
        address: form.address || "",
        vehicleMake: form.vehicleMake || "",
        vehicleModel: form.vehicleModel || "",
        vehicleYear: form.vehicleYear || "",
        regNumber: form.regNumber || "",
        vin: form.vin || "",
        color: form.color || "",
        fuel: form.fuel || "",
        notes: form.notes || "",

        // ⭐ ADDED: now images will save correctly
        carImage: form.carImage || "",
        adImage: form.adImage || "",
        damageImages: form.damageImages || [],
      };

      const res = await fetch(`${API_BASE}/api/clients${id ? `/${id}` : ""}`, {
        method: id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      let body;
      try { body = await res.json(); } catch { }

      if (!res.ok) throw new Error(body?.message || "Save failed");

      toast.success("Client saved!");
      navigate("/clients");

    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };


  const handleCancel = () => navigate("/clients");

  // ========== UI ==========
  return (
  <div
    className={`min-h-screen p-6 lg:ml-16 ${
      isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
    }`}
  >
    <Toaster position="top-right" />

    <form
      onSubmit={handleSubmit}
      className={`max-w-5xl mx-auto space-y-8 ${
        isDark ? "text-gray-100" : "text-gray-900"
      }`}
    >
      {/* Hidden Inputs */}
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

      {/* Header */}
      <div
        className={`rounded-3xl p-8 shadow-lg flex items-center justify-between ${
          isDark ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div>
          <h1 className="text-3xl font-bold">
            {id ? "Edit Client" : "New Client"}
          </h1>
          <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Manage customer & vehicle details
          </p>
        </div>

        <button
          type="button"
          onClick={handleScanButtonClick}
          disabled={isProcessingRC}
          className={`px-5 py-3 rounded-xl flex items-center gap-2 text-white shadow-md ${
            isDark
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-indigo-500 hover:bg-indigo-600"
          }`}
        >
          <FiCamera />
          {isProcessingRC ? "Scanning..." : "Scan RC"}
        </button>
      </div>

      {/* Personal Information */}
      <div
        className={`rounded-3xl p-8 shadow-lg ${
          isDark ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
        <PersonalInfoSection form={form} setForm={setForm} isDark={isDark} />
      </div>

      {/* Vehicle Information */}
      <div
        className={`rounded-3xl p-8 shadow-lg ${
          isDark ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h2 className="text-xl font-semibold mb-4">Vehicle Information</h2>
        <VehicleInfoSection form={form} setForm={setForm} isDark={isDark} />
      </div>

      {/* Vehicle Images */}
      <div
        className={`rounded-3xl p-8 shadow-lg ${
          isDark ? "bg-gray-800" : "bg-white"
        }`}
      >
        <h2 className="text-xl font-semibold mb-4">Vehicle Images</h2>
        <ImageUploader
          form={form}
          setForm={setForm}
          isDark={isDark}
          isImageUploaded={isImageUploaded}
          setIsImageUploaded={setIsImageUploaded}
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={handleCancel}
          className={`px-6 py-3 rounded-xl font-medium shadow ${
            isDark
              ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          <FiX className="inline-block mr-1" />
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-3 rounded-xl flex items-center gap-2 text-white font-semibold shadow ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : isDark
              ? "bg-green-600 hover:bg-green-700"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          <FiSave />
          {loading ? "Saving..." : "Save Client"}
        </button>
      </div>
    </form>
  </div>
);

}
