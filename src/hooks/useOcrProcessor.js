import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { preprocessImage } from '../utils/imagePreprocessing';
import { parseOCRText } from '../../src/utils/parseOCRText';

export const useOCR = () => {
  const processingRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("idle");
  const [rawOcrText, setRawOcrText] = useState("");
  const [debugInfo, setDebugInfo] = useState({});

  // Enhanced OCR processing with better error handling
  const processImage = async (image) => {
    if (!image || processingRef.current) return { data: null, error: "Processing error" };

    processingRef.current = true;
    setOcrProgress(0);
    setOcrStatus("starting");
    setRawOcrText("");

    try {
      setOcrStatus("preprocessing");
      setOcrProgress(5);
      
      let preprocessedImage;
      try {
        preprocessedImage = await preprocessImage(image);
        setOcrProgress(10);
      } catch (e) {
        console.error("Preprocessing failed:", e);
        preprocessedImage = image;
      }
      
      setOcrStatus("processing");
      
      const result = await Tesseract.recognize(
        preprocessedImage,
        'eng',
        {
          logger: (m) => {
            if (m.progress) {
              setOcrProgress(Math.round(10 + m.progress * 80));
            }
            setOcrStatus(`Processing: ${Math.round(m.progress * 100)}%`);
          },
          tessedit_ocr_engine_mode: 1,  // Use LSTM engine
          tessedit_pageseg_mode: 6,     // Assume single uniform block of text
          preserve_interword_spaces: '1',
        }
      );
      
      let text = result.data.text || "";
      
      // Enhanced text cleaning
      text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
      text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      text = text.replace(/[ \t]+/g, ' ');
      text = text.replace(/\n{3,}/g, '\n\n'); // Remove excessive line breaks
      
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      text = lines.join('\n').trim();
      
      if (!text || text.length < 3) {
        throw new Error("OCR failed to extract meaningful text");
      }
      
      setRawOcrText(text);
      
      setOcrStatus("parsing");
      setOcrProgress(95);
      
      const parsedData = parseOCRText(text, result.data.confidence || 0);
      
      // Set debug info for quality report
      setDebugInfo({
        confidence: result.data.confidence || 0,
        quality: result.data.confidence >= 80 ? "High" : 
                result.data.confidence >= 60 ? "Medium" : "Low",
        extractedFields: Object.values(parsedData).filter(v => v && v !== "").length,
        textLength: text.length,
        parseSuccess: parsedData && Object.keys(parsedData).some(k => parsedData[k] && parsedData[k] !== "") 
          ? "Data extracted successfully" : "No structured data found",
        suggestions: result.data.confidence < 60 ? [
          "Try taking a clearer photo with better lighting",
          "Ensure the document is flat and free of shadows",
          "Check if the image is in focus"
        ] : []
      });
      
      setOcrStatus("done");
      setOcrProgress(100);
      
      return { data: parsedData, rawOcrText: text, error: null };
    } catch (err) {
      console.error("OCR processing error:", err);
      setOcrStatus("error");
      return { data: null, error: err.message || "OCR failed" };
    } finally {
      processingRef.current = false;
    }
  };

  return {
    isProcessing,
    ocrProgress,
    ocrStatus,
    rawOcrText,
    debugInfo,
    processImage
  };
};