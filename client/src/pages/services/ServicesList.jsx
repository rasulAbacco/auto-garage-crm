import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiTool, FiPlus, FiSearch, FiDollarSign, FiFileText, FiCheckCircle, FiClock, FiAlertCircle,
} from "react-icons/fi";
import { useTheme } from "../../contexts/ThemeContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const apiRequest = async (url) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res;
};

export default function ServicesList() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadServices = async () => {
      const res = await apiRequest("/api/services");
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Failed to fetch services");
      setServices(data);
      setLoading(false);
    };
    loadServices();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return services.filter(
      (s) =>
        s.type.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q) ||
        s.client?.fullName?.toLowerCase().includes(q)
    );
  }, [search, services]);

  if (error)
    return (
      <div className="p-6 text-center text-red-500 font-semibold">{error}</div>
    );

  return (
    <div className={`min-h-screen p-6 lg:ml-16 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className={`rounded-3xl p-8 shadow-lg ${isDark ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Service Management</h1>
              <p className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Track and manage all service records
              </p>
            </div>
            <Link
              to="/services/new"
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg"
            >
              <FiPlus /> Add New Service
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className={`p-4 rounded-2xl flex items-center gap-3 shadow ${isDark ? "bg-gray-800" : "bg-white"}`}>
          <FiSearch className="text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by type, client or status..."
            className={`w-full bg-transparent outline-none ${isDark ? "text-white" : "text-gray-900"}`}
          />
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <StatCard
            icon={<FiTool />}
            title="Total Services"
            value={services.length}
            isDark={isDark}
          />
          <StatCard
            icon={<FiFileText />}
            title="Filtered Results"
            value={filtered.length}
            isDark={isDark}
          />
          <StatCard
            icon={<FiDollarSign />}
            title="Total Revenue"
            value={`$${services
              .reduce(
                (sum, s) =>
                  sum +
                  (Number(s.cost) ||
                    Number(s.partsCost || 0) + Number(s.laborCost || 0)),
                0
              )
              .toFixed(2)}`}
            isDark={isDark}
          />
        </div>

        {/* Services */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <FiAlertCircle className="mx-auto mb-2 text-3xl" />
            No services found.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filtered.map((s) => (
              <div
                key={s.id}
                className={`rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all ${isDark ? "bg-gray-800" : "bg-white"
                  }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold capitalize flex items-center gap-2">
                    <FiTool /> {s.type.replace("-", " ")}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-lg text-sm font-semibold ${s.status === "Paid"
                        ? "bg-green-600 text-white"
                        : s.status === "In Progress"
                          ? "bg-yellow-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                  >
                    {s.status}
                  </span>
                </div>
                <p className="text-gray-400 mb-4">
                  Client: {s.client?.fullName || "N/A"}
                </p>
                <div className="flex justify-between text-sm">
                  <span>{new Date(s.date).toLocaleDateString()}</span>
                  <span className="font-semibold text-green-500">
                    $
                    {(
                      Number(s.cost) ||
                      Number(s.partsCost || 0) + Number(s.laborCost || 0)
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => navigate(`/services/${s.id}`)}
                    className="text-green-600 font-semibold hover:underline"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, isDark }) {
  return (
    <div
      className={`rounded-2xl p-6 shadow-lg flex items-center justify-between ${isDark ? "bg-gray-800" : "bg-white"
        }`}
    >
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
      <div className="text-green-500 text-3xl">{icon}</div>
    </div>
  );
}
