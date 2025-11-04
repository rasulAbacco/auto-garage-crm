import React from "react";
import {
    FiBell,
    FiCalendar,
    FiUser,
    FiShield,
    FiAward,
    FiTrash2,
    FiCheckCircle,
    FiAlertCircle,
    FiClock,
    FiMail,
    FiSmartphone,
} from "react-icons/fi";
import { useTheme } from "../../../contexts/ThemeContext";
import { motion } from "framer-motion";
import axios from "axios";

// ✅ Tailwind-safe color maps
const colorMap = {
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-600", darkBg: "bg-red-900/20", darkText: "text-red-400", darkBorder: "border-red-800/30" },
    orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-600", darkBg: "bg-orange-900/20", darkText: "text-orange-400", darkBorder: "border-orange-800/30" },
    yellow: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-600", darkBg: "bg-yellow-900/20", darkText: "text-yellow-400", darkBorder: "border-yellow-800/30" },
    blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600", darkBg: "bg-blue-900/20", darkText: "text-blue-400", darkBorder: "border-blue-800/30" },
    green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-600", darkBg: "bg-green-900/20", darkText: "text-green-400", darkBorder: "border-green-800/30" },
    gray: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-600", darkBg: "bg-gray-700/20", darkText: "text-gray-400", darkBorder: "border-gray-600" },
};

// 🧠 Status logic
const getReminderStatus = (date) => {
    if (!date) return { status: "unknown", color: "gray", label: "No Date", icon: FiClock };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reminderDate = new Date(date);
    reminderDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((reminderDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: "overdue", color: "red", label: "Overdue", icon: FiAlertCircle };
    if (diffDays === 0) return { status: "today", color: "orange", label: "Today", icon: FiClock };
    if (diffDays <= 7) return { status: "soon", color: "yellow", label: `${diffDays} days`, icon: FiClock };
    if (diffDays <= 30) return { status: "upcoming", color: "blue", label: `${diffDays} days`, icon: FiCalendar };
    return { status: "scheduled", color: "green", label: `${diffDays} days`, icon: FiCheckCircle };
};

export default function ReminderCard({ reminder, client, onDelete, index, refreshReminders }) {
    const { isDark } = useTheme();
    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

    const nextServiceStatus = getReminderStatus(reminder.nextService);
    const insuranceStatus = getReminderStatus(reminder.insuranceRenewal);
    const warrantyStatus = getReminderStatus(reminder.warrantyExpiry);
    const NextServiceIcon = nextServiceStatus.icon;

    // ✅ Mark reminder as done — update via backend
    const handleMarkDone = async () => {
        try {
            const nextDate = new Date();
            nextDate.setMonth(nextDate.getMonth() + 6); // 6 months later

            await axios.put(
                `${API_URL}/api/reminders/${reminder.id}`,
                { nextService: nextDate, status: "Completed" },
                { withCredentials: true }
            );

            if (refreshReminders) refreshReminders();
        } catch (err) {
            console.error("❌ Error marking reminder as done:", err);
            alert("Failed to mark reminder as done.");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            className={`relative rounded-2xl shadow-lg overflow-hidden border ${isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
                } hover:shadow-2xl transition-all duration-300`}
        >
            {/* Status Bar */}
            <div
                className={`h-1 bg-gradient-to-r ${nextServiceStatus.status === "overdue"
                    ? "from-red-500 to-red-600"
                    : nextServiceStatus.status === "today" || nextServiceStatus.status === "soon"
                        ? "from-yellow-500 to-orange-500"
                        : "from-green-500 to-emerald-500"
                    }`}
            />

            <div className="p-6 flex flex-col md:flex-row gap-6">
                {/* Client Info */}
                <div className="flex-shrink-0 flex flex-col items-center text-center md:w-1/5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-xl mb-3">
                        <FiUser className="text-white" size={28} />
                    </div>
                    <h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
                        {client?.fullName || `Client #${reminder.clientId}`}
                    </h3>
                    {client?.vehicleModel && (
                        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            {client.vehicleMake} {client.vehicleModel}
                        </p>
                    )}
                </div>

                {/* Reminder Details */}
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${isDark
                                ? `${colorMap[nextServiceStatus.color].darkBg} ${colorMap[nextServiceStatus.color].darkBorder} ${colorMap[nextServiceStatus.color].darkText}`
                                : `${colorMap[nextServiceStatus.color].bg} ${colorMap[nextServiceStatus.color].border} ${colorMap[nextServiceStatus.color].text}`
                                }`}
                        >
                            <NextServiceIcon size={14} />
                            {nextServiceStatus.label}
                        </span>
                        <span
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${isDark
                                ? "bg-gray-700 text-gray-300 border border-gray-600"
                                : "bg-gray-100 text-gray-700 border border-gray-300"
                                }`}
                        >
                            🔔 {reminder.notify || "SMS"}
                        </span>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <DateBox icon={FiBell} label="Next Service" status={nextServiceStatus} date={reminder.nextService} isDark={isDark} />
                        <DateBox icon={FiShield} label="Insurance" status={insuranceStatus} date={reminder.insuranceRenewal} isDark={isDark} />
                        <DateBox icon={FiAward} label="Warranty" status={warrantyStatus} date={reminder.warrantyExpiry} isDark={isDark} />
                    </div>

                    {/* Contact Info */}
                    {client && (
                        <div className={`flex flex-wrap gap-4 text-sm p-3 rounded-xl ${isDark ? "bg-gray-700/30" : "bg-gray-50"}`}>
                            {client.phone && (
                                <div className="flex items-center gap-2">
                                    <FiSmartphone className={isDark ? "text-blue-400" : "text-blue-600"} size={14} />
                                    <span className={isDark ? "text-gray-300" : "text-gray-700"}>{client.phone}</span>
                                </div>
                            )}
                            {client.email && (
                                <div className="flex items-center gap-2">
                                    <FiMail className={isDark ? "text-purple-400" : "text-purple-600"} size={14} />
                                    <span className={isDark ? "text-gray-300" : "text-gray-700"}>{client.email}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex flex-col justify-between gap-3 md:w-20">
                    <button
                        onClick={handleMarkDone}
                        className={`p-3 rounded-xl border-2 shadow-md transition-all hover:shadow-lg ${isDark
                            ? "bg-green-900/30 text-green-400 border-green-700 hover:bg-green-900/50"
                            : "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                            }`}
                        title="Mark as Done"
                    >
                        <FiCheckCircle size={20} />
                    </button>

                    <button
                        onClick={() => onDelete(reminder.id)}
                        className={`p-3 rounded-xl border-2 shadow-md transition-all hover:shadow-lg ${isDark
                            ? "bg-red-900/30 text-red-400 border-red-700 hover:bg-red-900/50"
                            : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                            }`}
                        title="Delete Reminder"
                    >
                        <FiTrash2 size={20} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// 📅 Sub-component
const DateBox = ({ icon: Icon, label, status, date, isDark }) => {
    const color = colorMap[status.color];
    return (
        <div className={`p-4 rounded-xl border-2 ${isDark ? `${color.darkBg} ${color.darkBorder}` : `${color.bg} ${color.border}`}`}>
            <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? color.darkBg : color.bg}`}>
                    <Icon className={isDark ? color.darkText : color.text} size={16} />
                </div>
                <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? color.darkText : color.text}`}>{label}</p>
            </div>
            <p className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{date ? new Date(date).toLocaleDateString() : "Not Set"}</p>
        </div>
    );
};
