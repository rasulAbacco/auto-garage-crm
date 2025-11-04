// client/src/pages/billing/BillingList.jsx
import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SearchBar from '../../components/SearchBar.jsx'
import {
  FiEye,
  FiTrash2,
  FiPlus,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiFileText,
  FiCreditCard,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiDownload,
  FiPrinter,
  FiEdit,
  FiMail,
  FiPhone,
  FiTrendingUp,
  FiFilter,
  FiMoreVertical
} from 'react-icons/fi'
import { useTheme } from '../../contexts/ThemeContext'

const API_URL = import.meta.env.VITE_API_BASE_URL;


// Payment status configuration
const paymentStatuses = {
  'paid': {
    icon: FiCheckCircle,
    label: 'Paid',
    colorLight: 'bg-green-50 text-green-700 border-green-200',
    colorDark: 'bg-green-900/30 text-green-400 border-green-700'
  },
  'pending': {
    icon: FiClock,
    label: 'Pending',
    colorLight: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    colorDark: 'bg-yellow-900/30 text-yellow-400 border-yellow-700'
  },
  'overdue': {
    icon: FiAlertCircle,
    label: 'Overdue',
    colorLight: 'bg-red-50 text-red-700 border-red-200',
    colorDark: 'bg-red-900/30 text-red-400 border-red-700'
  },
  'default': {
    icon: FiFileText,
    label: 'Unknown',
    colorLight: 'bg-blue-50 text-blue-700 border-blue-200',
    colorDark: 'bg-blue-900/30 text-blue-400 border-blue-700'
  }
};

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

// Enhanced Invoice Card Component
const InvoiceCard = ({ invoice, onView, onDelete, index }) => {
  const { isDark } = useTheme();
  const [showActions, setShowActions] = useState(false);

  const status = paymentStatuses[invoice.status?.toLowerCase()] || paymentStatuses.default;
  const StatusIcon = status.icon;

  return (
    <div
      className={`group ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-2xl overflow-hidden transform hover:-translate-y-1`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Status Bar */}
      <div className={`h-2 ${invoice.status?.toLowerCase() === 'paid'
        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
        : invoice.status?.toLowerCase() === 'overdue'
          ? 'bg-gradient-to-r from-red-500 to-orange-500'
          : 'bg-gradient-to-r from-yellow-500 to-orange-500'
        }`} />

      <div className="p-6">
        <div className="flex items-start gap-6">
          {/* Invoice Badge with Animation */}
          <div className="flex-shrink-0 relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-xl transform transition-transform group-hover:scale-110 group-hover:rotate-3">
              <div className="text-center">
                <FiFileText className="text-white mx-auto mb-1 animate-pulse" size={28} />
                <p className="text-white text-xs font-bold tracking-wider">#{invoice.invoiceNumber}</p>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="flex-1 min-w-0">
            {/* Header Row */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Invoice #{invoice.invoiceNumber}
                  </h3>
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 flex items-center gap-1.5 ${isDark ? status.colorDark : status.colorLight
                    }`}>
                    <StatusIcon size={14} />
                    {status.label}
                  </span>
                </div>

                <p className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-1`}>
                  {invoice.notes || 'Service Invoice'}
                </p>
              </div>

              {/* Total Amount - Large Display */}
              <div className="text-right ml-6">
                <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Total Amount
                </p>
                <div className={`text-4xl font-black bg-gradient-to-r ${invoice.status?.toLowerCase() === 'paid'
                  ? 'from-green-600 to-emerald-600'
                  : 'from-blue-600 to-purple-600'
                  } bg-clip-text text-transparent`}>
                  ${Number(invoice.grandTotal || 0).toFixed(2)}
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  USD
                </p>
              </div>
            </div>

            {/* Info Grid - Enhanced */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Date */}
              <div className={`p-4 rounded-xl border-2 ${isDark
                ? 'bg-blue-900/20 border-blue-800/30'
                : 'bg-blue-50 border-blue-100'
                }`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg ${isDark ? 'bg-blue-900/40' : 'bg-blue-500'
                    } flex items-center justify-center`}>
                    <FiCalendar className={`${isDark ? 'text-blue-400' : 'text-white'}`} size={18} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      Invoice Date
                    </p>
                  </div>
                </div>
                <p className={`font-bold text-lg ml-13 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {new Date(invoice.createdAt).toLocaleDateString() || 'N/A'}
                </p>
              </div>

              {/* Customer */}
              <div className={`p-4 rounded-xl border-2 ${isDark
                ? 'bg-purple-900/20 border-purple-800/30'
                : 'bg-purple-50 border-purple-100'
                }`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg ${isDark ? 'bg-purple-900/40' : 'bg-purple-500'
                    } flex items-center justify-center`}>
                    <FiUser className={`${isDark ? 'text-purple-400' : 'text-white'}`} size={18} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                      Customer
                    </p>
                  </div>
                </div>
                <p className={`font-bold text-lg ml-13 truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {invoice.client?.fullName || `#${invoice.clientId}`}
                </p>
              </div>

              {/* Due Date */}
              <div className={`p-4 rounded-xl border-2 ${isDark
                ? 'bg-green-900/20 border-green-800/30'
                : 'bg-green-50 border-green-100'
                }`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg ${isDark ? 'bg-green-900/40' : 'bg-green-500'
                    } flex items-center justify-center`}>
                    <FiCreditCard className={`${isDark ? 'text-green-400' : 'text-white'}`} size={18} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      Due Date
                    </p>
                  </div>
                </div>
                <p className={`font-bold text-lg ml-13 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Customer Contact Info (if available) */}
            {invoice.client && (
              <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} mt-4`}>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {invoice.client.phone && (
                    <div className="flex items-center gap-2">
                      <FiPhone className={isDark ? 'text-blue-400' : 'text-blue-600'} size={14} />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{invoice.client.phone}</span>
                    </div>
                  )}
                  {invoice.client.email && (
                    <div className="flex items-center gap-2">
                      <FiMail className={isDark ? 'text-purple-400' : 'text-purple-600'} size={14} />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{invoice.client.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons - Vertical */}
          <div className="flex-shrink-0 flex flex-col gap-2">
            <button
              onClick={() => window.print()}
              className={`p-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${isDark
                ? 'bg-green-900/30 hover:bg-green-900/50 text-green-400 border-2 border-green-700/50 hover:border-green-600'
                : 'bg-green-50 hover:bg-green-100 text-green-600 border-2 border-green-200 hover:border-green-300'
                }`}
              title="Print Invoice"
            >
              <FiPrinter size={20} />
            </button>
            <button
              onClick={onView}
              className={`p-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${isDark
                ? 'bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border-2 border-blue-700/50 hover:border-blue-600'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-2 border-blue-200 hover:border-blue-300'
                }`}
              title="View Details"
            >
              <FiEye size={20} />
            </button>
            <button
              onClick={onView}
              className={`p-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${isDark
                ? 'bg-purple-900/30 hover:bg-purple-900/50 text-purple-400 border-2 border-purple-700/50 hover:border-purple-600'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-600 border-2 border-purple-200 hover:border-purple-300'
                }`}
              title="Edit Invoice"
            >
              <FiEdit size={20} />
            </button>
            <button
              onClick={onDelete}
              className={`p-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${isDark
                ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400 border-2 border-red-700/50 hover:border-red-600'
                : 'bg-red-50 hover:bg-red-100 text-red-600 border-2 border-red-200 hover:border-red-300'
                }`}
              title="Delete Invoice"
            >
              <FiTrash2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, gradient, delay }) => {
  const { isDark } = useTheme();

  return (
    <div
      className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-lg border transform transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {title}
          </p>
          <p className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </p>
        </div>
        <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-xl transform transition-transform hover:rotate-12`}>
          <Icon className="text-white" size={28} />
        </div>
      </div>
    </div>
  );
};

export default function BillingList() {
  const [q, setQ] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { isDark } = useTheme()
  const navigate = useNavigate()

  // Fetch invoices from API
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true)
        const response = await fetchWithAuth(`${API_URL}/api/invoices`)
        if (!response.ok) {
          throw new Error('Failed to fetch invoices')
        }
        const data = await response.json()
        setInvoices(data)
      } catch (err) {
        setError(err.message)
        console.error('Error fetching invoices:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [])

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    return invoices.filter(b => {
      const matchesSearch = [
        b.invoiceNumber,
        b.notes,
        new Date(b.createdAt).toLocaleDateString(),
        b.client?.fullName || ''
      ].some(v => String(v).toLowerCase().includes(term));

      const matchesFilter = filterStatus === 'all' || b.status?.toLowerCase() === filterStatus;

      return matchesSearch && matchesFilter;
    });
  }, [q, invoices, filterStatus])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.grandTotal || 0), 0);
    const paidInvoices = invoices.filter(inv => inv.status?.toLowerCase() === 'paid');
    const paidRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.grandTotal || 0), 0);
    const pendingInvoices = invoices.filter(inv => inv.status?.toLowerCase() !== 'paid');
    const pendingRevenue = pendingInvoices.reduce((sum, inv) => sum + Number(inv.grandTotal || 0), 0);

    return {
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      paidInvoices: paidInvoices.length,
      pendingInvoices: pendingInvoices.length,
      totalInvoices: invoices.length
    };
  }, [invoices]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      try {
        const response = await fetchWithAuth(`${API_URL}/api/invoices/${id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to delete invoice')
        }

        // Update state to remove the deleted invoice
        setInvoices(prevInvoices => prevInvoices.filter(invoice => invoice.id !== id))
      } catch (err) {
        setError(err.message)
        console.error('Error deleting invoice:', err)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className={`mt-4 text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Loading invoices...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className={`text-center p-8 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl max-w-md`}>
          <div className={`text-5xl mb-4 ${isDark ? 'text-red-400' : 'text-red-500'}`}>⚠️</div>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Error Loading Invoices</h2>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={`px-6 py-3 rounded-xl font-bold ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
          >
            Try Again
          </button>
          {error.includes('Session expired') && (
            <button
              onClick={() => navigate('/login')}
              className={`ml-4 px-6 py-3 rounded-xl font-bold ${isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white transition-colors`}
            >
              Login
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 lg:ml-16 p-6">
      {/* Enhanced Header Section */}
      <div className={`relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800' : 'bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600'} rounded-3xl p-8 shadow-2xl`}>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <FiFileText className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white mb-1">Billing & Invoices</h1>
              <p className="text-white/90 text-lg">Manage invoices and track payments efficiently</p>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Invoices"
          value={stats.totalInvoices}
          icon={FiFileText}
          gradient="from-blue-500 to-blue-600"
          delay={0}
        />
        <StatsCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          icon={FiDollarSign}
          gradient="from-green-500 to-emerald-600"
          delay={100}
        />
        <StatsCard
          title="Paid"
          value={stats.paidInvoices}
          icon={FiCheckCircle}
          gradient="from-green-500 to-teal-600"
          delay={200}
        />
        <StatsCard
          title="Pending"
          value={stats.pendingInvoices}
          icon={FiClock}
          gradient="from-yellow-500 to-orange-600"
          delay={300}
        />
      </div>

      {/* Search, Filter and Add Section */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-xl border`}>
        <div className="flex flex-col lg:flex-row items-center gap-4">
          {/* Search */}
          <div className="w-full lg:flex-1">
            <SearchBar
              value={q}
              onChange={setQ}
              placeholder="Search by invoice no, customer, description..."
            />
          </div>

          {/* Filter */}
          <div className="w-full lg:w-64">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                ? 'bg-gray-700 border-gray-600 text-white focus:bg-gray-600 focus:border-blue-500'
                : 'bg-white border-gray-300 text-gray-900 focus:bg-gray-50 focus:border-blue-500'
                } border-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Create Button */}
          <Link
            to="/billing/new"
            className="w-full lg:w-auto bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl px-8 py-3 font-bold transition-all duration-200 shadow-lg hover:shadow-2xl flex items-center justify-center gap-2 transform hover:scale-105"
          >
            <FiPlus size={20} />
            Create Invoice
          </Link>
        </div>

        {/* Quick Stats */}
        {filtered.length > 0 && (
          <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Showing:</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{filtered.length} invoices</span>
              </div>
              <div className="flex items-center gap-2">
                <FiDollarSign className={isDark ? 'text-green-400' : 'text-green-600'} size={16} />
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Filtered Total:</span>
                <span className={`font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                  ${filtered.reduce((sum, inv) => sum + Number(inv.grandTotal || 0), 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invoices List */}
      {filtered.length === 0 ? (
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl p-16 text-center shadow-xl border`}>
          <div className={`w-32 h-32 mx-auto rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center mb-6 animate-pulse`}>
            <FiFileText className={`w-16 h-16 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          </div>
          <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {q || filterStatus !== 'all' ? 'No Matching Invoices' : 'No Invoices Yet'}
          </h3>
          <p className={`text-lg mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {q || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first invoice to get started with billing'}
          </p>
          {!q && filterStatus === 'all' && (
            <Link
              to="/billing/new"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              <FiPlus size={24} />
              Create First Invoice
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((invoice, index) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onView={() => navigate(`/billing/${invoice.id}`)}
              onDelete={() => handleDelete(invoice.id)}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Enhanced Quick Actions */}
      {filtered.length > 0 && (
        <div className={`${isDark ? 'bg-gradient-to-r from-gray-800 to-gray-700 border-gray-700' : 'bg-gradient-to-r from-blue-50 to-purple-50 border-gray-200'} rounded-2xl p-6 shadow-xl border`}>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${isDark ? 'bg-blue-900/40' : 'bg-blue-500'} flex items-center justify-center`}>
                <FiTrendingUp className={`${isDark ? 'text-blue-400' : 'text-white'}`} size={24} />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick Actions</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Export and print options</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => window.print()}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl ${isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-white border-2 border-gray-600'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300'
                  }`}
              >
                <FiPrinter size={18} />
                Print All
              </button>
              <button
                onClick={() => alert('Export feature coming soon!')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl ${isDark
                  ? 'bg-green-900/30 hover:bg-green-900/50 text-green-400 border-2 border-green-700'
                  : 'bg-green-50 hover:bg-green-100 text-green-600 border-2 border-green-200'
                  }`}
              >
                <FiDownload size={18} />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}