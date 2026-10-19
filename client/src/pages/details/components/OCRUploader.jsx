// client/src/pages/details/components/OCRUploader.jsx
import React, { useRef, useState } from "react";
import { FiUpload, FiCamera, FiX, FiImage, FiRefreshCw } from "react-icons/fi";
import CameraComponent from "./CameraComponent";
import { tk, btnBase } from "../../clients/components/clientUi";

const OCRUploader = ({
  isDark,
  onImageSelect,
  onImageCaptured,
  selectedImage,
  onReset,
  busy,
}) => {
  const t = tk(isDark);
  const fileInputRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const readFile = (file) => {
    if (!file || !file.type?.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      onImageSelect(event.target.result);
      onImageCaptured(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const input = (
    <input
      type="file"
      ref={fileInputRef}
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        readFile(e.target.files?.[0]);
        e.target.value = ""; // allow picking the same file again
      }}
    />
  );

  if (selectedImage) {
    return (
      <div className="space-y-3">
        {input}
        <div
          className={`relative overflow-hidden rounded-2xl border-2 ${t.inner}`}
        >
          <img
            src={selectedImage}
            alt="RC preview"
            className="h-64 w-full object-contain sm:h-80"
            draggable="false"
          />
          {busy && (
            <div className="absolute inset-0 animate-pulse bg-[#001F3F]/10" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
            className={`${btnBase} h-10 border-2 ${t.btnGhost}`}
          >
            <FiRefreshCw size={14} /> Another photo
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onReset}
            className={`${btnBase} h-10 border-2 border-red-500/30 text-red-500 hover:bg-red-500/10`}
          >
            <FiX size={14} /> Remove
          </button>
        </div>
      </div>
    );
  }

  if (cameraOpen) {
    return (
      <CameraComponent
        onCapture={(img) => {
          setCameraOpen(false);
          onImageSelect(img);
          onImageCaptured(img);
        }}
        onStop={() => setCameraOpen(false)}
      />
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        readFile(e.dataTransfer.files?.[0]);
      }}
      className={`rounded-2xl border-2 border-dashed px-4 py-10 text-center transition ${
        dragOver
          ? isDark
            ? "border-white bg-white/10"
            : "border-[#001F3F] bg-[#001F3F]/5"
          : t.inner
      }`}
    >
      {input}
      <div
        className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${t.chipNavy}`}
      >
        <FiImage size={22} />
      </div>
      <p
        className={`text-[16px] font-black uppercase tracking-tight ${t.heading}`}
      >
        Scan an <span className="font-light lowercase italic">RC.</span>
      </p>
      <p className={`mt-1 text-[14px] ${t.muted}`}>
        Take a photo or upload a clear picture of the RC (JPG / PNG).
      </p>
      <p className={`mt-0.5 hidden text-[12px] sm:block ${t.muted}`}>
        You can also drag & drop the image here.
      </p>
      <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setCameraOpen(true)}
          className={`${btnBase} h-11 ${t.btnPrimary} shadow-lg`}
        >
          <FiCamera size={14} /> Camera
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`${btnBase} h-11 border-2 ${t.btnGhost}`}
        >
          <FiUpload size={14} /> Upload
        </button>
      </div>
    </div>
  );
};

export default OCRUploader;
