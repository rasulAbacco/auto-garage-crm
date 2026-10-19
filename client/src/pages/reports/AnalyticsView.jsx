// client/src/pages/reports/AnalyticsView.jsx
import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  FiCheckCircle,
  FiClock,
  FiTool,
  FiActivity,
  FiUsers,
  FiTrendingUp,
  FiXCircle,
  FiFileText,
  FiAward,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import {
  getChartTheme,
  EmptyChart,
  shortRupee,
  useNarrow,
} from "../../components/Dashboard/chartTheme";
import { tk } from "../clients/components/clientUi";

const money = (v, d = 0) =>
  `₹${(Number(v) || 0).toLocaleString("en-IN", { maximumFractionDigits: d })}`;
const pct = (n, total) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);

const STATUS_TONE = {
  Paid: { icon: FiCheckCircle, bar: "bg-green-500", text: "text-green-600" },
  Pending: { icon: FiClock, bar: "bg-amber-500", text: "text-amber-600" },
  "Partially Paid": {
    icon: FiClock,
    bar: "bg-blue-500",
    text: "text-blue-500",
  },
  Overdue: { icon: FiXCircle, bar: "bg-red-500", text: "text-red-500" },
  Cancelled: { icon: FiXCircle, bar: "bg-red-500", text: "text-red-500" },
};

const RANGES = [
  { key: 6, label: "6M" },
  { key: 12, label: "12M" },
  { key: 0, label: "All" },
];

export default function AnalyticsView({ summary, invoices = [], isDark }) {
  const t = tk(isDark);
  const c = useMemo(() => getChartTheme(isDark), [isDark]);
  const narrow = useNarrow();
  const [range, setRange] = useState(12);

  /* monthly revenue from invoices */
  const trend = useMemo(() => {
    const map = {};
    invoices.forEach((inv) => {
      const when = inv.date || inv.createdAt;
      if (!when) return;
      const d = new Date(when);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = { key, revenue: 0, count: 0 };
      map[key].revenue += Number(inv.grandTotal) || 0;
      map[key].count += 1;
    });
    let rows = Object.values(map).sort((a, b) => a.key.localeCompare(b.key));
    if (range) {
      const from = new Date();
      from.setMonth(from.getMonth() - (range - 1), 1);
      const fromKey = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}`;
      rows = rows.filter((r) => r.key >= fromKey);
    }
    return rows.map((r) => {
      const [y, m] = r.key.split("-");
      return {
        ...r,
        month: new Date(+y, +m - 1, 1).toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        }),
      };
    });
  }, [invoices, range]);

  const trendTotal = trend.reduce((s, r) => s + r.revenue, 0);
  const rs = summary?.revenueSummary || {};
  const ss = summary?.serviceSummary || {};
  const totalServices = ss.totalServices || 0;
  const invStatus = summary?.invoiceStatusSummary || [];
  const totalInvoices = invStatus.reduce((a, i) => a + (i.count || 0), 0);
  const collectedPct = pct(rs.paidRevenue || 0, rs.totalRevenue || 0);

  const Tip = ({ active, payload, label }) =>
    active && payload?.length ? (
      <div style={c.tooltip}>
        <p style={c.tooltipLabel}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 900 }}>
          {money(payload[0].value, 2)}
        </p>
        <p style={{ fontSize: 12, opacity: 0.7 }}>
          {payload[0].payload.count} invoices
        </p>
      </div>
    ) : null;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi
          isDark={isDark}
          icon={FaRupeeSign}
          tag="All time"
          label="Total revenue"
          value={money(rs.totalRevenue, 2)}
        />
        <Kpi
          isDark={isDark}
          icon={FiCheckCircle}
          tag={`${collectedPct}% collected`}
          label="Paid revenue"
          value={money(rs.paidRevenue, 2)}
          tone="green"
        />
        <Kpi
          isDark={isDark}
          icon={FiClock}
          tag="To collect"
          label="Pending revenue"
          value={money(rs.pendingRevenue, 2)}
          tone="amber"
        />
      </div>

      {/* trend */}
      <Card
        isDark={isDark}
        icon={FiTrendingUp}
        title="Revenue trend"
        subtitle={`${money(trendTotal)} in ${range ? `last ${range} months` : "all time"}`}
        right={
          <div
            className={`flex rounded-lg border-2 p-0.5 ${isDark ? "border-white/10" : "border-[#CBD5E1]"}`}
          >
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`h-7 rounded-md px-2.5 text-[12px] font-black uppercase tracking-wider transition ${
                  range === r.key ? t.chipNavy : `${t.muted}`
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      >
        {trend.length === 0 ? (
          <EmptyChart
            text="No revenue in this period"
            height={narrow ? 220 : 280}
            isDark={isDark}
          />
        ) : (
          <ResponsiveContainer width="100%" height={narrow ? 220 : 280}>
            <AreaChart
              data={trend}
              margin={{ top: 8, right: 4, left: narrow ? -14 : -4, bottom: 0 }}
            >
              <defs>
                <linearGradient id="rptRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c.primary} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={c.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={c.grid}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke={c.axis}
                tick={c.tick}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke={c.axis}
                tick={c.tick}
                tickLine={false}
                axisLine={false}
                width={52}
                tickFormatter={shortRupee}
              />
              <Tooltip
                content={<Tip />}
                cursor={{ stroke: c.axis, strokeDasharray: "3 3" }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={c.primary}
                strokeWidth={2.5}
                fill="url(#rptRevenue)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        {/* service status */}
        <Card
          isDark={isDark}
          icon={FiTool}
          title="Service status"
          subtitle="Completion overview"
        >
          <div className="mb-4 grid grid-cols-2 gap-2">
            <Mini
              isDark={isDark}
              label="Total services"
              value={totalServices}
            />
            <Mini
              isDark={isDark}
              label="Avg cost"
              value={money(ss.averageServiceCost)}
            />
          </div>
          {totalServices > 0 ? (
            <div className="space-y-3">
              <Bar
                isDark={isDark}
                icon={FiCheckCircle}
                label="Completed"
                n={ss.completedServices || 0}
                total={totalServices}
                bar="bg-green-500"
                text="text-green-600"
              />
              <Bar
                isDark={isDark}
                icon={FiClock}
                label="Pending"
                n={ss.pendingServices || 0}
                total={totalServices}
                bar="bg-amber-500"
                text="text-amber-600"
              />
              <Bar
                isDark={isDark}
                icon={FiXCircle}
                label="Cancelled"
                n={ss.cancelledServices || 0}
                total={totalServices}
                bar="bg-red-500"
                text="text-red-500"
              />
            </div>
          ) : (
            <Empty isDark={isDark} text="No service data yet" />
          )}
        </Card>

        {/* invoice status */}
        <Card
          isDark={isDark}
          icon={FiFileText}
          title="Invoice status"
          subtitle={`${totalInvoices} invoices`}
        >
          {invStatus.length > 0 ? (
            <div className="space-y-3">
              {invStatus.map((item) => {
                const tone = STATUS_TONE[item.status] || STATUS_TONE.Pending;
                return (
                  <Bar
                    key={item.status}
                    isDark={isDark}
                    icon={tone.icon}
                    label={item.status}
                    n={item.count}
                    total={totalInvoices}
                    bar={tone.bar}
                    text={tone.text}
                  />
                );
              })}
            </div>
          ) : (
            <Empty isDark={isDark} text="No invoice data yet" />
          )}
        </Card>

        {/* top services */}
        <Card
          isDark={isDark}
          icon={FiActivity}
          title="Top services"
          subtitle="By revenue"
        >
          {ss.topServiceTypes?.length > 0 ? (
            <Ranked
              isDark={isDark}
              rows={ss.topServiceTypes
                .slice(0, 5)
                .map((s, i) => ({
                  badge: i + 1,
                  title: s.type || "Service",
                  sub: `${s.count || 0} services`,
                  value: s.total,
                }))}
            />
          ) : (
            <Empty isDark={isDark} text="No service revenue yet" />
          )}
        </Card>

        {/* top clients */}
        <Card
          isDark={isDark}
          icon={FiUsers}
          title="Top clients"
          subtitle="Highest spending"
        >
          {summary?.topClients?.length > 0 ? (
            <Ranked
              isDark={isDark}
              rows={summary.topClients.slice(0, 5).map((cl, i) => ({
                badge: (cl.fullName || "?").charAt(0).toUpperCase(),
                title: cl.fullName || "Client",
                sub: i === 0 ? "Top customer" : `Rank #${i + 1}`,
                value: cl.totalSpent,
                crown: i === 0,
              }))}
            />
          ) : (
            <Empty isDark={isDark} text="No client data yet" />
          )}
        </Card>
      </div>
    </div>
  );
}

/* ───────── pieces ───────── */

function Card({ isDark, icon: Icon, title, subtitle, right, children }) {
  const t = tk(isDark);
  return (
    <section className={`overflow-hidden rounded-2xl border-2 ${t.card}`}>
      <div
        className={`flex items-center gap-3 border-b-2 px-4 py-3 ${t.cardHead}`}
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${t.chipNavy}`}
        >
          <Icon size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className={`truncate text-[14px] font-black uppercase tracking-tight ${t.heading}`}
          >
            {title}
          </h3>
          {subtitle && (
            <p className={`truncate text-[12px] ${t.muted}`}>{subtitle}</p>
          )}
        </div>
        {right}
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}

function Kpi({ isDark, icon: Icon, tag, label, value, tone }) {
  const t = tk(isDark);
  const chip =
    tone === "green"
      ? "bg-green-500/10 text-green-600"
      : tone === "amber"
        ? "bg-amber-500/10 text-amber-600"
        : t.chipNavy;
  return (
    <div className={`rounded-2xl border-2 p-4 ${t.card}`}>
      <div className="flex items-center justify-between gap-2">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${chip}`}
        >
          <Icon size={14} />
        </div>
        <span
          className={`rounded-md border px-2 py-0.5 text-[12px] font-bold uppercase tracking-wider ${t.inner} ${t.muted}`}
        >
          {tag}
        </span>
      </div>
      <p className="mt-3 text-[12px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p
        className={`truncate text-[16px] font-black tracking-tight ${t.heading}`}
      >
        {value}
      </p>
    </div>
  );
}

function Mini({ isDark, label, value }) {
  const t = tk(isDark);
  return (
    <div className={`rounded-xl border-2 p-3 ${t.inner}`}>
      <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className={`text-[16px] font-black ${t.heading}`}>{value}</p>
    </div>
  );
}

function Bar({ isDark, icon: Icon, label, n, total, bar, text }) {
  const t = tk(isDark);
  const p = pct(n, total);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span
          className={`flex items-center gap-2 text-[14px] font-semibold ${t.body}`}
        >
          <Icon size={14} className={text} /> {label}
        </span>
        <span className={`text-[12px] font-black ${text}`}>
          {n} · {p}%
        </span>
      </div>
      <div
        className={`h-2 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}
      >
        <div
          className={`h-full rounded-full ${bar} transition-all duration-500`}
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  );
}

function Ranked({ isDark, rows }) {
  const t = tk(isDark);
  const max = Math.max(...rows.map((r) => Number(r.value) || 0), 1);
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className={`rounded-xl border-2 p-2.5 ${t.inner}`}>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-black ${t.chipNavy}`}
            >
              {r.badge}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`flex items-center gap-1.5 truncate text-[14px] font-bold ${t.heading}`}
              >
                {r.title}{" "}
                {r.crown && (
                  <FiAward size={12} className="shrink-0 text-amber-500" />
                )}
              </p>
              <p className={`text-[12px] ${t.muted}`}>{r.sub}</p>
            </div>
            <p className={`shrink-0 text-[14px] font-black ${t.heading}`}>
              {money(r.value)}
            </p>
          </div>
          <div
            className={`mt-2 h-1.5 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}
          >
            <div
              className={`h-full rounded-full ${isDark ? "bg-blue-300" : "bg-[#001F3F]"}`}
              style={{ width: `${((Number(r.value) || 0) / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty({ isDark, text }) {
  const t = tk(isDark);
  return (
    <p
      className={`rounded-xl border-2 border-dashed py-8 text-center text-[14px] ${t.inner} ${t.muted}`}
    >
      {text}
    </p>
  );
}
