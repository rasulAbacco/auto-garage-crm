import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import OCRUploader from "./components/OCRUploader";
import OCRResults from "./components/OCRResults";
import OCRHistory from "./components/OCRHistory";
import OCRDebugPanel from "./components/OCRDebugPanel";
import { processImage } from "./utils/OCRProcessor.js";
import {
  saveRecord,
  loadHistory,
  deleteRecord,
  clearHistory,
} from "./utils/storageUtils";
import {
  FiFileText,
  FiCheckCircle,
  FiRotateCcw,
  FiUsers,
  FiAlertTriangle,
  FiLoader,
  FiCamera,
  FiUpload,
  FiDatabase,
  FiSettings,
  FiRefreshCw,
  FiTrash2,
  FiSave,
} from "react-icons/fi";

import { Toaster } from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const DetailsPage = () => {
  const { isDark } = useTheme();
  const [searchParams] = useSearchParams();
  const urlClientId = searchParams.get("clientId");
  const urlClientName = searchParams.get("clientName");

  const [clientId, setClientId] = useState(urlClientId || "");
  const [clientName, setClientName] = useState(urlClientName || "");
  const [clientList, setClientList] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientError, setClientError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [rawOcrText, setRawOcrText] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("idle");
  const [debugInfo, setDebugInfo] = useState({});
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [isSaved, setIsSaved] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  const processingRef = useRef(false);

  /* -----------------------------------------------------
   🧭 Load clients (if not auto-linked)
  ----------------------------------------------------- */
  useEffect(() => {
    const fetchClients = async () => {
      if (urlClientId) return;

      setLoadingClients(true);
      setClientError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found. Please log in again.");
        }

        console.log("Fetching clients from:", `${API_BASE}/api/clients`);
        const res = await fetch(`${API_BASE}/api/clients`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Server response:", res.status, errorText);
          throw new Error(`Failed to load clients: ${res.status} ${errorText}`);
        }

        const data = await res.json();
        console.log("Received data:", data);

        let clientsArray = [];
        if (Array.isArray(data)) {
          clientsArray = data;
        } else if (data && Array.isArray(data.clients)) {
          clientsArray = data.clients;
        } else if (data && Array.isArray(data.data)) {
          clientsArray = data.data;
        } else {
          console.warn("Unexpected data format:", data);
          throw new Error("Unexpected data format from server");
        }

        setClientList(clientsArray);
        console.log(`Loaded ${clientsArray.length} clients`);
      } catch (err) {
        console.error("Error fetching clients:", err);
        setClientError(err.message);
        setClientList([]);
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClients();
  }, [urlClientId]);

  /* -----------------------------------------------------
   🧠 Load OCR history for this client
  ----------------------------------------------------- */
  useEffect(() => {
    const fetchHistory = async () => {
      if (!clientId) return;

      try {
        const data = await loadHistory(clientId);
        setHistoryData(data);
      } catch (err) {
        console.error("Error loading OCR history:", err);
      }
    };

    fetchHistory();
  }, [clientId]);

  /* -----------------------------------------------------
   🚀 Start OCR process
  ----------------------------------------------------- */
  const handleStartOCR = async (image) => {
    if (!image || processingRef.current) return;
    processingRef.current = true;
    setError(null);
    setOcrProgress(0);
    setOcrStatus("Starting OCR...");

    try {
      const result = await processImage(image, (progress) => {
        setOcrProgress(Math.round(progress * 100));
        setOcrStatus(`Processing... ${Math.round(progress * 100)}%`);
      });

      setParsedData(result.parsed);
      setRawOcrText(result.text);
      setDebugInfo({
        confidence: result.confidence,
        quality:
          result.confidence >= 80
            ? "High"
            : result.confidence >= 60
              ? "Medium"
              : "Low",
        extractedFields: Object.values(result.parsed).filter(Boolean).length,
      });
      setOcrStatus("done");
    } catch (err) {
      setError(`OCR failed: ${err.message}`);
      setOcrStatus("error");
    } finally {
      processingRef.current = false;
    }
  };

  /* -----------------------------------------------------
   💾 Save record to backend
  ----------------------------------------------------- */
  const handleSave = async (data) => {
    try {
      if (!clientId) {
        toast.error("Please select or open a client to save OCR data.");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const res = await fetch(`${API_BASE}/api/ocr/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          rawText: rawOcrText,
          parsedData: JSON.stringify(data),
          confidence: debugInfo.confidence || 0,
        }),
      });

      if (!res.ok) {
        const errMsg = await res.text();
        throw new Error(errMsg || "Failed to save record");
      }

      const { record } = await res.json();
      setHistoryData((prev) => [...prev, record]);
      setIsSaved(true);
      toast.success("OCR data saved successfully!");
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err) {
      toast.error(err.message);
    }
  };

  /* -----------------------------------------------------
   🔄 Reset OCR process
  ----------------------------------------------------- */
  const handleReset = () => {
    setSelectedImage(null);
    setParsedData(null);
    setRawOcrText("");
    setEditedData({});
    setError(null);
    setOcrProgress(0);
    setOcrStatus("idle");
    setDebugInfo({});
  };

  return (
    <div className={`min-h-screen p-4 sm:p-6 ${isDark ? "bg-gray-900" : "bg-gray-50"} transition-colors duration-300`}>
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: isDark ? '#374151' : '#ffffff',
              color: isDark ? '#f3f4f6' : '#1f2937',
              border: isDark ? '1px solid #4b5563' : '1px solid #e5e7eb',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: isDark ? '#111827' : '#f9fafb',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: isDark ? '#111827' : '#f9fafb',
              },
            },
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 ">
        {/* Header */}
        <div
          className={`rounded-3xl p-6 sm:p-8 shadow-2xl transition-all duration-300 hover:shadow-3xl ${isDark
            ? "bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800"
            : "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"
            }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm transition-transform duration-300 hover:scale-110">
                <FiFileText className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-white mb-1">
                  RC Scanner Pro
                </h1>
                <p className="text-white/80 text-base sm:text-lg">
                  OCR-based RC extraction — now linked with backend
                </p>

                {/* Client Info */}
                {clientId ? (
                  <div className="mt-3 flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-lg border border-green-400/30 w-fit">
                    <FiCheckCircle className="text-green-300" />
                    <span className="text-green-300 text-sm font-medium">
                      Linked to: {clientName || "Selected Client"}
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2 bg-yellow-500/20 px-3 py-1.5 rounded-lg border border-yellow-400/30 w-fit">
                    <FiAlertTriangle className="text-yellow-300" />
                    <span className="text-yellow-300 text-sm font-medium">
                      Please select a client before saving
                    </span>
                  </div>
                )}
              </div>
            </div>

            {isSaved && (
              <div className="bg-green-500/20 border-2 border-green-400 text-white px-4 py-2 rounded-xl flex items-center gap-2 animate-pulse">
                <FiCheckCircle /> <span>Saved!</span>
              </div>
            )}
          </div>

          {/* Manual client selection */}
          {!urlClientId && (
            <div className="mt-6 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20 transition-all duration-300 hover:bg-white/15">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 text-white">
                  <FiUsers className="text-lg" />
                  <span className="font-medium">Select Client:</span>
                </div>

                {loadingClients ? (
                  <div className="flex items-center gap-2 text-white">
                    <FiLoader className="animate-spin" />
                    <span>Loading clients...</span>
                  </div>
                ) : clientError ? (
                  <div className="text-red-300 text-sm bg-red-500/20 px-3 py-1.5 rounded-lg">
                    {clientError}
                  </div>
                ) : (
                  <select
                    value={clientId}
                    onChange={(e) => {
                      const selected = clientList.find((c) => c.id === parseInt(e.target.value));
                      setClientId(selected?.id || "");
                      setClientName(selected?.fullName || "");
                    }}
                    className="px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300"
                  >
                    <option value="" className="bg-gray-800 text-white">Select Client</option>
                    {clientList.length > 0 ? (
                      clientList.map((c) => (
                        <option key={c.id} value={c.id} className="bg-gray-800 text-white">
                          {c.fullName} ({c.vehicleMake} {c.vehicleModel})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled className="bg-gray-800 text-white">
                        No clients available
                      </option>
                    )}
                  </select>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Upload or Camera */}
        <div className={`rounded-2xl p-6 shadow-xl transition-all duration-300 hover:shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white">
              <FiCamera />
            </div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Capture RC Document</h2>
          </div>

          <OCRUploader
            isDark={isDark}
            onImageSelect={setSelectedImage}
            onImageCaptured={handleStartOCR}
            selectedImage={selectedImage}
            onReset={handleReset}
          />
        </div>

        {/* Progress Bar */}
        {ocrStatus !== "idle" && (
          <div
            className={`rounded-2xl p-6 shadow-xl transition-all duration-300 ${isDark ? "bg-blue-900/20" : "bg-blue-50"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FiLoader className={`text-lg ${ocrStatus === "error" ? "text-red-500" : "text-blue-500"} ${ocrStatus !== "error" && ocrStatus !== "done" ? "animate-spin" : ""}`} />
                <span className={`font-medium ${ocrStatus === "error" ? "text-red-500" : isDark ? "text-blue-300" : "text-blue-700"}`}>
                  {ocrStatus}
                </span>
              </div>
              <span className={`font-semibold ${isDark ? "text-blue-300" : "text-blue-700"}`}>
                {ocrProgress}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-300 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${ocrStatus === "error" ? "bg-gradient-to-r from-red-500 to-red-600" : "bg-gradient-to-r from-blue-600 to-purple-600"}`}
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Results */}
        {parsedData && (
          <div className={`rounded-2xl p-6 shadow-xl transition-all duration-300 hover:shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white">
                <FiDatabase />
              </div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>OCR Results</h2>
            </div>

            <OCRResults
              isDark={isDark}
              parsedData={parsedData}
              rawOcrText={rawOcrText}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              editedData={editedData}
              setEditedData={setEditedData}
              onSave={handleSave}
            />
          </div>
        )}

        {/* Debug Info */}
        <div className={`rounded-2xl p-6 shadow-xl transition-all duration-300 hover:shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-white">
              <FiSettings />
            </div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Debug Information</h2>
          </div>

          <OCRDebugPanel isDark={isDark} debugInfo={debugInfo} />
        </div>

        {/* History */}
        <div className={`rounded-2xl p-6 shadow-xl transition-all duration-300 hover:shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white">
              <FiDatabase />
            </div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>OCR History</h2>
          </div>

          <OCRHistory
            isDark={isDark}
            historyData={historyData}
            onDelete={async (id) => {
              await deleteRecord(id);
              const data = await loadHistory(clientId);
              setHistoryData(data);
              toast.success("Record deleted successfully");
            }}
            onClear={async () => {
              await clearHistory(clientId);
              setHistoryData([]);
              toast.success("History cleared successfully");
            }}
          />
        </div>

        {/* Reset Button */}
        <div className="flex justify-center">
          <button
            onClick={handleReset}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 text-white flex items-center gap-2 transition-all duration-300 hover:shadow-lg hover:scale-105"
          >
            <FiRefreshCw /> New Scan
          </button>
        </div>

        <div className={`text-center text-sm py-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <div className="flex items-center justify-center gap-2">
            <FiUpload className="text-lg" />
            <span>Powered by Tesseract.js — OCR processed locally, results stored in backend</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsPage;