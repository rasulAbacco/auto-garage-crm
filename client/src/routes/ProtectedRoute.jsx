// client/src/routes/ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import AppLoader from "../components/AppLoader";
import {
  hasUsableToken,
  readStoredUser,
  refreshSession,
  clearAuth,
} from "../utils/authStorage";

/**
 * Local-first auth guard (Instagram / WhatsApp style):
 * - A stored, unexpired token opens the app instantly — no spinner, no network wait.
 * - The server is checked in the background; the user is logged out ONLY if the
 *   server rejects the token (401). No internet / slow server keeps them signed in.
 */
export default function ProtectedRoute({ children, requiredPlan }) {
  const location = useLocation();

  // "ok" | "checking" | "denied"
  const [state, setState] = useState(() =>
    hasUsableToken()
      ? "ok"
      : localStorage.getItem("token")
        ? "checking"
        : "denied",
  );
  const [user, setUser] = useState(readStoredUser);

  useEffect(() => {
    let alive = true;

    if (!localStorage.getItem("token")) {
      setState("denied");
      return;
    }

    // Token present but expired locally → let the server decide once, then clear
    if (!hasUsableToken()) {
      clearAuth();
      setState("denied");
      return;
    }

    refreshSession().then((res) => {
      if (!alive) return;
      if (res.status === "invalid" || res.status === "none") {
        setState("denied");
      } else {
        if (res.user) setUser(res.user);
        setState("ok");
      }
    });

    return () => {
      alive = false;
    };
  }, []);

  if (state === "checking") return <AppLoader />;

  if (state === "denied") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ⭐ PLAN CHECK
  const normalizedPlan = (user?.plan || "BASIC").toUpperCase();
  if (
    requiredPlan &&
    !requiredPlan.map((p) => p.toUpperCase()).includes(normalizedPlan)
  ) {
    return <Navigate to="/upgrade" replace />;
  }

  return children;
}
