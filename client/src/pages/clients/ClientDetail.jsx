//client/src/pages/clients/ClientDetail.jsx
import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { getClient, listServices } from '../../lib/storage.js'
import {
  FiEdit,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCreditCard,
  FiHash,
  FiCalendar,
  FiTool,
  FiDollarSign,
  FiClock,
  FiPlus,
  FiArrowLeft,
  FiCheckCircle
} from 'react-icons/fi'
import { useTheme } from '../../contexts/ThemeContext'

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

  return carLogos[makeLower] || (
    <div className={`${className} rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold text-xl`}>
      {make?.charAt(0)?.toUpperCase() || 'C'}
    </div>
  );
}

export default function ClientDetail() {
  const { id } = useParams()
  const { isDark } = useTheme()
  const c = getClient(id)
  const services = listServices().filter(s => String(s.customerId) === String(id))

  if (!c)
    return (
      <div className={`lg:ml-16 min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className={`w-24 h-24 mx-auto rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'} flex items-center justify-center mb-4`}>
            <FiMapPin className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Client Not Found</h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mb-6`}>The client you're looking for doesn't exist.</p>
          <Link
            to="/clients"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg"
          >
            <FiArrowLeft />
            Back to Clients
          </Link>
        </div>
      </div>
    )

  return (
    <div className="space-y-6 lg:ml-16 p-6">
      {/* Back Button */}
      <Link
        to="/clients"
        className={`inline-flex items-center gap-2 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200`}
      >
        <FiArrowLeft />
        <span className="font-medium">Back to Clients</span>
      </Link>

      {/* Header Card with Vehicle Display */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-2xl overflow-hidden border`}>
        {/* Vehicle Showcase with Road Scene */}
        <div className="relative h-96">
          {/* Background Sky */}
          <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-700' : 'bg-gradient-to-b from-blue-500 via-blue-400 to-blue-300'}`}></div>

          {/* Road */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-gray-600 to-gray-800 shadow-2xl"></div>

          {/* Road texture */}
          <div className="absolute bottom-0 left-0 right-0 h-40 opacity-30">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-0.5 bg-gray-900 mb-3"></div>
            ))}
          </div>

          {/* Road markings */}
          <div className="absolute bottom-20 left-0 right-0 flex justify-around items-center px-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-2 w-20 bg-yellow-400 shadow-md rounded-sm"></div>
            ))}
          </div>

          {/* Car Display */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-20">
            {/* Vehicle Info Badge */}
            <div className={`${isDark ? 'bg-gray-700 border-blue-500' : 'bg-white border-blue-600'} px-6 py-3 rounded-2xl shadow-2xl mb-4 border-2`}>
              <div className="flex items-center gap-3">
                <CarLogo make={c.vehicleMake} className="w-12 h-12" />
                <div>
                  <div className={`text-lg font-bold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                    {c.vehicleMake} {c.vehicleModel}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} flex items-center gap-2`}>
                    <FiCalendar size={14} />
                    {c.vehicleYear} • {c.regNumber}
                  </div>
                </div>
              </div>
            </div>

            {/* Car Image */}
            <img
              src={c.carImage || `https://via.placeholder.com/500x300?text=${encodeURIComponent(c.vehicleMake)}+${encodeURIComponent(c.vehicleModel)}`}
              alt={`${c.vehicleMake} ${c.vehicleModel}`}
              className="h-64 w-auto object-contain drop-shadow-2xl"
              style={{ filter: 'drop-shadow(0 30px 30px rgba(0, 0, 0, 0.5))' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://via.placeholder.com/500x300?text=${encodeURIComponent(c.vehicleMake)}+${encodeURIComponent(c.vehicleModel)}`;
              }}
            />
          </div>

          {/* Client Name Overlay */}
          <div className="absolute top-6 left-6 right-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-2xl">
                  {c.fullName?.charAt(0)?.toUpperCase() || 'C'}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white drop-shadow-lg">{c.fullName}</h1>
                  <p className="text-white/90 flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Active Client
                  </p>
                </div>
              </div>
              <Link
                to={`/clients/${id}/edit`}
                className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center gap-2 border border-white/30"
              >
                <FiEdit size={18} />
                Edit Client
              </Link>
            </div>
          </div>
        </div>

        {/* Client Information Grid */}
        <div className="p-8">
          <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-3`}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <FiHash className="text-white" size={20} />
            </div>
            Contact Information
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Phone */}
            <div className={`${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-blue-50 border-blue-200'} p-5 rounded-2xl border`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-blue-900/30' : 'bg-blue-500'} flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <FiPhone className={`${isDark ? 'text-blue-400' : 'text-white'}`} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Phone</p>
                  <p className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>{c.phone}</p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className={`${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-purple-50 border-purple-200'} p-5 rounded-2xl border`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-purple-900/30' : 'bg-purple-500'} flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <FiMail className={`${isDark ? 'text-purple-400' : 'text-white'}`} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Email</p>
                  <p className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>{c.email}</p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className={`${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-green-50 border-green-200'} p-5 rounded-2xl border md:col-span-2 lg:col-span-1`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-green-900/30' : 'bg-green-500'} flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <FiMapPin className={`${isDark ? 'text-green-400' : 'text-white'}`} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Address</p>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{c.address}</p>
                </div>
              </div>
            </div>

            {/* Registration Number */}
            <div className={`${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-orange-50 border-orange-200'} p-5 rounded-2xl border`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-orange-900/30' : 'bg-orange-500'} flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <FiCreditCard className={`${isDark ? 'text-orange-400' : 'text-white'}`} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Registration No.</p>
                  <p className={`font-mono font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{c.regNumber}</p>
                </div>
              </div>
            </div>

            {/* VIN */}
            <div className={`${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-pink-50 border-pink-200'} p-5 rounded-2xl border md:col-span-2 lg:col-span-2`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-pink-900/30' : 'bg-pink-500'} flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <FiHash className={`${isDark ? 'text-pink-400' : 'text-white'}`} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>VIN / Chassis No.</p>
                  <p className={`font-mono font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{c.vin || 'Not Available'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service History Section */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-xl border overflow-hidden`}>
        <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' : 'border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FiTool className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Service History</h2>
                <p className="text-sm text-white/80">Complete maintenance records</p>
              </div>
            </div>
            <Link
              to="/services/new"
              state={{ customerId: c.id }}
              className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center gap-2 border border-white/30"
            >
              <FiPlus size={18} />
              Add Service
            </Link>
          </div>
        </div>

        <div className="p-6">
          {services.length > 0 ? (
            <div className="space-y-4">
              {services.map((s, idx) => (
                <div
                  key={s.id}
                  className={`${isDark ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    } p-5 rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Service Number Badge */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                        {idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {s.type}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isDark ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-green-50 text-green-700 border border-green-200'
                            }`}>
                            <FiCheckCircle className="inline mr-1" size={12} />
                            Completed
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                          <div className={`flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            <FiCalendar className={isDark ? 'text-blue-400' : 'text-blue-600'} size={16} />
                            <span className="text-sm font-medium">{s.date}</span>
                          </div>
                          {s.cost && (
                            <div className={`flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                              <FiDollarSign className={isDark ? 'text-green-400' : 'text-green-600'} size={16} />
                              <span className="text-sm font-medium">${s.cost}</span>
                            </div>
                          )}
                          {s.status && (
                            <div className={`flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                              <FiClock className={isDark ? 'text-purple-400' : 'text-purple-600'} size={16} />
                              <span className="text-sm font-medium">{s.status}</span>
                            </div>
                          )}
                        </div>

                        {s.description && (
                          <p className={`mt-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {s.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <Link
                      to={`/services/${s.id}`}
                      className={`ml-4 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 ${isDark
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                      View Details
                      <FiArrowLeft className="rotate-180" size={16} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className={`w-24 h-24 mx-auto rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center mb-4`}>
                <FiTool className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Service Records</h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
                This client doesn't have any service history yet.
              </p>
              <Link
                to="/services/new"
                state={{ customerId: c.id }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg"
              >
                <FiPlus size={18} />
                Add First Service
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}