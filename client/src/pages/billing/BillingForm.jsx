// client/src/pages/billing/BillingForm.jsx
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  FiFileText,
  FiCalendar,
  FiUser,
  FiTool,
  FiDollarSign,
  FiSave,
  FiX,
  FiArrowLeft,
  FiHash,
  FiPercent,
  FiTag,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi'
import { FaCar } from "react-icons/fa";
import { useTheme } from '../../contexts/ThemeContext'
const API_URL = import.meta.env.VITE_API_BASE_URL;

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token') || localStorage.getItem('authToken');
};

// Helper function to make authenticated API requests
const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('No authentication token found');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Token might be expired or invalid
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }

  return response;
};

const empty = {
  id: '',
  date: '',
  serviceDate: '',
  vehicle: '',
  mechanic: '',
  customerId: '',
  description: '',
  partsCost: 0,
  laborCost: 0,
  taxes: 0,
  discounts: 0,
  total: 0,
  status: 'Pending',
  dueDate: '',
  notes: ''
};

export default function BillingForm() {
  const [form, setForm] = useState(empty)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  // Fetch clients from API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetchWithAuth(`${API_URL}/api/clients`);
        if (!response.ok) {
          throw new Error('Failed to fetch clients');
        }
        const data = await response.json();
        setClients(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching clients:', err);
      }
    };

    fetchClients();
  }, []);

  const generateInvoiceId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `INV-${timestamp}-${randomStr}`.toUpperCase();
  }

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const getDueDate = (days = 30) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    const year = dueDate.getFullYear();
    const month = String(dueDate.getMonth() + 1).padStart(2, '0');
    const day = String(dueDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    if (location.state) {
      const { serviceId, customerId, description, partsCost, laborCost, vehicle } = location.state
      const id = serviceId ? `INV${serviceId}` : generateInvoiceId()
      setForm(f => ({
        ...f,
        id,
        date: f.date || getTodayDate(),
        serviceDate: f.serviceDate || getTodayDate(),
        vehicle: vehicle || '',
        customerId: customerId || '',
        description: description || '',
        partsCost: partsCost || 0,
        laborCost: laborCost || 0,
        mechanic: '',
        dueDate: f.dueDate || getDueDate(),
      }))
    } else {
      setForm(f => ({
        ...f,
        id: generateInvoiceId(),
        date: getTodayDate(),
        serviceDate: getTodayDate(),
        dueDate: getDueDate(),
      }))
    }
  }, [location.state])

  useEffect(() => {
    const total =
      Number(form.partsCost || 0) +
      Number(form.laborCost || 0) +
      Number(form.taxes || 0) -
      Number(form.discounts || 0)
    setForm(f => ({ ...f, total }))
  }, [form.partsCost, form.laborCost, form.taxes, form.discounts])

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        clientId: Number(form.customerId),
        serviceIds: location.state?.serviceId ? [location.state.serviceId] : [], // ✅ FIXED HERE
        totalAmount: Number(form.partsCost || 0) + Number(form.laborCost || 0),
        tax: Number(form.taxes || 0),
        discount: Number(form.discounts || 0),
        grandTotal: Number(form.total || 0),
        status: form.status || "Pending",
        dueDate: form.dueDate ? new Date(form.dueDate) : null,
        notes: `${form.description}\n\nVehicle: ${form.vehicle}\nMechanic: ${form.mechanic}`,
      };

      const response = await fetchWithAuth(`${API_URL}/api/invoices`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create invoice");
      }

      const data = await response.json();
      navigate(`/billing/${data.invoice.id}`);
    } catch (err) {
      setError(err.message);
      console.error("Error creating invoice:", err);
    } finally {
      setLoading(false);
    }
  };


  const selectedCustomer = clients.find(c => c.id === Number(form.customerId));

  const subtotal = Number(form.partsCost || 0) + Number(form.laborCost || 0);

  return (
    <div className="lg:ml-16 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/billing"
            className={`inline-flex items-center gap-2 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200 mb-3`}
          >
            <FiArrowLeft />
            <span className="font-medium">Back to Billing</span>
          </Link>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Create Invoice
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            Generate a new billing invoice
          </p>
        </div>
      </div>

      {error && (
        <div className={`p-4 rounded-xl ${isDark ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'} border-2`}>
          <div className="flex items-center gap-3">
            <FiAlertCircle className={isDark ? 'text-red-400' : 'text-red-600'} size={20} />
            <p className={isDark ? 'text-red-300' : 'text-red-700'}>{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-6">
        {/* Invoice Information */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-xl border overflow-hidden`}>
          <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' : 'border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600'}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FiFileText className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Invoice Information</h2>
                <p className="text-sm text-white/80">Basic invoice and service details</p>
              </div>
            </div>
          </div>

          <div className="p-6 grid md:grid-cols-2 gap-6">
            {/* Invoice Number */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                <FiHash size={16} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                Invoice Number
              </label>
              <input
                type="text"
                readOnly
                className={`w-full px-4 py-3 rounded-xl font-mono font-bold transition-all duration-200 ${isDark
                    ? 'bg-gray-700/50 border-gray-600 text-blue-400'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
                  } border-2 cursor-not-allowed`}
                value={form.id}
              />
            </div>

            {/* Invoice Date */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                <FiCalendar size={16} className={isDark ? 'text-green-400' : 'text-green-600'} />
                Invoice Date <span className="text-red-500">*</span>
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

            {/* Due Date */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                <FiCalendar size={16} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white focus:bg-gray-600 focus:border-purple-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:bg-gray-50 focus:border-purple-500'
                  } border-2 focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
            </div>

            {/* Customer */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                <FiUser size={16} className={isDark ? 'text-orange-400' : 'text-orange-600'} />
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white focus:bg-gray-600 focus:border-orange-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:bg-gray-50 focus:border-orange-500'
                  } border-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                required
              >
                <option value="">Select customer</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} (#{c.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                <FaCar size={16} className={isDark ? 'text-teal-400' : 'text-teal-600'} />
                Vehicle <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600 focus:border-teal-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:border-teal-500'
                  } border-2 focus:outline-none focus:ring-2 focus:ring-teal-500/20`}
                value={form.vehicle || (selectedCustomer ? `${selectedCustomer.vehicleMake} ${selectedCustomer.vehicleModel}` : '')}
                onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
                placeholder="Enter vehicle details"
                required
              />
            </div>

            {/* Mechanic */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                <FiTool size={16} className={isDark ? 'text-pink-400' : 'text-pink-600'} />
                Technician/Mechanic <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600 focus:border-pink-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:border-pink-500'
                  } border-2 focus:outline-none focus:ring-2 focus:ring-pink-500/20`}
                value={form.mechanic || (selectedCustomer?.staffPerson || '')}
                onChange={(e) => setForm({ ...form, mechanic: e.target.value })}
                placeholder="Enter technician name"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                <FiFileText size={16} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
                Service Description
              </label>
              <textarea
                className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:border-blue-500'
                  } border-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                rows="3"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Enter service description..."
              />
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-xl border overflow-hidden`}>
          <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' : 'border-gray-200 bg-gradient-to-r from-green-600 to-teal-600'}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FiDollarSign className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Cost Breakdown</h2>
                <p className="text-sm text-white/80">Parts, labor, taxes and discounts</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Parts Cost */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                  <FiTool size={16} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                  Parts Cost
                </label>
                <div className="relative">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`w-full pl-8 pr-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600 focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:border-blue-500'
                      } border-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    value={form.partsCost}
                    onChange={(e) => setForm({ ...form, partsCost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Labor Cost */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                  <FiUser size={16} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                  Labor Cost
                </label>
                <div className="relative">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`w-full pl-8 pr-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600 focus:border-purple-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:border-purple-500'
                      } border-2 focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                    value={form.laborCost}
                    onChange={(e) => setForm({ ...form, laborCost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Taxes */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                  <FiPercent size={16} className={isDark ? 'text-green-400' : 'text-green-600'} />
                  Taxes
                </label>
                <div className="relative">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`w-full pl-8 pr-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600 focus:border-green-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:border-green-500'
                      } border-2 focus:outline-none focus:ring-2 focus:ring-green-500/20`}
                    value={form.taxes}
                    onChange={(e) => setForm({ ...form, taxes: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Discounts */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                  <FiTag size={16} className={isDark ? 'text-orange-400' : 'text-orange-600'} />
                  Discounts
                </label>
                <div className="relative">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`w-full pl-8 pr-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600 focus:border-orange-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:border-orange-500'
                      } border-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
                    value={form.discounts}
                    onChange={(e) => setForm({ ...form, discounts: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Calculation Summary */}
            <div className={`p-5 rounded-2xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Subtotal:</span>
                  <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Taxes:</span>
                  <span className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>+${Number(form.taxes || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Discounts:</span>
                  <span className={`font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>-${Number(form.discounts || 0).toFixed(2)}</span>
                </div>
                <div className={`pt-3 border-t-2 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                  <div className="flex justify-between items-center">
                    <span className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>Grand Total:</span>
                    <span className={`font-black text-3xl bg-gradient-to-r ${isDark ? 'from-blue-400 to-purple-400' : 'from-blue-600 to-purple-600'
                      } bg-clip-text text-transparent`}>
                      ${form.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Selection */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-xl border overflow-hidden`}>
          <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' : 'border-gray-200 bg-gradient-to-r from-purple-600 to-pink-600'}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FiCheckCircle className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Invoice Status</h2>
                <p className="text-sm text-white/80">Set the current status of this invoice</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setForm({ ...form, status: 'Pending' })}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${form.status === 'Pending'
                    ? isDark
                      ? 'bg-yellow-900/30 border-yellow-500 shadow-lg'
                      : 'bg-yellow-50 border-yellow-500 shadow-lg'
                    : isDark
                      ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <div className={`text-lg font-bold ${form.status === 'Pending'
                    ? isDark ? 'text-yellow-400' : 'text-yellow-700'
                    : isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                  Pending
                </div>
                <p className={`text-sm mt-1 ${form.status === 'Pending'
                    ? isDark ? 'text-yellow-300' : 'text-yellow-600'
                    : isDark ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                  Awaiting payment
                </p>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, status: 'Paid' })}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${form.status === 'Paid'
                    ? isDark
                      ? 'bg-green-900/30 border-green-500 shadow-lg'
                      : 'bg-green-50 border-green-500 shadow-lg'
                    : isDark
                      ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <div className={`text-lg font-bold ${form.status === 'Paid'
                    ? isDark ? 'text-green-400' : 'text-green-700'
                    : isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                  Paid
                </div>
                <p className={`text-sm mt-1 ${form.status === 'Paid'
                    ? isDark ? 'text-green-300' : 'text-green-600'
                    : isDark ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                  Payment received
                </p>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, status: 'Overdue' })}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${form.status === 'Overdue'
                    ? isDark
                      ? 'bg-red-900/30 border-red-500 shadow-lg'
                      : 'bg-red-50 border-red-500 shadow-lg'
                    : isDark
                      ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <div className={`text-lg font-bold ${form.status === 'Overdue'
                    ? isDark ? 'text-red-400' : 'text-red-700'
                    : isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                  Overdue
                </div>
                <p className={`text-sm mt-1 ${form.status === 'Overdue'
                    ? isDark ? 'text-red-300' : 'text-red-600'
                    : isDark ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                  Payment past due
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-8 py-4 font-bold text-lg transition-all duration-200 shadow-xl hover:shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                <FiSave size={20} />
                Create Invoice
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl ${isDark
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
  )
}