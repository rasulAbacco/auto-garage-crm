// src/puncherPages/PuncherDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Wrench,
  IndianRupee,
  Clock,
  Car,
  Bike,
  PlusCircle,
  Receipt,
  CircleDot,
  RefreshCw,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { puncherApi, inr, fmtDate, VEHICLE_LABEL } from "./puncherApi";
import {
  PageShell,
  PageHeader,
  Card,
  StatCard,
  PrimaryButton,
  GhostButton,
  Badge,
  Loading,
  ErrorBox,
  cx,
} from "./PuncherUI";

export default function PuncherDashboard() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const d = await puncherApi("/dashboard");
      setData(d);
      setError(null);
      localStorage.setItem("puncherShop", JSON.stringify({ vehicleSupport: d.vehicleSupport }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  if (loading && !data) {
    return (
      <PageShell>
        <Loading isDark={isDark} label="Loading dashboard..." />
      </PageShell>
    );
  }

  const maxDay = Math.max(1, ...(data?.revenue.last7Days || []).map((d) => d.amount));
  const supportsCar = data && data.vehicleSupport !== "BIKE";
  const supportsBike = data && data.vehicleSupport !== "CAR";

  return (
    <PageShell>
      <PageHeader
        isDark={isDark}
        title="Puncher Shop Dashboard"
        subtitle={
          data
            ? `Welcome back${user.username ? `, ${user.username}` : ""} · ${VEHICLE_LABEL[data.vehicleSupport]} services`
            : ""
        }
        action={
          <div className="flex gap-3">
            <GhostButton isDark={isDark} onClick={load} disabled={loading}>
              <RefreshCw className={cx("w-4 h-4", loading && "animate-spin")} /> Refresh
            </GhostButton>
            <PrimaryButton onClick={() => navigate("/puncher-services?new=1")}>
              <PlusCircle className="w-4 h-4" /> New Service
            </PrimaryButton>
          </div>
        }
      />

      <ErrorBox message={error} isDark={isDark} />

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              isDark={isDark}
              title="Total Clients"
              value={data.clients.total}
              hint={[supportsCar && `${data.clients.car} car`, supportsBike && `${data.clients.bike} bike`]
                .filter(Boolean)
                .join(" · ")}
              icon={Users}
              gradient="from-sky-500 to-blue-600"
            />
            <StatCard
              isDark={isDark}
              title="Services Today"
              value={data.services.today}
              hint={`${data.services.pending + data.services.inProgress} open jobs`}
              icon={Wrench}
              gradient="from-violet-500 to-purple-600"
            />
            <StatCard
              isDark={isDark}
              title="Revenue This Month"
              value={inr(data.revenue.thisMonth)}
              hint={`${inr(data.revenue.total)} all time`}
              icon={IndianRupee}
              gradient="from-emerald-500 to-green-600"
            />
            <StatCard
              isDark={isDark}
              title="Pending Payments"
              value={inr(data.revenue.pendingAmount)}
              hint={`${data.revenue.pendingBills} unpaid bill${data.revenue.pendingBills === 1 ? "" : "s"}`}
              icon={Clock}
              gradient="from-amber-500 to-orange-600"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-3">
            {/* Revenue last 7 days */}
            <Card isDark={isDark} className="lg:col-span-2">
              <h3 className={cx("mb-6 text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
                Collections · Last 7 Days
              </h3>
              <div className="flex items-end gap-2 h-44" role="img" aria-label="Collections over the last 7 days">
                {data.revenue.last7Days.map((d) => (
                  <div key={d.date} className="flex flex-col items-center flex-1 h-full gap-2">
                    <div className="flex items-end flex-1 w-full">
                      <div
                        title={`${fmtDate(d.date)}: ${inr(d.amount)}`}
                        className="w-full transition-all duration-500 rounded-t-lg bg-gradient-to-t from-sky-500 to-blue-500"
                        style={{ height: `${Math.max(d.amount ? 6 : 2, (d.amount / maxDay) * 100)}%`, opacity: d.amount ? 1 : 0.25 }}
                      />
                    </div>
                    <span className={cx("text-[11px] font-medium", isDark ? "text-gray-400" : "text-gray-500")}>
                      {new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Job status */}
            <Card isDark={isDark}>
              <h3 className={cx("mb-5 text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>Job Status</h3>
              <div className="space-y-4">
                {[
                  ["PENDING", data.services.pending],
                  ["IN_PROGRESS", data.services.inProgress],
                  ["COMPLETED", data.services.completed],
                  ["CANCELLED", data.services.cancelled],
                ].map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <Badge status={status} isDark={isDark} />
                    <span className={cx("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>{count}</span>
                  </div>
                ))}
              </div>
              {data.topServices.length > 0 && (
                <>
                  <h4 className={cx("mt-6 mb-3 text-sm font-bold uppercase tracking-wide", isDark ? "text-gray-400" : "text-gray-500")}>
                    Top Services
                  </h4>
                  <ul className="space-y-2">
                    {data.topServices.map((t) => (
                      <li key={t.name} className={cx("flex justify-between text-sm", isDark ? "text-gray-300" : "text-gray-700")}>
                        <span className="truncate">{t.name}</span>
                        <span className="font-semibold">{t.count}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>
          </div>

          {/* Recent services */}
          <Card isDark={isDark}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={cx("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>Recent Services</h3>
              <button onClick={() => navigate("/puncher-services")} className="text-sm font-semibold text-sky-500 hover:text-sky-600">
                View all
              </button>
            </div>
            {data.recentServices.length === 0 ? (
              <div className="py-10 text-center">
                <CircleDot className={cx("mx-auto mb-3", isDark ? "text-gray-600" : "text-gray-300")} size={44} />
                <p className={cx("font-semibold", isDark ? "text-gray-300" : "text-gray-700")}>No services yet</p>
                <p className="mb-4 text-sm text-gray-500">Add a client, then log their first puncture job.</p>
                <PrimaryButton onClick={() => navigate("/puncher-clients?new=1")}>
                  <PlusCircle className="w-4 h-4" /> Add Client
                </PrimaryButton>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentServices.map((s) => (
                  <div
                    key={s.id}
                    className={cx(
                      "flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl",
                      isDark ? "bg-gray-900/60" : "bg-slate-50",
                    )}
                  >
                    <div className="flex items-center min-w-0 gap-3">
                      <div className="flex items-center justify-center w-10 h-10 text-white rounded-full shrink-0 bg-gradient-to-br from-sky-400 to-blue-500">
                        {s.vehicleType === "CAR" ? <Car className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className={cx("font-semibold truncate", isDark ? "text-white" : "text-gray-900")}>{s.serviceName}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {s.client?.fullName}
                          {s.client?.regNumber ? ` · ${s.client.regNumber}` : ""} · {fmtDate(s.serviceDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cx("font-bold", isDark ? "text-white" : "text-gray-900")}>{inr(s.totalPrice)}</span>
                      <Badge status={s.status} isDark={isDark} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-4 mt-6 sm:grid-cols-3">
            {[
              { label: "Add Client", icon: Users, to: "/puncher-clients?new=1" },
              { label: "Log Service", icon: Wrench, to: "/puncher-services?new=1" },
              { label: "Create Bill", icon: Receipt, to: "/puncher-billing?new=1" },
            ].map((q) => (
              <button
                key={q.label}
                onClick={() => navigate(q.to)}
                className={cx(
                  "flex items-center gap-3 p-4 rounded-xl border-2 font-semibold transition-all hover:-translate-y-0.5",
                  isDark ? "bg-gray-800 border-gray-700 text-gray-200 hover:border-sky-500" : "bg-white border-gray-100 text-gray-700 hover:border-sky-300",
                )}
              >
                <q.icon className="w-5 h-5 text-sky-500" /> {q.label}
              </button>
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
