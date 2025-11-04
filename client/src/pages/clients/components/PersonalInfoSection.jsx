// client/src/pages/clients/components/PersonalInfoSection.jsx
import React from "react";
import { FiUser, FiPhone, FiMail, FiMapPin, FiUsers } from "react-icons/fi";

export default function PersonalInfoSection({ form, setForm, isDark }) {
    return (
        <div
            className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                } rounded-3xl shadow-xl border overflow-hidden`}
        >
            <div
                className={`p-6 border-b ${isDark
                        ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700"
                        : "border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600"
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <FiUser className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            Personal Information
                        </h2>
                        <p className="text-sm text-white/80">Client contact details</p>
                    </div>
                </div>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-6">
                {/* Full Name */}
                <InputField
                    icon={<FiUser />}
                    label="Full Name"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Enter full name"
                    isDark={isDark}
                />

                {/* Phone */}
                <InputField
                    icon={<FiPhone />}
                    label="Phone Number"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Enter phone number"
                    isDark={isDark}
                />

                {/* Email */}
                <InputField
                    icon={<FiMail />}
                    label="Email Address"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Enter email address"
                    isDark={isDark}
                />

                {/* Address */}
                <InputField
                    icon={<FiMapPin />}
                    label="Address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Enter full address"
                    isDark={isDark}
                />

                {/* Staff Person */}
                <div className="md:col-span-2">
                    <InputField
                        icon={<FiUsers />}
                        label="Staff Person Handling"
                        value={form.staffPerson}
                        onChange={(e) => setForm({ ...form, staffPerson: e.target.value })}
                        placeholder="Enter staff member name"
                        isDark={isDark}
                    />
                </div>
            </div>
        </div>
    );
}

function InputField({ icon, label, value, onChange, placeholder, isDark, required }) {
    return (
        <div>
            <label
                className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"
                    }`}
            >
                {icon}
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type="text"
                className={`w-full px-4 py-3 rounded-xl font-medium border-2 focus:outline-none focus:ring-2 transition-all duration-200 ${isDark
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                    }`}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
            />
        </div>
    );
}
