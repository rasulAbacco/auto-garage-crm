//client/src/pages/services/ServiceDetail.jsx
import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getService, listClients, deleteService } from '../../lib/storage.js'
import {
  FiEdit,
  FiArrowLeft,
  FiCalendar,
  FiUser,
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiFileText,
  FiTool,
  FiTrash2,
  FiPrinter,
  FiMail,
  FiPhone
} from 'react-icons/fi'
import { FaCar } from "react-icons/fa";
import { useTheme } from '../../contexts/ThemeContext'

// Service images
const serviceImages = {
  'brake-wire': {
    'standard': 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&h=600&fit=crop',
    'performance': 'https://images.unsplash.com/photo-1632823469770-0e8e6417a79a?w=1200&h=600&fit=crop',
    'heavy-duty': 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1200&h=600&fit=crop',
    'default': 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=1200&h=600&fit=crop'
  },
  'oil-change': {
    'conventional': 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=1200&h=600&fit=crop',
    'synthetic': 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=1200&h=600&fit=crop',
    'high-mileage': 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&h=600&fit=crop',
    'diesel': 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&h=600&fit=crop',
    'default': 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=1200&h=600&fit=crop'
  },
  'tire-rotation': 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=1200&h=600&fit=crop',
  'engine-tune': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&h=600&fit=crop',
  'transmission-service': 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&h=600&fit=crop',
  'default': 'https://via.placeholder.com/1200x600?text=Service'
};

const getServiceImageUrl = (service) => {
  if (!service || !service.type) return serviceImages.default;

  if (service.type === 'oil-change' && service.oilType) {
    return serviceImages['oil-change'][service.oilType] || serviceImages['oil-change'].default;
  }

  if (service.type === 'brake-wire' && service.brakeWireType) {
    return serviceImages['brake-wire'][service.brakeWireType] || serviceImages['brake-wire'].default;
  }

  return serviceImages[service.type] || serviceImages.default;
};

export default function ServiceDetail() {
  const { id } = useParams()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const s = getService(id)
  const clients = listClients()
  const c = clients.find(c => Number(c.id) === Number(s?.customerId))
  const [imageError, setImageError] = useState(false)

  if (!s) {
    return (
      <div className={`lg:ml-16 min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className={`w-24 h-24 mx-auto rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'} flex items-center justify-center mb-4`}>
            <FiTool className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Service Not Found</h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mb-6`}>The service you're looking for doesn't exist.</p>
          <Link
            to="/services"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg"
          >
            <FiArrowLeft />
            Back to Services
          </Link>
        </div>
      </div>
    )
  }

  const serviceLabels = {
    'brake-wire': 'Brake Wire Service',
    'oil-change': 'Oil Change Service',
    'tire-rotation': 'Tire Rotation',
    'engine-tune': 'Engine Tune-Up',
    'transmission-service': 'Transmission Service'
  };

  const label = serviceLabels[s.type] || s.type;
  const totalCost = (Number(s.partsCost || 0) + Number(s.laborCost || 0)).toFixed(2);
  const imageUrl = getServiceImageUrl(s);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      deleteService(id)
      navigate('/services')
    }
  }

  return (
    <div className="space-y-6 lg:ml-16 p-6">
      {/* Back Button */}
      <Link
        to="/services"
        className={`inline-flex items-center gap-2 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200`}
      >
        <FiArrowLeft />
        <span className="font-medium">Back to Services</span>
      </Link>

      {/* Hero Section with Service Image */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-2xl overflow-hidden border`}>
        {/* Service Image */}
        <div className="relative h-80">
          {!imageError ? (
            <img
              src={imageUrl}
              alt={label}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
              <FiTool className="w-24 h-24 text-white opacity-50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>

          {/* Service Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">{label}</h1>
                  <span className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${s.status === 'Paid'
                      ? 'bg-green-500/90 text-white' :
                      s.status === 'In Progress'
                        ? 'bg-yellow-500/90 text-white' :
                        'bg-red-500/90 text-white'
                    } backdrop-blur-sm`}>
                    {s.status === 'Paid' ? <FiCheckCircle size={16} /> : <FiClock size={16} />}
                    {s.status}
                  </span>
                </div>
                <p className="text-white/90 text-lg">Service ID: #{s.id}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-3 rounded-xl transition-all duration-200 border border-white/30"
                  title="Print"
                >
                  <FiPrinter size={20} />
                </button>
                <Link
                  to={`/services/${id}/edit`}
                  className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 border border-white/30"
                >
                  <FiEdit size={18} />
                  Edit
                </Link>
                <button
                  onClick={handleDelete}
                  className="bg-red-500/80 backdrop-blur-md hover:bg-red-600 text-white p-3 rounded-xl transition-all duration-200"
                  title="Delete"
                >
                  <FiTrash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="p-8">
          {/* Service Type & Date */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className={`p-5 rounded-2xl ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-blue-50 border-blue-200'} border`}>
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-blue-900/30' : 'bg-blue-500'} flex items-center justify-center`}>
                  <FiCalendar className={`${isDark ? 'text-blue-400' : 'text-white'}`} size={20} />
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Service Date</p>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.date || 'N/A'}</p>
                </div>
              </div>
            </div>

            {s.oilType && (
              <div className={`p-5 rounded-2xl ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-yellow-50 border-yellow-200'} border`}>
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-500'} flex items-center justify-center`}>
                    <FiTool className={`${isDark ? 'text-yellow-400' : 'text-white'}`} size={20} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Oil Type</p>
                    <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.oilType.replace('-', ' ')}</p>
                  </div>
                </div>
              </div>
            )}

            {s.brakeWireType && (
              <div className={`p-5 rounded-2xl ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-red-50 border-red-200'} border`}>
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-red-900/30' : 'bg-red-500'} flex items-center justify-center`}>
                    <FiTool className={`${isDark ? 'text-red-400' : 'text-white'}`} size={20} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Brake Wire Type</p>
                    <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.brakeWireType.replace('-', ' ')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cost Breakdown */}
          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-purple-50 border-purple-200'} border mb-6`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-purple-900/30' : 'bg-purple-500'} flex items-center justify-center`}>
                <FiDollarSign className={`${isDark ? 'text-purple-400' : 'text-white'}`} size={20} />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Cost Breakdown</h3>
            </div>
            <div className="space-y-3">
              <div className={`flex justify-between items-center p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}>
                <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Parts Cost</span>
                <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>${Number(s.partsCost || 0).toFixed(2)}</span>
              </div>
              <div className={`flex justify-between items-center p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}>
                <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Labor Cost</span>
                <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>${Number(s.laborCost || 0).toFixed(2)}</span>
              </div>
              <div className={`flex justify-between items-center p-4 rounded-xl border-2 ${isDark ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-100 border-purple-300'
                }`}>
                <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Total Cost</span>
                <span className={`font-bold text-2xl ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>${totalCost}</span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          {c && (
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-orange-50 border-orange-200'} border`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-orange-900/30' : 'bg-orange-500'} flex items-center justify-center`}>
                  <FiUser className={`${isDark ? 'text-orange-400' : 'text-white'}`} size={20} />
                </div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Customer Information</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <FiUser className={isDark ? 'text-blue-400' : 'text-blue-600'} size={16} />
                    <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Customer</p>
                  </div>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{c.fullName}</p>
                </div>

                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <FiPhone className={isDark ? 'text-green-400' : 'text-green-600'} size={16} />
                    <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Phone</p>
                  </div>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{c.phone}</p>
                </div>

                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <FiMail className={isDark ? 'text-purple-400' : 'text-purple-600'} size={16} />
                    <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Email</p>
                  </div>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{c.email}</p>
                </div>

                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <FaCar className={isDark ? 'text-orange-400' : 'text-orange-600'} size={16} />
                    <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Vehicle</p>
                  </div>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {c.vehicleMake} {c.vehicleModel} ({c.vehicleYear})
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Billing Section */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-lg border p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-green-900/30' : 'bg-green-500'} flex items-center justify-center`}>
              <FiFileText className={`${isDark ? 'text-green-400' : 'text-white'}`} size={20} />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Billing & Invoice</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Create or manage invoice for this service</p>
            </div>
          </div>
          <Link
            to="/billing/new"
            state={{
              serviceId: s.id,
              customerId: s.customerId,
              description: label,
              partsCost: s.partsCost,
              laborCost: s.laborCost
            }}
            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center gap-2"
          >
            <FiFileText size={18} />
            Create Invoice
          </Link>
        </div>
      </div>
    </div>
  )
}