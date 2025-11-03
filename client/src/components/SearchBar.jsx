// client/src/components/SearchBar.jsx
import React from 'react'
import { FiSearch } from 'react-icons/fi'
import { useTheme } from '../contexts/ThemeContext'

export default function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  const { isDark } = useTheme()

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <FiSearch className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full pl-12 pr-4 py-3 rounded-xl font-medium
          transition-all duration-200
          ${isDark 
            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600 focus:border-blue-500' 
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:border-blue-500'
          }
          border-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20
        `}
      />
    </div>
  )
}