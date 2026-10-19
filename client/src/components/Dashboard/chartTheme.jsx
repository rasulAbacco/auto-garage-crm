// client/src/components/Dashboard/chartTheme.jsx
import React, { useEffect, useState } from "react";
// Shared colours + text sizes for every dashboard chart (MotorDesk navy theme).

export const getChartTheme = (isDark) => ({
  // series colours
  primary: isDark ? "#93C5FD" : "#001F3F", // navy in light, soft blue in dark
  primarySoft: isDark ? "rgba(147,197,253,0.25)" : "rgba(0,31,63,0.18)",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: isDark ? "#60A5FA" : "#2563EB",
  violet: "#818CF8",
  muted: isDark ? "#64748B" : "#94A3B8",

  // chrome
  grid: isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0",
  axis: isDark ? "#94A3B8" : "#64748B",
  text: isDark ? "#FFFFFF" : "#001F3F",
  cursor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,31,63,0.05)",
  tooltip: {
    backgroundColor: isDark ? "#000814" : "#FFFFFF",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#CBD5E1"}`,
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0,8,20,0.18)",
    fontSize: 12,
    padding: "8px 12px",
    color: isDark ? "#FFFFFF" : "#001F3F",
  },
  tooltipLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: isDark ? "#FFFFFF" : "#001F3F",
    marginBottom: 4,
  },
  legend: { fontSize: 12, paddingTop: 8 },
  tick: { fontSize: 12 },
});

export const EmptyChart = ({ text, height = 240, isDark }) => (
  <div
    className={`flex items-center justify-center rounded-xl border-2 border-dashed text-[12px] font-semibold ${
      isDark
        ? "border-white/10 text-slate-500"
        : "border-[#CBD5E1] text-slate-400"
    }`}
    style={{ height }}
  >
    {text}
  </div>
);

// true when the screen is phone-sized (used to slim axes/bars on small screens)
export const useNarrow = (max = 640) => {
  const get = () => typeof window !== "undefined" && window.innerWidth < max;
  const [narrow, setNarrow] = useState(get);
  useEffect(() => {
    const onResize = () => setNarrow(get());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [max]);
  return narrow;
};

// short rupee format for axis ticks: 950 → ₹950, 12500 → ₹12.5k, 250000 → ₹2.5L
export const shortRupee = (v) => {
  const n = Number(v) || 0;
  if (Math.abs(n) >= 100000) return `₹${+(n / 100000).toFixed(1)}L`;
  if (Math.abs(n) >= 1000) return `₹${+(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
};
