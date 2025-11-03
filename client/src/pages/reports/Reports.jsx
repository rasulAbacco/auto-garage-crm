// client/src/pages/reports/Reports.jsx
import React, { useState, useEffect } from 'react';
import { listServices, listBilling, listClients } from '../../lib/storage.js';
import {
  FiBarChart2,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiCalendar,
  FiFileText,
  FiPieChart,
  FiActivity,
  FiAward,
  FiFilter,
  FiRefreshCw,
  FiDownload,
  FiPrinter
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';

export default function Reports() {
  const [services, setServices] = useState([]);
  const [billing, setBilling] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportView, setReportView] = useState('monthly');
  const [revenueStartDate, setRevenueStartDate] = useState('');
  const [revenueEndDate, setRevenueEndDate] = useState('');
  const { isDark } = useTheme();

  useEffect(() => {
    const loadData = () => {
      setServices(listServices());
      setBilling(listBilling());
      setClients(listClients());
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className={`lg:ml-16 min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Loading reports...</p>
        </div>
      </div>
    );
  }

  // Core calculations
  const paidServices = services.filter(s => s.status === 'Paid');
  const unpaidServices = services.filter(s => s.status !== 'Paid');
  const totalServices = services.length;
  const paidPercentage = totalServices > 0 ? Math.round((paidServices.length / totalServices) * 100) : 0;
  const unpaidPercentage = totalServices > 0 ? Math.round((unpaidServices.length / totalServices) * 100) : 0;
  
  // Calculate revenue
  const calculateInvoiceTotal = (invoice) => {
    const partsCost = Number(invoice.partsCost || 0);
    const laborCost = Number(invoice.laborCost || 0);
    const taxes = Number(invoice.taxes || 0);
    const discounts = Number(invoice.discounts || 0);
    return partsCost + laborCost + taxes - discounts;
  };
  
  const revenue = billing.reduce((total, invoice) => total + calculateInvoiceTotal(invoice), 0);
  const avgServiceValue = billing.length > 0 ? revenue / billing.length : 0;
  
  // Date utilities
  const monthKey = (d) => {
    const dt = new Date(d);
    return isNaN(dt) ? 'Unknown' : dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
  };

  const getMonthName = (monthKey) => {
    if (monthKey === 'Unknown') return 'Unknown';
    const [year, month] = monthKey.split('-');
    return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const dateKey = (d) => {
    const dt = new Date(d);
    return isNaN(dt) ? 'Unknown' : dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  };

  const getFormattedDate = (dateKey) => {
    if (dateKey === 'Unknown') return 'Unknown';
    const [year, month, day] = dateKey.split('-');
    return new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Revenue aggregations
  const revenueByMonth = billing.reduce((acc, b) => {
    const k = monthKey(b.date);
    acc[k] = (acc[k] || 0) + calculateInvoiceTotal(b);
    return acc;
  }, {});

  const revenueByDate = billing.reduce((acc, b) => {
    const k = dateKey(b.date);
    acc[k] = (acc[k] || 0) + calculateInvoiceTotal(b);
    return acc;
  }, {});

  // Status distribution
  const statusCounts = services.reduce((acc, service) => {
    acc[service.status] = (acc[service.status] || 0) + 1;
    return acc;
  }, {});

  // Top revenue periods
  const topMonths = Object.entries(revenueByMonth)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([month, revenue]) => ({ month, monthName: getMonthName(month), revenue }));

  const topDates = Object.entries(revenueByDate)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([date, revenue]) => ({ date, formattedDate: getFormattedDate(date), revenue }));

  // Recent invoices
  const recentInvoices = [...billing]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map(invoice => {
      const customer = clients.find(c => c.id === Number(invoice.customerId));
      return {
        ...invoice,
        total: calculateInvoiceTotal(invoice),
        formattedDate: getFormattedDate(dateKey(invoice.date)),
        customerName: customer?.fullName || `Customer #${invoice.customerId}`
      };
    });

  // Year comparison data
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Filtered revenue data
  const filteredRevenueBilling = billing.filter(invoice => {
    if (!revenueStartDate && !revenueEndDate) return true;
    const invoiceDate = new Date(invoice.date);
    const start = revenueStartDate ? new Date(revenueStartDate) : new Date('1900-01-01');
    const end = revenueEndDate ? new Date(revenueEndDate) : new Date('2100-12-31');
    return invoiceDate >= start && invoiceDate <= end;
  });

  const filteredRevenueByMonth = filteredRevenueBilling.reduce((acc, b) => {
    const k = monthKey(b.date);
    acc[k] = (acc[k] || 0) + calculateInvoiceTotal(b);
    return acc;
  }, {});

  const filteredRevenueByDate = filteredRevenueBilling.reduce((acc, b) => {
    const k = dateKey(b.date);
    acc[k] = (acc[k] || 0) + calculateInvoiceTotal(b);
    return acc;
  }, {});

  // Report data
  const getReportData = () => {
    if (reportView === 'monthly') {
      return monthNames.map((month, index) => {
        const prevYearKey = `${previousYear}-${months[index]}`;
        const currYearKey = `${currentYear}-${months[index]}`;
        
        const prevYearRevenue = filteredRevenueByMonth[prevYearKey] || 0;
        const currYearRevenue = filteredRevenueByMonth[currYearKey] || 0;
        const difference = currYearRevenue - prevYearRevenue;
        const percentageChange = prevYearRevenue > 0 ? Math.round((difference / prevYearRevenue) * 100) : 0;
        
        return {
          period: month,
          currentYear: currYearRevenue,
          previousYear: prevYearRevenue,
          difference,
          percentageChange,
          total: currYearRevenue
        };
      });
    } else {
      return Object.entries(filteredRevenueByDate)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, revenue]) => ({ period: getFormattedDate(date), total: revenue }));
    }
  };

  const reportData = getReportData();

  // Find max revenue for chart scaling
  const maxRevenue = Math.max(...reportData.map(d => d.total || 0), 1);

  const resetRevenueDateFilters = () => {
    setRevenueStartDate('');
    setRevenueEndDate('');
  };

  // Status colors
  const statusConfig = {
    'Paid': { color: 'green', icon: FiCheckCircle, gradient: 'from-green-500 to-emerald-500' },
    'Pending': { color: 'yellow', icon: FiClock, gradient: 'from-yellow-500 to-orange-500' },
    'In Progress': { color: 'blue', icon: FiActivity, gradient: 'from-blue-500 to-indigo-500' },
    'Unpaid': { color: 'red', icon: FiAlertCircle, gradient: 'from-red-500 to-pink-500' }
  };

  return (
    <div className="space-y-6 lg:ml-16 p-6">
      {/* Header */}
      <div className={`relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800' : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600'} rounded-3xl p-8 shadow-2xl`}>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <FiBarChart2 className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white mb-1">Analytics & Reports</h1>
                <p className="text-white/90 text-lg">Comprehensive business insights and performance metrics</p>
              </div>
            </div>
            <div className="hidden md:flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-3 rounded-xl font-semibold transition-all border border-white/30"
              >
                <FiPrinter size={18} />
                Print
              </button>
              <button
                onClick={() => alert('Export feature coming soon!')}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-3 rounded-xl font-semibold transition-all border border-white/30"
              >
                <FiDownload size={18} />
                Export
              </button>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Services */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-lg border transition-all hover:shadow-2xl`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FiActivity className="text-white" size={24} />
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700'
            }`}>
              Total
            </span>
          </div>
          <div className={`text-4xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {totalServices}
          </div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
            Total Services
          </div>
          <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${paidPercentage}%` }}
            />
          </div>
          <div className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {paidPercentage}% completed
          </div>
        </div>

        {/* Paid Services */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-lg border transition-all hover:shadow-2xl`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FiCheckCircle className="text-white" size={24} />
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700'
            }`}>
              Paid
            </span>
          </div>
          <div className={`text-4xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {paidServices.length}
          </div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Paid Services
          </div>
          <div className={`text-xs mt-3 font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            {paidPercentage}% of total services
          </div>
        </div>

        {/* Unpaid Services */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-lg border transition-all hover:shadow-2xl`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FiClock className="text-white" size={24} />
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              isDark ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-50 text-orange-700'
            }`}>
              Pending
            </span>
          </div>
          <div className={`text-4xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {unpaidServices.length}
          </div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Pending Services
          </div>
          <div className={`text-xs mt-3 font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
            {unpaidPercentage}% of total services
          </div>
        </div>

        {/* Total Revenue */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-lg border transition-all hover:shadow-2xl`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FiDollarSign className="text-white" size={24} />
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-700'
            }`}>
              Revenue
            </span>
          </div>
          <div className={`text-4xl font-black mb-2 bg-gradient-to-r ${
            isDark ? 'from-purple-400 to-pink-400' : 'from-purple-600 to-pink-600'
          } bg-clip-text text-transparent`}>
            ${revenue.toFixed(2)}
          </div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Revenue
          </div>
          <div className={`text-xs mt-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Avg: ${avgServiceValue.toFixed(2)} per service
          </div>
        </div>
      </div>

      {/* Revenue Report */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-xl border overflow-hidden`}>
        <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' : 'border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600'}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FiTrendingUp className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Revenue Report</h2>
                <p className="text-sm text-white/80">Track your revenue over time</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setReportView('monthly')}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                    reportView === 'monthly'
                      ? 'bg-white text-purple-600 shadow-lg'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setReportView('daily')}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                    reportView === 'daily'
                      ? 'bg-white text-purple-600 shadow-lg'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Daily
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Date Filters */}
          <div className={`p-4 rounded-2xl mb-6 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <FiFilter className={isDark ? 'text-gray-400' : 'text-gray-600'} size={20} />
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Date Range:
                </span>
              </div>
              <input
                type="date"
                value={revenueStartDate}
                onChange={(e) => setRevenueStartDate(e.target.value)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  isDark
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } border-2`}
              />
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>to</span>
              <input
                type="date"
                value={revenueEndDate}
                onChange={(e) => setRevenueEndDate(e.target.value)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  isDark
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } border-2`}
              />
              <button
                onClick={resetRevenueDateFilters}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                  isDark
                    ? 'bg-gray-600 hover:bg-gray-500 text-white'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300'
                }`}
              >
                <FiRefreshCw size={16} />
                Reset
              </button>
            </div>
          </div>

          {/* Chart Visualization */}
          {reportView === 'monthly' && reportData.some(d => d.total > 0) && (
            <div className={`mb-6 p-4 rounded-2xl ${isDark ? 'bg-gray-700/30' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
              <div className="flex items-end gap-2 h-64">
                {reportData.map((data, index) => {
                  const height = maxRevenue > 0 ? (data.total / maxRevenue) * 100 : 0;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col justify-end h-full">
                        <div
                          className={`w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-purple-600 transition-all duration-500 hover:from-blue-700 hover:to-purple-700 cursor-pointer relative group`}
                          style={{ height: `${height}%` }}
                          title={`$${data.total.toFixed(2)}`}
                        >
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded">
                            ${data.total.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className={`text-xs mt-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {data.period}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDark ? 'bg-gray-700' : 'bg-gray-100'}>
                <tr>
                  <th className={`text-left p-4 font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {reportView === 'monthly' ? 'Month' : 'Date'}
                  </th>
                  {reportView === 'monthly' && (
                    <>
                      <th className={`text-right p-4 font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {previousYear}
                      </th>
                      <th className={`text-right p-4 font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {currentYear}
                      </th>
                      <th className={`text-right p-4 font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Difference
                      </th>
                      <th className={`text-right p-4 font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Change
                      </th>
                    </>
                  )}
                  <th className={`text-right p-4 font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {reportData.map((data, index) => (
                  <tr 
                    key={index}
                    className={`transition-colors ${isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'}`}
                  >
                    <td className={`p-4 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {data.period}
                    </td>
                    {reportView === 'monthly' && (
                      <>
                        <td className={`p-4 text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          ${data.previousYear.toFixed(2)}
                        </td>
                        <td className={`p-4 text-right font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          ${data.currentYear.toFixed(2)}
                        </td>
                        <td className={`p-4 text-right font-bold ${
                          data.difference >= 0
                            ? isDark ? 'text-green-400' : 'text-green-600'
                            : isDark ? 'text-red-400' : 'text-red-600'
                        }`}>
                          <div className="flex items-center justify-end gap-1">
                            {data.difference >= 0 ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />}
                            {data.difference >= 0 ? '+' : ''}${data.difference.toFixed(2)}
                          </div>
                        </td>
                        <td className={`p-4 text-right font-bold ${
                          data.percentageChange >= 0
                            ? isDark ? 'text-green-400' : 'text-green-600'
                            : isDark ? 'text-red-400' : 'text-red-600'
                        }`}>
                          {data.percentageChange >= 0 ? '+' : ''}{data.percentageChange}%
                        </td>
                      </>
                    )}
                    <td className={`p-4 text-right font-bold text-lg ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      ${data.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {reportData.length === 0 && (
                  <tr>
                    <td colSpan={reportView === 'monthly' ? 6 : 2} className={`p-8 text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      No revenue data available for selected date range
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Revenue Periods */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-xl border overflow-hidden`}>
          <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' : 'border-gray-200 bg-gradient-to-r from-green-600 to-teal-600'}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FiAward className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Top Revenue {reportView === 'monthly' ? 'Months' : 'Dates'}
                </h2>
                <p className="text-sm text-white/80">Best performing periods</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {((reportView === 'monthly' && topMonths.length > 0) || (reportView === 'daily' && topDates.length > 0)) ? (
              <div className="space-y-3">
                {(reportView === 'monthly' ? topMonths : topDates).map((item, index) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div
                      key={item.month || item.date}
                      className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
                        index === 0
                          ? isDark ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-300'
                          : index === 1
                          ? isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-100 border-gray-300'
                          : isDark ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{medals[index] || '🏆'}</span>
                          <div>
                            <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {reportView === 'monthly' ? item.monthName : item.formattedDate}
                            </div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Rank #{index + 1}
                            </div>
                          </div>
                        </div>
                        <div className={`text-2xl font-black ${
                          index === 0
                            ? isDark ? 'text-yellow-400' : 'text-yellow-600'
                            : isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          ${item.revenue.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                <FiAward className="mx-auto mb-3" size={48} />
                <p>No revenue data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Service Status Distribution */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-xl border overflow-hidden`}>
          <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' : 'border-gray-200 bg-gradient-to-r from-purple-600 to-pink-600'}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FiPieChart className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Service Status</h2>
                <p className="text-sm text-white/80">Distribution by status</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {Object.keys(statusCounts).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(statusCounts).map(([status, count]) => {
                  const config = statusConfig[status] || statusConfig['Unpaid'];
                  const StatusIcon = config.icon;
                  const percentage = Math.round((count / totalServices) * 100);

                  return (
                    <div key={status} className={`p-4 rounded-xl border ${isDark ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${config.gradient} rounded-xl flex items-center justify-center shadow-md`}>
                            <StatusIcon className="text-white" size={20} />
                          </div>
                          <div>
                            <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {status}
                            </div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {count} services
                            </div>
                          </div>
                        </div>
                        <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {percentage}%
                        </div>
                      </div>
                      <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div
                          className={`h-full bg-gradient-to-r ${config.gradient} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                <FiPieChart className="mx-auto mb-3" size={48} />
                <p>No status data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-xl border overflow-hidden`}>
        <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' : 'border-gray-200 bg-gradient-to-r from-orange-600 to-red-600'}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <FiFileText className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Recent Invoices</h2>
              <p className="text-sm text-white/80">Latest billing transactions</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {recentInvoices.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {recentInvoices.map((invoice, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
                    isDark ? 'bg-gray-700/30 border-gray-600 hover:border-gray-500' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                        <FiFileText className="text-white" size={20} />
                      </div>
                      <div>
                        <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Invoice #{invoice.id}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {invoice.customerName}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {invoice.formattedDate}
                    </div>
                    <div className={`text-xl font-black ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                      ${invoice.total.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              <FiFileText className="mx-auto mb-3" size={48} />
              <p>No invoice data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}