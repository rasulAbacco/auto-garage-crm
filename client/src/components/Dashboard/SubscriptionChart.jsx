// client/src/components/Dashboard/SubscriptionChart.jsx
import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getChartTheme, EmptyChart } from "./chartTheme";

const SubscriptionChart = ({ data = {}, isDark }) => {
  const c = useMemo(() => getChartTheme(isDark), [isDark]);

  const pieData = [
    { name: "Basic", value: Number(data?.basic) || 0, color: c.muted },
    { name: "Standard", value: Number(data?.standard) || 0, color: c.primary },
    { name: "Premium", value: Number(data?.premium) || 0, color: c.warning },
  ];
  const total = pieData.reduce((s, r) => s + r.value, 0);

  if (!total) {
    return (
      <EmptyChart
        text="No subscription data yet"
        height={230}
        isDark={isDark}
      />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={230}>
      <PieChart>
        <Pie
          data={pieData}
          dataKey="value"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={4}
          stroke="none"
        >
          {pieData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={c.tooltip} itemStyle={{ color: c.text }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={c.legend} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default React.memo(SubscriptionChart);
