// src/puncherPages/upgrade/PuncherUpgrade.jsx
// Renew / extend the Puncher Shop subscription with the same region + month pricing as the public page.
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, CalendarClock } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { buildPlans, REGION_PRICING } from "../../payment/PricingPage.jsx";
import { PricingCard, MONTH_OPTIONS, MAX_MONTHS } from "../../payment/PricingComponents.jsx";
import PaymentModal from "../../payment/PaymentModal.jsx";
import { API_BASE, fmtDate } from "../puncherApi";
import { PageShell, PageHeader, Card, Segmented, cx } from "../PuncherUI";

export default function PuncherUpgrade() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [region, setRegion] = useState("urban");
  const [months, setMonths] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [current, setCurrent] = useState(null);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    if (!user?.email) return;
    fetch(`${API_BASE}/api/payments/user-plan/${encodeURIComponent(user.email)}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then((d) => setCurrent(d.currentPlan || d.payment || null))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plans = buildPlans("puncher", region);
  const discountPct = Math.round(REGION_PRICING[region].multiMonthDiscount * 100);
  const billingPeriod = months >= 12 ? "yearly" : "monthly";
  const expiry = current?.expiryDate || current?.nextBillingDate;

  return (
    <PageShell>
      <PageHeader isDark={isDark} title="Upgrade" subtitle="Renew or extend your Puncher Shop plan" />

      {current && (
        <Card isDark={isDark} className="mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 text-white rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <p className={cx("font-bold", isDark ? "text-white" : "text-gray-900")}>
                Current plan: {String(current.plan || "").toLowerCase() || "—"}
                {current.status ? ` · ${String(current.status).toLowerCase()}` : ""}
              </p>
              {expiry && (
                <p className="flex items-center gap-1 text-sm text-gray-500">
                  <CalendarClock className="w-4 h-4" /> Valid until {fmtDate(expiry)}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col items-center gap-4 mb-8">
        <Segmented
          isDark={isDark}
          value={region}
          onChange={setRegion}
          options={[
            { value: "urban", label: "Urban Cities" },
            { value: "rural", label: "Rural Areas" },
          ]}
        />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Segmented
            isDark={isDark}
            value={MONTH_OPTIONS.includes(months) ? months : null}
            onChange={setMonths}
            options={MONTH_OPTIONS.map((m) => ({ value: m, label: `${m} ${m === 1 ? "Month" : "Months"}` }))}
          />
          <label className={cx("flex items-center gap-2 text-sm font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>
            or
            <input
              type="number"
              min={1}
              max={MAX_MONTHS}
              value={months}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setMonths(Number.isNaN(v) ? 1 : Math.max(1, Math.min(MAX_MONTHS, v)));
              }}
              aria-label="Number of months"
              className={cx("w-20 px-3 py-2 rounded-xl border-2 text-center", isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200")}
            />
            months
          </label>
        </div>
        <p className={cx("text-xs font-bold uppercase tracking-widest", months > 1 ? "text-green-600" : "text-gray-500")}>
          {months > 1 ? `${discountPct}% discount applied for ${months} months` : `1 month at fixed price · choose 2+ months to save ${discountPct}%`}
        </p>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-md">
          {plans.map((plan) => (
            <PricingCard
              key={`${region}-${plan.id}`}
              plan={plan}
              months={months}
              billingPeriod={billingPeriod}
              isDark={isDark}
              onSelect={setSelectedPlan}
              isPopular
            />
          ))}
        </div>
      </div>

      <PaymentModal
        show={!!selectedPlan}
        plan={selectedPlan}
        billingPeriod={billingPeriod}
        months={months}
        isDark={isDark}
        planType="puncher"
        onClose={() => setSelectedPlan(null)}
        onComplete={() => {
          setSelectedPlan(null);
          navigate("/puncher-plan");
        }}
        userData={user}
        isUpgradePage
        skipRegisterRedirect
      />
    </PageShell>
  );
}
