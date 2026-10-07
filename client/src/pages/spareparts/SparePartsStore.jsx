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
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import api from "../../utils/axiosInstance";

/* ---------- store website (Buy button) ---------- */
const STORE_URL = (
  import.meta.env.VITE_SPARE_PARTS_STORE_URL ||
  "https://motordesk-spareparts.onrender.com"
).replace(/\/+$/, "");

// deep-link to a product on the store. Placeholders:
//   :id   -> product id      e.g. /shop/product/:id
//   :slug -> product slug    e.g. /p/:slug
//   :name -> product name    e.g. /shop?search=:name
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

// opens the product on the store in a NEW tab
const openOnStore = (product) => {
  window.open(buyUrl(product), "_blank", "noopener,noreferrer");
};

/* ---------- in-page cache ----------
   Keeps the last data per page (bike/car × products/vendors) while the app
   is open, so switching tabs or coming back shows it instantly; fresh data
   is then fetched quietly in the background. */
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
  const hay = [p.name, p.brand, p.category, p.partNumber, p.vendor?.name, p.description, ...(p.compatibleModels || [])]
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

export default function SparePartsStore({ vehicle = "bike", view = "products" }) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const base = vehicle === "bike" ? "/bike-spare-parts" : "/spare-parts";
  const vehicleLabel = vehicle === "bike" ? "Bike" : "Car";
  const title = `Buy ${vehicleLabel} Spare Parts`;

  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [unassigned, setUnassigned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sort, setSort] = useState("relevance");
  const vendorFilter = searchParams.get("vendor") || "all";

  const [selected, setSelected] = useState(null); // product in details modal

  const cacheKey = `${vehicle}:${view}`;

  const apply = useCallback(
    (data) => {
      if (view === "vendors") {
        setVendors(data?.vendors || []);
        setUnassigned(data?.unassignedProducts || 0);
      } else {
        setProducts(data?.products || []);
      }
    },
    [view],
  );

  // force = Refresh button (always fetch, show spinner)
  const load = useCallback(
    async (force = false) => {
      const cached = pageCache.get(cacheKey);
      if (cached && !force) {
        apply(cached.data); // show instantly
        setLoading(false);
        setError("");
        if (Date.now() - cached.at < PAGE_FRESH_MS) return; // fresh enough
      } else {
        setLoading(true);
        setError("");
      }

      try {
        const url = view === "vendors" ? "/api/spare-parts/vendors" : "/api/spare-parts/products";
        const res = await api.get(url, { params: { vehicle }, timeout: 120000 });
        pageCache.set(cacheKey, { at: Date.now(), data: res.data });
        apply(res.data);
        setError("");
      } catch (err) {
        // keep showing cached data if we have it
        if (!pageCache.has(cacheKey) || force) {
          setError(
            err.response?.data?.message ||
              "Could not load spare parts. The store may be waking up – try again in a minute.",
          );
        }
      } finally {
        setLoading(false);
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
    products.forEach((p) => p.vendor?.id && m.set(String(p.vendor.id), p.vendor.name || "Vendor"));
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
        (stockFilter === "all" || (stockFilter === "in" ? p.inStock : !p.inStock)),
    );
    const price = (p) => p.price ?? Number.MAX_SAFE_INTEGER;
    if (sort === "price-asc") list = [...list].sort((a, b) => price(a) - price(b));
    if (sort === "price-desc") list = [...list].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    if (sort === "discount") list = [...list].sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0));
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, query, category, vendorFilter, stockFilter, sort]);

  const visibleVendors = useMemo(() => {
    if (!query) return vendors;
    const q = query.toLowerCase();
    return vendors.filter((v) =>
      [v.name, v.ownerName, v.city, v.state, v.address, v.phone, v.email, ...(v.categories || []), ...(v.brands || [])]
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
        { label: `${vehicleLabel} products`, value: vendors.reduce((s, v) => s + (v.productCount || 0), 0), icon: Package },
        { label: "In stock", value: vendors.reduce((s, v) => s + (v.inStockCount || 0), 0), icon: Boxes },
      ];
    }
    return [
      { label: `${vehicleLabel} products`, value: products.length, icon: Package },
      { label: "Categories", value: categories.length, icon: Layers },
      { label: "In stock", value: products.filter((p) => p.inStock).length, icon: Boxes },
    ];
  }, [view, vendors, products, categories, vehicleLabel]);

  /* ---------- styles ---------- */
  const card = isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const muted = isDark ? "text-gray-400" : "text-gray-500";
  const strong = isDark ? "text-white" : "text-gray-900";
  const field = `px-4 py-2.5 rounded-xl border-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"
  }`;

  const activeVendorName =
    vendorFilter !== "all" ? vendorOptions.find(([id]) => id === vendorFilter)?.[1] || "Selected vendor" : null;

  /* =================================================================== */
  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 mb-3">
              <ShoppingCart size={14} /> Shop Spare Parts
            </div>
            <h1 className={`text-3xl sm:text-4xl font-bold ${strong}`}>{title}</h1>
            <p className={`mt-1 ${muted}`}>
              {vehicleLabel} parts from MotorDesk Spare Parts vendors. Tap <b>Buy</b> to order on the store.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex p-1 rounded-xl border-2 ${card}`}>
              {[
                { key: "products", label: "All Products", to: base },
                { key: "vendors", label: "Vendors", to: `${base}/vendors` },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => navigate(t.to)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    view === t.key ? "bg-blue-600 text-white shadow" : `${muted} hover:text-blue-600`
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => load(true)}
              disabled={loading}
              title="Refresh"
              className={`p-3 rounded-xl border-2 ${card} ${muted} hover:text-blue-600 disabled:opacity-50`}
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {stats.map((s) => (
            <div key={s.label} className={`p-4 rounded-2xl border ${card}`}>
              <div className="flex items-center gap-2 text-blue-600">
                <s.icon size={16} />
                <span className={`text-xs font-medium ${muted}`}>{s.label}</span>
              </div>
              <p className={`text-2xl font-bold mt-1 ${strong}`}>{loading ? "…" : s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                view === "vendors"
                  ? "Search vendor, city, phone, category or brand…"
                  : `Search part name, brand, part no., ${vehicleLabel.toLowerCase()} model…`
              }
              className={`${field} w-full pl-10`}
            />
          </div>
          {view === "products" && (
            <>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {vendorOptions.length > 0 && (
                <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} className={field}>
                  <option value="all">All vendors</option>
                  {vendorOptions.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              )}
              <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className={field}>
                <option value="all">All stock</option>
                <option value="in">In stock</option>
                <option value="out">Out of stock</option>
              </select>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className={field}>
                <option value="relevance">Sort: Relevance</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Best discount</option>
                <option value="name">Name A–Z</option>
              </select>
            </>
          )}
        </div>

        {/* Body */}
        {loading ? (
          <SkeletonGrid card={card} />
        ) : error ? (
          <div className={`p-10 rounded-2xl border text-center ${card}`}>
            <AlertCircle className="mx-auto text-red-500" size={36} />
            <p className={`mt-3 font-semibold ${strong}`}>{error}</p>
            <button onClick={() => load(true)} className="mt-4 px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold">
              Try again
            </button>
          </div>
        ) : view === "products" ? (
          visibleProducts.length === 0 ? (
            <Empty card={card} strong={strong} muted={muted} text={`No ${vehicleLabel.toLowerCase()} products match your search.`} />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <p className={`text-sm ${muted}`}>
                  Showing {visibleProducts.length} of {products.length} {vehicleLabel.toLowerCase()} products
                </p>
                {activeVendorName && (
                  <button
                    onClick={() => setVendorFilter("all")}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600"
                  >
                    <Store size={12} /> {activeVendorName} <X size={12} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 auto-rows-fr">
                {visibleProducts.map((p) => (
                  <ProductCard
                    key={`${p.id}-${p.name}`}
                    p={p}
                    isDark={isDark}
                    card={card}
                    muted={muted}
                    strong={strong}
                    onView={() => setSelected(p)}
                  />
                ))}
              </div>
            </>
          )
        ) : visibleVendors.length === 0 ? (
          <Empty card={card} strong={strong} muted={muted} text="No vendors found." />
        ) : (
          <>
            {unassigned > 0 && (
              <p className={`text-sm ${muted}`}>
                {unassigned} product{unassigned > 1 ? "s are" : " is"} not linked to a vendor in the store.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 auto-rows-fr">
              {visibleVendors.map((v) => (
                <VendorCard
                  key={v.id}
                  v={v}
                  isDark={isDark}
                  card={card}
                  muted={muted}
                  strong={strong}
                  vehicleLabel={vehicleLabel}
                  onViewProducts={() => navigate(`${base}?vendor=${encodeURIComponent(v.id)}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {selected && (
        <ProductModal p={selected} isDark={isDark} muted={muted} strong={strong} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

/* =================================================================== */

function ProductCard({ p, isDark, card, muted, strong, onView }) {
  const price = rupee(p.price);
  const mrp = p.mrp && p.price !== null && p.mrp > p.price ? rupee(p.mrp) : null;

  return (
    <div className={`h-full rounded-2xl border flex flex-col overflow-hidden transition-all hover:shadow-xl hover:-translate-y-0.5 ${card}`}>
      {/* image: fixed height for every card */}
      <button
        onClick={onView}
        className={`relative h-48 w-full shrink-0 overflow-hidden ${isDark ? "bg-gray-700" : "bg-gray-50"}`}
      >
        {p.images?.[0] ? (
          <img src={p.images[0]} alt={p.name} loading="lazy" className="absolute inset-0 w-full h-full object-contain p-3" />
        ) : (
          <Package size={44} className={`absolute inset-0 m-auto ${muted}`} />
        )}
        {p.discountPercent > 0 && (
          <span className="absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-bold bg-emerald-500 text-white">
            {p.discountPercent}% OFF
          </span>
        )}
        <span
          className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-semibold ${
            p.inStock ? "bg-blue-600 text-white" : "bg-red-500 text-white"
          }`}
        >
          {p.inStock ? "In stock" : "Out of stock"}
        </span>
      </button>

      <div className="p-4 flex flex-col flex-1 gap-2">
        {/* brand + category */}
        <div className="flex items-center gap-1.5 min-h-[22px] flex-wrap">
          {p.brand && (
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${isDark ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
              {p.brand}
            </span>
          )}
          {p.category && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-600">
              {p.category}
            </span>
          )}
        </div>

        {/* name: always 2 lines tall */}
        <button
          onClick={onView}
          title={p.name}
          className={`text-left font-semibold leading-snug line-clamp-2 min-h-[2.75rem] hover:text-blue-600 ${strong}`}
        >
          {p.name}
        </button>

        {/* details: always 2 lines tall */}
        <p className={`text-xs leading-relaxed line-clamp-2 min-h-[2.5rem] ${muted}`}>
          {p.description || (p.partNumber ? `Part no. ${p.partNumber}` : "No description provided.")}
        </p>

        {/* price */}
        <div className="flex items-baseline gap-2 min-h-[32px]">
          {price ? (
            <>
              <span className={`text-xl font-bold ${strong}`}>{price}</span>
              {mrp && <span className={`text-sm line-through ${muted}`}>{mrp}</span>}
            </>
          ) : (
            <span className={`text-sm font-semibold ${muted}`}>Price on store</span>
          )}
        </div>

        {/* stock + vendor */}
        <div className={`text-xs space-y-1 ${muted}`}>
          <p className={`flex items-center gap-1.5 ${p.inStock ? "text-emerald-600" : "text-red-500"}`}>
            <Boxes size={13} /> {stockText(p)}
          </p>
          <p className="flex items-center gap-1.5 truncate" title={p.vendor?.name || ""}>
            <Store size={13} className="shrink-0" />
            <span className="truncate">{p.vendor?.name || "Vendor not listed"}</span>
          </p>
        </div>

        {/* buttons pinned to the bottom */}
        <div className="mt-auto pt-3 grid grid-cols-2 gap-2">
          <button
            onClick={onView}
            className={`py-2 rounded-xl text-sm font-semibold border-2 ${isDark ? "border-gray-600 text-gray-200 hover:bg-gray-700" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
          >
            Details
          </button>
          <button
            onClick={() => openOnStore(p)}
            disabled={!p.inStock}
            title="Opens this product on the MotorDesk store in a new tab"
            className="py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={15} /> Buy
          </button>
        </div>
      </div>
    </div>
  );
}

function VendorCard({ v, isDark, card, muted, strong, vehicleLabel, onViewProducts }) {
  const priceRange =
    v.minPrice === null || v.minPrice === undefined
      ? null
      : v.minPrice === v.maxPrice
        ? rupee(v.minPrice)
        : `${rupee(v.minPrice)} – ${rupee(v.maxPrice)}`;
  const location = v.address || [v.city, v.state].filter(Boolean).join(", ");

  return (
    <div className={`h-full rounded-2xl border p-5 flex flex-col gap-4 ${card}`}>
      <div className="flex items-start gap-4">
        {v.logo ? (
          <img src={v.logo} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
            {initials(v.name)}
          </div>
        )}
        <div className="min-w-0">
          <p className={`font-bold text-lg flex items-center gap-1.5 ${strong}`}>
            <span className="truncate" title={v.name}>{v.name}</span>
            {v.verified && <BadgeCheck size={18} className="text-blue-500 shrink-0" />}
          </p>
          {v.ownerName && v.ownerName !== v.name && <p className={`text-sm ${muted}`}>{v.ownerName}</p>}
        </div>
      </div>

      <div className={`text-sm space-y-1.5 ${muted}`}>
        <p className="flex items-center gap-2"><MapPin size={14} className="shrink-0" />{location || "Location not listed"}</p>
        {v.phone && <p className="flex items-center gap-2"><Phone size={14} className="shrink-0" />{v.phone}</p>}
        {v.email && <p className="flex items-center gap-2 truncate"><Mail size={14} className="shrink-0" /><span className="truncate">{v.email}</span></p>}
        {v.gst && <p className="flex items-center gap-2"><Hash size={14} className="shrink-0" />GST {v.gst}</p>}
      </div>

      <div className={`grid grid-cols-3 rounded-xl p-3 text-center ${isDark ? "bg-gray-900/50" : "bg-gray-50"}`}>
        <div>
          <p className={`text-xs ${muted}`}>{vehicleLabel} products</p>
          <p className={`text-lg font-bold ${strong}`}>{v.productCount ?? 0}</p>
        </div>
        <div>
          <p className={`text-xs ${muted}`}>In stock</p>
          <p className="text-lg font-bold text-emerald-600">{v.inStockCount ?? 0}</p>
        </div>
        <div>
          <p className={`text-xs ${muted}`}>Out of stock</p>
          <p className="text-lg font-bold text-red-500">{v.outOfStockCount ?? 0}</p>
        </div>
      </div>

      <div className="space-y-2">
        {priceRange && (
          <p className={`text-sm ${muted}`}>Price range: <b className={strong}>{priceRange}</b></p>
        )}
        {v.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {v.categories.slice(0, 6).map((c) => (
              <span key={c} className={`px-2 py-0.5 rounded-full text-xs ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>{c}</span>
            ))}
            {v.categories.length > 6 && <span className={`text-xs ${muted}`}>+{v.categories.length - 6} more</span>}
          </div>
        )}
      </div>

      <button
        onClick={onViewProducts}
        disabled={!v.productCount}
        className="mt-auto py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {v.productCount ? <>View {v.productCount} products <ArrowRight size={16} /></> : `No ${vehicleLabel.toLowerCase()} products`}
      </button>
    </div>
  );
}

function ProductModal({ p, isDark, muted, strong, onClose }) {
  const [img, setImg] = useState(0);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const suitable = { bike: "Bike", car: "Car", both: "Bike & Car" }[p.vehicleType] || null;
  const rows = [
    ["Brand", p.brand],
    ["Category", p.category],
    ["Part number", p.partNumber],
    ["Selling price", rupee(p.price) ? `${rupee(p.price)}${p.gstRate ? " (incl. GST)" : ""}` : "See on store"],
    ["Price before GST", p.gstRate && p.basePrice !== null ? rupee(p.basePrice) : null],
    ["GST", p.gstRate ? `${p.gstRate}%` : null],
    ["MRP", p.mrp ? rupee(p.mrp) : null],
    ["You save", p.mrp && p.price !== null && p.mrp > p.price ? `${rupee(p.mrp - p.price)} (${p.discountPercent}%)` : null],
    ["Stock", stockText(p)],
    ["Warranty", p.warranty],
    ["Suitable for", suitable],
    ["Sold by", p.vendor?.name],
  ].filter(([, v]) => v !== null && v !== undefined && v !== "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${isDark ? "bg-gray-800" : "bg-white"}`}
      >
        <div className={`flex items-start justify-between p-5 border-b ${isDark ? "border-gray-700" : "border-gray-100"}`}>
          <div>
            <p className={`text-xs ${muted}`}>{[p.brand, p.category].filter(Boolean).join(" • ")}</p>
            <h2 className={`text-xl font-bold ${strong}`}>{p.name}</h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${muted} hover:bg-gray-500/10`}>
            <X size={20} />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 p-5">
          <div>
            <div className={`relative aspect-square rounded-xl overflow-hidden ${isDark ? "bg-gray-700" : "bg-gray-50"}`}>
              {p.images?.[img] ? (
                <img src={p.images[img]} alt={p.name} className="absolute inset-0 w-full h-full object-contain p-4" />
              ) : (
                <Package size={64} className={`absolute inset-0 m-auto ${muted}`} />
              )}
            </div>
            {p.images?.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {p.images.map((src, i) => (
                  <button
                    key={src + i}
                    onClick={() => setImg(i)}
                    className={`w-16 h-16 shrink-0 rounded-lg border-2 overflow-hidden ${i === img ? "border-blue-500" : "border-transparent"}`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="flex items-baseline gap-3 flex-wrap">
              {rupee(p.price) ? (
                <>
                  <span className={`text-3xl font-bold ${strong}`}>{rupee(p.price)}</span>
                  {p.mrp && p.price !== null && p.mrp > p.price && (
                    <>
                      <span className={`line-through ${muted}`}>{rupee(p.mrp)}</span>
                      <span className="text-emerald-500 font-semibold">{p.discountPercent}% off</span>
                    </>
                  )}
                </>
              ) : (
                <span className={`text-lg font-semibold ${muted}`}>Price shown on store</span>
              )}
            </div>

            <table className="w-full text-sm">
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k} className={`border-b ${isDark ? "border-gray-700" : "border-gray-100"}`}>
                    <td className={`py-2 pr-4 ${muted}`}>{k}</td>
                    <td className={`py-2 font-medium ${strong}`}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {p.compatibleModels?.length > 0 && (
              <div>
                <p className={`text-sm font-semibold mb-2 flex items-center gap-1 ${strong}`}><Tag size={14} /> Compatible models</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.compatibleModels.map((m) => (
                    <span key={m} className={`px-2 py-1 rounded-lg text-xs ${isDark ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700"}`}>{m}</span>
                  ))}
                </div>
              </div>
            )}

            {p.description && (
              <div>
                <p className={`text-sm font-semibold mb-1 ${strong}`}>Description</p>
                <p className={`text-sm whitespace-pre-line ${muted}`}>{p.description}</p>
              </div>
            )}

            {p.vendor?.name && (
              <div className={`p-4 rounded-xl ${isDark ? "bg-gray-700/50" : "bg-blue-50"}`}>
                <p className={`text-xs ${muted}`}>Sold by</p>
                <p className={`font-semibold flex items-center gap-1 ${strong}`}>
                  <Store size={16} /> {p.vendor.name}
                  {p.vendor.verified && <BadgeCheck size={16} className="text-blue-500" />}
                </p>
                <div className={`text-sm mt-1 flex flex-wrap gap-x-4 ${muted}`}>
                  {(p.vendor.address || p.vendor.city) && <span className="flex items-center gap-1"><MapPin size={13} />{p.vendor.address || p.vendor.city}</span>}
                  {p.vendor.phone && <span className="flex items-center gap-1"><Phone size={13} />{p.vendor.phone}</span>}
                </div>
              </div>
            )}

            <button
              onClick={() => openOnStore(p)}
              disabled={!p.inStock}
              className="w-full py-3 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={18} /> {p.inStock ? "Buy on MotorDesk Store" : "Out of stock"}
              {p.inStock && <ExternalLink size={16} />}
            </button>
            {p.inStock && <p className={`text-xs text-center ${muted}`}>Opens this product on the store in a new tab</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Empty({ card, strong, muted, text }) {
  return (
    <div className={`p-12 rounded-2xl border text-center ${card}`}>
      <Package className={`mx-auto ${muted}`} size={40} />
      <p className={`mt-3 font-semibold ${strong}`}>{text}</p>
      <p className={`text-sm ${muted}`}>Try a different search or filter.</p>
    </div>
  );
}

function SkeletonGrid({ card }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={`rounded-2xl border overflow-hidden animate-pulse ${card}`}>
          <div className="h-48 bg-gray-400/20" />
          <div className="p-4 space-y-3">
            <div className="h-3 w-1/2 rounded bg-gray-400/20" />
            <div className="h-4 w-3/4 rounded bg-gray-400/20" />
            <div className="h-6 w-1/3 rounded bg-gray-400/20" />
            <div className="h-9 rounded-xl bg-gray-400/20" />
          </div>
        </div>
      ))}
    </div>
  );
}