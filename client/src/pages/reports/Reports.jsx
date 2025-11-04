import React, { useState, useEffect, useMemo } from "react";
import {
  FiBarChart2,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiPieChart,
  FiDownload,
  FiPrinter,
  FiRefreshCw,
} from "react-icons/fi";
import { useTheme } from "../../contexts/ThemeContext";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export default function Reports() {
  const { isDark } = useTheme();

  const [mode, setMode] = useState("analytics");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [revenueSummary, setRevenueSummary] = useState(null);
  const [topClients, setTopClients] = useState([]);
  const [serviceStats, setServiceStats] = useState([]);
  const [invoiceStatusSummary, setInvoiceStatusSummary] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);

  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedClientName, setSelectedClientName] = useState("");

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ type: null, payload: null });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [
          revenueRes,
          topClientsRes,
          servicesRes,
          invoiceStatusRes,
          invoicesRes,
          clientsRes,
        ] = await Promise.all([
          fetch(`${base}/api/reports/revenue`, { headers }),
          fetch(`${base}/api/reports/top-clients`, { headers }),
          fetch(`${base}/api/reports/services`, { headers }),
          fetch(`${base}/api/reports/invoices`, { headers }),
          fetch(`${base}/api/invoices`, { headers }),
          fetch(`${base}/api/clients`, { headers }),
        ]);

        if (
          !revenueRes.ok ||
          !topClientsRes.ok ||
          !servicesRes.ok ||
          !invoiceStatusRes.ok ||
          !invoicesRes.ok ||
          !clientsRes.ok
        ) {
          throw new Error("Failed to fetch one or more report endpoints");
        }

        const [
          revenueData,
          topClientsData,
          servicesData,
          invoiceStatusData,
          invoicesData,
          clientsData,
        ] = await Promise.all([
          revenueRes.json(),
          topClientsRes.json(),
          servicesRes.json(),
          invoiceStatusRes.json(),
          invoicesRes.json(),
          clientsRes.json(),
        ]);

        setRevenueSummary(revenueData);
        setTopClients(topClientsData);
        setServiceStats(servicesData);
        setInvoiceStatusSummary(invoiceStatusData);
        setInvoices(invoicesData);
        setClients(clientsData || []);
      } catch (err) {
        console.error("Error loading reports:", err);
        setError("Unable to load reports — check backend or authentication.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const refreshClients = async () => {
    try {
      const token = localStorage.getItem("token");
      const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      const res = await fetch(`${base}/api/clients`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      console.error("Error refreshing clients:", err);
    }
  };

  useEffect(() => {
    if (!selectedClientId) {
      setSelectedClientName("");
      return;
    }
    const c = clients.find((x) => Number(x.id) === Number(selectedClientId));
    setSelectedClientName(c ? c.fullName : "");
  }, [selectedClientId, clients]);

  useEffect(() => {
    if (!selectedClientName) {
      setSelectedClientId("");
      return;
    }
    const c = clients.find((x) => x.fullName === selectedClientName);
    setSelectedClientId(c ? String(c.id) : "");
  }, [selectedClientName, clients]);

  // ✅ Revenue chart uses issuedAt date now
  const revenueOverTime = useMemo(() => {
    const map = {};
    invoices.forEach((inv) => {
      if (!inv.issuedAt || typeof inv.grandTotal !== "number") return;
      const d = new Date(inv.issuedAt);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + Number(inv.grandTotal || 0);
    });
    return Object.keys(map)
      .sort()
      .map((k) => ({ month: k, revenue: Number(map[k].toFixed(2)) }));
  }, [invoices]);

  const topServiceData = useMemo(
    () => serviceStats.map((s) => ({ name: s.type, count: s._count?.type || 0 })),
    [serviceStats]
  );

  const invoiceStatusData = useMemo(
    () => invoiceStatusSummary.map((s) => ({ name: s.status, value: s._count?.status || 0 })),
    [invoiceStatusSummary]
  );

  const filteredInvoices = useMemo(() => {
    if (!selectedClientId) return invoices;
    return invoices.filter((inv) => String(inv.clientId) === String(selectedClientId));
  }, [invoices, selectedClientId]);

  const COLORS = ["#6366F1", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  const openDetailModal = (type, payload = null) => {
    setModalContent({ type, payload });
    setDetailModalOpen(true);
  };

  const closeModal = () => {
    setDetailModalOpen(false);
    setModalContent({ type: null, payload: null });
  };

  // ✅ Modal content
  const ModalBody = ({ content, isDark }) => {
    const [invoiceDetail, setInvoiceDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
      const fetchDetails = async () => {
        if (content.type !== "invoices" || !content.payload?.id) return;
        try {
          setLoadingDetail(true);
          const token = localStorage.getItem("token");
          const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
          const res = await fetch(`${base}/api/reports/invoice/${content.payload.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          setInvoiceDetail(data);
        } catch (err) {
          console.error("Error loading invoice detail:", err);
          setInvoiceDetail(null);
        } finally {
          setLoadingDetail(false);
        }
      };
      fetchDetails();
    }, [content]);

    if (content.type === "invoices") {
      if (loadingDetail)
        return <div className="text-center py-8 text-gray-400">Loading invoice details...</div>;
      if (!invoiceDetail)
        return <div className="text-center py-8 text-gray-400">No details found.</div>;

      const { client, services } = invoiceDetail;

      return (
        <div className="space-y-6 overflow-y-auto max-h-[70vh]">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold mb-1">Invoice #{invoiceDetail.invoiceNumber}</h2>
            <p className="text-sm text-gray-400">
              Issued: {new Date(invoiceDetail.issuedAt).toLocaleDateString()} | Due:{" "}
              {invoiceDetail.dueDate
                ? new Date(invoiceDetail.dueDate).toLocaleDateString()
                : "N/A"}
            </p>
            <p
              className={`font-semibold ${invoiceDetail.status === "Paid"
                  ? "text-green-500"
                  : invoiceDetail.status === "Pending"
                    ? "text-yellow-500"
                    : "text-red-500"
                }`}
            >
              Status: {invoiceDetail.status}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Client Information</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div><b>Name:</b> {client.fullName}</div>
              <div><b>Phone:</b> {client.phone}</div>
              <div><b>Email:</b> {client.email}</div>
              <div><b>Address:</b> {client.address}</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Vehicle Information</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div><b>Make:</b> {client.vehicleMake}</div>
              <div><b>Model:</b> {client.vehicleModel}</div>
              <div><b>Year:</b> {client.vehicleYear}</div>
              <div><b>Reg No:</b> {client.regNumber}</div>
              <div><b>VIN:</b> {client.vin}</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">Service Details</h3>
            {services.length === 0 ? (
              <p className="text-sm text-gray-500">No services linked to this invoice.</p>
            ) : (
              services.map((srv) => (
                <div
                  key={srv.id}
                  className={`p-4 rounded-lg border mb-2 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-semibold">{srv.type}</div>
                    <div className="font-bold text-green-500">
                      ${Number(srv.cost || 0).toFixed(2)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {srv.description || "No description"}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Date: {srv.date ? new Date(srv.date).toLocaleDateString() : "N/A"} | Status:{" "}
                    <span
                      className={
                        srv.status === "Completed"
                          ? "text-green-400"
                          : srv.status === "Pending"
                            ? "text-yellow-400"
                            : "text-gray-400"
                      }
                    >
                      {srv.status}
                    </span>
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="border-t pt-4 text-right">
            <div className="text-sm text-gray-400">
              Subtotal: ${Number(invoiceDetail.totalAmount || 0).toFixed(2)} <br />
              Tax: ${Number(invoiceDetail.tax || 0).toFixed(2)} | Discount: $
              {Number(invoiceDetail.discount || 0).toFixed(2)}
            </div>
            <h3 className="text-xl font-bold mt-2">
              Grand Total: ${Number(invoiceDetail.grandTotal || 0).toFixed(2)}
            </h3>
          </div>
        </div>
      );
    }

    return <div className="text-gray-500 text-center py-8">Select a report to view details</div>;
  };

  if (loading) {
    return (
      <div
        className={`lg:ml-16 min-h-screen flex items-center justify-center ${isDark ? "bg-gray-900" : "bg-gray-50"
          }`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className={`text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
            Loading reports...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:ml-16 p-6 space-y-6">
      {/* Buttons */}
      <div className="flex gap-4 items-center">
        <button
          onClick={() => setMode("analytics")}
          className={`px-6 py-3 rounded-2xl font-semibold ${mode === "analytics"
              ? "shadow-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
              : isDark
                ? "bg-gray-800 text-white border border-gray-700"
                : "bg-white text-gray-800 border border-gray-200"
            }`}
        >
          Analytics
        </button>
        <button
          onClick={() => setMode("reports")}
          className={`px-6 py-3 rounded-2xl font-semibold ${mode === "reports"
              ? "shadow-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
              : isDark
                ? "bg-gray-800 text-white border border-gray-700"
                : "bg-white text-gray-800 border border-gray-200"
            }`}
        >
          Reports
        </button>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className={`p-2 rounded-lg ${isDark
                ? "bg-gray-800 text-white border border-gray-700"
                : "bg-white text-gray-700 border border-gray-200"
              }`}
          >
            <FiPrinter />
          </button>
          <button
            onClick={() => alert("Export coming soon")}
            className={`p-2 rounded-lg ${isDark
                ? "bg-gray-800 text-white border border-gray-700"
                : "bg-white text-gray-700 border border-gray-200"
              }`}
          >
            <FiDownload />
          </button>
        </div>
      </div>

      {/* Reports mode — invoices clickable */}
      {mode === "reports" && (
        <div className="space-y-6">
          <div
            className={`w-full rounded-3xl overflow-hidden ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              } shadow-lg border`}
          >
            <div
              className={`p-5 border-b ${isDark
                  ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700"
                  : "border-gray-200 bg-gradient-to-r from-green-600 to-teal-600"
                }`}
            >
              <h3 className="text-2xl font-bold text-white">Recent Invoices</h3>
              <p className="text-sm text-white/80">
                Click to view invoices (filtered by client if chosen)
              </p>
            </div>
            <div className="p-6">
              {filteredInvoices.length === 0 ? (
                <div className="text-gray-500">No invoices</div>
              ) : (
                filteredInvoices.slice(0, 5).map((inv) => (
                  <div
                    key={inv.id}
                    className="py-3 flex justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 transition"
                    onClick={() => openDetailModal("invoices", inv)} // ✅ FIXED
                  >
                    <div>
                      <div className="font-semibold">Invoice #{inv.id}</div>
                      <div className="text-xs text-gray-400">
                        {inv.client?.fullName || `Client #${inv.clientId}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        ${Number(inv.grandTotal || 0).toFixed(2)}
                      </div>
                      <div
                        className={`text-xs mt-1 ${inv.status === "Paid"
                            ? "text-green-500"
                            : inv.status === "Pending"
                              ? "text-yellow-500"
                              : "text-red-500"
                          }`}
                      >
                        {inv.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className={`max-w-3xl w-full rounded-2xl overflow-hidden ${isDark
                ? "bg-gray-900 text-white border-gray-700"
                : "bg-white text-gray-900 border-gray-200"
              } border shadow-2xl`}
          >
            <div
              className={`p-4 flex items-center justify-between border-b ${isDark ? "border-gray-800 bg-gray-800" : "border-gray-100 bg-gray-50"
                }`}
            >
              <div>
                <h3 className="text-xl font-bold">
                  {modalContent.type === "invoices"
                    ? "Invoice Details"
                    : "Details"}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className={`px-4 py-2 rounded-lg ${isDark ? "bg-gray-800" : "bg-gray-100"
                  }`}
              >
                Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5">
              <ModalBody content={modalContent} isDark={isDark} />
            </div>
          </div>
        </div>
      )}

      {/* Analytics Mode */}
      {mode === "analytics" && (
        <div className="space-y-6">
          {/* Revenue Over Time Chart (Full Width) */}
          <div
            className={`w-full rounded-3xl overflow-hidden ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              } shadow-lg border`}
          >
            <div
              className={`p-5 border-b ${isDark
                  ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700"
                  : "border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600"
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    Revenue Over Time
                  </h3>
                  <p className="text-sm text-white/80">
                    Monthly revenue based on issued invoice dates
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {revenueOverTime.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  No revenue data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={revenueOverTime}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? "#374151" : "#e6e6e6"}
                    />
                    <XAxis
                      dataKey="month"
                      stroke={isDark ? "#9CA3AF" : "#6B7280"}
                    />
                    <YAxis stroke={isDark ? "#9CA3AF" : "#6B7280"} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1F2937" : "#fff",
                        borderRadius: "0.5rem",
                        border: "1px solid #ccc",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6366F1"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Invoice Status Distribution */}
          <div
            className={`w-full rounded-3xl overflow-hidden ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              } shadow-lg border`}
          >
            <div
              className={`p-5 border-b ${isDark
                  ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700"
                  : "border-gray-200 bg-gradient-to-r from-green-600 to-teal-600"
                }`}
            >
              <h3 className="text-2xl font-bold text-white">
                Invoice Status Distribution
              </h3>
              <p className="text-sm text-white/80">
                How invoices are distributed by payment status
              </p>
            </div>
            <div className="p-6">
              {invoiceStatusData.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  No invoice data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={invoiceStatusData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={100}
                      label
                    >
                      {invoiceStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1F2937" : "#fff",
                        borderRadius: "0.5rem",
                        border: "1px solid #ccc",
                      }}
                    />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top Services */}
          <div
            className={`w-full rounded-3xl overflow-hidden ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              } shadow-lg border`}
          >
            <div
              className={`p-5 border-b ${isDark
                  ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700"
                  : "border-gray-200 bg-gradient-to-r from-pink-600 to-orange-500"
                }`}
            >
              <h3 className="text-2xl font-bold text-white">Top Services</h3>
              <p className="text-sm text-white/80">
                Most frequently performed service types
              </p>
            </div>
            <div className="p-6">
              {topServiceData.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  No service data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    layout="vertical"
                    data={topServiceData}
                    margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? "#374151" : "#e6e6e6"}
                    />
                    <XAxis
                      type="number"
                      stroke={isDark ? "#9CA3AF" : "#6B7280"}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={160}
                      stroke={isDark ? "#9CA3AF" : "#6B7280"}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1F2937" : "#fff",
                        borderRadius: "0.5rem",
                        border: "1px solid #ccc",
                      }}
                    />
                    <Bar dataKey="count" fill="#06B6D4" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
