// client/src/components/Table.jsx
import React from 'react'
import { useTheme } from '../contexts/ThemeContext'

export default function Table({ columns, data, actions }) {
  const { isDark } = useTheme()

  if (!data || data.length === 0) {
    return (
      <div className={`text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className={`w-20 h-20 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <div>
            <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>No data found</p>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Try adjusting your search or filters</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className={`${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'} border-b`}>
            {columns.map(col => (
              <th
                key={col.key}
                className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
              >
                {col.label}
              </th>
            ))}
            {actions && (
              <th className={`px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {data.map((row, idx) => (
            <tr
              key={row.id || idx}
              className={`transition-colors duration-150 ${
                isDark 
                  ? 'hover:bg-gray-700/30' 
                  : 'hover:bg-gray-50'
              }`}
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {actions && (
                <td className="px-6 py-4 text-right">
                  {actions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}