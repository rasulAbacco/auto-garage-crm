// client/src/pages/clients/components/ImageUploader.jsx
import React, { useRef, useState } from "react";
import { FiUpload, FiTrash2, FiCamera, FiImage, FiPlus } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { SectionCard, tk, btnBase } from "./clientUi";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function ImageUploader({
  form,
  setForm,
  isDark = false,
  setIsImageUploaded = () => {},
}) {
  const t = tk(isDark);
  const mainFileRef = useRef(null);
  const mainCameraRef = useRef(null);
  const damageFileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files, type = "damage") => {
    try {
      if (!files || !files.length) return;

      if (type === "main") {
        const file = files[0];
        if (!file) return;
        if (file.size > MAX_SIZE) {
          toast.error("Main image is too large (max 5MB)");
          return;
        }
        const dataUrl = await toDataUrl(file);
        setForm((prev) => ({ ...prev, carImage: dataUrl, adImage: dataUrl }));
        setIsImageUploaded?.(true);
      } else {
        const newImgs = [];
        let skipped = 0;
        for (const file of files) {
          if (!file) continue;
          if (file.size > MAX_SIZE) {
            skipped += 1;
            continue;
          }
          newImgs.push(await toDataUrl(file));
        }
        if (skipped) toast.error(`${skipped} photo(s) skipped – over 5MB`);
        setForm((prev) => ({
          ...prev,
          damageImages: [...(prev.damageImages || []), ...newImgs],
        }));
      }
    } catch (err) {
      console.error("handleFiles error:", err);
      toast.error("Couldn't read the selected images. Try again.");
    }
  };

  const removeMain = () => {
    setForm((prev) => ({ ...prev, carImage: "", adImage: "" }));
    setIsImageUploaded?.(false);
  };

  const removeDamage = (index) =>
    setForm((prev) => {
      const arr = [...(prev.damageImages || [])];
      arr.splice(index, 1);
      return { ...prev, damageImages: arr };
    });

  const damage = form.damageImages || [];

  return (
    <SectionCard
      isDark={isDark}
      icon={FiImage}
      step="04"
      title="Vehicle photos"
      subtitle="Main photo and damage / extra photos"
    >
      {/* hidden inputs */}
      <input
        ref={mainFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files, "main");
          e.target.value = "";
        }}
      />
      <input
        ref={mainCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files, "main");
          e.target.value = "";
        }}
      />
      <input
        ref={damageFileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files, "damage");
          e.target.value = "";
        }}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* main photo */}
        <div className="lg:col-span-3">
          <p
            className={`mb-2 text-[12px] font-bold uppercase tracking-wider ${t.muted}`}
          >
            Main photo
          </p>
          <div
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files, "main");
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition ${
              dragOver
                ? isDark
                  ? "border-white bg-white/10"
                  : "border-[#001F3F] bg-[#001F3F]/5"
                : t.inner
            }`}
          >
            {form.carImage ? (
              <div className="group relative">
                <img
                  src={form.carImage}
                  alt="Main vehicle"
                  className="h-52 w-full object-contain sm:h-64"
                  draggable="false"
                />
                <div className="absolute right-2 top-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => mainFileRef.current?.click()}
                    className={`${btnBase} h-8 px-3 ${t.btnPrimary} shadow-lg`}
                  >
                    <FiUpload size={12} /> Change
                  </button>
                  <button
                    type="button"
                    onClick={removeMain}
                    aria-label="Remove main photo"
                    className={`${btnBase} h-8 w-8 bg-red-600 text-white shadow-lg hover:bg-red-700`}
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <div
                  className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${t.chipNavy}`}
                >
                  <FiImage size={18} />
                </div>
                <p className={`text-[14px] font-bold ${t.heading}`}>
                  Drop the main photo here
                </p>
                <p className={`mb-4 text-[12px] ${t.muted}`}>
                  JPG or PNG · max 5MB
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => mainFileRef.current?.click()}
                    className={`${btnBase} h-9 px-4 ${t.btnPrimary}`}
                  >
                    <FiUpload size={12} /> Choose file
                  </button>
                  <button
                    type="button"
                    onClick={() => mainCameraRef.current?.click()}
                    className={`${btnBase} h-9 border-2 px-4 ${t.btnGhost}`}
                  >
                    <FiCamera size={12} /> Camera
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* damage photos */}
        <div className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <p
              className={`text-[12px] font-bold uppercase tracking-wider ${t.muted}`}
            >
              Damage / extra{" "}
              <span className="normal-case tracking-normal">
                ({damage.length})
              </span>
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {damage.map((img, i) => (
              <div
                key={i}
                className={`group relative aspect-square overflow-hidden rounded-xl border-2 ${t.inner}`}
              >
                <img
                  src={img}
                  alt={`Damage ${i + 1}`}
                  className="h-full w-full object-cover"
                  draggable="false"
                />
                <button
                  type="button"
                  onClick={() => removeDamage(i)}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-lg bg-red-600 text-white shadow-lg transition hover:bg-red-700"
                >
                  <FiTrash2 size={12} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => damageFileRef.current?.click()}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-[12px] font-bold transition ${t.inner} ${
                isDark
                  ? "text-slate-300 hover:border-white/40"
                  : "text-[#001F3F] hover:border-[#001F3F]"
              }`}
            >
              <FiPlus size={16} />
              Add
            </button>
          </div>
          {damage.length === 0 && (
            <p className={`mt-2 text-[12px] ${t.muted}`}>
              Add photos of scratches, dents or anything noted at check-in.
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
