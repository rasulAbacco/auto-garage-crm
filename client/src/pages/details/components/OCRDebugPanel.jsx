// client/src/pages/details/components/OCRDebugPanel.jsx
import React, { useState } from "react";
import { FiActivity, FiChevronDown } from "react-icons/fi";
import { tk } from "../../clients/components/clientUi";

const OCRDebugPanel = ({ isDark, debugInfo }) => {
  const t = tk(isDark);
  const [show, setShow] = useState(true);

  if (!debugInfo || Object.keys(debugInfo).length === 0) {
    return (
      <p className={`text-[12px] ${t.muted}`}>
        Scan quality appears here after a scan.
      </p>
    );
  }

  const conf = Number(debugInfo.confidence) || 0;
  const tone =
    conf >= 80
      ? { bar: "bg-green-500", text: "text-green-600" }
      : conf >= 60
        ? { bar: "bg-amber-500", text: "text-amber-600" }
        : { bar: "bg-red-500", text: "text-red-500" };
  const tips =
    debugInfo.suggestions?.length > 0
      ? debugInfo.suggestions
      : conf < 60
        ? [
            "Use good light and avoid glare",
            "Hold the camera straight above the RC",
            "Fill the frame with the card",
          ]
        : [];

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="flex w-full items-center justify-between"
      >
        <span
          className={`flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.15em] ${t.heading}`}
        >
          <FiActivity size={12} /> Scan quality
        </span>
        <FiChevronDown
          size={14}
          className={`text-slate-400 transition-transform ${show ? "rotate-180" : ""}`}
        />
      </button>

      {show && (
        <>
          <div>
            <div className="mb-1 flex items-end justify-between">
              <span className={`text-[16px] font-black ${tone.text}`}>
                {conf}%
              </span>
              <span className={`text-[12px] font-bold ${tone.text}`}>
                {debugInfo.quality || "—"} confidence
              </span>
            </div>
            <div
              className={`h-2 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}
            >
              <div
                className={`h-full rounded-full ${tone.bar} transition-all duration-500`}
                style={{ width: `${Math.min(100, conf)}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className={`rounded-xl border-2 p-2.5 ${t.inner}`}>
              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                Fields found
              </p>
              <p className={`text-[14px] font-black ${t.heading}`}>
                {debugInfo.extractedFields ?? 0}
              </p>
            </div>
            <div className={`rounded-xl border-2 p-2.5 ${t.inner}`}>
              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
                Text length
              </p>
              <p className={`text-[14px] font-black ${t.heading}`}>
                {debugInfo.textLength ?? "—"}
              </p>
            </div>
          </div>
          {tips.length > 0 && (
            <div className="rounded-xl border-2 border-amber-500/30 bg-amber-500/5 p-3">
              <p className="mb-1 text-[12px] font-black uppercase tracking-wider text-amber-600">
                Tips for a better scan
              </p>
              <ul
                className={`list-disc space-y-0.5 pl-4 text-[12px] ${t.body}`}
              >
                {tips.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OCRDebugPanel;
