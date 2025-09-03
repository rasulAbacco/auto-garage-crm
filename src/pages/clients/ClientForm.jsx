import React, { useEffect, useState } from 'react'
import { getClient, upsertClient } from '../../lib/storage.js'
import { useNavigate, useParams } from 'react-router-dom'

const empty = {
  fullName: '',
  phone: '',
  email: '',
  address: '',
  vehicleMake: '',
  vehicleModel: '',
  vehicleYear: '',
  regNumber: '',
  vin: '',
}

export default function ClientForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)

  useEffect(() => {
    if (id) {
      const existing = getClient(id)
      if (existing) setForm(existing)
    }
  }, [id])

  const submit = (e) => {
    e.preventDefault()
    const saved = upsertClient({
      ...form,
      vehicleYear: Number(form.vehicleYear || 0),
      id: form.id,
    })
    navigate(`/clients/${saved.id || form.id}`)
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl shadow-soft p-6 space-y-6 max-w-5xl lg:ml-64 mx-auto">
      <h1 className="text-2xl font-semibold">{id ? 'Edit Client' : 'Add Client'}</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
          <input
            type="text"
            className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.fullName}
            onChange={e => setForm({ ...form, fullName: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
          <input
            type="text"
            className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
          <input
            type="email"
            className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
          <input
            type="text"
            className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Vehicle Make</label>
          <input
            type="text"
            className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.vehicleMake}
            onChange={e => setForm({ ...form, vehicleMake: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Vehicle Model</label>
          <input
            type="text"
            className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.vehicleModel}
            onChange={e => setForm({ ...form, vehicleModel: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Vehicle Year</label>
          <input
            type="number"
            min="1900"
            max={new Date().getFullYear()}
            className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.vehicleYear}
            onChange={e => setForm({ ...form, vehicleYear: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Registration Number</label>
          <input
            type="text"
            className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.regNumber}
            onChange={e => setForm({ ...form, regNumber: e.target.value })}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">VIN / Chassis No.</label>
          <input
            type="text"
            className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.vin}
            onChange={e => setForm({ ...form, vin: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2 font-semibold transition"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="bg-gray-200 hover:bg-gray-300 rounded-xl px-6 py-2 font-semibold transition"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
