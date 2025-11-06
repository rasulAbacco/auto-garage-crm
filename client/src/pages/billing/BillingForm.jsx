// client/src/pages/billing/BillingForm.jsx
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  FiFileText, FiCalendar, FiUser, FiTool, FiDollarSign, FiSave, FiX,
  FiArrowLeft, FiHash, FiPercent, FiTag, FiAlertCircle, FiCreditCard, FiCheckCircle
} from 'react-icons/fi'
import { useTheme } from '../../contexts/ThemeContext'

const API_URL = import.meta.env.VITE_API_BASE_URL;

// 🔐 Auth helper
const getAuthToken = () => localStorage.getItem('token') || localStorage.getItem('authToken');
const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  if (!token) throw new Error('No authentication token found');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
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
  vehicle: '',
  mechanic: '',
  customerId: '',
  description: '',
  partsCost: 0,
  partsGst: 0,
  laborCost: 0,
  laborGst: 0,
  taxes: 0,
  discounts: 0,
  total: 0,
  paymentMode: '',
  status: 'Pending',
  dueDate: '',
  notes: ''
};

export default function BillingForm() {
  const [form, setForm] = useState(empty);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Fetch clients safely
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetchWithAuth(`${API_URL}/api/clients?page=1&limit=100`);
        const data = await response.json();

        if (Array.isArray(data)) {
          setClients(data);
        } else if (Array.isArray(data.data)) {
          setClients(data.data);
        } else if (Array.isArray(data.clients)) {
          setClients(data.clients);
        } else {
          setClients([]);
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching clients:", err);
      }
    };

    fetchClients();
  }, []);

  const generateInvoiceId = () =>
    `INV-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();

  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const getDueDate = (days = 30) => {
    const due = new Date();
    due.setDate(due.getDate() + days);
    return due.toISOString().split('T')[0];
  };

  // ✅ Auto-prefill when coming from Service page
  useEffect(() => {
    if (location.state) {
      const {
        serviceId,
        clientId,
        customerId,
        description,
        partsCost,
        laborCost,
        vehicle,
      } = location.state;

      const linkedClientId = clientId || customerId || "";

      setForm((f) => ({
        ...f,
        id: serviceId ? `INV${serviceId}` : generateInvoiceId(),
        date: f.date || getTodayDate(),
        vehicle: vehicle || "",
        customerId: linkedClientId,
        description: description || "",
        partsCost: partsCost || 0,
        laborCost: laborCost || 0,
        dueDate: f.dueDate || getDueDate(),
      }));
    } else {
      setForm((f) => ({
        ...f,
        id: generateInvoiceId(),
        date: getTodayDate(),
        dueDate: getDueDate(),
      }));
    }
  }, [location.state]);

  // ✅ Auto-total calculation including GST
  useEffect(() => {
    const partsTotal =
      Number(form.partsCost || 0) + (Number(form.partsCost || 0) * Number(form.partsGst || 0)) / 100;
    const laborTotal =
      Number(form.laborCost || 0) + (Number(form.laborCost || 0) * Number(form.laborGst || 0)) / 100;
    const subtotal = partsTotal + laborTotal;
    const total =
      subtotal + Number(form.taxes || 0) - Number(form.discounts || 0);
    setForm(f => ({ ...f, total }));
  }, [form.partsCost, form.laborCost, form.partsGst, form.laborGst, form.taxes, form.discounts]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        clientId: Number(form.customerId),
        serviceIds: location.state?.serviceId ? [location.state.serviceId] : [],
        totalAmount: Number(form.partsCost || 0) + Number(form.laborCost || 0),
        partsCost: Number(form.partsCost || 0),
        laborCost: Number(form.laborCost || 0),
        partsGst: Number(form.partsGst || 0),
        laborGst: Number(form.laborGst || 0),
        tax: Number(form.taxes || 0),
        discount: Number(form.discounts || 0),
        grandTotal: Number(form.total || 0),
        paymentMode: form.paymentMode || null,
        status: form.status || "Pending",
        dueDate: form.dueDate ? new Date(form.dueDate) : null,
        notes: `${form.description}\n\nVehicle: ${form.vehicle}\nMechanic: ${form.mechanic}`,
      };

      const response = await fetchWithAuth(`${API_URL}/api/invoices`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to create invoice");
      const data = await response.json();
      navigate(`/billing/${data.invoice.id}`);
    } catch (err) {
      setError(err.message);
      console.error("Error creating invoice:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg:ml-16 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/billing" className={`inline-flex items-center gap-2 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} mb-3`}>
            <FiArrowLeft /> <span>Back to Billing</span>
          </Link>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Create Invoice</h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Generate a new billing invoice</p>
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

      {/* ================= FORM ================= */}
      <form onSubmit={submit} className="space-y-6">
        {/* Invoice Info */}
        <div className={`rounded-3xl shadow-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="p-6 grid md:grid-cols-2 gap-6">
            <Input label="Invoice Number" icon={<FiHash />} value={form.id} readOnly isDark={isDark} />
            <Input label="Invoice Date" icon={<FiCalendar />} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} isDark={isDark} />
            {/* <Input label="Due Date" icon={<FiCalendar />} type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} isDark={isDark} /> */}

            {/* Customer Dropdown */}
            <div>
              <label className="block font-semibold mb-2 flex items-center gap-2">
                <FiUser /> Customer
              </label>
              <select
                name="customerId"
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                required
                className={`w-full rounded-xl border p-3 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="">Select Customer</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.regNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className={`rounded-3xl shadow-xl border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className="font-bold text-xl flex items-center gap-2 mb-4">
            <FiDollarSign /> Cost Breakdown
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Input label="Parts Cost" icon={<FiTool />} type="number" value={form.partsCost} onChange={(e) => setForm({ ...form, partsCost: e.target.value })} isDark={isDark} />
            <Input label="Parts GST (%)" icon={<FiPercent />} type="number" value={form.partsGst} onChange={(e) => setForm({ ...form, partsGst: e.target.value })} isDark={isDark} />
            <Input label="Labor Cost" icon={<FiUser />} type="number" value={form.laborCost} onChange={(e) => setForm({ ...form, laborCost: e.target.value })} isDark={isDark} />
            <Input label="Labor GST (%)" icon={<FiPercent />} type="number" value={form.laborGst} onChange={(e) => setForm({ ...form, laborGst: e.target.value })} isDark={isDark} />
            <Input label="Additional Taxes" icon={<FiTag />} type="number" value={form.taxes} onChange={(e) => setForm({ ...form, taxes: e.target.value })} isDark={isDark} />
            <Input label="Discounts" icon={<FiTag />} type="number" value={form.discounts} onChange={(e) => setForm({ ...form, discounts: e.target.value })} isDark={isDark} />
          </div>

          {/* Payment Mode & Status */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block font-semibold mb-2 flex items-center gap-2">
                <FiCreditCard /> Payment Mode
              </label>
              <select
                name="paymentMode"
                value={form.paymentMode}
                onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                className={`w-full rounded-xl border p-3 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="">Select Payment Mode</option>
                <option value="Cash">Cash Payment</option>
                <option value="UPI">UPI Payment</option>
                <option value="Card">Card Payment</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-2 flex items-center gap-2">
                <FiCheckCircle /> Payment Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className={`w-full rounded-xl border p-3 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between mt-6 border-t pt-4">
            <p className="font-semibold text-lg">Grand Total:</p>
            <p className="font-bold text-green-500 text-2xl">${form.total.toFixed(2)}</p>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-xl disabled:opacity-70"
          >
            {loading ? 'Saving...' : <><FiSave /> Create Invoice</>}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-700 border-gray-300'} flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg border`}
          >
            <FiX /> Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

/* Reusable Input Component */
function Input({ label, icon, type = "text", value, onChange, readOnly, isDark }) {
  return (
    <div>
      <label className="block font-semibold mb-2 flex items-center gap-2">
        {icon} {label}
      </label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={onChange}
        className={`w-full rounded-xl border p-3 ${readOnly ? 'opacity-80 cursor-not-allowed' : ''} ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
      />
    </div>
  );
}
