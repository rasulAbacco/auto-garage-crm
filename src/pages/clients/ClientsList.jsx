import React, { useMemo, useState } from 'react'
import { listClients, deleteClient } from '../../lib/storage.js'
import Table from '../../components/Table.jsx'
import SearchBar from '../../components/SearchBar.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { FiEye, FiEdit, FiTrash2 } from 'react-icons/fi'

export default function ClientsList() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const data = listClients()

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    return data.filter(c =>
      [c.fullName, c.phone, c.email, c.regNumber].some(v => String(v).toLowerCase().includes(term))
    )
  }, [q, data])

  const columns = [
    { key: 'fullName', label: 'Full Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'vehicleMake', label: 'Make' },
    { key: 'vehicleModel', label: 'Model' },
    { key: 'regNumber', label: 'Reg No.' },
  ]

  return (
    <div className="space-y-6 lg:pl-64">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <SearchBar value={q} onChange={setQ} placeholder="Search by name, phone, email, reg no..." />
        <Link
          to="/clients/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2 font-semibold transition"
        >
          Add Client
        </Link>
      </div>

      <Table
        columns={columns}
        data={filtered}
        actions={(row) => (
          <div className="flex gap-3 text-gray-600">
            <button
              onClick={() => navigate(`/clients/${row.id}`)}
              aria-label="View Client"
              className="hover:text-indigo-600"
              title="View"
            >
              <FiEye size={18} />
            </button>
            <button
              onClick={() => navigate(`/clients/${row.id}/edit`)}
              aria-label="Edit Client"
              className="hover:text-indigo-600 text-[#3D3BF3]"
              title="Edit"
            >
              <FiEdit size={18} />
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this client?')) {
                  deleteClient(row.id)
                  navigate(0)
                }
              }}
              aria-label="Delete Client"
              className="hover:text-red-600 text-red-700"
              title="Delete"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        )}
      />
    </div>
  )
}
