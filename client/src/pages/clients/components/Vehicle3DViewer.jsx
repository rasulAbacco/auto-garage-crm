// client/src/pages/clients/components/Vehicle3DViewer.jsx
import React, { useRef, useState } from "react";
import { FiRotateCw, FiZoomIn, FiZoomOut, FiMove } from "react-icons/fi";

export default function Vehicle3DViewer({ form, isDark }) {
    const [rotation, setRotation] = useState({ x: -20, y: 0 });
    const [scale, setScale] = useState(1);
    const [isZooming, setIsZooming] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [currentView, setCurrentView] = useState("Front");
    const startPos = useRef({ x: 0, y: 0 });
    const startRot = useRef({ x: 0, y: 0 });

    const handleWheel = (e) => {
        e.preventDefault();
        setIsZooming(true);
        const delta = e.deltaY * -0.01;
        setScale((prev) => Math.min(3, Math.max(0.5, prev + delta)));
        setTimeout(() => setIsZooming(false), 150);
    };

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

    // ✅ Touch events
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

    const resetView = () => {
        setRotation({ x: -20, y: 0 });
        setScale(1);
        setCurrentView("Front");
    };

    return (
        <div
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`rounded-2xl p-5 ${isDark
                    ? "bg-gray-700/50 border-gray-600"
                    : "bg-gradient-to-br from-purple-50 to-pink-50 border-gray-200"
                } border-2`}
        >
            <div className="flex items-center justify-between mb-4">
                <h3
                    className={`font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"
                        }`}
                >
                    <FiMove className={isDark ? "text-purple-400" : "text-purple-600"} />
                    3D Interactive View
                </h3>
                <div className="flex items-center gap-2">
                    <span
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${isZooming
                                ? "bg-yellow-500 text-white animate-pulse"
                                : isDark
                                    ? "bg-gray-800 text-purple-400"
                                    : "bg-purple-100 text-purple-700"
                            }`}
                    >
                        {currentView} • {Math.round(scale * 100)}%
                    </span>
                    <button
                        type="button"
                        onClick={resetView}
                        className={`p-2 rounded-lg transition-all ${isDark
                                ? "bg-gray-600 hover:bg-gray-500 text-white"
                                : "bg-white hover:bg-gray-50 border-2 border-gray-300"
                            }`}
                        title="Reset view"
                    >
                        <FiRotateCw size={16} />
                    </button>
                </div>
            </div>

            <div
                className={`relative h-80 rounded-xl overflow-hidden cursor-grab ${isDark
                        ? "bg-gradient-to-br from-gray-900 to-gray-800"
                        : "bg-gradient-to-br from-gray-50 to-gray-100"
                    } border-2 ${isDark ? "border-gray-600" : "border-gray-200"
                    } shadow-inner flex items-center justify-center`}
                style={{
                    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${scale})`,
                    transition: isDragging ? "none" : "transform 0.4s ease",
                }}
            >
                <img
                    src={
                        form.adImage ||
                        `https://via.placeholder.com/800x400?text=${encodeURIComponent(
                            form.vehicleMake || "Car"
                        )}+${encodeURIComponent(form.vehicleModel || "")}`
                    }
                    alt="3D vehicle"
                    className="max-w-full h-auto rounded-xl"
                    style={{ maxHeight: "280px" }}
                />
            </div>
        </div>
    );
}
