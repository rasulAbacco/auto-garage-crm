import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";
import {
  FiPackage,
  FiPlus,
  FiTrash2,
  FiPower,
  FiSearch,
  FiShoppingBag,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiLoader,
} from "react-icons/fi";
import {
  tk,
  btnBase,
  PageHeading,
  ConfirmDialog,
  CrmChip,
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
const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export default function MarketplacePackages() {
  const { isDark } = useTheme();
  const t = tk(isDark);
  const currentCrmType = useMemo(() => detectCrmType(), []);

  const [activeTab, setActiveTab] = useState("list");
  const [flatServices, setFlatServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoadError("");
    try {
      const config = {
        ...auth(),
        params: { vehicleType: currentCrmType.toLowerCase() },
      };
      const [serviceRes, packageRes] = await Promise.all([
        axios.get(`${API_URL}/api/marketplace/services`, config),
        axios.get(`${API_URL}/api/marketplace/packages`, config),
      ]);

      const flattened = [];
      (serviceRes.data?.data || []).forEach((main) => {
        (main.sections || []).forEach((section) => {
          (section.services || []).forEach((svc) => {
            flattened.push({
              ...svc,
              externalServiceId: svc.id,
              category: main.name,
              section: section.name,
            });
          });
        });
      });

      setFlatServices(flattened);
      setPackages(
        Array.isArray(packageRes.data?.data) ? packageRes.data.data : [],
      );
    } catch (err) {
      console.error("Packages load failed:", err);
      setLoadError(errText(err, "Could not load packages"));
    } finally {
      setLoading(false);
    }
  }, [currentCrmType]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggleService = (id) => {
    setFormError("");
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setDescription("");
    setSelectedServices([]);
    setSearchTerm("");
    setFormError("");
  };

  const createPackage = async () => {
    if (!name.trim() || !price || selectedServices.length === 0) {
      setFormError("Add a name, a price and at least one service.");
      return;
    }
    setSaving(true);
    try {
      const servicePayload = selectedServices.map((id) => {
        const svc = flatServices.find((s) => s.externalServiceId === id);
        return { id, name: svc?.name };
      });
      await axios.post(
        `${API_URL}/api/marketplace/packages`,
        {
          name: name.trim(),
          price: Number(price),
          description,
          serviceIds: servicePayload,
        },
        auth(),
      );
      toast.success("Package created");
      resetForm();
      setActiveTab("list");
      fetchAll();
    } catch (err) {
      console.error("Create package failed:", err);
      setFormError(errText(err, "Could not create the package"));
    } finally {
      setSaving(false);
    }
  };

  const deletePackage = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await axios.delete(
        `${API_URL}/api/marketplace/packages/${deleteTarget.id}`,
        auth(),
      );
      toast.success("Package removed");
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      toast.error(errText(err, "Could not remove the package"));
    } finally {
      setBusyId(null);
    }
  };

  const togglePackageStatus = async (pkg) => {
    setBusyId(pkg.id);
    try {
      await axios.patch(
        `${API_URL}/api/marketplace/packages/${pkg.id}/toggle`,
        {},
        auth(),
      );
      toast.success(pkg.isActive ? "Package paused" : "Package is live");
      await fetchAll();
    } catch (err) {
      toast.error(errText(err, "Could not change the package"));
    } finally {
      setBusyId(null);
    }
  };

  const visibleServices = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return flatServices.filter(
      (s) =>
        !q ||
        String(s.name || "")
          .toLowerCase()
          .includes(q) ||
        String(s.section || "")
          .toLowerCase()
          .includes(q),
    );
  }, [flatServices, searchTerm]);

  const selectedList = selectedServices
    .map((id) => flatServices.find((s) => s.externalServiceId === id))
    .filter(Boolean);
  const liveCount = packages.filter((p) => p.isActive).length;
  const inputCls = `w-full rounded-xl border-2 px-3.5 text-[14px] font-semibold outline-none transition ${t.input}`;

  const tabs = [
    { id: "list", label: `Packages (${packages.length})`, icon: FiShoppingBag },
    { id: "create", label: "Create package", icon: FiPlus },
  ];

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
          accent="packages."
          subtitle={`Bundle services at one price for the MotorDesk app · ${liveCount} live`}
          right={<CrmChip crmType={currentCrmType} isDark={isDark} />}
        />

        {/* tabs */}
        <div
          className={`grid grid-cols-2 gap-1 rounded-xl border-2 p-1 sm:inline-grid sm:w-auto ${t.card}`}
        >
          {tabs.map((tab) => {
            const on = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`${btnBase} h-9 px-4 ${on ? t.btnPrimary : `${t.muted} hover:opacity-80`}`}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        <ErrorBar message={loadError} onRetry={() => fetchAll()} />

        {activeTab === "create" ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            {/* services picker */}
            <section
              className={`overflow-hidden rounded-2xl border-2 ${t.card}`}
            >
              <div
                className={`flex flex-col gap-2 border-b-2 px-3 py-3 sm:flex-row sm:items-center sm:px-4 ${t.cardHead}`}
              >
                <div className="min-w-0 flex-1">
                  <h2
                    className={`text-[14px] font-black uppercase tracking-tight ${t.heading}`}
                  >
                    Pick{" "}
                    <span className="font-light lowercase italic">
                      services
                    </span>
                  </h2>
                  <p className={`text-[12px] ${t.muted}`}>
                    {selectedServices.length} selected
                  </p>
                </div>
                <div className="relative sm:w-64">
                  <FiSearch
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search services…"
                    className={`${inputCls} h-10 pl-9`}
                  />
                </div>
              </div>
              <div className="grid max-h-[460px] grid-cols-1 gap-2 overflow-y-auto p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
                {visibleServices.map((s) => {
                  const on = selectedServices.includes(s.externalServiceId);
                  return (
                    <button
                      key={s.externalServiceId}
                      type="button"
                      onClick={() => toggleService(s.externalServiceId)}
                      aria-pressed={on}
                      className={`flex items-start gap-2 rounded-xl border-2 p-2.5 text-left transition ${
                        on
                          ? isDark
                            ? "border-white bg-white text-[#001F3F]"
                            : "border-[#001F3F] bg-[#001F3F] text-white"
                          : `${t.inner} ${t.heading}`
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
                          on
                            ? isDark
                              ? "border-[#001F3F] bg-[#001F3F] text-white"
                              : "border-white bg-white text-[#001F3F]"
                            : "border-slate-400"
                        }`}
                      >
                        {on && <FiCheck size={10} strokeWidth={4} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-bold">
                          {s.name}
                        </span>
                        <span
                          className={`block truncate text-[12px] uppercase tracking-wider ${on ? "opacity-70" : t.muted}`}
                        >
                          {s.section}
                        </span>
                      </span>
                    </button>
                  );
                })}
                {!loading && visibleServices.length === 0 && (
                  <p
                    className={`col-span-full py-8 text-center text-[14px] ${t.muted}`}
                  >
                    {flatServices.length
                      ? "No services match your search."
                      : "No services available for this workspace."}
                  </p>
                )}
              </div>
            </section>

            {/* package details */}
            <section
              className={`h-fit overflow-hidden rounded-2xl border-2 lg:sticky lg:top-4 ${t.card}`}
            >
              <div className={`border-b-2 px-3 py-3 sm:px-4 ${t.cardHead}`}>
                <h2
                  className={`text-[14px] font-black uppercase tracking-tight ${t.heading}`}
                >
                  Package{" "}
                  <span className="font-light lowercase italic">details</span>
                </h2>
              </div>
              <div className="space-y-4 p-3 sm:p-4">
                <div>
                  <label
                    className={`mb-1.5 block text-[12px] font-bold uppercase tracking-wider ${isDark ? "text-slate-300" : "text-[#001F3F]"}`}
                  >
                    Package name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setFormError("");
                    }}
                    placeholder="e.g. Monsoon care bundle"
                    className={`${inputCls} h-11`}
                  />
                </div>
                <div>
                  <label
                    className={`mb-1.5 block text-[12px] font-bold uppercase tracking-wider ${isDark ? "text-slate-300" : "text-[#001F3F]"}`}
                  >
                    Package price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      setFormError("");
                    }}
                    placeholder="0"
                    className={`${inputCls} h-11 font-mono`}
                  />
                </div>
                <div>
                  <label
                    className={`mb-1.5 block text-[12px] font-bold uppercase tracking-wider ${isDark ? "text-slate-300" : "text-[#001F3F]"}`}
                  >
                    Short description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What the customer gets and why it's good value…"
                    className={`${inputCls} resize-none py-2.5`}
                  />
                </div>

                <div>
                  <p className="mb-1.5 text-[12px] font-bold uppercase tracking-wider text-slate-400">
                    Included ({selectedList.length})
                  </p>
                  {selectedList.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedList.map((s) => (
                        <span
                          key={s.externalServiceId}
                          className={`inline-flex items-center gap-1 rounded-lg border py-0.5 pl-2 pr-1 text-[12px] font-bold ${t.inner} ${t.heading}`}
                        >
                          {s.name}
                          <button
                            type="button"
                            onClick={() => toggleService(s.externalServiceId)}
                            aria-label={`Remove ${s.name}`}
                            className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:text-red-500"
                          >
                            <FiX size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-[12px] ${t.muted}`}>
                      Tap services on the list to add them.
                    </p>
                  )}
                </div>

                {formError && (
                  <p className="rounded-xl border-2 border-red-500/30 bg-red-500/10 px-3 py-2 text-[14px] font-semibold text-red-500">
                    {formError}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    className={`${btnBase} h-10 border-2 ${t.btnGhost}`}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={createPackage}
                    disabled={saving}
                    className={`${btnBase} h-10 shadow-lg ${t.btnPrimary}`}
                  >
                    {saving ? (
                      <FiLoader size={14} className="animate-spin" />
                    ) : (
                      <FiPackage size={14} />
                    )}
                    {saving ? "Saving…" : "Launch"}
                  </button>
                </div>
              </div>
            </section>
          </div>
        ) : loading ? (
          <SkeletonCards isDark={isDark} rows={2} h="h-40" />
        ) : packages.length === 0 ? (
          <EmptyState
            isDark={isDark}
            icon={FiPackage}
            title="No packages yet"
            text="Bundle a few services at one price to attract more bookings."
            action={
              <button
                type="button"
                onClick={() => setActiveTab("create")}
                className={`${btnBase} h-9 px-4 ${t.btnPrimary}`}
              >
                <FiPlus size={14} /> Create package
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {packages.map((pkg) => {
              const busy = busyId === pkg.id;
              return (
                <article
                  key={pkg.id}
                  className={`flex flex-col overflow-hidden rounded-2xl border-2 ${t.card} ${pkg.isActive ? "" : "opacity-80"}`}
                >
                  <div className="flex-1 space-y-3 p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.chipNavy}`}
                      >
                        <FiPackage size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <LivePill
                          on={pkg.isActive}
                          onText="Live in app"
                          offText="Paused"
                        />
                        <h3
                          className={`mt-1 break-words text-[14px] font-black uppercase tracking-tight ${t.heading}`}
                        >
                          {pkg.name}
                        </h3>
                      </div>
                      <p
                        className={`shrink-0 font-mono text-[16px] font-black ${t.heading}`}
                      >
                        {inr(pkg.price)}
                      </p>
                    </div>
                    {pkg.description && (
                      <p className={`text-[14px] leading-relaxed ${t.muted}`}>
                        {pkg.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {(pkg.items || []).map((item) => (
                        <span
                          key={item.id}
                          className={`rounded-lg border px-2 py-0.5 text-[12px] font-bold ${t.inner} ${t.body}`}
                        >
                          {item.serviceName}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div
                    className={`flex items-center justify-between gap-2 border-t-2 px-3 py-2.5 sm:px-4 ${t.line} ${t.cardHead}`}
                  >
                    <span
                      className={`text-[12px] font-bold uppercase tracking-wider ${t.muted}`}
                    >
                      {(pkg.items || []).length} service
                      {(pkg.items || []).length === 1 ? "" : "s"}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => togglePackageStatus(pkg)}
                        disabled={busy}
                        className={`${btnBase} h-8 border-2 px-3 ${
                          pkg.isActive
                            ? t.btnGhost
                            : isDark
                              ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
                              : "border-green-200 text-green-700 hover:bg-green-50"
                        }`}
                      >
                        {busy ? (
                          <FiRefreshCw size={12} className="animate-spin" />
                        ) : (
                          <FiPower size={12} />
                        )}
                        {pkg.isActive ? "Pause" : "Go live"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(pkg)}
                        aria-label={`Delete ${pkg.name}`}
                        className={`flex h-8 w-8 items-center justify-center rounded-xl border-2 transition ${
                          isDark
                            ? "border-white/10 text-slate-300 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                            : "border-[#CBD5E1] text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                        }`}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isDark={isDark}
        open={Boolean(deleteTarget)}
        title="Remove package?"
        message={
          deleteTarget
            ? `"${deleteTarget.name}" will be removed from the MotorDesk app.`
            : ""
        }
        confirmText="Remove"
        busy={Boolean(deleteTarget && busyId === deleteTarget.id)}
        onConfirm={deletePackage}
        onCancel={() => !busyId && setDeleteTarget(null)}
      />
    </div>
  );
}
