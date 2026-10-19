import { API_URL as API_BASE_URL, isNativeApp, clearAuth } from "./utils/authStorage";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "ngrok-skip-browser-warning": "true",
      "X-Client": isNativeApp() ? "mobile" : "web",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  // Server rejected the session → sign out and go to login
  if (res.status === 401 && token && localStorage.getItem("token") === token) {
    clearAuth();
    window.location.replace("/login");
  }

  const text = await res.text();

  // 🔥 Guard: ngrok / HTML fallback protection
  if (text.startsWith("<!DOCTYPE")) {
    console.error("HTML response instead of JSON:", text.slice(0, 200));
    throw new Error("API returned HTML (ngrok interstitial)");
  }

  return JSON.parse(text);
}
