// client/src/components/Dashboard/CustomerOverviewChart.jsx
// Review analytics: average rating donut + star breakdown bars.
import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { FiStar } from "react-icons/fi";
import { getChartTheme, EmptyChart } from "./chartTheme";

const ReviewAnalyticsChart = ({ reviewStats = {}, isDark }) => {
  const c = useMemo(() => getChartTheme(isDark), [isDark]);
  const {
    averageRating = 0,
    totalReviews = 0,
    ratingDistribution = [],
  } = reviewStats || {};

  const starColor = {
    5: c.success,
    4: c.info,
    3: c.warning,
    2: "#FB923C",
    1: c.danger,
  };

  // always show 5 → 1 rows, even if a star has no reviews
  const rows = [5, 4, 3, 2, 1].map((star) => {
    const hit = ratingDistribution.find((r) => Number(r.reviewRating) === star);
    return {
      star,
      name: `${star}★`,
      value: hit?._count?.reviewRating ?? 0,
      color: starColor[star],
    };
  });
  const pieRows = rows.filter((r) => r.value > 0);

  if (!totalReviews) {
    return <EmptyChart text="No reviews yet" height={240} isDark={isDark} />;
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-[170px] w-[170px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieRows}
              dataKey="value"
              innerRadius="64%"
              outerRadius="92%"
              paddingAngle={3}
              stroke="none"
            >
              {pieRows.map((r) => (
                <Cell key={r.star} fill={r.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={c.tooltip} itemStyle={{ color: c.text }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`flex items-center gap-1 text-[16px] font-black ${isDark ? "text-white" : "text-[#001F3F]"}`}
          >
            {Number(averageRating).toFixed(1)}
            <FiStar className="fill-amber-400 text-amber-400" size={14} />
          </span>
          <span className="text-[12px] font-semibold text-slate-400">
            {totalReviews} reviews
          </span>
        </div>
      </div>

      <div className="w-full space-y-2">
        {rows.map((r) => {
          const pct = totalReviews
            ? Math.round((r.value / totalReviews) * 100)
            : 0;
          return (
            <div key={r.star} className="flex items-center gap-2">
              <span
                className={`w-7 text-[12px] font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}
              >
                {r.star}★
              </span>
              <div
                className={`h-2 flex-1 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: r.color }}
                />
              </div>
              <span className="w-12 text-right text-[12px] font-semibold text-slate-400">
                {r.value} · {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(ReviewAnalyticsChart);
