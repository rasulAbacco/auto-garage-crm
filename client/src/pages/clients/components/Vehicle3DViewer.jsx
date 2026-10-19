// client/src/pages/clients/components/Vehicle3DViewer.jsx
import React, { useRef, useState, useEffect } from "react";
import { RotateCw, Move, ZoomIn, ZoomOut } from "lucide-react";
import { tk, VehicleImage } from "./clientUi";

const VIEWS = ["Front", "Side", "Rear", "Top"];
const PRESETS = {
  Front: { x: -20, y: 0 },
  Side: { x: -10, y: 90 },
  Rear: { x: -20, y: 180 },
  Top: { x: -80, y: 0 },
};

export default function Vehicle3DViewer({
  adImage,
  carImage,
  damageImages = [],
  vehicleMake,
  vehicleModel,
  isDark,
}) {
  const t = tk(isDark);
  const [rotation, setRotation] = useState(PRESETS.Front);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [currentView, setCurrentView] = useState("Front");
  const [activeImage, setActiveImage] = useState(adImage || carImage || "");
  const startPos = useRef({ x: 0, y: 0 });
  const startRot = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setActiveImage(adImage || carImage || "");
  }, [adImage, carImage]);

  const begin = (x, y) => {
    setIsDragging(true);
    startPos.current = { x, y };
    startRot.current = { ...rotation };
  };
  const move = (x, y) => {
    if (!isDragging) return;
    const dx = x - startPos.current.x;
    const dy = y - startPos.current.y;
    setRotation({
      x: Math.max(-90, Math.min(90, startRot.current.x - dy * 0.4)),
      y: startRot.current.y + dx * 0.4,
    });
    setCurrentView("Custom");
  };
  const end = () => setIsDragging(false);

  const setPreset = (view) => {
    setRotation(PRESETS[view]);
    setCurrentView(view);
  };
  const resetView = () => {
    setRotation(PRESETS.Front);
    setScale(1);
    setCurrentView("Front");
  };

  const chip = (on) =>
    `h-8 rounded-lg px-3 text-[12px] font-black uppercase tracking-wider transition ${
      on
        ? t.chipNavy
        : isDark
          ? "bg-white/5 text-slate-300 hover:bg-white/10"
          : "bg-[#F8FAFC] text-slate-500 hover:text-[#001F3F]"
    }`;

  return (
    <div className={`overflow-hidden rounded-2xl border-2 ${t.card}`}>
      <div
        className={`flex flex-wrap items-center gap-3 border-b-2 px-4 py-3 ${t.cardHead}`}
      >
        <Move size={14} className={t.heading} />
        <h3
          className={`flex-1 text-[14px] font-black uppercase tracking-tight ${t.heading}`}
        >
          3D view
        </h3>
        <span
          className={`rounded-lg border px-2 py-0.5 text-[12px] font-bold ${t.inner} ${t.heading}`}
        >
          {currentView}
        </span>
      </div>

      <div className="space-y-3 p-3 sm:p-4">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setPreset(v)}
              className={chip(currentView === v)}
            >
              {v}
            </button>
          ))}
          <div className="ml-auto flex shrink-0 gap-1.5">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() =>
                setScale((s) => Math.max(0.6, +(s - 0.1).toFixed(2)))
              }
              className={chip(false)}
            >
              <ZoomOut size={14} />
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() =>
                setScale((s) => Math.min(1.8, +(s + 0.1).toFixed(2)))
              }
              className={chip(false)}
            >
              <ZoomIn size={14} />
            </button>
            <button
              type="button"
              aria-label="Reset view"
              onClick={resetView}
              className={chip(false)}
            >
              <RotateCw size={14} />
            </button>
          </div>
        </div>

        <div
          className={`relative h-60 select-none overflow-hidden rounded-xl border-2 sm:h-80 ${t.inner} ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{ perspective: "1000px", touchAction: "none" }}
          onMouseDown={(e) => begin(e.clientX, e.clientY)}
          onMouseMove={(e) => move(e.clientX, e.clientY)}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={(e) =>
            e.touches.length === 1 &&
            begin(e.touches[0].clientX, e.touches[0].clientY)
          }
          onTouchMove={(e) =>
            e.touches.length === 1 &&
            move(e.touches[0].clientX, e.touches[0].clientY)
          }
          onTouchEnd={end}
        >
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${scale})`,
              transition: isDragging ? "none" : "transform 0.3s ease-out",
              transformStyle: "preserve-3d",
            }}
          >
            {activeImage ? (
              <img
                src={activeImage}
                alt="Vehicle"
                className="max-h-full max-w-full rounded-lg object-contain"
                draggable="false"
              />
            ) : (
              <VehicleImage
                className="h-full w-full rounded-lg"
                label={
                  [vehicleMake, vehicleModel].filter(Boolean).join(" ") ||
                  "No image"
                }
              />
            )}
          </div>
        </div>

        {Array.isArray(damageImages) && damageImages.length > 0 && (
          <div>
            <p
              className={`mb-2 text-[12px] font-bold uppercase tracking-wider ${t.muted}`}
            >
              Other photos
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[adImage || carImage, ...damageImages]
                .filter(Boolean)
                .map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      activeImage === img
                        ? isDark
                          ? "border-white"
                          : "border-[#001F3F]"
                        : `${t.line} opacity-70 hover:opacity-100`
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Photo ${idx + 1}`}
                      className="h-full w-full object-cover"
                      draggable="false"
                    />
                  </button>
                ))}
            </div>
          </div>
        )}

        <p className={`text-center text-[12px] ${t.muted}`}>
          Drag to rotate · use the buttons for quick views
        </p>
      </div>
    </div>
  );
}
