// client/src/components/Dashboard/RevenueChart.jsx
import React, { useMemo } from "react";
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  ComposedChart,
  Legend,
} from "recharts";
import { getChartTheme, EmptyChart, shortRupee, useNarrow } from "./chartTheme";

const RevenueChart = ({ data = [], isDark }) => {
  const c = useMemo(() => getChartTheme(isDark), [isDark]);
  const narrow = useNarrow();
  const height = narrow ? 230 : 290;

  if (!data || data.length === 0) {
    return (
      <EmptyChart text="No revenue data yet" height={height} isDark={isDark} />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={data}
        margin={{
          top: 8,
          right: narrow ? 0 : 4,
          left: narrow ? -14 : -4,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="mdRevenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.primary} stopOpacity={0.35} />
            <stop offset="100%" stopColor={c.primary} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />

        <XAxis
          dataKey="month"
          stroke={c.axis}
          tick={c.tick}
          tickLine={false}
          axisLine={false}
          interval={narrow ? "preserveStartEnd" : 0}
        />

        <YAxis
          yAxisId="left"
          stroke={c.axis}
          tick={c.tick}
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={shortRupee}
        />

        {/* invoice count axis – hidden on phones to save width */}
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke={c.axis}
          tick={c.tick}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={narrow ? 0 : 32}
          hide={narrow}
        />

        <Tooltip
          cursor={{ fill: c.cursor }}
          contentStyle={c.tooltip}
          labelStyle={c.tooltipLabel}
          formatter={(value, name) =>
            name === "Revenue"
              ? [`₹${Number(value || 0).toLocaleString("en-IN")}`, name]
              : [value, name]
          }
        />

        <Legend iconType="circle" iconSize={8} wrapperStyle={c.legend} />

        <Bar
          yAxisId="right"
          dataKey="invoices"
          fill={c.success}
          fillOpacity={0.85}
          radius={[6, 6, 0, 0]}
          name="Invoices"
          maxBarSize={narrow ? 14 : 24}
        />

        <Area
          yAxisId="left"
          type="monotone"
          dataKey="revenue"
          stroke={c.primary}
          fill="url(#mdRevenueFill)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
          name="Revenue"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default React.memo(RevenueChart);
