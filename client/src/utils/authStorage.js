// client/src/utils/authStorage.js
//
// Keeps the login session alive inside the Capacitor app (Android / iOS)
// the way Instagram / WhatsApp do: the user stays signed in until they
// tap Logout themselves.
//
// How it works
// 1. On native, auth keys are mirrored into @capacitor/preferences
//    (SharedPreferences on Android, UserDefaults on iOS). WebView
//    localStorage can be wiped by iOS under storage pressure, or lost when
//    the app's WebView origin changes after an update. Preferences survive both.
// 2. On app start, Preferences are copied back into localStorage BEFORE the
//    app renders, so every existing `localStorage.getItem("token")` in the
//    codebase keeps working unchanged.
// 3. localStorage.setItem / removeItem / clear are patched (native only) so
//    any existing login / logout code automatically updates Preferences too.
//    Logout anywhere in the app therefore still logs out for real.
// 4. refreshSession() calls /api/auth/verify. The server returns a fresh
//    long-lived token for mobile clients (sliding session). The session is
//    only cleared when the server says the token is invalid (401) — never
//    because of no internet, a slow server or an ngrok hiccup.

import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { jwtDecode } from "jwt-decode";

export const API_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "https://nefariously-unglistening-maryann.ngrok-free.dev";

export const isNativeApp = () => Capacitor.isNativePlatform();

const AUTH_KEYS = ["token", "user", "crmType", "userId", "lastCrmType"];
const SESSION_KEYS = ["token", "user", "crmType", "userId"]; // cleared on logout
const PREF_PREFIX = "md_auth_";

let patched = false;

/* ------------------------------------------------------------------ */
/* Boot: restore session from native storage                           */
/* ------------------------------------------------------------------ */
export async function initAuthStorage() {
  if (!isNativeApp()) return;

  try {
    for (const key of AUTH_KEYS) {
      const { value: saved } = await Preferences.get({ key: PREF_PREFIX + key });
      const local = window.localStorage.getItem(key);

      if (local === null && saved !== null) {
        // WebView storage was wiped (iOS eviction / app update) → restore it
        window.localStorage.setItem(key, saved);
      } else if (local !== null && saved !== local) {
        // Existing installs that logged in before this fix → migrate
        await Preferences.set({ key: PREF_PREFIX + key, value: local });
      }
    }
  } catch (err) {
    console.warn("Auth storage restore failed:", err);
  }

  patchLocalStorage();
}

function patchLocalStorage() {
  if (patched) return;
  patched = true;

  const proto = Storage.prototype;
  const origSet = proto.setItem;
  const origRemove = proto.removeItem;
  const origClear = proto.clear;

  proto.setItem = function (key, value) {
    origSet.call(this, key, value);
    if (this === window.localStorage && AUTH_KEYS.includes(key)) {
      Preferences.set({ key: PREF_PREFIX + key, value: String(value) }).catch(
        () => {},
      );
    }
  };

  proto.removeItem = function (key) {
    origRemove.call(this, key);
    if (this === window.localStorage && AUTH_KEYS.includes(key)) {
      Preferences.remove({ key: PREF_PREFIX + key }).catch(() => {});
    }
  };

  proto.clear = function () {
    origClear.call(this);
    if (this === window.localStorage) {
      AUTH_KEYS.forEach((k) =>
        Preferences.remove({ key: PREF_PREFIX + k }).catch(() => {}),
      );
    }
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
export function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

/** Token exists, decodes, and is not expired (checked locally, no network). */
export function hasUsableToken() {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const { exp } = jwtDecode(token);
    return !exp || exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export function clearAuth() {
  SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
  cache = { token: null, result: null, at: 0 };
}

const DASHBOARDS = {
  car: "/car-dashboard",
  bike: "/bike-dashboard",
  wash: "/wash-dashboard",
  washing: "/wash-dashboard",
  puncher: "/puncher-dashboard",
};

export function getDashboardPath() {
  const crm = (
    localStorage.getItem("crmType") ||
    readStoredUser().crmType ||
    "car"
  ).toLowerCase();
  return DASHBOARDS[crm] || "/car-dashboard";
}

/* ------------------------------------------------------------------ */
/* Server verification + silent token renewal                          */
/* ------------------------------------------------------------------ */
let inflight = null;
let cache = { token: null, result: null, at: 0 };
const CACHE_MS = 60 * 1000;

/**
 * Returns { status: "valid" | "invalid" | "offline" | "none", user? }
 * Only "invalid" means the user must log in again.
 */
export function refreshSession() {
  const token = localStorage.getItem("token");
  if (!token) return Promise.resolve({ status: "none" });

  if (inflight) return inflight;
  if (
    cache.token === token &&
    cache.result?.status === "valid" &&
    Date.now() - cache.at < CACHE_MS
  ) {
    return Promise.resolve(cache.result);
  }

  inflight = doRefresh(token)
    .then((result) => {
      cache = {
        token: localStorage.getItem("token"),
        result,
        at: Date.now(),
      };
      return result;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

async function doRefresh(token) {
  try {
    const res = await fetch(`${API_URL}/api/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
        "X-Client": isNativeApp() ? "mobile" : "web",
      },
    });

    // Server explicitly rejected the token → real logout
    if (res.status === 401) {
      clearAuth();
      return { status: "invalid" };
    }

    // 5xx, ngrok errors, cold starts… keep the user signed in
    if (!res.ok) return { status: "offline" };

    const data = await res.json(); // throws on HTML → caught → offline

    if (!data?.valid) {
      clearAuth();
      return { status: "invalid" };
    }

    // Sliding session: server sends a renewed token for mobile clients
    if (data.token) localStorage.setItem("token", data.token);

    // Merge so we don't lose fields only the login response has (username, allowedCrms…)
    const merged = { ...readStoredUser(), ...(data.user || {}) };
    localStorage.setItem("user", JSON.stringify(merged));

    return { status: "valid", user: merged };
  } catch (err) {
    console.warn("Session check skipped (offline?):", err?.message);
    return { status: "offline" };
  }
}
