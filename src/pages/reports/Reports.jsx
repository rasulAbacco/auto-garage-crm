import React, { useState, useEffect } from 'react';
import { listServices, listBilling } from '../../lib/storage.js';
import { currency, sum } from '../../utils.js';

export default function Reports() {
  const [services, setServices] = useState([]);
  const [billing, setBilling] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportView, setReportView] = useState('monthly');
  const [revenueStartDate, setRevenueStartDate] = useState('');
  const [revenueEndDate, setRevenueEndDate] = useState('');

  useEffect(() => {
    const loadData = () => {
      setServices(listServices());
      setBilling(listBilling());
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-slate-600">Loading reports...</div>
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
    .slice(0, 3)
    .map(([month, revenue]) => ({ month, monthName: getMonthName(month), revenue }));

  const topDates = Object.entries(revenueByDate)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([date, revenue]) => ({ date, formattedDate: getFormattedDate(date), revenue }));

  // Recent invoices
  const recentInvoices = [...billing]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map(invoice => ({
      ...invoice,
      total: calculateInvoiceTotal(invoice),
      formattedDate: getFormattedDate(dateKey(invoice.date))
    }));

  // Year comparison data
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Filtered revenue data for report
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

  // Reset filters
  const resetRevenueDateFilters = () => {
    setRevenueStartDate('');
    setRevenueEndDate('');
  };

  return (
    <div className="space-y-8 lg:pl-64">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Service Reports</h1>
        <p className="text-slate-600 mt-2">Comprehensive overview of services and revenue</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white/60 backdrop-blur border border-slate-200 rounded-2xl shadow-md p-5 transition hover:shadow-lg">
          <div className="text-sm text-slate-500">Total Services</div>
          <div className="text-3xl font-semibold mt-1 text-slate-800">{totalServices}</div>
          <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${paidPercentage}%` }}></div>
          </div>
          <div className="text-xs text-slate-500 mt-1">{paidPercentage}% paid</div>
        </div>

        <div className="bg-white/60 backdrop-blur border border-slate-200 rounded-2xl shadow-md p-5 transition hover:shadow-lg">
          <div className="text-sm text-slate-500">Paid Services</div>
          <div className="text-3xl font-semibold mt-1 text-green-600">{paidServices.length}</div>
          <div className="text-sm text-slate-500 mt-1">{paidPercentage}% of total</div>
        </div>

        <div className="bg-white/60 backdrop-blur border border-slate-200 rounded-2xl shadow-md p-5 transition hover:shadow-lg">
          <div className="text-sm text-slate-500">Unpaid / In Progress</div>
          <div className="text-3xl font-semibold mt-1 text-amber-600">{unpaidServices.length}</div>
          <div className="text-sm text-slate-500 mt-1">{unpaidPercentage}% of total</div>
        </div>

        <div className="bg-white/60 backdrop-blur border border-slate-200 rounded-2xl shadow-md p-5 transition hover:shadow-lg">
          <div className="text-sm text-slate-500">Total Revenue</div>
          <div className="text-3xl font-semibold mt-1 text-slate-800">{currency(revenue)}</div>
          <div className="text-sm text-slate-500 mt-1">Avg: {currency(avgServiceValue)} per service</div>
        </div>
      </div>

      {/* Revenue Report Section */}
      <div className="bg-white/60 backdrop-blur border border-slate-200 rounded-2xl shadow-md p-5 transition hover:shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div className="font-semibold text-slate-800 text-lg">Revenue Report</div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex space-x-2">
              <button 
                className={`px-3 py-1 rounded-lg text-sm ${reportView === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => setReportView('monthly')}
              >
                Monthly
              </button>
              <button 
                className={`px-3 py-1 rounded-lg text-sm ${reportView === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                onClick={() => setReportView('daily')}
              >
                Daily
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={revenueStartDate}
                onChange={(e) => setRevenueStartDate(e.target.value)}
                className="p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-slate-500">to</span>
              <input
                type="date"
                value={revenueEndDate}
                onChange={(e) => setRevenueEndDate(e.target.value)}
                className="p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                onClick={resetRevenueDateFilters}
                className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300 transition"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
        
        {(revenueStartDate || revenueEndDate) && (
          <div className="mb-3 text-sm text-slate-600">
            Showing data from {revenueStartDate || 'the beginning'} to {revenueEndDate || 'today'}
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-[15px] text-slate-700">
            <thead>
              <tr className="bg-gray-50 text-slate-600 border-b">
                <th className="text-left p-3">{reportView === 'monthly' ? 'Month' : 'Date'}</th>
                {reportView === 'monthly' && (
                  <>
                    <th className="text-right p-3">{previousYear}</th>
                    <th className="text-right p-3">{currentYear}</th>
                    <th className="text-right p-3">Difference</th>
                    <th className="text-right p-3">Change</th>
                  </>
                )}
                <th className="text-right p-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((data, index) => (
                <tr key={index} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3 font-medium">{data.period}</td>
                  {reportView === 'monthly' && (
                    <>
                      <td className="p-3 text-right">{currency(data.previousYear)}</td>
                      <td className="p-3 text-right font-medium">{currency(data.currentYear)}</td>
                      <td className={`p-3 text-right font-medium ${data.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.difference >= 0 ? '+' : ''}{currency(data.difference)}
                      </td>
                      <td className={`p-3 text-right font-medium ${data.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.percentageChange >= 0 ? '+' : ''}{data.percentageChange}%
                      </td>
                    </>
                  )}
                  <td className="p-3 text-right font-medium">{currency(data.total)}</td>
                </tr>
              ))}
              {reportData.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={reportView === 'monthly' ? 6 : 2}>
                    No revenue data available for selected date range
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Revenue Periods */}
      <div className="bg-white/60 backdrop-blur border border-slate-200 rounded-2xl shadow-md p-5 transition hover:shadow-lg">
        <div className="font-semibold text-slate-800 mb-4 text-lg">
          Top Revenue {reportView === 'monthly' ? 'Months' : 'Dates'}
        </div>
        
        {(reportView === 'monthly' && topMonths.length > 0) ||
         (reportView === 'daily' && topDates.length > 0) ? (
          <div className="space-y-4">
            {(reportView === 'monthly' ? topMonths : topDates).map((item, index) => (
              <div key={item.month || item.date} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    index === 0 ? 'bg-amber-100 text-amber-800' : 
                    index === 1 ? 'bg-slate-200 text-slate-800' : 
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium">
                    {reportView === 'monthly' ? item.monthName : item.formattedDate}
                  </span>
                </div>
                <div className="font-semibold">{currency(item.revenue)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No revenue data available
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Service Status Distribution */}
        <div className="bg-white/60 backdrop-blur border border-slate-200 rounded-2xl shadow-md p-5 transition hover:shadow-lg">
          <div className="font-semibold text-slate-800 mb-4 text-lg">Service Status Distribution</div>
          
          {Object.keys(statusCounts).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-slate-800">{count}</div>
                  <div className="text-sm text-slate-600 mt-1">{status}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    {Math.round((count / totalServices) * 100)}% of total
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No service status data available
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-white/60 backdrop-blur border border-slate-200 rounded-2xl shadow-md p-5 transition hover:shadow-lg">
          <div className="font-semibold text-slate-800 mb-4 text-lg">Recent Invoices</div>
          
          {recentInvoices.length > 0 ? (
            <div className="space-y-3">
              {recentInvoices.map((invoice, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                  <div>
                    <div className="font-medium">{invoice.formattedDate}</div>
                    <div className="text-sm text-slate-500">
                      {invoice.customerName || `Invoice #${invoice.id || index + 1}`}
                    </div>
                  </div>
                  <div className="font-semibold">{currency(invoice.total)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No invoice data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}