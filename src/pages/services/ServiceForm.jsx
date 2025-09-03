import React, { useEffect, useState } from 'react'
import { getService, upsertService, listClients } from '../../lib/storage.js'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

const empty = {
  customerId: '',
  date: '',
  type: '',
  partsCost: '',
  laborCost: '',
  status: 'Unpaid',
}

export default function ServiceForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState(empty)
  const clients = listClients()

  useEffect(() => {
    if (id) {
      const existing = getService(id)
      if (existing) setForm(existing)
    } else if (location.state?.customerId) {
      setForm(f => ({ ...f, customerId: location.state.customerId }))
    }
  }, [id, location.state])

  const submit = (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      customerId: Number(form.customerId),
      partsCost: Number(form.partsCost || 0),
      laborCost: Number(form.laborCost || 0),
      id: form.id,
    }
    const saved = upsertService(payload)
    navigate(`/services/${saved.id || form.id}`)
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white/60 backdrop-blur border border-slate-200 rounded-2xl shadow-md p-6 space-y-6 max-w-5xl lg:ml-64 mx-auto"
    >
      <h1 className="text-2xl font-semibold text-slate-800">
        {id ? 'Edit Service' : 'Add Service'}
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form fields */}
        {[
          {
            label: 'Customer',
            name: 'customerId',
            type: 'select',
            options: clients.map(c => ({
              value: c.id,
              label: `${c.fullName} (#${c.id})`,
            })),
            required: true,
          },
          { label: 'Date', name: 'date', type: 'date', required: true },
          { label: 'Service Type', name: 'type', type: 'text', required: true },
          { label: 'Parts Cost', name: 'partsCost', type: 'number' },
          { label: 'Labor Cost', name: 'laborCost', type: 'number' },
          {
            label: 'Status',
            name: 'status',
            type: 'select',
            options: ['Unpaid', 'Paid', 'In Progress'].map(s => ({ value: s, label: s })),
          },
        ].map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-slate-600 mb-1">{field.label}</label>
            {field.type === 'select' ? (
              <select
                className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 focus:ring-indigo-300"
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
                className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 focus:ring-indigo-300"
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
          className="bg-gray-200 hover:bg-gray-300 text-slate-800 rounded-xl px-6 py-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2"
        >
          Save
        </button>
      </div>
    </form>
  )
}
