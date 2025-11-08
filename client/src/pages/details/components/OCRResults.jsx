// client/src/pages/details/components/OCRResults.jsx
import React, { useEffect, useState } from "react";
import {
    FiEdit,
    FiSave,
    FiX,
    FiFileText,
    FiAlertCircle,
} from "react-icons/fi";

const OCRResults = ({
    isDark,
    parsedData,
    rawOcrText,
    isEditing,
    setIsEditing,
    editedData,
    setEditedData,
    onSave,
}) => {
    const [autoFilled, setAutoFilled] = useState(false);

    // Map of field labels
    const fieldLabels = {
        regNo: "Registration Number",
        regDate: "Registration Date",
        formNumber: "Form Number",
        oSlNo: "O.SL.NO",
        chassisNo: "Chassis Number",
        engineNo: "Engine Number",
        mfr: "Manufacturer",
        model: "Model",
        vehicleClass: "Class",
        colour: "Colour",
        body: "Body Type",
        wheelBase: "Wheel Base",
        mfgDate: "Manufacturing Date",
        fuel: "Fuel Type",
        regFcUpto: "REG/FC Valid Upto",
        taxUpto: "Tax Valid Upto",
        noOfCyl: "Number of Cylinders",
        unladenWt: "Unladen Weight",
        seating: "Seating Capacity",
        stdgSlpr: "STDG/SLPR",
        cc: "CC (Cubic Capacity)",
        ownerName: "Owner Name",
        swdOf: "S/W/D Of",
        address: "Address",
    };

    // Always keep full input layout even if empty
    const allFields = Object.keys(fieldLabels);

    // 🔄 Auto-fill fallback from raw OCR text when structured data is missing
    useEffect(() => {
        if (parsedData && Object.values(parsedData).some((v) => v)) {
            setEditedData({ ...parsedData });
            setAutoFilled(false);
        } else if (rawOcrText && !autoFilled) {
            const raw = rawOcrText.toUpperCase();
            const extracted = {};

            // Simple pattern-based fallback
            for (const [key, label] of Object.entries(fieldLabels)) {
                const pattern = new RegExp(`${label.replace(/[^A-Z0-9]/gi, ".{0,2}")}[:\\s-]*([A-Z0-9/.,() &-]+)`, "i");
                const match = raw.match(pattern);
                extracted[key] = match ? match[1].trim() : "";
            }

            // Address multiline fallback
            if (!extracted.address && raw.includes("ADDRESS")) {
                const addressMatch = raw.match(/ADDRESS[:\s-]*([\s\S]*?)(?:MFR|BODY|CLASS|WHEEL|FUEL|$)/i);
                if (addressMatch) extracted.address = addressMatch[1].replace(/\n/g, " ").trim();
            }

            setEditedData(extracted);
            setAutoFilled(true);
        }
    }, [parsedData, rawOcrText, autoFilled, setEditedData]);

    const handleInputChange = (key, value) => {
        setEditedData((prev) => ({ ...prev, [key]: value }));
    };

    const displayData = isEditing ? editedData : parsedData || {};

    return (
        <div
            className={`rounded-3xl border shadow-xl ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                }`}
        >
            {/* Header */}
            <div
                className={`p-6 border-b flex items-center justify-between ${isDark
                        ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700"
                        : "border-gray-200 bg-gradient-to-r from-green-600 to-teal-600"
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <FiFileText className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Extracted Information</h2>
                        <p className="text-sm text-white/80">
                            Review and edit extracted RC data
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                    {!isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-white/20 hover:bg-white/30 text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
                            >
                                <FiEdit /> Edit
                            </button>
                            <button
                                onClick={() => onSave(displayData)}
                                className="bg-white text-green-600 px-5 py-3 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg"
                            >
                                <FiSave /> Save
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="bg-white/20 hover:bg-white/30 text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
                            >
                                <FiX /> Cancel
                            </button>
                            <button
                                onClick={() => onSave(editedData)}
                                className="bg-white text-green-600 px-5 py-3 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg"
                            >
                                <FiSave /> Save
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
                {/* Input Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allFields.map((key) => (
                        <div
                            key={key}
                            className={`p-4 rounded-xl border ${isDark
                                    ? "bg-gray-700/50 border-gray-600"
                                    : "bg-gray-50 border-gray-200"
                                }`}
                        >
                            <label
                                className={`block text-xs font-bold uppercase tracking-wide mb-2 ${isDark ? "text-gray-400" : "text-gray-600"
                                    }`}
                            >
                                {fieldLabels[key]}
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedData?.[key] || ""}
                                    onChange={(e) => handleInputChange(key, e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg border font-medium ${isDark
                                            ? "bg-gray-600 border-gray-500 text-white"
                                            : "bg-white border-gray-300 text-gray-900"
                                        }`}
                                    placeholder="Enter value"
                                />
                            ) : (
                                <p
                                    className={`font-semibold ${displayData?.[key]
                                            ? isDark
                                                ? "text-white"
                                                : "text-gray-900"
                                            : isDark
                                                ? "text-gray-500"
                                                : "text-gray-400"
                                        }`}
                                >
                                    {displayData?.[key] || "Not found"}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Raw OCR Text */}
                {rawOcrText && (
                    <div
                        className={`mt-6 rounded-xl p-6 ${isDark
                                ? "bg-gray-700 border border-gray-600"
                                : "bg-gray-50 border border-gray-200"
                            }`}
                    >
                        <h4
                            className={`font-bold mb-2 ${isDark ? "text-gray-200" : "text-gray-700"
                                }`}
                        >
                            Raw OCR Text
                        </h4>
                        <pre
                            className={`whitespace-pre-wrap text-sm ${isDark ? "text-gray-300" : "text-gray-700"
                                }`}
                        >
                            {rawOcrText}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OCRResults;
