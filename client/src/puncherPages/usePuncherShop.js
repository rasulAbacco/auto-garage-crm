// src/puncherPages/usePuncherShop.js
// Loads the shop profile (vehicle support) and the service catalog for the Puncher pages.
import { useCallback, useEffect, useState } from "react";
import { puncherApi } from "./puncherApi";

export default function usePuncherShop() {
  const [shop, setShop] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("puncherShop") || "null");
    } catch {
      return null;
    }
  });
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([puncherApi("/shop"), puncherApi("/catalog")]);
      setShop(s);
      setCatalog(c);
      setError(null);
      localStorage.setItem(
        "puncherShop",
        JSON.stringify({ vehicleSupport: s.vehicleSupport, shopName: s.shopName }),
      );
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { shop, catalog, error, reload };
}
