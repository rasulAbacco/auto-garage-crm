// client/src/pages/billing/Invoice.jsx
import React, { useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getInvoice, listClients } from '../../lib/storage.js'
import {
  FiArrowLeft,
  FiPrinter,
  FiDownload,
  FiCalendar,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCreditCard,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiTool,
  FiFileText,
  FiDollarSign,
  FiHash,
  FiInfo
} from 'react-icons/fi'
import { FaCar } from "react-icons/fa";
import { useTheme } from '../../contexts/ThemeContext'

export default function Invoice() {
  const { id } = useParams()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const printRef = useRef()
  
  const inv = getInvoice(id)
  const clients = listClients()
  const c = clients.find(c => Number(c.id) === Number(inv?.customerId))

  if (!inv) {
    return (
      <div className={`lg:ml-16 min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className={`w-24 h-24 mx-auto rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'} flex items-center justify-center mb-4`}>
            <FiFileText className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Invoice Not Found</h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mb-6`}>The invoice you're looking for doesn't exist.</p>
          <Link 
            to="/billing"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg"
          >
            <FiArrowLeft />
            Back to Billing
          </Link>
        </div>
      </div>
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

  // Get payment status configuration
  const getPaymentStatus = () => {
    const status = inv.paymentStatus?.toLowerCase() || 'pending'
    
    const statusConfig = {
      'paid': {
        text: 'Paid',
        icon: FiCheckCircle,
        colorLight: 'bg-green-50 text-green-700 border-green-200',
        colorDark: 'bg-green-900/30 text-green-400 border-green-700',
        badge: 'bg-green-500'
      },
      'partial': {
        text: 'Partial Payment',
        icon: FiClock,
        colorLight: 'bg-blue-50 text-blue-700 border-blue-200',
        colorDark: 'bg-blue-900/30 text-blue-400 border-blue-700',
        badge: 'bg-blue-500'
      },
      'overdue': {
        text: 'Overdue',
        icon: FiAlertCircle,
        colorLight: 'bg-red-50 text-red-700 border-red-200',
        colorDark: 'bg-red-900/30 text-red-400 border-red-700',
        badge: 'bg-red-500'
      },
      'pending': {
        text: 'Pending',
        icon: FiClock,
        colorLight: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        colorDark: 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
        badge: 'bg-yellow-500'
      }
    }

    return statusConfig[status] || statusConfig.pending
  }

  const paymentStatus = getPaymentStatus()
  const StatusIcon = paymentStatus.icon

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    alert('PDF download feature coming soon!')
  }

  return (
    <div className={`lg:ml-16 p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen print:bg-white print:p-0`}>
      {/* Action Bar - Hidden on Print */}
      <div className="mb-6 print:hidden">
        <div className="flex items-center justify-between">
          <Link 
            to="/billing"
            className={`inline-flex items-center gap-2 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200`}
          >
            <FiArrowLeft />
            <span className="font-medium">Back to Billing</span>
          </Link>

          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300'
              }`}
            >
              <FiPrinter size={18} />
              Print Invoice
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg"
            >
              <FiDownload size={18} />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Container */}
      <div 
        ref={printRef}
        className={`max-w-5xl mx-auto ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none`}
      >
        {/* Invoice Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 print:bg-gradient-to-r">
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              {/* Company Info */}
              <div className="text-white">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                    <FiTool className="text-white" size={32} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black">Auto Garage</h1>
                    <p className="text-white/90">Professional Auto Services</p>
                  </div>
                </div>
                <div className="space-y-1 text-white/90 ml-20">
                  <div className="flex items-center gap-2">
                    <FiMapPin size={14} />
                    <span>Bengaluru, India</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMail size={14} />
                    <span>contact@autogarage.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPhone size={14} />
                    <span>+91 98765 43210</span>
                  </div>
                </div>
              </div>

              {/* Invoice Number & Status */}
              <div className="text-right text-white">
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border-2 border-white/30">
                  <p className="text-white/80 text-sm font-semibold mb-2">INVOICE</p>
                  <p className="text-4xl font-black mb-4">#{String(inv.id).padStart(4, '0')}</p>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold border-2 ${
                    isDark ? paymentStatus.colorDark : paymentStatus.colorLight
                  } bg-white`}>
                    <StatusIcon size={16} />
                    {paymentStatus.text}
                  </div>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 text-white/80 mb-1">
                  <FiCalendar size={16} />
                  <span className="text-sm font-semibold">Invoice Date</span>
                </div>
                <p className="text-white font-bold">{formatDate(inv.date)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 text-white/80 mb-1">
                  <FiCalendar size={16} />
                  <span className="text-sm font-semibold">Due Date</span>
                </div>
                <p className="text-white font-bold">{formatDate(inv.dueDate)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 text-white/80 mb-1">
                  <FiCreditCard size={16} />
                  <span className="text-sm font-semibold">Payment Mode</span>
                </div>
                <p className="text-white font-bold">{inv.mode || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mb-32" />
        </div>

        {/* Invoice Body */}
        <div className="p-8">
          {/* Bill To & Payment Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Bill To */}
            <div className={`p-6 rounded-2xl border-2 ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-blue-900/40' : 'bg-blue-500'} flex items-center justify-center`}>
                  <FiUser className={`${isDark ? 'text-blue-400' : 'text-white'}`} size={20} />
                </div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Bill To</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Customer Name</p>
                  <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {c?.fullName || 'Unknown Client'}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Address</p>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {c?.address || 'No address provided'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Phone</p>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{c?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Email</p>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} truncate`}>{c?.email || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div className={`p-6 rounded-2xl border-2 ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-purple-50 border-purple-200'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-purple-900/40' : 'bg-purple-500'} flex items-center justify-center`}>
                  <FiTool className={`${isDark ? 'text-purple-400' : 'text-white'}`} size={20} />
                </div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Service Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <FaCar className={isDark ? 'text-blue-400' : 'text-blue-600'} size={14} />
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Vehicle</p>
                  </div>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {inv.vehicle || c?.vehicleMake + ' ' + c?.vehicleModel || 'N/A'}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <FiCalendar className={isDark ? 'text-purple-400' : 'text-purple-600'} size={14} />
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Service Date</p>
                  </div>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatDate(inv.serviceDate) || formatDate(inv.date)}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-white'} col-span-2`}>
                  <div className="flex items-center gap-2 mb-1">
                    <FiUser className={isDark ? 'text-green-400' : 'text-green-600'} size={14} />
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Technician</p>
                  </div>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {inv.mechanic || c?.staffPerson || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Service Description */}
          {inv.description && (
            <div className={`mb-8 p-6 rounded-2xl border-2 ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-200'} flex items-center justify-center`}>
                  <FiInfo className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`} size={20} />
                </div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Service Description</h3>
              </div>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                {inv.description}
              </p>
            </div>
          )}

          {/* Invoice Items Table */}
          <div className={`mb-8 rounded-2xl border-2 overflow-hidden ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
            <table className="w-full">
              <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <tr>
                  <th className={`text-left p-4 font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Description</th>
                  <th className={`text-right p-4 font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Amount</th>
                </tr>
              </thead>
              <tbody className={isDark ? 'bg-gray-800/50' : 'bg-white'}>
                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className={`p-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className="flex items-center gap-2">
                      <FiTool className={isDark ? 'text-blue-400' : 'text-blue-600'} size={16} />
                      Parts Cost
                    </div>
                  </td>
                  <td className={`p-4 text-right font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    ${partsCost.toFixed(2)}
                  </td>
                </tr>
                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className={`p-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className="flex items-center gap-2">
                      <FiUser className={isDark ? 'text-purple-400' : 'text-purple-600'} size={16} />
                      Labor Cost
                    </div>
                  </td>
                  <td className={`p-4 text-right font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    ${laborCost.toFixed(2)}
                  </td>
                </tr>
                <tr className={`border-b ${isDark ? 'border-gray-700 bg-gray-700/30' : 'border-gray-200 bg-gray-50'}`}>
                  <td className={`p-4 font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Subtotal</td>
                  <td className={`p-4 text-right font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    ${subtotal.toFixed(2)}
                  </td>
                </tr>
                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className={`p-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <div className="flex items-center gap-2">
                      <FiHash className={isDark ? 'text-green-400' : 'text-green-600'} size={16} />
                      Taxes
                    </div>
                  </td>
                  <td className={`p-4 text-right font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    ${taxes.toFixed(2)}
                  </td>
                </tr>
                {discounts > 0 && (
                  <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className={`p-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center gap-2">
                        <FiDollarSign className={isDark ? 'text-orange-400' : 'text-orange-600'} size={16} />
                        Discounts
                      </div>
                    </td>
                    <td className={`p-4 text-right font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                      -${discounts.toFixed(2)}
                    </td>
                  </tr>
                )}
                <tr className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                  <td className="p-6 font-black text-white text-lg">
                    <div className="flex items-center gap-2">
                      <FiDollarSign size={20} />
                      GRAND TOTAL
                    </div>
                  </td>
                  <td className="p-6 text-right font-black text-white text-2xl">
                    ${total.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Information */}
          <div className={`mb-8 p-6 rounded-2xl border-2 ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-green-900/40' : 'bg-green-500'} flex items-center justify-center`}>
                <FiCreditCard className={`${isDark ? 'text-green-400' : 'text-white'}`} size={20} />
              </div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment Information</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Bank Name', value: 'Auto Garage Bank' },
                { label: 'Account Number', value: '1234567890' },
                { label: 'IFSC Code', value: 'AUTG0001234' },
                { label: 'Branch', value: 'Bengaluru Main' }
              ].map((item, idx) => (
                <div key={idx} className={`p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{item.label}</p>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className={`text-center p-6 rounded-2xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <p className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Thank You for Your Business!
            </p>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Please contact us if you have any questions about this invoice.
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            margin: 0.5cm;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:bg-white {
            background-color: white !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          
          .print\\:p-0 {
            padding: 0 !important;
          }
          
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  )
}