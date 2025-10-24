import React, { useState, useRef, useEffect } from "react";
import Tesseract from "tesseract.js";

// Enhanced OCR Parser function with better field extraction
const parseOCRText = (text, confidence = 0) => {
  if (!text) return {};

  try {
    let cleanedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    if (confidence < 50) {
      cleanedText = cleanedText.replace(/\b[A-Za-z]\b/g, ' ');
      cleanedText = cleanedText.replace(/[^a-zA-Z0-9\s\n\-\/\.,:]/g, ' ');
    }

    const lines = cleanedText.split('\n').map(line => line.trim()).filter(line => line);
    
    const result = {
      regNo: "", regDate: "", formNumber: "", oSlNo: "",
      chassisNo: "", engineNo: "", mfr: "", model: "",
      vehicleClass: "", colour: "", body: "", wheelBase: "",
      mfgDate: "", fuel: "", regFcUpto: "", taxUpto: "",
      noOfCyl: "", unladenWt: "", seating: "", stdgSlpr: "",
      cc: "", ownerName: "", swdOf: "", address: "",
      ocrConfidence: confidence,
      extractedDate: new Date().toISOString()
    };

    if (cleanedText.length < 3 || !/[a-zA-Z]/.test(cleanedText)) return result;

    // Helper function to find value after a label
    const findValueAfterLabel = (label, options = {}) => {
      const { multiline = false, nextLineOnly = false, exactMatch = false } = options;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const regex = exactMatch 
          ? new RegExp(`\\b${label}\\b`, 'gi')
          : new RegExp(label, 'gi');
        
        if (regex.test(line)) {
          const colonIndex = line.search(/[:]/);
          if (colonIndex !== -1) {
            let value = line.substring(colonIndex + 1).trim();
            value = value.replace(/[~!@#$%^&*()_+\-=\[\]{};':"\\|<>\/?]+/g, ' ').trim();
            
            if (options.pattern) {
              const match = value.match(options.pattern);
              if (match) return match[0];
            }
            
            if (value && value.length > 0) return value;
          }
          
          if (!line.includes(':')) {
            const labelIndex = line.search(regex);
            if (labelIndex !== -1) {
              let value = line.substring(labelIndex + label.length).trim();
              value = value.replace(/[~!@#$%^&*()_+\-=\[\]{};':"\\|<>\/?]+/g, ' ').trim();
              
              if (options.pattern) {
                const match = value.match(options.pattern);
                if (match) return match[0];
              }
              
              if (value && value.length > 0) return value;
            }
          }
          
          if (i + 1 < lines.length && (nextLineOnly || !line.includes(':'))) {
            const nextLine = lines[i + 1].trim();
            if (nextLine && nextLine.length > 0) {
              let value = nextLine.replace(/[~!@#$%^&*()_+\-=\[\]{};':"\\|<>\/?]+/g, ' ').trim();
              
              if (options.pattern) {
                const match = value.match(options.pattern);
                if (match) return match[0];
              }
              
              return value;
            }
          }
          
          if (multiline && i + 1 < lines.length) {
            let addressLines = [];
            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
              const nextLine = lines[j].trim();
              if (nextLine && !/^(FORM|REG|CHASSIS|ENGINE|MFR|MODEL|CLASS|COLOUR|BODY|WHEEL|BASE|MFG|FUEL|REGFC|TAX|NOOFCYL|UNLADEN|SEATING|STDG|CC|OWNERNAME|SWDOF|ADDRESS)$/i.test(nextLine)) {
                addressLines.push(nextLine);
              } else break;
            }
            if (addressLines.length > 0) return addressLines.join(', ');
          }
        }
      }
      return "";
    };

    // Extract Registration Number
    const findRegNo = () => {
      for (const line of lines) {
        if (/REG\s*NO/i.test(line)) {
          const match = line.match(/REG\s*NO\s*[:\s]*([A-Z0-9]+)/i);
          if (match && match[1]) return match[1].trim();
        }
      }
      
      const patterns = [
        /\b([A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4})\b/gi,
        /\b([A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4})\b/gi,
        /\b([A-Z0-9]{8,12})\b/gi,
      ];
      
      for (const pattern of patterns) {
        const match = cleanedText.match(pattern);
        if (match) {
          const cleaned = match[0].replace(/[^A-Z0-9]/gi, '').trim();
          if (cleaned.length >= 8 && cleaned.length <= 12) return cleaned;
        }
      }
      return "";
    };

    // Extract Date
    const findDate = (label) => {
      const value = findValueAfterLabel(label);
      const datePatterns = [
        /\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/,
        /\d{1,2}\s\d{1,2}\s\d{4}/,
        /\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/,
      ];
      
      for (const pattern of datePatterns) {
        const dateMatch = value.match(pattern);
        if (dateMatch) return dateMatch[0];
      }
      return value;
    };

    // Extract Chassis Number
    const findChassisNumber = () => {
      for (let i = 0; i < lines.length; i++) {
        if (/CHASSIS\s*NO/i.test(lines[i])) {
          const match = lines[i].match(/CHASSIS\s*NO\s*[:\s]*([A-Z0-9]+)/i);
          if (match && match[1]) return match[1].trim();
          
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            const chassisMatch = nextLine.match(/([A-Z0-9]{10,20})/i);
            if (chassisMatch) return chassisMatch[1].trim();
          }
        }
      }
      
      const value = findValueAfterLabel('CHASSIS\\.?\\s*NO');
      if (value) {
        const chassisMatch = value.match(/([A-Z0-9]{10,20})/i);
        if (chassisMatch) return chassisMatch[1].trim();
      }
      
      for (const line of lines) {
        const chassisMatch = line.match(/([A-Z0-9]{10,20})/i);
        if (chassisMatch) return chassisMatch[1].trim();
      }
      
      return "";
    };

    // Extract Engine Number
    const findEngineNumber = () => {
      for (let i = 0; i < lines.length; i++) {
        if (/ENGINE\s*NO/i.test(lines[i])) {
          const match = lines[i].match(/ENGINE\s*NO\s*[:\s]*([A-Z0-9]+)/i);
          if (match && match[1]) return match[1].trim();
          
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            const engineMatch = nextLine.match(/([A-Z0-9]{6,20})/i);
            if (engineMatch) return engineMatch[1].trim();
          }
        }
      }
      
      const value = findValueAfterLabel('ENGINE\\.?\\s*NO');
      if (value) {
        const engineMatch = value.match(/([A-Z0-9]{6,20})/i);
        if (engineMatch) return engineMatch[1].trim();
      }
      
      for (const line of lines) {
        const engineMatch = line.match(/([A-Z0-9]{6,20})/i);
        if (engineMatch) return engineMatch[1].trim();
      }
      
      return "";
    };

    // Extract Form Number
    const findFormNumber = () => {
      for (let i = 0; i < lines.length; i++) {
        if (/FORM/i.test(lines[i])) {
          const formMatch = lines[i].match(/FORM\s*[:\-]?\s*(\d+[A-Z]?)/i);
          if (formMatch) return formMatch[1];
        }
      }
      
      for (let i = 0; i < lines.length; i++) {
        if (/REG NO/i.test(lines[i])) {
          const words = lines[i].split(' ');
          if (words.length > 2) {
            const lastWord = words[words.length - 1];
            if (!/^[A-Z0-9]+$/.test(lastWord) || lastWord.length < 8) {
              return lastWord;
            }
          }
        }
      }
      
      return "";
    };

    // Extract O.SL.NO
    const findOSlNo = () => {
      const value = findValueAfterLabel('O\\.SL\\.NO');
      if (value) {
        const match = value.match(/(\d+)$/);
        if (match) return match[1];
        return value;
      }
      
      const pattern = /O\.SL\.NO\s*(\d+)/i;
      const match = cleanedText.match(pattern);
      if (match) return match[1];
      
      return "";
    };

    // Extract color
    const findColor = () => {
      const value = findValueAfterLabel('COLOUR');
      if (value) {
        const colorMatch = value.match(/COLOUR\s*([A-Za-z\s]+)$/i);
        if (colorMatch) return colorMatch[1].trim();
        
        const parts = value.split('COLOUR');
        if (parts.length > 1) return parts[1].trim();
        
        return value;
      }
      
      return "";
    };

    // Extract body type
    const findBody = () => {
      const value = findValueAfterLabel('BODY');
      if (value) {
        const bodyMatch = value.match(/^([A-Za-z\s]+)/);
        if (bodyMatch) return bodyMatch[1].trim();
        
        const parts = value.split('CNOOFCYL');
        if (parts.length > 0) return parts[0].trim();
        
        return value;
      }
      
      return "";
    };

    // Extract wheel base
    const findWheelBase = () => {
      for (let i = 0; i < lines.length; i++) {
        if (/WHEEL\s*BASE/i.test(lines[i])) {
          const wheelBaseMatch = lines[i].match(/(\d+)\s*UNLADEN\s*WT/i);
          if (wheelBaseMatch) return wheelBaseMatch[1];
          
          const numberMatch = lines[i].match(/(\d+)/);
          if (numberMatch) return numberMatch[1];
        }
      }
      
      const wheelBaseValue = findValueAfterLabel('WHEEL\\s*BASE');
      if (wheelBaseValue) {
        const wheelBaseMatch = wheelBaseValue.match(/(\d+)/);
        if (wheelBaseMatch) return wheelBaseMatch[1];
      }
      
      return "";
    };

    // Extract unladen weight
    const findUnladenWt = () => {
      for (let i = 0; i < lines.length; i++) {
        if (/UNLADEN\s*WT/i.test(lines[i])) {
          const unladenMatch = lines[i].match(/UNLADEN\s*WT\s*(\d+)/i);
          if (unladenMatch) return unladenMatch[1];
          
          const numbers = lines[i].match(/\d+/g);
          if (numbers && numbers.length > 0) {
            return numbers[numbers.length - 1];
          }
        }
      }
      
      const unladenWtValue = findValueAfterLabel('UNLADEN\\s*WT');
      if (unladenWtValue) {
        const unladenWtMatch = unladenWtValue.match(/(\d+)/);
        if (unladenWtMatch) return unladenWtMatch[1];
      }
      
      return "";
    };

    // Extract seating capacity
    const findSeating = () => {
      const value = findValueAfterLabel('SEATING');
      if (value) {
        const seatingMatch = value.match(/(\d+)/);
        if (seatingMatch) return seatingMatch[1];
        
        const parts = value.split(' ');
        if (parts.length > 0 && /^\d+$/.test(parts[0])) {
          return parts[0];
        }
        
        return value;
      }
      
      return "";
    };

    // Extract address
    const findAddress = () => {
      const fieldLabels = [
        'FORM', 'REG', 'CHASSIS', 'ENGINE', 'MFR', 'MODEL', 'CLASS', 
        'COLOUR', 'BODY', 'WHEEL', 'BASE', 'MFG', 'FUEL', 'REGFC', 
        'TAX', 'NOOFCYL', 'UNLADEN', 'SEATING', 'STDG', 'CC', 
        'OWNERNAME', 'SWDOF', 'OWNER', 'S/W/D', 'O.SL.NO', 'REG NO', 
        'REG DATE', 'REGN NO', 'REGN DATE', 'FUEL TYPE', 'BODY TYPE', 
        'WHEEL BASE', 'UNLADEN WT', 'SEATING CAPACITY', 'STDG/SLPR', 
        'TAX VALID UPTO', 'REG/FC VALID UPTO', 'MANUFACTURING DATE', 
        'MFG DATE', 'NUMBER OF CYLINDERS', 'CC (CUBIC CAPACITY)'
      ];

      const addressKeywords = [
        'floor', 'road', 'street', 'village', 'nagar', 'colony', 'apartment', 
        'building', 'tower', 'block', 'sector', 'phase', 'layout', 'area', 
        'district', 'state', 'pin', 'postal', 'near', 'opposite', 'behind',
        'next to', 'beside', 'landmark', 'house', 'h.no', 'hno', 'flat', 'room',
        'plot', 'lane', 'avenue', 'circle', 'society', 'complex', 'nivas', 'sadan',
        'post', 'office', 'po', 'taluk', 'mandal', 'tehsil'
      ];

      const isFieldLabel = (line) => {
        if (fieldLabels.some(label => new RegExp(`^${label}$`, 'i').test(line))) return true;
        if (fieldLabels.some(label => new RegExp(`^${label}\\s*[:\\-]`, 'i').test(line))) return true;
        if (/:/.test(line) && line.length < 50 && /^[A-Z\s\.]+:/.test(line)) return true;
        return false;
      };

      const looksLikeAddress = (line) => {
        if (addressKeywords.some(keyword => line.toLowerCase().includes(keyword))) return true;
        if (/^#\d+/.test(line) || 
            /\d+(st|nd|rd|th)\s+Floor/i.test(line) ||
            /\d+\s*,\s*[A-Z]/i.test(line) ||
            /\d+\s*-\s*[A-Z]/i.test(line)) return true;
        if (/[a-zA-Z]/.test(line) && /\d/.test(line) && line.length > 10) return true;
        return false;
      };

      // Method 1: Look for OWNER NAME
      let ownerNameIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (/OWNER\s*NAME/i.test(lines[i])) {
          ownerNameIndex = i;
          break;
        }
      }

      if (ownerNameIndex !== -1) {
        let addressLines = [];
        for (let i = ownerNameIndex + 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          if (isFieldLabel(line)) break;
          addressLines.push(line);
        }

        if (addressLines.length > 0) return addressLines.join(', ');
      }

      // Method 2: Look for ADDRESS label
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/ADDRESS/i.test(line)) {
          let addressLines = [];
          for (let j = i + 1; j < lines.length; j++) {
            const currentLine = lines[j].trim();
            if (!currentLine) continue;
            if (isFieldLabel(currentLine)) break;
            addressLines.push(currentLine);
          }

          if (addressLines.length > 0) return addressLines.join(', ');
        }
      }

      // Method 3: Look for address-like text
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (isFieldLabel(line)) continue;
        
        if (looksLikeAddress(line)) {
          let addressLines = [line];
          for (let j = i + 1; j < lines.length; j++) {
            const nextLine = lines[j].trim();
            if (!nextLine) continue;
            if (isFieldLabel(nextLine)) break;
            addressLines.push(nextLine);
          }
          
          if (addressLines.length > 0) return addressLines.join(', ');
        }
      }

      // Method 4: Look for sections between field labels
      for (let i = 0; i < lines.length - 2; i++) {
        const currentLine = lines[i];
        const nextLine = lines[i + 1];
        const thirdLine = lines[i + 2];
        
        if (isFieldLabel(currentLine) || isFieldLabel(nextLine) || isFieldLabel(thirdLine)) continue;
        
        if (currentLine && nextLine && thirdLine) {
          const combinedLines = [currentLine, nextLine, thirdLine];
          const hasAddressLine = combinedLines.some(line => looksLikeAddress(line));
          
          if (hasAddressLine) {
            let addressLines = [currentLine, nextLine, thirdLine];
            for (let j = i + 3; j < lines.length; j++) {
              const additionalLine = lines[j].trim();
              if (!additionalLine) continue;
              if (isFieldLabel(additionalLine)) break;
              addressLines.push(additionalLine);
            }
            
            if (addressLines.length > 0) return addressLines.join(', ');
          }
        }
      }

      return "";
    };

    // Extract all fields
    result.regNo = findRegNo();
    result.regDate = findDate('REG\\.?\\s*DATE');
    result.formNumber = findFormNumber();
    result.oSlNo = findOSlNo();
    result.chassisNo = findChassisNumber();
    result.engineNo = findEngineNumber();
    result.mfr = findValueAfterLabel('MFR');
    result.model = findValueAfterLabel('MODEL');
    result.vehicleClass = findValueAfterLabel('CLASS');
    result.colour = findColor();
    result.body = findBody();
    result.wheelBase = findWheelBase();
    result.mfgDate = findDate('MFG\\.?\\s*DATE');
    result.fuel = findValueAfterLabel('FUEL');
    result.regFcUpto = findDate('REG\\/FC\\s*UPTO');
    result.taxUpto = findValueAfterLabel('TAX\\s*UPTO');
    result.noOfCyl = findValueAfterLabel('NO\\.OF\\s*CYL');
    result.unladenWt = findUnladenWt();
    result.seating = findSeating();
    result.stdgSlpr = findValueAfterLabel('STDG\\/SLPR');
    result.cc = findValueAfterLabel('CC');
    result.ownerName = findValueAfterLabel('OWNERNAME');
    result.swdOf = findValueAfterLabel('S\\/W\\/D\\s*OF');
    result.address = findAddress();

    return result;
  } catch (error) {
    return { rawText: text, parseError: error.message, ocrConfidence: confidence };
  }
};

const DetailsPage = () => {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const processingRef = useRef(false);
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("parsed");
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [isSaved, setIsSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterName, setFilterName] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("idle");
  const [rawOcrText, setRawOcrText] = useState("");
  const [showDebug, setShowDebug] = useState(true);
  const [debugInfo, setDebugInfo] = useState({});
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [currentViewItem, setCurrentViewItem] = useState(null);

  useEffect(() => {
    loadHistory();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const loadHistory = () => {
    const saved = localStorage.getItem('rcHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistoryData(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        setHistoryData([]);
      }
    }
  };

  const startCamera = async (mode = facingMode) => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(e => {
          console.error("Video play error:", e);
          videoRef.current.muted = true;
          videoRef.current.play();
        });
      }

      setCameraActive(true);
    } catch (err) {
      console.error("Camera error:", err);
      setError(`Camera error: ${err.message || "Could not start camera"}`);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const captureImage = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelectedImage(imageDataUrl);
      stopCamera();
      handleStartOCR(imageDataUrl);
    } else {
      setError("Camera not ready. Please wait for the camera to initialize.");
    }
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacingMode);
    if (cameraActive) {
      await startCamera(newFacingMode);
    }
  };

  const preprocessImage = (imageDataUrl) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const scale = Math.min(2, Math.max(1, 2000 / img.width));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = data[i + 1] = data[i + 2] = gray;
        }
        
        const contrast = 1.5;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, ((data[i] - 128) * contrast) + 128));
          data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - 128) * contrast) + 128));
          data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - 128) * contrast) + 128));
        }
        
        const threshold = 140;
        for (let i = 0; i < data.length; i += 4) {
          const value = data[i] > threshold ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = value;
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageDataUrl;
    });
  };

  const processImage = async (image) => {
    if (!image || processingRef.current) return { data: null, error: "Processing error" };

    processingRef.current = true;
    setOcrProgress(0);
    setOcrStatus("starting");
    setRawOcrText("");
    setError(null);

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
          tessedit_ocr_engine_mode: 1,
          tessedit_pageseg_mode: 6,
          preserve_interword_spaces: '1',
        }
      );
      
      let text = result.data.text || "";
      text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
      text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      text = text.replace(/[ \t]+/g, ' ');
      text = text.replace(/\n{3,}/g, '\n\n');
      
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      text = lines.join('\n').trim();
      
      if (!text || text.length < 3) {
        throw new Error("OCR failed to extract meaningful text");
      }
      
      setRawOcrText(text);
      
      setOcrStatus("parsing");
      setOcrProgress(95);
      
      const parsedData = parseOCRText(text, result.data.confidence || 0);
      
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
      setError(`OCR failed: ${err.message || "Unknown error"}`);
      setOcrStatus("error");
      return { data: null, error: err.message || "OCR failed" };
    } finally {
      processingRef.current = false;
    }
  };

  const saveData = () => {
    try {
      const dataToSave = {
        ...editedData,
        savedDate: new Date().toISOString(),
        id: Date.now()
      };
      
      const history = [...historyData, dataToSave];
      localStorage.setItem('rcHistory', JSON.stringify(history));
      setHistoryData(history);
      
      setParsedData(dataToSave);
      setIsEditing(false);
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
      alert('Error saving data');
    }
  };

  const loadFromHistory = (item) => {
    setCurrentViewItem(item);
    setViewModalOpen(true);
  };

  const loadForEditing = () => {
    if (currentViewItem) {
      setParsedData(currentViewItem);
      setEditedData(currentViewItem);
      setViewModalOpen(false);
      setShowHistory(false);
      setActiveTab("parsed");
    }
  };

  const deleteHistoryItem = (id) => {
    const updated = historyData.filter(item => item.id !== id);
    localStorage.setItem('rcHistory', JSON.stringify(updated));
    setHistoryData(updated);
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      localStorage.removeItem('rcHistory');
      setHistoryData([]);
    }
  };

  const downloadData = (data, filename) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `rc_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = (data) => {
    const fields = ['regNo', 'regDate', 'ownerName', 'mfr', 'model', 'mfgDate', 'chassisNo', 'engineNo', 'fuel', 'colour', 'seating', 'address'];
    const fieldLabels = {
      regNo: "Registration Number", regDate: "Registration Date", ownerName: "Owner Name",
      mfr: "Manufacturer", model: "Model", mfgDate: "Manufacturing Date",
      chassisNo: "Chassis Number", engineNo: "Engine Number", fuel: "Fuel Type",
      colour: "Colour", seating: "Seating", address: "Address"
    };
    
    const headers = fields.map(f => fieldLabels[f] || f).join(',');
    const values = fields.map(f => `"${String(data[f] || '').replace(/"/g, '""')}"`).join(',');
    
    const csv = `${headers}\n${values}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rc_data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredHistory = historyData.filter(item => {
    const matchesDate = !filterDate || (item.savedDate && item.savedDate.includes(filterDate));
    const matchesName = !filterName || (item.ownerName && item.ownerName.toLowerCase().includes(filterName.toLowerCase()));
    return matchesDate && matchesName;
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setError(null);
    setIsSaved(false);
    
    if (!file.type.match('image.*')) {
      setError("Please select an image file (JPEG, PNG)");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target.result);
      handleStartOCR(event.target.result);
    };
    reader.onerror = () => setError("Error reading file");
    reader.readAsDataURL(file);
  };

  const handleStartOCR = async (imageData = null) => {
    const imageToProcess = imageData || selectedImage;
    
    if (!imageToProcess) {
      setError("Please upload an image first");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setIsSaved(false);
    
    try {
      const result = await processImage(imageToProcess);
      
      if (result.error) {
        setError(result.error);
      } else {
        const data = result.data || {};
        setParsedData(data);
        setEditedData(data);
        
        const hasData = Object.values(data).some(v => v && v !== "");
        
        if (!hasData && result.rawOcrText) {
          setError("OCR completed but couldn't extract structured data. Please use the edit feature.");
          setActiveTab("raw");
        } else if (hasData) {
          setActiveTab("parsed");
        }
      }
    } catch (err) {
      setError(`Processing failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setParsedData(null);
    setEditedData({});
    setError(null);
    setIsSaved(false);
    setIsEditing(false);
    setOcrProgress(0);
    setOcrStatus("idle");
    setRawOcrText("");
    setDebugInfo({});
    stopCamera();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData(parsedData ? { ...parsedData } : {
      regNo: "", regDate: "", formNumber: "", oSlNo: "",
      chassisNo: "", engineNo: "", mfr: "", model: "",
      vehicleClass: "", colour: "", body: "", wheelBase: "",
      mfgDate: "", fuel: "", regFcUpto: "", taxUpto: "",
      noOfCyl: "", unladenWt: "", seating: "", stdgSlpr: "",
      cc: "", ownerName: "", swdOf: "", address: ""
    });
  };

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const showResults = parsedData !== null || rawOcrText;
  const displayData = isEditing ? editedData : parsedData;

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    if (confidence >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const fieldLabels = {
    regNo: "Registration Number", regDate: "Registration Date", formNumber: "Form Number",
    oSlNo: "O.SL.NO", chassisNo: "Chassis Number", engineNo: "Engine Number",
    mfr: "Manufacturer (MFR)", model: "Model", vehicleClass: "Class",
    colour: "Colour", body: "Body Type", wheelBase: "Wheel Base",
    mfgDate: "Manufacturing Date", fuel: "Fuel Type", regFcUpto: "REG/FC Valid Upto",
    taxUpto: "Tax Valid Upto", noOfCyl: "Number of Cylinders", unladenWt: "Unladen Weight",
    seating: "Seating Capacity", stdgSlpr: "STDG/SLPR", cc: "CC (Cubic Capacity)",
    ownerName: "Owner Name", swdOf: "S/W/D OF", address: "Address"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6 md:mb-10">
          <h1 className="text-2xl md:text-4xl font-bold text-indigo-800 mb-2">RC Scanner Pro</h1>
          <p className="text-gray-600 text-sm md:text-base">Extract complete RC data with history tracking</p>
          {isSaved && (
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Saved Successfully
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">How to Get Best Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start mb-2">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-medium text-blue-800">Good Lighting</h3>
              </div>
              <p className="text-sm text-blue-700">Ensure the document is well-lit with no shadows or glare. Natural light works best.</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-start mb-2">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" />
                  </svg>
                </div>
                <h3 className="font-medium text-green-800">Flat Surface</h3>
              </div>
              <p className="text-sm text-green-700">Place the RC document on a flat surface to avoid distortions and blurriness.</p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-start mb-2">
                <div className="bg-yellow-100 p-2 rounded-full mr-3">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-medium text-yellow-800">Top-Down Angle</h3>
              </div>
              <p className="text-sm text-yellow-700">Take the photo from directly above the document to minimize perspective distortion.</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-start mb-2">
                <div className="bg-purple-100 p-2 rounded-full mr-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="font-medium text-purple-800">High Resolution</h3>
              </div>
              <p className="text-sm text-purple-700">Use the highest resolution possible. Ensure text is clear and readable before capturing.</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
            <h3 className="font-medium text-indigo-800 mb-2">Important Tips:</h3>
            <ul className="text-sm text-indigo-700 space-y-1">
              <li>• Hold your camera steady to avoid blurry images</li>
              <li>• Make sure all text is clearly visible and in focus</li>
              <li>• Avoid reflections or glare on laminated documents</li>
              <li>• Ensure the entire document is visible in the frame</li>
              <li>• For best results, use the rear camera of your device</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <div className="flex-1"></div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto"
          >
            {showHistory ? 'Hide' : 'Show'} History ({historyData.length})
          </button>
        </div>

        {showHistory && (
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <h2 className="text-lg md:text-xl font-bold text-gray-800">Saved RC Records</h2>
              <button
                onClick={clearHistory}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Filter by date"
              />
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Filter by owner name"
              />
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3">
              {filteredHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No records found</p>
              ) : (
                filteredHistory.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{item.ownerName || 'No Name'}</p>
                        <p className="text-sm text-gray-600">RC: {item.regNo || 'N/A'}</p>
                        <p className="text-sm text-gray-600">Vehicle: {item.mfr} {item.model}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Saved: {new Date(item.savedDate).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => loadFromHistory(item)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                        >
                          View
                        </button>
                        <button
                          onClick={() => downloadData(item, `rc_${item.regNo}.json`)}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                        >
                          JSON
                        </button>
                        <button
                          onClick={() => downloadCSV(item)}
                          className="px-3 py-1 bg-teal-500 text-white text-sm rounded hover:bg-teal-600"
                        >
                          CSV
                        </button>
                        <button
                          onClick={() => deleteHistoryItem(item.id)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                        >
                          Del
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                {cameraActive ? (
                  <div className="relative">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted
                      className="w-full h-64 md:h-80 object-cover rounded-lg bg-black"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="border-2 border-white border-dashed rounded-lg w-5/6 h-5/6 flex items-center justify-center">
                        <span className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                          Position RC document within frame
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-center gap-3 mt-4">
                      <button
                        onClick={captureImage}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Capture
                      </button>
                      <button
                        onClick={switchCamera}
                        className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={stopCamera}
                        className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-8 text-center cursor-pointer bg-gray-50 hover:bg-blue-50 transition-colors duration-300"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-600 mb-2 font-medium">Click to upload RC image</p>
                        <p className="text-sm text-gray-500">JPG, PNG (max 10MB)</p>
                        <p className="text-sm text-indigo-600 mt-2 font-medium">OCR starts automatically</p>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    
                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => startCamera()}
                        className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Use Camera
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="flex-1">
                {selectedImage ? (
                  <div className="flex flex-col items-center">
                    <div className="relative mb-4 w-full flex justify-center">
                      <img
                        src={selectedImage}
                        alt="RC Preview"
                        className="max-h-48 md:max-h-64 rounded-lg shadow-md object-contain"
                      />
                      <button 
                        onClick={handleReset}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        aria-label="Remove image"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={() => handleStartOCR()}
                      disabled={isProcessing}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors w-full ${isProcessing ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
                    >
                      {isProcessing ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : "Re-process Image"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 border-2 border-gray-200 rounded-lg bg-gray-50">
                    <p className="text-gray-500">No image selected</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="px-4 md:px-6 py-4 bg-red-50 border-b border-red-200">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                </svg>
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {ocrStatus && ocrStatus !== "idle" && ocrStatus !== "done" && ocrStatus !== "error" && (
            <div className="px-4 md:px-6 py-4 bg-blue-50 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                <span className="text-sm font-medium text-blue-700">{ocrStatus}</span>
                <span className="text-sm font-medium text-blue-700">{ocrProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${ocrProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {showDebug && debugInfo && Object.keys(debugInfo).length > 0 && (
            <div className="px-4 md:px-6 py-4 bg-yellow-50 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                <h3 className="font-medium text-yellow-800">OCR Quality Report</h3>
                <button 
                  onClick={() => setShowDebug(false)}
                  className="text-yellow-600 hover:text-yellow-800 text-sm"
                >
                  Hide
                </button>
              </div>
              <div className="text-sm text-yellow-700 space-y-1">
                {debugInfo.confidence !== undefined && (
                  <p>
                    <strong>Confidence:</strong> 
                    <span className={`ml-2 font-semibold ${getConfidenceColor(debugInfo.confidence)}`}>
                      {debugInfo.confidence}% ({debugInfo.quality})
                    </span>
                  </p>
                )}
                {debugInfo.extractedFields !== undefined && (
                  <p><strong>Fields Extracted:</strong> {debugInfo.extractedFields}</p>
                )}
                {debugInfo.textLength && (
                  <p><strong>Text Length:</strong> {debugInfo.textLength} characters</p>
                )}
                {debugInfo.parseSuccess && (
                  <p className="text-green-700 font-medium">{debugInfo.parseSuccess}</p>
                )}
                {debugInfo.suggestions && debugInfo.suggestions.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium">Improvement Suggestions</summary>
                    <ul className="mt-1 ml-4 space-y-0.5">
                      {debugInfo.suggestions.map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          )}

          {!showDebug && debugInfo && Object.keys(debugInfo).length > 0 && (
            <div className="px-4 md:px-6 py-2 bg-gray-50 border-b border-gray-200">
              <button 
                onClick={() => setShowDebug(true)}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Show Quality Report
              </button>
            </div>
          )}

          {showResults && (
            <div className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-800">Extracted Information</h2>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={handleEdit}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex-1 sm:flex-none"
                      >
                        Edit
                      </button>
                      <button
                        onClick={saveData}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex-1 sm:flex-none"
                      >
                        Save to History
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex-1 sm:flex-none"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveData}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex-1 sm:flex-none"
                      >
                        Save
                      </button>
                    </>
                  )}
                  <button 
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex-1 sm:flex-none"
                  >
                    New Scan
                  </button>
                </div>
              </div>

              <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                <button
                  className={`py-2 px-4 font-medium whitespace-nowrap ${activeTab === "parsed" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
                  onClick={() => setActiveTab("parsed")}
                >
                  Structured Data
                </button>
                <button
                  className={`py-2 px-4 font-medium whitespace-nowrap ${activeTab === "raw" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
                  onClick={() => setActiveTab("raw")}
                >
                  Raw Text
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                {activeTab === "parsed" ? (
                  <>
                    {displayData && Object.keys(displayData).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(fieldLabels).map(([key, label]) => (
                          <div key={key} className="bg-white p-4 rounded-lg shadow-sm">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</h3>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editedData[key] || ""}
                                onChange={(e) => handleInputChange(key, e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter value"
                              />
                            ) : (
                              <p className="text-gray-800 break-words">{displayData[key] || "Not found"}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No structured data found</h3>
                        <p className="mt-1 text-sm text-gray-500">Check the raw text tab or click Edit to enter manually.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="relative">
                    {rawOcrText ? (
                      <pre className="whitespace-pre-wrap text-gray-700 bg-white p-4 rounded-lg font-mono text-sm overflow-x-auto">
                        {rawOcrText}
                      </pre>
                    ) : (
                      <div className="text-center py-8">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No text extracted</h3>
                        <p className="mt-1 text-sm text-gray-500">OCR didn't extract any text from the image.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 md:mt-8 text-center text-gray-500 text-sm">
          <p>Powered by Tesseract OCR with image preprocessing. All processing happens in your browser.</p>
        </div>
      </div>

      {viewModalOpen && currentViewItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">RC Details</h2>
                <button 
                  onClick={() => setViewModalOpen(false)} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {Object.entries(fieldLabels).map(([key, label]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</h3>
                    <p className="text-gray-800 break-words">{currentViewItem[key] || "Not found"}</p>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Saved: {new Date(currentViewItem.savedDate).toLocaleString()}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setViewModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={loadForEditing}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Load for Editing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailsPage;