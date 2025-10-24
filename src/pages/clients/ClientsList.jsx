import React, { useMemo, useState } from 'react'
import { listClients, deleteClient } from '../../lib/storage.js'
import Table from '../../components/Table.jsx'
import SearchBar from '../../components/SearchBar.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { FiEye, FiEdit, FiTrash2, FiX } from 'react-icons/fi'

export default function ClientsList() {
  const [q, setQ] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const navigate = useNavigate()
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
            className="cursor-pointer"
            onClick={() => setSelectedClient(row)}
          >
            <img 
              src={value || `https://via.placeholder.com/120x80?text=${encodeURIComponent(row.vehicleMake)}+${encodeURIComponent(row.vehicleModel)}`} 
              alt="Vehicle" 
              className="w-32 h-24 object-cover rounded-xl shadow-md transition-transform hover:scale-105"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://via.placeholder.com/120x80?text=${encodeURIComponent(row.vehicleMake)}+${encodeURIComponent(row.vehicleModel)}`;
              }}
            />
          </div>
          <div>
            <div className="font-medium">{row.vehicleMake} {row.vehicleModel}</div>
            <div className="text-sm text-gray-500">{row.vehicleYear}</div>
          </div>
        </div>
      )
    },
    { key: 'fullName', label: 'Full Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'vehicleMake', label: 'Make' },
    { key: 'regNumber', label: 'Reg No.' },
  ]

  // Close modal
  const closeModal = () => setSelectedClient(null);

  return (
    <div className="space-y-6 lg:pl-64">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <SearchBar value={q} onChange={setQ} placeholder="Search by name, phone, email, reg no..." />
        <Link
          to="/clients/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2 font-semibold transition"
        >
          Add Client
        </Link>
      </div>

      <Table
        columns={columns}
        data={filtered}
        actions={(row) => (
          <div className="flex gap-3 text-gray-600">
            <button
              onClick={() => navigate(`/clients/${row.id}`)}
              aria-label="View Client"
              className="hover:text-indigo-600"
              title="View"
            >
              <FiEye size={18} />
            </button>
            <button
              onClick={() => navigate(`/clients/${row.id}/edit`)}
              aria-label="Edit Client"
              className="hover:text-indigo-600 text-[#3D3BF3]"
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
              className="hover:text-red-600 text-red-700"
              title="Delete"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        )}
      />
      
      {/* Car Details Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Vehicle Details</h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              {/* Left Side - Car Image and Details */}
              <div className="md:w-1/2 p-1 flex flex-col items-center justify-center">
                <div className="mb-5 relative w-full max-w-md">
                  {/* Realistic Road Background */}
                  <div className="relative h-80 overflow-hidden rounded-xl">
                    {/* Road - Fixed horizontal road */}
                    <div className="absolute bottom-0 left-0 right-0 h-28 bg-gray-700 shadow-inner"></div>
                    
                    {/* Road texture - subtle lines for asphalt */}
                    <div className="absolute bottom-0 left-0 right-0 h-28 opacity-20">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-0.5 bg-gray-900 mb-4"></div>
                      ))}
                    </div>
                    
                    {/* Road side lines */}
                    <div className="absolute bottom-28 left-0 right-0 h-1 bg-white opacity-70"></div>
                    
                    {/* Road markings - dashed center line */}
                    <div className="absolute bottom-12 left-0 right-0 flex justify-around items-center">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="h-1.5 w-12 bg-yellow-400 shadow-sm"></div>
                      ))}
                    </div>
                    
                    {/* Static Car with Name - positioned ON the road */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-20">
                      {/* Car Name Badge */}
                      <div className="bg-white px-4 py-2 rounded-lg shadow-lg mb-2 border-2 border-indigo-500">
                        <div className="text-base font-bold text-indigo-700">
                          {selectedClient.vehicleMake} {selectedClient.vehicleModel}
                        </div>
                        <div className="text-xs text-gray-600 text-center">{selectedClient.vehicleYear}</div>
                      </div>
                      
                      {/* Car Image - Much Larger size */}
                      <img 
                        src={selectedClient.carImage || `https://via.placeholder.com/400x240?text=${encodeURIComponent(selectedClient.vehicleMake)}+${encodeURIComponent(selectedClient.vehicleModel)}`} 
                        alt={`${selectedClient.vehicleMake} ${selectedClient.vehicleModel}`}
                        className="h-60 w-auto object-contain drop-shadow-8xl"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://via.placeholder.com/400x240?text=${encodeURIComponent(selectedClient.vehicleMake)}+${encodeURIComponent(selectedClient.vehicleModel)}`;
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Vehicle Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Make:</span>
                      <span className="font-medium">{selectedClient.vehicleMake}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Model:</span>
                      <span className="font-medium">{selectedClient.vehicleModel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-medium">{selectedClient.vehicleYear}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reg No.:</span>
                      <span className="font-medium">{selectedClient.regNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">VIN:</span>
                      <span className="font-medium">{selectedClient.vin || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Side - Client Details */}
              <div className="md:w-1/2 p-6 flex flex-col">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Client Information</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-bold text-xl">
                      {selectedClient.fullName ? selectedClient.fullName.charAt(0) : 'C'}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold">{selectedClient.fullName}</h4>
                      <p className="text-gray-600">Client</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{selectedClient.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{selectedClient.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Registration No.</p>
                        <p className="font-medium">{selectedClient.regNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">VIN</p>
                        <p className="font-medium">{selectedClient.vin || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-auto">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        navigate(`/clients/${selectedClient.id}`);
                        closeModal();
                      }}
                      className="flex-1 min-w-[120px] bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                    >
                      <FiEye size={18} />
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        navigate(`/clients/${selectedClient.id}/edit`);
                        closeModal();
                      }}
                      className="flex-1 min-w-[120px] bg-white hover:bg-gray-100 text-indigo-600 border border-indigo-600 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
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
                      className="flex-1 min-w-[120px] bg-white hover:bg-red-50 text-red-600 border border-red-600 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
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
    </div>
  )
}