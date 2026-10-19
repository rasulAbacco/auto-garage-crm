// client/src/pages/details/components/OCRResults.jsx
// Works on DetailsPage (parent passes edit state) and on ClientDetail (only parsedData/rawOcrText/onSave).
import React, { useEffect, useState } from "react";
import {
  FiEdit,
  FiSave,
  FiX,
  FiLoader,
  FiZap,
  FiTruck,
  FiSettings,
  FiCalendar,
  FiUser,
  FiChevronDown,
} from "react-icons/fi";
import { tk, btnBase } from "../../clients/components/clientUi";

const FIELD_LABELS = {
  regNo: "Registration number",
  regDate: "Registration date",
  chassisNo: "Chassis number",
  engineNo: "Engine number",
  maker: "Maker",
  model: "Model",
  variant: "Variant",
  vehicleClass: "Vehicle class",
  bodyType: "Body type",
  color: "Colour",
  fuelType: "Fuel type",
  wheelBase: "Wheel base",
  mfgDate: "MFG date",
  seatingCapacity: "Seating capacity",
  noOfCyl: "No. of cylinders",
  unladenWt: "Unladen weight",
  cc: "CC",
  regFcUpto: "Reg / FC valid upto",
  fitUpto: "Fitness valid upto",
  insuranceUpto: "Insurance valid upto",
  taxUpto: "Tax valid upto",
  ownerName: "Owner name",
  swdOf: "S/W/D of",
  address: "Address",
};

// label used for the raw-text fallback search
const FALLBACK_LABEL = {
  ...FIELD_LABELS,
  maker: "Maker (Manufacturer)",
  cc: "CC (Cubic Capacity)",
  noOfCyl: "No. of Cylinders",
};

const GROUPS = [
  {
    title: "Vehicle identification",
    icon: FiTruck,
    keys: [
      "regNo",
      "regDate",
      "chassisNo",
      "engineNo",
      "maker",
      "model",
      "variant",
    ],
  },
  {
    title: "Specifications",
    icon: FiSettings,
    keys: [
      "vehicleClass",
      "bodyType",
      "color",
      "fuelType",
      "wheelBase",
      "mfgDate",
      "seatingCapacity",
      "noOfCyl",
      "unladenWt",
      "cc",
    ],
  },
  {
    title: "Registration & validity",
    icon: FiCalendar,
    keys: ["regFcUpto", "fitUpto", "insuranceUpto", "taxUpto"],
  },
  { title: "Ownership", icon: FiUser, keys: ["ownerName", "swdOf", "address"] },
];
const MONO = new Set(["regNo", "chassisNo", "engineNo"]);

const OCRResults = ({
  isDark,
  parsedData,
  rawOcrText,
  isEditing: isEditingProp,
  setIsEditing: setIsEditingProp,
  editedData: editedDataProp,
  setEditedData: setEditedDataProp,
  onSave,
}) => {
  const t = tk(isDark);

  // fall back to local state when the parent doesn't control editing
  const [localEditing, setLocalEditing] = useState(false);
  const [localEdited, setLocalEdited] = useState({});
  const isEditing = isEditingProp ?? localEditing;
  const setIsEditing = setIsEditingProp || setLocalEditing;
  const editedData = editedDataProp ?? localEdited;
  const setEditedData = setEditedDataProp || setLocalEdited;

  const [isSaving, setIsSaving] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const fallback = (label) => {
    if (!rawOcrText) return "";
    const pattern = new RegExp(
      `${label.replace(/[^A-Z0-9]/gi, ".{0,2}")}[:\\s.-]*([A-Z0-9/.,() &-]+)`,
      "i",
    );
    const m = rawOcrText.toUpperCase().match(pattern);
    return m ? m[1].trim() : "";
  };

  // seed the editable copy
  useEffect(() => {
    if (parsedData && Object.values(parsedData).some(Boolean)) {
      setEditedData({ ...parsedData });
    } else if (rawOcrText) {
      const extracted = {};
      Object.keys(FIELD_LABELS).forEach(
        (k) => (extracted[k] = fallback(FALLBACK_LABEL[k])),
      );
      setEditedData(extracted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedData, rawOcrText]);

  const handleAutoFill = () => {
    const next = { ...editedData };
    let filled = 0;
    Object.keys(FIELD_LABELS).forEach((k) => {
      if (!String(next[k] || "").trim()) {
        const v = fallback(FALLBACK_LABEL[k]);
        if (v) {
          next[k] = v;
          filled += 1;
        }
      }
    });
    setEditedData(next);
    if (filled) setIsEditing(true);
  };

  const handleSaveClick = async () => {
    try {
      setIsSaving(true);
      await onSave?.({ ...(parsedData || {}), ...editedData });
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const data = { ...(parsedData || {}), ...editedData };
  const total = Object.keys(FIELD_LABELS).length;
  const found = Object.keys(FIELD_LABELS).filter((k) =>
    String(data[k] || "").trim(),
  ).length;

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`text-[14px] font-black ${t.heading}`}>
            {found} of {total} fields found
          </p>
          <div
            className={`mt-1 h-1.5 w-48 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}
          >
            <div
              className="h-full rounded-full bg-green-500"
              style={{ width: `${(found / total) * 100}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex">
          <button
            type="button"
            onClick={handleAutoFill}
            className={`${btnBase} h-10 border-2 px-3 ${t.btnGhost}`}
            title="Fill empty fields from the raw text"
          >
            <FiZap size={14} /> Auto-fill
          </button>
          {isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className={`${btnBase} h-10 border-2 px-3 ${t.btnGhost}`}
            >
              <FiX size={14} /> Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className={`${btnBase} h-10 border-2 px-3 ${t.btnGhost}`}
            >
              <FiEdit size={14} /> Edit
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving}
            className={`${btnBase} h-10 px-4 ${t.btnPrimary} shadow-lg`}
          >
            {isSaving ? (
              <FiLoader size={14} className="animate-spin" />
            ) : (
              <FiSave size={14} />
            )}
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* groups */}
      {GROUPS.map(({ title, icon: Icon, keys }) => (
        <div key={title}>
          <div className="mb-2 flex items-center gap-2">
            <Icon size={12} className={t.heading} />
            <h4
              className={`text-[12px] font-black uppercase tracking-[0.2em] ${t.heading}`}
            >
              {title}
            </h4>
            <div
              className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-[#CBD5E1]"}`}
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {keys.map((key) => {
              const val = data[key];
              const wide = key === "address";
              return (
                <div
                  key={key}
                  className={`rounded-xl border-2 p-2.5 ${t.inner} ${wide ? "sm:col-span-2 xl:col-span-3" : ""}`}
                >
                  <label className="mb-1 block text-[12px] font-bold uppercase tracking-wider text-slate-400">
                    {FIELD_LABELS[key]}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData?.[key] ?? ""}
                      onChange={(e) =>
                        setEditedData((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      placeholder="Not found — type it"
                      className={`h-9 w-full rounded-lg border-2 px-2.5 text-[14px] font-semibold outline-none transition ${t.input} ${MONO.has(key) ? "font-mono uppercase" : ""}`}
                    />
                  ) : (
                    <p
                      className={`break-words text-[14px] font-bold ${val ? t.heading : "italic text-slate-400"} ${MONO.has(key) && val ? "font-mono" : ""}`}
                    >
                      {val || "Not found"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* raw text */}
      {rawOcrText && (
        <div className={`rounded-xl border-2 ${t.inner}`}>
          <button
            type="button"
            onClick={() => setShowRaw((s) => !s)}
            className="flex w-full items-center justify-between px-3 py-2.5"
          >
            <span
              className={`text-[12px] font-black uppercase tracking-[0.2em] ${t.heading}`}
            >
              Raw OCR text
            </span>
            <FiChevronDown
              size={14}
              className={`text-slate-400 transition-transform ${showRaw ? "rotate-180" : ""}`}
            />
          </button>
          {showRaw && (
            <pre
              className={`max-h-60 overflow-auto whitespace-pre-wrap border-t-2 px-3 py-2.5 text-[12px] ${t.line} ${t.body}`}
            >
              {rawOcrText}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default OCRResults;
