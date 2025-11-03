//client/src/pages/services/ServiceForm.jsx
import React, { useEffect, useState } from "react";
import { getService, upsertService, listClients } from "../../lib/storage.js";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import {
  FiUser,
  FiCalendar,
  FiTool,
  FiDollarSign,
  FiSave,
  FiX,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
} from 'react-icons/fi'
import { useTheme } from '../../contexts/ThemeContext'
import { FaCar } from "react-icons/fa";

const empty = {
  customerId: '',
  date: '',
  type: '',
  partsCost: '',
  laborCost: '',
  status: 'Unpaid',
};

const serviceTypes = [
  {
    value: 'brake-wire',
    label: 'Brake Wire Replacement',
    description: 'Complete brake wire replacement with premium quality wires',
    components: ['Brake wires', 'Connectors', 'Protective tubing'],
    icon: '🔧'
  },
  {
    value: 'oil-change',
    label: 'Oil Change',
    description: 'Full synthetic oil change with filter replacement',
    components: ['Synthetic oil', 'Oil filter', 'Drain plug gasket'],
    icon: '🛢️'
  },
  {
    value: 'tire-rotation',
    label: 'Tire Rotation',
    description: 'Complete tire rotation and pressure check',
    components: ['Tire rotation', 'Pressure adjustment', 'Tread inspection'],
    icon: '⚙️'
  },
  {
    value: 'engine-tune',
    label: 'Engine Tune-up',
    description: 'Comprehensive engine performance optimization',
    components: ['Spark plugs', 'Air filter', 'Fuel filter', 'PCV valve'],
    icon: '🔩'
  },
  {
    value: 'transmission-service',
    label: 'Transmission Service',
    description: 'Transmission fluid replacement and filter change',
    components: ['Transmission fluid', 'Filter', 'Gasket', 'Fluid flush'],
    icon: '⚡'
  }
];

const oilTypes = [
  { value: 'conventional', label: 'Conventional Oil', icon: '🟤' },
  { value: 'synthetic', label: 'Full Synthetic Oil', icon: '🟡' },
  { value: 'high-mileage', label: 'High Mileage Oil', icon: '🟠' },
  { value: 'diesel', label: 'Diesel Oil', icon: '⚫' }
];

const brakeWireTypes = [
  { value: 'standard', label: 'Standard Brake Wire', icon: '🔵' },
  { value: 'performance', label: 'Performance Brake Wire', icon: '🟣' },
  { value: 'heavy-duty', label: 'Heavy Duty Brake Wire', icon: '🔴' }
];

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
    'diesel': 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&h=400&fit=crop',
    'default': 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=800&h=400&fit=crop'
  },
  'tire-rotation': 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800&h=400&fit=crop',
  'engine-tune': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=400&fit=crop',
  'transmission-service': 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=400&fit=crop',
  'default': 'https://images.unsplash.com/photo-1558618666-fcd34ee8502d?w=800&h=400&fit=crop'
};

export default function ServiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const [form, setForm] = useState(empty);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedOilType, setSelectedOilType] = useState(null);
  const [selectedBrakeWireType, setSelectedBrakeWireType] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState(false);
  const clients = listClients();

  const customer = clients.find(c => c.id === Number(form.customerId));

  useEffect(() => {
    if (id) {
      const existing = getService(id);
      if (existing) {
        setForm(existing);
        const service = serviceTypes.find(s => s.value === existing.type);
        setSelectedService(service || null);

        if (existing.type === 'oil-change' && existing.oilType) {
          const oil = oilTypes.find(o => o.value === existing.oilType);
          setSelectedOilType(oil || null);
        }

        if (existing.type === 'brake-wire' && existing.brakeWireType) {
          const brakeWire = brakeWireTypes.find(b => b.value === existing.brakeWireType);
          setSelectedBrakeWireType(brakeWire || null);
        }
      }
    } else if (location.state?.customerId) {
      setForm(f => ({ ...f, customerId: location.state.customerId }));
    }
  }, [id, location.state]);

  useEffect(() => {
    setImageError(false);
    if (selectedService) {
      const url = getServiceImageUrl();
      setImageUrl(url);
    } else {
      setImageUrl('');
    }
  }, [selectedService, selectedOilType, selectedBrakeWireType]);

  const getServiceImageUrl = () => {
    if (!selectedService) return serviceImages.default;

    if (selectedService.value === 'oil-change') {
      if (selectedOilType && serviceImages['oil-change'][selectedOilType.value]) {
        return serviceImages['oil-change'][selectedOilType.value];
      }
      return serviceImages['oil-change'].default;
    }

    if (selectedService.value === 'brake-wire') {
      if (selectedBrakeWireType && serviceImages['brake-wire'][selectedBrakeWireType.value]) {
        return serviceImages['brake-wire'][selectedBrakeWireType.value];
      }
      return serviceImages['brake-wire'].default;
    }

    return serviceImages[selectedService.value] || serviceImages.default;
  };

  const handleServiceChange = (e) => {
    const serviceValue = e.target.value;
    setForm({ ...form, type: serviceValue, oilType: '', brakeWireType: '' });
    const service = serviceTypes.find(s => s.value === serviceValue);
    setSelectedService(service || null);
    setSelectedOilType(null);
    setSelectedBrakeWireType(null);
  };

  const handleOilTypeChange = (e) => {
    const oilValue = e.target.value;
    setForm({ ...form, oilType: oilValue });
    const oil = oilTypes.find(o => o.value === oilValue);
    setSelectedOilType(oil || null);
  };

  const handleBrakeWireTypeChange = (e) => {
    const brakeValue = e.target.value;
    setForm({ ...form, brakeWireType: brakeValue });
    const brakeWire = brakeWireTypes.find(b => b.value === brakeValue);
    setSelectedBrakeWireType(brakeWire || null);
  };

  const submit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      customerId: Number(form.customerId),
      partsCost: Number(form.partsCost || 0),
      laborCost: Number(form.laborCost || 0),
      id: form.id,
    };
    const saved = upsertService(payload);
    navigate(`/services/${saved.id || form.id}`);
  };

  const getServiceComponents = () => {
    if (!selectedService) return [];
    let components = [...selectedService.components];

    if (selectedService.value === 'oil-change' && selectedOilType) {
      components.push(`${selectedOilType.label} (5W-30)`);
    } else if (selectedService.value === 'brake-wire' && selectedBrakeWireType) {
      components.push(`${selectedBrakeWireType.label} (Front & Rear)`);
    }

    return components;
  };

  const totalCost = (Number(form.partsCost || 0) + Number(form.laborCost || 0)).toFixed(2);

  return (
    <div className="lg:ml-16 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/services"
            className={`inline-flex items-center gap-2 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200 mb-3`}
          >
            <FiArrowLeft />
            <span className="font-medium">Back to Services</span>
          </Link>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {id ? 'Edit Service' : 'Add New Service'}
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            {id ? 'Update service information' : 'Create a new service record'}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Basic Information */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-xl border overflow-hidden`}>
          <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' : 'border-gray-200 bg-gradient-to-r from-green-600 to-teal-600'}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FiTool className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Basic Information</h2>
                <p className="text-sm text-white/80">Service and customer details</p>
              </div>
            </div>
          </div>

          <div className="p-6 grid md:grid-cols-2 gap-6">
            {/* Customer */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                <FiUser size={16} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white focus:bg-gray-600 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:bg-gray-50 focus:border-blue-500'
                  } border-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                required
              >
                <option value="">Select customer</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} - {c.vehicleMake} {c.vehicleModel}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                <FiCalendar size={16} className={isDark ? 'text-green-400' : 'text-green-600'} />
                Service Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white focus:bg-gray-600 focus:border-green-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:bg-gray-50 focus:border-green-500'
                  } border-2 focus:outline-none focus:ring-2 focus:ring-green-500/20`}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {/* Service Type Selection */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-xl border overflow-hidden`}>
          <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' : 'border-gray-200 bg-gradient-to-r from-purple-600 to-pink-600'}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FiTool className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Service Type</h2>
                <p className="text-sm text-white/80">Select the type of service</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Service Type Selector */}
            <div>
              <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Choose Service Type <span className="text-red-500">*</span>
              </label>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviceTypes.map(service => (
                  <button
                    key={service.value}
                    type="button"
                    onClick={() => {
                      handleServiceChange({ target: { value: service.value } })
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${form.type === service.value
                        ? isDark
                          ? 'bg-purple-900/30 border-purple-500 shadow-lg'
                          : 'bg-purple-50 border-purple-500 shadow-lg'
                        : isDark
                          ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                          : 'bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <div className="text-3xl mb-2">{service.icon}</div>
                    <div className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {service.label}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {service.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Oil Type (for oil change) */}
            {selectedService?.value === 'oil-change' && (
              <div>
                <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Oil Type <span className="text-red-500">*</span>
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  {oilTypes.map(oil => (
                    <button
                      key={oil.value}
                      type="button"
                      onClick={() => handleOilTypeChange({ target: { value: oil.value } })}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${form.oilType === oil.value
                          ? isDark
                            ? 'bg-yellow-900/30 border-yellow-500 shadow-lg'
                            : 'bg-yellow-50 border-yellow-500 shadow-lg'
                          : isDark
                            ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <div className="text-2xl">{oil.icon}</div>
                      <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {oil.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Brake Wire Type (for brake wire) */}
            {selectedService?.value === 'brake-wire' && (
              <div>
                <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Brake Wire Type <span className="text-red-500">*</span>
                </label>
                <div className="grid md:grid-cols-3 gap-4">
                  {brakeWireTypes.map(brakeWire => (
                    <button
                      key={brakeWire.value}
                      type="button"
                      onClick={() => handleBrakeWireTypeChange({ target: { value: brakeWire.value } })}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${form.brakeWireType === brakeWire.value
                          ? isDark
                            ? 'bg-red-900/30 border-red-500 shadow-lg'
                            : 'bg-red-50 border-red-500 shadow-lg'
                          : isDark
                            ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <div className="text-2xl mb-2">{brakeWire.icon}</div>
                      <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {brakeWire.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Service Details */}
            {selectedService && (
              <div className={`p-5 rounded-2xl ${isDark ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200'} border`}>
                <h4 className={`font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedService.label} - Components
                </h4>
                <div className="grid md:grid-cols-2 gap-2">
                  {getServiceComponents().map((component, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <FiCheckCircle className={isDark ? 'text-purple-400' : 'text-purple-600'} size={16} />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{component}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Service Image */}
            {selectedService && (
              <div>
                <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Service Preview
                </label>
                <div className={`rounded-2xl overflow-hidden border-2 ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                  <div className={`px-4 py-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {customer ? `${customer.vehicleMake} ${customer.vehicleModel}` : 'Vehicle Service'}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {selectedService.label}
                          {selectedOilType && ` • ${selectedOilType.label}`}
                          {selectedBrakeWireType && ` • ${selectedBrakeWireType.label}`}
                        </p>
                      </div>
                      <FaCar className={isDark ? 'text-gray-400' : 'text-gray-600'} size={24} />
                    </div>
                  </div>
                  {!imageError ? (
                    <img
                      src={imageUrl}
                      alt={selectedService.label}
                      className="w-full h-64 object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <div className="text-center p-6">
                        <div className="text-white text-2xl font-bold mb-2">
                          {selectedService.label}
                        </div>
                        <div className="text-white/80">
                          Professional Service
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cost & Status */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-xl border overflow-hidden`}>
          <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' : 'border-gray-200 bg-gradient-to-r from-orange-600 to-red-600'}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FiDollarSign className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Cost & Status</h2>
                <p className="text-sm text-white/80">Pricing and payment information</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Parts Cost */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                  <FiDollarSign size={16} className={isDark ? 'text-green-400' : 'text-green-600'} />
                  Parts Cost
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                      ? 'bg-gray-700 border-gray-600 text-white focus:bg-gray-600 focus:border-green-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:bg-gray-50 focus:border-green-500'
                    } border-2 focus:outline-none focus:ring-2 focus:ring-green-500/20`}
                  value={form.partsCost}
                  onChange={(e) => setForm({ ...form, partsCost: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              {/* Labor Cost */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                  <FiDollarSign size={16} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                  Labor Cost
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                      ? 'bg-gray-700 border-gray-600 text-white focus:bg-gray-600 focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:bg-gray-50 focus:border-blue-500'
                    } border-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  value={form.laborCost}
                  onChange={(e) => setForm({ ...form, laborCost: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              {/* Status */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                  <FiCheckCircle size={16} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                  Payment Status <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                      ? 'bg-gray-700 border-gray-600 text-white focus:bg-gray-600 focus:border-purple-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:bg-gray-50 focus:border-purple-500'
                    } border-2 focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                  <option value="In Progress">In Progress</option>
                </select>
              </div>
            </div>

            {/* Total Cost Display */}
            {(form.partsCost || form.laborCost) && (
              <div className={`p-5 rounded-2xl border-2 ${isDark ? 'bg-orange-900/30 border-orange-700' : 'bg-orange-50 border-orange-300'
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-orange-900/50' : 'bg-orange-500'} flex items-center justify-center`}>
                      <FiDollarSign className={`${isDark ? 'text-orange-400' : 'text-white'}`} size={24} />
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Cost</p>
                      <p className={`text-3xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                        ${totalCost}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Parts: ${Number(form.partsCost || 0).toFixed(2)}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Labor: ${Number(form.laborCost || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-xl px-8 py-4 font-bold text-lg transition-all duration-200 shadow-xl hover:shadow-2xl"
          >
            <FiSave size={20} />
            {id ? 'Update Service' : 'Save Service'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl ${isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-white border-2 border-gray-600'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300'
              }`}
          >
            <FiX size={20} />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}