import React from 'react'

export default function StatCard({ title, value, sub }) {
  return (
    <div className="
      bg-white/60 backdrop-blur
      border border-slate-200
      rounded-2xl
      shadow-md
      p-5 transition hover:shadow-lg
    ">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-3xl font-semibold mt-1 text-slate-800">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}
