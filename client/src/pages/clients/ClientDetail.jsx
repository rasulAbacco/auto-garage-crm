import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { getClient, listServices } from '../../lib/storage.js'
import { FiEdit } from 'react-icons/fi'

const CarLogo = ({ make, className = "w-8 h-8 inline-block mr-2 align-middle" }) => {
  const makeLower = make?.toLowerCase().trim() || '';
  
  const carLogos = {
    toyota: (
      <svg viewBox="0 0 100 100" className={className}>
        <ellipse cx="50" cy="50" rx="45" ry="45" fill="#EB0A1E" />
        <ellipse cx="50" cy="50" rx="35" ry="35" fill="white" />
        <ellipse cx="50" cy="50" rx="25" ry="25" fill="#EB0A1E" />
      </svg>
    ),
    honda: (
      <svg viewBox="0 0 100 100" className={className}>
        <rect x="10" y="10" width="80" height="80" rx="10" fill="#C41E3A" />
        <path d="M50 25 L75 50 L50 75 L25 50 Z" fill="white" />
        <rect x="40" y="40" width="20" height="20" fill="#C41E3A" />
      </svg>
    ),
    ford: (
      <svg viewBox="0 0 100 100" className={className}>
        <ellipse cx="50" cy="50" rx="45" ry="45" fill="#003478" />
        <path d="M20 50 Q50 20 80 50 Q50 80 20 50" fill="white" />
        <path d="M30 50 Q50 35 70 50 Q50 65 30 50" fill="#003478" />
      </svg>
    ),
    bmw: (
      <svg viewBox="0 0 100 100" className={className}>
        <circle cx="50" cy="50" r="45" fill="#0066B1" />
        <circle cx="50" cy="50" r="35" fill="white" />
        <path d="M50 15 A35 35 0 0 1 85 50 L50 50 Z" fill="#0066B1" />
        <path d="M50 85 A35 35 0 0 1 15 50 L50 50 Z" fill="#0066B1" />
      </svg>
    ),
    mercedes: (
      <svg viewBox="0 0 100 100" className={className}>
        <circle cx="50" cy="50" r="45" fill="#333333" />
        <path d="M50 20 L65 65 L35 65 Z" fill="white" />
        <circle cx="50" cy="50" r="10" fill="#333333" />
      </svg>
    ),
    audi: (
      <svg viewBox="0 0 100 100" className={className}>
        <circle cx="25" cy="50" r="20" fill="#BB0A30" />
        <circle cx="40" cy="50" r="20" fill="#BB0A30" />
        <circle cx="60" cy="50" r="20" fill="#BB0A30" />
        <circle cx="75" cy="50" r="20" fill="#BB0A30" />
      </svg>
    ),
    volkswagen: (
      <svg viewBox="0 0 100 100" className={className}>
        <circle cx="50" cy="50" r="45" fill="#001E50" />
        <path d="M30 35 Q50 20 70 35 L70 65 Q50 80 30 65 Z" fill="white" />
        <path d="M35 45 Q50 35 65 45 L65 55 Q50 65 35 55 Z" fill="#001E50" />
      </svg>
    ),
    tesla: (
      <svg viewBox="0 0 100 100" className={className}>
        <rect x="10" y="10" width="80" height="80" rx="10" fill="#E82127" />
        <path d="M50 25 L70 50 L50 75 L30 50 Z" fill="white" />
        <path d="M50 35 L60 50 L50 65 L40 50 Z" fill="#E82127" />
      </svg>
    ),
    nissan: (
      <svg viewBox="0 0 100 100" className={className}>
        <rect x="10" y="10" width="80" height="80" rx="10" fill="#C3002F" />
        <circle cx="50" cy="50" r="30" fill="white" />
        <path d="M35 50 L65 50 M50 35 L50 65" stroke="#C3002F" strokeWidth="8" />
      </svg>
    ),
    hyundai: (
      <svg viewBox="0 0 100 100" className={className}>
        <ellipse cx="50" cy="50" rx="45" ry="45" fill="#002C5F" />
        <path d="M25 50 Q50 25 75 50 Q50 75 25 50" fill="white" />
        <path d="M35 50 Q50 35 65 50 Q50 65 35 50" fill="#002C5F" />
      </svg>
    ),
    chevrolet: (
      <svg viewBox="0 0 100 100" className={className}>
        <rect x="10" y="10" width="80" height="80" rx="10" fill="#1E40AF" />
        <path d="M30 30 L70 30 L70 70 L30 70 Z" fill="white" />
        <path d="M30 30 L50 50 L70 30 M30 70 L50 50 L70 70" stroke="#1E40AF" strokeWidth="6" fill="none" />
      </svg>
    ),
    volvo: (
      <svg viewBox="0 0 100 100" className={className}>
        <circle cx="50" cy="50" r="45" fill="#003057" />
        <path d="M50 20 L50 80 M20 50 L80 50" stroke="#FFCC00" strokeWidth="8" />
        <circle cx="50" cy="50" r="15" fill="none" stroke="#FFCC00" strokeWidth="6" />
      </svg>
    ),
    jaguar: (
      <svg viewBox="0 0 100 100" className={className}>
        <rect x="10" y="10" width="80" height="80" rx="10" fill="#000000" />
        <path d="M30 50 Q50 25 70 50 Q50 75 30 50" fill="white" />
        <path d="M40 50 Q50 40 60 50 Q50 60 40 50" fill="#000000" />
      </svg>
    ),
    porsche: (
      <svg viewBox="0 0 100 100" className={className}>
        <rect x="10" y="10" width="80" height="80" rx="10" fill="#D4001A" />
        <path d="M50 25 L70 50 L50 75 L30 50 Z" fill="white" />
        <path d="M50 35 L60 50 L50 65 L40 50 Z" fill="#D4001A" />
      </svg>
    ),
    ferrari: (
      <svg viewBox="0 0 100 100" className={className}>
        <rect x="10" y="10" width="80" height="80" rx="10" fill="#D4001A" />
        <path d="M30 50 L70 50 M50 30 L50 70" stroke="white" strokeWidth="6" />
        <path d="M40 40 L60 60 M60 40 L40 60" stroke="white" strokeWidth="6" />
      </svg>
    ),
    lamborghini: (
      <svg viewBox="0 0 100 100" className={className}>
        <rect x="10" y="10" width="80" height="80" rx="10" fill="#D4001A" />
        <path d="M30 30 L70 30 L70 70 L30 70 Z" fill="white" />
        <path d="M40 40 L60 40 L60 60 L40 60 Z" fill="#D4001A" />
      </svg>
    ),
    mazda: (
      <svg viewBox="0 0 100 100" className={className}>
        <circle cx="50" cy="50" r="45" fill="#153F6A" />
        <path d="M30 50 Q50 25 70 50 Q50 75 30 50" fill="white" />
        <path d="M40 50 Q50 40 60 50 Q50 60 40 50" fill="#153F6A" />
      </svg>
    ),
    subaru: (
      <svg viewBox="0 0 100 100" className={className}>
        <ellipse cx="50" cy="50" rx="45" ry="45" fill="#005A9C" />
        <path d="M50 25 L65 65 L35 65 Z" fill="white" />
        <circle cx="50" cy="50" r="8" fill="#005A9C" />
      </svg>
    ),
    kia: (
      <svg viewBox="0 0 100 100" className={className}>
        <ellipse cx="50" cy="50" rx="45" ry="45" fill="#BB162B" />
        <path d="M30 35 L70 35 L70 65 L30 65 Z" fill="white" />
        <path d="M40 45 L60 45 L60 55 L40 55 Z" fill="#BB162B" />
      </svg>
    ),
  }

  return carLogos[makeLower] || <span className="font-medium">{make}</span>;
}

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
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden mb-6">
        <div className="relative h-64 bg-gradient-to-r from-indigo-500 to-purple-600">
          <img 
            src={c.carImage || `https://via.placeholder.com/1200x400?text=${encodeURIComponent(c.vehicleMake)}+${encodeURIComponent(c.vehicleModel)}&bg=4f46e5&fc=ffffff`} 
            alt={`${c.vehicleMake} ${c.vehicleModel}`}
            className="w-full h-full object-cover opacity-80"
            onError={(e) => {
              e.target.onerror = null;
              const make = encodeURIComponent(c.vehicleMake?.trim() || '');
              const model = encodeURIComponent(c.vehicleModel?.trim() || '');
              e.target.src = `https://via.placeholder.com/1200x400?text=${make}+${model}&bg=4f46e5&fc=ffffff`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <h1 className="text-3xl font-bold">{c.fullName}</h1>
            <div className="flex items-center mt-2">
              <CarLogo make={c.vehicleMake} className="w-10 h-10 mr-3" />
              <span className="text-xl">{c.vehicleMake} {c.vehicleModel} ({c.vehicleYear})</span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex justify-end">
            <Link
              to={`/clients/${id}/edit`}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              <FiEdit />
              Edit Client
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
              <span className="font-semibold text-gray-500">Registration Number:</span> {c.regNumber}
            </div>
            <div className="md:col-span-2">
              <span className="font-semibold text-gray-500">VIN / Chassis No.:</span> {c.vin}
            </div>
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