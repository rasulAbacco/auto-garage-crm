import React, { useRef, useState, useEffect } from "react";
import { FiUpload, FiTrash2, FiCamera, FiImage, FiX } from "react-icons/fi";

export default function ImageUploader({
    form,
    setForm,
    isDark,
    isImageUploaded,
    setIsImageUploaded,
}) {
    const mainFileRef = useRef(null);
    const damageFileRef = useRef(null);
    const [showCameraOptions, setShowCameraOptions] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    /** Convert File → base64 DataURL */
    const toDataUrl = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    /** Handle single or multiple image uploads */
    const handleFiles = async (files, type = "damage") => {
        if (!files?.length) return;
        const maxSize = 5 * 1024 * 1024;

        if (type === "main") {
            const file = files[0];
            if (file.size > maxSize) {
                alert("Main image too large (max 5MB)");
                return;
            }
            const dataUrl = await toDataUrl(file);
            setForm((prev) => ({
                ...prev,
                carImage: dataUrl,
                adImage: dataUrl,
            }));
            setIsImageUploaded(true);
        } else {
            const newImgs = [];
            for (const file of files) {
                if (file.size > maxSize) continue;
                const dataUrl = await toDataUrl(file);
                newImgs.push(dataUrl);
            }
            setForm((prev) => ({
                ...prev,
                damageImages: [...(prev.damageImages || []), ...newImgs],
            }));
        }
        setShowCameraOptions(false);
    };

    /** Remove the main or individual damage image */
    const removeImage = (type, index = null) => {
        if (type === "main") {
            setForm((prev) => ({
                ...prev,
                carImage: "",
                adImage: "",
            }));
            setIsImageUploaded(false);
        } else if (type === "damage" && index !== null) {
            setForm((prev) => {
                const arr = [...(prev.damageImages || [])];
                arr.splice(index, 1);
                return { ...prev, damageImages: arr };
            });
        }
    };

    /** Drag & drop support for main image */
    const handleDrop = async (e) => {
        e.preventDefault();
        setDragOver(false);
        const files = e.dataTransfer.files;
        await handleFiles(files, "main");
    };

    return (
        <div
            className={`${isDark ? "bg-gray-800/50 border-gray-700/50" : "bg-white border-gray-200"
                } rounded-2xl shadow-lg border backdrop-blur-sm overflow-hidden transition-all duration-300`}
        >
            {/* Header */}
            <div
                className={`px-6 py-5 border-b ${isDark
                        ? "border-gray-700/50 bg-gradient-to-r from-purple-900/20 to-pink-900/20"
                        : "border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50"
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center ${isDark
                                ? "bg-purple-500/10 text-purple-400"
                                : "bg-purple-500/10 text-purple-600"
                            }`}
                    >
                        <FiImage size={20} />
                    </div>
                    <div>
                        <h2
                            className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"
                                }`}
                        >
                            Vehicle Images
                        </h2>
                        <p
                            className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"
                                }`}
                        >
                            Upload main and damage photos
                        </p>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
                {/* Upload buttons */}
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => setShowCameraOptions(!showCameraOptions)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isDark
                                ? "bg-purple-600 hover:bg-purple-700 text-white"
                                : "bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg"
                            }`}
                    >
                        <FiUpload size={16} />
                        {isImageUploaded ? "Change Images" : "Upload Images"}
                    </button>

                    {isImageUploaded && (
                        <button
                            type="button"
                            onClick={() => removeImage("main")}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isDark
                                    ? "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/50"
                                    : "bg-white hover:bg-red-50 text-red-600 border border-red-300 shadow-sm"
                                }`}
                        >
                            <FiTrash2 size={16} />
                            Remove Main Image
                        </button>
                    )}
                </div>

                {/* Upload option menu */}
                {showCameraOptions && (
                    <div
                        className={`p-4 rounded-xl border ${isDark
                                ? "bg-gray-700/30 border-gray-600"
                                : "bg-purple-50/50 border-purple-200"
                            }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <p
                                className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"
                                    }`}
                            >
                                Choose upload method:
                            </p>
                            <button
                                onClick={() => setShowCameraOptions(false)}
                                className={`p-1 rounded-lg transition-colors ${isDark
                                        ? "hover:bg-gray-600 text-gray-400"
                                        : "hover:bg-purple-100 text-gray-600"
                                    }`}
                            >
                                <FiX size={18} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => mainFileRef.current.click()}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isDark
                                        ? "bg-gray-600 hover:bg-gray-500 text-white"
                                        : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm"
                                    }`}
                            >
                                <FiImage size={16} /> Main Image
                            </button>

                            <button
                                type="button"
                                onClick={() => damageFileRef.current.click()}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isDark
                                        ? "bg-gray-600 hover:bg-gray-500 text-white"
                                        : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm"
                                    }`}
                            >
                                <FiCamera size={16} /> Damage Photos
                            </button>
                        </div>
                    </div>
                )}

                {/* Hidden inputs */}
                <input
                    ref={mainFileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files, "main")}
                />
                <input
                    ref={damageFileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files, "damage")}
                />

                {/* Drag & drop for main image */}
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    className={`p-6 rounded-xl border-2 border-dashed transition-all ${dragOver
                            ? "border-purple-400 bg-purple-50/50"
                            : isDark
                                ? "bg-gray-700/30 border-gray-600"
                                : "bg-gray-50/50 border-gray-300"
                        }`}
                >
                    {!form.carImage ? (
                        <div className="text-center">
                            <div
                                className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${isDark
                                        ? "bg-purple-500/10 text-purple-400"
                                        : "bg-purple-100 text-purple-600"
                                    }`}
                            >
                                <FiUpload size={24} />
                            </div>
                            <p
                                className={`text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"
                                    }`}
                            >
                                Drop main image here or click to upload
                            </p>
                            <button
                                onClick={() => mainFileRef.current.click()}
                                type="button"
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isDark
                                        ? "bg-gray-600 hover:bg-gray-500 text-white"
                                        : "bg-white hover:bg-gray-50 border border-gray-300 text-gray-700"
                                    }`}
                            >
                                Choose File
                            </button>
                            <p className="text-xs text-gray-500 mt-2">
                                JPG, PNG • Max 5MB
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <img
                                    src={form.carImage}
                                    alt="Main preview"
                                    className="w-32 h-32 rounded-lg object-cover"
                                />
                                <button
                                    onClick={() => removeImage("main")}
                                    type="button"
                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-all"
                                >
                                    <FiTrash2 size={14} />
                                </button>
                            </div>
                            <div>
                                <p
                                    className={`text-sm font-semibold ${isDark ? "text-gray-200" : "text-gray-700"
                                        }`}
                                >
                                    Main Vehicle Image
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Click the trash icon to remove
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Damage Images Grid */}
                <div>
                    <h4
                        className={`text-sm font-semibold mb-3 ${isDark ? "text-gray-200" : "text-gray-700"
                            }`}
                    >
                        Damage / Additional Photos
                    </h4>

                    {(!form.damageImages || form.damageImages.length === 0) ? (
                        <p className="text-sm text-gray-500 text-center py-6">
                            No additional photos uploaded yet.
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {(form.damageImages || []).map((img, index) => (
                                <div
                                    key={index}
                                    className="relative group rounded-lg overflow-hidden"
                                >
                                    <img
                                        src={img}
                                        alt={`Damage-${index}`}
                                        className="w-full h-32 object-cover"
                                    />
                                    <button
                                        onClick={() => removeImage("damage", index)}
                                        type="button"
                                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-all opacity-90 group-hover:opacity-100"
                                    >
                                        <FiTrash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}