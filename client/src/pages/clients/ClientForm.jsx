import React, { useEffect, useState, useRef } from 'react'
import { getClient, upsertClient } from '../../lib/storage.js'
import { useNavigate, useParams } from 'react-router-dom'

const empty = {
  fullName: '',
  phone: '',
  email: '',
  address: '',
  vehicleMake: '',
  vehicleModel: '',
  vehicleYear: '',
  regNumber: '',
  vin: '',
  carImage: '',
  adImage: '',
  staffPerson: '', // New field added
}

export default function ClientForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [isLoadingAdImage, setIsLoadingAdImage] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [adImageError, setAdImageError] = useState(false)
  
  // New state for manual image uploads
  const [isImageUploaded, setIsImageUploaded] = useState(false)
  const [showCameraOptions, setShowCameraOptions] = useState(false)
  
  // 3D viewer state remains unchanged...
  const [rotation, setRotation] = useState({ x: -20, y: 0 })
  const [scale, setScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 })
  const [startRotation, setStartRotation] = useState({ x: 0, y: 0 })
  const [currentView, setCurrentView] = useState('Front')
  const [isZooming, setIsZooming] = useState(false)
  
  const containerRef = useRef(null)
  const modelRef = useRef(null)
  const isDraggingRef = useRef(false)
  const startPositionRef = useRef({ x: 0, y: 0 })
  const startRotationRef = useRef({ x: 0, y: 0 })
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (id) {
      const existing = getClient(id)
      if (existing) {
        setForm(existing)
        // Check if images are uploaded (data URLs)
        setIsImageUploaded(existing.carImage && existing.carImage.startsWith('data:'))
      }
    }
  }, [id])

  useEffect(() => {
    if (form.vehicleMake && form.vehicleModel && !isImageUploaded) {
      fetchCarImage(form.vehicleMake, form.vehicleModel)
      fetchAdvertisementImage(form.vehicleMake, form.vehicleModel)
    } else if (!form.vehicleMake || !form.vehicleModel) {
      setForm(prev => ({ ...prev, carImage: '', adImage: '' }))
      setImageError(false)
      setAdImageError(false)
    }
  }, [form.vehicleMake, form.vehicleModel, isImageUploaded])

  // Image fetching functions remain unchanged...
  const fetchCarImage = async (make, model) => {
    setIsLoadingImage(true)
    setImageError(false)
    
    try {
      const response = await fetch(
        `https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=${encodeURIComponent(make)}&modelFamily=${encodeURIComponent(model)}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch car image')
      }
      
      const imageUrl = response.url
      setForm(prev => ({ ...prev, carImage: imageUrl }))
    } catch (error) {
      console.error('Error fetching car image:', error)
      setImageError(true)
      
      const makeEncoded = encodeURIComponent(make.trim());
      const modelEncoded = encodeURIComponent(model.trim());
      const fallbackUrl = `https://via.placeholder.com/800x400.png?text=${makeEncoded}+${modelEncoded}&bg=4f46e5&fc=ffffff`
      setForm(prev => ({ ...prev, carImage: fallbackUrl }))
    } finally {
      setIsLoadingImage(false)
    }
  }

  const fetchAdvertisementImage = async (make, model) => {
    setIsLoadingAdImage(true)
    setAdImageError(false)
    
    try {
      const response = await fetch(
        `https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=${encodeURIComponent(make)}&modelFamily=${encodeURIComponent(model)}&angle=27&transparentBackground=true`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch advertisement image')
      }
      
      const imageUrl = response.url
      setForm(prev => ({ ...prev, adImage: imageUrl }))
    } catch (error) {
      console.error('Error fetching advertisement image:', error)
      setAdImageError(true)
      
      const makeEncoded = encodeURIComponent(make.trim());
      const modelEncoded = encodeURIComponent(model.trim());
      const fallbackUrl = `https://via.placeholder.com/800x400.png?text=${makeEncoded}+${modelEncoded}&bg=transparent&fc=4f46e5&border=4f46e5`
      setForm(prev => ({ ...prev, adImage: fallbackUrl }))
    } finally {
      setIsLoadingAdImage(false)
    }
  }

  // New functions for handling image uploads
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target.result
        // Set both carImage and adImage to the uploaded image
        setForm(prev => ({ 
          ...prev, 
          carImage: dataUrl,
          adImage: dataUrl
        }))
        setIsImageUploaded(true)
        setImageError(false)
        setAdImageError(false)
        setShowCameraOptions(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setIsImageUploaded(false)
    if (form.vehicleMake && form.vehicleModel) {
      fetchCarImage(form.vehicleMake, form.vehicleModel)
      fetchAdvertisementImage(form.vehicleMake, form.vehicleModel)
    } else {
      setForm(prev => ({ ...prev, carImage: '', adImage: '' }))
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      // In a real app, you would capture the image from the stream here
      // For this example, we'll just trigger the file input
      triggerFileInput()
      // Close the stream
      stream.getTracks().forEach(track => track.stop())
    } catch (err) {
      console.error("Error accessing camera:", err)
      alert("Could not access the camera. Please check permissions.")
    }
  }

  const submit = (e) => {
    e.preventDefault()
    const saved = upsertClient({
      ...form,
      vehicleYear: Number(form.vehicleYear || 0),
      id: form.id,
    })
    navigate(`/clients/${saved.id || form.id}`)
  }

  // 3D viewer functions remain unchanged...
  // Update current view based on rotation
  useEffect(() => {
    // Check if we're in top view (x rotation is -90)
    if (rotation.x <= -85) {
      setCurrentView('Top')
      return
    }
    
    // Otherwise, determine side view based on y rotation
    const y = ((rotation.y % 360) + 360) % 360; // Normalize to 0-360
    
    if (y >= 315 || y < 45) {
      setCurrentView('Front');
    } else if (y >= 45 && y < 135) {
      setCurrentView('Right Side');
    } else if (y >= 135 && y < 225) {
      setCurrentView('Rear');
    } else {
      setCurrentView('Left Side');
    }
  }, [rotation]);

  // 3D viewer handlers
  const handleDragStart = (clientX, clientY) => {
    isDraggingRef.current = true
    setIsDragging(true)
    startPositionRef.current = { x: clientX, y: clientY }
    startRotationRef.current = { ...rotation }
    
    // Change cursor style
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing'
    }
  }

  const handleDragMove = (clientX, clientY) => {
    if (!isDraggingRef.current) return
    
    const deltaX = clientX - startPositionRef.current.x
    const deltaY = clientY - startPositionRef.current.y
    
    // Calculate rotation with improved sensitivity
    const sensitivity = 0.5
    const newRotation = {
      x: Math.max(-90, Math.min(90, startRotationRef.current.x - deltaY * sensitivity)),
      y: startRotationRef.current.y + deltaX * sensitivity
    }
    
    setRotation(newRotation)
  }

  const handleDragEnd = () => {
    isDraggingRef.current = false
    setIsDragging(false)
    
    // Reset cursor style
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab'
    }
  }

  // Mouse event handlers
  const handleMouseDown = (e) => {
    e.preventDefault()
    handleDragStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e) => {
    handleDragMove(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    handleDragEnd()
  }

  // Touch event handlers
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      handleDragStart(touch.clientX, touch.clientY)
    }
  }

  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      e.preventDefault()
      const touch = e.touches[0]
      handleDragMove(touch.clientX, touch.clientY)
    }
  }

  const handleTouchEnd = () => {
    handleDragEnd()
  }

  // Zoom with mouse wheel
  const handleWheel = (e) => {
    e.preventDefault();
    
    setIsZooming(true);
    
    // Get the wheel direction
    const delta = e.deltaY;
    
    // Adjust sensitivity for better control
    const sensitivity = 0.01;
    
    // Calculate zoom change - invert delta for natural zoom direction
    const zoomChange = -delta * sensitivity;
    
    setScale(prev => {
      // Calculate new scale with bounds
      const newScale = prev + zoomChange;
      
      // Clamp between 0.5 and 3
      return Math.max(0.5, Math.min(3, newScale));
    });
    
    // Reset zooming state after a short delay
    setTimeout(() => setIsZooming(false), 100);
  }

  // Reset view
  const resetView = () => {
    setRotation({ x: -20, y: 0 })
    setScale(1)
    setCurrentView('Front')
  }

  // Set specific view
  const setView = (view) => {
    switch(view) {
      case 'Front':
        setRotation({ x: -20, y: 0 })
        setCurrentView('Front')
        break
      case 'Right':
        setRotation({ x: -20, y: 50 })
        setCurrentView('Right Side')
        break
      case 'Rear':
        setRotation({ x: -20, y: 180 })
        setCurrentView('Rear')
        break
      case 'Left':
        setRotation({ x: -20, y: -60 })
        setCurrentView('Left Side')
        break
      case 'Top':
        setRotation({ x: 0, y: 180 })
        setCurrentView('Top')
        break
      default:
        break
    }
  }

  // Zoom in/out functions
  const zoomIn = () => {
    setScale(prev => Math.min(3, prev + 0.2))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.2))
  }

  // Set up event listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDraggingRef.current) {
        handleMouseMove(e);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        handleMouseUp();
      }
    };

    const handleGlobalTouchMove = (e) => {
      if (isDraggingRef.current) {
        handleTouchMove(e);
      }
    };

    const handleGlobalTouchEnd = () => {
      if (isDraggingRef.current) {
        handleTouchEnd();
      }
    };

    // Add global event listeners
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd);

    // Clean up event listeners
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, []);

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl shadow-soft p-6 space-y-6 max-w-5xl lg:ml-64 mx-auto">
      <h1 className="text-2xl font-semibold">{id ? 'Edit Client' : 'Add Client'}</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form fields remain the same */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
          <input
            type="text"
            className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.fullName}
            onChange={e => setForm({ ...form, fullName: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
          <input
            type="text"
            className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
          <input
            type="email"
            className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
          <input
            type="text"
            className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Vehicle Make</label>
          <input
            type="text"
            className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.vehicleMake}
            onChange={e => setForm({ ...form, vehicleMake: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Vehicle Model</label>
          <input
            type="text"
            className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.vehicleModel}
            onChange={e => setForm({ ...form, vehicleModel: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Vehicle Year</label>
          <input
            type="number"
            min="1900"
            max={new Date().getFullYear()}
            className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.vehicleYear}
            onChange={e => setForm({ ...form, vehicleYear: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Registration Number</label>
          <input
            type="text"
            className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.regNumber}
            onChange={e => setForm({ ...form, regNumber: e.target.value })}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">VIN / Chassis No.</label>
          <input
            type="text"
            className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.vin}
            onChange={e => setForm({ ...form, vin: e.target.value })}
          />
        </div>

        {/* New field: Staff Person Handling the Car */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">Staff Person Handling the Car</label>
          <input
            type="text"
            className="w-full border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={form.staffPerson}
            onChange={e => setForm({ ...form, staffPerson: e.target.value })}
            placeholder="Enter name of staff member responsible"
          />
        </div>

        {/* New image upload options - Single upload for both images */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">Vehicle Images</label>
          <div className="mb-2 text-sm text-gray-500">
            Upload an image that will be used for both the vehicle preview and the 3D model viewer
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setShowCameraOptions(!showCameraOptions)}
              className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              {isImageUploaded ? 'Change Images' : 'Upload Images'}
            </button>
            
            {isImageUploaded && (
              <button
                type="button"
                onClick={removeImage}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Remove Images
              </button>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          
          {showCameraOptions && (
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={triggerFileInput}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Choose from Gallery
              </button>
              
              <button
                type="button"
                onClick={openCamera}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                </svg>
                Take Photo
              </button>
            </div>
          )}
        </div>

        {/* Rest of the form remains unchanged */}
        {(form.vehicleMake && form.vehicleModel) && (
          <div className="md:col-span-2 flex flex-col items-center mt-6">
            <p className="text-lg font-semibold text-gray-700 mb-4">Vehicle Preview</p>
            
            <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl">
              {/* Left side - Main car image */}
              <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 shadow-inner">
                <h3 className="text-center font-medium text-gray-700 mb-3">Vehicle Image</h3>
                {isLoadingImage ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
                  </div>
                ) : (
                  <div className="relative">
                    <img 
                      src={form.carImage} 
                      alt={`${form.vehicleMake} ${form.vehicleModel}`}
                      className="rounded-xl shadow-lg max-w-full h-auto mx-auto"
                      style={{ maxHeight: '400px' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        const make = encodeURIComponent(form.vehicleMake.trim());
                        const model = encodeURIComponent(form.vehicleModel.trim());
                        e.target.src = `https://via.placeholder.com/800x400.png?text=${make}+${model}&bg=4f46e5&fc=ffffff`;
                      }}
                    />
                    {isImageUploaded && (
                      <div className="absolute top-2 right-2 bg-indigo-500 text-white text-xs px-2 py-1 rounded-full">
                        Uploaded Image
                      </div>
                    )}
                  </div>
                )}
                
                {imageError && (
                  <p className="text-sm text-red-500 mt-3 text-center">
                    Couldn't load vehicle image. Showing placeholder instead.
                  </p>
                )}
              </div>

              {/* Right side - 3D Model Viewer with Enhanced Design */}
              <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gradient-to-br from-blue-50/30 to-purple-50/30 backdrop-blur-sm shadow-inner relative overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-center font-medium text-gray-700">3D Model Viewer</h3>
                  <div className="flex gap-2">
                    <span className={`text-sm px-3 py-1 rounded-lg transition-all duration-300 ${
                      isZooming ? 'bg-yellow-500 text-white animate-pulse' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {currentView} • {Math.round(scale * 100)}%
                    </span>
                    <button 
                      type="button"
                      onClick={resetView}
                      className="text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded-lg transition"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                
                {isLoadingAdImage ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
                  </div>
                ) : (
                  <>
                    {/* View buttons with enhanced design */}
                    <div className="flex justify-center gap-2 mb-3">
                      {['Front', 'Right', 'Rear', 'Left', 'Top'].map(view => (
                        <button
                          key={view}
                          type="button"
                          onClick={() => setView(view)}
                          className={`text-xs px-3 py-1.5 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                            (currentView === view) || 
                            (view === 'Right' && currentView === 'Right Side') ||
                            (view === 'Left' && currentView === 'Left Side')
                              ? 'bg-indigo-500 text-white shadow-md' 
                              : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          {view}
                        </button>
                      ))}
                    </div>
                    
                    {/* Enhanced zoom controls */}
                    <div className="flex justify-center items-center gap-3 mb-4">
                      <button 
                        type="button"
                        onClick={zoomOut}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition-all duration-300 hover:scale-110 active:scale-95"
                        aria-label="Zoom out"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${((scale - 0.5) / 2.5) * 100}%` }}
                        ></div>
                      </div>
                      
                      <span className="text-xs font-medium text-gray-600 w-10 text-center">
                        {Math.round(scale * 100)}%
                      </span>
                      
                      <button 
                        type="button"
                        onClick={zoomIn}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition-all duration-300 hover:scale-110 active:scale-95"
                        aria-label="Zoom in"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* 3D Model Container with Enhanced Design */}
                    <div 
                      ref={containerRef}
                      className="relative h-80 flex items-center justify-center overflow-hidden cursor-grab rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 shadow-inner"
                      onMouseDown={handleMouseDown}
                      onTouchStart={handleTouchStart}
                      onWheel={handleWheel}
                    >
                      {/* Enhanced background effects */}
                      <div className="absolute inset-0 overflow-hidden">
                        {[...Array(20)].map((_, i) => (
                          <div 
                            key={i}
                            className="absolute rounded-full bg-white/30"
                            style={{
                              width: `${Math.random() * 15 + 5}px`,
                              height: `${Math.random() * 15 + 5}px`,
                              top: `${Math.random() * 100}%`,
                              left: `${Math.random() * 100}%`,
                              animation: `float-up ${Math.random() * 15 + 10}s linear infinite`,
                              animationDelay: `${Math.random() * 5}s`,
                            }}
                          />
                        ))}
                        
                        {/* Grid pattern for depth perception */}
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute inset-0 bg-grid bg-repeat" style={{ 
                            backgroundImage: `linear-gradient(to right, #9ca3af 1px, transparent 1px), linear-gradient(to bottom, #9ca3af 1px, transparent 1px)`,
                            backgroundSize: '20px 20px'
                          }}></div>
                        </div>
                      </div>
                      
                      {/* 3D Car Model with Enhanced Styling */}
                      <div 
                        ref={modelRef}
                        className="relative z-10 transition-all duration-300"
                        style={{ 
                          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${scale})`,
                          transition: isDragging ? 'none' : 'transform 0.5s ease',
                          filter: isZooming ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.6))' : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
                        }}
                      >
                        <img 
                          src={form.adImage} 
                          alt={`3D ${form.vehicleMake} ${form.vehicleModel}`}
                          className="max-w-full h-auto mx-auto"
                          style={{ maxHeight: '250px' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            const make = encodeURIComponent(form.vehicleMake.trim());
                            const model = encodeURIComponent(form.vehicleModel.trim());
                            e.target.src = `https://via.placeholder.com/800x400.png?text=${make}+${model}&bg=transparent&fc=4f46e5&border=4f46e5`;
                          }}
                        />
                        {isImageUploaded && (
                          <div className="absolute top-2 right-2 bg-indigo-500 text-white text-xs px-2 py-1 rounded-full">
                            Uploaded Image
                          </div>
                        )}
                      </div>
                      
                      {/* Enhanced controls hint */}
                      {!isDragging && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                          <div className="bg-black/30 backdrop-blur-sm text-white text-xs py-1.5 px-4 rounded-full flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                            </svg>
                            <span>Scroll to zoom</span>
                            <span className="mx-1">•</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            <span>Drag to rotate</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Zoom indicator */}
                      {isZooming && (
                        <div className="absolute top-4 right-4 bg-indigo-500 text-white text-xs py-1 px-2 rounded-full animate-pulse">
                          Zooming...
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                {adImageError && (
                  <p className="text-sm text-red-500 mt-3 text-center">
                    Couldn't load 3D model. Showing placeholder instead.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2 font-semibold transition"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="bg-gray-200 hover:bg-gray-300 rounded-xl px-6 py-2 font-semibold transition"
        >
          Cancel
        </button>
      </div>
      
      {/* Add custom animations to the document head */}
      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          10% {
            opacity: 0.4;
          }
          90% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
        
        .bg-grid {
          background-size: 20px 20px;
        }
      `}</style>
    </form>
  )
}