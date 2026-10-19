// client/src/pages/billing/BillingForm.jsx  (Car CRM – create / edit invoice)
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import {
  FiFileText,
  FiCalendar,
  FiUser,
  FiTool,
  FiSave,
  FiArrowLeft,
  FiHash,
  FiAlertCircle,
  FiCreditCard,
  FiPlus,
  FiTrash2,
  FiSearch,
  FiEye,
  FiLoader,
  FiPackage,
  FiX,
  FiEdit3,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import { Toaster, toast } from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";
import PartAutocomplete from "../services/PartAutocomplete";
import {
  SectionCard,
  FieldLabel,
  PageHeading,
  Plate,
  tk,
  btnBase,
} from "../clients/components/clientUi";
import {
  num,
  rowTotal,
  calcTotals,
  numberToWords,
  money,
} from "./billingUtils";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const fetchWithAuth = async (url, options = {}) => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("authToken");
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    window.location.href = "/login";
  }
  return response;
};

const generateTempInvoiceNumber = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `INV-${dateStr}-${random}`;
};

const emptyRow = (type = "part") => ({
  type,
  name: "",
  quantity: 1,
  unitPrice: "",
  cgstRate: "",
  sgstRate: "",
});
const toDateInput = (d) => (d ? String(d).slice(0, 10) : "");
const listOf = (d) => (Array.isArray(d) ? d : d?.data || d?.clients || []);

const getInitialFormState = (isEditMode, preSelectedClientId, invoiceData) => {
  const today = new Date().toISOString().split("T")[0];
  const base = {
    invoiceNumber: generateTempInvoiceNumber(),
    date: today,
    customerId: preSelectedClientId || "",
    vehicle: "",
    mechanic: "",
    description: "",
    partsCost: 0,
    partsGst: 0,
    laborCost: 0,
    laborGst: 0,
    taxes: 0,
    discounts: 0,
    netAmount: 0,
    discountAmount: 0,
    amountAfterDiscount: 0,
    roundedAmount: 0,
    roundOffAmount: 0,
    total: 0,
    paymentMode: "",
    status: "Pending",
    dueDate: "",
    notes: "",
    serviceType: "",
    serviceCategory: "",
    serviceSubCategory: "",
    serviceNotes: "",
    costItems: [],
  };
  if (!(isEditMode && invoiceData)) return base;
  return {
    ...base,
    invoiceNumber: invoiceData.invoiceNumber || base.invoiceNumber,
    date: toDateInput(invoiceData.date || invoiceData.createdAt) || today,
    customerId:
      invoiceData.clientId ||
      invoiceData.client?.id ||
      preSelectedClientId ||
      "",
    vehicle: invoiceData.vehicle || "",
    mechanic: invoiceData.mechanic || "",
    description: invoiceData.description || "",
    partsCost: invoiceData.partsCost || 0,
    partsGst: invoiceData.partsGst || 0,
    laborCost: invoiceData.laborCost || 0,
    laborGst: invoiceData.laborGst || 0,
    taxes: invoiceData.taxes || 0,
    discounts:
      invoiceData.discounts ??
      invoiceData.discount ??
      invoiceData.discountAmount ??
      0,
    paymentMode: invoiceData.paymentMode || "",
    status: invoiceData.status || "Pending",
    dueDate: toDateInput(invoiceData.dueDate),
    notes: invoiceData.notes || "",
    serviceType: invoiceData.serviceType || "",
    serviceCategory: invoiceData.serviceCategory || "",
    serviceSubCategory: invoiceData.serviceSubCategory || "",
    serviceNotes: invoiceData.serviceNotes || "",
    costItems: (invoiceData.invoiceCostItems || []).map(
      ({ id, invoiceId, createdAt, updatedAt, ...r }) => r,
    ),
  };
};

export default function BillingForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const t = tk(isDark);
  const formRef = useRef(null);
  const topRef = useRef(null);

  const preSelectedClientId =
    location.state?.clientId || location.state?.customerId || "";
  const serviceId = location.state?.serviceId;
  const restoreForm = location.state?.restoreForm;
  const invoiceDraft = location.state?.invoiceDraft;
  const autoSubmit = location.state?.autoSubmit;
  // remember that we came back from the preview (history state is cleared right after)
  const restoredRef = useRef(Boolean(restoreForm && invoiceDraft));

  const [form, setForm] = useState(() =>
    getInitialFormState(isEditMode, preSelectedClientId, null),
  );
  const [clients, setClients] = useState([]);
  const [clientObj, setClientObj] = useState(null);
  const [clientQuery, setClientQuery] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [clientResults, setClientResults] = useState([]);
  const clientBoxRef = useRef(null);
  const [inventory, setInventory] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(
    isEditMode && !restoredRef.current,
  );
  const [error, setError] = useState(null);

  const set = (patch) => setForm((p) => ({ ...p, ...patch }));

  /* ---------- load ---------- */
  useEffect(() => {
    fetchWithAuth(`${API_URL}/api/clients?page=1&limit=200`)
      .then((r) => r.json())
      .then((d) => setClients(listOf(d)))
      .catch(() => setError("Failed to load clients"));
    fetchWithAuth(`${API_URL}/api/user/profile`)
      .then((r) => r.json())
      .then(setUserProfile)
      .catch(() => {});
    fetchWithAuth(`${API_URL}/api/car-inventory`)
      .then((r) => r.json())
      .then((d) => setInventory(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // selected client object (fetch it if it's not in the first 200)
  useEffect(() => {
    if (!form.customerId) return setClientObj(null);
    const found = clients.find((c) => String(c.id) === String(form.customerId));
    if (found) return setClientObj(found);
    if (clientObj && String(clientObj.id) === String(form.customerId)) return;
    fetchWithAuth(`${API_URL}/api/clients/${form.customerId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => c && setClientObj(c))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.customerId, clients]);

  // client search
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
    const h = setTimeout(() => {
      fetchWithAuth(
        `${API_URL}/api/clients?limit=20&q=${encodeURIComponent(clientQuery.trim())}`,
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
  }, [clientQuery, clientOpen, clients]);

  useEffect(() => {
    const onDown = (e) => {
      if (clientBoxRef.current && !clientBoxRef.current.contains(e.target))
        setClientOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // edit mode
  useEffect(() => {
    if (!isEditMode || restoredRef.current) return;
    fetchWithAuth(`${API_URL}/api/invoices/${id}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.message || "Failed to load invoice");
        setForm(getInitialFormState(true, preSelectedClientId, data));
        if (data.client) setClientObj(data.client);
      })
      .catch((e) => setError(e.message || "Failed to load invoice data"))
      .finally(() => setLoadingInvoice(false));
  }, [isEditMode, id, preSelectedClientId]);

  // coming back from the proforma preview
  useEffect(() => {
    if (!restoredRef.current) return;
    const { client, userProfile: _u, ...draft } = invoiceDraft;
    setForm((prev) => ({ ...prev, ...draft })); // keep defaults for any missing fields
    if (client) setClientObj(client);
    // clear history state so a refresh doesn't re-submit
    navigate(location.pathname, { replace: true, state: {} });
    if (autoSubmit) setTimeout(() => formRef.current?.requestSubmit(), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // service → invoice
  useEffect(() => {
    if (!serviceId || isEditMode || restoredRef.current) return;
    fetchWithAuth(`${API_URL}/api/services/${serviceId}/billing`)
      .then((r) => r.json())
      .then((data) => {
        setForm((prev) => ({
          ...prev,
          customerId: data.client?.id || prev.customerId,
          vehicle: [data.client?.vehicleMake, data.client?.vehicleModel]
            .filter(Boolean)
            .join(" "),
          serviceType: data.category?.name || "",
          serviceCategory: data.category?.name || "",
          mechanic: data.assignedMechanic || "",
          serviceSubCategory: data.subServices?.length
            ? data.subServices.map((s) => s.name).join(", ")
            : "",
          serviceNotes: data.notes || "",
          discounts: num(data.discount) > 0 ? data.discount : prev.discounts,
          partsCost: 0,
          laborCost: 0,
          costItems: data.costItems || [],
        }));
        if (data.client) setClientObj(data.client);
      })
      .catch(() => setError("Failed to load service billing data"));
  }, [serviceId, isEditMode]);

  /* ---------- totals (derived) ---------- */
  const tot = useMemo(
    () => calcTotals(form.costItems, form.discounts),
    [form.costItems, form.discounts],
  );
  const totalsPatch = {
    netAmount: tot.netAmount,
    discountAmount: tot.discountAmount,
    amountAfterDiscount: tot.amountAfterDiscount,
    roundedAmount: tot.roundedAmount,
    roundOffAmount: tot.roundOffAmount,
  };

  /* ---------- items ---------- */
  const updateCostItem = (index, patch) =>
    setForm((p) => ({
      ...p,
      costItems: p.costItems.map((r, i) =>
        i === index ? { ...r, ...patch } : r,
      ),
    }));
  const addCostItem = (type) =>
    setForm((p) => ({ ...p, costItems: [...p.costItems, emptyRow(type)] }));
  const removeCostItem = (index) =>
    setForm((p) => ({
      ...p,
      costItems: p.costItems.filter((_, i) => i !== index),
    }));

  /* ---------- submit / preview ---------- */
  const fail = (msg) => {
    setError(msg);
    toast.error(msg);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerId) return fail("Please select a customer.");
    if (
      !form.costItems.some(
        (r) => String(r.name || "").trim() || num(r.unitPrice) > 0,
      )
    )
      return fail("Add at least one item.");
    setLoading(true);
    setError(null);
    try {
      const { client, userProfile: _u, ...clean } = form;
      const payload = {
        ...clean,
        ...totalsPatch,
        clientId: Number(form.customerId),
        grandTotal: Number(tot.roundedAmount),
        totalAmount: Number(tot.roundedAmount),
        costItems: form.costItems
          .filter((r) => String(r.name || "").trim() || num(r.unitPrice) > 0)
          .map(({ itemCode, inventoryId, ...r }) => r), // frontend-only inventory link
      };
      const res = await fetchWithAuth(
        isEditMode
          ? `${API_URL}/api/invoices/${id}`
          : `${API_URL}/api/invoices`,
        {
          method: isEditMode ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to save invoice");
      const newId = data?.invoice?.id ?? data?.id ?? id;
      toast.success(isEditMode ? "Invoice updated" : "Invoice created");
      navigate(newId ? `/billing/${newId}` : "/billing");
    } catch (err) {
      fail(err.message || "Failed to save invoice");
    } finally {
      setLoading(false);
    }
  };

  const openPreview = () => {
    if (!form.customerId)
      return fail("Please select a customer before previewing.");
    navigate("/billing/preview", {
      state: {
        invoiceDraft: {
          ...form,
          ...totalsPatch,
          client: clientObj || null,
          userProfile,
        },
      },
    });
  };

  /* ---------- render ---------- */
  if (loadingInvoice)
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 lg:ml-16">
        <FiLoader className={`animate-spin ${t.heading}`} size={24} />
        <p className={`text-[14px] font-semibold ${t.muted}`}>
          Loading invoice…
        </p>
      </div>
    );

  const inputCls = `h-11 w-full rounded-xl border-2 px-3.5 text-[14px] font-semibold outline-none transition ${t.input} ${
    isDark ? "[&>option]:bg-[#000814] [color-scheme:dark]" : ""
  }`;
  const smallInput = `h-10 w-full rounded-xl border-2 px-3 text-[14px] font-semibold outline-none transition ${t.input}`;
  const textArea = `w-full resize-none rounded-xl border-2 px-3.5 py-2.5 text-[14px] font-medium outline-none transition ${t.input}`;
  const seg = (on) =>
    `h-8 flex-1 rounded-lg text-[12px] font-black uppercase tracking-wider transition ${
      on
        ? t.chipNavy
        : isDark
          ? "text-slate-400 hover:text-white"
          : "text-slate-500 hover:text-[#001F3F]"
    }`;
  const label = (txt) => (
    <span className="mb-1 block text-[12px] font-bold uppercase tracking-wider text-slate-400 xl:hidden">
      {txt}
    </span>
  );

  const taxLine = (name, tax, base) =>
    base > 0 &&
    tax > 0 && (
      <div className="flex justify-between gap-2" key={name}>
        <span className={t.muted}>
          {name} @ {((tax / base) * 100).toFixed(2)}% on {money(base)}
        </span>
        <span className={`font-bold ${t.heading}`}>{money(tax)}</span>
      </div>
    );

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
          Grand total
        </h2>
      </div>
      <div className="space-y-3 p-4 text-[14px]">
        <div className="space-y-1.5 text-[12px]">
          {taxLine("CGST (parts)", tot.partsCgst, tot.partsAmount)}
          {taxLine("SGST (parts)", tot.partsSgst, tot.partsAmount)}
          {taxLine("CGST (labour)", tot.laborCgst, tot.laborAmount)}
          {taxLine("SGST (labour)", tot.laborSgst, tot.laborAmount)}
          {tot.tax === 0 && <p className={t.muted}>No GST added</p>}
        </div>
        <div className={`space-y-1.5 border-t-2 pt-3 ${t.line}`}>
          <div className="flex justify-between">
            <span className={t.muted}>Net amount</span>
            <span className={`font-bold ${t.heading}`}>
              {money(tot.netAmount)}
            </span>
          </div>
          <div>
            <FieldLabel label="Discount (₹)" isDark={isDark} />
            <input
              type="number"
              min="0"
              inputMode="decimal"
              value={form.discounts}
              onChange={(e) => set({ discounts: e.target.value })}
              placeholder="0.00"
              className={smallInput}
            />
          </div>
          <div className="flex justify-between">
            <span className={t.muted}>After discount</span>
            <span className={`font-bold ${t.heading}`}>
              {money(tot.amountAfterDiscount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={t.muted}>Round off</span>
            <span className={`font-bold ${t.heading}`}>
              − {money(tot.roundOffAmount)}
            </span>
          </div>
        </div>
        <div className={`rounded-xl border-2 p-3 ${t.inner}`}>
          <div className="flex items-end justify-between">
            <span className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400">
              Payable
            </span>
            <span className={`text-[16px] font-black ${t.heading}`}>
              {money(tot.roundedAmount)}
            </span>
          </div>
          <p className={`mt-1 text-[12px] italic ${t.muted}`}>
            Rupees {numberToWords(tot.roundedAmount)}
          </p>
        </div>
        <div className="hidden flex-col gap-2 lg:flex">
          <button
            type="button"
            onClick={openPreview}
            className={`${btnBase} h-11 border-2 ${t.btnGhost}`}
          >
            <FiEye size={14} /> Preview proforma
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`${btnBase} h-11 ${t.btnPrimary} shadow-xl`}
          >
            {loading ? (
              <FiLoader size={14} className="animate-spin" />
            ) : (
              <FiSave size={14} />
            )}
            {loading
              ? "Saving…"
              : isEditMode
                ? "Update invoice"
                : "Create invoice"}
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
        ref={formRef}
        onSubmit={handleSubmit}
        className="mx-auto max-w-7xl space-y-4 pb-28 sm:space-y-5 lg:pb-8"
      >
        <div className="space-y-3">
          <Link
            to="/billing"
            className={`inline-flex items-center gap-1.5 text-[12px] font-black uppercase tracking-[0.15em] ${t.muted} ${
              isDark ? "hover:text-white" : "hover:text-[#001F3F]"
            }`}
          >
            <FiArrowLeft size={14} /> Billing
          </Link>
          <PageHeading
            isDark={isDark}
            badge={
              isEditMode
                ? "Editing invoice"
                : serviceId
                  ? `From service #${serviceId}`
                  : "New invoice"
            }
            title={isEditMode ? "Edit" : "Create"}
            accent="invoice."
            subtitle={
              clientObj
                ? `Invoice for ${clientObj.fullName}`
                : "Pick the customer, check the items, then generate."
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
              onClick={() => setError(null)}
              aria-label="Dismiss"
            >
              <FiX size={14} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-4 sm:space-y-5">
            {/* 01 invoice & customer */}
            <SectionCard
              isDark={isDark}
              icon={FiFileText}
              step="01"
              title="Invoice & customer"
              subtitle="Number, date and who is paying"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel
                    icon={<FiHash size={12} />}
                    label="Invoice number"
                    isDark={isDark}
                  />
                  <input
                    value={form.invoiceNumber}
                    readOnly
                    className={`${inputCls} cursor-default font-mono opacity-80`}
                  />
                </div>
                <div>
                  <FieldLabel
                    icon={<FiCalendar size={12} />}
                    label="Invoice date"
                    isDark={isDark}
                  />
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => set({ date: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="mt-4">
                {clientObj ? (
                  <div
                    className={`flex flex-wrap items-center gap-3 rounded-xl border-2 p-3 ${t.inner}`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[16px] font-black ${t.chipNavy}`}
                    >
                      {clientObj.fullName?.charAt(0)?.toUpperCase() || "C"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-[14px] font-black ${t.heading}`}
                      >
                        {clientObj.fullName}
                      </p>
                      <p className={`truncate text-[12px] ${t.muted}`}>
                        {[clientObj.vehicleMake, clientObj.vehicleModel]
                          .filter(Boolean)
                          .join(" ") || "Vehicle"}
                        {clientObj.phone ? ` · ${clientObj.phone}` : ""}
                      </p>
                    </div>
                    <Plate value={clientObj.regNumber} />
                    <button
                      type="button"
                      onClick={() => {
                        set({ customerId: "" });
                        setClientObj(null);
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
                      icon={<FiUser size={12} />}
                      label="Customer"
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
                      <div
                        className={`absolute z-40 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border-2 shadow-2xl ${t.menu}`}
                      >
                        {clientResults.length ? (
                          clientResults.map((c) => (
                            <button
                              type="button"
                              key={c.id}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                set({
                                  customerId: c.id,
                                  vehicle:
                                    form.vehicle ||
                                    [c.vehicleMake, c.vehicleModel]
                                      .filter(Boolean)
                                      .join(" "),
                                });
                                setClientObj(c);
                                setClientQuery("");
                                setClientOpen(false);
                              }}
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
                                  {c.phone ? ` · ${c.phone}` : ""}
                                </span>
                              </span>
                              <Plate value={c.regNumber} size="sm" />
                            </button>
                          ))
                        ) : (
                          <div className={`px-3 py-3 text-[14px] ${t.muted}`}>
                            No customer found.{" "}
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
              </div>
            </SectionCard>

            {/* 02 service details */}
            <SectionCard
              isDark={isDark}
              icon={FiTool}
              step="02"
              title="Service details"
              subtitle="What shows on the invoice header"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  ["serviceType", "Service type", "e.g. General service"],
                  ["serviceCategory", "Category", "e.g. Periodic maintenance"],
                  [
                    "serviceSubCategory",
                    "Work included",
                    "e.g. Oil change, alignment",
                  ],
                  ["vehicle", "Vehicle", "Make & model"],
                  ["mechanic", "Mechanic", "Who did the work"],
                ].map(([key, lbl, ph]) => (
                  <div key={key}>
                    <FieldLabel label={lbl} isDark={isDark} />
                    <input
                      value={form[key] || ""}
                      onChange={(e) => set({ [key]: e.target.value })}
                      placeholder={ph}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <FieldLabel label="Service notes" isDark={isDark} />
                <textarea
                  rows={3}
                  value={form.serviceNotes}
                  onChange={(e) => set({ serviceNotes: e.target.value })}
                  className={textArea}
                />
              </div>
            </SectionCard>

            {/* 03 items */}
            <SectionCard
              isDark={isDark}
              icon={FiPackage}
              step="03"
              title="Parts & labour"
              subtitle="Items billed on this invoice"
              right={
                <span className={`text-[12px] font-bold ${t.muted}`}>
                  {money(tot.netAmount)}
                </span>
              }
            >
              {form.costItems.length > 0 && (
                <div className="mb-2 hidden grid-cols-12 gap-2 px-1 text-[12px] font-black uppercase tracking-wider text-slate-400 xl:grid">
                  <span className="col-span-2">Type</span>
                  <span className="col-span-4">Item</span>
                  <span className="col-span-1">Qty</span>
                  <span className="col-span-2">Price</span>
                  <span className="col-span-1">CGST%</span>
                  <span className="col-span-1">SGST%</span>
                  <span className="col-span-1 text-right">Total</span>
                </div>
              )}

              <div className="space-y-2">
                {form.costItems.length === 0 && (
                  <div
                    className={`rounded-xl border-2 border-dashed px-4 py-8 text-center text-[14px] ${t.inner} ${t.muted}`}
                  >
                    No items yet — add a part or labour below.
                  </div>
                )}
                {form.costItems.map((row, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border-2 p-3 xl:p-2 ${t.inner}`}
                  >
                    <div className="grid grid-cols-6 gap-2 xl:grid-cols-12 xl:items-start">
                      <div className="col-span-4 xl:col-span-2">
                        {label("Type")}
                        <div
                          className={`flex h-10 rounded-xl border-2 p-1 ${isDark ? "border-white/10" : "border-[#CBD5E1] bg-white"}`}
                        >
                          <button
                            type="button"
                            className={seg(row.type !== "labor")}
                            onClick={() => updateCostItem(i, { type: "part" })}
                          >
                            Part
                          </button>
                          <button
                            type="button"
                            className={seg(row.type === "labor")}
                            onClick={() => updateCostItem(i, { type: "labor" })}
                          >
                            Labour
                          </button>
                        </div>
                      </div>
                      <div className="col-span-2 flex justify-end xl:hidden">
                        <button
                          type="button"
                          onClick={() => removeCostItem(i)}
                          aria-label="Remove item"
                          className="mt-5 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                      <div className="col-span-6 xl:col-span-4">
                        {label(
                          row.type === "labor" ? "Labour / mechanic" : "Part",
                        )}
                        {row.type === "labor" ? (
                          <input
                            value={row.name}
                            onChange={(e) =>
                              updateCostItem(i, { name: e.target.value })
                            }
                            placeholder="e.g. Engine labour"
                            className={smallInput}
                          />
                        ) : (
                          <PartAutocomplete
                            value={row.name}
                            isDark={isDark}
                            inventory={inventory}
                            selectedCode={row.itemCode}
                            onTextChange={(text) =>
                              updateCostItem(i, { name: text, itemCode: null })
                            }
                            onSelect={(item) =>
                              updateCostItem(i, {
                                name: item.itemName,
                                unitPrice: item.sellingPrice ?? "",
                                itemCode: item.itemCode,
                              })
                            }
                          />
                        )}
                      </div>
                      <div className="col-span-2 xl:col-span-1">
                        {label("Qty")}
                        <input
                          type="number"
                          min="1"
                          inputMode="numeric"
                          value={row.quantity}
                          onChange={(e) =>
                            updateCostItem(i, { quantity: e.target.value })
                          }
                          className={smallInput}
                        />
                      </div>
                      <div className="col-span-4 xl:col-span-2">
                        {label("Unit price")}
                        <input
                          type="number"
                          min="0"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={row.unitPrice}
                          onChange={(e) =>
                            updateCostItem(i, { unitPrice: e.target.value })
                          }
                          className={smallInput}
                        />
                      </div>
                      <div className="col-span-2 xl:col-span-1">
                        {label("CGST %")}
                        <input
                          type="number"
                          min="0"
                          inputMode="decimal"
                          placeholder="0"
                          value={row.cgstRate}
                          onChange={(e) =>
                            updateCostItem(i, { cgstRate: e.target.value })
                          }
                          className={smallInput}
                        />
                      </div>
                      <div className="col-span-2 xl:col-span-1">
                        {label("SGST %")}
                        <input
                          type="number"
                          min="0"
                          inputMode="decimal"
                          placeholder="0"
                          value={row.sgstRate}
                          onChange={(e) =>
                            updateCostItem(i, { sgstRate: e.target.value })
                          }
                          className={smallInput}
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-1 xl:col-span-1 xl:h-10">
                        <div className="text-right">
                          <span className="block text-[12px] font-bold uppercase tracking-wider text-slate-400 xl:hidden">
                            Total
                          </span>
                          <span
                            className={`text-[14px] font-black ${t.heading}`}
                          >
                            {money(rowTotal(row))}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCostItem(i)}
                          aria-label="Remove item"
                          className="ml-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-500 hover:bg-red-500/10 xl:flex"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => addCostItem("part")}
                  className={`${btnBase} h-9 px-3 ${t.btnPrimary}`}
                >
                  <FiPlus size={14} /> Add part
                </button>
                <button
                  type="button"
                  onClick={() => addCostItem("labor")}
                  className={`${btnBase} h-9 border-2 px-3 ${t.btnGhost}`}
                >
                  <FiPlus size={14} /> Add labour
                </button>
              </div>
            </SectionCard>

            {/* 04 payment */}
            <SectionCard
              isDark={isDark}
              icon={FiCreditCard}
              step="04"
              title="Payment"
              subtitle="Mode, status and due date"
            >
              <div className="space-y-4">
                <div>
                  <FieldLabel label="Payment mode" isDark={isDark} />
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {["Cash", "Card", "UPI", "Bank Transfer"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() =>
                          set({ paymentMode: form.paymentMode === m ? "" : m })
                        }
                        className={`h-10 rounded-xl border-2 text-[12px] font-black uppercase tracking-wider transition ${
                          form.paymentMode === m
                            ? `border-transparent ${t.chipNavy}`
                            : t.btnGhost
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel label="Payment status" isDark={isDark} />
                    <select
                      value={form.status}
                      onChange={(e) => set({ status: e.target.value })}
                      className={`${inputCls} cursor-pointer`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Partially Paid">Partially paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel label="Due date" isDark={isDark} />
                    <input
                      type="date"
                      value={form.dueDate}
                      min={form.date || undefined}
                      onChange={(e) => set({ dueDate: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel
                    icon={<FiEdit3 size={12} />}
                    label="Notes on invoice"
                    isDark={isDark}
                  />
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => set({ notes: e.target.value })}
                    placeholder="Warranty, thank-you note, bank details…"
                    className={textArea}
                  />
                </div>
              </div>
            </SectionCard>

            <div className="lg:hidden">{summary}</div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-20">{summary}</div>
          </aside>
        </div>

        {/* sticky bar – phone/tablet */}
        <div
          className={`fixed inset-x-0 z-30 border-t-2 p-3 backdrop-blur lg:hidden ${isDark ? "border-white/5 bg-[#000814]/95" : "border-[#CBD5E1] bg-white/95"}`}
          style={{ bottom: "calc(66px + env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex max-w-xl items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                Payable
              </p>
              <p className={`truncate text-[16px] font-black ${t.heading}`}>
                {money(tot.roundedAmount)}
              </p>
            </div>
            <button
              type="button"
              onClick={openPreview}
              className={`${btnBase} h-11 border-2 px-3 ${t.btnGhost}`}
              aria-label="Preview"
            >
              <FiEye size={14} />
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`${btnBase} h-11 px-4 ${t.btnPrimary} shadow-xl`}
            >
              {loading ? (
                <FiLoader size={14} className="animate-spin" />
              ) : (
                <FiSave size={14} />
              )}
              {loading ? "Saving…" : isEditMode ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
