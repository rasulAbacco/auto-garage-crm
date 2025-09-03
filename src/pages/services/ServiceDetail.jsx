import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { getService, listClients } from '../../lib/storage.js'
import { currency } from '../../utils.js'

export default function ServiceDetail() {
  const { id } = useParams()
  const s = getService(id)
  const clients = listClients()
  const c = clients.find(c => Number(c.id) === Number(s?.customerId))

  if (!s) return <div className="text-gray-500">Service not found</div>

  return (
    <div className="space-y-6 max-w-5xl mx-auto lg:pl-64">
      <div className="bg-white/60 backdrop-blur border border-slate-200 rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800">{s.type} — #{s.id}</h2>
          <Link
            to={`/services/${id}/edit`}
            className="text-indigo-600 hover:underline text-sm font-medium"
          >
            Edit
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-700">
          <div><span className="text-gray-500">Date:</span> {s.date}</div>
          <div><span className="text-gray-500">Customer:</span> {c?.fullName} (#{c?.id})</div>
          <div><span className="text-gray-500">Parts:</span> {currency(s.partsCost)}</div>
          <div><span className="text-gray-500">Labor:</span> {currency(s.laborCost)}</div>
          <div><span className="text-gray-500">Status:</span> {s.status}</div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur border border-slate-200 rounded-2xl shadow-md p-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-medium text-slate-800">Billing</div>
          <Link
            to="/billing/new"
            state={{
              serviceId: s.id,
              customerId: s.customerId,
              description: s.type,
              partsCost: s.partsCost,
              laborCost: s.laborCost
            }}
            className="text-sm text-indigo-600 hover:underline"
          >
            Create Invoice
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Create or link an invoice for this service.
        </p>
      </div>
    </div>
  )
}
