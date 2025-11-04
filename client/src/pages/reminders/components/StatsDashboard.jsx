import React from "react";
import { FiBell, FiAlertCircle, FiClock, FiTrendingUp } from "react-icons/fi";
import { useTheme } from "../../../contexts/ThemeContext";
import { motion } from "framer-motion";

// 🎨 Animated Stat Card Component
const StatCard = ({ title, value, icon: Icon, gradient }) => {
    const { isDark } = useTheme();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`${isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
                } rounded-2xl p-6 shadow-md border hover:shadow-lg transition-all hover:scale-[1.03]`}
        >
            <div className="flex justify-between items-center">
                <div>
                    <p
                        className={`text-sm uppercase font-semibold tracking-wide ${isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                    >
                        {title}
                    </p>

                    {/* Animated Value */}
                    <motion.p
                        key={value}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`text-4xl font-black ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                        {value ?? 0}
                    </motion.p>
                </div>

                <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${gradient} shadow-md`}
                >
                    <Icon className="text-white" size={28} />
                </div>
            </div>
        </motion.div>
    );
};

export default function StatsDashboard({ stats = {} }) {
    const safeStats = {
        total: stats.total || 0,
        overdue: stats.overdue || 0,
        today: stats.today || 0,
        upcoming: stats.upcoming || 0,
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
            <StatCard
                title="Total Reminders"
                value={safeStats.total}
                icon={FiBell}
                gradient="from-blue-500 to-indigo-600"
            />
            <StatCard
                title="Overdue"
                value={safeStats.overdue}
                icon={FiAlertCircle}
                gradient="from-red-500 to-rose-600"
            />
            <StatCard
                title="Due Today"
                value={safeStats.today}
                icon={FiClock}
                gradient="from-orange-500 to-amber-600"
            />
            <StatCard
                title="Upcoming"
                value={safeStats.upcoming}
                icon={FiTrendingUp}
                gradient="from-green-500 to-emerald-600"
            />
        </motion.div>
    );
}
