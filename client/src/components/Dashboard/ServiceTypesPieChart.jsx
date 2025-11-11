import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const ServiceTypesPieChart = ({ data, isDark }) => {
  const chartColors = useMemo(() => ({
    tooltipBg: isDark ? '#1F2937' : 'white',
    text: isDark ? '#F9FAFB' : '#111827',
  }), [isDark]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: chartColors.tooltipBg,
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            color: chartColors.text
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default React.memo(ServiceTypesPieChart);