// client/src/components/Dashboard/ServiceTypesPieChart.jsx
import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { getChartTheme, EmptyChart } from "./chartTheme";

const STATUS_LABEL = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const ServiceTypesPieChart = ({ data = [], isDark }) => {
  const c = useMemo(() => getChartTheme(isDark), [isDark]);

  const colorFor = (key) =>
    ({
      PENDING: c.warning,
      IN_PROGRESS: c.info,
      COMPLETED: c.success,
      CANCELLED: c.danger,
    })[key] || c.muted;

  const rows = (data || []).map((item) => ({
    ...item,
    value: Number(item.value) || 0,
    label: STATUS_LABEL[item.name] || item.name,
    color: colorFor(item.name),
  }));
  const total = rows.reduce((s, r) => s + r.value, 0);

  if (!rows.length || total === 0) {
    return (
      <EmptyChart text="No service data yet" height={240} isDark={isDark} />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-[200px] sm:h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={3}
              stroke="none"
            >
              {rows.map((r, i) => (
                <Cell key={i} fill={r.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={c.tooltip}
              itemStyle={{ color: c.text }}
              formatter={(value, _n, p) => [
                `${value} (${((value / total) * 100).toFixed(1)}%)`,
                p.payload.label,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* centre total */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-[16px] font-black ${isDark ? "text-white" : "text-[#001F3F]"}`}
          >
            {total}
          </span>
          <span className="text-[12px] font-semibold text-slate-400">
            Services
          </span>
        </div>
      </div>

      {/* legend list */}
      <ul className="grid grid-cols-2 gap-2">
        {rows.map((r) => (
          <li
            key={r.name}
            className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 ${
              isDark
                ? "border-white/10 bg-white/5"
                : "border-[#CBD5E1] bg-[#F8FAFC]"
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: r.color }}
              />
              <span
                className={`truncate text-[12px] font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
              >
                {r.label}
              </span>
            </span>
            <span
              className={`text-[12px] font-black ${isDark ? "text-white" : "text-[#001F3F]"}`}
            >
              {r.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default React.memo(ServiceTypesPieChart);
