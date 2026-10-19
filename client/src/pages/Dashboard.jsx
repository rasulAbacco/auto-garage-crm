// client/src/pages/Dashboard.jsx  (Car CRM dashboard – MotorDesk navy theme)
import React, { useState, useEffect, Suspense, lazy, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiDollarSign,
  FiClock,
  FiAlertCircle,
  FiFileText,
  FiTool,
  FiActivity,
  FiUsers,
  FiStar,
  FiCalendar,
  FiChevronRight,
  FiTrendingUp,
  FiPieChart,
  FiBarChart2,
  FiRefreshCw,
  FiPhone,
  FiGrid,
} from "react-icons/fi";
import { useTheme } from "../contexts/ThemeContext";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const RevenueChart = lazy(() => import("../components/Dashboard/RevenueChart"));
const Appointments30DaysChart = lazy(
  () => import("../components/Dashboard/WeeklyAppointmentsChart"),
);
const ServiceStatusPieChart = lazy(
  () => import("../components/Dashboard/ServiceTypesPieChart"),
);
const ReviewAnalyticsChart = lazy(
  () => import("../components/Dashboard/CustomerOverviewChart"),
);

const fetchWithAuth = async (url) => {
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Session expired");
  }
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res;
};

/* ───────────────────────── helpers ───────────────────────── */

const fmtNum = (v) => (Number(v) || 0).toLocaleString("en-IN");

const fmtDate = (d) => {
  const dt = new Date(d);
  return isNaN(dt)
    ? "—"
    : dt.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const STATUS_STYLE = {
  completed: "bg-green-500/10 text-green-600 border-green-500/30",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/30",
  in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/30",
};
const statusClass = (s = "") =>
  STATUS_STYLE[
    String(s)
      .toLowerCase()
      .replace(/[\s-]+/g, "_")
  ] || "bg-slate-500/10 text-slate-500 border-slate-500/30";

const TONES = {
  navy: { light: "bg-[#001F3F] text-white", dark: "bg-white text-[#001F3F]" },
  green: {
    light: "bg-green-500/10 text-green-600",
    dark: "bg-green-500/15 text-green-400",
  },
  amber: {
    light: "bg-amber-500/10 text-amber-600",
    dark: "bg-amber-500/15 text-amber-400",
  },
  red: {
    light: "bg-red-500/10 text-red-600",
    dark: "bg-red-500/15 text-red-400",
  },
};

/* ───────────────────────── small UI pieces (outside component) ───────────────────────── */

const SectionTitle = ({ icon: Icon, title, isDark }) => (
  <div className="flex items-center gap-3">
    <Icon size={14} className={isDark ? "text-white" : "text-[#001F3F]"} />
    <h2
      className={`text-[12px] font-black uppercase tracking-[0.2em] ${
        isDark ? "text-white" : "text-[#001F3F]"
      }`}
    >
      {title}
    </h2>
    <div className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-[#CBD5E1]"}`} />
  </div>
);

const StatCard = ({
  title,
  value,
  icon: Icon,
  currency,
  tone = "navy",
  isDark,
}) => (
  <div
    className={`group rounded-2xl border-2 p-3 transition-all duration-300 hover:-translate-y-0.5 sm:p-4 ${
      isDark
        ? "border-white/5 bg-[#001F3F] shadow-xl shadow-black/20"
        : "border-[#CBD5E1] bg-white shadow-sm hover:border-[#001F3F]"
    }`}
  >
    <div className="flex items-start justify-between gap-2">
      <p className="text-[12px] font-bold uppercase leading-tight tracking-wider text-slate-400">
        {title}
      </p>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
          TONES[tone][isDark ? "dark" : "light"]
        }`}
      >
        <Icon size={14} />
      </div>
    </div>
    <p
      className={`mt-2 truncate text-[16px] font-black tracking-tight ${
        isDark ? "text-white" : "text-[#001F3F]"
      }`}
    >
      {currency && <span className="mr-0.5 font-semibold opacity-60">₹</span>}
      {value}
    </p>
  </div>
);

const Panel = ({
  title,
  subtitle,
  icon: Icon,
  children,
  isDark,
  className = "",
  footer,
  bodyClass = "p-3 sm:p-5",
}) => (
  <div
    className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border-2 ${
      isDark
        ? "border-white/5 bg-[#001F3F] shadow-2xl shadow-black/20"
        : "border-[#CBD5E1] bg-white shadow-sm"
    } ${className}`}
  >
    <div
      className={`flex items-center gap-3 border-b px-3 py-3 sm:px-5 ${
        isDark ? "border-white/5 bg-white/5" : "border-[#CBD5E1] bg-[#F8FAFC]"
      }`}
    >
      {Icon && (
        <Icon size={14} className={isDark ? "text-white" : "text-[#001F3F]"} />
      )}
      <div className="min-w-0">
        <h3
          className={`truncate text-[14px] font-black ${isDark ? "text-white" : "text-[#001F3F]"}`}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="truncate text-[12px] font-medium text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    <div className={`min-w-0 flex-1 ${bodyClass}`}>{children}</div>
    {footer}
  </div>
);

const ChartFallback = ({ isDark, h = "h-60" }) => (
  <div
    className={`${h} w-full animate-pulse rounded-xl ${isDark ? "bg-white/5" : "bg-slate-100"}`}
  />
);

const EmptyList = ({ text, isDark }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <div
      className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${
        isDark ? "bg-white/5 text-slate-500" : "bg-[#F8FAFC] text-slate-400"
      }`}
    >
      <FiCalendar size={16} />
    </div>
    <p className="text-[12px] font-semibold text-slate-400">{text}</p>
  </div>
);

const AppointmentRow = ({ item, isDark, right }) => (
  <div
    className={`flex items-center gap-3 rounded-xl border p-2.5 transition-colors sm:p-3 ${
      isDark
        ? "border-white/5 bg-white/5 hover:bg-white/10"
        : "border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#CBD5E1]"
    }`}
  >
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[14px] font-black ${
        isDark ? "bg-white text-[#001F3F]" : "bg-[#001F3F] text-white"
      }`}
    >
      {(item.name || "?").charAt(0).toUpperCase()}
    </div>

    <div className="min-w-0 flex-1">
      <p
        className={`truncate text-[14px] font-bold ${isDark ? "text-white" : "text-[#001F3F]"}`}
      >
        {item.name || "Customer"}
      </p>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-medium text-slate-400">
        {item.regNumber && (
          <span
            className={`rounded-md px-1.5 py-px font-bold uppercase tracking-wide ${
              isDark
                ? "bg-white/10 text-white"
                : "bg-white text-[#001F3F] ring-1 ring-[#CBD5E1]"
            }`}
          >
            {item.regNumber}
          </span>
        )}
        {item.vehicle && <span className="truncate">{item.vehicle}</span>}
        {item.phone && (
          <a
            href={`tel:${item.phone}`}
            className="inline-flex items-center gap-1 hover:text-blue-500"
          >
            <FiPhone size={12} /> {item.phone}
          </a>
        )}
      </div>
      {item.service && (
        <p className="mt-0.5 truncate text-[12px] text-slate-500">
          {item.service}
        </p>
      )}
    </div>

    <div className="flex shrink-0 flex-col items-end gap-1.5">{right}</div>
  </div>
);

/* ───────────────────────── page ───────────────────────── */

export default function Dashboard() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth(`${API_URL}/api/dashboard`);
      setData(await res.json());
    } catch (e) {
      console.error("Dashboard load failed", e);
      setError(
        "Couldn't load the dashboard. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pageBg = isDark
    ? "bg-[#000814] text-white"
    : "bg-[#F8FAFC] text-[#001F3F]";

  /* loading skeleton */
  if (loading && !data) {
    return (
      <div
        className={`min-h-screen px-3 py-4 sm:px-5 sm:py-6 lg:ml-16 lg:px-8 ${pageBg}`}
      >
        <div className="space-y-5">
          <div
            className={`h-10 w-48 animate-pulse rounded-xl ${isDark ? "bg-white/5" : "bg-slate-200"}`}
          />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`h-[86px] animate-pulse rounded-2xl ${isDark ? "bg-white/5" : "bg-slate-200"}`}
              />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div
              className={`h-72 animate-pulse rounded-2xl lg:col-span-2 ${isDark ? "bg-white/5" : "bg-slate-200"}`}
            />
            <div
              className={`h-72 animate-pulse rounded-2xl ${isDark ? "bg-white/5" : "bg-slate-200"}`}
            />
          </div>
        </div>
      </div>
    );
  }

  const { stats = {}, charts = {}, reviewStats = {} } = data || {};
  const today = data?.data?.todayAppointments || [];
  const upcoming = data?.data?.upcomingAppointments || [];
  const avgRating = Number(reviewStats?.averageRating ?? 0).toFixed(1);

  return (
    <div
      className={`min-h-screen px-3 py-4 transition-colors duration-500 sm:px-5 sm:py-6 lg:ml-16 lg:px-8 ${pageBg}`}
    >
      <div className="mx-auto max-w-[1600px] space-y-5 sm:space-y-6">
        {/* ── HEADER ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span
              className={`mb-2 inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-[12px] font-black uppercase tracking-[0.2em] ${
                isDark
                  ? "border-white/10 bg-white/5 text-white"
                  : "border-slate-200 bg-white text-[#001F3F]"
              }`}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
              Live overview
            </span>
            <h1
              className={`text-[16px] font-black uppercase tracking-tight ${isDark ? "text-white" : "text-[#001F3F]"}`}
            >
              Garage{" "}
              <span className="font-light lowercase italic">dashboard.</span>
            </h1>
            <p
              className={`text-[12px] font-medium sm:text-[14px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Your business performance and today's work at a glance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-[12px] font-bold ${
                isDark
                  ? "border-white/10 bg-white/5 text-slate-300"
                  : "border-[#CBD5E1] bg-white text-[#001F3F]"
              }`}
            >
              <FiCalendar size={14} />
              {new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              title="Refresh"
              aria-label="Refresh dashboard"
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all active:scale-95 disabled:opacity-50 ${
                isDark
                  ? "bg-white text-[#001F3F] hover:bg-blue-50"
                  : "bg-[#001F3F] text-white hover:bg-black"
              }`}
            >
              <FiRefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-[12px] font-semibold text-red-500">
            <span className="flex items-center gap-2">
              <FiAlertCircle size={14} /> {error}
            </span>
            <button
              onClick={load}
              className="font-black uppercase tracking-wider hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── FINANCIALS ── */}
        <section className="space-y-3">
          <SectionTitle
            icon={FiDollarSign}
            title="Financials"
            isDark={isDark}
          />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              title="Total revenue"
              value={fmtNum(stats.totalRevenue)}
              icon={FiDollarSign}
              currency
              tone="green"
              isDark={isDark}
            />
            <StatCard
              title="Pending"
              value={fmtNum(stats.pendingRevenue)}
              icon={FiClock}
              currency
              tone="amber"
              isDark={isDark}
            />
            <StatCard
              title="Overdue"
              value={fmtNum(stats.overdueRevenue)}
              icon={FiAlertCircle}
              currency
              tone="red"
              isDark={isDark}
            />
            <StatCard
              title="Invoices"
              value={fmtNum(stats.totalInvoices)}
              icon={FiFileText}
              isDark={isDark}
            />
          </div>
        </section>

        {/* ── OPERATIONS & CUSTOMERS ── */}
        <section className="space-y-3">
          <SectionTitle
            icon={FiGrid}
            title="Operations & customers"
            isDark={isDark}
          />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              title="Total services"
              value={fmtNum(stats.totalServices)}
              icon={FiTool}
              isDark={isDark}
            />
            <StatCard
              title="Active services"
              value={fmtNum(stats.activeServices)}
              icon={FiActivity}
              tone="amber"
              isDark={isDark}
            />
            <StatCard
              title="Total clients"
              value={fmtNum(stats.totalClients)}
              icon={FiUsers}
              isDark={isDark}
            />
            <StatCard
              title="Avg rating"
              value={`${avgRating} / 5`}
              icon={FiStar}
              tone="amber"
              isDark={isDark}
            />
          </div>
        </section>

        {/* ── CHARTS ROW 1 ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel
            title="Revenue trend"
            subtitle="Monthly revenue and invoices"
            icon={FiTrendingUp}
            isDark={isDark}
            className="lg:col-span-2"
          >
            <Suspense
              fallback={
                <ChartFallback isDark={isDark} h="h-[230px] sm:h-[290px]" />
              }
            >
              <RevenueChart data={charts.monthlyRevenue} isDark={isDark} />
            </Suspense>
          </Panel>

          <Panel
            title="Service status"
            subtitle="All services by stage"
            icon={FiPieChart}
            isDark={isDark}
          >
            <Suspense fallback={<ChartFallback isDark={isDark} />}>
              <ServiceStatusPieChart
                data={charts?.serviceStatusDistribution || []}
                isDark={isDark}
              />
            </Suspense>
          </Panel>
        </div>

        {/* ── CHARTS ROW 2 ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel
            title="Appointment planning"
            subtitle="Next 30 days"
            icon={FiBarChart2}
            isDark={isDark}
            className="lg:col-span-2"
          >
            <Suspense fallback={<ChartFallback isDark={isDark} />}>
              <Appointments30DaysChart
                data={charts.appointments30Days}
                isDark={isDark}
              />
            </Suspense>
          </Panel>

          <Panel
            title="Customer reviews"
            subtitle="Rating breakdown"
            icon={FiStar}
            isDark={isDark}
          >
            <Suspense fallback={<ChartFallback isDark={isDark} />}>
              <ReviewAnalyticsChart reviewStats={reviewStats} isDark={isDark} />
            </Suspense>
          </Panel>
        </div>

        {/* ── TODAY + UPCOMING ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel
            title="Today's services"
            subtitle={`${today.length} scheduled`}
            icon={FiClock}
            isDark={isDark}
            bodyClass="p-2.5 sm:p-4"
            footer={
              <button
                type="button"
                onClick={() => navigate("/reminders")}
                className={`flex items-center justify-center gap-2 border-t py-3 text-[12px] font-black uppercase tracking-[0.2em] transition-colors ${
                  isDark
                    ? "border-white/5 text-white hover:bg-white/5"
                    : "border-[#CBD5E1] text-[#001F3F] hover:bg-[#F8FAFC]"
                }`}
              >
                View full schedule <FiChevronRight size={14} />
              </button>
            }
          >
            {today.length === 0 ? (
              <EmptyList
                text="No services scheduled for today."
                isDark={isDark}
              />
            ) : (
              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {today.map((item) => (
                  <AppointmentRow
                    key={item.id}
                    item={item}
                    isDark={isDark}
                    right={
                      <>
                        {item.time && (
                          <span
                            className={`rounded-lg border px-2 py-1 text-[12px] font-black ${
                              isDark
                                ? "border-white/10 bg-[#000814] text-white"
                                : "border-[#CBD5E1] bg-white text-[#001F3F]"
                            }`}
                          >
                            {item.time}
                          </span>
                        )}
                        {item.status && (
                          <span
                            className={`rounded-full border px-2 py-px text-[12px] font-bold capitalize ${statusClass(item.status)}`}
                          >
                            {String(item.status)
                              .replace(/_/g, " ")
                              .toLowerCase()}
                          </span>
                        )}
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="Upcoming 30 days"
            subtitle={`${upcoming.length} due`}
            icon={FiCalendar}
            isDark={isDark}
            bodyClass="p-2.5 sm:p-4"
          >
            {upcoming.length === 0 ? (
              <EmptyList text="No upcoming appointments." isDark={isDark} />
            ) : (
              <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
                {upcoming.map((item) => (
                  <AppointmentRow
                    key={item.id}
                    item={item}
                    isDark={isDark}
                    right={
                      <span
                        className={`whitespace-nowrap rounded-lg border px-2 py-1 text-[12px] font-black ${
                          isDark
                            ? "border-white/10 bg-[#000814] text-white"
                            : "border-[#CBD5E1] bg-white text-[#001F3F]"
                        }`}
                      >
                        {fmtDate(item.serviceDate)}
                      </span>
                    }
                  />
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
