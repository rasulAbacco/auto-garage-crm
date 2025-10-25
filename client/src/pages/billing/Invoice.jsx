// Invoice.jsx (unchanged)
import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { getInvoice, listClients } from '../../lib/storage.js'
import { currency } from '../../utils.js'

export default function Invoice() {
  const { id } = useParams()
  const inv = getInvoice(id)
  const clients = listClients()
  const c = clients.find(c => Number(c.id) === Number(inv?.customerId))

  if (!inv) {
    return (
      <div className="text-center text-gray-500 mt-10 text-lg font-medium">Invoice not found</div>
    )
  }

  // Calculate all invoice values
  const partsCost = Number(inv.partsCost || 0)
  const laborCost = Number(inv.laborCost || 0)
  const taxes = Number(inv.taxes || 0)
  const discounts = Number(inv.discounts || 0)
  const subtotal = partsCost + laborCost
  const total = subtotal + taxes - discounts

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Get payment status with styling
  const getPaymentStatus = () => {
    if (!inv.paymentStatus) return { text: 'Pending', class: 'bg-yellow-100 text-yellow-800' }
    
    switch(inv.paymentStatus.toLowerCase()) {
      case 'paid':
        return { text: 'Paid', class: 'bg-green-100 text-green-800' }
      case 'partial':
        return { text: 'Partial', class: 'bg-blue-100 text-blue-800' }
      case 'overdue':
        return { text: 'Overdue', class: 'bg-red-100 text-red-800' }
      default:
        return { text: inv.paymentStatus, class: 'bg-gray-100 text-gray-800' }
    }
  }

  const paymentStatus = getPaymentStatus()

  return (
    <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-2xl shadow-md p-8 print:bg-white print:shadow-none print:border-none lg:ml-64 p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center no-print mb-6">
        <div>
          <Link to="/billing" className="text-indigo-600 hover:underline font-medium">
            ← Back to Billing
          </Link>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => window.print()}
            className="bg-gray-900 text-white rounded-xl px-4 py-2 font-medium transition hover:bg-gray-800"
          >
            Print Invoice
          </button>
          <button className="bg-indigo-600 text-white rounded-xl px-4 py-2 font-medium transition hover:bg-indigo-700">
            Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 mb-8">
        <div>
          <div className="text-2xl font-bold text-gray-800">Auto Garage</div>
          <div className="text-sm text-gray-600 mt-1">Bengaluru, India</div>
          <div className="text-sm text-gray-600">contact@autogarage.com</div>
          <div className="text-sm text-gray-600">+91 98765 43210</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-gray-800">Invoice #{inv.id}</div>
          <div className="text-gray-600 mt-1">Date: {formatDate(inv.date)}</div>
          <div className="text-gray-600">Due Date: {formatDate(inv.dueDate)}</div>
          <div className="mt-2 inline-block px-3 py-1 rounded-full text-sm font-medium capitalize">
            <span className={paymentStatus.class}>{paymentStatus.text}</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500 mb-2">Bill To</div>
          <div className="font-semibold text-gray-800">{c?.fullName || 'Unknown Client'}</div>
          <div className="text-gray-600 mt-1">{c?.address || 'No address provided'}</div>
          <div className="text-gray-600">{c?.phone || 'No phone provided'}</div>
          <div className="text-gray-600">{c?.email || 'No email provided'}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500 mb-2">Payment Details</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-500">Payment Mode:</span>
              <div className="font-medium">{inv.mode || 'N/A'}</div>
            </div>
            <div>
              <span className="text-gray-500">Vehicle:</span>
              <div className="font-medium">{inv.vehicle || 'N/A'}</div>
            </div>
            <div>
              <span className="text-gray-500">Service Date:</span>
              <div className="font-medium">{formatDate(inv.serviceDate)}</div>
            </div>
            <div>
              <span className="text-gray-500">Mechanic:</span>
              <div className="font-medium">{inv.mechanic || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-2">Service Description</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          {inv.description || 'No description provided'}
        </div>
      </div>

      <table className="w-full text-sm mb-8 border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-3 border-b">Description</th>
            <th className="text-right p-3 border-b">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="p-3">Parts Cost</td>
            <td className="p-3 text-right">{currency(partsCost)}</td>
          </tr>
          <tr className="border-b">
            <td className="p-3">Labor Cost</td>
            <td className="p-3 text-right">{currency(laborCost)}</td>
          </tr>
          <tr className="border-b bg-gray-50">
            <td className="p-3 font-medium">Subtotal</td>
            <td className="p-3 text-right font-medium">{currency(subtotal)}</td>
          </tr>
          <tr className="border-b">
            <td className="p-3">Taxes</td>
            <td className="p-3 text-right">{currency(taxes)}</td>
          </tr>
          <tr className="border-b">
            <td className="p-3">Discounts</td>
            <td className="p-3 text-right">-{currency(discounts)}</td>
          </tr>
          <tr className="bg-gray-800 text-white">
            <td className="p-3 font-bold">Grand Total</td>
            <td className="p-3 text-right font-bold">{currency(total)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mb-6">
        <h3 className="font-semibold text-gray-800 mb-2">Payment Information</h3>
        <div className="bg-gray-50 p-4 rounded-lg text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-500">Bank Name:</span>
              <div className="font-medium">Auto Garage Bank</div>
            </div>
            <div>
              <span className="text-gray-500">Account Number:</span>
              <div className="font-medium">1234567890</div>
            </div>
            <div>
              <span className="text-gray-500">IFSC Code:</span>
              <div className="font-medium">AUTG0001234</div>
            </div>
            <div>
              <span className="text-gray-500">Branch:</span>
              <div className="font-medium">Bengaluru Main</div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500 mb-4">
        Thank you for your business! Please contact us if you have any questions about this invoice.
      </div>
      
      <div className="no-print text-center pt-4 border-t border-gray-200">
        <Link to="/billing" className="text-indigo-600 hover:underline font-medium">
          Back to Billing
        </Link>
      </div>
    </div>
  )
}