// src/hooks/useImageCapture.js
import { useState, useRef } from "react";

export const useImageCapture = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const openCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match("image.*")) {
      setError("Please select an image file");
      setCapturedImage(null);
      return;
    }

    // Validate file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size is too large. Please select an image under 5MB.");
      setCapturedImage(null);
      return;
    }

    setError(null);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        setCapturedImage(event.target.result);
        console.log("Image captured successfully", { 
          size: file.size, 
          type: file.type,
          dimensions: getImageDimensions(event.target.result)
        });
      } else {
        setError("Failed to read image file");
        setCapturedImage(null);
      }
    };
    
    reader.onerror = () => {
      setError("Error reading file");
      setCapturedImage(null);
    };
    
    reader.readAsDataURL(file);
  };

  // Helper to get image dimensions
  const getImageDimensions = (src) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = src;
    });
  };

  const resetImage = () => {
    setCapturedImage(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return { capturedImage, error, fileInputRef, openCamera, handleImageCapture, resetImage };
};