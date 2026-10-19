// client/src/pages/services/ServiceForm.jsx  (Car CRM – create / edit job card)
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import {
  FiTool,
  FiUser,
  FiArrowLeft,
  FiSave,
  FiPlus,
  FiTrash2,
  FiClock,
  FiEdit3,
  FiX,
  FiSearch,
  FiCamera,
  FiImage,
  FiAlertCircle,
  FiLoader,
  FiLayers,
  FiCheck,
  FiUserCheck,
  FiPackage,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import { Toaster, toast } from "react-hot-toast";

import { useTheme } from "../../contexts/ThemeContext";
import PartAutocomplete from "./PartAutocomplete";
import {
  SectionCard,
  FieldLabel,
  PageHeading,
  Plate,
  ConfirmDialog,
  tk,
  btnBase,
  fmtMoney,
} from "../clients/components/clientUi";

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

const emptyCostRow = () => ({
  type: "part",
  name: "",
  quantity: 1,
  unitPrice: "",
  cgstRate: "",
  sgstRate: "",
  itemCode: null, // linked inventory item (frontend only)
  inventoryId: null, // linked inventory item (frontend only)
});

const emptySub = () => ({ id: null, name: "", inputValue: "" });

// "now" in the format <input type="datetime-local"> expects
const nowLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const num = (v) => (Number.isFinite(+v) ? +v : 0);
const rowCalc = (r) => {
  const base = num(r.quantity) * num(r.unitPrice);
  const cgst = (base * num(r.cgstRate)) / 100;
  const sgst = (base * num(r.sgstRate)) / 100;
  return { base, cgst, sgst, total: base + cgst + sgst };
};

export default function ServiceForm() {
  const { id } = useParams();
  const { isDark } = useTheme();
  const t = tk(isDark);
  const navigate = useNavigate();
  const location = useLocation();
  const topRef = useRef(null);

  const [form, setForm] = useState({
    clientId: "",
    categoryId: "",
    notes: "",
    status: "Pending",
    priority: "Normal",
    serviceInDate: id ? "" : nowLocal(),
    serviceOutDate: "",
    expectedDelivery: "",
    internalNotes: "",
    assignedMechanic: "",
    advancePaid: "",
  });

  /* sub-services */
  const [selectedSubServices, setSelectedSubServices] = useState([emptySub()]);
  const [subServiceSuggestions, setSubServiceSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(null);
  const [pendingSubServiceIndex, setPendingSubServiceIndex] = useState(null);
  const [creatingSubService, setCreatingSubService] = useState(false);

  /* cost rows + inventory */
  const [costItems, setCostItems] = useState([emptyCostRow()]);
  const [inventory, setInventory] = useState([]);

  /* mechanic */
  const [mechanicInput, setMechanicInput] = useState("");
  const [mechanicSuggestions, setMechanicSuggestions] = useState([]);
  const [mechanicOpen, setMechanicOpen] = useState(false);

  /* client */
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientQuery, setClientQuery] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [clientResults, setClientResults] = useState([]);
  const clientBoxRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingService, setLoadingService] = useState(!!id);
  const [error, setError] = useState("");
  const [media, setMedia] = useState([]);
  const [existingMedia, setExistingMedia] = useState([]);
  const [discount, setDiscount] = useState({ type: "amount", value: "" });

  const galleryRef = useRef(null);
  const cameraRef = useRef(null);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest("/api/clients");
        if (!res.ok) throw new Error("Failed to load clients");
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : data?.clients || data?.data || [];
        setClients(list);
      } catch (err) {
        console.error("Error loading clients:", err);
        setError("Unable to fetch clients. Please check your connection.");
      }
    })();
    (async () => {
      try {
        const res = await apiRequest("/api/services/list");
        const data = await res.json();
        if (res.ok) setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching service types:", err);
      }
    })();
    (async () => {
      try {
        const res = await apiRequest("/api/car-inventory");
        const data = await res.json();
        if (res.ok) setInventory(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading inventory:", err);
      }
    })();
  }, []);

  // client search: local list first, then ask the server (list may be paginated)
  useEffect(() => {
    if (!clientOpen) return;
    const q = clientQuery.trim().toLowerCase();
    const local = (
      q
        ? clients.filter((c) =>
            [c.fullName, c.regNumber, c.phone]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(q)),
          )
        : clients
    ).slice(0, 20);
    setClientResults(local);
    if (!q) return;
    const h = setTimeout(async () => {
      try {
        const res = await apiRequest(
          `/api/clients?limit=20&q=${encodeURIComponent(clientQuery.trim())}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : data?.clients || data?.data || [];
        setClientResults((prev) => {
          const seen = new Set(prev.map((c) => c.id));
          return [...prev, ...list.filter((c) => !seen.has(c.id))].slice(0, 20);
        });
      } catch {
        /* keep local results */
      }
    }, 300);
    return () => clearTimeout(h);
  }, [clientQuery, clientOpen, clients]);

  useEffect(() => {
    const onDown = (e) => {
      if (clientBoxRef.current && !clientBoxRef.current.contains(e.target))
        setClientOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // initial sub-services for a category
  useEffect(() => {
    if (!form.categoryId) {
      setSubServiceSuggestions([]);
      return;
    }
    (async () => {
      try {
        const r = await apiRequest(
          `/api/services/sub-services/search?categoryId=${form.categoryId}`,
        );
        const data = await r.json();
        setSubServiceSuggestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching sub-services:", err);
        setSubServiceSuggestions([]);
      }
    })();
  }, [form.categoryId]);

  // came from a client page
  useEffect(() => {
    const clientId = location.state?.customerId;
    if (!clientId) return;
    setForm((f) => ({ ...f, clientId }));
    (async () => {
      const res = await apiRequest(`/api/clients/${clientId}`);
      const data = await res.json().catch(() => null);
      if (res.ok && data) setSelectedClient(data);
    })();
  }, [location.state]);

  // edit mode
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await apiRequest(`/api/services/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load service");

        setForm({
          clientId: data.client?.id || "",
          categoryId: data.category?.id || "",
          notes: data.notes || "",
          status: data.status || "Pending",
          priority: data.priority || "Normal",
          serviceInDate: data.serviceInDate
            ? data.serviceInDate.slice(0, 16)
            : "",
          serviceOutDate: data.serviceOutDate
            ? data.serviceOutDate.slice(0, 16)
            : "",
          expectedDelivery: data.expectedDelivery
            ? data.expectedDelivery.slice(0, 16)
            : "",
          internalNotes: data.internalNotes || "",
          assignedMechanic: data.assignedMechanic || "",
          advancePaid: data.advancePaid || "",
        });
        if (data.client) setSelectedClient(data.client);
        setMechanicInput(data.assignedMechanic || "");
        if (num(data.discount) > 0)
          setDiscount({ type: "amount", value: String(data.discount) });

        const rows = (data.serviceCostItems || []).map((ci) => ({
          type: ci.type,
          name: ci.name || "",
          quantity: ci.quantity ?? 1,
          unitPrice: ci.unitPrice ?? "",
          cgstRate: ci.cgstRate ?? "",
          sgstRate: ci.sgstRate ?? "",
          itemCode: null,
          inventoryId: null,
        }));
        setCostItems(rows.length ? rows : [emptyCostRow()]);
        setExistingMedia(data.mediaFiles || []);

        if (Array.isArray(data.subServices) && data.subServices.length) {
          setSelectedSubServices(
            data.subServices.map((s) => ({
              id: s.id,
              name: s.name,
              inputValue: s.name,
            })),
          );
        } else if (data.subService) {
          setSelectedSubServices([
            {
              id: data.subService.id,
              name: data.subService.name,
              inputValue: data.subService.name,
            },
          ]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingService(false);
      }
    })();
  }, [id]);

  // mechanic suggestions (debounced)
  useEffect(() => {
    if (!mechanicOpen) return;
    const h = setTimeout(async () => {
      try {
        const q = mechanicInput.trim();
        const r = await apiRequest(
          `/api/car-staff/search-mechanics${q ? `?q=${encodeURIComponent(q)}` : ""}`,
        );
        const data = await r.json();
        setMechanicSuggestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error searching mechanics:", err);
        setMechanicSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(h);
  }, [mechanicInput, mechanicOpen]);

  /* ================= TOTALS ================= */

  const totals = useMemo(() => {
    let parts = 0,
      labor = 0,
      cgst = 0,
      sgst = 0;
    costItems.forEach((r) => {
      const c = rowCalc(r);
      if (r.type === "labor") labor += c.total;
      else parts += c.total;
      cgst += c.cgst;
      sgst += c.sgst;
    });
    return { parts, labor, cgst, sgst, total: parts + labor };
  }, [costItems]);

  const totalAmount = totals.total;
  const discountAmount =
    discount.type === "amount"
      ? num(discount.value)
      : (totalAmount * num(discount.value)) / 100;
  const grandTotal = totalAmount - discountAmount;
  const balanceDue = grandTotal - num(form.advancePaid);

  /* media previews (revoked on change) */
  const mediaPreviews = useMemo(
    () => media.map((f) => URL.createObjectURL(f)),
    [media],
  );
  useEffect(
    () => () => mediaPreviews.forEach((u) => URL.revokeObjectURL(u)),
    [mediaPreviews],
  );

  /* ================= HANDLERS ================= */

  const updateCostRow = (idx, patch) =>
    setCostItems((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    );

  const setRowType = (idx, type) =>
    updateCostRow(
      idx,
      type === "labor" ? { type, itemCode: null, inventoryId: null } : { type },
    );

  const addCostRow = (type = "part") =>
    setCostItems((p) => [...p, { ...emptyCostRow(), type }]);
  const removeCostRow = (i) =>
    setCostItems((p) =>
      p.length === 1 ? [emptyCostRow()] : p.filter((_, idx) => idx !== i),
    );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const pickClient = (c) => {
    setSelectedClient(c);
    setForm((f) => ({ ...f, clientId: c.id }));
    setClientQuery("");
    setClientOpen(false);
  };

  /* sub-services */
  const addSubServiceRow = () =>
    setSelectedSubServices((p) => [...p, emptySub()]);
  const removeSubServiceRow = (idx) => {
    setSelectedSubServices((p) =>
      p.length === 1 ? [emptySub()] : p.filter((_, i) => i !== idx),
    );
    setActiveSuggestionIndex(null);
  };

  const searchSubServices = async (val) => {
    if (!form.categoryId) return setSubServiceSuggestions([]);
    try {
      const r = await apiRequest(
        `/api/services/sub-services/search?categoryId=${form.categoryId}${val.trim() ? `&q=${encodeURIComponent(val)}` : ""}`,
      );
      const data = await r.json();
      setSubServiceSuggestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error searching sub-services:", err);
      setSubServiceSuggestions([]);
    }
  };

  const handleSubServiceInputChange = (idx, val) => {
    setSelectedSubServices((prev) =>
      prev.map((s, i) =>
        i === idx ? { id: null, name: "", inputValue: val } : s,
      ),
    );
    setActiveSuggestionIndex(idx);
    searchSubServices(val);
  };

  const pickSubService = (idx, s) => {
    setSelectedSubServices((prev) =>
      prev.map((x, i) =>
        i === idx ? { id: s.id, name: s.name, inputValue: s.name } : x,
      ),
    );
    setActiveSuggestionIndex(null);
  };

  const createNewSubService = async () => {
    if (pendingSubServiceIndex === null) return;
    const textValue =
      selectedSubServices[pendingSubServiceIndex]?.inputValue.trim();
    if (!textValue || !form.categoryId) return;
    setCreatingSubService(true);
    try {
      const res = await apiRequest("/api/services/sub-services", {
        method: "POST",
        body: JSON.stringify({ name: textValue, categoryId: form.categoryId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data.message || "Failed to create sub-service");
      pickSubService(pendingSubServiceIndex, data);
      setSubServiceSuggestions((p) => [...p, data]);
      toast.success(`"${data.name}" added`);
    } catch (err) {
      toast.error(err.message || "Failed to create sub-service");
    } finally {
      setCreatingSubService(false);
      setPendingSubServiceIndex(null);
    }
  };

  /* ================= SUBMIT ================= */

  const fail = (msg) => {
    setError(msg);
    toast.error(msg);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clientId) return fail("Please select a client.");
    if (!form.serviceInDate) return fail("Please select the vehicle-in date.");
    setError("");
    setLoading(true);

    try {
      const toISO = (v) => (v ? new Date(v).toISOString() : "");
      const fd = new FormData();
      fd.append("clientId", form.clientId);
      fd.append("categoryId", form.categoryId);
      fd.append("serviceInDate", toISO(form.serviceInDate));
      fd.append("serviceOutDate", toISO(form.serviceOutDate));
      fd.append("expectedDelivery", toISO(form.expectedDelivery));
      fd.append("notes", form.notes);
      fd.append("status", form.status);
      fd.append("priority", form.priority);
      fd.append("internalNotes", form.internalNotes);
      fd.append("assignedMechanic", mechanicInput);
      fd.append("cost", totalAmount.toFixed(2));
      fd.append("discount", discountAmount.toFixed(2));
      fd.append("advancePaid", form.advancePaid || "0");
      fd.append("balanceDue", balanceDue.toFixed(2));

      const subServiceIds = [];
      const subServiceNames = [];
      selectedSubServices.forEach((sub) => {
        if (sub.id) subServiceIds.push(sub.id);
        else if (sub.inputValue.trim())
          subServiceNames.push(sub.inputValue.trim());
      });
      fd.append("subServiceIds", JSON.stringify(subServiceIds));
      fd.append("subServiceNames", JSON.stringify(subServiceNames));

      // drop empty rows + frontend-only inventory fields
      const cleanCostItems = costItems
        .filter((r) => r.name.trim() || num(r.unitPrice) > 0)
        .map(({ itemCode, inventoryId, ...rest }) => rest);
      fd.append("costItems", JSON.stringify(cleanCostItems));

      media.forEach((file) => fd.append("images", file));

      const res = await fetch(
        `${API_BASE}${id ? `/api/services/${id}` : "/api/services"}`,
        {
          method: id ? "PUT" : "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: fd,
        },
      );
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || "Failed to save service");

      toast.success(id ? "Service updated" : "Service created");
      const serviceId = result?.service?.id ?? (id || null);
      if (serviceId) navigate("/billing/new", { state: { serviceId } });
      else navigate("/services");
    } catch (err) {
      fail(err.message || "Error saving service");
    } finally {
      setLoading(false);
    }
  };

  /* ================= RENDER ================= */

  if (loadingService) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 lg:ml-16">
        <FiLoader className={`animate-spin ${t.heading}`} size={24} />
        <p className={`text-[14px] font-semibold ${t.muted}`}>
          Loading service…
        </p>
      </div>
    );
  }

  const inputCls = `h-11 w-full rounded-xl border-2 px-3.5 text-[14px] font-semibold outline-none transition ${t.input} ${
    isDark ? "[&>option]:bg-[#000814] [color-scheme:dark]" : ""
  }`;
  const smallInput = `h-10 w-full rounded-xl border-2 px-3 text-[14px] font-semibold outline-none transition ${t.input}`;
  const textArea = `w-full resize-none rounded-xl border-2 px-3.5 py-2.5 text-[14px] font-medium outline-none transition ${t.input}`;
  const menuCls = `absolute z-40 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border-2 shadow-2xl ${t.menu}`;
  const optionCls = `flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-[14px] ${t.option}`;

  const seg = (on) =>
    `h-8 flex-1 rounded-lg text-[12px] font-black uppercase tracking-wider transition ${
      on
        ? t.chipNavy
        : isDark
          ? "text-slate-400 hover:text-white"
          : "text-slate-500 hover:text-[#001F3F]"
    }`;

  const summary = (
    <div className={`overflow-hidden rounded-2xl border-2 ${t.card}`}>
      <div
        className={`flex items-center gap-3 border-b-2 px-4 py-3 ${t.cardHead}`}
      >
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-xl ${t.chipNavy}`}
        >
          <FaRupeeSign size={14} />
        </div>
        <h2
          className={`flex-1 text-[14px] font-black uppercase tracking-tight ${t.heading}`}
        >
          Billing summary
        </h2>
      </div>
      <div className="space-y-3 p-4">
        <div className="space-y-1.5 text-[14px]">
          {[
            ["Parts", totals.parts],
            ["Labour", totals.labor],
            ["CGST", totals.cgst],
            ["SGST", totals.sgst],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between">
              <span className={t.muted}>{l}</span>
              <span className={`font-bold ${t.heading}`}>{fmtMoney(v)}</span>
            </div>
          ))}
        </div>

        <div>
          <FieldLabel label="Discount" isDark={isDark} />
          <div className="flex gap-2">
            <div
              className={`flex w-24 shrink-0 rounded-xl border-2 p-1 ${isDark ? "border-white/10" : "border-[#CBD5E1]"}`}
            >
              <button
                type="button"
                className={seg(discount.type === "amount")}
                onClick={() => setDiscount((d) => ({ ...d, type: "amount" }))}
              >
                ₹
              </button>
              <button
                type="button"
                className={seg(discount.type === "percentage")}
                onClick={() =>
                  setDiscount((d) => ({ ...d, type: "percentage" }))
                }
              >
                %
              </button>
            </div>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              value={discount.value}
              onChange={(e) =>
                setDiscount((d) => ({ ...d, value: e.target.value }))
              }
              placeholder="0"
              className={smallInput}
            />
          </div>
        </div>

        <div>
          <FieldLabel label="Advance paid" isDark={isDark} />
          <input
            type="number"
            min="0"
            inputMode="decimal"
            name="advancePaid"
            value={form.advancePaid}
            onChange={handleChange}
            placeholder="0.00"
            className={smallInput}
          />
        </div>

        <div className={`space-y-1.5 rounded-xl border-2 p-3 ${t.inner}`}>
          {discountAmount > 0 && (
            <div className="flex justify-between text-[14px]">
              <span className={t.muted}>Discount</span>
              <span className="font-bold text-red-500">
                − {fmtMoney(discountAmount)}
              </span>
            </div>
          )}
          <div className="flex items-end justify-between">
            <span className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400">
              Grand total
            </span>
            <span className={`text-[16px] font-black ${t.heading}`}>
              {fmtMoney(grandTotal)}
            </span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400">
              Balance due
            </span>
            <span
              className={`text-[16px] font-black ${balanceDue > 0 ? "text-red-500" : "text-green-600"}`}
            >
              {fmtMoney(balanceDue)}
            </span>
          </div>
        </div>

        <div className="hidden gap-2 lg:flex">
          <Link
            to="/services"
            className={`${btnBase} h-11 flex-1 border-2 ${t.btnGhost}`}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className={`${btnBase} h-11 flex-[2] ${t.btnPrimary} shadow-xl`}
          >
            {loading ? (
              <FiLoader size={14} className="animate-spin" />
            ) : (
              <FiSave size={14} />
            )}
            {loading ? "Saving…" : id ? "Update service" : "Create service"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:ml-16" ref={topRef}>
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontSize: 14 } }}
      />

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-7xl space-y-4 pb-28 sm:space-y-5 lg:pb-8"
      >
        {/* header */}
        <div className="space-y-3">
          <Link
            to="/services"
            className={`inline-flex items-center gap-1.5 text-[12px] font-black uppercase tracking-[0.15em] ${t.muted} ${
              isDark ? "hover:text-white" : "hover:text-[#001F3F]"
            }`}
          >
            <FiArrowLeft size={14} /> Services
          </Link>
          <PageHeading
            isDark={isDark}
            badge={id ? `Editing #${id}` : "New job card"}
            title={id ? "Edit" : "New"}
            accent="service."
            subtitle={
              selectedClient
                ? `Job card for ${selectedClient.fullName}`
                : "Pick a client, add the work and parts, then save."
            }
          />
        </div>

        {error && (
          <div className="flex items-start justify-between gap-3 rounded-xl border-2 border-red-500/30 bg-red-500/10 px-4 py-3 text-[14px] font-semibold text-red-500">
            <span className="flex items-start gap-2">
              <FiAlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
            </span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss"
            >
              <FiX size={14} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-4 sm:space-y-5">
            {/* 01 client */}
            <SectionCard
              isDark={isDark}
              icon={FiUser}
              step="01"
              title="Client & vehicle"
              subtitle="Who is this job for"
            >
              {selectedClient ? (
                <div
                  className={`flex flex-wrap items-center gap-3 rounded-xl border-2 p-3 ${t.inner}`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[16px] font-black ${t.chipNavy}`}
                  >
                    {selectedClient.fullName?.charAt(0)?.toUpperCase() || "C"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-[14px] font-black ${t.heading}`}
                    >
                      {selectedClient.fullName}
                    </p>
                    <p className={`truncate text-[12px] ${t.muted}`}>
                      {[selectedClient.vehicleMake, selectedClient.vehicleModel]
                        .filter(Boolean)
                        .join(" ") || "Vehicle"}
                      {selectedClient.phone ? ` · ${selectedClient.phone}` : ""}
                    </p>
                  </div>
                  <Plate value={selectedClient.regNumber} />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClient(null);
                      setForm((f) => ({ ...f, clientId: "" }));
                      setClientOpen(true);
                    }}
                    className={`${btnBase} h-9 border-2 px-3 ${t.btnGhost}`}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative" ref={clientBoxRef}>
                  <FieldLabel
                    icon={<FiSearch size={12} />}
                    label="Find client"
                    required
                    isDark={isDark}
                  />
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
                      placeholder="Search by name, reg number or phone"
                      autoComplete="off"
                      className={`${inputCls} pl-10`}
                    />
                  </div>
                  {clientOpen && (
                    <div className={menuCls}>
                      {clientResults.length ? (
                        clientResults.map((c) => (
                          <button
                            type="button"
                            key={c.id}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => pickClient(c)}
                            className={optionCls}
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
                                {c.phone ? ` · ${c.phone}` : ""}
                              </span>
                            </span>
                            <Plate value={c.regNumber} size="sm" />
                          </button>
                        ))
                      ) : (
                        <div className={`px-3 py-3 text-[14px] ${t.muted}`}>
                          No client found.{" "}
                          <Link
                            to="/clients/new"
                            className="font-bold underline"
                          >
                            Add new client
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </SectionCard>

            {/* 02 job details */}
            <SectionCard
              isDark={isDark}
              icon={FiClock}
              step="02"
              title="Job details"
              subtitle="Category, mechanic, status and timing"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel
                    icon={<FiTool size={12} />}
                    label="Service category"
                    isDark={isDark}
                  />
                  <select
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, categoryId: e.target.value }))
                    }
                    className={`${inputCls} cursor-pointer`}
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <FieldLabel
                    icon={<FiUserCheck size={12} />}
                    label="Assigned mechanic"
                    isDark={isDark}
                  />
                  <input
                    value={mechanicInput}
                    onChange={(e) => {
                      setMechanicInput(e.target.value);
                      setMechanicOpen(true);
                    }}
                    onFocus={() => setMechanicOpen(true)}
                    onBlur={() => setTimeout(() => setMechanicOpen(false), 150)}
                    placeholder="Type or pick a mechanic"
                    autoComplete="off"
                    className={inputCls}
                  />
                  {mechanicOpen && mechanicSuggestions.length > 0 && (
                    <div className={menuCls}>
                      {mechanicSuggestions.map((m) => (
                        <button
                          type="button"
                          key={m.id ?? m.name}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setMechanicInput(m.name);
                            setMechanicOpen(false);
                          }}
                          className={optionCls}
                        >
                          <span className="flex items-center gap-2 font-semibold">
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-lg text-[12px] font-black ${t.chipNavy}`}
                            >
                              {m.name?.charAt(0)?.toUpperCase()}
                            </span>
                            {m.name}
                          </span>
                          {m.role && (
                            <span
                              className={`rounded-md border px-1.5 text-[12px] font-bold uppercase ${t.inner} ${t.muted}`}
                            >
                              {m.role}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <FieldLabel label="Payment status" isDark={isDark} />
                  <div
                    className={`flex rounded-xl border-2 p-1 ${isDark ? "border-white/10" : "border-[#CBD5E1]"}`}
                  >
                    {["Pending", "Paid"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={seg(form.status === s)}
                        onClick={() => setForm((f) => ({ ...f, status: s }))}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <FieldLabel label="Priority" isDark={isDark} />
                  <div
                    className={`flex rounded-xl border-2 p-1 ${isDark ? "border-white/10" : "border-[#CBD5E1]"}`}
                  >
                    {["Normal", "Urgent"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={
                          p === "Urgent" && form.priority === "Urgent"
                            ? "h-8 flex-1 rounded-lg bg-red-600 text-[12px] font-black uppercase tracking-wider text-white"
                            : seg(form.priority === p)
                        }
                        onClick={() => setForm((f) => ({ ...f, priority: p }))}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <FieldLabel label="Vehicle in" required isDark={isDark} />
                  <input
                    type="datetime-local"
                    name="serviceInDate"
                    value={form.serviceInDate}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </div>
                <div>
                  <FieldLabel label="Expected delivery" isDark={isDark} />
                  <input
                    type="datetime-local"
                    name="expectedDelivery"
                    value={form.expectedDelivery}
                    min={form.serviceInDate || undefined}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2 md:col-span-1">
                  <FieldLabel label="Vehicle out" isDark={isDark} />
                  <input
                    type="datetime-local"
                    name="serviceOutDate"
                    value={form.serviceOutDate}
                    min={form.serviceInDate || undefined}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </div>
              </div>
            </SectionCard>

            {/* 03 sub-services */}
            <SectionCard
              isDark={isDark}
              icon={FiLayers}
              step="03"
              title="Work included"
              subtitle={
                form.categoryId
                  ? "Pick or type the jobs to be done"
                  : "Choose a category first to see suggestions"
              }
            >
              <div className="space-y-2">
                {selectedSubServices.map((sub, idx) => {
                  const showMenu = activeSuggestionIndex === idx;
                  const typed = sub.inputValue.trim();
                  const canCreate =
                    typed &&
                    form.categoryId &&
                    !subServiceSuggestions.some(
                      (s) => s.name.toLowerCase() === typed.toLowerCase(),
                    );
                  return (
                    <div key={idx} className="flex items-start gap-2">
                      <span
                        className={`mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[12px] font-black ${t.chipNavy}`}
                      >
                        {idx + 1}
                      </span>
                      <div className="relative flex-1">
                        <input
                          value={sub.inputValue}
                          onChange={(e) =>
                            handleSubServiceInputChange(idx, e.target.value)
                          }
                          onFocus={() => {
                            setActiveSuggestionIndex(idx);
                            if (!typed) searchSubServices("");
                          }}
                          onBlur={() =>
                            setTimeout(
                              () =>
                                setActiveSuggestionIndex((cur) =>
                                  cur === idx ? null : cur,
                                ),
                              150,
                            )
                          }
                          placeholder="e.g. Oil change, wheel alignment"
                          autoComplete="off"
                          className={`${inputCls} ${sub.id ? "pr-9" : ""}`}
                        />
                        {sub.id && (
                          <FiCheck
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"
                            size={16}
                          />
                        )}
                        {showMenu &&
                          (subServiceSuggestions.length > 0 || canCreate) && (
                            <div className={menuCls}>
                              {subServiceSuggestions.map((s) => (
                                <button
                                  type="button"
                                  key={s.id}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => pickSubService(idx, s)}
                                  className={optionCls}
                                >
                                  <span className="font-semibold">
                                    {s.name}
                                  </span>
                                </button>
                              ))}
                              {canCreate && (
                                <button
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setPendingSubServiceIndex(idx);
                                    setActiveSuggestionIndex(null);
                                  }}
                                  className={`${optionCls} border-t-2 ${t.line}`}
                                >
                                  <span className="flex items-center gap-2 font-semibold">
                                    <FiPlus
                                      className="text-green-500"
                                      size={14}
                                    />{" "}
                                    Create "{typed}"
                                  </span>
                                </button>
                              )}
                            </div>
                          )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSubServiceRow(idx)}
                        aria-label="Remove"
                        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={addSubServiceRow}
                className={`${btnBase} mt-3 h-9 border-2 px-3 ${t.btnGhost}`}
              >
                <FiPlus size={14} /> Add work
              </button>
            </SectionCard>

            {/* 04 parts & labour */}
            <SectionCard
              isDark={isDark}
              icon={FiPackage}
              step="04"
              title="Parts & labour"
              subtitle="Search inventory or type a custom part"
              right={
                <span className={`text-[12px] font-bold ${t.muted}`}>
                  {fmtMoney(totalAmount)}
                </span>
              }
            >
              {/* column labels – desktop */}
              <div className="mb-2 hidden grid-cols-12 gap-2 px-1 text-[12px] font-black uppercase tracking-wider text-slate-400 xl:grid">
                <span className="col-span-2">Type</span>
                <span className="col-span-4">Item</span>
                <span className="col-span-1">Qty</span>
                <span className="col-span-2">Price</span>
                <span className="col-span-1">CGST%</span>
                <span className="col-span-1">SGST%</span>
                <span className="col-span-1 text-right">Total</span>
              </div>

              <div className="space-y-2">
                {costItems.map((row, i) => {
                  const c = rowCalc(row);
                  const linked = row.itemCode
                    ? inventory.find((x) => x.itemCode === row.itemCode)
                    : null;
                  const overStock =
                    linked && num(row.quantity) > num(linked.quantity);
                  return (
                    <div
                      key={i}
                      className={`rounded-xl border-2 p-3 xl:p-2 ${t.inner}`}
                    >
                      <div className="grid grid-cols-6 gap-2 xl:grid-cols-12 xl:items-start">
                        {/* type */}
                        <div className="col-span-4 xl:col-span-2">
                          <span className="mb-1 block text-[12px] font-bold uppercase tracking-wider text-slate-400 xl:hidden">
                            Type
                          </span>
                          <div
                            className={`flex h-10 rounded-xl border-2 p-1 ${isDark ? "border-white/10" : "border-[#CBD5E1] bg-white"}`}
                          >
                            <button
                              type="button"
                              className={seg(row.type === "part")}
                              onClick={() => setRowType(i, "part")}
                            >
                              Part
                            </button>
                            <button
                              type="button"
                              className={seg(row.type === "labor")}
                              onClick={() => setRowType(i, "labor")}
                            >
                              Labour
                            </button>
                          </div>
                        </div>
                        <div className="col-span-2 flex justify-end xl:hidden">
                          <button
                            type="button"
                            onClick={() => removeCostRow(i)}
                            aria-label="Remove item"
                            className="mt-5 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>

                        {/* name */}
                        <div className="col-span-6 xl:col-span-4">
                          <span className="mb-1 block text-[12px] font-bold uppercase tracking-wider text-slate-400 xl:hidden">
                            {row.type === "labor"
                              ? "Labour description"
                              : "Part"}
                          </span>
                          {row.type === "part" ? (
                            <PartAutocomplete
                              value={row.name}
                              isDark={isDark}
                              inventory={inventory}
                              selectedCode={row.itemCode}
                              onTextChange={(text) =>
                                updateCostRow(i, {
                                  name: text,
                                  itemCode: null,
                                  inventoryId: null,
                                })
                              }
                              onSelect={(item) =>
                                updateCostRow(i, {
                                  name: item.itemName,
                                  unitPrice: item.sellingPrice ?? "",
                                  itemCode: item.itemCode,
                                  inventoryId: item.id,
                                })
                              }
                            />
                          ) : (
                            <input
                              value={row.name}
                              onChange={(e) =>
                                updateCostRow(i, { name: e.target.value })
                              }
                              placeholder="e.g. Engine tuning labour"
                              className={smallInput}
                            />
                          )}
                        </div>

                        {/* qty */}
                        <div className="col-span-2 xl:col-span-1">
                          <span className="mb-1 block text-[12px] font-bold uppercase tracking-wider text-slate-400 xl:hidden">
                            Qty
                          </span>
                          <input
                            type="number"
                            min="1"
                            inputMode="numeric"
                            value={row.quantity}
                            onChange={(e) =>
                              updateCostRow(i, { quantity: e.target.value })
                            }
                            className={`${smallInput} ${overStock ? "!border-red-500" : ""}`}
                          />
                        </div>
                        {/* price */}
                        <div className="col-span-4 xl:col-span-2">
                          <span className="mb-1 block text-[12px] font-bold uppercase tracking-wider text-slate-400 xl:hidden">
                            Unit price
                          </span>
                          <input
                            type="number"
                            min="0"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={row.unitPrice}
                            onChange={(e) =>
                              updateCostRow(i, { unitPrice: e.target.value })
                            }
                            className={smallInput}
                          />
                        </div>
                        {/* gst */}
                        <div className="col-span-2 xl:col-span-1">
                          <span className="mb-1 block text-[12px] font-bold uppercase tracking-wider text-slate-400 xl:hidden">
                            CGST %
                          </span>
                          <input
                            type="number"
                            min="0"
                            inputMode="decimal"
                            placeholder="0"
                            value={row.cgstRate}
                            onChange={(e) =>
                              updateCostRow(i, { cgstRate: e.target.value })
                            }
                            className={smallInput}
                          />
                        </div>
                        <div className="col-span-2 xl:col-span-1">
                          <span className="mb-1 block text-[12px] font-bold uppercase tracking-wider text-slate-400 xl:hidden">
                            SGST %
                          </span>
                          <input
                            type="number"
                            min="0"
                            inputMode="decimal"
                            placeholder="0"
                            value={row.sgstRate}
                            onChange={(e) =>
                              updateCostRow(i, { sgstRate: e.target.value })
                            }
                            className={smallInput}
                          />
                        </div>
                        {/* total + delete (desktop) */}
                        <div className="col-span-2 flex items-center justify-end gap-1 xl:col-span-1 xl:h-10">
                          <div className="text-right">
                            <span className="block text-[12px] font-bold uppercase tracking-wider text-slate-400 xl:hidden">
                              Total
                            </span>
                            <span
                              className={`text-[14px] font-black ${t.heading}`}
                            >
                              {fmtMoney(c.total)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCostRow(i)}
                            aria-label="Remove item"
                            className="ml-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-500 hover:bg-red-500/10 xl:flex"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </div>
                      {overStock && (
                        <p className="mt-1.5 text-[12px] font-bold text-red-500">
                          Only {linked.quantity} {linked.unit || "pcs"} in stock
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => addCostRow("part")}
                  className={`${btnBase} h-9 px-3 ${t.btnPrimary}`}
                >
                  <FiPlus size={14} /> Add part
                </button>
                <button
                  type="button"
                  onClick={() => addCostRow("labor")}
                  className={`${btnBase} h-9 border-2 px-3 ${t.btnGhost}`}
                >
                  <FiPlus size={14} /> Add labour
                </button>
              </div>
            </SectionCard>

            {/* 05 notes & photos */}
            <SectionCard
              isDark={isDark}
              icon={FiEdit3}
              step="05"
              title="Notes & photos"
              subtitle="Customer complaint, staff notes and pictures"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel label="Customer notes" isDark={isDark} />
                  <textarea
                    name="notes"
                    rows={3}
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="What the customer reported…"
                    className={textArea}
                  />
                </div>
                <div>
                  <FieldLabel
                    label="Internal notes (staff only)"
                    isDark={isDark}
                  />
                  <textarea
                    name="internalNotes"
                    rows={3}
                    value={form.internalNotes}
                    onChange={handleChange}
                    placeholder="Special instructions for the team…"
                    className={textArea}
                  />
                </div>
              </div>

              <div className="mt-4">
                <FieldLabel
                  label={`Photos (${existingMedia.length + media.length})`}
                  isDark={isDark}
                />
                <input
                  ref={galleryRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    setMedia((p) => [
                      ...p,
                      ...Array.from(e.target.files || []),
                    ]);
                    e.target.value = "";
                  }}
                />
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    setMedia((p) => [
                      ...p,
                      ...Array.from(e.target.files || []),
                    ]);
                    e.target.value = "";
                  }}
                />
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
                  {existingMedia.map((file) => (
                    <div
                      key={file.id}
                      className={`relative aspect-square overflow-hidden rounded-xl border-2 ${t.inner}`}
                    >
                      <img
                        src={file.mediaUrl}
                        alt={file.fileName || "Photo"}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 rounded bg-[#000814]/70 px-1 text-[12px] font-bold text-white">
                        Saved
                      </span>
                    </div>
                  ))}
                  {mediaPreviews.map((src, index) => (
                    <div
                      key={src}
                      className={`relative aspect-square overflow-hidden rounded-xl border-2 ${t.inner}`}
                    >
                      <img
                        src={src}
                        alt="New photo"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setMedia((prev) => prev.filter((_, i) => i !== index))
                        }
                        aria-label="Remove photo"
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-lg bg-red-600 text-white shadow-lg"
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => galleryRef.current?.click()}
                    className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-[12px] font-bold ${t.inner} ${t.heading}`}
                  >
                    <FiImage size={16} /> Gallery
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraRef.current?.click()}
                    className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-[12px] font-bold ${t.inner} ${t.heading}`}
                  >
                    <FiCamera size={16} /> Camera
                  </button>
                </div>
              </div>
            </SectionCard>

            {/* summary on phone / tablet */}
            <div className="lg:hidden">{summary}</div>
          </div>

          {/* summary on desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-20">{summary}</div>
          </aside>
        </div>

        {/* sticky save bar – phone/tablet */}
        <div
          className={`fixed inset-x-0 z-30 border-t-2 p-3 backdrop-blur lg:hidden ${isDark ? "border-white/5 bg-[#000814]/95" : "border-[#CBD5E1] bg-white/95"}`}
          style={{ bottom: "calc(66px + env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                Grand total
              </p>
              <p className={`truncate text-[16px] font-black ${t.heading}`}>
                {fmtMoney(grandTotal)}
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`${btnBase} ml-auto h-11 px-5 ${t.btnPrimary} shadow-xl`}
            >
              {loading ? (
                <FiLoader size={14} className="animate-spin" />
              ) : (
                <FiSave size={14} />
              )}
              {loading ? "Saving…" : id ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        isDark={isDark}
        open={pendingSubServiceIndex !== null}
        tone="success"
        title="Create sub-service?"
        message={`Add "${selectedSubServices[pendingSubServiceIndex]?.inputValue?.trim() || ""}" to this category so you can reuse it later.`}
        confirmText="Create"
        busy={creatingSubService}
        onCancel={() => setPendingSubServiceIndex(null)}
        onConfirm={createNewSubService}
      />
    </div>
  );
}
