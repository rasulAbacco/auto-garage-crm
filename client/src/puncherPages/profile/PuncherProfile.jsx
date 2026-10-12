// src/puncherPages/profile/PuncherProfile.jsx — shop settings (Car / Bike / Car & Bike)
import React, { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { Car, Bike, CircleDot, Save } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { puncherApi, fmtDate } from "../puncherApi";
import usePuncherShop from "../usePuncherShop";
import { PageShell, PageHeader, Card, Field, Input, PrimaryButton, ErrorBox, cx } from "../PuncherUI";

const OPTIONS = [
  { value: "CAR", label: "Car", icon: Car, text: "Car tyres only" },
  { value: "BIKE", label: "Bike", icon: Bike, text: "Two-wheeler tyres only" },
  { value: "BOTH", label: "Car & Bike", icon: CircleDot, text: "Both cars and bikes" },
];

export default function PuncherProfile() {
  const { isDark } = useTheme();
  const { shop, error, reload } = usePuncherShop();
  const [vehicleSupport, setVehicleSupport] = useState("BOTH");
  const [shopName, setShopName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (shop) {
      setVehicleSupport(shop.vehicleSupport || "BOTH");
      setShopName(shop.shopName || shop.owner?.companyName || "");
    }
  }, [shop]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await puncherApi("/shop", { method: "PUT", body: { vehicleSupport, shopName } });
      toast.success("Shop settings saved");
      await reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const owner = shop?.owner;
  const text = isDark ? "text-white" : "text-gray-900";

  return (
    <PageShell>
      <Toaster position="top-right" />
      <PageHeader isDark={isDark} title="Shop Profile" subtitle="Your Puncher Shop details and services offered" />
      <ErrorBox message={error} isDark={isDark} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card isDark={isDark} className="lg:col-span-2">
          <form onSubmit={save} className="space-y-6">
            <Field label="Shop Name" isDark={isDark}>
              <Input isDark={isDark} value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="e.g. Sri Ganesh Puncher Shop" />
            </Field>

            <div>
              <p className={cx("mb-3 text-sm font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>Vehicles you service</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Vehicles you service">
                {OPTIONS.map((o) => {
                  const active = vehicleSupport === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setVehicleSupport(o.value)}
                      className={cx(
                        "flex flex-col items-start gap-2 p-4 text-left rounded-xl border-2 transition-all",
                        active
                          ? "border-sky-500 bg-sky-500/10"
                          : isDark
                            ? "border-gray-700 hover:border-gray-500"
                            : "border-gray-200 hover:border-gray-300",
                      )}
                    >
                      <o.icon className={cx("w-6 h-6", active ? "text-sky-500" : "text-gray-400")} />
                      <span className={cx("font-bold", text)}>{o.label}</span>
                      <span className="text-xs text-gray-500">{o.text}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                This controls which vehicles you can add as clients and which services appear when logging a job.
              </p>
            </div>

            <PrimaryButton type="submit" disabled={saving || !shop}>
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Settings"}
            </PrimaryButton>
          </form>
        </Card>

        <Card isDark={isDark}>
          <h3 className={cx("mb-4 text-lg font-bold", text)}>Account</h3>
          <dl className="space-y-3 text-sm">
            {[
              ["Owner", owner?.username],
              ["Email", owner?.email],
              ["Phone", owner?.phone],
              ["GSTIN", owner?.gstNumber],
              ["Plan", owner?.plan && String(owner.plan).toLowerCase()],
              ["Plan valid until", owner?.planExpiry && fmtDate(owner.planExpiry)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-gray-500">{k}</dt>
                <dd className={cx("font-medium text-right break-all", text)}>{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </PageShell>
  );
}
