// src/hooks/useRcExtraction.js
import { useState, useEffect } from "react";
import { useImageCapture } from "./useImageCapture";
import { useOcrProcessor } from "./useOcrProcessor";
import { useEditableData } from "./useEditableData";
import { mockData } from "../utils/mockData";

export const useRcExtraction = () => {
  const { capturedImage, error: imageError, fileInputRef, openCamera, handleImageCapture, resetImage } = useImageCapture();
  const { 
    ocrProgress, 
    ocrStatus, 
    rawOcrText, 
    error: ocrError, 
    processImage, 
    terminateWorker,
    getDebugLogs
  } = useOcrProcessor();
  const { data: cardDetails, setData: setCardDetails, isEditing, setIsEditing, handleEditChange } = useEditableData(null);

  const [scanResult, setScanResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);

  // Track processing state
  useEffect(() => {
    setIsProcessing(ocrStatus === "processing" || ocrStatus === "starting" || ocrStatus === "initializing");
    
    // Update debug logs
    if (ocrStatus === "done" || ocrStatus === "error") {
      setDebugLogs(getDebugLogs());
    }
  }, [ocrStatus, getDebugLogs]);

  const startProcessing = async () => {
    if (!capturedImage) {
      setScanResult("Please capture an image first");
      return;
    }

    setIsUsingMockData(false);
    setScanResult(null);
    setDebugLogs([]);
    
    try {
      const { data, error } = await processImage(capturedImage);
      if (data) {
        // Check if we got any meaningful data
        const hasData = Object.values(data).some(value => value !== "" && value !== null);
        
        if (hasData) {
          setCardDetails(data);
          setScanResult("Data extracted successfully");
        } else {
          setScanResult("OCR completed but no data was extracted. Using mock data.");
          setCardDetails(mockData);
          setIsUsingMockData(true);
        }
      } else {
        setScanResult(`OCR failed: ${error}. Using mock data.`);
        setCardDetails(mockData);
        setIsUsingMockData(true);
      }
    } catch (err) {
      console.error("Error in OCR processing:", err);
      setScanResult(`OCR processing failed: ${err.message}. Using mock data.`);
      setCardDetails(mockData);
      setIsUsingMockData(true);
    }
  };

  const resetSearch = () => {
    resetImage();
    setCardDetails(null);
    setScanResult(null);
    setIsEditing(false);
    setIsUsingMockData(false);
    setDebugLogs([]);
    terminateWorker(); // Terminate worker to ensure clean state
  };

  return {
    cardDetails,
    isEditing,
    ocrProgress,
    ocrStatus,
    rawOcrText,
    capturedImage,
    fileInputRef,
    imageError,
    ocrError,
    isProcessing,
    isUsingMockData,
    debugLogs,
    openCamera,
    handleImageCapture,
    resetSearch,
    startProcessing,
    setIsEditing,
    handleEditChange,
  };
};