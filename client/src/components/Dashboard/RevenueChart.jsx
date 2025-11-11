import React, { useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const RevenueChart = ({ data, isDark }) => {
    const chartColors = useMemo(() => ({
        grid: isDark ? '#374151' : '#f0f0f0',
        axis: isDark ? '#9CA3AF' : '#666',
        tooltipBg: isDark ? '#1F2937' : 'white',
        text: isDark ? '#F9FAFB' : '#111827',
    }), [isDark]);

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="servicesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="month" stroke={chartColors.axis} fontSize={12} />
                <YAxis stroke={chartColors.axis} fontSize={12} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: chartColors.tooltipBg,
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        color: chartColors.text
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                    strokeWidth={3}
                />
                <Area
                    type="monotone"
                    dataKey="services"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#servicesGradient)"
                    strokeWidth={3}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default React.memo(RevenueChart);