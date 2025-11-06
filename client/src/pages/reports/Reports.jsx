// client/src/pages/reports/Reports.jsx
import React, { useState, useEffect } from "react";
import { FiPrinter, FiDownload } from "react-icons/fi";
import { useTheme } from "../../contexts/ThemeContext";
import AnalyticsView from "./AnalyticsView";
import ReportsList from "./ReportsList";

export default function Reports() {
  const { isDark } = useTheme();
  const [mode, setMode] = useState(localStorage.getItem("reportMode") || "analytics");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [error, setError] = useState(null);

  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [summaryRes, invoicesRes, clientsRes] = await Promise.all([
        fetch(`${base}/api/reports/summary`, { headers }),
        fetch(`${base}/api/invoices`, { headers }),
        fetch(`${base}/api/clients`, { headers }),
      ]);

      const [summaryData, invoicesData, clientsData] = await Promise.all([
        summaryRes.json(),
        invoicesRes.json(),
        clientsRes.json(),
      ]);

      setSummary(summaryData);
      setInvoices(invoicesData);
      setClients(clientsData);
    } catch (err) {
      console.error(err);
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleMode = (m) => {
    setMode(m);
    localStorage.setItem("reportMode", m);
  };

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center min-h-screen ${isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"
          }`}
      >
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading Reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:ml-16 p-6 space-y-6">
      {/* Header */}
      <div className="flex gap-4 items-center">
        <button
          onClick={() => toggleMode("analytics")}
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
          onClick={() => toggleMode("reports")}
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
            onClick={() => alert("Export feature coming soon")}
            className={`p-2 rounded-lg ${isDark
                ? "bg-gray-800 text-white border border-gray-700"
                : "bg-white text-gray-700 border border-gray-200"
              }`}
          >
            <FiDownload />
          </button>
        </div>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      {mode === "analytics" ? (
        <AnalyticsView summary={summary} invoices={invoices} isDark={isDark} />
      ) : (
        <ReportsList invoices={invoices} clients={clients} isDark={isDark} />
      )}
    </div>
  );
}
