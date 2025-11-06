import React, { useRef, useState, useEffect } from "react";
import { RotateCw, Move, Maximize2 } from "lucide-react";

export default function Vehicle3DViewer({
    adImage,
    carImage,
    damageImages = [],
    vehicleMake,
    vehicleModel,
    isDark,
}) {
    const [rotation, setRotation] = useState({ x: -20, y: 0 });
    const [scale, setScale] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [currentView, setCurrentView] = useState("Front");
    const [activeImage, setActiveImage] = useState(adImage || carImage || "");
    const startPos = useRef({ x: 0, y: 0 });
    const startRot = useRef({ x: 0, y: 0 });

    /** Reset image when props change */
    useEffect(() => {
        setActiveImage(adImage || carImage || "");
    }, [adImage, carImage]);

    /** Mouse drag rotation */
    const handleMouseDown = (e) => {
        setIsDragging(true);
        startPos.current = { x: e.clientX, y: e.clientY };
        startRot.current = { ...rotation };
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startPos.current.x;
        const dy = e.clientY - startPos.current.y;
        setRotation({
            x: Math.max(-90, Math.min(90, startRot.current.x - dy * 0.4)),
            y: startRot.current.y + dx * 0.4,
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    /** Touch controls */
    const handleTouchStart = (e) => {
        if (e.touches.length === 1) {
            startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            startRot.current = { ...rotation };
            setIsDragging(true);
        }
    };

    const handleTouchMove = (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - startPos.current.x;
        const dy = e.touches[0].clientY - startPos.current.y;
        setRotation({
            x: Math.max(-90, Math.min(90, startRot.current.x - dy * 0.4)),
            y: startRot.current.y + dx * 0.4,
        });
    };

    const handleTouchEnd = () => setIsDragging(false);

    /** View presets */
    const setPreset = (view) => {
        if (view === "Front") setRotation({ x: -20, y: 0 });
        if (view === "Side") setRotation({ x: -10, y: 90 });
        if (view === "Rear") setRotation({ x: -20, y: 180 });
        if (view === "Top") setRotation({ x: -80, y: 0 });
        setCurrentView(view);
    };

    const resetView = () => {
        setRotation({ x: -20, y: 0 });
        setScale(1);
        setCurrentView("Front");
    };

    const fallbackImage = `https://via.placeholder.com/800x400/6b7280/ffffff?text=${encodeURIComponent(
        vehicleMake || "Vehicle"
    )}+${encodeURIComponent(vehicleModel || "")}`;

    return (
        <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`rounded-2xl p-5 border backdrop-blur-sm transition-all duration-300 ${isDark
                    ? "bg-gray-800/50 border-gray-700/50"
                    : "bg-white border-gray-200"
                }`}
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3
                    className={`text-base font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"
                        }`}
                >
                    <Move
                        className={isDark ? "text-purple-400" : "text-purple-600"}
                        size={18}
                    />
                    3D Interactive View
                </h3>

                <div className="flex items-center gap-2 flex-wrap">
                    <span
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${isDark
                                ? "bg-gray-700 text-purple-400"
                                : "bg-purple-100 text-purple-700"
                            }`}
                    >
                        {currentView}
                    </span>

                    <div className="hidden sm:flex items-center gap-1">
                        {["Front", "Side", "Rear", "Top"].map((view) => (
                            <button
                                key={view}
                                onClick={() => setPreset(view)}
                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${currentView === view
                                        ? isDark
                                            ? "bg-purple-600 text-white"
                                            : "bg-purple-600 text-white"
                                        : isDark
                                            ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                {view}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={resetView}
                        className={`p-2 rounded-lg transition-all ${isDark
                                ? "bg-gray-700 hover:bg-gray-600 text-white"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            }`}
                        title="Reset view"
                    >
                        <RotateCw size={16} />
                    </button>
                </div>
            </div>

            {/* Mobile view buttons */}
            <div className="sm:hidden flex items-center gap-1 mb-3 overflow-x-auto pb-2">
                {["Front", "Side", "Rear", "Top"].map((view) => (
                    <button
                        key={view}
                        onClick={() => setPreset(view)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${currentView === view
                                ? isDark
                                    ? "bg-purple-600 text-white"
                                    : "bg-purple-600 text-white"
                                : isDark
                                    ? "bg-gray-700 text-gray-300"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                    >
                        {view}
                    </button>
                ))}
            </div>

            {/* 3D View Window */}
            <div
                className={`relative h-64 sm:h-80 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center ${isDark
                        ? "bg-gradient-to-br from-gray-900 to-gray-800"
                        : "bg-gradient-to-br from-gray-50 to-gray-100"
                    } border ${isDark ? "border-gray-700" : "border-gray-200"} shadow-inner`}
                style={{
                    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${scale})`,
                    transition: isDragging ? "none" : "transform 0.3s ease-out",
                }}
            >
                {activeImage ? (
                    <img
                        src={activeImage}
                        alt="3D Vehicle"
                        className="max-w-full max-h-full object-contain rounded-lg"
                        draggable="false"
                    />
                ) : (
                    <div className="text-center p-4">
                        <div
                            className={`text-sm mb-3 ${isDark ? "text-gray-400" : "text-gray-500"
                                }`}
                        >
                            No image available
                        </div>
                        <img
                            src={fallbackImage}
                            alt="placeholder"
                            className="rounded-lg opacity-40 mx-auto max-w-full"
                            style={{ maxHeight: "200px" }}
                        />
                    </div>
                )}
            </div>

            {/* Damage Image Thumbnails */}
            {Array.isArray(damageImages) && damageImages.length > 0 && (
                <div className="mt-4">
                    <p
                        className={`text-sm font-semibold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                    >
                        Additional Views:
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {damageImages.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveImage(img)}
                                className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden transition-all duration-200 ${activeImage === img
                                        ? "scale-105 border-purple-500 shadow-lg"
                                        : isDark
                                            ? "border-gray-600 hover:border-purple-400"
                                            : "border-gray-300 hover:border-purple-400"
                                    }`}
                            >
                                <img
                                    src={img}
                                    alt={`damage-${idx}`}
                                    className="object-cover w-full h-full"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Hint Text */}
            <div
                className={`mt-3 text-xs text-center ${isDark ? "text-gray-500" : "text-gray-400"
                    }`}
            >
                Drag to rotate • Use preset buttons for quick views
            </div>
        </div>
    );
}