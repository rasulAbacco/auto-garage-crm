//client/src/pages/services/ServicesList.jsx
import React, { useMemo, useState } from 'react'
import { listServices, deleteService, listClients } from '../../lib/storage.js'
import SearchBar from '../../components/SearchBar.jsx'
import { Link, useNavigate } from 'react-router-dom'
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiX,
  FiPlus,
  FiCalendar,
  FiUser,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiTool,
  FiFileText,
  FiPrinter,
  FiArrowRight
} from 'react-icons/fi'
import { useTheme } from '../../contexts/ThemeContext'
import { FaCar } from "react-icons/fa";

// Service images with reliable URLs and fallbacks
const serviceImages = {
  'brake-wire': {
    'standard': 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&h=400&fit=crop',
    'performance': 'https://images.unsplash.com/photo-1632823469770-0e8e6417a79a?w=800&h=400&fit=crop',
    'heavy-duty': 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=400&fit=crop',
    'default': 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800&h=400&fit=crop'
  },
  'oil-change': {
    'conventional': 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&h=400&fit=crop',
    'synthetic': 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=800&h=400&fit=crop',
    'high-mileage': 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=400&fit=crop',
    'diesel': 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=400&fit=crop',
    'default': 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=800&h=400&fit=crop'
  },
  'tire-rotation': 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800&h=400&fit=crop',
  'engine-tune': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=400&fit=crop',
  'transmission-service': 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=400&fit=crop',
  'default': 'https://via.placeholder.com/120x120?text=Service'
};

const FALLBACK_IMAGE = 'https://via.placeholder.com/120x120?text=Service';

const getServiceImageUrl = (service) => {
  if (!service || typeof service !== 'object' || !service.type) {
    return FALLBACK_IMAGE;
  }

  if (service.type === 'oil-change') {
    if (service.oilType && serviceImages['oil-change'] && serviceImages['oil-change'][service.oilType]) {
      return serviceImages['oil-change'][service.oilType];
    }
    return serviceImages['oil-change'] ? serviceImages['oil-change'].default : FALLBACK_IMAGE;
  }

  if (service.type === 'brake-wire') {
    if (service.brakeWireType && serviceImages['brake-wire'] && serviceImages['brake-wire'][service.brakeWireType]) {
      return serviceImages['brake-wire'][service.brakeWireType];
    }
    return serviceImages['brake-wire'] ? serviceImages['brake-wire'].default : FALLBACK_IMAGE;
  }

  return serviceImages[service.type] || FALLBACK_IMAGE;
};

// Service Image Component
const ServiceImage = ({ service, className = "", size = "medium" }) => {
  const [imgSrc, setImgSrc] = useState(() => getServiceImageUrl(service));
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(FALLBACK_IMAGE);
    }
  };

  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-24 h-24",
    large: "w-full h-64"
  };

  const sizeClass = sizeClasses[size] || sizeClasses.medium;

  if (hasError && imgSrc === FALLBACK_IMAGE) {
    return (
      <div className={`${sizeClass} bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-xl flex items-center justify-center ${className}`}>
        <FiTool className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={service?.type || 'Service'}
      className={`${sizeClass} object-cover rounded-xl ${className}`}
      onError={handleError}
    />
  );
};

// Service Detail Modal Component
const ServiceDetailModal = ({ service, onClose }) => {
  const { isDark } = useTheme();

  if (!service) return null;

  const clients = listClients();
  const customer = clients.find(c => c.id === Number(service.customerId));

  const serviceLabels = {
    'brake-wire': 'Brake Wire Service',
    'oil-change': 'Oil Change Service',
    'tire-rotation': 'Tire Rotation',
    'engine-tune': 'Engine Tune-Up',
    'transmission-service': 'Transmission Service',
    'default': 'General Service'
  };

  const label = serviceLabels[service?.type] || service?.type || 'Unknown Service';
  const totalCost = (Number(service.partsCost || 0) + Number(service.laborCost || 0)).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slideUp`}>
        {/* Modal Header */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' : 'border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FiFileText className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Service Details</h2>
                <p className="text-sm text-white/80">Complete service information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all duration-200"
            >
              <FiX size={24} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
          {/* Service Image and Type */}
          <div className="mb-6">
            <ServiceImage service={service} size="large" className="shadow-lg" />
            <div className="mt-4">
              <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                {label}
              </h3>
              {service.oilType && (
                <span className={`inline-block px-4 py-2 rounded-xl text-sm font-semibold ${isDark ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  }`}>
                  {service.oilType.replace('-', ' ').toUpperCase()}
                </span>
              )}
              {service.brakeWireType && (
                <span className={`inline-block px-4 py-2 rounded-xl text-sm font-semibold ${isDark ? 'bg-red-900/30 text-red-400 border border-red-700' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                  {service.brakeWireType.replace('-', ' ').toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Service Information Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Date & Status */}
            <div className={`p-5 rounded-2xl ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-blue-50 border-blue-200'} border`}>
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-blue-900/30' : 'bg-blue-500'} flex items-center justify-center`}>
                  <FiCalendar className={`${isDark ? 'text-blue-400' : 'text-white'}`} size={20} />
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Service Date</p>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{service.date || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className={`p-5 rounded-2xl ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-green-50 border-green-200'} border`}>
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-green-900/30' : 'bg-green-500'} flex items-center justify-center`}>
                  {service.status === 'Paid' ? (
                    <FiCheckCircle className={`${isDark ? 'text-green-400' : 'text-white'}`} size={20} />
                  ) : (
                    <FiAlertCircle className={`${isDark ? 'text-yellow-400' : 'text-white'}`} size={20} />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</p>
                  <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-bold ${service.status === 'Paid'
                      ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800' :
                      service.status === 'In Progress'
                        ? isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800' :
                        isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800'
                    }`}>
                    {service.status || 'Unpaid'}
                  </span>
                </div>
              </div>
            </div>
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
                <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>${Number(service.partsCost || 0).toFixed(2)}</span>
              </div>
              <div className={`flex justify-between items-center p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}>
                <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Labor Cost</span>
                <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>${Number(service.laborCost || 0).toFixed(2)}</span>
              </div>
              <div className={`flex justify-between items-center p-4 rounded-xl border-2 ${isDark ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-100 border-purple-300'
                }`}>
                <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Total Cost</span>
                <span className={`font-bold text-2xl ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>${totalCost}</span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-orange-50 border-orange-200'} border`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-orange-900/30' : 'bg-orange-500'} flex items-center justify-center`}>
                <FiUser className={`${isDark ? 'text-orange-400' : 'text-white'}`} size={20} />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Customer Information</h3>
            </div>
            {customer ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { label: 'Customer Name', value: customer.fullName, icon: FiUser },
                  { label: 'Email', value: customer.email, icon: 'FiMail' },
                  { label: 'Phone', value: customer.phone, icon: 'FiPhone' },
                  { label: 'Vehicle', value: `${customer.vehicleMake} ${customer.vehicleModel} (${customer.vehicleYear})`, icon: FaCar },
                ].map((item, idx) => (
                  <div key={idx} className={`p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.label}</p>
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Customer information not available</p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`p-6 border-t ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => window.print()}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-200 ${isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-white border-2 border-gray-600'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300'
                }`}
            >
              <FiPrinter size={18} />
              Print
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Full-Width Service Card Component
const ServiceCard = ({ service, onView, onEdit, onDelete }) => {
  const { isDark } = useTheme();
  const clients = listClients();
  const customer = clients.find(c => c.id === Number(service.customerId));

  const serviceLabels = {
    'brake-wire': 'Brake Wire',
    'oil-change': 'Oil Change',
    'tire-rotation': 'Tire Rotation',
    'engine-tune': 'Engine Tune',
    'transmission-service': 'Transmission',
    'default': 'Service'
  };

  const serviceIcons = {
    'brake-wire': '🔧',
    'oil-change': '🛢️',
    'tire-rotation': '⚙️',
    'engine-tune': '🔩',
    'transmission-service': '⚡',
    'default': '🔧'
  };

  const label = serviceLabels[service?.type] || service?.type || 'Unknown';
  const icon = serviceIcons[service?.type] || serviceIcons.default;
  const totalCost = (Number(service.partsCost || 0) + Number(service.laborCost || 0)).toFixed(2);

  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:bg-gray-50'} rounded-2xl shadow-lg border transition-all duration-200 hover:shadow-xl overflow-hidden`}>
      <div className="p-6">
        <div className="flex items-start gap-6">
          {/* Service Image */}
          <div className="flex-shrink-0">
            <ServiceImage service={service} size="medium" className="shadow-md" />
          </div>

          {/* Service Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{icon}</span>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {label}
                  </h3>
                </div>
                {(service.oilType || service.brakeWireType) && (
                  <div className="flex gap-2 mb-3">
                    {service.oilType && (
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${isDark ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        }`}>
                        {service.oilType.replace('-', ' ')}
                      </span>
                    )}
                    {service.brakeWireType && (
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${isDark ? 'bg-red-900/30 text-red-400 border border-red-700' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {service.brakeWireType.replace('-', ' ')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <span className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${service.status === 'Paid'
                  ? isDark ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-green-50 text-green-700 border border-green-200' :
                  service.status === 'In Progress'
                    ? isDark ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700' : 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                    isDark ? 'bg-red-900/30 text-red-400 border border-red-700' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                {service.status === 'Paid' ? <FiCheckCircle size={16} /> : <FiClock size={16} />}
                {service.status || 'Unpaid'}
              </span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <FiCalendar className={`${isDark ? 'text-blue-400' : 'text-blue-600'}`} size={14} />
                  <span className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Date</span>
                </div>
                <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{service.date || 'N/A'}</p>
              </div>

              <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-purple-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <FiUser className={`${isDark ? 'text-purple-400' : 'text-purple-600'}`} size={14} />
                  <span className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Customer</span>
                </div>
                <p className={`font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{customer?.fullName || `#${service.customerId}`}</p>
              </div>

              <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-green-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <FaCar className={`${isDark ? 'text-green-400' : 'text-green-600'}`} size={14} />
                  <span className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Vehicle</span>
                </div>
                <p className={`font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {customer?.vehicleMake} {customer?.vehicleModel}
                </p>
              </div>

              <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-orange-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <FiDollarSign className={`${isDark ? 'text-orange-400' : 'text-orange-600'}`} size={14} />
                  <span className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total</span>
                </div>
                <p className={`font-bold text-lg ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>${totalCost}</p>
              </div>
            </div>

            {/* Cost Details */}
            <div className="flex items-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Parts:</span>
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>${Number(service.partsCost || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Labor:</span>
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>${Number(service.laborCost || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 flex flex-col gap-2">
            <button
              onClick={onView}
              className={`p-3 rounded-xl transition-all duration-200 ${isDark
                  ? 'bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-700'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200'
                }`}
              title="View Details"
            >
              <FiEye size={20} />
            </button>
            <button
              onClick={onEdit}
              className={`p-3 rounded-xl transition-all duration-200 ${isDark
                  ? 'bg-purple-900/30 hover:bg-purple-900/50 text-purple-400 border border-purple-700'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200'
                }`}
              title="Edit Service"
            >
              <FiEdit size={20} />
            </button>
            <button
              onClick={onDelete}
              className={`p-3 rounded-xl transition-all duration-200 ${isDark
                  ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700'
                  : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                }`}
              title="Delete Service"
            >
              <FiTrash2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ServicesList() {
  const [q, setQ] = useState('')
  const [selectedService, setSelectedService] = useState(null)
  const { isDark } = useTheme();
  const navigate = useNavigate()
  const data = listServices()
  const clients = listClients()
  const nameById = Object.fromEntries(clients.map(c => [String(c.id), c.fullName]))

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    return data.filter(s => s &&
      [s.type, s.status, s.date, nameById[String(s.customerId)] || '']
        .some(v => String(v).toLowerCase().includes(term))
    )
  }, [q, data])

  const handleDelete = (id) => {
    if (window.confirm('Delete this service?')) {
      deleteService(id)
      navigate(0)
    }
  }

  const handleView = (service) => {
    setSelectedService(service)
  }

  const closeModal = () => {
    setSelectedService(null)
  }

  return (
    <div className="space-y-6 lg:ml-16 p-6">
      {/* Header Section */}
      <div className={`${isDark ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-green-600 to-teal-600'} rounded-2xl p-8 shadow-xl`}>
        <h1 className="text-3xl font-bold text-white mb-2">Service Management</h1>
        <p className={`${isDark ? 'text-gray-300' : 'text-green-100'}`}>Track and manage all service records</p>
      </div>

      {/* Search and Add Section */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-lg border`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-96">
            <SearchBar
              value={q}
              onChange={setQ}
              placeholder="Search by type, customer, status..."
            />
          </div>
          <Link
            to="/services/new"
            className="w-full md:w-auto bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-xl px-6 py-3 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <FiPlus size={18} />
            Add New Service
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-lg border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Services</p>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.length}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FiTool className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-lg border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Search Results</p>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{filtered.length}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FiFileText className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-lg border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Revenue</p>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ${filtered.reduce((sum, s) => sum + Number(s.partsCost || 0) + Number(s.laborCost || 0), 0).toFixed(2)}
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FiDollarSign className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Services List */}
      {filtered.length === 0 ? (
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-16 text-center shadow-lg border`}>
          <div className={`w-24 h-24 mx-auto rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center mb-4`}>
            <FiTool className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          </div>
          <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>No Services Found</h3>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
            Try adjusting your search or add a new service.
          </p>
          <Link
            to="/services/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg"
          >
            <FiPlus size={18} />
            Add First Service
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onView={() => handleView(service)}
              onEdit={() => navigate(`/services/${service.id}/edit`)}
              onDelete={() => handleDelete(service.id)}
            />
          ))}
        </div>
      )}

      {/* Service Detail Modal */}
      {selectedService && (
        <ServiceDetailModal
          service={selectedService}
          onClose={closeModal}
        />
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}