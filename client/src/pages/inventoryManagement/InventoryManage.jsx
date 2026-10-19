import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import {
  FiBox,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiAlertTriangle,
  FiCheckCircle,
  FiTrendingUp,
  FiMinusCircle,
  FiX,
  FiTruck,
  FiChevronLeft,
  FiChevronRight,
  FiXCircle,
  FiPackage,
  FiFilter,
  FiMapPin,
  FiRefreshCw,
  FiLoader,
} from "react-icons/fi";
import { Toaster, toast } from "react-hot-toast";
import { useTheme } from "../../contexts/ThemeContext";
import { currency } from "../../utils";
import {
  createInventory,
  deleteInventory,
  getInventory,
  updateInventory,
  createSupplier,
  getSuppliers,
  deductInventory,
} from "./api/inventoryApi";
import {
  tk,
  btnBase,
  Modal,
  ConfirmDialog,
  PageHeading,
} from "../clients/components/clientUi";

/* Text sizes on this page: 12px, 14px, 16px only. */

const emptyForm = {
  itemCode: "",
  itemName: "",
  category: "",
  brand: "",
  model: "",
  partNumber: "",
  supplier: "",
  supplierPhone: "",
  purchasePrice: "",
  sellingPrice: "",
  quantity: "",
  minimumStock: "5",
  unit: "pcs",
  location: "",
  description: "",
  image: "",
  status: "Available",
};

const UNITS = [
  "pcs",
  "set",
  "kit",
  "pair",
  "can",
  "bottle",
  "litre",
  "box",
  "pack",
  "tin",
];
const PAGE_SIZE_OPTIONS = [10, 30, 50, "all"];

/* ---------- stock state (uses each item's own minimum stock) ---------- */
const getStockState = (item) => {
  const qty = Number(item.quantity || 0);
  const min = Number(item.minimumStock || 0);
  if (qty === 0) return "out";
  if (qty <= min) return "low";
  return "in";
};

const STOCK = {
  in: {
    label: "In stock",
    cls: "border-green-500/30 bg-green-500/10 text-green-600",
    bar: "bg-green-500",
    icon: FiCheckCircle,
  },
  low: {
    label: "Low stock",
    cls: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    bar: "bg-amber-500",
    icon: FiAlertTriangle,
  },
  out: {
    label: "Out of stock",
    cls: "border-red-500/30 bg-red-500/10 text-red-500",
    bar: "bg-red-500",
    icon: FiXCircle,
  },
};

const StockPill = ({ state }) => {
  const s = STOCK[state];
  const Icon = s.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg border px-2 py-0.5 text-[12px] font-black uppercase tracking-wider ${s.cls}`}
    >
      <Icon size={12} /> {s.label}
    </span>
  );
};

// little bar: how full the shelf is compared with the minimum (full = 3× minimum)
const StockMeter = ({ item, isDark }) => {
  const state = getStockState(item);
  const min = Math.max(1, Number(item.minimumStock || 0));
  const pct = Math.min(
    100,
    Math.round((Number(item.quantity || 0) / (min * 3)) * 100),
  );
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-sm ${isDark ? "bg-white/10" : "bg-[#E2E8F0]"}`}
    >
      <div
        className={`h-full ${STOCK[state].bar}`}
        style={{ width: `${Math.max(state === "out" ? 0 : 6, pct)}%` }}
      />
    </div>
  );
};

const Field = ({ label, required, hint, children, className = "", isDark }) => (
  <div className={`min-w-0 ${className}`}>
    <label
      className={`mb-1.5 block text-[12px] font-bold uppercase tracking-wider ${isDark ? "text-slate-300" : "text-[#001F3F]"}`}
    >
      {label}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
    {children}
    {hint && <div className="mt-1 text-[12px] text-slate-400">{hint}</div>}
  </div>
);

// `className` controls the outer offset. Car layout: default (rail offset, layout already pads).
// Bike layout: pass className="" and the page adds its own padding.
const InventoryManage = ({ className = "lg:ml-16" }) => {
  const { isDark } = useTheme();
  const t = tk(isDark);

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [brandFilter, setBrandFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false); // supplier modal
  const [supplierData, setSupplierData] = useState({
    supplierName: "",
    supplierContact: "",
  });
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [suppliers, setSuppliers] = useState([]);

  const [deductModalOpen, setDeductModalOpen] = useState(false);
  const [deductData2, setDeductData2] = useState([
    { itemCode: "", quantity: "" },
  ]);
  const [deducting, setDeducting] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    try {
      const saved = localStorage.getItem("inventoryPageSize");
      if (saved === "all") return "all";
      const n = Number(saved);
      return PAGE_SIZE_OPTIONS.includes(n) ? n : 10;
    } catch {
      return 10;
    }
  });

  const changePageSize = (value) => {
    const next = value === "all" ? "all" : Number(value);
    setPageSize(next);
    setCurrentPage(1);
    try {
      localStorage.setItem("inventoryPageSize", String(next));
    } catch {
      /* ignore */
    }
  };

  const inputCls = `h-11 w-full rounded-xl border-2 px-3.5 text-[14px] font-semibold outline-none transition ${t.input}`;
  const selectCls = `${inputCls} cursor-pointer ${isDark ? "[&>option]:bg-[#000814]" : ""}`;

  /* ================= DATA ================= */
  const loadSuppliers = async () => {
    try {
      const response = await getSuppliers();
      setSuppliers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load suppliers", err);
    }
  };

  const loadInventory = async (quiet = false) => {
    try {
      quiet ? setRefreshing(true) : setLoading(true);
      setError("");
      if (!localStorage.getItem("token")) {
        setItems([]);
        return;
      }
      const response = await getInventory();
      const inventoryItems = Array.isArray(response?.data) ? response.data : [];
      setItems(
        inventoryItems.map((item) => ({
          id: item.id,
          rowId: item.id,
          itemCode: item.itemCode || "",
          itemName: item.itemName || "",
          category: item.category || "",
          brand: item.brand || "",
          model: item.model || "",
          partNumber: item.partNumber || "",
          supplier: item.supplier || "",
          supplierPhone: item.supplierPhone || "",
          purchasePrice: Number(item.purchasePrice || 0),
          sellingPrice: Number(item.sellingPrice || 0),
          quantity: Number(item.quantity || 0),
          minimumStock: Number(item.minimumStock || 0),
          unit: item.unit || "pcs",
          location: item.location || "",
          description: item.description || "",
          image: item.image || "",
          status: item.status || "Available",
        })),
      );
    } catch (err) {
      console.error("Failed to load inventory", err);
      setError("Unable to load inventory right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInventory();
    loadSuppliers();
  }, []);

  /* ================= DERIVED ================= */
  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(items.map((i) => i.category).filter(Boolean)),
      ).sort(),
    ],
    [items],
  );
  const brands = useMemo(
    () => [
      "All",
      ...Array.from(new Set(items.map((i) => i.brand).filter(Boolean))).sort(),
    ],
    [items],
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !q ||
        `${item.itemName} ${item.itemCode} ${item.category} ${item.supplier} ${item.brand} ${item.model} ${item.partNumber} ${item.location}`
          .toLowerCase()
          .includes(q);
      return (
        matchesSearch &&
        (categoryFilter === "All" || item.category === categoryFilter) &&
        (brandFilter === "All" || item.brand === brandFilter) &&
        (stockFilter === "All" || getStockState(item) === stockFilter)
      );
    });
  }, [items, search, categoryFilter, brandFilter, stockFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, brandFilter, stockFilter]);

  const perPage =
    pageSize === "all" ? Math.max(filteredItems.length, 1) : pageSize;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const firstIndex = (safePage - 1) * perPage;
  const lastIndex = Math.min(firstIndex + perPage, filteredItems.length);
  const currentItems = filteredItems.slice(firstIndex, lastIndex);

  const stats = useMemo(() => {
    let totalStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalValue = 0;
    items.forEach((item) => {
      const qty = Number(item.quantity || 0);
      totalStock += qty;
      totalValue += qty * Number(item.purchasePrice || 0);
      const state = getStockState(item);
      if (state === "low") lowStock += 1;
      if (state === "out") outOfStock += 1;
    });
    return {
      totalItems: items.length,
      totalStock,
      lowStock,
      outOfStock,
      totalValue,
    };
  }, [items]);

  const extraFilters =
    (categoryFilter !== "All") +
    (brandFilter !== "All") +
    (stockFilter !== "All");
  const filtersActive = search || extraFilters > 0;

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("All");
    setBrandFilter("All");
    setStockFilter("All");
  };

  /* ================= ITEM FORM ================= */
  const openAddForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const resetForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const setField = (field) => (event) =>
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (
      !formData.itemCode.trim() ||
      !formData.itemName.trim() ||
      !formData.category.trim()
    ) {
      toast.error("Item code, name and category are required.");
      return;
    }
    const code = formData.itemCode.trim().toLowerCase();
    if (
      items.some(
        (i) => i.itemCode.toLowerCase() === code && i.rowId !== editingId,
      )
    ) {
      toast.error(`Item code ${formData.itemCode.trim()} is already used.`);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        itemCode: formData.itemCode.trim(),
        itemName: formData.itemName.trim(),
        category: formData.category.trim(),
        brand: formData.brand?.trim() || "",
        model: formData.model?.trim() || "",
        partNumber: formData.partNumber?.trim() || "",
        supplier: formData.supplier?.trim() || "",
        purchasePrice: Number(formData.purchasePrice || 0),
        sellingPrice: Number(formData.sellingPrice || 0),
        quantity: Number(formData.quantity || 0),
        minimumStock: Number(formData.minimumStock || 5),
        unit: formData.unit?.trim() || "pcs",
        location: formData.location?.trim() || "",
        description: formData.description?.trim() || "",
        status: formData.status?.trim() || "Available",
      };
      if (editingId) await updateInventory(editingId, payload);
      else await createInventory(payload);
      toast.success(`Item ${editingId ? "updated" : "added"}`);
      setSaving(false);
      resetForm();
      loadInventory(true);
    } catch (err) {
      console.error("Failed to save inventory item", err);
      toast.error(err?.response?.data?.message || "Unable to save this item.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.rowId);
    setFormData({
      itemCode: item.itemCode || "",
      itemName: item.itemName || "",
      category: item.category || "",
      brand: item.brand || "",
      model: item.model || "",
      partNumber: item.partNumber || "",
      supplier: item.supplier || "",
      supplierPhone: item.supplierPhone || "",
      purchasePrice: item.purchasePrice ?? "",
      sellingPrice: item.sellingPrice ?? "",
      quantity: item.quantity ?? "",
      minimumStock: item.minimumStock ?? "5",
      unit: item.unit || "pcs",
      location: item.location || "",
      description: item.description || "",
      image: item.image || "",
      status: item.status || "Available",
    });
    setShowForm(true);
  };

  const margin =
    Number(formData.sellingPrice || 0) - Number(formData.purchasePrice || 0);
  const marginPct =
    Number(formData.purchasePrice) > 0
      ? (margin / Number(formData.purchasePrice)) * 100
      : null;

  /* ================= DELETE ================= */
  const deleteTarget = items.find((i) => i.rowId === deleteId);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteInventory(deleteId);
      toast.success("Item deleted");
      setDeleteId(null);
      loadInventory(true);
    } catch (err) {
      console.error("Failed to delete inventory item", err);
      toast.error(
        err?.response?.data?.message || "Unable to delete this item.",
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ================= SUPPLIER ================= */
  const openSupplierModal = () => {
    setSupplierData({ supplierName: "", supplierContact: "" });
    setModalOpen(true);
  };

  const handleSupplierSubmit = async (e) => {
    e?.preventDefault();
    if (!supplierData.supplierName?.trim()) {
      toast.error("Enter supplier name");
      return;
    }
    if (
      !supplierData.supplierContact ||
      supplierData.supplierContact.length !== 10
    ) {
      toast.error("Enter a valid 10-digit contact number");
      return;
    }
    try {
      setSavingSupplier(true);
      const name = supplierData.supplierName.trim();
      await createSupplier({
        supplierName: name,
        supplierContact: supplierData.supplierContact,
      });
      await loadSuppliers();
      if (showForm) setFormData((prev) => ({ ...prev, supplier: name }));
      toast.success("Supplier added");
      setModalOpen(false);
      setSupplierData({ supplierName: "", supplierContact: "" });
    } catch (err) {
      console.error("Failed to save supplier", err);
      toast.error(
        err?.response?.data?.message ||
          "Unable to save supplier. Please try again.",
      );
    } finally {
      setSavingSupplier(false);
    }
  };

  /* ================= DEDUCT ================= */
  const itemOptions = useMemo(
    () =>
      items.map((item) => ({
        value: item.itemCode,
        label: `${item.itemName} · ${item.itemCode}`,
        quantity: item.quantity,
        unit: item.unit,
      })),
    [items],
  );
  const findItem = (code) => items.find((i) => i.itemCode === code);

  const handleRowChange = (index, field, value) =>
    setDeductData2((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  const addDeductRow = () =>
    setDeductData2((prev) => [...prev, { itemCode: "", quantity: "" }]);
  const removeDeductRow = (index) =>
    setDeductData2((prev) => prev.filter((_, i) => i !== index));

  const openDeductModal = (prefillCode = "") => {
    setDeductData2([{ itemCode: prefillCode, quantity: "" }]);
    setDeductModalOpen(true);
  };
  const resetDeductForm = () => {
    if (deducting) return;
    setDeductData2([{ itemCode: "", quantity: "" }]);
    setDeductModalOpen(false);
  };

  const handleDeductSubmit = async () => {
    for (let i = 0; i < deductData2.length; i++) {
      const row = deductData2[i];
      const qty = Number(row.quantity);
      if (!row.itemCode) return toast.error(`Select an item for row ${i + 1}`);
      if (!qty || qty <= 0)
        return toast.error(`Enter a valid quantity for row ${i + 1}`);
      const stock = findItem(row.itemCode)?.quantity ?? 0;
      if (qty > stock)
        return toast.error(`Row ${i + 1}: only ${stock} in stock`);
    }
    try {
      setDeducting(true);
      await deductInventory({
        items: deductData2.map((row) => ({
          itemCode: row.itemCode,
          quantity: Number(row.quantity),
        })),
      });
      toast.success("Stock deducted");
      setDeducting(false);
      resetDeductForm();
      loadInventory(true);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to deduct stock.");
    } finally {
      setDeducting(false);
    }
  };

  const deductUnits = deductData2.reduce(
    (s, r) => s + (Number(r.quantity) || 0),
    0,
  );

  const selectStyles = {
    menuPortal: (base) => ({ ...base, zIndex: 99999 }),
    control: (base, state) => ({
      ...base,
      minHeight: 44,
      borderRadius: 12,
      borderWidth: 2,
      fontSize: 14,
      fontWeight: 600,
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC",
      borderColor: state.isFocused
        ? isDark
          ? "rgba(255,255,255,0.4)"
          : "#001F3F"
        : isDark
          ? "rgba(255,255,255,0.1)"
          : "#CBD5E1",
      boxShadow: "none",
      "&:hover": { borderColor: isDark ? "rgba(255,255,255,0.3)" : "#001F3F" },
    }),
    singleValue: (base) => ({ ...base, color: isDark ? "#fff" : "#001F3F" }),
    input: (base) => ({ ...base, color: isDark ? "#fff" : "#001F3F" }),
    placeholder: (base) => ({ ...base, color: isDark ? "#64748b" : "#94a3b8" }),
    menu: (base) => ({
      ...base,
      borderRadius: 12,
      overflow: "hidden",
      fontSize: 14,
      backgroundColor: isDark ? "#000814" : "#fff",
      border: isDark ? "2px solid rgba(255,255,255,.1)" : "2px solid #CBD5E1",
      boxShadow: "0 20px 40px -12px rgba(0,0,0,.35)",
    }),
    option: (base, state) => ({
      ...base,
      padding: "9px 12px",
      cursor: state.isDisabled ? "not-allowed" : "pointer",
      opacity: state.isDisabled ? 0.45 : 1,
      backgroundColor: state.isSelected
        ? isDark
          ? "rgba(255,255,255,.15)"
          : "#001F3F"
        : state.isFocused
          ? isDark
            ? "rgba(255,255,255,.08)"
            : "#F8FAFC"
          : "transparent",
      color: state.isSelected ? "#fff" : isDark ? "#e2e8f0" : "#001F3F",
    }),
    indicatorSeparator: () => ({ display: "none" }),
  };

  /* ================= RENDER ================= */
  const statCards = [
    {
      key: "All",
      label: "Total items",
      value: stats.totalItems,
      icon: FiBox,
      chip: t.chipNavy,
    },
    {
      key: "units",
      label: "Units in stock",
      value: stats.totalStock.toLocaleString("en-IN"),
      icon: FiPackage,
      chip: "bg-blue-500/10 text-blue-500",
    },
    {
      key: "low",
      label: "Low stock",
      value: stats.lowStock,
      icon: FiAlertTriangle,
      chip: "bg-amber-500/10 text-amber-600",
    },
    {
      key: "out",
      label: "Out of stock",
      value: stats.outOfStock,
      icon: FiXCircle,
      chip: "bg-red-500/10 text-red-500",
    },
    {
      key: "value",
      label: "Stock value (cost)",
      value: currency(stats.totalValue),
      icon: FiTrendingUp,
      chip: "bg-green-500/10 text-green-600",
    },
  ];
  const clickableStat = (key) => ["All", "low", "out"].includes(key);

  const iconBtn = (danger) =>
    `flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 transition ${
      danger
        ? isDark
          ? "border-white/10 text-slate-300 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
          : "border-[#CBD5E1] text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
        : t.btnGhost
    }`;
  const th =
    "whitespace-nowrap px-4 py-3 text-[12px] font-black uppercase tracking-wider text-slate-400";

  return (
    <div className={`min-h-screen ${className || "p-3 sm:p-5 lg:p-6"} lg:ml-20`}>
      <Toaster
        position="top-right"
        toastOptions={{ style: { fontSize: "14px" } }}
      />

      <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-5">
        <PageHeading
          isDark={isDark}
          title="Stock"
          accent="& parts."
          subtitle="Track stock levels, suppliers and parts used – all in one place."
          right={
            <>
              <button
                type="button"
                onClick={() => loadInventory(true)}
                aria-label="Refresh"
                title="Refresh"
                className={`${btnBase} h-10 w-10 border-2 ${t.btnGhost}`}
              >
                <FiRefreshCw
                  size={14}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>
              <button
                type="button"
                onClick={openSupplierModal}
                className={`${btnBase} h-10 border-2 px-3 ${t.btnGhost}`}
              >
                <FiTruck size={14} />{" "}
                <span className="hidden sm:inline">Supplier</span>
              </button>
              <button
                type="button"
                onClick={() => openDeductModal()}
                className={`${btnBase} h-10 border-2 px-3 ${t.btnGhost}`}
              >
                <FiMinusCircle size={14} /> Deduct
              </button>
              <button
                type="button"
                onClick={openAddForm}
                className={`${btnBase} h-10 px-4 shadow-lg ${t.btnPrimary}`}
              >
                <FiPlus size={14} /> Add item
              </button>
            </>
          }
        />

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-red-500/30 bg-red-500/10 px-4 py-3 text-[14px] font-semibold text-red-500">
            <span className="flex items-center gap-2">
              <FiAlertTriangle size={16} /> {error}
            </span>
            <button
              type="button"
              onClick={() => loadInventory()}
              className="text-[12px] font-black uppercase tracking-wider hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {statCards.map((card, i) => {
            const clickable = clickableStat(card.key);
            const active =
              clickable && card.key !== "All" && stockFilter === card.key;
            const Tag = clickable ? "button" : "div";
            const Icon = card.icon;
            return (
              <Tag
                key={card.label}
                {...(clickable && {
                  type: "button",
                  onClick: () =>
                    setStockFilter(
                      card.key === "All" || card.key === stockFilter
                        ? "All"
                        : card.key,
                    ),
                  title:
                    card.key === "All"
                      ? "Show all items"
                      : `Show only ${card.label.toLowerCase()}`,
                })}
                className={`rounded-2xl border-2 p-3 text-left transition sm:p-4 ${t.card} ${clickable ? "hover:-translate-y-0.5" : ""} ${
                  active
                    ? isDark
                      ? "!border-white/40"
                      : "!border-[#001F3F]"
                    : ""
                } ${i === 4 ? "col-span-2 md:col-span-1" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] font-bold uppercase leading-tight tracking-wider text-slate-400">
                    {card.label}
                  </p>
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${card.chip}`}
                  >
                    <Icon size={14} />
                  </div>
                </div>
                <p
                  className={`mt-2 truncate text-[16px] font-black tracking-tight ${t.heading}`}
                >
                  {card.value}
                </p>
              </Tag>
            );
          })}
        </div>

        {/* list card */}
        <div className={`overflow-hidden rounded-2xl border-2 ${t.card}`}>
          {/* toolbar */}
          <div className={`space-y-3 border-b-2 p-3 sm:p-4 ${t.line}`}>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <FiSearch
                  size={14}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, code, brand, model, supplier, rack…"
                  className={`${inputCls} pl-10 pr-10`}
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
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                aria-expanded={showFilters}
                className={`${btnBase} relative h-11 shrink-0 border-2 px-3 lg:hidden ${showFilters ? t.btnPrimary : t.btnGhost}`}
              >
                <FiFilter size={14} />{" "}
                <span className="hidden min-[400px]:inline">Filters</span>
                {extraFilters > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-md bg-red-500 px-1 text-[12px] font-black text-white">
                    {extraFilters}
                  </span>
                )}
              </button>
            </div>

            <div
              className={`${showFilters ? "grid" : "hidden"} grid-cols-1 gap-2 min-[480px]:grid-cols-3 lg:flex lg:items-center`}
            >
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`${selectCls} lg:w-48`}
                aria-label="Category"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "All" ? "All categories" : c}
                  </option>
                ))}
              </select>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className={`${selectCls} lg:w-44`}
                aria-label="Brand"
              >
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b === "All" ? "All brands" : b}
                  </option>
                ))}
              </select>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className={`${selectCls} lg:w-44`}
                aria-label="Stock status"
              >
                <option value="All">All stock</option>
                <option value="in">In stock</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
              </select>
              {filtersActive && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-9 items-center gap-1 px-2 text-[12px] font-black uppercase tracking-wider text-red-500 hover:underline lg:ml-auto"
                >
                  <FiX size={12} /> Clear filters
                </button>
              )}
            </div>
          </div>

          {/* list */}
          {loading ? (
            <div className="space-y-2 p-3 sm:p-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-14 animate-pulse rounded-xl ${isDark ? "bg-white/5" : "bg-[#F8FAFC]"}`}
                />
              ))}
            </div>
          ) : currentItems.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-12 text-center">
              <div
                className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border-2 text-slate-400 ${t.inner}`}
              >
                <FiPackage size={20} />
              </div>
              <p
                className={`text-[14px] font-black uppercase tracking-tight ${t.heading}`}
              >
                {items.length ? "No items match" : "No inventory yet"}
              </p>
              <p className={`mt-1 text-[14px] ${t.muted}`}>
                {items.length
                  ? "Try a different search or clear the filters."
                  : "Add your first part to start tracking stock."}
              </p>
              <div className="mt-4">
                {items.length ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className={`${btnBase} h-9 border-2 px-4 ${t.btnGhost}`}
                  >
                    Clear filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={openAddForm}
                    className={`${btnBase} h-9 px-4 ${t.btnPrimary}`}
                  >
                    <FiPlus size={14} /> Add item
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full border-collapse text-left">
                  <thead className={`border-b-2 ${t.cardHead}`}>
                    <tr>
                      <th className={th}>Item</th>
                      <th className={th}>Category</th>
                      <th className={th}>Brand / model</th>
                      <th className={`${th} w-44`}>Stock</th>
                      <th className={`${th} text-right`}>Price</th>
                      <th className={th}>Status</th>
                      <th className={`${th} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item) => {
                      const state = getStockState(item);
                      return (
                        <tr
                          key={item.rowId}
                          className={`border-b last:border-0 ${t.line} ${isDark ? "hover:bg-white/5" : "hover:bg-[#F8FAFC]"}`}
                        >
                          <td className="px-4 py-3">
                            <p
                              className={`text-[14px] font-black ${t.heading}`}
                            >
                              {item.itemName}
                            </p>
                            <p
                              className={`flex flex-wrap items-center gap-x-1.5 text-[12px] ${t.muted}`}
                            >
                              <span className="font-mono font-bold">
                                {item.itemCode}
                              </span>
                              {item.partNumber && (
                                <span>· {item.partNumber}</span>
                              )}
                              {item.location && (
                                <span className="inline-flex items-center gap-0.5">
                                  · <FiMapPin size={12} /> {item.location}
                                </span>
                              )}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-lg border px-2 py-0.5 text-[12px] font-bold ${t.inner} ${t.body}`}
                            >
                              {item.category || "—"}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-[14px] ${t.body}`}>
                            <p className="font-semibold">{item.brand || "—"}</p>
                            {item.model && (
                              <p className={`text-[12px] ${t.muted}`}>
                                {item.model}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p
                              className={`font-mono text-[14px] font-black ${t.heading}`}
                            >
                              {item.quantity}{" "}
                              <span
                                className={`font-sans text-[12px] font-semibold ${t.muted}`}
                              >
                                {item.unit}
                              </span>
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <StockMeter item={item} isDark={isDark} />
                              <span className="shrink-0 text-[12px] text-slate-400">
                                min {item.minimumStock}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p
                              className={`font-mono text-[14px] font-black ${t.heading}`}
                            >
                              {currency(item.sellingPrice)}
                            </p>
                            <p className="text-[12px] text-slate-400">
                              cost {currency(item.purchasePrice)}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <StockPill state={state} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openDeductModal(item.itemCode)}
                                disabled={item.quantity === 0}
                                title="Use / deduct"
                                aria-label={`Deduct ${item.itemName}`}
                                className={`${iconBtn(false)} disabled:opacity-30`}
                              >
                                <FiMinusCircle size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEdit(item)}
                                title="Edit"
                                aria-label={`Edit ${item.itemName}`}
                                className={iconBtn(false)}
                              >
                                <FiEdit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteId(item.rowId)}
                                title="Delete"
                                aria-label={`Delete ${item.itemName}`}
                                className={iconBtn(true)}
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* phone / tablet cards */}
              <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:hidden">
                {currentItems.map((item) => {
                  const state = getStockState(item);
                  return (
                    <div
                      key={item.rowId}
                      className={`min-w-0 rounded-2xl border-2 p-3 ${t.inner}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p
                            className={`truncate text-[14px] font-black ${t.heading}`}
                          >
                            {item.itemName}
                          </p>
                          <p className={`truncate text-[12px] ${t.muted}`}>
                            <span className="font-mono font-bold">
                              {item.itemCode}
                            </span>{" "}
                            · {item.category || "—"}
                          </p>
                        </div>
                        <StockPill state={state} />
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                            Qty
                          </p>
                          <p
                            className={`truncate font-mono text-[14px] font-black ${t.heading}`}
                          >
                            {item.quantity}{" "}
                            <span
                              className={`font-sans text-[12px] font-semibold ${t.muted}`}
                            >
                              {item.unit}
                            </span>
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                            Price
                          </p>
                          <p
                            className={`truncate font-mono text-[14px] font-black ${t.heading}`}
                          >
                            {currency(item.sellingPrice)}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                            Brand
                          </p>
                          <p
                            className={`truncate text-[14px] font-semibold ${t.body}`}
                          >
                            {item.brand || "—"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <StockMeter item={item} isDark={isDark} />
                        <span className="shrink-0 text-[12px] text-slate-400">
                          min {item.minimumStock}
                        </span>
                      </div>
                      {item.location && (
                        <p
                          className={`mt-1.5 flex items-center gap-1 text-[12px] ${t.muted}`}
                        >
                          <FiMapPin size={12} /> {item.location}
                        </p>
                      )}

                      <div
                        className={`mt-3 grid grid-cols-3 gap-2 border-t-2 pt-3 ${t.line}`}
                      >
                        <button
                          type="button"
                          onClick={() => openDeductModal(item.itemCode)}
                          disabled={item.quantity === 0}
                          className={`${btnBase} h-9 border-2 ${t.btnGhost}`}
                        >
                          <FiMinusCircle size={14} /> Use
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className={`${btnBase} h-9 border-2 ${t.btnGhost}`}
                        >
                          <FiEdit2 size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(item.rowId)}
                          className={`${btnBase} h-9 border-2 ${isDark ? "border-red-500/30 text-red-400" : "border-red-200 text-red-600"}`}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* pagination */}
          {!loading && filteredItems.length > 0 && (
            <div
              className={`flex flex-col items-center justify-between gap-2 border-t-2 px-3 py-3 sm:flex-row sm:px-4 ${t.line} ${t.cardHead}`}
            >
              <div className="flex flex-wrap items-center justify-center gap-3">
                <label
                  className={`flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider ${t.muted}`}
                >
                  Rows
                  <select
                    value={pageSize}
                    onChange={(e) => changePageSize(e.target.value)}
                    className={`h-8 rounded-lg border-2 px-2 text-[12px] font-bold outline-none ${t.input} ${isDark ? "[&>option]:bg-[#000814]" : ""}`}
                  >
                    {PAGE_SIZE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === "all" ? "All" : opt}
                      </option>
                    ))}
                  </select>
                </label>
                <p className={`text-[12px] ${t.muted}`}>
                  <b className={t.heading}>
                    {firstIndex + 1}–{lastIndex}
                  </b>{" "}
                  of <b className={t.heading}>{filteredItems.length}</b> items
                </p>
              </div>
              <div
                className={`flex items-center gap-1.5 ${totalPages === 1 ? "invisible" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={safePage === 1}
                  className={`${iconBtn(false)} disabled:opacity-30`}
                  aria-label="Previous page"
                >
                  <FiChevronLeft size={14} />
                </button>
                <span
                  className={`px-2 text-[12px] font-black uppercase tracking-wider ${t.heading}`}
                >
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={safePage === totalPages}
                  className={`${iconBtn(false)} disabled:opacity-30`}
                  aria-label="Next page"
                >
                  <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= ADD / EDIT ITEM ================= */}
      <Modal
        isDark={isDark}
        open={showForm}
        onClose={resetForm}
        icon={editingId ? FiEdit2 : FiPlus}
        maxW="max-w-3xl"
        title={editingId ? "Edit item" : "Add new item"}
        subtitle={
          editingId
            ? `Updating ${formData.itemCode}`
            : "Fields marked * are required"
        }
        footer={
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className={`${btnBase} h-10 border-2 px-4 ${t.btnGhost}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="inventory-item-form"
              disabled={saving}
              className={`${btnBase} h-10 px-5 ${t.btnPrimary}`}
            >
              {saving ? (
                <FiLoader size={14} className="animate-spin" />
              ) : (
                <FiCheckCircle size={14} />
              )}
              {saving ? "Saving…" : editingId ? "Save changes" : "Create item"}
            </button>
          </div>
        }
      >
        <form
          id="inventory-item-form"
          onSubmit={handleSubmit}
          className="space-y-5 p-4 sm:p-5"
        >
          <datalist id="inv-categories">
            {categories
              .filter((c) => c !== "All")
              .map((c) => (
                <option key={c} value={c} />
              ))}
          </datalist>
          <datalist id="inv-brands">
            {brands
              .filter((b) => b !== "All")
              .map((b) => (
                <option key={b} value={b} />
              ))}
          </datalist>
          <datalist id="inv-units">
            {UNITS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>

          <section>
            <h4
              className={`mb-3 border-b-2 pb-2 text-[12px] font-black uppercase tracking-[0.15em] ${t.line} ${t.heading}`}
            >
              Basic details
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field isDark={isDark} label="Item code" required>
                <input
                  value={formData.itemCode}
                  onChange={setField("itemCode")}
                  className={`${inputCls} font-mono`}
                  placeholder="ITM-001"
                  required
                />
              </Field>
              <Field
                isDark={isDark}
                label="Item name"
                required
                className="lg:col-span-2"
              >
                <input
                  value={formData.itemName}
                  onChange={setField("itemName")}
                  className={inputCls}
                  placeholder="Front brake pad set"
                  required
                />
              </Field>
              <Field isDark={isDark} label="Category" required>
                <input
                  list="inv-categories"
                  value={formData.category}
                  onChange={setField("category")}
                  className={inputCls}
                  placeholder="Brakes"
                  required
                />
              </Field>
              <Field isDark={isDark} label="Brand">
                <input
                  list="inv-brands"
                  value={formData.brand}
                  onChange={setField("brand")}
                  className={inputCls}
                  placeholder="Bosch"
                />
              </Field>
              <Field isDark={isDark} label="Model / fits">
                <input
                  value={formData.model}
                  onChange={setField("model")}
                  className={inputCls}
                  placeholder="Maruti Swift"
                />
              </Field>
              <Field isDark={isDark} label="Part number">
                <input
                  value={formData.partNumber}
                  onChange={setField("partNumber")}
                  className={`${inputCls} font-mono`}
                  placeholder="PN-101"
                />
              </Field>
            </div>
          </section>

          <section>
            <h4
              className={`mb-3 border-b-2 pb-2 text-[12px] font-black uppercase tracking-[0.15em] ${t.line} ${t.heading}`}
            >
              Pricing & stock
            </h4>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <Field isDark={isDark} label="Cost (₹)" required>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={formData.purchasePrice}
                  onChange={setField("purchasePrice")}
                  className={`${inputCls} font-mono`}
                  placeholder="0"
                  required
                />
              </Field>
              <Field
                isDark={isDark}
                label="Selling (₹)"
                required
                hint={
                  formData.sellingPrice !== "" &&
                  formData.purchasePrice !== "" ? (
                    <span
                      className={`font-bold ${margin < 0 ? "text-red-500" : "text-green-600"}`}
                    >
                      Margin {currency(margin)}
                      {marginPct !== null ? ` (${marginPct.toFixed(0)}%)` : ""}
                    </span>
                  ) : null
                }
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={formData.sellingPrice}
                  onChange={setField("sellingPrice")}
                  className={`${inputCls} font-mono`}
                  placeholder="0"
                  required
                />
              </Field>
              <Field isDark={isDark} label="Quantity" required>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={formData.quantity}
                  onChange={setField("quantity")}
                  className={`${inputCls} font-mono`}
                  placeholder="0"
                  required
                />
              </Field>
              <Field
                isDark={isDark}
                label="Min. stock"
                hint="Alert at or below"
              >
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={formData.minimumStock}
                  onChange={setField("minimumStock")}
                  className={`${inputCls} font-mono`}
                />
              </Field>
              <Field
                isDark={isDark}
                label="Unit"
                className="col-span-2 lg:col-span-1"
              >
                <input
                  list="inv-units"
                  value={formData.unit}
                  onChange={setField("unit")}
                  className={inputCls}
                  placeholder="pcs"
                />
              </Field>
            </div>
          </section>

          <section>
            <h4
              className={`mb-3 border-b-2 pb-2 text-[12px] font-black uppercase tracking-[0.15em] ${t.line} ${t.heading}`}
            >
              Supplier & storage
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field
                isDark={isDark}
                label="Supplier"
                hint={
                  <button
                    type="button"
                    onClick={openSupplierModal}
                    className={`font-black uppercase tracking-wider hover:underline ${t.heading}`}
                  >
                    + Add new supplier
                  </button>
                }
              >
                <select
                  value={formData.supplier}
                  onChange={setField("supplier")}
                  className={selectCls}
                >
                  <option value="">Select supplier</option>
                  {formData.supplier &&
                    !suppliers.some(
                      (s) => s.supplierName === formData.supplier,
                    ) && (
                      <option value={formData.supplier}>
                        {formData.supplier}
                      </option>
                    )}
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.supplierName}>
                      {s.supplierName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field isDark={isDark} label="Rack / location">
                <input
                  value={formData.location}
                  onChange={setField("location")}
                  className={inputCls}
                  placeholder="Rack A1"
                />
              </Field>
              <Field isDark={isDark} label="Status">
                <select
                  value={formData.status}
                  onChange={setField("status")}
                  className={selectCls}
                >
                  <option value="Available">Available</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </Field>
              <Field isDark={isDark} label="Notes" className="sm:col-span-3">
                <textarea
                  value={formData.description}
                  onChange={setField("description")}
                  rows={2}
                  className={`w-full resize-none rounded-xl border-2 px-3.5 py-2.5 text-[14px] font-medium outline-none transition ${t.input}`}
                  placeholder="Anything worth remembering about this item"
                />
              </Field>
            </div>
          </section>
        </form>
      </Modal>

      {/* ================= ADD SUPPLIER ================= */}
      <Modal
        isDark={isDark}
        open={modalOpen}
        onClose={() => !savingSupplier && setModalOpen(false)}
        icon={FiTruck}
        maxW="max-w-md"
        title="Add supplier"
        subtitle="Suppliers appear in the item form"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={savingSupplier}
              className={`${btnBase} h-10 border-2 ${t.btnGhost}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="inv-supplier-form"
              disabled={savingSupplier}
              className={`${btnBase} h-10 ${t.btnPrimary}`}
            >
              {savingSupplier ? (
                <FiLoader size={14} className="animate-spin" />
              ) : (
                <FiPlus size={14} />
              )}
              {savingSupplier ? "Saving…" : "Save supplier"}
            </button>
          </div>
        }
      >
        <form
          id="inv-supplier-form"
          onSubmit={handleSupplierSubmit}
          className="space-y-4 p-4 sm:p-5"
        >
          <Field isDark={isDark} label="Supplier name" required>
            <input
              value={supplierData.supplierName}
              onChange={(e) =>
                setSupplierData({
                  ...supplierData,
                  supplierName: e.target.value,
                })
              }
              className={inputCls}
              placeholder="Sri Balaji Auto Parts"
              autoFocus
            />
          </Field>
          <Field
            isDark={isDark}
            label="Contact number"
            required
            hint={`${supplierData.supplierContact.length}/10 digits`}
          >
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={supplierData.supplierContact}
              onChange={(e) =>
                setSupplierData({
                  ...supplierData,
                  supplierContact: e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 10),
                })
              }
              className={`${inputCls} font-mono`}
              placeholder="9876543210"
            />
          </Field>
        </form>
      </Modal>

      {/* ================= DEDUCT STOCK ================= */}
      <Modal
        isDark={isDark}
        open={deductModalOpen}
        onClose={resetDeductForm}
        icon={FiMinusCircle}
        maxW="max-w-2xl"
        title="Deduct stock"
        subtitle="Remove used or sold parts from inventory"
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p
              className={`text-[12px] font-bold uppercase tracking-wider ${t.muted}`}
            >
              {deductData2.length} item{deductData2.length > 1 ? "s" : ""} ·{" "}
              {deductUnits} unit{deductUnits === 1 ? "" : "s"}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                onClick={resetDeductForm}
                disabled={deducting}
                className={`${btnBase} h-10 border-2 px-4 ${t.btnGhost}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeductSubmit}
                disabled={deducting}
                className={`${btnBase} h-10 bg-red-600 px-5 text-white hover:bg-red-700`}
              >
                {deducting ? (
                  <FiLoader size={14} className="animate-spin" />
                ) : (
                  <FiMinusCircle size={14} />
                )}
                {deducting ? "Deducting…" : "Deduct"}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-3 p-4 sm:p-5">
          {deductData2.map((row, index) => {
            const selected = findItem(row.itemCode);
            const over = selected && Number(row.quantity) > selected.quantity;
            const usedElsewhere = new Set(
              deductData2
                .filter((_, i) => i !== index)
                .map((r) => r.itemCode)
                .filter(Boolean),
            );
            return (
              <div
                key={index}
                className={`rounded-xl border-2 p-3 ${over ? "!border-red-500/50" : ""} ${t.inner}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[12px] font-black uppercase tracking-wider text-slate-400">
                    Item {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeDeductRow(index)}
                    disabled={deductData2.length === 1}
                    aria-label="Remove row"
                    className={`${iconBtn(true)} disabled:invisible`}
                  >
                    <FiX size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px]">
                  <div className="min-w-0">
                    <Select
                      options={itemOptions}
                      value={
                        itemOptions.find((o) => o.value === row.itemCode) ||
                        null
                      }
                      onChange={(option) =>
                        handleRowChange(index, "itemCode", option?.value || "")
                      }
                      isOptionDisabled={(o) =>
                        o.quantity === 0 || usedElsewhere.has(o.value)
                      }
                      formatOptionLabel={(o, { context }) =>
                        context === "menu" ? (
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate">{o.label}</span>
                            <span
                              className={`shrink-0 text-[12px] font-bold ${o.quantity === 0 ? "text-red-500" : "opacity-60"}`}
                            >
                              {o.quantity === 0
                                ? "Out of stock"
                                : `${o.quantity} ${o.unit}`}
                            </span>
                          </div>
                        ) : (
                          o.label
                        )
                      }
                      placeholder="Search by name or code…"
                      isSearchable
                      isClearable
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      menuPlacement="auto"
                      maxMenuHeight={260}
                      styles={selectStyles}
                    />
                  </div>
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    max={selected?.quantity}
                    value={row.quantity}
                    onChange={(e) =>
                      handleRowChange(index, "quantity", e.target.value)
                    }
                    className={`${inputCls} font-mono ${over ? "!border-red-500" : ""}`}
                    placeholder="Qty"
                    aria-label={`Quantity for item ${index + 1}`}
                  />
                </div>
                {selected && (
                  <p
                    className={`mt-1.5 text-[12px] font-semibold ${over ? "text-red-500" : t.muted}`}
                  >
                    {over ? "More than available · " : ""}Available:{" "}
                    {selected.quantity} {selected.unit}
                    {selected.location ? ` · ${selected.location}` : ""}
                  </p>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={addDeductRow}
            className={`${btnBase} h-10 w-full border-2 border-dashed ${isDark ? "border-white/20 text-white hover:border-white/40" : "border-[#CBD5E1] text-[#001F3F] hover:border-[#001F3F]"}`}
          >
            <FiPlus size={14} /> Add another item
          </button>
        </div>
      </Modal>

      {/* ================= DELETE CONFIRM ================= */}
      <ConfirmDialog
        isDark={isDark}
        open={Boolean(deleteId)}
        title="Delete item?"
        message={
          deleteTarget
            ? `${deleteTarget.itemName} (${deleteTarget.itemCode}) will be removed from inventory. This can't be undone.`
            : "This item will be removed from inventory."
        }
        confirmText="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setDeleteId(null)}
      />
    </div>
  );
};

export default InventoryManage;
