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
import {
    FiDollarSign,
    FiCheckCircle,
    FiClock,
    FiTool,
    FiTrendingUp,
    FiActivity,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
export default function AnalyticsView({ summary, invoices, isDark }) {
    const COLORS = ["#6366F1", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

    // Build monthly revenue trend from invoice list
    const revenueOverTime = useMemo(() => {
        if (!invoices?.length) return [];
        const map = {};
        invoices.forEach((inv) => {
            if (!inv.createdAt || typeof inv.grandTotal !== "number") return;
            const d = new Date(inv.createdAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            map[key] = (map[key] || 0) + Number(inv.grandTotal || 0);
        });
        return Object.entries(map).map(([month, revenue]) => ({ month, revenue }));
    }, [invoices]);

    const serviceSummary = summary?.serviceSummary || {};

    const serviceStatusData = [
        { name: "Completed", value: serviceSummary.completedServices || 0 },
        { name: "Pending", value: serviceSummary.pendingServices || 0 },
        { name: "Cancelled", value: serviceSummary.cancelledServices || 0 },
    ];

    return (
        <div className="space-y-8">
            {/* ===== Revenue Summary ===== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-xl">
                    <FaRupeeSign size={28} />
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

            {/* ===== Service Summary ===== */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-xl">
                    <FiTool size={28} />
                    <h4 className="text-lg font-semibold mt-2">Total Services</h4>
                    <p className="text-2xl font-bold">{serviceSummary.totalServices || 0}</p>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-xl">
                    <FiCheckCircle size={28} />
                    <h4 className="text-lg font-semibold mt-2">Completed</h4>
                    <p className="text-2xl font-bold">{serviceSummary.completedServices || 0}</p>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl">
                    <FiClock size={28} />
                    <h4 className="text-lg font-semibold mt-2">Pending</h4>
                    <p className="text-2xl font-bold">{serviceSummary.pendingServices || 0}</p>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-xl">
                    <FiActivity size={28} />
                    <h4 className="text-lg font-semibold mt-2">Avg Service Cost</h4>
                    <p className="text-2xl font-bold">
                        ${serviceSummary.averageServiceCost?.toFixed(2) || 0}
                    </p>
                </div>
            </div>

            {/* ===== Revenue Over Time ===== */}
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
                        <div className="text-center text-gray-500 py-12">No revenue data available</div>
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

            {/* ===== Invoice Status Distribution ===== */}
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
                    <p className="text-sm text-white/80">Breakdown of invoices by payment status</p>
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

            {/* ===== Service Status Breakdown ===== */}
            <div
                className={`rounded-3xl border shadow-lg ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    }`}
            >
                <div
                    className={`p-5 border-b ${isDark
                        ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700"
                        : "border-gray-200 bg-gradient-to-r from-cyan-600 to-teal-500"
                        } text-white`}
                >
                    <h3 className="text-2xl font-bold">Service Status Overview</h3>
                    <p className="text-sm text-white/80">Completion and progress of all services</p>
                </div>

                <div className="p-6">
                    {serviceStatusData.every((s) => s.value === 0) ? (
                        <div className="text-center text-gray-500 py-12">
                            No service data available
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={serviceStatusData}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={100}
                                    label
                                >
                                    {serviceStatusData.map((entry, index) => (
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
                    )}
                </div>
            </div>

            {/* ===== Top Service Types by Revenue ===== */}
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
                    <h3 className="text-2xl font-bold">Top Services by Revenue</h3>
                    <p className="text-sm text-white/80">Highest-earning service types</p>
                </div>

                <div className="p-6">
                    {serviceSummary?.topServiceTypes?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart layout="vertical" data={serviceSummary.topServiceTypes}>
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
                                <Bar dataKey="total" fill="#06B6D4" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-gray-500 py-12">
                            No service revenue data available
                        </div>
                    )}
                </div>
            </div>

            {/* ===== Top Clients ===== */}
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
                    <p className="text-sm text-white/80">Clients with highest total spending</p>
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
                        <div className="text-center text-gray-500 py-12">No client data available</div>
                    )}
                </div>
            </div>
        </div>
    );
}
