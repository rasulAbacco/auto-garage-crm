// client/src/pages/clients/components/VehicleInfoSection.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  FiCalendar,
  FiHash,
  FiDroplet,
  FiUsers,
  FiCheck,
  FiEdit3,
  FiList,
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";
import {
  SectionCard,
  TextField,
  SelectField,
  FieldLabel,
  tk,
  toCode,
} from "./clientUi";

export default function VehicleInfoSection({
  form,
  setForm,
  isDark,
  userPlan = "BASIC",
  carMakes = [],
  carModels = [],
  fetchCarModels,
  fuelTypes = [],
  seatOptions = [],
}) {
  const t = tk(isDark);
  const isBasic = userPlan === "BASIC";
  const [brandInput, setBrandInput] = useState(form.vehicleMake || "");
  const [brandFocus, setBrandFocus] = useState(false);
  const [useCustomModel, setUseCustomModel] = useState(false);

  // keep local input in sync with form (RC scan + edit mode)
  useEffect(() => {
    setBrandInput(form.vehicleMake || "");
  }, [form.vehicleMake]);

  // switch to custom input if the saved model isn't in the list
  useEffect(() => {
    if (
      form.vehicleModel &&
      carModels.length > 0 &&
      !carModels.some((m) => m.name === form.vehicleModel)
    ) {
      setUseCustomModel(true);
    }
  }, [form.vehicleModel, carModels]);

  const filteredMakes = useMemo(() => {
    if (isBasic || brandInput.trim().length < 2) return [];
    const q = brandInput.toLowerCase();
    return (carMakes || [])
      .filter((m) => m.make.toLowerCase().includes(q))
      .slice(0, 12);
  }, [brandInput, carMakes, isBasic]);

  const exactMake = carMakes.some(
    (m) => m.make.toLowerCase() === brandInput.trim().toLowerCase(),
  );
  const showMakes = filteredMakes.length > 0 && (brandFocus || !exactMake);

  const handleBrandSelect = (m) => {
    setBrandInput(m.make);
    setForm((prev) => ({ ...prev, vehicleMake: m.make, vehicleModel: "" }));
    setUseCustomModel(false);
    fetchCarModels?.(m.make);
  };

  const handleModelSelect = (name) => {
    setUseCustomModel(false);
    setForm((prev) => ({ ...prev, vehicleModel: name }));
  };

  const set =
    (key, fn = (v) => v) =>
    (e) => {
      const v = fn(e.target.value);
      setForm((prev) => ({ ...prev, [key]: v }));
    };

  return (
    <SectionCard
      isDark={isDark}
      icon={FaCar}
      step="03"
      title="Vehicle information"
      subtitle="Make, model and registration"
    >
      <div className="space-y-5">
        {/* make + model */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField
            isDark={isDark}
            icon={<FaCar size={12} />}
            label="Vehicle make"
            required
            value={brandInput}
            onChange={(e) => {
              setBrandInput(e.target.value);
              setForm((prev) => ({ ...prev, vehicleMake: e.target.value }));
            }}
            onFocus={() => setBrandFocus(true)}
            onBlur={() => setTimeout(() => setBrandFocus(false), 150)}
            placeholder={
              isBasic ? "e.g. Maruti Suzuki" : "Start typing a brand…"
            }
            autoComplete="off"
          />

          {isBasic ? (
            <TextField
              isDark={isDark}
              icon={<FaCar size={12} />}
              label="Vehicle model"
              required
              value={form.vehicleModel || ""}
              onChange={set("vehicleModel")}
              placeholder="e.g. Swift"
            />
          ) : (
            <div>
              <div className="flex items-end justify-between gap-2">
                <FieldLabel
                  icon={<FaCar size={12} />}
                  label="Vehicle model"
                  required
                  isDark={isDark}
                />
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomModel((c) => !c);
                    setForm((prev) => ({ ...prev, vehicleModel: "" }));
                  }}
                  className={`mb-1.5 inline-flex items-center gap-1 text-[12px] font-bold ${isDark ? "text-blue-300" : "text-blue-600"} hover:underline`}
                >
                  {useCustomModel ? (
                    <FiList size={12} />
                  ) : (
                    <FiEdit3 size={12} />
                  )}
                  {useCustomModel ? "Pick from list" : "Type custom"}
                </button>
              </div>
              {useCustomModel || carModels.length === 0 ? (
                <TextField
                  isDark={isDark}
                  required
                  value={form.vehicleModel || ""}
                  onChange={set("vehicleModel")}
                  placeholder={
                    carModels.length
                      ? "Enter custom model name"
                      : "Choose a make first, or type a model"
                  }
                />
              ) : (
                <SelectField
                  isDark={isDark}
                  required
                  value={form.vehicleModel || ""}
                  onChange={(e) => handleModelSelect(e.target.value)}
                  options={carModels.map((m) => ({
                    label: m.name,
                    value: m.name,
                  }))}
                  placeholder="Select model"
                />
              )}
            </div>
          )}
        </div>

        {/* brand logo cards */}
        {!isBasic && showMakes && (
          <div>
            <p
              className={`mb-2 text-[12px] font-bold uppercase tracking-wider ${t.muted}`}
            >
              Select make
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {filteredMakes.map((m) => {
                const on = form.vehicleMake === m.make;
                return (
                  <button
                    type="button"
                    key={m.make}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleBrandSelect(m)}
                    className={`relative flex flex-col items-center justify-center rounded-xl border-2 p-2 transition ${
                      on
                        ? isDark
                          ? "border-white bg-white/10"
                          : "border-[#001F3F] bg-[#001F3F]/5"
                        : `${t.inner} hover:border-slate-400`
                    }`}
                  >
                    {m.logoUrl ? (
                      <img
                        src={m.logoUrl}
                        alt=""
                        className="mb-1 h-9 w-full object-contain"
                      />
                    ) : (
                      <FaCar className="mb-1 h-9 text-slate-400" />
                    )}
                    <span
                      className={`w-full truncate text-center text-[12px] font-bold ${t.heading}`}
                    >
                      {m.make}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* model thumbnails */}
        {!isBasic && carModels.length > 0 && !useCustomModel && (
          <div>
            <p
              className={`mb-2 text-[12px] font-bold uppercase tracking-wider ${t.muted}`}
            >
              Choose model{" "}
              <span className="normal-case tracking-normal">
                ({carModels.length})
              </span>
            </p>
            <div className="grid max-h-[340px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {carModels.map((m) => {
                const on = form.vehicleModel === m.name;
                return (
                  <button
                    type="button"
                    key={m.id || m.name}
                    onClick={() => handleModelSelect(m.name)}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`relative flex flex-col items-center rounded-xl border-2 p-2 transition ${
                      on
                        ? isDark
                          ? "border-white bg-white/10"
                          : "border-[#001F3F] bg-[#001F3F]/5 shadow-md"
                        : `${t.inner} hover:border-slate-400`
                    }`}
                  >
                    {on && (
                      <span
                        className={`absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full ${t.chipNavy}`}
                      >
                        <FiCheck size={12} />
                      </span>
                    )}
                    <div className="flex aspect-video w-full items-center justify-center overflow-hidden">
                      {m.thumbnailUrl ? (
                        <img
                          src={m.thumbnailUrl}
                          alt={m.name}
                          className="h-full w-full object-contain"
                          draggable="false"
                        />
                      ) : (
                        <FaCar className="text-slate-400" size={22} />
                      )}
                    </div>
                    <span
                      className={`mt-1 w-full truncate text-center text-[12px] font-bold ${t.heading}`}
                    >
                      {m.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* registration + specs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            isDark={isDark}
            icon={<FiHash size={12} />}
            label="Registration number"
            required
            value={form.regNumber || ""}
            onChange={set("regNumber", toCode)}
            placeholder="KA01AB1234"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={12}
            inputClassName="font-mono uppercase tracking-wider"
          />
          <TextField
            isDark={isDark}
            icon={<FiCalendar size={12} />}
            label="Year"
            type="number"
            inputMode="numeric"
            value={form.vehicleYear || ""}
            onChange={set("vehicleYear")}
            placeholder={String(new Date().getFullYear())}
            min="1980"
            max={new Date().getFullYear() + 1}
          />
          <SelectField
            isDark={isDark}
            icon={<FiDroplet size={12} />}
            label="Fuel type"
            value={form.fuel || ""}
            onChange={set("fuel")}
            options={[
              ...new Set([
                ...(fuelTypes || []),
                ...(form.fuel ? [form.fuel] : []),
              ]),
            ].map((v) => ({ label: v, value: v }))}
          />
          <SelectField
            isDark={isDark}
            icon={<FiUsers size={12} />}
            label="Seats"
            value={form.seats ? String(form.seats) : ""}
            onChange={set("seats")}
            options={[
              ...new Set([
                ...(seatOptions || []).map(String),
                ...(form.seats ? [String(form.seats)] : []),
              ]),
            ].map((v) => ({
              label: v,
              value: v,
            }))}
          />
          <TextField
            isDark={isDark}
            icon={<FiDroplet size={12} />}
            label="Colour"
            value={form.color || ""}
            onChange={set("color")}
            placeholder="e.g. Pearl White"
          />
          <TextField
            isDark={isDark}
            icon={<FiHash size={12} />}
            label="VIN / Chassis number"
            value={form.vin || ""}
            onChange={set("vin", toCode)}
            placeholder="MA1TA1234XYZ56789"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            maxLength={20}
            inputClassName="font-mono uppercase tracking-wider"
          />
        </div>
      </div>
    </SectionCard>
  );
}
