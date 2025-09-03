import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { getInvoice, listClients } from '../../lib/storage.js'
import { currency } from '../../utils.js'

export default function Invoice() {
  const { id } = useParams()
  const inv = getInvoice(id)
  const clients = listClients()
  const c = clients.find(c => Number(c.id) === Number(inv?.customerId))

  if (!inv) {
    return (
      <div className="text-center text-gray-500 mt-10 text-lg font-medium">Invoice not found</div>
    )
  }

  return (
    <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-2xl shadow-md p-8 print:bg-white print:shadow-none print:border-none lg:ml-64 p-6 max-w-5xl mx-auto ">
      <div className="flex justify-end no-print mb-6">
        <button
          onClick={() => window.print()}
          className="bg-gray-900 text-white rounded-xl px-4 py-2 font-medium transition"
        >
          Print Invoice
        </button>
      </div>

      <div className="grid grid-cols-2 mb-8">
        <div>
          <div className="text-2xl font-semibold">Auto Garage</div>
          <div className="text-sm text-gray-500">Bengaluru, India</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-semibold">Invoice #{inv.id}</div>
          <div className="text-gray-500">{inv.date}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6 text-sm text-gray-700">
        <div>
          <div className="text-gray-500">Bill To</div>
          <div className="font-semibold">{c?.fullName}</div>
          <div>{c?.address}</div>
        </div>
        <div className="md:text-right">
          <div>
            <span className="text-gray-500">Payment Mode:</span> {inv.mode}
          </div>
        </div>
      </div>

      <table className="w-full text-sm mb-8">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-3">Description</th>
            <th className="text-right p-3">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="p-3">{inv.description}</td>
            <td className="p-3 text-right">
              {currency(Number(inv.partsCost) + Number(inv.laborCost))}
            </td>
          </tr>
          <tr className="border-b">
            <td className="p-3">Taxes</td>
            <td className="p-3 text-right">{currency(inv.taxes)}</td>
          </tr>
          <tr className="border-b">
            <td className="p-3">Discounts</td>
            <td className="p-3 text-right">-{currency(inv.discounts)}</td>
          </tr>
          <tr>
            <td className="p-3 font-semibold">Grand Total</td>
            <td className="p-3 text-right font-semibold">{currency(inv.total)}</td>
          </tr>
        </tbody>
      </table>

      <div className="text-center text-sm text-gray-500 mb-4">
        Thank you for your business!
      </div>
      <div className="no-print text-center">
        <Link to="/billing" className="text-indigo-600 hover:underline font-medium">
          Back to Billing
        </Link>
      </div>
    </div>
  )
}
