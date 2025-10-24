import React, { useMemo, useState, useEffect } from 'react'
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
  const [reminders, setReminders] = useState([])
  const [clients, setClients] = useState([])

  useEffect(() => {
    setReminders(listReminders())
    setClients(listClients())
  }, [])

  const nameById = useMemo(() => {
    return Object.fromEntries(clients.map(c => [String(c.id), c.fullName]))
  }, [clients])

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    return reminders.filter(r =>
      [nameById[String(r.customerId)] || '', r.nextService, r.insuranceRenewal, r.warrantyExpiry, r.notify].some(v =>
        String(v).toLowerCase().includes(term)
      )
    )
  }, [q, reminders, nameById])

  const submit = (e) => {
    e.preventDefault()
    const newReminder = { ...form, customerId: Number(form.customerId) }
    upsertReminder(newReminder)
    setReminders(prev => [...prev, newReminder])
    setForm({
      customerId: '',
      nextService: '',
      insuranceRenewal: '',
      warrantyExpiry: '',
      notify: 'SMS'
    })
  }

  // Function to send notifications via all channels
  const sendNotifications = (client, message) => {
    // In a real implementation, you would integrate with:
    // - SMS APIs (Twilio, Vonage, etc.)
    // - Email services (SendGrid, Mailgun, etc.)
    // - WhatsApp Business API
    
    // For now, we'll simulate by logging to console
    console.log(`SMS sent to ${client.fullName}: ${message}`)
    console.log(`Email sent to ${client.fullName}: ${message}`)
    console.log(`WhatsApp sent to ${client.fullName}: ${message}`)
    
    // In a real app, you would make API calls like:
    // fetch('/api/send-sms', { method: 'POST', body: JSON.stringify({ to: client.phone, message }) })
    // fetch('/api/send-email', { method: 'POST', body: JSON.stringify({ to: client.email, message }) })
    // fetch('/api/send-whatsapp', { method: 'POST', body: JSON.stringify({ to: client.phone, message }) })
  }

  // Function to mark service as done and set next reminder
  const markServiceDone = (reminder) => {
    const client = clients.find(c => c.id === reminder.customerId)
    if (!client) return
    
    // Send completion notification
    const completionMessage = `Your service has been completed. Thank you for your business!`
    sendNotifications(client, completionMessage)
    
    // Calculate next service date (6 months from current service date)
    const currentDate = new Date(reminder.nextService)
    const nextDate = new Date(currentDate)
    nextDate.setMonth(currentDate.getMonth() + 6)
    
    // Format as YYYY-MM-DD for input
    const nextServiceDate = nextDate.toISOString().split('T')[0]
    
    // Update reminder with new service date
    const updatedReminder = {
      ...reminder,
      nextService: nextServiceDate
    }
    
    upsertReminder(updatedReminder)
    setReminders(prev => prev.map(r => r.id === reminder.id ? updatedReminder : r))
    
    // Send next service notification
    const nextServiceMessage = `Your next service is scheduled for ${nextDate.toLocaleDateString()}. We look forward to seeing you then!`
    sendNotifications(client, nextServiceMessage)
  }

  const handleDelete = (id) => {
    deleteReminder(id)
    setReminders(prev => prev.filter(r => r.id !== id))
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
              onClick={() => markServiceDone(row)}
              className="text-green-600 hover:underline text-sm font-medium"
            >
              Mark Done
            </button>
            <button
              onClick={() => handleDelete(row.id)}
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