// src/puncherPages/puncherApi.js
// Small fetch wrapper for the Puncher Shop CRM (/api/puncher/*)

export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function puncherApi(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/api/puncher${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new ApiError("Session expired. Please login again.", 401);
  }

  if (!res.ok) {
    throw new ApiError(data?.message || "Something went wrong", res.status);
  }
  return data;
}

export const inr = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export const VEHICLE_LABEL = { CAR: "Car", BIKE: "Bike", BOTH: "Car & Bike" };

// The app toggles dark mode via ThemeContext (isDark), not Tailwind's `dark:` variant
const STATUS_STYLES = {
  PENDING: ["bg-amber-100 text-amber-700", "bg-amber-900/30 text-amber-300"],
  IN_PROGRESS: ["bg-blue-100 text-blue-700", "bg-blue-900/30 text-blue-300"],
  COMPLETED: ["bg-green-100 text-green-700", "bg-green-900/30 text-green-300"],
  PAID: ["bg-green-100 text-green-700", "bg-green-900/30 text-green-300"],
  CANCELLED: ["bg-gray-200 text-gray-600", "bg-gray-700 text-gray-300"],
};

export const statusClass = (status, isDark) =>
  (STATUS_STYLES[status] || STATUS_STYLES.CANCELLED)[isDark ? 1 : 0];

export const prettyEnum = (v) =>
  String(v || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
