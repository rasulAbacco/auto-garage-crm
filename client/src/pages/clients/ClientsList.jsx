// client/src/pages/clients/ClientList.jsx
import React, { useMemo, useState } from 'react'
import { listClients, deleteClient } from '../../lib/storage.js'
import Table from '../../components/Table.jsx'
import SearchBar from '../../components/SearchBar.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { FiEye, FiEdit, FiTrash2, FiX, FiUser, FiPhone, FiMail } from 'react-icons/fi'
import { FaCar } from "react-icons/fa";
import { useTheme } from '../../contexts/ThemeContext'

export default function ClientsList() {
  const [q, setQ] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const data = listClients()

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    return data.filter(c =>
      [c.fullName, c.phone, c.email, c.regNumber].some(v => String(v).toLowerCase().includes(term))
    )
  }, [q, data])

  const columns = [
    {
      key: 'carImage',
      label: 'Vehicle',
      render: (value, row) => (
        <div className="flex items-center space-x-4">
          <div
            className="cursor-pointer group"
            onClick={() => setSelectedClient(row)}
          >
            <div className="relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 group-hover:shadow-2xl group-hover:scale-105">
              <img
                src={value || `https://via.placeholder.com/120x80?text=${encodeURIComponent(row.vehicleMake)}+${encodeURIComponent(row.vehicleModel)}`}
                alt="Vehicle"
                className="w-32 h-24 object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://via.placeholder.com/120x80?text=${encodeURIComponent(row.vehicleMake)}+${encodeURIComponent(row.vehicleModel)}`;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2">
                <span className="text-white text-xs font-semibold">View Details</span>
              </div>
            </div>
          </div>
          <div>
            <div className={`font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {row.vehicleMake} {row.vehicleModel}
            </div>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1`}>
              <FaCar size={14} />
              {row.vehicleYear}
            </div>
          </div>
        </div>
      )
    },
    { 
      key: 'fullName', 
      label: 'Full Name',
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-md">
            {value?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</span>
        </div>
      )
    },
    { 
      key: 'phone', 
      label: 'Phone',
      render: (value) => (
        <div className={`flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          <FiPhone size={14} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
          {value}
        </div>
      )
    },
    { 
      key: 'email', 
      label: 'Email',
      render: (value) => (
        <div className={`flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          <FiMail size={14} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
          {value}
        </div>
      )
    },
    { 
      key: 'vehicleMake', 
      label: 'Make',
      render: (value) => (
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDark ? 'bg-blue-900/30 text-blue-300 border border-blue-700' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
          {value}
        </span>
      )
    },
    { 
      key: 'regNumber', 
      label: 'Reg No.',
      render: (value) => (
        <span className={`font-mono font-semibold px-3 py-1.5 rounded-lg ${isDark ? 'bg-gray-700 text-yellow-400 border border-gray-600' : 'bg-gray-100 text-gray-900 border border-gray-300'}`}>
          {value}
        </span>
      )
    },
  ]

  const closeModal = () => setSelectedClient(null);

  return (
    <div className="space-y-6 lg:ml-16">
      {/* Header Section */}
      <div className={`${isDark ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-blue-600 to-purple-600'} rounded-2xl p-8 shadow-xl`}>
        <h1 className="text-3xl font-bold text-white mb-2">Client Management</h1>
        <p className={`${isDark ? 'text-gray-300' : 'text-blue-100'}`}>Manage your clients and their vehicles</p>
      </div>

      {/* Search and Add Section */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-lg border`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-96">
            <SearchBar 
              value={q} 
              onChange={setQ} 
              placeholder="Search by name, phone, email, reg no..." 
            />
          </div>
          <Link
            to="/clients/new"
            className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-6 py-3 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <FiUser size={18} />
            Add New Client
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-lg border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Clients</p>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{data.length}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FiUser className="text-white" size={24} />
            </div>
          </div>
        </div>
        
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-lg border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Search Results</p>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{filtered.length}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FaCar className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-lg border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active Records</p>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{filtered.length}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FiMail className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-lg border overflow-hidden`}>
        <Table
          columns={columns}
          data={filtered}
          actions={(row) => (
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/clients/${row.id}`)}
                aria-label="View Client"
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isDark 
                    ? 'hover:bg-blue-900/30 text-blue-400 hover:text-blue-300' 
                    : 'hover:bg-blue-50 text-blue-600 hover:text-blue-700'
                }`}
                title="View"
              >
                <FiEye size={18} />
              </button>
              <button
                onClick={() => navigate(`/clients/${row.id}/edit`)}
                aria-label="Edit Client"
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isDark 
                    ? 'hover:bg-purple-900/30 text-purple-400 hover:text-purple-300' 
                    : 'hover:bg-purple-50 text-purple-600 hover:text-purple-700'
                }`}
                title="Edit"
              >
                <FiEdit size={18} />
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this client?')) {
                    deleteClient(row.id)
                    navigate(0)
                  }
                }}
                aria-label="Delete Client"
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isDark 
                    ? 'hover:bg-red-900/30 text-red-400 hover:text-red-300' 
                    : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                }`}
                title="Delete"
              >
                <FiTrash2 size={18} />
              </button>
            </div>
          )}
        />
      </div>

      {/* Enhanced Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 animate-slideUp`}>
            {/* Modal Header */}
            <div className={`flex justify-between items-center p-6 border-b ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' : 'border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600'}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <FaCar className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Vehicle Details</h2>
                  <p className="text-sm text-white/80">Complete vehicle and client information</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all duration-200"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              {/* Left Side - Car Image and Details */}
              <div className={`md:w-1/2 p-6 flex flex-col ${isDark ? 'bg-gray-800' : 'bg-gray-50'} overflow-y-auto`}>
                <div className="mb-6 relative w-full">
                  {/* Enhanced Road Background */}
                  <div className="relative h-80 overflow-hidden rounded-2xl shadow-inner">
                    {/* Sky Gradient */}
                    <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-700' : 'bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200'}`}></div>
                    
                    {/* Road */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-gray-600 to-gray-800 shadow-2xl"></div>

                    {/* Road texture */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 opacity-30">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-0.5 bg-gray-900 mb-3"></div>
                      ))}
                    </div>

                    {/* Road side lines */}
                    <div className="absolute bottom-32 left-0 right-0 h-1 bg-white/80 shadow-sm"></div>

                    {/* Road markings */}
                    <div className="absolute bottom-14 left-0 right-0 flex justify-around items-center px-4">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-2 w-16 bg-yellow-400 shadow-md rounded-sm"></div>
                      ))}
                    </div>

                    {/* Car Display */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-20">
                      {/* Car Name Badge */}
                      <div className={`${isDark ? 'bg-gray-700 border-blue-500' : 'bg-white border-indigo-500'} px-5 py-2.5 rounded-xl shadow-2xl mb-3 border-2`}>
                        <div className={`text-base font-bold ${isDark ? 'text-blue-400' : 'text-indigo-700'}`}>
                          {selectedClient.vehicleMake} {selectedClient.vehicleModel}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} text-center mt-1`}>
                          {selectedClient.vehicleYear} • {selectedClient.regNumber}
                        </div>
                      </div>

                      {/* Car Image */}
                      <img
                        src={selectedClient.carImage || `https://via.placeholder.com/400x240?text=${encodeURIComponent(selectedClient.vehicleMake)}+${encodeURIComponent(selectedClient.vehicleModel)}`}
                        alt={`${selectedClient.vehicleMake} ${selectedClient.vehicleModel}`}
                        className="h-56 w-auto object-contain drop-shadow-2xl"
                        style={{ filter: 'drop-shadow(0 25px 25px rgba(0, 0, 0, 0.4))' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://via.placeholder.com/400x240?text=${encodeURIComponent(selectedClient.vehicleMake)}+${encodeURIComponent(selectedClient.vehicleModel)}`;
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Information Card */}
                <div className={`w-full ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} p-6 rounded-2xl shadow-lg border`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <FaCar className="text-white" size={20} />
                    </div>
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Vehicle Information</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Make', value: selectedClient.vehicleMake },
                      { label: 'Model', value: selectedClient.vehicleModel },
                      { label: 'Year', value: selectedClient.vehicleYear },
                      { label: 'Reg No.', value: selectedClient.regNumber },
                      { label: 'VIN', value: selectedClient.vin || 'N/A' }
                    ].map((item, idx) => (
                      <div key={idx} className={`flex justify-between items-center p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                        <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.label}:</span>
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side - Client Details */}
              <div className={`md:w-1/2 p-6 flex flex-col ${isDark ? 'bg-gray-750' : 'bg-white'} overflow-y-auto`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <FiUser className="text-white" size={20} />
                  </div>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Client Information</h3>
                </div>

                <div className="space-y-6 mb-6">
                  {/* Client Avatar and Name */}
                  <div className={`flex items-center space-x-4 p-5 rounded-2xl ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gradient-to-r from-blue-50 to-purple-50 border-gray-200'} border shadow-sm`}>
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                      {selectedClient.fullName ? selectedClient.fullName.charAt(0) : 'C'}
                    </div>
                    <div>
                      <h4 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedClient.fullName}</h4>
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} flex items-center gap-1 mt-1`}>
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Active Client
                      </p>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} p-5 rounded-2xl border`}>
                    <div className="grid grid-cols-1 gap-4">
                      {[
                        { icon: FiPhone, label: 'Phone', value: selectedClient.phone, color: 'blue' },
                        { icon: FiMail, label: 'Email', value: selectedClient.email, color: 'purple' },
                        { icon: FaCar, label: 'Registration No.', value: selectedClient.regNumber, color: 'green' },
                        { icon: FaCar, label: 'VIN', value: selectedClient.vin || 'N/A', color: 'orange' }
                      ].map((item, idx) => (
                        <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}>
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 flex items-center justify-center flex-shrink-0 shadow-md`}>
                            <item.icon className="text-white" size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{item.label}</p>
                            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-auto pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        navigate(`/clients/${selectedClient.id}`);
                        closeModal();
                      }}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                    >
                      <FiEye size={18} />
                      View
                    </button>
                    <button
                      onClick={() => {
                        navigate(`/clients/${selectedClient.id}/edit`);
                        closeModal();
                      }}
                      className={`${isDark ? 'bg-purple-600 hover:bg-purple-700 border-purple-500' : 'bg-white hover:bg-gray-50 border-purple-600 text-purple-600'} py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold border-2`}
                    >
                      <FiEdit size={18} />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this client?')) {
                          deleteClient(selectedClient.id);
                          closeModal();
                          navigate(0);
                        }
                      }}
                      className={`${isDark ? 'bg-red-600 hover:bg-red-700 border-red-500' : 'bg-white hover:bg-red-50 border-red-600 text-red-600'} py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold border-2`}
                    >
                      <FiTrash2 size={18} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}