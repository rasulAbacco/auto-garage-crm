import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import {
  FiTool, FiDollarSign, FiCalendar, FiCheckCircle, FiUser, FiArrowLeft, FiSave
} from "react-icons/fi";
import { useTheme } from "../../contexts/ThemeContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  const response = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }
  return response;
};

export default function ServiceForm() {
  const { id } = useParams();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    clientId: "",
    type: "",
    date: "",
    partsCost: "",
    laborCost: "",
    status: "Unpaid",
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const serviceTypes = [
    { value: "oil-change", label: "Oil Change", icon: "🛢️" },
    { value: "brake-wire", label: "Brake Wire Replacement", icon: "🔧" },
    { value: "tire-rotation", label: "Tire Rotation", icon: "⚙️" },
    { value: "engine-tune", label: "Engine Tune-up", icon: "🔩" },
    { value: "transmission-service", label: "Transmission Service", icon: "⚡" },
  ];

  useEffect(() => {
    const loadClients = async () => {
      const res = await apiRequest("/api/clients");
      const data = await res.json();
      setClients(data);
    };
    loadClients();
  }, []);

  useEffect(() => {
    if (id) {
      const loadService = async () => {
        const res = await apiRequest(`/api/services/${id}`);
        const data = await res.json();
        setForm(data);
      };
      loadService();
    } else if (location.state?.clientId) {
      setForm((f) => ({ ...f, clientId: location.state.clientId }));
    }
  }, [id, location.state]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        clientId: Number(form.clientId),
        partsCost: Number(form.partsCost || 0),
        laborCost: Number(form.laborCost || 0),
      };

      const res = await apiRequest(id ? `/api/services/${id}` : "/api/services", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to save service");

      navigate(`/services/${result.service.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"} p-6 lg:ml-16`}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className={`rounded-2xl p-6 shadow-lg ${isDark ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{id ? "Edit Service" : "Add New Service"}</h1>
              <p className={`${isDark ? "text-gray-400" : "text-gray-500"} mt-1`}>
                Manage your service record easily
              </p>
            </div>
            <Link to="/services" className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium">
              <FiArrowLeft /> Back
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-700 border border-red-300 rounded-xl p-4">
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className={`rounded-2xl p-6 shadow-lg grid md:grid-cols-2 gap-6 ${isDark ? "bg-gray-800" : "bg-white"}`}
        >
          <div className="space-y-1">
            <label className="font-semibold flex items-center gap-2">
              <FiUser /> Client
            </label>
            <select
              name="clientId"
              value={form.clientId}
              onChange={handleChange}
              required
              className={`w-full rounded-lg border p-3 ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-300"}`}
            >
              <option value="">Select Client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.regNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold flex items-center gap-2">
              <FiCalendar /> Date
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              className={`w-full rounded-lg border p-3 ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-300"}`}
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold flex items-center gap-2">
              <FiTool /> Service Type
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              required
              className={`w-full rounded-lg border p-3 ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-300"}`}
            >
              <option value="">Select Type</option>
              {serviceTypes.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.icon} {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold flex items-center gap-2">
              <FiDollarSign /> Parts Cost
            </label>
            <input
              type="number"
              name="partsCost"
              placeholder="0.00"
              value={form.partsCost}
              onChange={handleChange}
              className={`w-full rounded-lg border p-3 ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-300"}`}
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold flex items-center gap-2">
              <FiDollarSign /> Labor Cost
            </label>
            <input
              type="number"
              name="laborCost"
              placeholder="0.00"
              value={form.laborCost}
              onChange={handleChange}
              className={`w-full rounded-lg border p-3 ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-300"}`}
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold flex items-center gap-2">
              <FiCheckCircle /> Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className={`w-full rounded-lg border p-3 ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-300"}`}
            >
              <option value="Unpaid">Unpaid</option>
              <option value="In Progress">In Progress</option>
              <option value="Paid">Paid</option>
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg"
            >
              <FiSave /> {loading ? "Saving..." : id ? "Update Service" : "Create Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
