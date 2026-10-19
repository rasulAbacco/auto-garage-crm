// client/src/pages/spareParts/SparePartsStore.jsx
//
// Shop Spare Parts (Bike + Car)
//   <SparePartsStore vehicle="bike" view="products" />  -> All Products
//   <SparePartsStore vehicle="bike" view="vendors" />   -> Vendors (cards only)
//
// Data comes from our own server (/api/spare-parts/...), which reads the
// MotorDesk Spare Parts store. "Buy" opens the product on the store in a new tab.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ShoppingCart,
  Search,
  RefreshCw,
  Store,
  Package,
  Tag,
  MapPin,
  Phone,
  Mail,
  X,
  AlertCircle,
  BadgeCheck,
  Layers,
  ArrowRight,
  Boxes,
  ExternalLink,
  Hash,
  SlidersHorizontal,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import api from "../../utils/axiosInstance";
import {
  PageHeading,
  Modal,
  tk,
  btnBase,
} from "../clients/components/clientUi";

/* ---------- store website (Buy button) ---------- */
const STORE_URL = (
  import.meta.env.VITE_SPARE_PARTS_STORE_URL ||
  "https://motordesk-spareparts.onrender.com"
).replace(/\/+$/, "");

// deep-link to a product on the store. Placeholders: :id  :slug  :name
const PRODUCT_PATH = import.meta.env.VITE_SPARE_PARTS_PRODUCT_PATH || "";

const buyUrl = (product) => {
  if (!PRODUCT_PATH || !product) return `${STORE_URL}/`;
  const values = {
    id: product.id,
    slug: product.slug || product.id,
    name: product.name,
  };
  const path = PRODUCT_PATH.replace(/:(id|slug|name)\b/g, (_, k) =>
    encodeURIComponent(values[k] ?? ""),
  );
  return `${STORE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};
const openOnStore = (product) =>
  window.open(buyUrl(product), "_blank", "noopener,noreferrer");

/* ---------- in-page cache (instant revisit, quiet refresh) ---------- */
const pageCache = new Map(); // "bike:products" -> { at, data }
const PAGE_FRESH_MS = 60 * 1000;

/* ---------- helpers ---------- */
const rupee = (n) =>
  n === null || n === undefined
    ? null
    : `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const initials = (name = "") =>
  String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "V";
const stockText = (p) =>
  !p.inStock
    ? "Out of stock"
    : p.stock !== null && p.stock !== undefined
      ? `${p.stock}${p.unit ? ` ${p.unit}` : ""} in stock`
      : "In stock";
const matches = (p, q) => {
  if (!q) return true;
  const hay = [
    p.name,
    p.brand,
    p.category,
    p.partNumber,
    p.vendor?.name,
    p.description,
    ...(p.compatibleModels || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
};

/* =================================================================== */

export default function SparePartsStore({
  vehicle = "bike",
  view = "products",
}) {
  const { isDark } = useTheme();
  const t = tk(isDark);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const base = vehicle === "bike" ? "/bike-spare-parts" : "/spare-parts";
  const vehicleLabel = vehicle === "bike" ? "Bike" : "Car";

  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [unassigned, setUnassigned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sort, setSort] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const vendorFilter = searchParams.get("vendor") || "all";
  const [selected, setSelected] = useState(null);

  const cacheKey = `${vehicle}:${view}`;

  const apply = useCallback(
    (data) => {
      if (view === "vendors") {
        setVendors(data?.vendors || []);
        setUnassigned(data?.unassignedProducts || 0);
      } else setProducts(data?.products || []);
    },
    [view],
  );

  const load = useCallback(
    async (force = false) => {
      const cached = pageCache.get(cacheKey);
      if (cached && !force) {
        apply(cached.data);
        setLoading(false);
        setError("");
        if (Date.now() - cached.at < PAGE_FRESH_MS) return;
        setRefreshing(true);
      } else if (force && cached) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setError("");
      }
      try {
        const url =
          view === "vendors"
            ? "/api/spare-parts/vendors"
            : "/api/spare-parts/products";
        const res = await api.get(url, {
          params: { vehicle },
          timeout: 120000,
        });
        pageCache.set(cacheKey, { at: Date.now(), data: res.data });
        apply(res.data);
        setError("");
      } catch (err) {
        if (!pageCache.has(cacheKey) || force) {
          setError(
            err.response?.data?.message ||
              "Could not load spare parts. The store may be waking up – try again in a minute.",
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [cacheKey, view, vehicle, apply],
  );

  useEffect(() => {
    load();
    setQuery("");
    setCategory("all");
    setStockFilter("all");
  }, [load]);

  /* ---------- derived ---------- */
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(),
    [products],
  );

  const vendorOptions = useMemo(() => {
    const m = new Map();
    products.forEach(
      (p) =>
        p.vendor?.id && m.set(String(p.vendor.id), p.vendor.name || "Vendor"),
    );
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [products]);

  const setVendorFilter = (id) => {
    const next = new URLSearchParams(searchParams);
    if (!id || id === "all") next.delete("vendor");
    else next.set("vendor", id);
    setSearchParams(next, { replace: true });
  };

  const visibleProducts = useMemo(() => {
    let list = products.filter(
      (p) =>
        matches(p, query) &&
        (category === "all" || p.category === category) &&
        (vendorFilter === "all" || String(p.vendor?.id) === vendorFilter) &&
        (stockFilter === "all" ||
          (stockFilter === "in" ? p.inStock : !p.inStock)),
    );
    const price = (p) => p.price ?? Number.MAX_SAFE_INTEGER;
    if (sort === "price-asc")
      list = [...list].sort((a, b) => price(a) - price(b));
    if (sort === "price-desc")
      list = [...list].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    if (sort === "discount")
      list = [...list].sort(
        (a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0),
      );
    if (sort === "name")
      list = [...list].sort((a, b) =>
        String(a.name).localeCompare(String(b.name)),
      );
    return list;
  }, [products, query, category, vendorFilter, stockFilter, sort]);

  const visibleVendors = useMemo(() => {
    if (!query) return vendors;
    const q = query.toLowerCase();
    return vendors.filter((v) =>
      [
        v.name,
        v.ownerName,
        v.city,
        v.state,
        v.address,
        v.phone,
        v.email,
        ...(v.categories || []),
        ...(v.brands || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [vendors, query]);

  const stats = useMemo(() => {
    if (view === "vendors") {
      return [
        { label: "Vendors", value: vendors.length, icon: Store },
        {
          label: `${vehicleLabel} products`,
          value: vendors.reduce((s, v) => s + (v.productCount || 0), 0),
          icon: Package,
        },
        {
          label: "In stock",
          value: vendors.reduce((s, v) => s + (v.inStockCount || 0), 0),
          icon: Boxes,
          tone: "green",
        },
      ];
    }
    return [
      {
        label: `${vehicleLabel} products`,
        value: products.length,
        icon: Package,
      },
      { label: "Categories", value: categories.length, icon: Layers },
      {
        label: "In stock",
        value: products.filter((p) => p.inStock).length,
        icon: Boxes,
        tone: "green",
      },
    ];
  }, [view, vendors, products, categories, vehicleLabel]);

  const activeFilters = [
    category !== "all",
    vendorFilter !== "all",
    stockFilter !== "all",
  ].filter(Boolean).length;
  const activeVendorName =
    vendorFilter !== "all"
      ? vendorOptions.find(([id]) => id === vendorFilter)?.[1] ||
        "Selected vendor"
      : null;
  const field = `h-11 rounded-xl border-2 px-3 text-[14px] font-semibold outline-none transition ${t.input} ${isDark ? "[&>option]:bg-[#000814]" : ""}`;

  // car pages add their own desktop offset; the bike shell already pads for the rail
  const wrapCls = vehicle === "car" ? "lg:ml-16" : "p-3 sm:p-5 lg:p-6";

  return (
    <div className={`min-h-screen ${wrapCls} lg:ml-20`}>
      <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-5">
        <PageHeading
          isDark={isDark}
          badge="Shop spare parts"
          title={`${vehicleLabel} spare`}
          accent="parts."
          subtitle={`${vehicleLabel} parts from MotorDesk Spare Parts vendors. Tap Buy to order on the store.`}
          right={
            <div className="flex items-center gap-2">
              <div className={`flex rounded-xl border-2 p-1 ${t.card}`}>
                {[
                  { key: "products", label: "All products", to: base },
                  { key: "vendors", label: "Vendors", to: `${base}/vendors` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => navigate(tab.to)}
                    className={`h-8 rounded-lg px-3 text-[12px] font-black uppercase tracking-wider transition ${
                      view === tab.key
                        ? t.chipNavy
                        : `${t.muted} ${isDark ? "hover:text-white" : "hover:text-[#001F3F]"}`
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => load(true)}
                disabled={loading || refreshing}
                title="Refresh"
                aria-label="Refresh"
                className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 transition ${t.btnGhost} disabled:opacity-50`}
              >
                <RefreshCw
                  size={16}
                  className={loading || refreshing ? "animate-spin" : ""}
                />
              </button>
            </div>
          }
        />

        {/* stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`rounded-2xl border-2 p-3 sm:p-4 ${t.card}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12px] font-bold uppercase leading-tight tracking-wider text-slate-400">
                  {s.label}
                </p>
                <div
                  className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:flex ${s.tone === "green" ? "bg-green-500/10 text-green-600" : t.chipNavy}`}
                >
                  <s.icon size={14} />
                </div>
              </div>
              <p className={`mt-2 text-[16px] font-black ${t.heading}`}>
                {loading ? "…" : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* search + filters */}
        <div className={`space-y-3 rounded-2xl border-2 p-3 sm:p-4 ${t.card}`}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  view === "vendors"
                    ? "Search vendor, city, phone, category or brand…"
                    : `Search part, brand, part no., ${vehicleLabel.toLowerCase()} model…`
                }
                className={`${field} w-full pl-10`}
              />
            </div>
            {view === "products" && (
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className={`${btnBase} relative h-11 border-2 px-3 lg:hidden ${t.btnGhost}`}
                aria-label="Filters"
              >
                <SlidersHorizontal size={16} />
                {activeFilters > 0 && (
                  <span
                    className={`absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[12px] ${t.chipNavy}`}
                  >
                    {activeFilters}
                  </span>
                )}
              </button>
            )}
          </div>

          {view === "products" && (
            <div
              className={`${showFilters ? "grid" : "hidden"} grid-cols-1 gap-2 sm:grid-cols-2 lg:grid lg:grid-cols-4`}
            >
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`${field} cursor-pointer`}
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className={`${field} cursor-pointer`}
                disabled={!vendorOptions.length}
              >
                <option value="all">All vendors</option>
                {vendorOptions.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className={`${field} cursor-pointer`}
              >
                <option value="all">All stock</option>
                <option value="in">In stock</option>
                <option value="out">Out of stock</option>
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={`${field} cursor-pointer`}
              >
                <option value="relevance">Sort: relevance</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="discount">Best discount</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
          )}
        </div>

        {/* body */}
        {loading ? (
          <SkeletonGrid isDark={isDark} />
        ) : error ? (
          <div
            className={`rounded-2xl border-2 px-4 py-12 text-center ${t.card}`}
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
              <AlertCircle size={20} />
            </div>
            <p className={`text-[14px] font-bold ${t.heading}`}>{error}</p>
            <button
              onClick={() => load(true)}
              className={`${btnBase} mt-4 h-10 px-5 ${t.btnPrimary}`}
            >
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        ) : view === "products" ? (
          visibleProducts.length === 0 ? (
            <Empty
              isDark={isDark}
              text={`No ${vehicleLabel.toLowerCase()} products match your search.`}
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <p className={`text-[12px] font-semibold ${t.muted}`}>
                  Showing <b className={t.heading}>{visibleProducts.length}</b>{" "}
                  of {products.length} {vehicleLabel.toLowerCase()} products
                </p>
                {activeVendorName && (
                  <button
                    onClick={() => setVendorFilter("all")}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-bold ${t.chipNavy}`}
                  >
                    <Store size={12} /> {activeVendorName} <X size={12} />
                  </button>
                )}
              </div>
              <div className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {visibleProducts.map((p) => (
                  <ProductCard
                    key={`${p.id}-${p.name}`}
                    p={p}
                    isDark={isDark}
                    onView={() => setSelected(p)}
                  />
                ))}
              </div>
            </>
          )
        ) : visibleVendors.length === 0 ? (
          <Empty isDark={isDark} text="No vendors found." />
        ) : (
          <>
            {unassigned > 0 && (
              <p className={`text-[12px] font-semibold ${t.muted}`}>
                {unassigned} product{unassigned > 1 ? "s are" : " is"} not
                linked to a vendor in the store.
              </p>
            )}
            <div className="grid auto-rows-fr grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visibleVendors.map((v) => (
                <VendorCard
                  key={v.id}
                  v={v}
                  isDark={isDark}
                  vehicleLabel={vehicleLabel}
                  onViewProducts={() =>
                    navigate(`${base}?vendor=${encodeURIComponent(v.id)}`)
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>

      <ProductModal
        p={selected}
        isDark={isDark}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

/* =================================================================== */

function ProductCard({ p, isDark, onView }) {
  const t = tk(isDark);
  const price = rupee(p.price);
  const mrp =
    p.mrp && p.price !== null && p.mrp > p.price ? rupee(p.mrp) : null;

  return (
    <div
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:-translate-y-0.5 ${t.card} ${isDark ? "" : "hover:border-[#001F3F]"}`}
    >
      <button
        onClick={onView}
        className={`relative h-44 w-full shrink-0 overflow-hidden ${isDark ? "bg-white/5" : "bg-[#F8FAFC]"}`}
      >
        {p.images?.[0] ? (
          <img
            src={p.images[0]}
            alt={p.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Package
            size={36}
            className="absolute inset-0 m-auto text-slate-400"
          />
        )}
        {p.discountPercent > 0 && (
          <span className="absolute left-2 top-2 rounded-lg bg-green-600 px-2 py-0.5 text-[12px] font-black text-white">
            {p.discountPercent}% OFF
          </span>
        )}
        <span
          className={`absolute right-2 top-2 rounded-lg px-2 py-0.5 text-[12px] font-bold text-white ${p.inStock ? "bg-[#001F3F]" : "bg-red-600"}`}
        >
          {p.inStock ? "In stock" : "Out of stock"}
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <div className="flex min-h-[22px] flex-wrap items-center gap-1.5">
          {p.brand && (
            <span
              className={`rounded-md border px-1.5 py-px text-[12px] font-bold ${t.inner} ${t.heading}`}
            >
              {p.brand}
            </span>
          )}
          {p.category && (
            <span className="rounded-md bg-blue-500/10 px-1.5 py-px text-[12px] font-bold text-blue-500">
              {p.category}
            </span>
          )}
        </div>

        <button
          onClick={onView}
          title={p.name}
          className={`min-h-[2.5rem] text-left text-[14px] font-black leading-snug line-clamp-2 hover:underline ${t.heading}`}
        >
          {p.name}
        </button>

        <p
          className={`min-h-[2.25rem] text-[12px] leading-relaxed line-clamp-2 ${t.muted}`}
        >
          {p.description ||
            (p.partNumber
              ? `Part no. ${p.partNumber}`
              : "No description provided.")}
        </p>

        <div className="flex min-h-[24px] items-baseline gap-2">
          {price ? (
            <>
              <span className={`text-[16px] font-black ${t.heading}`}>
                {price}
              </span>
              {mrp && (
                <span className={`text-[12px] line-through ${t.muted}`}>
                  {mrp}
                </span>
              )}
            </>
          ) : (
            <span className={`text-[14px] font-semibold ${t.muted}`}>
              Price on store
            </span>
          )}
        </div>

        <div className={`space-y-1 text-[12px] ${t.muted}`}>
          <p
            className={`flex items-center gap-1.5 font-semibold ${p.inStock ? "text-green-600" : "text-red-500"}`}
          >
            <Boxes size={12} /> {stockText(p)}
          </p>
          <p
            className="flex items-center gap-1.5 truncate"
            title={p.vendor?.name || ""}
          >
            <Store size={12} className="shrink-0" />
            <span className="truncate">
              {p.vendor?.name || "Vendor not listed"}
            </span>
          </p>
        </div>

        <div
          className={`mt-auto grid grid-cols-2 gap-2 border-t-2 pt-3 ${t.line}`}
        >
          <button
            onClick={onView}
            className={`${btnBase} h-9 border-2 ${t.btnGhost}`}
          >
            Details
          </button>
          <button
            onClick={() => openOnStore(p)}
            disabled={!p.inStock}
            title="Opens this product on the MotorDesk store in a new tab"
            className={`${btnBase} h-9 ${t.btnPrimary}`}
          >
            <ShoppingCart size={14} /> Buy
          </button>
        </div>
      </div>
    </div>
  );
}

function VendorCard({ v, isDark, vehicleLabel, onViewProducts }) {
  const t = tk(isDark);
  const priceRange =
    v.minPrice === null || v.minPrice === undefined
      ? null
      : v.minPrice === v.maxPrice
        ? rupee(v.minPrice)
        : `${rupee(v.minPrice)} – ${rupee(v.maxPrice)}`;
  const location = v.address || [v.city, v.state].filter(Boolean).join(", ");

  return (
    <div
      className={`flex h-full flex-col gap-3 rounded-2xl border-2 p-4 ${t.card}`}
    >
      <div className="flex items-start gap-3">
        {v.logo ? (
          <img
            src={v.logo}
            alt=""
            className={`h-12 w-12 shrink-0 rounded-xl border-2 object-cover ${t.line}`}
          />
        ) : (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[14px] font-black ${t.chipNavy}`}
          >
            {initials(v.name)}
          </div>
        )}
        <div className="min-w-0">
          <p
            className={`flex items-center gap-1.5 text-[14px] font-black ${t.heading}`}
          >
            <span className="truncate" title={v.name}>
              {v.name}
            </span>
            {v.verified && (
              <BadgeCheck size={16} className="shrink-0 text-blue-500" />
            )}
          </p>
          {v.ownerName && v.ownerName !== v.name && (
            <p className={`text-[12px] ${t.muted}`}>{v.ownerName}</p>
          )}
        </div>
      </div>

      <div className={`space-y-1 text-[12px] ${t.body}`}>
        <p className="flex items-start gap-2">
          <MapPin size={12} className="mt-0.5 shrink-0 text-slate-400" />
          {location || "Location not listed"}
        </p>
        {v.phone && (
          <a
            href={`tel:${v.phone}`}
            className="flex items-center gap-2 hover:underline"
          >
            <Phone size={12} className="shrink-0 text-slate-400" />
            {v.phone}
          </a>
        )}
        {v.email && (
          <a
            href={`mailto:${v.email}`}
            className="flex items-center gap-2 truncate hover:underline"
          >
            <Mail size={12} className="shrink-0 text-slate-400" />
            <span className="truncate">{v.email}</span>
          </a>
        )}
        {v.gst && (
          <p className="flex items-center gap-2">
            <Hash size={12} className="shrink-0 text-slate-400" />
            GST {v.gst}
          </p>
        )}
      </div>

      <div
        className={`grid grid-cols-3 rounded-xl border-2 p-2.5 text-center ${t.inner}`}
      >
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
            Products
          </p>
          <p className={`text-[16px] font-black ${t.heading}`}>
            {v.productCount ?? 0}
          </p>
        </div>
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
            In stock
          </p>
          <p className="text-[16px] font-black text-green-600">
            {v.inStockCount ?? 0}
          </p>
        </div>
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
            Out
          </p>
          <p className="text-[16px] font-black text-red-500">
            {v.outOfStockCount ?? 0}
          </p>
        </div>
      </div>

      {(priceRange || v.categories?.length > 0) && (
        <div className="space-y-2">
          {priceRange && (
            <p className={`text-[12px] ${t.muted}`}>
              Price range <b className={t.heading}>{priceRange}</b>
            </p>
          )}
          {v.categories?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {v.categories.slice(0, 6).map((c) => (
                <span
                  key={c}
                  className={`rounded-md border px-1.5 py-px text-[12px] font-semibold ${t.inner} ${t.body}`}
                >
                  {c}
                </span>
              ))}
              {v.categories.length > 6 && (
                <span className={`text-[12px] ${t.muted}`}>
                  +{v.categories.length - 6} more
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <button
        onClick={onViewProducts}
        disabled={!v.productCount}
        className={`${btnBase} mt-auto h-10 ${t.btnPrimary}`}
      >
        {v.productCount ? (
          <>
            View {v.productCount} products <ArrowRight size={14} />
          </>
        ) : (
          `No ${vehicleLabel.toLowerCase()} products`
        )}
      </button>
    </div>
  );
}

function ProductModal({ p, isDark, onClose }) {
  const t = tk(isDark);
  const [img, setImg] = useState(0);
  useEffect(() => setImg(0), [p]);

  if (!p) return <Modal isDark={isDark} open={false} onClose={onClose} />;

  const suitable =
    { bike: "Bike", car: "Car", both: "Bike & Car" }[p.vehicleType] || null;
  const rows = [
    ["Brand", p.brand],
    ["Category", p.category],
    ["Part number", p.partNumber],
    [
      "Selling price",
      rupee(p.price)
        ? `${rupee(p.price)}${p.gstRate ? " (incl. GST)" : ""}`
        : "See on store",
    ],
    [
      "Price before GST",
      p.gstRate && p.basePrice !== null && p.basePrice !== undefined
        ? rupee(p.basePrice)
        : null,
    ],
    ["GST", p.gstRate ? `${p.gstRate}%` : null],
    ["MRP", p.mrp ? rupee(p.mrp) : null],
    [
      "You save",
      p.mrp && p.price !== null && p.mrp > p.price
        ? `${rupee(p.mrp - p.price)} (${p.discountPercent}%)`
        : null,
    ],
    ["Stock", stockText(p)],
    ["Warranty", p.warranty],
    ["Suitable for", suitable],
    ["Sold by", p.vendor?.name],
  ].filter(([, v]) => v !== null && v !== undefined && v !== "");

  return (
    <Modal
      isDark={isDark}
      open={!!p}
      onClose={onClose}
      icon={Package}
      title={p.name}
      subtitle={[p.brand, p.category].filter(Boolean).join(" · ")}
      maxW="max-w-4xl"
      footer={
        <div className="space-y-1">
          <button
            onClick={() => openOnStore(p)}
            disabled={!p.inStock}
            className={`${btnBase} h-11 w-full ${t.btnPrimary} shadow-xl`}
          >
            <ShoppingCart size={14} />{" "}
            {p.inStock ? "Buy on MotorDesk store" : "Out of stock"}
            {p.inStock && <ExternalLink size={14} />}
          </button>
          {p.inStock && (
            <p className={`text-center text-[12px] ${t.muted}`}>
              Opens this product on the store in a new tab
            </p>
          )}
        </div>
      }
    >
      <div className="grid gap-5 p-4 sm:p-5 md:grid-cols-2">
        <div>
          <div
            className={`relative aspect-square overflow-hidden rounded-xl border-2 ${t.inner}`}
          >
            {p.images?.[img] ? (
              <img
                src={p.images[img]}
                alt={p.name}
                className="absolute inset-0 h-full w-full object-contain p-4"
              />
            ) : (
              <Package
                size={48}
                className="absolute inset-0 m-auto text-slate-400"
              />
            )}
          </div>
          {p.images?.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {p.images.map((src, i) => (
                <button
                  key={src + i}
                  onClick={() => setImg(i)}
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${i === img ? (isDark ? "border-white" : "border-[#001F3F]") : `${t.line} opacity-70`}`}
                >
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-baseline gap-2">
            {rupee(p.price) ? (
              <>
                <span className={`text-[16px] font-black ${t.heading}`}>
                  {rupee(p.price)}
                </span>
                {p.mrp && p.price !== null && p.mrp > p.price && (
                  <>
                    <span className={`text-[14px] line-through ${t.muted}`}>
                      {rupee(p.mrp)}
                    </span>
                    <span className="rounded-md bg-green-600 px-1.5 py-px text-[12px] font-black text-white">
                      {p.discountPercent}% off
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className={`text-[14px] font-semibold ${t.muted}`}>
                Price shown on store
              </span>
            )}
          </div>

          <div
            className={`divide-y-2 rounded-xl border-2 ${t.inner} ${isDark ? "divide-white/5" : "divide-[#E2E8F0]"}`}
          >
            {rows.map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between gap-3 px-3 py-2 text-[14px]"
              >
                <span className={t.muted}>{k}</span>
                <span className={`text-right font-bold ${t.heading}`}>{v}</span>
              </div>
            ))}
          </div>

          {p.compatibleModels?.length > 0 && (
            <div>
              <p className="mb-1.5 flex items-center gap-1 text-[12px] font-black uppercase tracking-[0.15em] text-slate-400">
                <Tag size={12} /> Compatible models
              </p>
              <div className="flex flex-wrap gap-1.5">
                {p.compatibleModels.map((m) => (
                  <span
                    key={m}
                    className={`rounded-md border px-2 py-0.5 text-[12px] font-semibold ${t.inner} ${t.heading}`}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {p.description && (
            <div>
              <p className="mb-1 text-[12px] font-black uppercase tracking-[0.15em] text-slate-400">
                Description
              </p>
              <p className={`whitespace-pre-line text-[14px] ${t.body}`}>
                {p.description}
              </p>
            </div>
          )}

          {p.vendor?.name && (
            <div className={`rounded-xl border-2 p-3 ${t.inner}`}>
              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                Sold by
              </p>
              <p
                className={`flex items-center gap-1 text-[14px] font-black ${t.heading}`}
              >
                <Store size={14} /> {p.vendor.name}
                {p.vendor.verified && (
                  <BadgeCheck size={14} className="text-blue-500" />
                )}
              </p>
              <div
                className={`mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] ${t.body}`}
              >
                {(p.vendor.address || p.vendor.city) && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {p.vendor.address || p.vendor.city}
                  </span>
                )}
                {p.vendor.phone && (
                  <a
                    href={`tel:${p.vendor.phone}`}
                    className="flex items-center gap-1 hover:underline"
                  >
                    <Phone size={12} />
                    {p.vendor.phone}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Empty({ isDark, text }) {
  const t = tk(isDark);
  return (
    <div className={`rounded-2xl border-2 px-4 py-14 text-center ${t.card}`}>
      <div
        className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${t.chipNavy}`}
      >
        <Package size={18} />
      </div>
      <p className={`text-[14px] font-black ${t.heading}`}>{text}</p>
      <p className={`mt-1 text-[12px] ${t.muted}`}>
        Try a different search or filter.
      </p>
    </div>
  );
}

function SkeletonGrid({ isDark }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={`h-[380px] animate-pulse rounded-2xl ${isDark ? "bg-white/5" : "bg-slate-200"}`}
        />
      ))}
    </div>
  );
}
