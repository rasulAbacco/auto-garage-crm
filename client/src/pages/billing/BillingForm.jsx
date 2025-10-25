// BillingForm.jsx (updated)
import React, { useEffect, useState } from 'react'
import { upsertInvoice, listClients } from '../../lib/storage.js'
import { useLocation, useNavigate } from 'react-router-dom'

const empty = {
  id: '',
  date: '',
  serviceDate: '', // Added service date
  vehicle: '',     // Added vehicle
  mechanic: '',    // Added mechanic
  customerId: '',
  description: '',
  partsCost: 0,
  laborCost: 0,
  taxes: 0,
  discounts: 0,
  total: 0,
  mode: 'Cash',
  // Payment details
  upiId: '',
  upiApp: '',
  cardNumber: '',
  cardName: '',
  expiryDate: '',
  cvv: '',
  transactionId: '',
  paymentGateway: '',
}

export default function BillingForm() {
  const [form, setForm] = useState(empty)
  const navigate = useNavigate()
  const location = useLocation()
  const clients = listClients()

  // Function to generate a unique invoice ID
  const generateInvoiceId = () => {
    const timestamp = Date.now().toString(36); // Base36 timestamp
    const randomStr = Math.random().toString(36).substring(2, 8); // Random string
    return `INV-${timestamp}-${randomStr}`.toUpperCase();
  }

  // Function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
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
        serviceDate: f.serviceDate || getTodayDate(), // Auto-set service date
        vehicle: vehicle || '', // Auto-set vehicle if available
        customerId: customerId || '',
        description: description || '',
        partsCost: partsCost || 0,
        laborCost: laborCost || 0,
        mechanic: '', // Mechanic needs to be entered manually
      }))
    } else {
      setForm(f => ({
        ...f,
        id: generateInvoiceId(),
        date: getTodayDate(),
        serviceDate: getTodayDate(), // Auto-set service date for new invoices
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

  const handleModeChange = (e) => {
    const newMode = e.target.value;
    setForm(prev => ({
      ...prev,
      mode: newMode,
      // Reset payment details when mode changes
      upiId: '',
      upiApp: '',
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: '',
      transactionId: '',
      paymentGateway: '',
    }));
  };

  const handlePaymentDetailChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const submit = (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      customerId: Number(form.customerId),
    }
    upsertInvoice(payload)
    navigate(`/billing/${payload.id}`)
  }

  const renderPaymentDetails = () => {
    switch (form.mode) {
      case 'UPI':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">UPI ID</label>
              <input
                type="text"
                name="upiId"
                className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-300"
                value={form.upiId}
                onChange={handlePaymentDetailChange}
                placeholder="example@upi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">UPI App</label>
              <select
                className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-300"
                name="upiApp"
                value={form.upiApp}
                onChange={handlePaymentDetailChange}
              >
                <option value="">Select UPI App</option>
                <option value="Google Pay">Google Pay</option>
                <option value="PhonePe">PhonePe</option>
                <option value="Paytm">Paytm</option>
                <option value="BHIM UPI">BHIM UPI</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </>
        )
      case 'Card':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Card Number</label>
              <input
                type="text"
                name="cardNumber"
                className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-300"
                value={form.cardNumber}
                onChange={handlePaymentDetailChange}
                placeholder="1234 5678 9012 3456"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Cardholder Name</label>
              <input
                type="text"
                name="cardName"
                className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-300"
                value={form.cardName}
                onChange={handlePaymentDetailChange}
                placeholder="John Doe"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Expiry Date</label>
                <input
                  type="text"
                  name="expiryDate"
                  className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-300"
                  value={form.expiryDate}
                  onChange={handlePaymentDetailChange}
                  placeholder="MM/YY"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">CVV</label>
                <input
                  type="text"
                  name="cvv"
                  className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-300"
                  value={form.cvv}
                  onChange={handlePaymentDetailChange}
                  placeholder="123"
                />
              </div>
            </div>
          </>
        )
      case 'Online':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Transaction ID</label>
              <input
                type="text"
                name="transactionId"
                className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-300"
                value={form.transactionId}
                onChange={handlePaymentDetailChange}
                placeholder="TXN123456789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Payment Gateway</label>
              <select
                className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-300"
                name="paymentGateway"
                value={form.paymentGateway}
                onChange={handlePaymentDetailChange}
              >
                <option value="">Select Payment Gateway</option>
                <option value="PayPal">PayPal</option>
                <option value="Stripe">Stripe</option>
                <option value="Razorpay">Razorpay</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </>
        )
      default:
        return null
    }
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white/60 backdrop-blur border border-slate-200 rounded-2xl shadow-md p-6 space-y-6 max-w-5xl lg:ml-64 mx-auto"
    >
      <h1 className="text-2xl font-semibold text-slate-800">Create Invoice</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {[
          { label: 'Invoice No.', name: 'id', type: 'text', required: true, readOnly: true },
          { label: 'Date', name: 'date', type: 'date', required: true },
          { label: 'Service Date', name: 'serviceDate', type: 'date', required: true }, // Added service date
          { label: 'Vehicle', name: 'vehicle', type: 'text', required: true }, // Added vehicle
          { label: 'Mechanic', name: 'mechanic', type: 'text', required: true }, // Added mechanic
          {
            label: 'Customer',
            name: 'customerId',
            type: 'select',
            options: clients.map(c => ({ value: c.id, label: `${c.fullName} (#${c.id})` })),
            required: true,
          },
          { label: 'Description', name: 'description', type: 'text' },
          { label: 'Parts Cost', name: 'partsCost', type: 'number' },
          { label: 'Labor Cost', name: 'laborCost', type: 'number' },
          { label: 'Taxes', name: 'taxes', type: 'number' },
          { label: 'Discounts', name: 'discounts', type: 'number' },
          {
            label: 'Payment Mode',
            name: 'mode',
            type: 'select',
            options: ['Cash', 'Card', 'UPI', 'Online'].map(m => ({ value: m, label: m })),
            onChange: handleModeChange,
          },
          { label: 'Grand Total', name: 'total', type: 'text', readOnly: true },
        ].map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-slate-600 mb-1">{field.label}</label>
            {field.type === 'select' ? (
              <select
                className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-300"
                name={field.name}
                value={form[field.name]}
                onChange={field.onChange || ((e) => setForm({ ...form, [field.name]: e.target.value }))}
                required={field.required}
              >
                <option value="">Select {field.label.toLowerCase()}</option>
                {field.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                name={field.name}
                readOnly={field.readOnly}
                className={`w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur px-3 py-2 text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-300 ${field.readOnly ? 'bg-gray-100' : ''}`}
                value={form[field.name]}
                onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                required={field.required}
              />
            )}
          </div>
        ))}
      </div>

      {/* Payment Details Section */}
      {form.mode && form.mode !== 'Cash' && (
        <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Payment Details</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {renderPaymentDetails()}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="bg-gray-200 hover:bg-gray-300 rounded-xl px-6 py-2 font-semibold transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2 font-semibold transition"
        >
          Save
        </button>
      </div>
    </form>
  )
}