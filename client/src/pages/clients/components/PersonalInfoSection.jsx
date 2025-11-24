//PersonalInfoSection
import React from "react";

import { FiUser, FiPhone, FiMail, FiMapPin, FiUsers } from "react-icons/fi";

export default function PersonalInfoSection({ form, setForm, isDark }) {

    return (
        <div

            className={`${isDark ? "bg-gray-800/50 border-gray-700/50" : "bg-white border-gray-200"

                } rounded-2xl shadow-lg border backdrop-blur-sm overflow-hidden transition-all duration-300`}
        >

            {/* Header */}
            <div

                className={`px-6 py-5 border-b ${isDark

                        ? "border-gray-700/50 bg-gradient-to-r from-blue-900/20 to-purple-900/20"

                        : "border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50"

                    }`}
            >
                <div className="flex items-center gap-3">
                    <div

                        className={`w-11 h-11 rounded-xl flex items-center justify-center ${isDark

                                ? "bg-blue-500/10 text-blue-400"

                                : "bg-blue-500/10 text-blue-600"

                            }`}
                    >
                        <FiUser size={20} />
                    </div>
                    <div>
                        <h2

                            className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"

                                }`}
                        >

                            Personal Information
                        </h2>
                        <p

                            className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"

                                }`}
                        >

                            Client contact details
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Fields */}
            <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <InputField

                        icon={<FiUser />}

                        label="Full Name"

                        required

                        value={form.fullName}

                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}

                        placeholder="Enter full name"

                        isDark={isDark}

                    />

                    <InputField

                        icon={<FiPhone />}

                        label="Phone Number"

                        required

                        value={form.phone}

                        onChange={(e) => setForm({ ...form, phone: e.target.value })}

                        placeholder="Enter phone number"

                        isDark={isDark}

                    />

                    <InputField

                        icon={<FiMail />}

                        label="Email Address"

                        value={form.email}

                        onChange={(e) => setForm({ ...form, email: e.target.value })}

                        placeholder="Enter email address"

                        isDark={isDark}

                    />

                    <InputField

                        icon={<FiMapPin />}

                        label="Address"

                        value={form.address}

                        onChange={(e) => setForm({ ...form, address: e.target.value })}

                        placeholder="Enter full address"

                        isDark={isDark}

                    />
                </div>

                {/* Receiver Name Field - Full Width */}
                <div className="mt-5">
                    <InputField

                        icon={<FiUsers />}

                        label="Person Receiving (Receiver Name)"

                        value={form.receiverName ?? form.staffPerson ?? ""}

                        onChange={(e) =>

                            setForm({

                                ...form,

                                receiverName: e.target.value,

                            })

                        }

                        placeholder="Enter name of person who received the vehicle"

                        isDark={isDark}

                        listId="receiver-list"

                    />
                    <datalist id="receiver-list">
                        <option value="John - Front Desk" />
                        <option value="Asha - Mechanic" />
                        <option value="Ravi - Manager" />
                    </datalist>
                </div>
            </div>
        </div>

    );

}

/** Input Field Component **/

function InputField({

    icon,

    label,

    value,

    onChange,

    placeholder,

    isDark,

    required,

    listId,

}) {

    return (
        <div className="w-full">
            <label

                className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"

                    }`}
            >
                <span className={isDark ? "text-blue-400" : "text-blue-600"}>

                    {icon}
                </span>
                <span>

                    {label} {required && <span className="text-red-500">*</span>}
                </span>
            </label>
            <input

                type="text"

                list={listId}

                className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${isDark

                        ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"

                        : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"

                    } focus:outline-none`}

                value={value}

                onChange={onChange}

                placeholder={placeholder}

                required={required}

            />
        </div>

    );

}
