// client/src/components/Dashboard/VehicleDistributionChart.jsx
import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getChartTheme, EmptyChart, useNarrow } from "./chartTheme";

const VehicleDistributionChart = ({ data = [], isDark }) => {
  const c = useMemo(() => getChartTheme(isDark), [isDark]);
  const narrow = useNarrow();

  if (!data || data.length === 0) {
    return (
      <EmptyChart text="No vehicle data yet" height={230} isDark={isDark} />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart
        data={data}
        barCategoryGap="25%"
        margin={{ top: 8, right: 0, left: -22, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
        <XAxis
          dataKey="type"
          stroke={c.axis}
          tick={c.tick}
          tickLine={false}
          axisLine={false}
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
        />
        <Bar
          dataKey="count"
          name="Vehicles"
          fill={c.primary}
          radius={[6, 6, 0, 0]}
          maxBarSize={narrow ? 28 : 44}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default React.memo(VehicleDistributionChart);
