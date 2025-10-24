import React, { useEffect, useState } from "react";
import { getService, upsertService, listClients } from "../../lib/storage.js";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const empty = {
  customerId: '',
  date: '',
  type: '',
  partsCost: '',
  laborCost: '',
  status: 'Unpaid',
};

// Service types
const serviceTypes = [
  { 
    value: 'brake-wire', 
    label: 'Brake Wire Replacement',
    description: 'Complete brake wire replacement with premium quality wires',
    components: ['Brake wires', 'Connectors', 'Protective tubing']
  },
  { 
    value: 'oil-change', 
    label: 'Oil Change',
    description: 'Full synthetic oil change with filter replacement',
    components: ['Synthetic oil', 'Oil filter', 'Drain plug gasket']
  },
  { 
    value: 'tire-rotation', 
    label: 'Tire Rotation',
    description: 'Complete tire rotation and pressure check',
    components: ['Tire rotation', 'Pressure adjustment', 'Tread inspection']
  },
  { 
    value: 'engine-tune', 
    label: 'Engine Tune-up',
    description: 'Comprehensive engine performance optimization',
    components: ['Spark plugs', 'Air filter', 'Fuel filter', 'PCV valve']
  },
  { 
    value: 'transmission-service', 
    label: 'Transmission Service',
    description: 'Transmission fluid replacement and filter change',
    components: ['Transmission fluid', 'Filter', 'Gasket', 'Fluid flush']
  }
];

// Oil types
const oilTypes = [
  { value: 'conventional', label: 'Conventional Oil' },
  { value: 'synthetic', label: 'Full Synthetic Oil' },
  { value: 'high-mileage', label: 'High Mileage Oil' },
  { value: 'diesel', label: 'Diesel Oil' }
];

// Brake wire types
const brakeWireTypes = [
  { value: 'standard', label: 'Standard Brake Wire' },
  { value: 'performance', label: 'Performance Brake Wire' },
  { value: 'heavy-duty', label: 'Heavy Duty Brake Wire' }
];

// Service images with reliable URLs
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
  const [form, setForm] = useState(empty);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedOilType, setSelectedOilType] = useState(null);
  const [selectedBrakeWireType, setSelectedBrakeWireType] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState(false);
  const clients = listClients();

  // Get customer details
  const customer = clients.find(c => c.id === Number(form.customerId));

  useEffect(() => {
    if (id) {
      const existing = getService(id);
      if (existing) {
        setForm(existing);
        // Find matching service type
        const service = serviceTypes.find(s => s.value === existing.type);
        setSelectedService(service || null);
        
        // Set oil type if oil change service
        if (existing.type === 'oil-change' && existing.oilType) {
          const oil = oilTypes.find(o => o.value === existing.oilType);
          setSelectedOilType(oil || null);
        }
        
        // Set brake wire type if brake service
        if (existing.type === 'brake-wire' && existing.brakeWireType) {
          const brakeWire = brakeWireTypes.find(b => b.value === existing.brakeWireType);
          setSelectedBrakeWireType(brakeWire || null);
        }
      }
    } else if (location.state?.customerId) {
      setForm(f => ({ ...f, customerId: location.state.customerId }));
    }
  }, [id, location.state]);

  // Update image URL when service or subtype changes
  useEffect(() => {
    setImageError(false);
    if (selectedService) {
      const url = getServiceImageUrl();
      console.log("Loading image URL:", url);
      setImageUrl(url);
    } else {
      setImageUrl('');
    }
  }, [selectedService, selectedOilType, selectedBrakeWireType]);

  // Get service image URL
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
    
    // Find selected service details
    const service = serviceTypes.find(s => s.value === serviceValue);
    setSelectedService(service || null);
    
    // Reset oil and brake wire types when service changes
    setSelectedOilType(null);
    setSelectedBrakeWireType(null);
  };

  const handleOilTypeChange = (e) => {
    const oilValue = e.target.value;
    setForm({ ...form, oilType: oilValue });
    
    // Find selected oil type details
    const oil = oilTypes.find(o => o.value === oilValue);
    setSelectedOilType(oil || null);
  };

  const handleBrakeWireTypeChange = (e) => {
    const brakeValue = e.target.value;
    setForm({ ...form, brakeWireType: brakeValue });
    
    // Find selected brake wire type details
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

  const handleImageError = () => {
    console.error("Image failed to load:", imageUrl);
    setImageError(true);
  };

  // Get service components based on selection
  const getServiceComponents = () => {
    if (!selectedService) return [];
    
    let components = [...selectedService.components];
    
    // Add subtype-specific components
    if (selectedService.value === 'oil-change' && selectedOilType) {
      components.push(`${selectedOilType.label} (5W-30)`);
    } else if (selectedService.value === 'brake-wire' && selectedBrakeWireType) {
      components.push(`${selectedBrakeWireType.label} (Front & Rear)`);
    }
    
    return components;
  };

  // Get service visualization text
  const getServiceVisualizationText = () => {
    if (!selectedService) return '';
    
    if (selectedService.value === 'oil-change' && selectedOilType) {
      return `${selectedOilType.label} Oil Change`;
    }
    
    if (selectedService.value === 'brake-wire' && selectedBrakeWireType) {
      return `${selectedBrakeWireType.label} Brake Wire Replacement`;
    }
    
    return selectedService.label;
  };

  return (
    <form
      onSubmit={submit}
      className="bg-white/60 backdrop-blur border border-slate-200 rounded-2xl shadow-md p-6 space-y-6 max-w-5xl lg:ml-64 mx-auto"
    >
      <h1 className="text-2xl font-semibold text-slate-800">
        {id ? 'Edit Service' : 'Add Service'}
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Customer Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Customer</label>
          <select
            className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 focus:ring-indigo-300"
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            required
          >
            <option value="">Select customer</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.fullName} (#{c.id}) - {c.carMake} {c.carModel}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
          <input
            type="date"
            className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 focus:ring-indigo-300"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </div>

        {/* Service Type Selection */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-600 mb-1">Service Type</label>
          <select
            className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 focus:ring-indigo-300"
            value={form.type}
            onChange={handleServiceChange}
            required
          >
            <option value="">Select service type</option>
            {serviceTypes.map(service => (
              <option key={service.value} value={service.value}>
                {service.label}
              </option>
            ))}
          </select>
        </div>

        {/* Oil Type Selection (only for oil change) */}
        {selectedService?.value === 'oil-change' && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-1">Oil Type</label>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 focus:ring-indigo-300"
              value={form.oilType || ''}
              onChange={handleOilTypeChange}
              required
            >
              <option value="">Select oil type</option>
              {oilTypes.map(oil => (
                <option key={oil.value} value={oil.value}>
                  {oil.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Brake Wire Type Selection (only for brake wire) */}
        {selectedService?.value === 'brake-wire' && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-1">Brake Wire Type</label>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 focus:ring-indigo-300"
              value={form.brakeWireType || ''}
              onChange={handleBrakeWireTypeChange}
              required
            >
              <option value="">Select brake wire type</option>
              {brakeWireTypes.map(brakeWire => (
                <option key={brakeWire.value} value={brakeWire.value}>
                  {brakeWire.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Service Details Display */}
        {selectedService && (
          <div className="md:col-span-2 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
            <h3 className="font-medium text-indigo-800">{selectedService.label}</h3>
            <p className="text-sm text-slate-600 mt-1">{selectedService.description}</p>
            <div className="mt-2">
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Components Included:</h4>
              <ul className="mt-1 grid grid-cols-2 gap-1">
                {getServiceComponents().map((component, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex items-center">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></span>
                    {component}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Service Image Display */}
        {selectedService && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Service Visualization
            </label>
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              {/* Image Name Header */}
              <div className="bg-indigo-600 text-white px-4 py-2 font-medium text-sm">
                {customer ? `${customer.carMake || 'Vehicle'} ${customer.carModel || 'Service'}` : 'Service Visualization'}
              </div>
              
              <div className="relative">
                {!imageError ? (
                  <img 
                    src={imageUrl}
                    alt={getServiceVisualizationText()}
                    className="w-full h-64 object-cover"
                    onLoad={() => console.log("Image loaded successfully:", imageUrl)}
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-full h-64 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <div className="text-center p-6">
                      <div className="text-indigo-800 text-2xl font-bold mb-3">
                        {getServiceVisualizationText()}
                      </div>
                      <div className="text-indigo-600 text-lg mb-2">
                        {customer ? `${customer.carMake} ${customer.carModel}` : 'Vehicle Service'}
                      </div>
                      <div className="text-indigo-500 text-sm">
                        Professional automotive service
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Image Overlay Badge */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded-lg text-xs font-medium">
                  {getServiceVisualizationText()}
                </div>
              </div>
              
              <div className="p-3 bg-white border-t border-slate-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {getServiceVisualizationText()}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      For: {customer ? `${customer.carMake || 'Unknown'} ${customer.carModel || 'Vehicle'} • ${customer.fullName || 'Customer'}` : 'Vehicle Service'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {getServiceComponents().length} components
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Parts Cost */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Parts Cost</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 focus:ring-indigo-300"
            value={form.partsCost}
            onChange={(e) => setForm({ ...form, partsCost: e.target.value })}
          />
        </div>

        {/* Labor Cost */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Labor Cost</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 focus:ring-indigo-300"
            value={form.laborCost}
            onChange={(e) => setForm({ ...form, laborCost: e.target.value })}
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
          <select
            className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 focus:ring-indigo-300"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {['Unpaid', 'Paid', 'In Progress'].map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="bg-gray-200 hover:bg-gray-300 text-slate-800 rounded-xl px-6 py-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2"
        >
          Save
        </button>
      </div>
    </form>
  );
}