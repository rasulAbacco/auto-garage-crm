import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";
import {
  FiTag,
  FiChevronDown,
  FiImage,
  FiSave,
  FiInfo,
  FiSearch,
  FiUpload,
  FiRefreshCw,
  FiGrid,
  FiX,
  FiAlertCircle,
} from "react-icons/fi";
import {
  tk,
  btnBase,
  PageHeading,
  CrmChip,
  StatTile,
  Switch,
  LivePill,
  EmptyState,
  ErrorBar,
  SkeletonCards,
  detectCrmType,
  pageWrap,
  inr,
  errText,
} from "./marketplaceUi";

const API_URL = import.meta.env.VITE_API_BASE_URL ?? "";

// Vehicle groups per business type
const SEGMENT_SCHEMAS = {
  CAR: ["SEDAN", "SUV", "HATCHBACK", "SUV_COUPE", "MPV", "LUXURY"],
  BIKE: ["COMMUTER", "SPORTS", "CRUISER", "SUPERBIKE"],
  WASHING: ["STANDARD_VEHICLE", "PREMIUM_VEHICLE"],
};

const VARIANT_LABELS = {
  SEDAN: "Sedan",
  SUV: "SUV",
  HATCHBACK: "Hatchback",
  SUV_COUPE: "SUV Coupe",
  MPV: "MPV",
  LUXURY: "Luxury sedan / sports car",
  COMMUTER: "Commuter (under 150cc)",
  SPORTS: "Sports bike (150–400cc)",
  CRUISER: "Cruiser / tourer",
  SUPERBIKE: "Superbike (600cc+)",
  STANDARD_VEHICLE: "Standard (hatch / sedan)",
  PREMIUM_VEHICLE: "Premium / large (SUV / luxury)",
};

export default function MarketplacePricing() {
  const { isDark } = useTheme();
  const t = tk(isDark);
  const currentCrmType = useMemo(() => detectCrmType(), []);
  const activeSegments = SEGMENT_SCHEMAS[currentCrmType] || SEGMENT_SCHEMAS.CAR;

  const [hierarchy, setHierarchy] = useState([]);
  const [garageServices, setGarageServices] = useState([]);
  const [localDetails, setLocalDetails] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [dirty, setDirty] = useState({}); // services with unsaved price / on-off changes
  const [search, setSearch] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const dirtyRef = useRef({});
  dirtyRef.current = dirty;

  const fetchData = useCallback(
    async (quiet = false) => {
      quiet ? setRefreshing(true) : setLoading(true);
      setLoadError("");
      try {
        const cfg = {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          params: { vehicleType: currentCrmType.toLowerCase() },
        };
        const [hRes, gRes] = await Promise.all([
          axios.get(`${API_URL}/api/marketplace/services`, cfg),
          axios.get(`${API_URL}/api/marketplace/garage-services`, cfg),
        ]);
        setHierarchy(Array.isArray(hRes.data?.data) ? hRes.data.data : []);
        const server = Array.isArray(gRes.data?.data) ? gRes.data.data : [];
        // keep unsaved edits on other services when the list reloads
        setGarageServices((prev) => {
          const keep = prev.filter(
            (gs) => dirtyRef.current[gs.service?.externalServiceId],
          );
          const keepIds = new Set(
            keep.map((gs) => gs.service?.externalServiceId),
          );
          return [
            ...server.filter(
              (gs) => !keepIds.has(gs.service?.externalServiceId),
            ),
            ...keep,
          ];
        });
      } catch (e) {
        console.error("Pricing load failed:", e);
        setLoadError(errText(e, "Could not load your service catalog"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentCrmType],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getGarageData = (externalId) =>
    garageServices.find(
      (gs) => gs.service?.externalServiceId === externalId,
    ) || {
      isActive: false,
      pricing: [],
      description: null,
      image: null,
      service: { externalServiceId: externalId },
    };

  const markDirty = (id, v = true) => {
    dirtyRef.current = { ...dirtyRef.current, [id]: v };
    setDirty((p) => ({ ...p, [id]: v }));
  };

  const handleToggle = (externalId, isActive) => {
    markDirty(externalId);
    setExpanded((p) => (isActive ? { ...p, [externalId]: true } : p));
    setGarageServices((prev) => {
      const exists = prev.some(
        (gs) => gs.service?.externalServiceId === externalId,
      );
      if (exists)
        return prev.map((gs) =>
          gs.service?.externalServiceId === externalId
            ? { ...gs, isActive }
            : gs,
        );
      return [
        ...prev,
        { isActive, pricing: [], service: { externalServiceId: externalId } },
      ];
    });
  };

  const handlePriceChange = (externalId, vehicleVariant, field, value) => {
    markDirty(externalId);
    setGarageServices((prev) => {
      const gsIndex = prev.findIndex(
        (gs) => gs.service?.externalServiceId === externalId,
      );
      const newRow = {
        carType: vehicleVariant,
        price: field === "price" ? value : 0,
        discount: field === "discount" ? value : 0,
        [field]: value,
      };
      if (gsIndex > -1) {
        const next = [...prev];
        const target = { ...next[gsIndex] };
        const pricing = [...(target.pricing || [])];
        const pIndex = pricing.findIndex((p) => p.carType === vehicleVariant);
        if (pIndex > -1)
          pricing[pIndex] = { ...pricing[pIndex], [field]: value };
        else pricing.push(newRow);
        target.pricing = pricing;
        next[gsIndex] = target;
        return next;
      }
      return [
        ...prev,
        {
          isActive: false,
          service: { externalServiceId: externalId },
          pricing: [newRow],
        },
      ];
    });
  };

  const savePricing = async (externalId) => {
    const data = getGarageData(externalId);
    setActionLoading((p) => ({ ...p, [externalId]: "pricing" }));
    try {
      await axios.post(
        `${API_URL}/api/marketplace/garage-services`,
        {
          serviceId: data.service?.externalServiceId || externalId,
          isActive: data.isActive,
          pricing: (data.pricing || []).map((p) => ({
            carType: p.carType,
            price: parseFloat(p.price) || 0,
            discount: parseFloat(p.discount) || 0,
          })),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      toast.success("Prices saved");
      markDirty(externalId, false);
      fetchData(true);
    } catch (e) {
      toast.error(errText(e, "Could not save prices"));
    } finally {
      setActionLoading((p) => ({ ...p, [externalId]: null }));
    }
  };

  const saveDetails = async (externalId, fallbackDesc) => {
    const data = getGarageData(externalId);
    const detail = localDetails[externalId];
    setActionLoading((p) => ({ ...p, [externalId]: "details" }));
    const fd = new FormData();
    fd.append("description", detail?.description || fallbackDesc || "");
    if (detail?.imageFile) fd.append("image", detail.imageFile);
    fd.append("isActive", data.isActive);
    fd.append("pricing", JSON.stringify(data.pricing || []));

    try {
      await axios.patch(
        `${API_URL}/api/marketplace/services/${data.service?.externalServiceId || externalId}/details`,
        fd,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );
      toast.success("Description & photo saved");
      setLocalDetails((p) => {
        const next = { ...p };
        delete next[externalId];
        return next;
      });
      fetchData(true);
    } catch (e) {
      toast.error(errText(e, "Could not save description & photo"));
    } finally {
      setActionLoading((p) => ({ ...p, [externalId]: null }));
    }
  };

  /* ---------- derived ---------- */
  const allServices = useMemo(
    () =>
      hierarchy.flatMap((m) =>
        (m.sections || []).flatMap((s) => s.services || []),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hierarchy],
  );
  const activeCount = allServices.filter(
    (s) => getGarageData(s.id).isActive,
  ).length;
  const dirtyCount = Object.values(dirty).filter(Boolean).length;

  const q = search.trim().toLowerCase();
  const showService = (svc) =>
    (!q ||
      String(svc.name || "")
        .toLowerCase()
        .includes(q)) &&
    (!onlyActive || getGarageData(svc.id).isActive);

  const fromPrice = (gData) => {
    const prices = (gData.pricing || [])
      .map((p) => parseFloat(p.price))
      .filter((n) => n > 0);
    return prices.length ? Math.min(...prices) : null;
  };

  const inputCls = `h-10 w-full rounded-xl border-2 px-3 text-[14px] font-semibold outline-none transition ${t.input}`;
  const labelCls =
    "text-[12px] font-bold uppercase tracking-wider text-slate-400";

  return (
    <div className={pageWrap(currentCrmType)}>
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontSize: 14 } }}
      />
      <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-5">
        <PageHeading
          isDark={isDark}
          title="Service"
          accent="pricing."
          subtitle="Switch on the services you offer in the MotorDesk app and set a price for each vehicle type."
          right={
            <>
              <CrmChip crmType={currentCrmType} isDark={isDark} />
              <button
                type="button"
                onClick={() => fetchData(true)}
                aria-label="Refresh"
                title="Refresh"
                className={`${btnBase} h-10 w-10 border-2 ${t.btnGhost}`}
              >
                <FiRefreshCw
                  size={14}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>
            </>
          }
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatTile
            isDark={isDark}
            title="Services in catalog"
            value={allServices.length}
            icon={FiGrid}
          />
          <StatTile
            isDark={isDark}
            title="Live in app"
            value={activeCount}
            icon={FiTag}
            chip="bg-green-500/10 text-green-600"
          />
          <StatTile
            isDark={isDark}
            className="col-span-2 lg:col-span-1"
            title="Unsaved changes"
            value={
              dirtyCount
                ? `${dirtyCount} service${dirtyCount === 1 ? "" : "s"}`
                : "All saved"
            }
            icon={FiSave}
            chip={
              dirtyCount
                ? "bg-amber-500/10 text-amber-600"
                : "bg-slate-500/10 text-slate-500"
            }
          />
        </div>

        <ErrorBar message={loadError} onRetry={() => fetchData()} />

        {/* toolbar */}
        <div
          className={`flex flex-col gap-2 rounded-2xl border-2 p-3 sm:flex-row sm:items-center ${t.card}`}
        >
          <div className="relative flex-1">
            <FiSearch
              size={14}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services…"
              className={`${inputCls} h-11 pl-10 pr-10`}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:text-red-500"
              >
                <FiX size={14} />
              </button>
            )}
          </div>
          <label
            className={`flex h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border-2 px-3 ${t.inner}`}
          >
            <span
              className={`text-[12px] font-black uppercase tracking-wider ${t.heading}`}
            >
              Live only
            </span>
            <Switch
              isDark={isDark}
              on={onlyActive}
              onClick={() => setOnlyActive((v) => !v)}
              label="Show live services only"
            />
          </label>
        </div>

        {dirtyCount > 0 && (
          <p className="flex items-center gap-2 rounded-xl border-2 border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[14px] font-semibold text-amber-600">
            <FiAlertCircle size={16} className="shrink-0" /> On/off switches and
            prices are only sent to the app after you press "Save prices".
          </p>
        )}

        {loading ? (
          <SkeletonCards isDark={isDark} rows={4} h="h-20" />
        ) : hierarchy.length === 0 ? (
          <EmptyState
            isDark={isDark}
            icon={FiGrid}
            title="No services yet"
            text="There are no marketplace services for this workspace."
          />
        ) : (
          hierarchy.map((main) => {
            const sections = (main.sections || [])
              .map((s) => ({
                ...s,
                list: (s.services || []).filter(showService),
              }))
              .filter((s) => s.list.length);
            if (!sections.length) return null;
            return (
              <div key={main.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2
                    className={`whitespace-nowrap text-[14px] font-black uppercase tracking-tight ${t.heading}`}
                  >
                    {main.name}
                  </h2>
                  <div
                    className={`h-0.5 flex-1 ${isDark ? "bg-white/5" : "bg-[#CBD5E1]"}`}
                  />
                </div>

                {sections.map((section) => (
                  <div key={section.id} className="space-y-2">
                    <h3 className={labelCls}>{section.name}</h3>
                    {section.list.map((svc) => {
                      const gData = getGarageData(svc.id);
                      const isOpen = !!expanded[svc.id];
                      const detail = localDetails[svc.id] || {};
                      const previewImg =
                        detail.imagePreview || gData.image || svc.image;
                      const busy = actionLoading[svc.id];
                      const from = fromPrice(gData);
                      const isDirty = !!dirty[svc.id];

                      return (
                        <article
                          key={svc.id}
                          className={`overflow-hidden rounded-2xl border-2 ${t.card} ${isDirty ? "!border-amber-500/50" : ""}`}
                        >
                          {/* row */}
                          <div className="flex items-center gap-3 p-3 sm:px-4">
                            <Switch
                              isDark={isDark}
                              on={gData.isActive}
                              onClick={() =>
                                handleToggle(svc.id, !gData.isActive)
                              }
                              label={`${gData.isActive ? "Turn off" : "Turn on"} ${svc.name}`}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setExpanded((p) => ({
                                  ...p,
                                  [svc.id]: !p[svc.id],
                                }))
                              }
                              aria-expanded={isOpen}
                              className="flex min-w-0 flex-1 items-center gap-3 text-left"
                            >
                              <span className="min-w-0 flex-1">
                                <span
                                  className={`block truncate text-[14px] font-black ${t.heading}`}
                                >
                                  {svc.name}
                                </span>
                                <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                  <LivePill on={gData.isActive} />
                                  {isDirty && (
                                    <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[12px] font-black uppercase tracking-wider text-amber-600">
                                      Not saved
                                    </span>
                                  )}
                                </span>
                              </span>
                              <span className="shrink-0 text-right">
                                <span className="block text-[12px] font-bold uppercase tracking-wider text-slate-400">
                                  From
                                </span>
                                <span
                                  className={`block font-mono text-[14px] font-black ${t.heading}`}
                                >
                                  {from != null ? inr(from) : "—"}
                                </span>
                              </span>
                              <FiChevronDown
                                size={16}
                                className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                              />
                            </button>
                          </div>

                          {/* panel */}
                          {isOpen && (
                            <div
                              className={`grid gap-4 border-t-2 p-3 sm:p-4 lg:grid-cols-2 ${t.line}`}
                            >
                              {/* prices */}
                              <div className="space-y-3">
                                <p
                                  className={`flex items-center gap-1.5 ${labelCls}`}
                                >
                                  <FiTag size={12} /> Price by vehicle type
                                </p>
                                <div
                                  className={`overflow-hidden rounded-xl border-2 ${t.line}`}
                                >
                                  <div
                                    className={`grid grid-cols-[1fr_96px_84px] gap-2 border-b-2 px-3 py-2 sm:grid-cols-[1fr_120px_100px] ${t.cardHead} ${labelCls}`}
                                  >
                                    <span>Vehicle</span>
                                    <span>Price ₹</span>
                                    <span>Discount</span>
                                  </div>
                                  {activeSegments.map((ct) => {
                                    const pRow = (gData.pricing || []).find(
                                      (p) => p.carType === ct,
                                    ) || { price: "", discount: "" };
                                    const label =
                                      VARIANT_LABELS[ct] ||
                                      ct.replace(/_/g, " ");
                                    return (
                                      <div
                                        key={ct}
                                        className={`grid grid-cols-[1fr_96px_84px] items-center gap-2 border-b px-3 py-2 last:border-0 sm:grid-cols-[1fr_120px_100px] ${t.line}`}
                                      >
                                        <span
                                          className={`truncate text-[12px] font-bold sm:text-[14px] ${t.body}`}
                                          title={label}
                                        >
                                          {label}
                                        </span>
                                        <input
                                          type="number"
                                          min="0"
                                          inputMode="decimal"
                                          aria-label={`${label} price`}
                                          value={pRow.price ?? ""}
                                          placeholder="0"
                                          onChange={(e) =>
                                            handlePriceChange(
                                              svc.id,
                                              ct,
                                              "price",
                                              e.target.value,
                                            )
                                          }
                                          className={`${inputCls} h-9 px-2 font-mono`}
                                        />
                                        <input
                                          type="number"
                                          min="0"
                                          inputMode="decimal"
                                          aria-label={`${label} discount`}
                                          value={pRow.discount ?? ""}
                                          placeholder="0"
                                          onChange={(e) =>
                                            handlePriceChange(
                                              svc.id,
                                              ct,
                                              "discount",
                                              e.target.value,
                                            )
                                          }
                                          className={`${inputCls} h-9 px-2 font-mono`}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                                <button
                                  type="button"
                                  disabled={!!busy}
                                  onClick={() => savePricing(svc.id)}
                                  className={`${btnBase} h-10 w-full shadow-lg ${t.btnPrimary}`}
                                >
                                  {busy === "pricing" ? (
                                    <FiRefreshCw
                                      size={14}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <FiSave size={14} />
                                  )}
                                  {busy === "pricing"
                                    ? "Saving…"
                                    : "Save prices"}
                                </button>
                              </div>

                              {/* app listing */}
                              <div className="space-y-3">
                                <p
                                  className={`flex items-center gap-1.5 ${labelCls}`}
                                >
                                  <FiInfo size={12} /> How it looks in the app
                                </p>
                                <textarea
                                  rows={4}
                                  aria-label="Description"
                                  className={`w-full resize-none rounded-xl border-2 px-3 py-2.5 text-[14px] font-medium leading-relaxed outline-none transition ${t.input}`}
                                  value={
                                    detail.description ??
                                    gData.description ??
                                    svc.description ??
                                    ""
                                  }
                                  placeholder="Describe what's included…"
                                  onChange={(e) =>
                                    setLocalDetails((p) => ({
                                      ...p,
                                      [svc.id]: {
                                        ...p[svc.id],
                                        description: e.target.value,
                                      },
                                    }))
                                  }
                                />
                                <div
                                  className={`flex items-center gap-3 rounded-xl border-2 p-2.5 ${t.inner}`}
                                >
                                  {previewImg ? (
                                    <img
                                      src={previewImg}
                                      alt=""
                                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div
                                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border-2 border-dashed text-slate-400 ${t.line}`}
                                    >
                                      <FiImage size={16} />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p
                                      className={`text-[14px] font-black ${t.heading}`}
                                    >
                                      Service photo
                                    </p>
                                    <p
                                      className={`truncate text-[12px] ${t.muted}`}
                                    >
                                      {detail.imageFile
                                        ? detail.imageFile.name
                                        : previewImg
                                          ? "Current photo"
                                          : "No photo yet"}
                                    </p>
                                  </div>
                                  <input
                                    type="file"
                                    id={`img-${svc.id}`}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file)
                                        setLocalDetails((p) => ({
                                          ...p,
                                          [svc.id]: {
                                            ...p[svc.id],
                                            imageFile: file,
                                            imagePreview:
                                              URL.createObjectURL(file),
                                          },
                                        }));
                                    }}
                                  />
                                  <label
                                    htmlFor={`img-${svc.id}`}
                                    className={`${btnBase} h-9 shrink-0 cursor-pointer border-2 px-3 ${t.btnGhost}`}
                                  >
                                    <FiUpload size={12} /> Upload
                                  </label>
                                </div>
                                <button
                                  type="button"
                                  disabled={!!busy}
                                  onClick={() =>
                                    saveDetails(
                                      svc.id,
                                      gData.description ||
                                        svc.description ||
                                        svc.name,
                                    )
                                  }
                                  className={`${btnBase} h-10 w-full border-2 ${t.btnGhost}`}
                                >
                                  {busy === "details" ? (
                                    <FiRefreshCw
                                      size={14}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <FiImage size={14} />
                                  )}
                                  {busy === "details"
                                    ? "Saving…"
                                    : "Save description & photo"}
                                </button>
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })
        )}

        {!loading &&
          hierarchy.length > 0 &&
          allServices.filter(showService).length === 0 && (
            <EmptyState
              isDark={isDark}
              icon={FiSearch}
              title="No services match"
              text="Try a different search or turn off Live only."
            />
          )}
      </div>
    </div>
  );
}
