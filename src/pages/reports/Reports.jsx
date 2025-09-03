import React from 'react'
import { listServices, listBilling } from '../../lib/storage.js'
import { currency, sum } from '../../utils.js'

export default function Reports() {
  const services = listServices()
  const billing = listBilling()

  const paidServices = services.filter(s => s.status === 'Paid')
  const unpaidServices = services.filter(s => s.status !== 'Paid')
  const revenue = sum(billing, 'total')

  const monthKey = (d) => {
    const dt = new Date(d)
    if (isNaN(dt)) return 'Unknown'
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0')
  }

  const revenueByMonth = billing.reduce((acc, b) => {
    const k = monthKey(b.date)
    acc[k] = (acc[k] || 0) + Number(b.total || 0)
    return acc
  }, {})

  const rows = Object.entries(revenueByMonth).sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <div className="space-y-8 lg:pl-64">

      {/* Stat Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="
          bg-white/60 backdrop-blur border border-slate-200 
          rounded-2xl shadow-md p-5 transition hover:shadow-lg
        ">
          <div className="text-sm text-slate-500">Paid Services</div>
          <div className="text-3xl font-semibold mt-1 text-slate-800">{paidServices.length}</div>
        </div>

        <div className="
          bg-white/60 backdrop-blur border border-slate-200 
          rounded-2xl shadow-md p-5 transition hover:shadow-lg
        ">
          <div className="text-sm text-slate-500">Unpaid / In Progress</div>
          <div className="text-3xl font-semibold mt-1 text-slate-800">{unpaidServices.length}</div>
        </div>

        <div className="
          bg-white/60 backdrop-blur border border-slate-200 
          rounded-2xl shadow-md p-5 transition hover:shadow-lg
        ">
          <div className="text-sm text-slate-500">Total Revenue</div>
          <div className="text-3xl font-semibold mt-1 text-slate-800">{currency(revenue)}</div>
        </div>
      </div>

      {/* Revenue Table */}
      <div className="
        bg-white/60 backdrop-blur border border-slate-200 
        rounded-2xl shadow-md p-5 transition hover:shadow-lg
      ">
        <div className="font-semibold text-slate-800 mb-4 text-lg">Revenue by Month</div>

        <div className="overflow-x-auto">
          <table className="w-full text-[15px] text-slate-700">
            <thead>
              <tr className="bg-gray-50 text-slate-600 border-b">
                <th className="text-left p-3">Month</th>
                <th className="text-right p-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([month, val]) => (
                <tr key={month} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3">{month}</td>
                  <td className="p-3 text-right">{currency(val)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={2}>No data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
