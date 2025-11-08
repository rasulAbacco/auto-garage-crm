// client/src/pages/details/DetailsPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import OCRUploader from "./components/OCRUploader";
import OCRResults from "./components/OCRResults";
import OCRHistory from "./components/OCRHistory";
import OCRDebugPanel from "./components/OCRDebugPanel";
import { processImage } from "./utils/OCRProcessor.js";
import { saveRecord, loadHistory, deleteRecord, clearHistory } from "./utils/storageUtils";
import { FiFileText, FiCheckCircle, FiRotateCcw } from "react-icons/fi";

const DetailsPage = () => {
  const { isDark } = useTheme();
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

  useEffect(() => {
    setHistoryData(loadHistory());
  }, []);

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

  const handleSave = (data) => {
    const newRecord = saveRecord(data);
    setHistoryData((prev) => [...prev, newRecord]);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

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
    <div className={`min-h-screen p-6 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div
          className={`rounded-3xl p-8 shadow-2xl ${
            isDark
              ? "bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800"
              : "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <FiFileText className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white mb-1">RC Scanner Pro</h1>
                <p className="text-white/80 text-lg">
                  OCR-based RC extraction — fully client-side
                </p>
              </div>
            </div>
            {isSaved && (
              <div className="bg-green-500/20 border-2 border-green-400 text-white px-4 py-2 rounded-xl flex items-center gap-2">
                <FiCheckCircle /> <span>Saved!</span>
              </div>
            )}
          </div>
        </div>

        {/* Upload or Camera */}
        <OCRUploader
          isDark={isDark}
          onImageSelect={setSelectedImage}
          onImageCaptured={handleStartOCR}
          selectedImage={selectedImage}
          onReset={handleReset}
        />

        {/* Progress Bar */}
        {ocrStatus !== "idle" && (
          <div
            className={`px-6 py-4 rounded-xl ${
              isDark ? "bg-blue-900/20" : "bg-blue-50"
            }`}
          >
            <div className="flex justify-between text-sm font-semibold mb-1">
              <span>{ocrStatus}</span>
              <span>{ocrProgress}%</span>
            </div>
            <div className="w-full h-3 bg-gray-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Results */}
        {parsedData && (
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
        )}

        {/* Debug Info */}
        <OCRDebugPanel isDark={isDark} debugInfo={debugInfo} />

        {/* History */}
        <OCRHistory
          isDark={isDark}
          historyData={historyData}
          onDelete={(id) => {
            deleteRecord(id);
            setHistoryData(loadHistory());
          }}
          onClear={() => {
            clearHistory();
            setHistoryData([]);
          }}
        />

        {/* Reset Button */}
        <div className="flex justify-center">
          <button
            onClick={handleReset}
            className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center gap-2"
          >
            <FiRotateCcw /> New Scan
          </button>
        </div>

        <div className="text-center text-sm text-gray-500 pt-4">
          Powered by Tesseract.js — All processing happens in your browser.
        </div>
      </div>
    </div>
  );
};

export default DetailsPage;
