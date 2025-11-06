// client/src/pages/billing/Invoice.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
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
  FiInfo,
  FiPercent,
} from 'react-icons/fi'
import { FaCar } from "react-icons/fa";
import { useTheme } from '../../contexts/ThemeContext'

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Helper function to get auth token
const getAuthToken = () => localStorage.getItem('token') || localStorage.getItem('authToken');

// Helper function to make authenticated API requests
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

export default function Invoice() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isDark } = useTheme();
  const printRef = useRef();

  // Fetch invoice
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/api/invoices/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch invoice');
        setInvoice(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handlePrint = () => window.print();
  const handleDownloadPDF = () => alert('PDF download feature coming soon!');

  if (loading)
    return <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>Loading invoice...</div>;
  if (error)
    return <div className="p-8 text-center text-red-500 font-semibold">Error: {error}</div>;

  const c = invoice?.client || {};
  const partsCost = Number(invoice.partsCost || 0);
  const partsGst = Number(invoice.partsGst || 0);
  const laborCost = Number(invoice.laborCost || 0);
  const laborGst = Number(invoice.laborGst || 0);
  const tax = Number(invoice.tax || 0);
  const discount = Number(invoice.discount || 0);
  const grandTotal = Number(invoice.grandTotal || 0);

  const partsTotal = partsCost + (partsCost * partsGst) / 100;
  const laborTotal = laborCost + (laborCost * laborGst) / 100;

  const paymentStatus = invoice.status === 'Paid' ? 'text-green-500' : 'text-yellow-500';
  const paymentMode = invoice.paymentMode || 'N/A';

  return (
    <div className={`min-h-screen p-6 lg:ml-16 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} print:bg-white`}>
      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <Link to="/billing" className={`flex items-center gap-2 font-medium ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
          <FiArrowLeft /> Back to Billing
        </Link>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-xl hover:bg-gray-700"
          >
            <FiPrinter /> Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700"
          >
            <FiDownload /> Download PDF
          </button>
        </div>
      </div>

      {/* Invoice Card */}
      <div ref={printRef} className={`max-w-5xl mx-auto shadow-2xl rounded-3xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">AUTO GARAGE</h1>
              <p className="text-sm opacity-90">Professional Auto Services</p>
              <div className="mt-2 space-y-1 text-sm opacity-80">
                <p className="flex items-center gap-2"><FiMapPin size={14} /> Bengaluru, India</p>
                <p className="flex items-center gap-2"><FiMail size={14} /> contact@autogarage.com</p>
                <p className="flex items-center gap-2"><FiPhone size={14} /> +91 98765 43210</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90 font-semibold">INVOICE NUMBER</p>
              <h2 className="text-3xl font-black mb-2">#{invoice.invoiceNumber}</h2>
              <p className={`font-bold ${paymentStatus}`}>{invoice.status}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div>
              <p className="text-xs opacity-80">Invoice Date</p>
              <p className="font-semibold">{formatDate(invoice.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs opacity-80">Due Date</p>
              <p className="font-semibold">{formatDate(invoice.dueDate)}</p>
            </div>
            <div>
              <p className="text-xs opacity-80">Payment Mode</p>
              <p className="font-semibold capitalize">{paymentMode}</p>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="grid md:grid-cols-2 gap-6 p-8 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
              <FiUser /> Bill To
            </h3>
            <p className="font-semibold">{c.fullName}</p>
            <p className="text-sm opacity-80">{c.address || 'Address not provided'}</p>
            <p className="text-sm opacity-80 mt-1 flex items-center gap-2"><FiPhone size={14} /> {c.phone}</p>
            <p className="text-sm opacity-80 flex items-center gap-2"><FiMail size={14} /> {c.email}</p>
          </div>

          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
              <FaCar /> Vehicle Details
            </h3>
            <p className="font-semibold">{c.vehicleMake} {c.vehicleModel} ({c.regNumber})</p>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="p-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FiDollarSign /> Cost Breakdown</h2>
          <table className="w-full text-sm border-collapse">
            <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <tr>
                <th className="text-left p-3 font-semibold">Description</th>
                <th className="text-right p-3 font-semibold">Cost</th>
                <th className="text-right p-3 font-semibold">GST (%)</th>
                <th className="text-right p-3 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-3 flex items-center gap-2"><FiTool /> Parts</td>
                <td className="p-3 text-right">₹{partsCost.toFixed(2)}</td>
                <td className="p-3 text-right">{partsGst}%</td>
                <td className="p-3 text-right font-bold">₹{partsTotal.toFixed(2)}</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 flex items-center gap-2"><FiUser /> Labor</td>
                <td className="p-3 text-right">₹{laborCost.toFixed(2)}</td>
                <td className="p-3 text-right">{laborGst}%</td>
                <td className="p-3 text-right font-bold">₹{laborTotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold">Additional Taxes</td>
                <td className="p-3 text-right" colSpan="3">₹{tax.toFixed(2)}</td>
              </tr>
              {discount > 0 && (
                <tr>
                  <td className="p-3 font-semibold text-red-500">Discounts</td>
                  <td className="p-3 text-right text-red-500" colSpan="3">-₹{discount.toFixed(2)}</td>
                </tr>
              )}
              <tr className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
                <td className="p-4 font-bold text-lg">Grand Total</td>
                <td colSpan="3" className="p-4 text-right font-bold text-2xl">₹{grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Info */}
        <div className={`p-8 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} bg-gradient-to-r from-green-100 to-green-50`}>
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><FiCreditCard /> Payment Details</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-semibold">Bank Name</p>
              <p>Auto Garage Bank</p>
            </div>
            <div>
              <p className="font-semibold">Account No.</p>
              <p>1234567890</p>
            </div>
            <div>
              <p className="font-semibold">IFSC Code</p>
              <p>AUTG0001234</p>
            </div>
            <div>
              <p className="font-semibold">Branch</p>
              <p>Bengaluru Main</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="font-semibold text-lg">Thank You for Your Business!</p>
          <p className="text-sm opacity-70">For any queries, contact us at contact@autogarage.com</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page { margin: 0.5cm; }
          .print\\:hidden { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
