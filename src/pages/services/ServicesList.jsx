import React, { useMemo, useState } from 'react'
import { listServices, deleteService, listClients } from '../../lib/storage.js'
import SearchBar from '../../components/SearchBar.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { FiEye, FiEdit, FiTrash2, FiX } from 'react-icons/fi'

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
  'default': 'https://via.placeholder.com/48x48?text=Service'
};

// Fallback image URL
const FALLBACK_IMAGE = 'https://via.placeholder.com/48x48?text=Service';

const getServiceImageUrl = (service) => {
  // Check if service is defined and has a type property
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

// Service Image Component with robust error handling
const ServiceImage = ({ service, className = "", size = "medium" }) => {
  const [imgSrc, setImgSrc] = useState(() => getServiceImageUrl(service));
  const [hasError, setHasError] = useState(false);
  
  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      // Try fallback image
      setImgSrc(FALLBACK_IMAGE);
    }
  };
  
  // Size classes
  const sizeClasses = {
    small: "w-12 h-12",
    medium: "w-24 h-24",
    large: "w-48 h-48"
  };
  
  const sizeClass = sizeClasses[size] || sizeClasses.medium;
  
  // If we've already tried the fallback and it failed, show text
  if (hasError && imgSrc === FALLBACK_IMAGE) {
    return (
      <div className={`${sizeClass} bg-gray-200 rounded flex items-center justify-center ${className}`}>
        <span className="text-xs text-gray-600 text-center px-1">
          {service?.type ? service.type.substring(0, 8) : 'Service'}
        </span>
      </div>
    );
  }
  
  return (
    <img 
      src={imgSrc} 
      alt={service?.type || 'Service'}
      className={`${sizeClass} object-cover rounded ${className}`}
      onError={handleError}
    />
  );
};

// Service Detail Modal Component
const ServiceDetailModal = ({ service, onClose }) => {
  if (!service) return null;
  
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
  
  const serviceColors = {
    'brake-wire': 'bg-red-100 border-red-200 text-red-800',
    'oil-change': 'bg-yellow-100 border-yellow-200 text-yellow-800',
    'tire-rotation': 'bg-green-100 border-green-200 text-green-800',
    'engine-tune': 'bg-blue-100 border-blue-200 text-blue-800',
    'transmission-service': 'bg-purple-100 border-purple-200 text-purple-800',
    'default': 'bg-gray-100 border-gray-200 text-gray-800'
  };
  
  const label = serviceLabels[service?.type] || service?.type || 'Unknown';
  const color = serviceColors[service?.type] || serviceColors.default;
  
  const totalCost = (Number(service.partsCost || 0) + Number(service.laborCost || 0)).toFixed(2);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Service Details</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-shrink-0">
              <ServiceImage service={service} size="large" />
            </div>
            
            <div className="flex-1">
              <div className={`inline-block px-4 py-2 rounded-lg border ${color} mb-4`}>
                <div className="font-medium">{label}</div>
                {service.oilType && (
                  <div className="text-sm">{service.oilType.replace('-', ' ')}</div>
                )}
                {service.brakeWireType && (
                  <div className="text-sm">{service.brakeWireType.replace('-', ' ')}</div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Service Date</h3>
                  <p className="text-lg">{service.date || 'N/A'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    service.status === 'Paid' ? 'bg-green-100 text-green-800' :
                    service.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {service.status || 'Unpaid'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6 mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Cost Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Parts Cost</span>
                <span className="font-medium">${Number(service.partsCost || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Labor Cost</span>
                <span className="font-medium">${Number(service.laborCost || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200 font-bold">
                <span>Total Cost</span>
                <span>${totalCost}</span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Customer Information</h3>
            {customer ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer Name</span>
                  <span className="font-medium">{customer.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium">{customer.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone</span>
                  <span className="font-medium">{customer.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vehicle</span>
                  <span className="font-medium">{customer.carMake} {customer.carModel} ({customer.carYear})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">License Plate</span>
                  <span className="font-medium">{customer.licensePlate}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Customer information not available</p>
            )}
          </div>
          
          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Print Details
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Service Card Component
const ServiceCard = ({ service, onView, onEdit, onDelete }) => {
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
  
  const serviceColors = {
    'brake-wire': 'bg-red-100 border-red-200',
    'oil-change': 'bg-yellow-100 border-yellow-200',
    'tire-rotation': 'bg-green-100 border-green-200',
    'engine-tune': 'bg-blue-100 border-blue-200',
    'transmission-service': 'bg-purple-100 border-purple-200',
    'default': 'bg-gray-100 border-gray-200'
  };
  
  const label = serviceLabels[service?.type] || service?.type || 'Unknown';
  const color = serviceColors[service?.type] || serviceColors.default;
  
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <ServiceImage service={service} />
          <div className={`flex-1 px-3 py-2 rounded-lg border ${color}`}>
            <div className="font-medium text-gray-900">{label}</div>
            {service.oilType && (
              <div className="text-xs text-gray-500">{service.oilType.replace('-', ' ')}</div>
            )}
            {service.brakeWireType && (
              <div className="text-xs text-gray-500">{service.brakeWireType.replace('-', ' ')}</div>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Date:</span>
            <span className="font-medium">{service.date || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Customer:</span>
            <span className="font-medium">{customer?.fullName || `#${service.customerId}`}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Vehicle:</span>
            <span className="font-medium">{customer?.carMake} {customer?.carModel}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Parts:</span>
            <span className="font-medium">${Number(service.partsCost || 0).toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-500">Labor:</span>
            <span className="font-medium">${Number(service.laborCost || 0).toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              service.status === 'Paid' ? 'bg-green-100 text-green-800' :
              service.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {service.status || 'Unpaid'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 px-5 py-3 flex justify-end gap-3 border-t border-gray-200">
        <button
          onClick={onView}
          className="text-indigo-600 hover:text-indigo-800"
          title="View Service"
        >
          <FiEye size={18} />
        </button>
        <button
          onClick={onEdit}
          className="text-indigo-600 hover:text-indigo-800"
          title="Edit Service"
        >
          <FiEdit size={18} />
        </button>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800"
          title="Delete Service"
        >
          <FiTrash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default function ServicesList() {
  const [q, setQ] = useState('')
  const [selectedService, setSelectedService] = useState(null)
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

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="text-gray-400 mb-2">No services found</div>
          <p className="text-gray-500">Try adjusting your search or add a new service.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  )
}