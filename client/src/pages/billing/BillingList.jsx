// client/src/pages/billing/BillingList.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  FiMapPin,
  FiTrendingUp,
} from "react-icons/fi";
import { useTheme } from "../../contexts/ThemeContext";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const getAuthToken = () =>
  localStorage.getItem("token") || localStorage.getItem("authToken");

const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    window.location.href = "/login";
  }
  return response;
};

// Payment Status Config
const statusConfig = {
  paid: {
    label: "Paid",
    color: "text-green-600 bg-green-100",
    border: "border-green-300",
    icon: FiCheckCircle,
  },
  pending: {
    label: "Pending",
    color: "text-yellow-600 bg-yellow-100",
    border: "border-yellow-300",
    icon: FiClock,
  },
  overdue: {
    label: "Overdue",
    color: "text-red-600 bg-red-100",
    border: "border-red-300",
    icon: FiAlertCircle,
  },
  default: {
    label: "Unknown",
    color: "text-gray-600 bg-gray-100",
    border: "border-gray-300",
    icon: FiFileText,
  },
};

export default function BillingList() {
  const { isDark } = useTheme();
  const [invoices, setInvoices] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/api/invoices`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch invoices");
        setInvoices(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const filtered = useMemo(() => {
    const term = query.toLowerCase();
    return invoices.filter((inv) => {
      const matchesQuery =
        inv.invoiceNumber?.toLowerCase().includes(term) ||
        inv.client?.fullName?.toLowerCase().includes(term) ||
        inv.notes?.toLowerCase().includes(term);
      const matchesStatus =
        filterStatus === "all" ||
        inv.status?.toLowerCase() === filterStatus.toLowerCase();
      return matchesQuery && matchesStatus;
    });
  }, [query, invoices, filterStatus]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await fetchWithAuth(`${API_URL}/api/invoices/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete invoice");
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading)
    return (
      <div
        className={`flex justify-center items-center h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
          }`}
      >
        Loading Invoices...
      </div>
    );

  if (error)
    return (
      <div className="text-center p-8 text-red-600 font-semibold">
        Error: {error}
      </div>
    );

  return (
    <div className="lg:ml-16 p-6 space-y-8">
      {/* Header */}
      <div
        className={`rounded-3xl shadow-xl p-8 text-white bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Billing & Invoices</h1>
            <p className="opacity-80 text-sm">
              Manage invoices and track payments efficiently
            </p>
          </div>
          <Link
            to="/billing/new"
            className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl shadow-md hover:bg-gray-100 transition-all flex items-center gap-2"
          >
            <FiPlus /> New Invoice
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div
        className={`rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 ${isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"
          }`}
      >
        <input
          type="text"
          placeholder="Search invoice number, client or note..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`w-full md:w-1/2 p-3 rounded-xl border ${isDark
              ? "bg-gray-700 border-gray-600 placeholder-gray-400"
              : "bg-gray-50 border-gray-300"
            }`}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={`w-full md:w-1/4 p-3 rounded-xl border ${isDark
              ? "bg-gray-700 border-gray-600 text-white"
              : "bg-gray-50 border-gray-300"
            }`}
        >
          <option value="all">All</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Invoice Cards */}
      {filtered.length === 0 ? (
        <div
          className={`p-16 rounded-3xl text-center shadow-lg ${isDark ? "bg-gray-800 text-gray-300" : "bg-white text-gray-600"
            }`}
        >
          <FiFileText className="mx-auto text-6xl mb-4 opacity-50" />
          <p className="text-xl font-semibold mb-2">No Invoices Found</p>
          <p className="text-sm opacity-70 mb-6">
            Try adjusting your filters or create a new invoice.
          </p>
          <Link
            to="/billing/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-xl"
          >
            <FiPlus /> Create Invoice
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((inv, index) => {
            const status =
              statusConfig[inv.status?.toLowerCase()] || statusConfig.default;
            const StatusIcon = status.icon;

            return (
              <div
                key={inv.id}
                className={`w-full rounded-2xl shadow-lg border p-6 transition-all hover:shadow-2xl ${isDark
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                  }`}
              >
                {/* Top Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center text-white text-xl font-bold">
                      <FiFileText size={22} />
                    </div>
                    <div>
                      <h2 className="font-bold text-xl">
                        Invoice #{inv.invoiceNumber}
                      </h2>
                      <p
                        className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                      >
                        Created on {new Date(inv.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-2 mt-3 md:mt-0 px-4 py-2 rounded-xl border ${status.border} ${status.color}`}
                  >
                    <StatusIcon size={16} /> {status.label}
                  </div>
                </div>

                {/* Middle Info Grid */}
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <FiUser className="text-blue-500" />
                    <span className="font-medium">
                      {inv.client?.fullName || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiCreditCard className="text-purple-500" />
                    <span>{inv.paymentMode || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiCalendar className="text-green-500" />
                    <span>
                      {inv.dueDate
                        ? new Date(inv.dueDate).toLocaleDateString()
                        : "No Due Date"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-lg text-green-600">
                    <FiDollarSign />
                    ₹{Number(inv.grandTotal || 0).toFixed(2)}
                  </div>
                </div>

                {/* Notes */}
                {inv.notes && (
                  <div
                    className={`p-4 rounded-xl mb-4 ${isDark ? "bg-gray-700/50" : "bg-gray-50"
                      }`}
                  >
                    <p className="text-sm opacity-80 leading-relaxed">
                      {inv.notes}
                    </p>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex flex-wrap justify-between items-center mt-4 gap-3 border-t pt-4">
                  <div className="flex items-center gap-3 text-sm opacity-70">
                    <FiPhone /> {inv.client?.phone || "N/A"} <FiMail />{" "}
                    {inv.client?.email || "N/A"}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/billing/${inv.id}`)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      <FiEye /> View
                    </button>
                    <button
                      onClick={() => navigate(`/billing/${inv.id}/edit`)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-yellow-500 hover:bg-yellow-600 text-white flex items-center gap-2"
                    >
                      <FiEdit /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(inv.id)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
