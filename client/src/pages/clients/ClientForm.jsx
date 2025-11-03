//client/src/pages/clients/ClientForm.jsx
import React, { useEffect, useState, useRef } from 'react'
import { getClient, upsertClient } from '../../lib/storage.js'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCalendar,
  FiHash,
  FiSave,
  FiX,
  FiCamera,
  FiImage,
  FiTrash2,
  FiRotateCw,
  FiZoomIn,
  FiZoomOut,
  FiArrowLeft,
  FiUpload,
  FiEye,
  FiMove,
  FiUsers
} from 'react-icons/fi'
import { FaCar } from "react-icons/fa";
import { useTheme } from '../../contexts/ThemeContext'

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
  staffPerson: '',
}

export default function ClientForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [form, setForm] = useState(empty)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [isLoadingAdImage, setIsLoadingAdImage] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [adImageError, setAdImageError] = useState(false)

  const [isImageUploaded, setIsImageUploaded] = useState(false)
  const [showCameraOptions, setShowCameraOptions] = useState(false)

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

  const fetchCarImage = async (make, model) => {
    setIsLoadingImage(true)
    setImageError(false)

    try {
      const response = await fetch(
        `https://cdn.imagin.studio/getImage?customer=hrjavascript-mastery&make=${encodeURIComponent(make)}&modelFamily=${encodeURIComponent(model)}`
      )

      if (!response.ok) throw new Error('Failed to fetch car image')

      setForm(prev => ({ ...prev, carImage: response.url }))
    } catch (error) {
      console.error('Error fetching car image:', error)
      setImageError(true)
      const fallbackUrl = `https://via.placeholder.com/800x400.png?text=${encodeURIComponent(make)}+${encodeURIComponent(model)}&bg=4f46e5&fc=ffffff`
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

      if (!response.ok) throw new Error('Failed to fetch advertisement image')

      setForm(prev => ({ ...prev, adImage: response.url }))
    } catch (error) {
      console.error('Error fetching advertisement image:', error)
      setAdImageError(true)
      const fallbackUrl = `https://via.placeholder.com/800x400.png?text=${encodeURIComponent(make)}+${encodeURIComponent(model)}&bg=transparent&fc=4f46e5`
      setForm(prev => ({ ...prev, adImage: fallbackUrl }))
    } finally {
      setIsLoadingAdImage(false)
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target.result
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
      triggerFileInput()
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

  // 3D viewer functions
  useEffect(() => {
    if (rotation.x <= -85) {
      setCurrentView('Top')
      return
    }

    const y = ((rotation.y % 360) + 360) % 360;

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

  const handleDragStart = (clientX, clientY) => {
    isDraggingRef.current = true
    setIsDragging(true)
    startPositionRef.current = { x: clientX, y: clientY }
    startRotationRef.current = { ...rotation }
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing'
  }

  const handleDragMove = (clientX, clientY) => {
    if (!isDraggingRef.current) return

    const deltaX = clientX - startPositionRef.current.x
    const deltaY = clientY - startPositionRef.current.y
    const sensitivity = 0.5

    setRotation({
      x: Math.max(-90, Math.min(90, startRotationRef.current.x - deltaY * sensitivity)),
      y: startRotationRef.current.y + deltaX * sensitivity
    })
  }

  const handleDragEnd = () => {
    isDraggingRef.current = false
    setIsDragging(false)
    if (containerRef.current) containerRef.current.style.cursor = 'grab'
  }

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

  const handleWheel = (e) => {
    e.preventDefault();
    setIsZooming(true);
    const delta = e.deltaY;
    const sensitivity = 0.01;
    const zoomChange = -delta * sensitivity;

    setScale(prev => Math.max(0.5, Math.min(3, prev + zoomChange)));
    setTimeout(() => setIsZooming(false), 100);
  }

  const resetView = () => {
    setRotation({ x: -20, y: 0 })
    setScale(1)
    setCurrentView('Front')
  }

  const setView = (view) => {
    const views = {
      'Front': { x: -20, y: 0, name: 'Front' },
      'Right': { x: -20, y: 50, name: 'Right Side' },
      'Rear': { x: -20, y: 180, name: 'Rear' },
      'Left': { x: -20, y: -60, name: 'Left Side' },
      'Top': { x: 0, y: 180, name: 'Top' }
    }
    if (views[view]) {
      setRotation({ x: views[view].x, y: views[view].y })
      setCurrentView(views[view].name)
    }
  }

  const zoomIn = () => setScale(prev => Math.min(3, prev + 0.2))
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2))

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDraggingRef.current) handleMouseMove(e);
    };

    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) handleMouseUp();
    };

    const handleGlobalTouchMove = (e) => {
      if (isDraggingRef.current) handleTouchMove(e);
    };

    const handleGlobalTouchEnd = () => {
      if (isDraggingRef.current) handleTouchEnd();
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, []);

  return (
    <div className="lg:ml-16 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/clients"
            className={`inline-flex items-center gap-2 ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors duration-200 mb-3`}
          >
            <FiArrowLeft />
            <span className="font-medium">Back to Clients</span>
          </Link>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {id ? 'Edit Client' : 'Add New Client'}
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            {id ? 'Update client and vehicle information' : 'Register a new client and their vehicle'}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Personal Information */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-xl border overflow-hidden`}>
          <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' : 'border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600'}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FiUser className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Personal Information</h2>
                <p className="text-sm text-white/80">Client contact details</p>
              </div>
            </div>
          </div>

          <div className="p-6 grid md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                <FiUser size={16} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:border-blue-500'
                  } border-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                <FiPhone size={16} className={isDark ? 'text-green-400' : 'text-green-600'} />
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600 focus:border-green-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:border-green-500'
                  } border-2 focus:outline-none focus:ring-2 focus:ring-green-500/20`}
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="Enter phone number"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                <FiMail size={16} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                Email Address
              </label>
              <input
                type="email"
                className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600 focus:border-purple-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:border-purple-500'
                  } border-2 focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>

            {/* Address */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                <FiMapPin size={16} className={isDark ? 'text-orange-400' : 'text-orange-600'} />
                Address
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600 focus:border-orange-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:border-orange-500'
                  } border-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="Enter full address"
              />
            </div>

            {/* Staff Person */}
            <div className="md:col-span-2">
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                <FiUsers size={16} className={isDark ? 'text-pink-400' : 'text-pink-600'} />
                Staff Person Handling
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600 focus:border-pink-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:border-pink-500'
                  } border-2 focus:outline-none focus:ring-2 focus:ring-pink-500/20`}
                value={form.staffPerson}
                onChange={e => setForm({ ...form, staffPerson: e.target.value })}
                placeholder="Enter staff member name"
              />
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-xl border overflow-hidden`}>
          <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' : 'border-gray-200 bg-gradient-to-r from-green-600 to-teal-600'}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FaCar className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Vehicle Information</h2>
                <p className="text-sm text-white/80">Complete vehicle details and registration</p>
              </div>
            </div>
          </div>

          <div className="p-6 grid md:grid-cols-2 gap-6">
            {/* Vehicle Make */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                <FaCar size={16} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                Vehicle Make
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:border-blue-500'
                  } border-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                value={form.vehicleMake}
                onChange={e => setForm({ ...form, vehicleMake: e.target.value })}
                placeholder="e.g., Toyota, Honda, BMW"
              />
            </div>

            {/* Vehicle Model */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                <FaCar size={16} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                Vehicle Model
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600 focus:border-purple-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:border-purple-500'
                  } border-2 focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                value={form.vehicleModel}
                onChange={e => setForm({ ...form, vehicleModel: e.target.value })}
                placeholder="e.g., Camry, Accord, X5"
              />
            </div>

            {/* Vehicle Year */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                <FiCalendar size={16} className={isDark ? 'text-green-400' : 'text-green-600'} />
                Vehicle Year
              </label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600 focus:border-green-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:border-green-500'
                  } border-2 focus:outline-none focus:ring-2 focus:ring-green-500/20`}
                value={form.vehicleYear}
                onChange={e => setForm({ ...form, vehicleYear: e.target.value })}
                placeholder={new Date().getFullYear().toString()}
              />
            </div>

            {/* Registration Number */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                <FiHash size={16} className={isDark ? 'text-orange-400' : 'text-orange-600'} />
                Registration Number
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-xl font-mono font-medium transition-all duration-200 ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600 focus:border-orange-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:border-orange-500'
                  } border-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 uppercase`}
                value={form.regNumber}
                onChange={e => setForm({ ...form, regNumber: e.target.value.toUpperCase() })}
                placeholder="ABC-1234"
              />
            </div>

            {/* VIN */}
            <div className="md:col-span-2">
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                <FiHash size={16} className={isDark ? 'text-pink-400' : 'text-pink-600'} />
                VIN / Chassis Number
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-xl font-mono font-medium transition-all duration-200 ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-600 focus:border-pink-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:border-pink-500'
                  } border-2 focus:outline-none focus:ring-2 focus:ring-pink-500/20 uppercase`}
                value={form.vin}
                onChange={e => setForm({ ...form, vin: e.target.value.toUpperCase() })}
                placeholder="1HGBH41JXMN109186"
              />
            </div>
          </div>
        </div>

        {/* Image Upload Section */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-xl border overflow-hidden`}>
          <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' : 'border-gray-200 bg-gradient-to-r from-purple-600 to-pink-600'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <FiImage className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Vehicle Images</h2>
                  <p className="text-sm text-white/80">Upload or auto-fetch vehicle images</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                type="button"
                onClick={() => setShowCameraOptions(!showCameraOptions)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl ${isDark
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                  }`}
              >
                <FiUpload size={18} />
                {isImageUploaded ? 'Change Images' : 'Upload Images'}
              </button>

              {isImageUploaded && (
                <button
                  type="button"
                  onClick={removeImage}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl ${isDark
                      ? 'bg-red-600 hover:bg-red-700 text-white border-2 border-red-500'
                      : 'bg-white hover:bg-red-50 text-red-600 border-2 border-red-600'
                    }`}
                >
                  <FiTrash2 size={18} />
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
              <div className={`mb-6 p-4 rounded-2xl ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-blue-50 border-blue-200'} border`}>
                <p className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Choose upload method:
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${isDark
                        ? 'bg-gray-600 hover:bg-gray-500 text-white'
                        : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300'
                      }`}
                  >
                    <FiImage size={18} />
                    Choose from Gallery
                  </button>

                  <button
                    type="button"
                    onClick={openCamera}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${isDark
                        ? 'bg-gray-600 hover:bg-gray-500 text-white'
                        : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300'
                      }`}
                  >
                    <FiCamera size={18} />
                    Take Photo
                  </button>
                </div>
              </div>
            )}

            {/* Vehicle Preview */}
            {(form.vehicleMake && form.vehicleModel) && (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Vehicle Image */}
                <div className={`rounded-2xl p-5 ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-gray-200'} border-2`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <FiEye className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                      Vehicle Preview
                    </h3>
                    {isImageUploaded && (
                      <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold rounded-full">
                        Uploaded
                      </span>
                    )}
                  </div>

                  {isLoadingImage ? (
                    <div className="flex flex-col items-center justify-center h-80 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading vehicle image...</p>
                    </div>
                  ) : (
                    <div className="relative group">
                      <img
                        src={form.carImage}
                        alt={`${form.vehicleMake} ${form.vehicleModel}`}
                        className="rounded-xl shadow-2xl w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://via.placeholder.com/800x400?text=${encodeURIComponent(form.vehicleMake)}+${encodeURIComponent(form.vehicleModel)}&bg=4f46e5&fc=ffffff`;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <div className="text-white">
                          <p className="font-bold text-lg">{form.vehicleMake} {form.vehicleModel}</p>
                          <p className="text-sm">{form.vehicleYear}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {imageError && (
                    <p className={`text-xs mt-3 ${isDark ? 'text-yellow-400' : 'text-yellow-600'} flex items-center gap-2`}>
                      ⚠️ Using placeholder image
                    </p>
                  )}
                </div>

                {/* 3D Model Viewer */}
                <div className={`rounded-2xl p-5 ${isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-gray-200'} border-2`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <FiMove className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                      3D Interactive View
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${isZooming
                          ? 'bg-yellow-500 text-white animate-pulse'
                          : isDark ? 'bg-gray-800 text-purple-400' : 'bg-purple-100 text-purple-700'
                        }`}>
                        {currentView} • {Math.round(scale * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={resetView}
                        className={`p-2 rounded-lg transition-all ${isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-white hover:bg-gray-50 border-2 border-gray-300'}`}
                        title="Reset view"
                      >
                        <FiRotateCw size={16} />
                      </button>
                    </div>
                  </div>

                  {isLoadingAdImage ? (
                    <div className="flex flex-col items-center justify-center h-80 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mb-4"></div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading 3D model...</p>
                    </div>
                  ) : (
                    <>
                      {/* View Controls */}
                      <div className="flex justify-center gap-2 mb-3">
                        {['Front', 'Right', 'Rear', 'Left', 'Top'].map(view => (
                          <button
                            key={view}
                            type="button"
                            onClick={() => setView(view)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${(currentView === view) ||
                                (view === 'Right' && currentView === 'Right Side') ||
                                (view === 'Left' && currentView === 'Left Side')
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                                : isDark ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' : 'bg-white hover:bg-gray-50 border-2 border-gray-300'
                              }`}
                          >
                            {view}
                          </button>
                        ))}
                      </div>

                      {/* Zoom Controls */}
                      <div className="flex justify-center items-center gap-3 mb-4">
                        <button
                          type="button"
                          onClick={zoomOut}
                          className={`p-2 rounded-xl transition-all ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-gray-50 border-2 border-gray-300'}`}
                        >
                          <FiZoomOut size={18} />
                        </button>

                        <div className={`flex-1 max-w-32 h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-300"
                            style={{ width: `${((scale - 0.5) / 2.5) * 100}%` }}
                          ></div>
                        </div>

                        <button
                          type="button"
                          onClick={zoomIn}
                          className={`p-2 rounded-xl transition-all ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-gray-50 border-2 border-gray-300'}`}
                        >
                          <FiZoomIn size={18} />
                        </button>
                      </div>

                      {/* 3D Container */}
                      <div
                        ref={containerRef}
                        className={`relative h-80 rounded-xl overflow-hidden cursor-grab ${isDark ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 to-gray-100'
                          } border-2 ${isDark ? 'border-gray-600' : 'border-gray-200'} shadow-inner`}
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                        onWheel={handleWheel}
                      >
                        {/* Background Effects */}
                        <div className="absolute inset-0 overflow-hidden">
                          {[...Array(15)].map((_, i) => (
                            <div
                              key={i}
                              className={`absolute rounded-full ${isDark ? 'bg-white/10' : 'bg-white/40'}`}
                              style={{
                                width: `${Math.random() * 12 + 4}px`,
                                height: `${Math.random() * 12 + 4}px`,
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                animation: `float-up ${Math.random() * 12 + 8}s linear infinite`,
                                animationDelay: `${Math.random() * 4}s`,
                              }}
                            />
                          ))}
                        </div>

                        {/* 3D Model */}
                        <div
                          ref={modelRef}
                          className="absolute inset-0 flex items-center justify-center z-10"
                          style={{
                            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${scale})`,
                            transition: isDragging ? 'none' : 'transform 0.5s ease',
                            filter: isZooming ? 'drop-shadow(0 0 12px rgba(168, 85, 247, 0.6))' : 'drop-shadow(0 8px 12px rgba(0, 0, 0, 0.2))'
                          }}
                        >
                          <img
                            src={form.adImage}
                            alt={`3D ${form.vehicleMake} ${form.vehicleModel}`}
                            className="max-w-full h-auto"
                            style={{ maxHeight: '280px' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://via.placeholder.com/800x400?text=${encodeURIComponent(form.vehicleMake)}+${encodeURIComponent(form.vehicleModel)}&bg=transparent&fc=4f46e5`;
                            }}
                          />
                        </div>

                        {/* Controls Hint */}
                        {!isDragging && (
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
                            <div className="bg-black/40 backdrop-blur-md text-white text-xs py-2 px-4 rounded-full flex items-center gap-3">
                              <span>🖱️ Drag to rotate</span>
                              <span>•</span>
                              <span>🔍 Scroll to zoom</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {adImageError && (
                    <p className={`text-xs mt-3 ${isDark ? 'text-yellow-400' : 'text-yellow-600'} flex items-center gap-2`}>
                      ⚠️ Using placeholder for 3D view
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-8 py-4 font-bold text-lg transition-all duration-200 shadow-xl hover:shadow-2xl"
          >
            <FiSave size={20} />
            {id ? 'Update Client' : 'Save Client'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl ${isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-white border-2 border-gray-600'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300'
              }`}
          >
            <FiX size={20} />
            Cancel
          </button>
        </div>
      </form>

      {/* Animations */}
      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          10% {
            opacity: 0.5;
          }
          90% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}