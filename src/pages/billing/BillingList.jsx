import React, { useState, useMemo } from 'react'
import { listBilling, deleteInvoice, listClients } from '../../lib/storage.js'
import Table from '../../components/Table.jsx'
import SearchBar from '../../components/SearchBar.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { FiEye, FiTrash2 } from 'react-icons/fi'

export default function BillingList() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const data = listBilling()
  const clients = listClients()
  const nameById = Object.fromEntries(clients.map(c => [String(c.id), c.fullName]))

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    return data.filter(b =>
      [b.id, b.description, b.date, nameById[String(b.customerId)] || '']
        .some(v => String(v).toLowerCase().includes(term))
    )
  }, [q, data])

  const columns = [
    { key: 'id', label: 'Invoice No.' },
    { key: 'date', label: 'Date' },
    { key: 'customerId', label: 'Customer', render: v => nameById[String(v)] || `#${v}` },
    { key: 'description', label: 'Description' },
    { key: 'total', label: 'Total' },
    { key: 'mode', label: 'Payment Mode' },
  ]

  return (
    <div className="space-y-6 lg:pl-64">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Search by invoice no, customer, description..."
        />
        <Link
          to="/billing/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2 font-semibold transition"
        >
          Create Invoice
        </Link>
      </div>

      <Table
        columns={columns}
        data={filtered}
        actions={(row) => (
          <div className="flex gap-3 text-gray-600">
            <button
              onClick={() => navigate(`/billing/${row.id}`)}
              title="View Invoice"
              className="hover:text-indigo-600"
            >
              <FiEye size={18} />
            </button>
            <button
              onClick={() => {
                if (window.confirm('Delete this invoice?')) {
                  deleteInvoice(row.id)
                  navigate(0)
                }
              }}
              title="Delete Invoice"
              className="hover:text-red-600 text-red-700"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        )}
      />
    </div>
  )
}
