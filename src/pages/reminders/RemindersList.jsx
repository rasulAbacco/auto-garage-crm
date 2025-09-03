import React, { useMemo, useState } from 'react'
import { listReminders, upsertReminder, deleteReminder, listClients } from '../../lib/storage.js'
import Table from '../../components/Table.jsx'
import SearchBar from '../../components/SearchBar.jsx'

export default function RemindersList() {
  const [q, setQ] = useState('')
  const [form, setForm] = useState({
    customerId: '',
    nextService: '',
    insuranceRenewal: '',
    warrantyExpiry: '',
    notify: 'SMS'
  })

  const data = listReminders()
  const clients = listClients()
  const nameById = Object.fromEntries(clients.map(c => [String(c.id), c.fullName]))

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    return data.filter(r =>
      [nameById[String(r.customerId)] || '', r.nextService, r.insuranceRenewal, r.warrantyExpiry, r.notify].some(v =>
        String(v).toLowerCase().includes(term)
      )
    )
  }, [q, data])

  const submit = (e) => {
    e.preventDefault()
    upsertReminder({ ...form, customerId: Number(form.customerId) })
    setForm({
      customerId: '',
      nextService: '',
      insuranceRenewal: '',
      warrantyExpiry: '',
      notify: 'SMS'
    })
    location.reload()
  }

  const columns = [
    { key: 'customerId', label: 'Customer', render: (v) => nameById[String(v)] || `#${v}` },
    { key: 'nextService', label: 'Next Service' },
    { key: 'insuranceRenewal', label: 'Insurance Renewal' },
    { key: 'warrantyExpiry', label: 'Warranty Expiry' },
    { key: 'notify', label: 'Notify Via' },
  ]

  return (
    <div className="space-y-8 lg:pl-64">
      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <SearchBar value={q} onChange={setQ} placeholder="Search reminders..." />
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={filtered}
        actions={(row) => (
          <div className="flex gap-2">
            <button
              onClick={() => {
                deleteReminder(row.id)
                location.reload()
              }}
              className="text-red-600 hover:underline text-sm font-medium"
            >
              Delete
            </button>
          </div>
        )}
      />

      {/* Form */}
      <form
        onSubmit={submit}
        className="bg-white/60 backdrop-blur border border-slate-200 rounded-2xl shadow-md p-6 space-y-6"
      >
        <div className="text-lg font-semibold text-slate-800">Add Reminder</div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Customer */}
          <div>
            <label className="block text-sm text-slate-600 mb-1">Customer</label>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-300"
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              required
            >
              <option value="">Select customer</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.fullName} (#{c.id})
                </option>
              ))}
            </select>
          </div>

          {/* Next Service */}
          <div>
            <label className="block text-sm text-slate-600 mb-1">Next Service</label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-300"
              value={form.nextService}
              onChange={(e) => setForm({ ...form, nextService: e.target.value })}
              required
            />
          </div>

          {/* Insurance Renewal */}
          <div>
            <label className="block text-sm text-slate-600 mb-1">Insurance Renewal</label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-300"
              value={form.insuranceRenewal}
              onChange={(e) => setForm({ ...form, insuranceRenewal: e.target.value })}
            />
          </div>

          {/* Warranty Expiry */}
          <div>
            <label className="block text-sm text-slate-600 mb-1">Warranty Expiry</label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-300"
              value={form.warrantyExpiry}
              onChange={(e) => setForm({ ...form, warrantyExpiry: e.target.value })}
            />
          </div>

          {/* Notification Type */}
          <div>
            <label className="block text-sm text-slate-600 mb-1">Notification Type</label>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-300"
              value={form.notify}
              onChange={(e) => setForm({ ...form, notify: e.target.value })}
            >
              <option>SMS</option>
              <option>Email</option>
              <option>WhatsApp</option>
            </select>
          </div>
        </div>

        {/* Save Button */}
        <div>
          <button
            type="submit"
            className="
              bg-indigo-600 hover:bg-indigo-700 text-white 
              rounded-xl px-5 py-2 font-medium 
              shadow-md transition-all duration-200
            "
          >
            Save Reminder
          </button>
        </div>
      </form>
    </div>
  )
}
