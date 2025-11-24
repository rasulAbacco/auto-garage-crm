import React from "react";
import { FiCalendar, FiHash } from "react-icons/fi";
import { FaCar } from "react-icons/fa";

export default function VehicleInfoSection({ form, setForm, isDark }) {
    return (
        <div
            className={`${isDark ? "bg-gray-800/50 border-gray-700/50" : "bg-white border-gray-200"
                } rounded-2xl shadow-lg border backdrop-blur-sm overflow-hidden transition-all duration-300`}
        >
            {/* Header */}
            <div
                className={`px-6 py-5 border-b ${isDark
                        ? "border-gray-700/50 bg-gradient-to-r from-emerald-900/20 to-teal-900/20"
                        : "border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50"
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center ${isDark
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-emerald-500/10 text-emerald-600"
                            }`}
                    >
                        <FaCar size={20} />
                    </div>
                    <div>
                        <h2
                            className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"
                                }`}
                        >
                            Vehicle Information
                        </h2>
                        <p
                            className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"
                                }`}
                        >
                            Vehicle details and registration
                        </p>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Vehicle Make */}
                    <InputField
                        icon={<FaCar />}
                        label="Vehicle Make"
                        required
                        value={form.vehicleMake}
                        onChange={(e) =>
                            setForm({ ...form, vehicleMake: e.target.value })
                        }
                        placeholder="e.g., Toyota, BMW"
                        isDark={isDark}
                        listId="makes"
                    />
                    <datalist id="makes">
                        <option value="Toyota" />
                        <option value="Honda" />
                        <option value="Ford" />
                        <option value="Hyundai" />
                        <option value="Mahindra" />
                        <option value="BMW" />
                        <option value="Audi" />
                    </datalist>

                    {/* Vehicle Model */}
                    <InputField
                        icon={<FaCar />}
                        label="Vehicle Model"
                        required
                        value={form.vehicleModel}
                        onChange={(e) =>
                            setForm({ ...form, vehicleModel: e.target.value })
                        }
                        placeholder="e.g., Camry, X5, Creta"
                        isDark={isDark}
                        listId="models"
                    />
                    <datalist id="models">
                        <option value="Camry" />
                        <option value="Civic" />
                        <option value="X5" />
                        <option value="i20" />
                        <option value="Scorpio" />
                    </datalist>

                    {/* Vehicle Year */}
                    <InputField
                        icon={<FiCalendar />}
                        label="Vehicle Year"
                        type="number"
                        value={form.vehicleYear}
                        onChange={(e) =>
                            setForm({ ...form, vehicleYear: e.target.value })
                        }
                        placeholder="2024"
                        isDark={isDark}
                        min="1990"
                        max={new Date().getFullYear() + 1}
                    />

                    {/* Registration Number */}
                    <InputField
                        icon={<FiHash />}
                        label="Registration Number"
                        required
                        value={form.regNumber}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                regNumber: e.target.value.toUpperCase(),
                            })
                        }
                        placeholder="ABC1234"
                        isDark={isDark}
                    />
                </div>

                {/* VIN / Chassis Number - Full Width */}
                <div className="mt-5">
                    <InputField
                        icon={<FiHash />}
                        label="VIN / Chassis Number"
                        value={form.vin}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                vin: e.target.value.toUpperCase(),
                            })
                        }
                        placeholder="1HGCM82633A123456"
                        isDark={isDark}
                    />
                </div>
            </div>
        </div>
    );
}

/* ===== Reusable Input Field ===== */
function InputField({
    icon,
    label,
    value,
    onChange,
    placeholder,
    isDark,
    type = "text",
    listId,
    required,
    min,
    max,
}) {
    return (
        <div className="w-full">
            <label
                className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"
                    }`}
            >
                <span className={isDark ? "text-emerald-400" : "text-emerald-600"}>
                    {icon}
                </span>
                <span>
                    {label} {required && <span className="text-red-500">*</span>}
                </span>
            </label>
            <input
                type={type}
                list={listId}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                min={min}
                max={max}
                autoComplete="off"
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${isDark
                        ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    } focus:outline-none`}
            />
        </div>
    );
}