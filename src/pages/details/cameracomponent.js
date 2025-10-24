import React from 'react';
import { useCamera } from '../hooks/useCamera';

const CameraComponent = ({ onCapture, onStop }) => {
  const {
    videoRef,
    cameraActive,
    startCamera,
    stopCamera,
    captureImage,
    switchCamera
  } = useCamera();

  const handleCapture = () => {
    const imageData = captureImage();
    if (imageData) {
      stopCamera();
      onCapture(imageData);
    }
  };

  return (
    <div className="relative">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
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
          onClick={handleCapture}
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
          onClick={() => {
            stopCamera();
            onStop();
          }}
          className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CameraComponent;