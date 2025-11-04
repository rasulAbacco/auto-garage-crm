import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft, FiDollarSign, FiCheckCircle, FiClock, FiTool, FiUser, FiPrinter, FiFileText,
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";
import { useTheme } from "../../contexts/ThemeContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  return res;
};

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [service, setService] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadService = async () => {
      const res = await apiRequest(`/api/services/${id}`);
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Failed to load service");
      setService(data);
    };
    loadService();
  }, [id]);

  if (error)
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-3 font-semibold">{error}</p>
        <Link to="/services" className="text-green-600 hover:underline">
          Back to Services
        </Link>
      </div>
    );

  if (!service)
    return (
      <div className="p-6 text-center text-gray-500">Loading service details...</div>
    );

  const totalCost = (
    Number(service.partsCost || 0) + Number(service.laborCost || 0)
  ).toFixed(2);

  return (
    <div className={`min-h-screen p-6 lg:ml-16 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      {/* Header / Hero */}
      <div className={`rounded-3xl shadow-xl overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}>
        <div className="p-6 flex items-center justify-between">
          <div>
            <Link to="/services" className="flex items-center gap-2 text-green-600 font-medium mb-2">
              <FiArrowLeft /> Back
            </Link>
            <h1 className="text-3xl font-bold capitalize flex items-center gap-2">
              <FiTool /> {service.type.replace("-", " ")}
            </h1>
            <p className="text-gray-500 mt-1">
              Service ID #{service.id} • {new Date(service.date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium flex items-center gap-2"
            >
              <FiPrinter /> Print
            </button>
            <Link
              to={`/services/${id}/edit`}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2"
            >
              <FiFileText /> Edit
            </Link>
          </div>
        </div>

        {/* Status banner */}
        <div
          className={`p-4 text-center text-white font-semibold ${service.status === "Paid"
              ? "bg-green-600"
              : service.status === "In Progress"
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
        >
          {service.status === "Paid" ? <FiCheckCircle className="inline mr-1" /> : <FiClock className="inline mr-1" />}
          {service.status}
        </div>

        {/* Main Details */}
        <div className="grid md:grid-cols-2 gap-6 p-8">
          {/* Cost Breakdown */}
          <div className={`${isDark ? "bg-gray-700" : "bg-gray-100"} p-6 rounded-2xl shadow`}>
            <h2 className="font-bold text-xl flex items-center gap-2 mb-4">
              <FiDollarSign /> Cost Breakdown
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Parts Cost</span>
                <span className="font-semibold">${Number(service.partsCost || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Labor Cost</span>
                <span className="font-semibold">${Number(service.laborCost || 0).toFixed(2)}</span>
              </div>
              <hr className="my-3 border-gray-500/30" />
              <div className="flex justify-between text-lg font-bold text-green-500">
                <span>Total</span>
                <span>${totalCost}</span>
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className={`${isDark ? "bg-gray-700" : "bg-gray-100"} p-6 rounded-2xl shadow`}>
            <h2 className="font-bold text-xl flex items-center gap-2 mb-4">
              <FiUser /> Client Information
            </h2>
            {service.client ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FiUser className="text-green-500" /> <span>{service.client.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCar className="text-blue-500" /> <span>{service.client.regNumber}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 italic">No client linked.</p>
            )}
          </div>
        </div>

        {/* Billing CTA */}
        <div className="border-t p-6 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg">Ready to bill this service?</h3>
            <p className="text-gray-500 text-sm">
              Create or view invoice for this service.
            </p>
          </div>
          <Link
            to="/billing/new"
            state={{
              serviceId: service.id,
              clientId: service.clientId,
              description: service.type,
              partsCost: service.partsCost,
              laborCost: service.laborCost,
            }}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg flex items-center gap-2"
          >
            <FiFileText /> Create Invoice
          </Link>
        </div>
      </div>
    </div>
  );
}
