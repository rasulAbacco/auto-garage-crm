import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { getClient, listServices } from '../../lib/storage.js'
import { FiEdit } from 'react-icons/fi'

export default function ClientDetail() {
  const { id } = useParams()
  const c = getClient(id)
  const services = listServices().filter(s => String(s.customerId) === String(id))

  if (!c)
    return (
      <div className="text-center text-gray-500 mt-10 text-lg font-medium">Client not found</div>
    )

  return (
    <div className="space-y-6 lg:ml-64 p-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{c.fullName}</h1>
          <Link
            to={`/clients/${id}/edit`}
            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium transition"
          >
            <FiEdit />
            Edit
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mt-5 text-gray-700 text-sm">
          <div>
            <span className="font-semibold text-gray-500">Phone:</span> {c.phone}
          </div>
          <div>
            <span className="font-semibold text-gray-500">Email:</span> {c.email}
          </div>
          <div>
            <span className="font-semibold text-gray-500">Address:</span> {c.address}
          </div>
          <div>
            <span className="font-semibold text-gray-500">Vehicle:</span> {c.vehicleMake} {c.vehicleModel} ({c.vehicleYear})
          </div>
          <div>
            <span className="font-semibold text-gray-500">Registration Number:</span> {c.regNumber}
          </div>
          <div>
            <span className="font-semibold text-gray-500">VIN / Chassis No.:</span> {c.vin}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Service History</h2>
          <Link
            to="/services/new"
            state={{ customerId: c.id }}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition"
          >
            Add Service
          </Link>
        </div>

        {services.length > 0 ? (
          <ul className="mt-4 divide-y divide-gray-200">
            {services.map(s => (
              <li key={s.id} className="py-3 flex items-center justify-between text-gray-700 text-sm">
                <div>{s.date} — {s.type}</div>
                <Link to={`/services/${s.id}`} className="text-indigo-600 hover:text-indigo-700 font-medium">
                  View
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-gray-500 text-sm">No services yet.</p>
        )}
      </div>
    </div>
  )
}
