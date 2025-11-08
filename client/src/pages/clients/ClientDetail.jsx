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
  FiPlus,
  FiArrowLeft,
  FiX,
  FiSave,
} from "react-icons/fi";
import { useTheme } from "../../contexts/ThemeContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function ClientDetail() {
  const { id } = useParams();
  const { isDark } = useTheme();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedService, setSelectedService] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [serviceForm, setServiceForm] = useState({});
  const [isSavingService, setIsSavingService] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/clients/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch client data");
        const data = await res.json();
        setClient(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const saveServiceChanges = async () => {
    try {
      setIsSavingService(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/services/${serviceForm.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(serviceForm),
      });
      if (!res.ok) throw new Error("Failed to update service");
      const data = await res.json();
      setClient((prev) => ({
        ...prev,
        services: prev.services.map((s) =>
          s.id === data.service.id ? data.service : s
        ),
      }));
      setSelectedService(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSavingService(false);
    }
  };

  if (loading)
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <div className={`mt-4 text-center font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading client...
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`max-w-md w-full p-6 rounded-2xl ${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border`}>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <FiX className="w-8 h-8 text-red-600" />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-red-400' : 'text-red-700'}`}>
              Error Loading Client
            </h3>
            <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>{error}</p>
          </div>
        </div>
      </div>
    );

  if (!client) return null;

  const services = client.services || [];
  const invoices = client.invoices || [];

  const lastService = services[0]?.date
    ? new Date(services[0].date).toLocaleDateString()
    : "N/A";
  const totalServices = services.length;
  const totalBilled = invoices.reduce(
    (s, i) => s + (i.grandTotal || i.totalAmount || 0),
    0
  );

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} lg:ml-16`}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Back Button */}
        <Link
          to="/clients"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isDark
            ? "text-gray-300 hover:text-white hover:bg-gray-800"
            : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            }`}
        >
          <FiArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back to Clients</span>
        </Link>

        {/* Header Card */}
        <div className={`rounded-2xl overflow-hidden shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`p-6 sm:p-8 ${isDark ? 'bg-gradient-to-r from-blue-900/50 to-purple-900/50' : 'bg-gradient-to-r from-blue-500 to-purple-600'}`}>
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Client Info */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl sm:text-3xl shadow-lg flex-shrink-0">
                  {client.fullName?.charAt(0)?.toUpperCase() || "C"}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white truncate">
                    {client.fullName}
                  </h1>
                  <p className="text-green-300 flex items-center gap-2 text-sm font-medium mt-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Active Client
                  </p>
                </div>
              </div>

              {/* Edit Button */}
              <Link
                to={`/clients/${id}/edit`}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 transition-all shadow-lg"
              >
                <FiEdit className="w-5 h-5" />
                <span className="font-medium">Edit Client</span>
              </Link>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className={`p-6 sm:p-8 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium mb-6 ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700'
              } shadow-sm`}>
              <span>{client.vehicleMake} {client.vehicleModel}</span>
              <span className="text-gray-400">•</span>
              <span>{client.vehicleYear}</span>
              <span className="text-gray-400">•</span>
              <span className="font-mono">{client.regNumber}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Car Image */}
              <div className="w-full">
                <img
                  src={
                    client.carImage ||
                    `https://via.placeholder.com/600x400?text=${encodeURIComponent(
                      client.vehicleMake
                    )}+${encodeURIComponent(client.vehicleModel)}`
                  }
                  alt="vehicle"
                  className="w-full h-64 object-contain rounded-xl"
                />
              </div>

              {/* Damage Images */}
              {Array.isArray(client.damageImages) && client.damageImages.length > 0 && (
                <div>
                  <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    Additional Images
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {client.damageImages.slice(0, 4).map((img, idx) => (
                      <div key={idx} className="aspect-video rounded-lg overflow-hidden shadow">
                        <img
                          src={img}
                          alt={`damage-${idx}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className={`rounded-2xl p-6 sm:p-8 shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Contact Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ContactCard icon={<FiPhone />} label="Phone" value={client.phone} isDark={isDark} />
            <ContactCard icon={<FiMail />} label="Email" value={client.email} isDark={isDark} />
            <ContactCard icon={<FiMapPin />} label="Address" value={client.address} isDark={isDark} />
            <ContactCard icon={<FiCreditCard />} label="Registration No." value={client.regNumber} isDark={isDark} />
            <ContactCard icon={<FiHash />} label="VIN / Chassis" value={client.vin} isDark={isDark} />
            <ContactCard icon={<FiCalendar />} label="Last Service" value={lastService} isDark={isDark} />
          </div>
        </div>

        {/* Tabs Section */}
        <div className={`rounded-2xl shadow-lg overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Tab Header */}
          <div className={`p-4 sm:p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Tab Buttons */}
              <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                {["overview", "services", "invoices"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                      : isDark
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              {activeTab === "services" && (
                <Link
                  to="/services/new"
                  state={{ customerId: client.id }}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow whitespace-nowrap"
                >
                  <FiPlus className="w-4 h-4" />
                  <span className="font-medium">Add Service</span>
                </Link>
              )}
              {activeTab === "invoices" && (
                <Link
                  to="/invoices/new"
                  state={{ customerId: client.id }}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-teal-500 text-white hover:shadow-lg transition-shadow whitespace-nowrap"
                >
                  <FiPlus className="w-4 h-4" />
                  <span className="font-medium">Create Invoice</span>
                </Link>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard title="Last Service" value={lastService} icon={<FiCalendar />} isDark={isDark} />
                <StatCard title="Total Services" value={totalServices} icon={<FiTool />} isDark={isDark} />
                <StatCard title="Total Billed" value={`₹${totalBilled.toFixed(2)}`} icon={<FiDollarSign />} isDark={isDark} />
              </div>
            )}

            {/* Services Tab */}
            {activeTab === "services" && (
              <div className="space-y-4">
                {services.length ? (
                  services.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedService(s);
                        setServiceForm(s);
                      }}
                      className={`p-4 sm:p-5 rounded-xl cursor-pointer transition-all hover:shadow-md ${isDark ? "bg-gray-700 hover:bg-gray-650" : "bg-gray-50 hover:bg-gray-100"
                        }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-bold text-lg truncate ${isDark ? "text-white" : "text-gray-800"}`}>
                            {s.type || "Service"}
                          </h3>
                          <p className={`text-sm mt-1 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                            {new Date(s.date).toLocaleDateString()} • ${s.cost || "0.00"}
                          </p>
                          {s.notes && (
                            <p className={`text-xs mt-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                              {s.notes}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${s.status === "Paid"
                            ? "bg-green-500/20 text-green-400"
                            : s.status === "In Progress"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                            }`}
                        >
                          {s.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <FiTool className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No service records yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Invoices Tab */}
            {activeTab === "invoices" && (
              <div className="space-y-4">
                {invoices.length ? (
                  invoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className={`p-4 sm:p-5 rounded-xl cursor-pointer transition-all hover:shadow-md ${isDark ? "bg-gray-700 hover:bg-gray-650" : "bg-gray-50 hover:bg-gray-100"
                        }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-800"}`}>
                            Invoice #{inv.id}
                          </h3>
                          <p className={`text-sm mt-1 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                            {new Date(inv.issuedAt || inv.createdAt).toLocaleDateString()} • $
                            {(inv.grandTotal || inv.totalAmount || 0).toFixed(2)}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${inv.status === "Paid"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                            }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <FiDollarSign className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No invoices found.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

function ContactCard({ icon, label, value, isDark }) {
  return (
    <div
      className={`p-4 rounded-xl flex items-center gap-3 ${isDark ? "bg-gray-700" : "bg-gray-50"
        }`}
    >
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-medium uppercase mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {label}
        </p>
        <p className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, isDark }) {
  return (
    <div
      className={`p-5 rounded-xl flex items-center justify-between ${isDark ? "bg-gray-700" : "bg-gray-50"
        }`}
    >
      <div>
        <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {title}
        </p>
        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {value}
        </p>
      </div>
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
        {icon}
      </div>
    </div>
  );
}