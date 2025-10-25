import React from 'react'

export default function Table({ columns, data, actions }) {
  return (
    <div className="overflow-x-auto bg-white/60 backdrop-blur border border-slate-200 rounded-2xl shadow-md">
      <table className="min-w-full text-[15px] text-slate-700">
        <thead>
          <tr className="bg-gray-50 text-slate-600">
            {columns.map(col => (
              <th
                key={col.key}
                className="text-left font-medium px-5 py-4 whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
            {actions && <th className="px-5 py-4 whitespace-nowrap">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row.id || idx}
              className="border-t hover:bg-gray-50 transition"
            >
              {columns.map(col => (
                <td key={col.key} className="px-5 py-4 whitespace-nowrap">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {actions && (
                <td className="px-5 py-4 whitespace-nowrap">
                  {actions(row)}
                </td>
              )}
            </tr>
          ))}

          {data.length === 0 && (
            <tr>
              <td
                className="px-4 py-8 text-center text-gray-500"
                colSpan={(columns?.length || 0) + (actions ? 1 : 0)}
              >
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
