// client/src/components/Dashboard/WeeklyAppointmentsChart.jsx
import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getChartTheme, EmptyChart, useNarrow } from "./chartTheme";

const LABELS = { appointments: "Total services", completed: "Completed" };

const WeeklyAppointmentsChart = ({ data = [], isDark }) => {
  const c = useMemo(() => getChartTheme(isDark), [isDark]);
  const narrow = useNarrow();
  const height = narrow ? 220 : 260;

  if (!data || data.length === 0) {
    return (
      <EmptyChart
        text="No appointment data yet"
        height={height}
        isDark={isDark}
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        barGap={3}
        barCategoryGap="22%"
        margin={{ top: 8, right: 0, left: -22, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis
          dataKey="day"
          stroke={c.axis}
          tick={c.tick}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={narrow ? 12 : 6}
        />
        <YAxis
          stroke={c.axis}
          tick={c.tick}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={48}
        />
        <Tooltip
          cursor={{ fill: c.cursor }}
          contentStyle={c.tooltip}
          labelStyle={c.tooltipLabel}
          formatter={(value, name) => [value, LABELS[name] || name]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={c.legend}
          formatter={(value) => LABELS[value] || value}
        />
        <Bar
          dataKey="appointments"
          name="appointments"
          fill={c.primary}
          radius={[4, 4, 0, 0]}
          maxBarSize={narrow ? 10 : 22}
        />
        <Bar
          dataKey="completed"
          name="completed"
          fill={c.success}
          radius={[4, 4, 0, 0]}
          maxBarSize={narrow ? 10 : 22}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default React.memo(WeeklyAppointmentsChart);
