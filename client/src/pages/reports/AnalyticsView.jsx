// client/src/pages/reports/AnalyticsView.jsx
import React, { useMemo } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend,
} from "recharts";
import { FiDollarSign, FiCheckCircle, FiClock } from "react-icons/fi";

export default function AnalyticsView({ summary, invoices, isDark }) {
    const COLORS = ["#6366F1", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

    // Build monthly revenue trend from invoice list
    const revenueOverTime = useMemo(() => {
        if (!invoices?.length) return [];
        const map = {};
        invoices.forEach((inv) => {
            if (!inv.issuedAt || typeof inv.grandTotal !== "number") return;
            const d = new Date(inv.createdAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            map[key] = (map[key] || 0) + Number(inv.grandTotal || 0);
        });
        return Object.entries(map).map(([month, revenue]) => ({ month, revenue }));
    }, [invoices]);

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-xl">
                    <FiDollarSign size={28} />
                    <h4 className="text-lg font-semibold mt-2">Total Revenue</h4>
                    <p className="text-2xl font-bold">
                        ${summary?.revenueSummary?.totalRevenue?.toFixed(2) || 0}
                    </p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-xl">
                    <FiCheckCircle size={28} />
                    <h4 className="text-lg font-semibold mt-2">Paid Revenue</h4>
                    <p className="text-2xl font-bold">
                        ${summary?.revenueSummary?.paidRevenue?.toFixed(2) || 0}
                    </p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-xl">
                    <FiClock size={28} />
                    <h4 className="text-lg font-semibold mt-2">Pending Revenue</h4>
                    <p className="text-2xl font-bold">
                        ${summary?.revenueSummary?.pendingRevenue?.toFixed(2) || 0}
                    </p>
                </div>
            </div>

            {/* Revenue Over Time */}
            <div
                className={`rounded-3xl border shadow-lg ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    }`}
            >
                <div
                    className={`p-5 border-b ${isDark
                            ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700"
                            : "border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600"
                        } text-white`}
                >
                    <h3 className="text-2xl font-bold">Revenue Over Time</h3>
                    <p className="text-sm text-white/80">Monthly revenue from invoices</p>
                </div>

                <div className="p-6">
                    {revenueOverTime.length === 0 ? (
                        <div className="text-center text-gray-500 py-12">
                            No revenue data available
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={revenueOverTime}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke={isDark ? "#374151" : "#e6e6e6"}
                                />
                                <XAxis dataKey="month" stroke={isDark ? "#9CA3AF" : "#6B7280"} />
                                <YAxis stroke={isDark ? "#9CA3AF" : "#6B7280"} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? "#1F2937" : "#fff",
                                        borderRadius: "0.5rem",
                                        border: "1px solid #ccc",
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#6366F1"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Invoice Status Distribution */}
            <div
                className={`rounded-3xl border shadow-lg ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    }`}
            >
                <div
                    className={`p-5 border-b ${isDark
                            ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700"
                            : "border-gray-200 bg-gradient-to-r from-green-600 to-teal-600"
                        } text-white`}
                >
                    <h3 className="text-2xl font-bold">Invoice Status Distribution</h3>
                    <p className="text-sm text-white/80">
                        Breakdown of invoices by payment status
                    </p>
                </div>

                <div className="p-6">
                    {summary?.invoiceStatusSummary?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={summary.invoiceStatusSummary}
                                    dataKey="count"
                                    nameKey="status"
                                    outerRadius={100}
                                    label
                                >
                                    {summary.invoiceStatusSummary.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? "#1F2937" : "#fff",
                                        borderRadius: "0.5rem",
                                        border: "1px solid #ccc",
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-gray-500 py-12">
                            No invoice data available
                        </div>
                    )}
                </div>
            </div>

            {/* Top Services */}
            <div
                className={`rounded-3xl border shadow-lg ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    }`}
            >
                <div
                    className={`p-5 border-b ${isDark
                            ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700"
                            : "border-gray-200 bg-gradient-to-r from-pink-600 to-orange-500"
                        } text-white`}
                >
                    <h3 className="text-2xl font-bold">Top Services</h3>
                    <p className="text-sm text-white/80">
                        Most frequently performed service types
                    </p>
                </div>

                <div className="p-6">
                    {summary?.serviceStats?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart layout="vertical" data={summary.serviceStats}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke={isDark ? "#374151" : "#e6e6e6"}
                                />
                                <XAxis type="number" stroke={isDark ? "#9CA3AF" : "#6B7280"} />
                                <YAxis
                                    dataKey="type"
                                    type="category"
                                    width={140}
                                    stroke={isDark ? "#9CA3AF" : "#6B7280"}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? "#1F2937" : "#fff",
                                        borderRadius: "0.5rem",
                                        border: "1px solid #ccc",
                                    }}
                                />
                                <Bar dataKey="_count.type" fill="#06B6D4" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-gray-500 py-12">
                            No service data available
                        </div>
                    )}
                </div>
            </div>

            {/* Top Clients */}
            <div
                className={`rounded-3xl border shadow-lg ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    }`}
            >
                <div
                    className={`p-5 border-b ${isDark
                            ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700"
                            : "border-gray-200 bg-gradient-to-r from-violet-600 to-indigo-600"
                        } text-white`}
                >
                    <h3 className="text-2xl font-bold">Top Clients</h3>
                    <p className="text-sm text-white/80">
                        Clients with highest total spending
                    </p>
                </div>

                <div className="p-6">
                    {summary?.topClients?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={summary.topClients}>
                                <XAxis dataKey="fullName" stroke={isDark ? "#9CA3AF" : "#6B7280"} />
                                <YAxis stroke={isDark ? "#9CA3AF" : "#6B7280"} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: isDark ? "#1F2937" : "#fff",
                                        borderRadius: "0.5rem",
                                        border: "1px solid #ccc",
                                    }}
                                />
                                <Bar dataKey="totalSpent" fill="#8B5CF6" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-gray-500 py-12">
                            No client data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
