// client/src/pages/details/components/CameraComponent.jsx
import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  FiCamera,
  FiX,
  FiRefreshCw,
  FiZap,
  FiAlertCircle,
  FiLoader,
} from "react-icons/fi";
import { useTheme } from "../../../contexts/ThemeContext";
import { tk, btnBase } from "../../clients/components/clientUi";

const CameraComponent = ({ onCapture, onStop }) => {
  const { isDark } = useTheme();
  const t = tk(isDark);
  const videoRef = useRef(null);
  const streamRef = useRef(null); // ref (not state) so cleanup always sees the live stream
  const [ready, setReady] = useState(false);
  const [starting, setStarting] = useState(true);
  const [error, setError] = useState("");
  const [facingMode, setFacingMode] = useState("environment");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setReady(false);
    setTorchOn(false);
  }, []);

  const startCamera = useCallback(
    async (mode) => {
      stopCamera();
      setStarting(true);
      setError("");
      try {
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error("Camera isn't available in this browser.");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        const track = stream.getVideoTracks()[0];
        setTorchSupported(Boolean(track?.getCapabilities?.().torch));
        setReady(true);
      } catch (err) {
        console.error("Camera start error:", err);
        setError(
          err?.name === "NotAllowedError"
            ? "Camera permission was denied. Allow camera access in your browser settings."
            : err?.message || "Couldn't open the camera.",
        );
      } finally {
        setStarting(false);
      }
    },
    [stopCamera],
  );

  useEffect(() => {
    startCamera(facingMode);
    return () => stopCamera(); // turns the camera light off when leaving
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const captureImage = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d").drawImage(v, 0, 0, canvas.width, canvas.height);
    const img = canvas.toDataURL("image/jpeg", 0.9);
    stopCamera();
    onCapture(img);
  };

  const switchCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  };

  const toggleTorch = async () => {
    try {
      const track = streamRef.current?.getVideoTracks()[0];
      if (!track) return;
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn((v) => !v);
    } catch (err) {
      console.warn("Torch toggle failed:", err);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3">
      <div className="relative overflow-hidden rounded-2xl bg-[#000814]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="aspect-[4/3] w-full object-cover sm:aspect-video"
        />

        {/* guide frame */}
        {ready && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
            <div className="relative h-full w-full rounded-xl border-2 border-dashed border-white/70">
              {[
                "left-0 top-0 border-l-4 border-t-4",
                "right-0 top-0 border-r-4 border-t-4",
                "bottom-0 left-0 border-b-4 border-l-4",
                "bottom-0 right-0 border-b-4 border-r-4",
              ].map((c) => (
                <span
                  key={c}
                  className={`absolute h-6 w-6 rounded-sm border-white ${c}`}
                />
              ))}
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg bg-[#000814]/70 px-3 py-1 text-[12px] font-bold text-white backdrop-blur">
                Fit the whole RC inside the frame
              </span>
            </div>
          </div>
        )}

        {(starting || error) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-white">
            {starting ? (
              <>
                <FiLoader className="animate-spin" size={20} />
                <p className="text-[14px] font-semibold">Opening camera…</p>
              </>
            ) : (
              <>
                <FiAlertCircle size={20} className="text-red-400" />
                <p className="text-[14px] font-semibold">{error}</p>
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className={`${btnBase} mt-1 h-9 bg-white px-4 text-[#001F3F]`}
                >
                  Try again
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={captureImage}
          disabled={!ready}
          className={`${btnBase} col-span-4 h-12 sm:col-span-1 sm:order-2 sm:h-11 ${t.btnPrimary} shadow-xl`}
        >
          <FiCamera size={16} /> Capture
        </button>
        <button
          type="button"
          onClick={switchCamera}
          className={`${btnBase} col-span-2 h-10 border-2 sm:col-span-1 sm:order-1 sm:h-11 ${t.btnGhost}`}
        >
          <FiRefreshCw size={14} /> Flip
        </button>
        <button
          type="button"
          onClick={toggleTorch}
          disabled={!torchSupported}
          title={
            torchSupported
              ? "Flashlight"
              : "Flashlight not supported on this device"
          }
          className={`${btnBase} col-span-1 h-10 border-2 sm:order-3 sm:h-11 ${
            torchOn ? "border-transparent bg-amber-500 text-white" : t.btnGhost
          }`}
        >
          <FiZap size={14} />{" "}
          <span className="hidden sm:inline">{torchOn ? "On" : "Torch"}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            stopCamera();
            onStop?.();
          }}
          className={`${btnBase} col-span-1 h-10 border-2 border-red-500/30 text-red-500 hover:bg-red-500/10 sm:order-4 sm:h-11`}
        >
          <FiX size={14} /> <span className="hidden sm:inline">Close</span>
        </button>
      </div>
    </div>
  );
};

export default CameraComponent;
