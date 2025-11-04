// client/src/pages/clients/components/VehicleInfoSection.jsx
import React from "react";
import { FiCalendar, FiHash } from "react-icons/fi";
import { FaCar } from "react-icons/fa";

export default function VehicleInfoSection({ form, setForm, isDark }) {
    return (
        <div
            className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                } rounded-3xl shadow-xl border overflow-hidden`}
        >
            <div
                className={`p-6 border-b ${isDark
                        ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700"
                        : "border-gray-200 bg-gradient-to-r from-green-600 to-teal-600"
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <FaCar className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Vehicle Information</h2>
                        <p className="text-sm text-white/80">Vehicle details and registration</p>
                    </div>
                </div>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-6">
                <InputField
                    icon={<FaCar />}
                    label="Vehicle Make"
                    value={form.vehicleMake}
                    onChange={(e) => setForm({ ...form, vehicleMake: e.target.value })}
                    placeholder="e.g., Toyota, BMW"
                    isDark={isDark}
                />

                <InputField
                    icon={<FaCar />}
                    label="Vehicle Model"
                    value={form.vehicleModel}
                    onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })}
                    placeholder="e.g., Camry, X5"
                    isDark={isDark}
                />

                <InputField
                    icon={<FiCalendar />}
                    label="Vehicle Year"
                    value={form.vehicleYear}
                    onChange={(e) => setForm({ ...form, vehicleYear: e.target.value })}
                    placeholder="2024"
                    type="number"
                    isDark={isDark}
                />

                <InputField
                    icon={<FiHash />}
                    label="Registration Number"
                    value={form.regNumber}
                    onChange={(e) =>
                        setForm({ ...form, regNumber: e.target.value.toUpperCase() })
                    }
                    placeholder="ABC1234"
                    isDark={isDark}
                />

                <div className="md:col-span-2">
                    <InputField
                        icon={<FiHash />}
                        label="VIN / Chassis Number"
                        value={form.vin}
                        onChange={(e) =>
                            setForm({ ...form, vin: e.target.value.toUpperCase() })
                        }
                        placeholder="1HGCM82633A123456"
                        isDark={isDark}
                    />
                </div>
            </div>
        </div>
    );
}

function InputField({ icon, label, value, onChange, placeholder, isDark, type = "text" }) {
    return (
        <div>
            <label
                className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"
                    }`}
            >
                {icon}
                {label}
            </label>
            <input
                type={type}
                className={`w-full px-4 py-3 rounded-xl font-medium border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${isDark
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-500"
                    }`}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
            />
        </div>
    );
}
