import React from 'react'

export default function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <input
      className="
        w-full md:w-72
        rounded-xl
        border border-slate-200
        bg-white/70 backdrop-blur
        px-4 py-2
        text-sm text-slate-700
        shadow-sm
        focus:outline-none focus:ring-2 focus:ring-indigo-300
        placeholder:text-slate-400
        transition
      "
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}
