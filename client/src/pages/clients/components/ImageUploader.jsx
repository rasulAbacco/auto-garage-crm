// client/src/pages/clients/components/ImageUploader.jsx
import React, { useRef, useState } from "react";
import { FiUpload, FiTrash2, FiCamera, FiImage } from "react-icons/fi";

export default function ImageUploader({
    form,
    setForm,
    isDark,
    isImageUploaded,
    setIsImageUploaded,
}) {
    const [showCameraOptions, setShowCameraOptions] = useState(false);
    const fileInputRef = useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            setForm((prev) => ({ ...prev, carImage: dataUrl, adImage: dataUrl }));
            setIsImageUploaded(true);
            setShowCameraOptions(false);
        };
        reader.readAsDataURL(file);
    };

    const triggerFileInput = () => fileInputRef.current.click();

    const removeImage = () => {
        setForm((prev) => ({ ...prev, carImage: "", adImage: "" }));
        setIsImageUploaded(false);
    };

    return (
        <div
            className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                } rounded-3xl shadow-xl border overflow-hidden`}
        >
            <div
                className={`p-6 border-b ${isDark
                        ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700"
                        : "border-gray-200 bg-gradient-to-r from-purple-600 to-pink-600"
                    }`}
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Vehicle Images</h2>
                </div>
            </div>

            <div className="p-6">
                <div className="flex flex-wrap gap-3 mb-6">
                    <button
                        type="button"
                        onClick={() => setShowCameraOptions(!showCameraOptions)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-200 ${isDark
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                            }`}
                    >
                        <FiUpload size={18} />
                        {isImageUploaded ? "Change Images" : "Upload Images"}
                    </button>

                    {isImageUploaded && (
                        <button
                            type="button"
                            onClick={removeImage}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-200 ${isDark
                                    ? "bg-red-600 hover:bg-red-700 text-white border-2 border-red-500"
                                    : "bg-white hover:bg-red-50 text-red-600 border-2 border-red-600"
                                }`}
                        >
                            <FiTrash2 size={18} />
                            Remove Images
                        </button>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                </div>

                {showCameraOptions && (
                    <div
                        className={`mb-6 p-4 rounded-2xl ${isDark ? "bg-gray-700/50 border-gray-600" : "bg-blue-50 border-blue-200"
                            } border`}
                    >
                        <p
                            className={`text-sm font-medium mb-3 ${isDark ? "text-gray-300" : "text-gray-700"
                                }`}
                        >
                            Choose upload method:
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={triggerFileInput}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${isDark
                                        ? "bg-gray-600 hover:bg-gray-500 text-white"
                                        : "bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300"
                                    }`}
                            >
                                <FiImage size={18} />
                                Choose from Gallery
                            </button>

                            <button
                                type="button"
                                onClick={triggerFileInput}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${isDark
                                        ? "bg-gray-600 hover:bg-gray-500 text-white"
                                        : "bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300"
                                    }`}
                            >
                                <FiCamera size={18} />
                                Take Photo
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
