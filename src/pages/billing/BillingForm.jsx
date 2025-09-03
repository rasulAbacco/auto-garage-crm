import React, { useEffect, useState } from 'react'
import { upsertInvoice, listClients } from '../../lib/storage.js'
import { useLocation, useNavigate } from 'react-router-dom'

const empty = {
  id: '',
  date: '',
  customerId: '',
  description: '',
  partsCost: 0,
  laborCost: 0,
  taxes: 0,
  discounts: 0,
  total: 0,
  mode: 'Cash',
}

export default function BillingForm() {
  const [form, setForm] = useState(empty)
  const navigate = useNavigate()
  const location = useLocation()
  const clients = listClients()

  useEffect(() => {
    if (location.state) {
      const { serviceId, customerId, description, partsCost, laborCost } = location.state
      const id = serviceId ? `INV${serviceId}` : ''
      setForm(f => ({
        ...f,
        id,
        customerId: customerId || '',
        description: description || '',
        partsCost: partsCost || 0,
        laborCost: laborCost || 0,
      }))
    }
  }, [location.state])

  useEffect(() => {
    const total =
      Number(form.partsCost || 0) +
      Number(form.laborCost || 0) +
      Number(form.taxes || 0) -
      Number(form.discounts || 0)
    setForm(f => ({ ...f, total }))
  }, [form.partsCost, form.laborCost, form.taxes, form.discounts])

  const submit = (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      customerId: Number(form.customerId),
    }
    upsertInvoice(payload)
    navigate(`/billing/${payload.id}`)
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white/60 backdrop-blur border border-slate-200 rounded-2xl shadow-md p-6 space-y-6 max-w-5xl lg:ml-64 mx-auto"
    >
      <h1 className="text-2xl font-semibold text-slate-800">Create Invoice</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {[
          { label: 'Invoice No.', name: 'id', type: 'text', required: true },
          { label: 'Date', name: 'date', type: 'date', required: true },
          {
            label: 'Customer',
            name: 'customerId',
            type: 'select',
            options: clients.map(c => ({ value: c.id, label: `${c.fullName} (#${c.id})` })),
            required: true,
          },
          { label: 'Description', name: 'description', type: 'text' },
          { label: 'Parts Cost', name: 'partsCost', type: 'number' },
          { label: 'Labor Cost', name: 'laborCost', type: 'number' },
          { label: 'Taxes', name: 'taxes', type: 'number' },
          { label: 'Discounts', name: 'discounts', type: 'number' },
          {
            label: 'Payment Mode',
            name: 'mode',
            type: 'select',
            options: ['Cash', 'Card', 'UPI', 'Online'].map(m => ({ value: m, label: m })),
          },
          { label: 'Grand Total', name: 'total', type: 'text', readOnly: true },
        ].map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-slate-600 mb-1">{field.label}</label>
            {field.type === 'select' ? (
              <select
                className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-300"
                name={field.name}
                value={form[field.name]}
                onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                required={field.required}
              >
                <option value="">Select {field.label.toLowerCase()}</option>
                {field.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                name={field.name}
                readOnly={field.readOnly}
                className={`w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-300 ${field.readOnly ? 'bg-gray-100' : ''}`}
                value={form[field.name]}
                onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                required={field.required}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="bg-gray-200 hover:bg-gray-300 rounded-xl px-6 py-2 font-semibold transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2 font-semibold transition"
        >
          Save
        </button>
      </div>
    </form>
  )
}
