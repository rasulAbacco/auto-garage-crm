// client/src/pages/clients/ClientDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiEdit,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCreditCard,
  FiHash,
  FiCalendar,
  FiTool,
  FiDollarSign,
  FiClock,
  FiPlus,
  FiArrowLeft,
  FiCheckCircle,
} from "react-icons/fi";
import { useTheme } from "../../contexts/ThemeContext";

const API_URL = import.meta.env.VITE_API_BASE_URL;


// ✅ Car brand logo component
const CarLogo = ({ make, className = "w-8 h-8 inline-block mr-2 align-middle" }) => {
  const makeLower = make?.toLowerCase().trim() || "";

  const carLogos = {
    toyota: (
      <svg viewBox="0 0 100 100" className={className}>
        <ellipse cx="50" cy="50" rx="45" ry="45" fill="#EB0A1E" />
        <ellipse cx="50" cy="50" rx="35" ry="35" fill="white" />
        <ellipse cx="50" cy="50" rx="25" ry="25" fill="#EB0A1E" />
      </svg>
    ),
    honda: (
      <svg viewBox="0 0 100 100" className={className}>
        <rect x="10" y="10" width="80" height="80" rx="10" fill="#C41E3A" />
        <path d="M50 25 L75 50 L50 75 L25 50 Z" fill="white" />
      </svg>
    ),
    ford: (
      <svg viewBox="0 0 100 100" className={className}>
        <ellipse cx="50" cy="50" rx="45" ry="45" fill="#003478" />
        <path d="M20 50 Q50 20 80 50 Q50 80 20 50" fill="white" />
      </svg>
    ),
  };

  return (
    carLogos[makeLower] || (
      <div
        className={`${className} rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold text-xl`}
      >
        {make?.charAt(0)?.toUpperCase() || "C"}
      </div>
    )
  );
};

// ✅ Main Component
export default function ClientDetail() {
  const { id } = useParams();
  const { isDark } = useTheme();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Validate ID before fetching
  useEffect(() => {
    // Check if ID is valid
    if (!id || id === 'undefined' || isNaN(Number(id))) {
      setError('Invalid client ID');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

        const clientRes = await fetch(`${base}/api/clients/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!clientRes.ok) {
          if (clientRes.status === 404) {
            throw new Error('Client not found');
          }
          throw new Error('Failed to fetch client');
        }

        const clientData = await clientRes.json();
        setClient(clientData);
      } catch (err) {
        console.error("Error fetching client details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading)
    return (
      <div
        className={`lg:ml-16 min-h-screen flex items-center justify-center ${isDark ? "bg-gray-900" : "bg-gray-50"
          }`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className={`mt-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Loading client details...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div
        className={`lg:ml-16 min-h-screen flex items-center justify-center ${isDark ? "bg-gray-900" : "bg-gray-50"
          }`}
      >
        <div className="text-center max-w-md">
          <div
            className={`w-24 h-24 mx-auto rounded-full ${isDark ? "bg-red-900/30" : "bg-red-100"
              } flex items-center justify-center mb-4`}
          >
            <FiMapPin
              className={`w-12 h-12 ${isDark ? "text-red-400" : "text-red-500"
                }`}
            />
          </div>
          <h2
            className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"
              }`}
          >
            Error
          </h2>
          <p className={`${isDark ? "text-gray-400" : "text-gray-500"} mb-6`}>{error}</p>
          {error.includes('Unauthorized') ? (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg"
            >
              Please Login
              <FiArrowLeft />
            </Link>
          ) : (
            <Link
              to="/clients"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg"
            >
              <FiArrowLeft /> Back to Clients
            </Link>
          )}
        </div>
      </div>
    );

  if (!client)
    return (
      <div
        className={`lg:ml-16 min-h-screen flex items-center justify-center ${isDark ? "bg-gray-900" : "bg-gray-50"
          }`}
      >
        <div className="text-center">
          <div
            className={`w-24 h-24 mx-auto rounded-full ${isDark ? "bg-gray-800" : "bg-gray-100"
              } flex items-center justify-center mb-4`}
          >
            <FiMapPin
              className={`w-12 h-12 ${isDark ? "text-gray-600" : "text-gray-400"
                }`}
            />
          </div>
          <h2
            className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"
              }`}
          >
            Client Not Found
          </h2>
          <Link
            to="/clients"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg"
          >
            <FiArrowLeft /> Back to Clients
          </Link>
        </div>
      </div>
    );

  // Extract services from client object
  const services = client.services || [];

  // ✅ Full UI section (unchanged)
  return (
    <div className="space-y-6 lg:ml-16 p-6">
      <Link
        to="/clients"
        className={`inline-flex items-center gap-2 ${isDark
          ? "text-gray-300 hover:text-white"
          : "text-gray-600 hover:text-gray-900"
          } transition-colors duration-200`}
      >
        <FiArrowLeft />
        <span className="font-medium">Back to Clients</span>
      </Link>

      {/* VEHICLE SHOWCASE */}
      <div
        className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          } rounded-3xl shadow-2xl overflow-hidden border`}
      >
        <div className="relative h-96">
          <div
            className={`absolute inset-0 ${isDark
              ? "bg-gradient-to-b from-gray-900 via-gray-800 to-gray-700"
              : "bg-gradient-to-b from-blue-500 via-blue-400 to-blue-300"
              }`}
          ></div>

          {/* Car Display */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-20">
            <div
              className={`${isDark
                ? "bg-gray-700 border-blue-500"
                : "bg-white border-blue-600"
                } px-6 py-3 rounded-2xl shadow-2xl mb-4 border-2`}
            >
              <div className="flex items-center gap-3">
                <CarLogo make={client.vehicleMake} className="w-12 h-12" />
                <div>
                  <div
                    className={`text-lg font-bold ${isDark ? "text-blue-400" : "text-blue-700"
                      }`}
                  >
                    {client.vehicleMake} {client.vehicleModel}
                  </div>
                  <div
                    className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"
                      } flex items-center gap-2`}
                  >
                    <FiCalendar size={14} />
                    {client.vehicleYear} • {client.regNumber}
                  </div>
                </div>
              </div>
            </div>

            <img
              src={
                client.carImage ||
                `https://via.placeholder.com/500x300?text=${encodeURIComponent(
                  client.vehicleMake
                )}+${encodeURIComponent(client.vehicleModel)}`
              }
              alt={`${client.vehicleMake} ${client.vehicleModel}`}
              className="h-64 w-auto object-contain drop-shadow-2xl"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://via.placeholder.com/500x300?text=${encodeURIComponent(
                  client.vehicleMake
                )}+${encodeURIComponent(client.vehicleModel)}`;
              }}
            />
          </div>

          <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-2xl">
                {client.fullName?.charAt(0)?.toUpperCase() || "C"}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                  {client.fullName}
                </h1>
                <p className="text-white/90 flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Active Client
                </p>
              </div>
            </div>
            <Link
              to={`/clients/${id}/edit`}
              className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center gap-2 border border-white/30"
            >
              <FiEdit size={18} />
              Edit Client
            </Link>
          </div>
        </div>

        {/* CLIENT INFO SECTION */}
        <div className="p-8">
          <h2
            className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"
              } flex items-center gap-3`}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <FiHash className="text-white" size={20} />
            </div>
            Contact Information
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* PHONE */}
            <InfoCard
              icon={<FiPhone />}
              title="Phone"
              value={client.phone}
              color="blue"
              isDark={isDark}
            />
            {/* EMAIL */}
            <InfoCard
              icon={<FiMail />}
              title="Email"
              value={client.email}
              color="purple"
              isDark={isDark}
            />
            {/* ADDRESS */}
            <InfoCard
              icon={<FiMapPin />}
              title="Address"
              value={client.address}
              color="green"
              isDark={isDark}
            />
            {/* REGISTRATION */}
            <InfoCard
              icon={<FiCreditCard />}
              title="Registration No."
              value={client.regNumber}
              color="orange"
              isDark={isDark}
            />
            {/* VIN */}
            <InfoCard
              icon={<FiHash />}
              title="VIN / Chassis No."
              value={client.vin || "Not Available"}
              color="pink"
              isDark={isDark}
            />
          </div>
        </div>
      </div>

      {/* SERVICE HISTORY */}
      <div
        className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          } rounded-3xl shadow-xl border overflow-hidden`}
      >
        <div
          className={`p-6 border-b ${isDark
            ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700"
            : "border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600"
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FiTool className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Service History
                </h2>
                <p className="text-sm text-white/80">
                  Complete maintenance records
                </p>
              </div>
            </div>
            <Link
              to="/services/new"
              state={{ customerId: client.id }}
              className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-5 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg flex items-center gap-2 border border-white/30"
            >
              <FiPlus size={18} />
              Add Service
            </Link>
          </div>
        </div>

        <div className="p-6">
          {services.length > 0 ? (
            <div className="space-y-4">
              {services.map((s, idx) => (
                <ServiceCard key={s.id} s={s} idx={idx} isDark={isDark} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div
                className={`w-24 h-24 mx-auto rounded-full ${isDark ? "bg-gray-700" : "bg-gray-100"
                  } flex items-center justify-center mb-4`}
              >
                <FiTool
                  className={`w-12 h-12 ${isDark ? "text-gray-600" : "text-gray-400"
                    }`}
                />
              </div>
              <h3
                className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"
                  }`}
              >
                No Service Records
              </h3>
              <p
                className={`${isDark ? "text-gray-400" : "text-gray-500"
                  } mb-6`}
              >
                This client doesn't have any service history yet.
              </p>
              <Link
                to="/services/new"
                state={{ customerId: client.id }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg"
              >
                <FiPlus size={18} />
                Add First Service
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ✅ Helper: Contact Info Card
function InfoCard({ icon, title, value, color, isDark }) {
  const colorMap = {
    blue: "from-blue-500",
    purple: "from-purple-500",
    green: "from-green-500",
    orange: "from-orange-500",
    pink: "from-pink-500",
  };
  return (
    <div
      className={`${isDark ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"
        } p-5 rounded-2xl border`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]
            } to-${color}-600 flex items-center justify-center flex-shrink-0 shadow-md`}
        >
          {React.cloneElement(icon, { className: "text-white", size: 20 })}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? "text-gray-400" : "text-gray-600"
              }`}
          >
            {title}
          </p>
          <p
            className={`font-semibold text-lg ${isDark ? "text-white" : "text-gray-900"
              } truncate`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

// ✅ Helper: Service Card
function ServiceCard({ s, idx, isDark }) {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      className={`${isDark
        ? "bg-gray-700/50 border-gray-600 hover:bg-gray-700"
        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
        } p-5 rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
            {idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3
                className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"
                  }`}
              >
                {s.type}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${s.status === 'Paid'
                  ? isDark
                    ? "bg-green-900/30 text-green-400 border border-green-700"
                    : "bg-green-50 text-green-700 border border-green-200"
                  : s.status === 'In Progress'
                    ? isDark
                      ? "bg-yellow-900/30 text-yellow-400 border border-yellow-700"
                      : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                    : isDark
                      ? "bg-red-900/30 text-red-400 border border-red-700"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
              >
                {s.status === 'Paid' ? <FiCheckCircle className="inline mr-1" size={12} /> : <FiClock className="inline mr-1" size={12} />}
                {s.status}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div
                className={`flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-600"
                  }`}
              >
                <FiCalendar
                  className={isDark ? "text-blue-400" : "text-blue-600"}
                  size={16}
                />
                <span className="text-sm font-medium">{formatDate(s.date)}</span>
              </div>
              {s.cost && (
                <div
                  className={`flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-600"
                    }`}
                >
                  <FiDollarSign
                    className={isDark ? "text-green-400" : "text-green-600"}
                    size={16}
                  />
                  <span className="text-sm font-medium">${s.cost}</span>
                </div>
              )}
              {s.status && (
                <div
                  className={`flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-600"
                    }`}
                >
                  <FiClock
                    className={isDark ? "text-purple-400" : "text-purple-600"}
                    size={16}
                  />
                  <span className="text-sm font-medium">{s.status}</span>
                </div>
              )}
            </div>
            {s.description && (
              <p
                className={`mt-3 text-sm ${isDark ? "text-gray-400" : "text-gray-600"
                  }`}
              >
                {s.description}
              </p>
            )}
          </div>
        </div>
        <Link
          to={`/services/${s.id}`}
          className={`ml-4 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 ${isDark
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
        >
          View Details
          <FiArrowLeft className="rotate-180" size={16} />
        </Link>
      </div>
    </div>
  );
}