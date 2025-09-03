import React, { useMemo, useState } from 'react'
import { listServices, deleteService, listClients } from '../../lib/storage.js'
import Table from '../../components/Table.jsx'
import SearchBar from '../../components/SearchBar.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { FiEye, FiEdit, FiTrash2 } from 'react-icons/fi'

export default function ServicesList() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const data = listServices()
  const clients = listClients()
  const nameById = Object.fromEntries(clients.map(c => [String(c.id), c.fullName]))

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    return data.filter(s =>
      [s.type, s.status, s.date, nameById[String(s.customerId)] || '']
        .some(v => String(v).toLowerCase().includes(term))
    )
  }, [q, data])

  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'customerId', label: 'Customer', render: v => nameById[String(v)] || `#${v}` },
    { key: 'type', label: 'Service Type' },
    { key: 'partsCost', label: 'Parts' },
    { key: 'laborCost', label: 'Labor' },
    { key: 'status', label: 'Status' },
  ]

  return (
    <div className="space-y-6 lg:pl-64">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Search by type, customer, status..."
        />
        <Link
          to="/services/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2 font-semibold transition"
        >
          Add Service
        </Link>
      </div>

      <Table
        columns={columns}
        data={filtered}
        actions={(row) => (
          <div className="flex gap-3 text-gray-600">
            <button
              onClick={() => navigate(`/services/${row.id}`)}
              title="View Service"
              className="hover:text-indigo-600"
            >
              <FiEye size={18} />
            </button>
            <button
              onClick={() => navigate(`/services/${row.id}/edit`)}
              title="Edit Service"
              className="hover:text-[#4f47e6] text-[#3D3BF3]"
            >
              <FiEdit size={18} />
            </button>
            <button
              onClick={() => {
                if (window.confirm('Delete this service?')) {
                  deleteService(row.id)
                  navigate(0)
                }
              }}
              title="Delete Service"
              className="hover:text-red-600 text-rose-700"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        )}
      />
    </div>
  )
}
