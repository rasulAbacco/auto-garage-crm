// client/src/components/AppLoader.jsx
// Full-screen MotorDesk loader – a speedometer needle that revs while we check things.
// Usage: <AppLoader label="Checking your account" />
import React, { useEffect, useState } from "react";

const LOGO_SRC = "/Logos/transLogo.png";

const STEPS_DEFAULT = [
  "Starting engine",
  "Checking your account",
  "Loading your garage",
];

export default function AppLoader({
  label,
  steps = STEPS_DEFAULT,
  fullScreen = true,
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const [step, setStep] = useState(0);

  // rotate the status text every 1.4s (only when no fixed label is given)
  useEffect(() => {
    if (label) return undefined;
    const id = setInterval(() => setStep((s) => (s + 1) % steps.length), 1400);
    return () => clearInterval(id);
  }, [label, steps.length]);

  const text = label || steps[step];

  // gauge geometry (semi-circle, radius 70)
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const a = Math.PI + (i * Math.PI) / 10; // 180° → 360°
    const r1 = 70;
    const r2 = i % 5 === 0 ? 58 : 63;
    return {
      x1: 90 + r1 * Math.cos(a),
      y1: 90 + r1 * Math.sin(a),
      x2: 90 + r2 * Math.cos(a),
      y2: 90 + r2 * Math.sin(a),
      major: i % 5 === 0,
    };
  });

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={text}
      className={`${fullScreen ? "fixed inset-0 z-[200]" : "relative min-h-[320px] w-full rounded-2xl"} flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#001F3F] to-[#000814] text-white`}
    >
      <style>{`
        @keyframes md-rev { 0%{transform:rotate(-80deg)} 45%{transform:rotate(62deg)} 60%{transform:rotate(48deg)} 75%{transform:rotate(70deg)} 100%{transform:rotate(-80deg)} }
        @keyframes md-arc { 0%{stroke-dashoffset:220} 45%{stroke-dashoffset:40} 60%{stroke-dashoffset:58} 75%{stroke-dashoffset:30} 100%{stroke-dashoffset:220} }
        @keyframes md-road { from{transform:translateX(0)} to{transform:translateX(-48px)} }
        @keyframes md-fade { 0%{opacity:0;transform:translateY(4px)} 15%,85%{opacity:1;transform:none} 100%{opacity:0;transform:translateY(-4px)} }
        @media (prefers-reduced-motion: reduce){ .md-anim{animation:none!important} }
      `}</style>

      {/* background shapes */}
      <div className="pointer-events-none absolute -right-24 top-16 h-72 w-72 rotate-12 rounded-[48px] border-2 border-white/5" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rotate-45 rounded-[40px] border-2 border-white/5" />

      <div className="relative flex w-[260px] flex-col items-center">
        {/* logo */}
        <span className="mb-6 inline-flex h-12 items-center justify-center rounded-xl bg-white px-3 shadow-lg shadow-black/30">
          {logoFailed ? (
            <span className="text-[16px] font-black uppercase tracking-tight text-[#001F3F]">
              Motor<span className="font-light lowercase italic">desk</span>
            </span>
          ) : (
            <img
              src={LOGO_SRC}
              alt="MotorDesk"
              onError={() => setLogoFailed(true)}
              className="h-8 w-auto max-w-[150px] object-contain"
              draggable="false"
            />
          )}
        </span>

        {/* speedometer */}
        <svg viewBox="0 0 180 104" className="w-[220px]" aria-hidden="true">
          {/* track */}
          <path
            d="M20 90 A70 70 0 0 1 160 90"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* red zone */}
          <path
            d="M139.5 40.5 A70 70 0 0 1 160 90"
            fill="none"
            stroke="rgba(239,68,68,0.45)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* live arc */}
          <path
            className="md-anim"
            d="M20 90 A70 70 0 0 1 160 90"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="220"
            style={{
              animation: "md-arc 2.4s cubic-bezier(.45,.05,.35,1) infinite",
            }}
          />
          {ticks.map((tk, i) => (
            <line
              key={i}
              x1={tk.x1}
              y1={tk.y1}
              x2={tk.x2}
              y2={tk.y2}
              stroke={
                tk.major ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)"
              }
              strokeWidth={tk.major ? 2.5 : 1.5}
              strokeLinecap="round"
            />
          ))}
          {/* needle */}
          <g
            className="md-anim"
            style={{
              transformOrigin: "90px 90px",
              animation: "md-rev 2.4s cubic-bezier(.45,.05,.35,1) infinite",
            }}
          >
            <path d="M90 90 L87 88 L90 30 L93 88 Z" fill="#F59E0B" />
          </g>
          <rect x="82" y="82" width="16" height="16" rx="4" fill="#FFFFFF" />
          <rect x="86" y="86" width="8" height="8" rx="2" fill="#001F3F" />
        </svg>

        {/* road strip */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-md bg-white/10">
          <div
            className="md-anim h-full w-[calc(100%+48px)]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.85) 0 24px, transparent 24px 48px)",
              animation: "md-road 0.6s linear infinite",
            }}
          />
        </div>

        {/* status text */}
        <p
          key={text}
          className="md-anim mt-5 text-[14px] font-black uppercase tracking-[0.2em]"
          style={{ animation: label ? "none" : "md-fade 1.4s ease both" }}
        >
          {text}
        </p>
        <p className="mt-1 text-[12px] font-medium text-white/50">
          Garage management CRM
        </p>
      </div>
    </div>
  );
}
