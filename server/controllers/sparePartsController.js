// server/controllers/sparePartsController.js
//
// Read-only bridge to the MotorDesk Spare Parts store.
// The CRM frontend calls OUR server, our server calls the store backend.
// (no CORS problems, one place to change URLs, data cleaned into one shape)
//
// .env (all optional):
//   SPARE_PARTS_API_URL=https://motordesk-spareparts-backend.onrender.com
//   SPARE_PARTS_PRODUCTS_PATH=/api/products
//   SPARE_PARTS_VENDORS_PATH=/api/vendors

import axios from "axios";

// Read .env at request time (server.js runs dotenv.config() AFTER imports,
// so reading process.env at module load would miss the .env values)
const apiUrl = () =>
  (
    process.env.SPARE_PARTS_API_URL ||
    "https://motordesk-spareparts-backend.onrender.com"
  ).replace(/\/+$/, "");

// first path that answers wins (env value is tried first).
// The store is an "ERP + marketplace", so marketplace/shop style paths are included.
const PRODUCT_CANDIDATES = [
  "/api/products",
  "/api/marketplace/products",
  "/api/marketplace",
  "/api/marketplace/listings",
  "/api/public/products",
  "/api/public/marketplace",
  "/api/shop/products",
  "/api/store/products",
  "/api/catalog",
  "/api/catalog/products",
  "/api/parts",
  "/api/spare-parts",
  "/api/inventory",
  "/api/items",
  "/api/listings",
  "/api/product",
  "/api/products/all",
  "/api/v1/products",
  "/products",
];

const VENDOR_CANDIDATES = [
  "/api/vendors",
  "/api/shops",
  "/api/suppliers",
  "/api/sellers",
  "/api/stores",
  "/api/businesses",
  "/api/marketplace/vendors",
  "/api/marketplace/shops",
  "/api/public/vendors",
  "/api/public/shops",
  "/api/vendor",
  "/api/shop",
  "/vendors",
];

// the store's API is versioned (/api/v1/...): try v1 public paths first
const withV1 = (list) => [
  ...list.filter((p) => p.startsWith("/api/")).map((p) => p.replace(/^\/api\//, "/api/v1/")),
  ...list,
];

const productPaths = () =>
  [...new Set([process.env.SPARE_PARTS_PRODUCTS_PATH, ...withV1(PRODUCT_CANDIDATES)].filter(Boolean))];

const vendorPaths = () =>
  [...new Set([process.env.SPARE_PARTS_VENDORS_PATH, ...withV1(VENDOR_CANDIDATES)].filter(Boolean))];

/* ---------------- optional store login ----------------
   If the store has no public product list, the CRM signs in with a store
   account and reads the list with that token.
     SPARE_PARTS_LOGIN_EMAIL=...
     SPARE_PARTS_LOGIN_PASSWORD=...
     SPARE_PARTS_LOGIN_PATH=/api/v1/auth/login   (optional)
-------------------------------------------------------- */
let storeToken = null;
let storeTokenAt = 0;
const TOKEN_MS = 6 * 60 * 60 * 1000; // re-login every 6h

const hasLogin = () =>
  Boolean(process.env.SPARE_PARTS_LOGIN_EMAIL && process.env.SPARE_PARTS_LOGIN_PASSWORD);

const findToken = (body) => {
  if (!body || typeof body !== "object") return null;
  for (const k of ["token", "accessToken", "access_token", "jwt", "authToken"]) {
    if (typeof body[k] === "string" && body[k].length > 10) return body[k];
  }
  for (const v of Object.values(body)) {
    if (v && typeof v === "object") {
      const t = findToken(v);
      if (t) return t;
    }
  }
  return null;
};

let loginInFlight = null;
async function getStoreToken(force = false) {
  if (!hasLogin()) return null;
  if (!force && storeToken && Date.now() - storeTokenAt < TOKEN_MS) return storeToken;
  // products + vendors load in parallel -> share one login request
  if (loginInFlight) return loginInFlight;
  loginInFlight = doStoreLogin().finally(() => {
    loginInFlight = null;
  });
  return loginInFlight;
}

async function doStoreLogin() {

  const loginPaths = [
    process.env.SPARE_PARTS_LOGIN_PATH,
    "/api/v1/auth/login",
    "/api/v1/users/login",
    "/api/v1/login",
    "/api/auth/login",
  ].filter(Boolean);

  const email = process.env.SPARE_PARTS_LOGIN_EMAIL;
  const password = process.env.SPARE_PARTS_LOGIN_PASSWORD;

  for (const path of [...new Set(loginPaths)]) {
    try {
      const res = await axios.post(
        `${apiUrl()}${path}`,
        { email, password, identifier: email, username: email },
        { timeout: 60000, headers: { Accept: "application/json" } },
      );
      const token =
        findToken(res.data) ||
        (res.headers?.authorization || "").replace(/^Bearer\s+/i, "") ||
        null;
      if (token) {
        storeToken = token;
        storeTokenAt = Date.now();
        console.log(`🔑 spare-parts: signed in to store via ${path}`);
        return token;
      }
    } catch (err) {
      const st = err.response?.status;
      if (st === 401 || st === 400) {
        console.error(`spare-parts: store login rejected at ${path} (${st}) – check SPARE_PARTS_LOGIN_EMAIL / PASSWORD`);
        return null;
      }
      // 404 -> try next login path
    }
  }
  console.error("spare-parts: could not find the store login route – set SPARE_PARTS_LOGIN_PATH");
  return null;
}

// remember which path worked, so later requests go straight to it
const workingPath = new Map(); // "products" | "vendors" -> path

const CACHE_MS = 2 * 60 * 1000;
const cache = new Map(); // key -> { at, data }

/* ---------------- helpers ---------------- */

const pick = (obj, ...keys) => {
  for (const k of keys) {
    const v = k.split(".").reduce((o, p) => (o == null ? o : o[p]), obj);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
};

const num = (v) => {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const cleaned = String(v).replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

// the store may answer [..], {data:[..]}, {products:[..]}, {data:{products:[..]}} ...
const extractList = (body, keys) => {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== "object") return [];
  for (const k of [...keys, "data", "items", "results", "rows", "docs"]) {
    const v = body[k];
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") {
      const inner = extractList(v, keys);
      if (inner.length) return inner;
    }
  }
  return [];
};

const absUrl = (u) => {
  if (!u || typeof u !== "string") return null;
  if (/^(https?:)?\/\//i.test(u) || u.startsWith("data:")) return u;
  return `${apiUrl()}/${u.replace(/^\/+/, "")}`;
};

const toArray = (v) =>
  Array.isArray(v)
    ? v
    : typeof v === "string"
      ? v.split(",").map((s) => s.trim()).filter(Boolean)
      : v
        ? [v]
        : [];

/* ---------- deep field search (store field names are not fixed) ---------- */

// walk an object (and the first item of arrays) and return the first value
// whose key matches `test`; `accept` validates the value
const deepFind = (obj, test, accept = (v) => v !== undefined && v !== null && v !== "", depth = 0, seen = new Set()) => {
  if (!obj || typeof obj !== "object" || depth > 3 || seen.has(obj)) return undefined;
  seen.add(obj);
  for (const [k, v] of Object.entries(obj)) {
    if (test(k) && accept(v)) return v;
  }
  for (const v of Object.values(obj)) {
    const target = Array.isArray(v) ? v[0] : v;
    if (target && typeof target === "object") {
      const hit = deepFind(target, test, accept, depth + 1, seen);
      if (hit !== undefined) return hit;
    }
  }
  return undefined;
};

const isNumLike = (v) => num(v) !== null && typeof v !== "boolean" && typeof v !== "object";

/* ---------- vehicle type ----------
   explicit: read from a vehicle field   -> "bike" | "car" | "both"
   inferred: from name/category words     -> "bike" | "car" | null      */
const BIKE_RE = /\b(bike|bikes|motor\s?cycle|motorbike|scooter|scooty|moped|two[\s_-]?wheelers?|2[\s_-]?wheelers?|2w|tw)\b/i;
const CAR_RE = /\b(car|cars|four[\s_-]?wheelers?|4[\s_-]?wheelers?|4w|fw|suv|sedan|hatchback|muv|lmv)\b/i;

const classify = (text) => {
  const bike = BIKE_RE.test(text);
  const car = CAR_RE.test(text);
  if (bike && car) return "both";
  if (bike) return "bike";
  if (car) return "car";
  if (/\b(all|universal|both|common)\b/i.test(text)) return "both";
  return null;
};

const VEHICLE_KEY = /^(vehicle_?types?|vehicle_?category|vehicle_?class|vehicle|vehicles|segment|for_?vehicle|applicable_?(for|to)|suitable_?for|wheeler_?type|wheelers?|vehicle_?segment)$/i;

const explicitVehicle = (p) => {
  const raw = deepFind(p, (k) => VEHICLE_KEY.test(k));
  if (raw === undefined) return null;
  const text = (Array.isArray(raw) ? raw : [raw])
    .map((v) => (typeof v === "object" ? Object.values(v).join(" ") : String(v)))
    .join(" ")
    .replace(/_/g, " ");
  return classify(text);
};

// part names that only exist on cars / only on bikes (fallback when no field)
const CAR_ONLY_PARTS = /\b(ac compressor|cabin (ac )?filter|radiator|coolant|alternator|wiper|tyre \d{3}\/\d{2}|r1[3-9]\b|power steering|clutch master|timing belt|cv joint|strut|fuel pump relay)\b/i;
const BIKE_ONLY_PARTS = /\b(chain sprocket|sprocket|clutch cable|accelerator cable|brake shoe|disc brake pad \(front\)|kick ?start|carburet|headlight assembly|indicator|handle ?bar|chain lube)\b/i;

const inferVehicle = (name, category, brand) => {
  const text = `${name || ""} ${category || ""} ${brand || ""}`;
  return classify(text) || (CAR_ONLY_PARTS.test(text) ? "car" : BIKE_ONLY_PARTS.test(text) ? "bike" : null);
};

/* ---------- vendor ---------- */
const VENDOR_OBJ_KEY = /^(vendor|seller|store|shop|supplier|merchant|business|company|organization|organisation|tenant|owner|createdBy|user|partner|dealer)$/i;
const VENDOR_ID_KEY = /^(vendor|seller|store|shop|supplier|merchant|business|company|organization|organisation|tenant|owner|createdBy|user|partner|dealer)_?id$/i;
const VENDOR_NAME_KEY = /^(vendor|seller|store|shop|supplier|merchant|business|company|dealer)_?name$/i;

const normalizeVendor = (v) => {
  if (!v) return null;
  if (typeof v !== "object") return { id: String(v), name: null };
  const count = num(
    pick(v, "productCount", "productsCount", "totalProducts", "_count.products", "_count.product", "_count.inventory"),
  );
  return {
    id: String(pick(v, "id", "_id", "vendorId", "shopId", "uuid") ?? ""),
    name:
      pick(v, "shopName", "storeName", "businessName", "companyName", "tradeName", "displayName", "name", "vendorName", "fullName", "ownerName") ||
      null,
    ownerName: pick(v, "ownerName", "contactPerson", "contactName", "fullName") || null,
    phone: pick(v, "phone", "mobile", "phoneNumber", "contactNumber", "whatsapp", "contact.phone") || null,
    email: pick(v, "email", "contactEmail", "contact.email") || null,
    city: pick(v, "city", "address.city", "location.city") || null,
    state: pick(v, "state", "address.state", "location.state") || null,
    address:
      (typeof v.address === "string" ? v.address : null) ||
      [pick(v, "address.line1", "address.street", "addressLine1"), pick(v, "address.city", "city"), pick(v, "address.state", "state")]
        .filter(Boolean)
        .join(", ") ||
      null,
    gst: pick(v, "gstNumber", "gstin", "gst") || null,
    logo: absUrl(pick(v, "logo", "logoUrl", "image", "avatar", "profileImage", "photo")),
    rating: num(pick(v, "rating", "avgRating")),
    verified: Boolean(pick(v, "verified", "isVerified", "isApproved", "kycVerified")),
    declaredProductCount: count,
  };
};

const normalizeProduct = (p) => {
  /* images */
  const images = [
    ...toArray(pick(p, "images", "imageUrls", "photos", "gallery", "media")),
    pick(p, "image", "imageUrl", "thumbnail", "photo", "img", "coverImage", "mainImage"),
  ]
    .map((i) => (i && typeof i === "object" ? pick(i, "url", "secure_url", "src", "path", "imageUrl") : i))
    .map(absUrl)
    .filter(Boolean);

  /* vendor */
  const vendorObj = deepFind(p, (k) => VENDOR_OBJ_KEY.test(k), (v) => v && typeof v === "object" && !Array.isArray(v));
  let vendor = normalizeVendor(vendorObj);
  const vendorId = deepFind(p, (k) => VENDOR_ID_KEY.test(k), (v) => typeof v === "string" || typeof v === "number");
  const vendorName = deepFind(p, (k) => VENDOR_NAME_KEY.test(k), (v) => typeof v === "string" && v.trim());
  if (!vendor && (vendorId || vendorName)) vendor = { id: vendorId ? String(vendorId) : null, name: null };
  if (vendor) {
    if (!vendor.id && vendorId) vendor.id = String(vendorId);
    if (!vendor.name && vendorName) vendor.name = vendorName;
  }

  /* price */
  let price = num(pick(p, "sellingPrice", "salePrice", "discountPrice", "offerPrice", "price", "unitPrice", "rate"));
  if (price === null)
    price = num(deepFind(p, (k) => /^(selling|sale|offer|special|final|unit|retail|base)?_?(price|rate)$/i.test(k), isNumLike));
  let mrp = num(pick(p, "mrp", "MRP", "originalPrice", "actualPrice", "listPrice", "maxRetailPrice"));
  if (mrp === null) mrp = num(deepFind(p, (k) => /^(mrp|max_?retail_?price|list_?price|original_?price)$/i.test(k), isNumLike));
  if (price === null && mrp !== null) price = mrp;

  /* GST: the store shows selling price INCLUDING GST (e.g. 251 + 18% = 296.18).
     MRP is already tax-inclusive, so only the selling price gets GST added. */
  const gstRate = num(
    pick(p, "gstRate", "gst", "gstPercent", "gstPercentage", "taxRate", "taxPercent", "tax") ??
      deepFind(p, (k) => /^(gst|igst|tax)_?(rate|percent|percentage)?$/i.test(k), isNumLike),
  );
  const priceIncludesTax = Boolean(pick(p, "priceIncludesTax", "taxInclusive", "isTaxInclusive", "inclusiveOfTax"));
  const basePrice = price;
  if (price !== null && gstRate && gstRate > 0 && gstRate <= 40 && !priceIncludesTax) {
    price = Math.round(price * (1 + gstRate / 100) * 100) / 100;
  }
  if (mrp !== null && price !== null && mrp < price) mrp = price;

  /* stock */
  let stock = num(pick(p, "stock", "quantity", "qty", "stockQuantity", "availableQuantity", "countInStock", "inventory.quantity"));
  if (stock === null)
    stock = num(deepFind(p, (k) => /^(stock|qty|quantity|on_?hand|available_?(qty|quantity|stock)|current_?stock|stock_?(qty|quantity))$/i.test(k), isNumLike));

  /* category / brand */
  const categoryRaw = pick(p, "category", "categoryName", "category.name", "subCategory", "type");
  const category = typeof categoryRaw === "object" ? pick(categoryRaw, "name", "title") : categoryRaw;
  const brandRaw = pick(p, "brand", "brandName", "manufacturer", "make");
  const brand = typeof brandRaw === "object" ? pick(brandRaw, "name", "title") : brandRaw;
  const name = pick(p, "name", "productName", "title", "partName") || "Unnamed product";

  const compatible = toArray(
    pick(p, "compatibleModels", "compatibleVehicles", "compatibility", "vehicleModels", "fitment", "fitments", "models"),
  )
    .map((m) => (typeof m === "object" ? [pick(m, "brand", "make"), pick(m, "model", "name")].filter(Boolean).join(" ") : String(m)))
    .filter(Boolean);

  const explicit = explicitVehicle(p);
  const vehicleType = explicit || inferVehicle(name, category, brand) || "unknown";

  return {
    id: String(pick(p, "id", "_id", "productId", "uuid", "sku") ?? ""),
    slug: pick(p, "slug") || null,
    name,
    description: pick(p, "description", "details", "shortDescription", "about", "specifications") || "",
    brand: brand || null,
    category: category || null,
    partNumber: pick(p, "partNumber", "partNo", "sku", "oemNumber", "oemPartNumber", "code", "hsnCode") || null,
    price, // incl. GST (same as the store)
    basePrice, // before GST
    gstRate: gstRate || null,
    mrp,
    discountPercent:
      price !== null && mrp ? Math.max(0, Math.round(((mrp - price) / mrp) * 100)) : null,
    stock,
    inStock:
      stock === null
        ? pick(p, "inStock", "isAvailable", "available", "isActive") !== false
        : stock > 0,
    unit: pick(p, "unit", "uom") || null,
    warranty: pick(p, "warranty", "warrantyPeriod") || null,
    compatibleModels: compatible,
    images,
    vendor,
    vehicleType, // bike | car | both | unknown
    vehicleSource: explicit ? "field" : vehicleType === "unknown" ? "none" : "name",
    rating: num(pick(p, "rating", "avgRating", "averageRating")),
    createdAt: pick(p, "createdAt", "created_at") || null,
  };
};

async function fetchFirst(paths, listKeys, kind = "products", quiet = false) {
  const known = workingPath.get(kind);
  if (known) paths = [known, ...paths.filter((p) => p !== known)];
  const key = apiUrl() + "|" + kind;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;

  const attempts = []; // what each store URL answered (for the error message/logs)
  let emptyHit = null; // valid JSON but no items (store may just be empty)

  for (const path of paths) {
    const url = `${apiUrl()}${path}`;
    try {
      // Render free instances sleep: first call can take ~50s
      const res = await axios.get(url, {
        timeout: 60000,
        params: { limit: 1000 },
        headers: { Accept: "application/json" },
      });
      const list = extractList(res.data, listKeys);
      if (Array.isArray(res.data) || list.length) {
        const data = { list, path };
        cache.set(key, { at: Date.now(), data });
        if (workingPath.get(kind) !== path) {
          workingPath.set(kind, path);
          console.log(`✅ spare-parts: using ${apiUrl()}${path} for ${kind}`);
        }
        return data;
      }
      const isHtml = typeof res.data === "string" && /<html|<!doctype/i.test(res.data);
      attempts.push({ url, status: res.status, note: isHtml ? "returned a web page, not JSON" : "no product list in JSON" });
      if (!emptyHit && res.data && typeof res.data === "object") emptyHit = { list: [], path };
    } catch (err) {
      const status = err.response?.status;

      // protected route -> retry with the store login token (if configured)
      if ((status === 401 || status === 403) && hasLogin()) {
        try {
          let token = await getStoreToken();
          let res2;
          try {
            res2 = await axios.get(url, {
              timeout: 60000,
              params: { limit: 1000 },
              headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
            });
          } catch (e2) {
            if (e2.response?.status === 401 && token) {
              token = await getStoreToken(true); // token expired -> login again
              res2 = await axios.get(url, {
                timeout: 60000,
                params: { limit: 1000 },
                headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
              });
            } else throw e2;
          }
          const list2 = extractList(res2.data, listKeys);
          if (Array.isArray(res2.data) || list2.length) {
            const data = { list: list2, path };
            cache.set(key, { at: Date.now(), data });
            if (workingPath.get(kind) !== path) {
              workingPath.set(kind, path);
              console.log(`✅ spare-parts: using ${url} (signed in) for ${kind}`);
            }
            return data;
          }
        } catch {
          // fall through and record the original 401/403
        }
      }

      attempts.push({
        url,
        status: status || err.code || "ERROR",
        note:
          status === 401 || status === 403
            ? "login required"
            : status === 404
              ? "not found"
              : err.code === "ECONNABORTED"
                ? "timed out (store asleep?)"
                : err.response?.data?.message || err.message,
      });
      // store asleep -> no point trying more paths now
      if (err.code === "ECONNABORTED") break;
    }
  }

  if (emptyHit) return emptyHit;

  if (!quiet) {
    console.error("spare-parts: store URLs tried:");
    attempts.forEach((t) => console.error(`   ${t.status}  ${t.url}  -> ${t.note}`));
  }

  const e = new Error("Spare parts store not reachable");
  e.attempts = attempts;
  e.code = attempts.some((t) => t.status === "ECONNABORTED") ? "ECONNABORTED" : undefined;
  throw e;
}

// Bike page -> bike parts only, Car page -> car parts only.
// "both" (universal) parts show in both. Parts we cannot classify are hidden
// once the store data has any explicit vehicle info.
const filterVehicle = (products, vehicle) => {
  if (vehicle !== "bike" && vehicle !== "car") return products;
  const anyExplicit = products.some((p) => p.vehicleSource === "field");
  return products.filter(
    (p) =>
      p.vehicleType === vehicle ||
      p.vehicleType === "both" ||
      (p.vehicleType === "unknown" && !anyExplicit),
  );
};

const storeError = (res, err) => {
  console.error("spare-parts store error:", err.message);
  const tried = err.attempts || [];

  let message = "Could not load spare parts right now";
  if (err.code === "ECONNABORTED") {
    message = "Spare parts store is waking up, please try again in a minute";
  } else if (tried.some((t) => t.status === 401 || t.status === 403)) {
    const t = tried.find((x) => x.status === 401 || x.status === 403);
    message = hasLogin()
      ? `Store login failed for ${new URL(t.url).pathname} – check SPARE_PARTS_LOGIN_EMAIL / SPARE_PARTS_LOGIN_PASSWORD in server/.env`
      : `Store needs login for ${new URL(t.url).pathname} – add SPARE_PARTS_LOGIN_EMAIL and SPARE_PARTS_LOGIN_PASSWORD to server/.env`;
  } else if (tried.length && tried.every((t) => t.status === 404)) {
    message = `The store has no public product list at any known path (${tried.length} tried). Set SPARE_PARTS_PRODUCTS_PATH in server/.env to the store's product-list route.`;
  } else if (tried.some((t) => ["ENOTFOUND", "ECONNREFUSED"].includes(t.status))) {
    message = `Cannot reach the store at ${apiUrl()} – check SPARE_PARTS_API_URL`;
  }

  return res.status(502).json({ message, tried });
};

/* ---------------- one-time sample log ----------------
   Prints one raw store product + vendor so field names can be checked. */
let sampleLogged = false;
const logSample = (rawProducts, rawVendors) => {
  if (sampleLogged || !rawProducts.length) return;
  sampleLogged = true;
  const cut = (o) => JSON.stringify(o, null, 2).slice(0, 2500);
  console.log("\n🧩 spare-parts SAMPLE product from store (first item):\n" + cut(rawProducts[0]));
  if (rawVendors?.length) console.log("🧩 spare-parts SAMPLE vendor from store:\n" + cut(rawVendors[0]));
  else console.log("🧩 spare-parts: no vendor list endpoint found");
};

let vendorMissAt = 0; // remember "no vendor endpoint" for a while
const VENDOR_MISS_MS = 30 * 60 * 1000;
async function loadVendors() {
  if (Date.now() - vendorMissAt < VENDOR_MISS_MS) return [];
  try {
    const { list } = await fetchFirst(vendorPaths(), ["vendors", "vendor", "sellers", "stores", "shops", "suppliers", "businesses"], "vendors", true);
    if (!list.length) vendorMissAt = Date.now();
    return list;
  } catch {
    vendorMissAt = Date.now();
    return [];
  }
}

// attach vendor names to products using the vendor list (match by id)
const linkVendors = (products, vendors) => {
  const byId = new Map(vendors.filter((v) => v.id).map((v) => [String(v.id), v]));
  // if the store has exactly one vendor and products carry no vendor,
  // they belong to that vendor
  const single = vendors.length === 1 ? vendors[0] : null;
  return products.map((p) => {
    const match = p.vendor?.id ? byId.get(String(p.vendor.id)) : null;
    if (match) {
      const own = Object.fromEntries(Object.entries(p.vendor).filter(([, v]) => v));
      return { ...p, vendor: { ...match, ...own, name: own.name || match.name } };
    }
    if (!p.vendor && single) return { ...p, vendor: single };
    return p;
  });
};

/* ---------------- fast store snapshot ----------------
   The store (Render free plan) sleeps and can take 30-50s to answer.
   So we keep ONE snapshot of products + vendors in memory:
     - fresh  (< 5 min)  -> served instantly
     - stale  (< 24 h)   -> served instantly, refreshed in the background
     - none / too old    -> fetched now
   It is also loaded at server start and refreshed every 10 min, which
   keeps the store awake so users almost never wait.
     SPARE_PARTS_REFRESH_MINUTES=10   (0 = no background refresh)
-------------------------------------------------------- */
const FRESH_MS = 5 * 60 * 1000;
const STALE_MS = 24 * 60 * 60 * 1000;

let snapshot = null; // { at, path, vendors, all }
let refreshing = null;

async function refreshSnapshot() {
  if (refreshing) return refreshing; // share one refresh between requests
  refreshing = (async () => {
    cache.clear(); // force real fetches (fetchFirst has its own short cache)
    const started = Date.now();
    const [productRes, rawVendors] = await Promise.all([
      fetchFirst(productPaths(), ["products", "product", "listings", "items", "parts", "inventory"], "products"),
      loadVendors(),
    ]);
    logSample(productRes.list, rawVendors);

    const vendors = rawVendors.map(normalizeVendor).filter((v) => v && (v.id || v.name));
    const all = linkVendors(productRes.list.map(normalizeProduct), vendors);
    snapshot = { at: Date.now(), path: productRes.path, vendors, all };
    console.log(
      `🛒 spare-parts: ${all.length} products, ${vendors.length} vendors loaded in ${((Date.now() - started) / 1000).toFixed(1)}s`,
    );
    return snapshot;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function getSnapshot() {
  const age = snapshot ? Date.now() - snapshot.at : Infinity;
  if (age < FRESH_MS) return snapshot;
  if (age < STALE_MS) {
    refreshSnapshot().catch((e) => console.error("spare-parts background refresh failed:", e.message));
    return snapshot; // instant, slightly old data
  }
  return refreshSnapshot();
}

// warm up at server start + keep fresh (and keep the store awake)
setTimeout(() => {
  refreshSnapshot().catch((e) => console.error("spare-parts warm-up failed:", e.message));
  const mins = Number(process.env.SPARE_PARTS_REFRESH_MINUTES ?? 10);
  if (mins > 0) {
    setInterval(() => {
      refreshSnapshot().catch((e) => console.error("spare-parts refresh failed:", e.message));
    }, mins * 60 * 1000).unref();
  }
}, 3000).unref();

async function loadAll(vehicle) {
  const snap = await getSnapshot();
  return { ...snap, products: filterVehicle(snap.all, vehicle) };
}

/* ---------------- controllers ---------------- */

// GET /api/spare-parts/products?vehicle=bike|car&vendor=<id>
export const getSpareParts = async (req, res) => {
  try {
    const vehicle = String(req.query.vehicle || "").toLowerCase();
    const { path, products } = await loadAll(vehicle);
    const vendorId = req.query.vendor ? String(req.query.vendor) : null;
    const list = vendorId ? products.filter((p) => String(p.vendor?.id) === vendorId) : products;
    res.json({ source: path, count: list.length, products: list });
  } catch (err) {
    storeError(res, err);
  }
};

// GET /api/spare-parts/vendors?vehicle=bike|car
// vendor cards only (no product lists) with product / stock counts
export const getSparePartVendors = async (req, res) => {
  try {
    const vehicle = String(req.query.vehicle || "").toLowerCase();
    const { vendors: vendorList, products } = await loadAll(vehicle);

    const map = new Map();
    for (const v of vendorList) map.set(String(v.id || v.name), { ...v, items: [] });

    for (const p of products) {
      const key = p.vendor?.id ? String(p.vendor.id) : p.vendor?.name || null;
      if (!key) continue; // product without a vendor -> not counted under any vendor
      if (!map.has(key)) {
        map.set(key, {
          ...(p.vendor || {}),
          id: key,
          name: p.vendor?.name || "Unnamed vendor",
          items: [],
        });
      }
      map.get(key).items.push(p);
    }

    const vendors = [...map.values()]
      .map(({ items, ...v }) => {
        const prices = items.map((p) => p.price).filter((x) => x !== null);
        return {
          ...v,
          productCount: items.length,
          inStockCount: items.filter((p) => p.inStock).length,
          outOfStockCount: items.filter((p) => !p.inStock).length,
          totalStockUnits: items.reduce((s, p) => s + (p.stock || 0), 0),
          categories: [...new Set(items.map((p) => p.category).filter(Boolean))],
          brands: [...new Set(items.map((p) => p.brand).filter(Boolean))],
          minPrice: prices.length ? Math.min(...prices) : null,
          maxPrice: prices.length ? Math.max(...prices) : null,
        };
      })
      .sort((a, b) => b.productCount - a.productCount || String(a.name).localeCompare(String(b.name)));

    res.json({
      count: vendors.length,
      unassignedProducts: products.filter((p) => !p.vendor).length,
      vendors,
    });
  } catch (err) {
    storeError(res, err);
  }
};