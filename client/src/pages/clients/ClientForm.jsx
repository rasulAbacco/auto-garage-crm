// client/src/pages/clients/ClientForm.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { FiArrowLeft, FiSave, FiX } from "react-icons/fi";
import { useTheme } from "../../contexts/ThemeContext";
import PersonalInfoSection from "./components/PersonalInfoSection";
import VehicleInfoSection from "./components/VehicleInfoSection";
import ImageUploader from "./components/ImageUploader";
import Vehicle3DViewer from "./components/Vehicle3DViewer";

const empty = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleYear: "",
  regNumber: "",
  vin: "",
  carImage: "",
  adImage: "",
  staffPerson: "",
};

export default function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [form, setForm] = useState(empty);
  const [isImageUploaded, setIsImageUploaded] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isLoadingAdImage, setIsLoadingAdImage] = useState(false);

  // ✅ Fetch existing client if editing
  useEffect(() => {
    if (id) {
      const fetchClient = async () => {
        try {
          const token = localStorage.getItem("token");
          const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
          const res = await fetch(`${base}/api/clients/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok) {
            setForm(data);
            setIsImageUploaded(!!data.carImage);
          }
        } catch (err) {
          console.error("Error fetching client:", err);
        }
      };
      fetchClient();
    }
  }, [id]);

  // ✅ Submit to backend (POST or PUT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      const method = id ? "PUT" : "POST";
      const url = id ? `${base}/api/clients/${id}` : `${base}/api/clients`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          vehicleYear: Number(form.vehicleYear) || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const clientId = data.id || data.client?.id; // ✅ Handles both cases
        navigate(`/clients/${clientId}`);
      }
      else alert(`Error: ${data.message || "Failed to save client"}`);
    } catch (err) {
      alert("Error saving client.");
      console.error(err);
    }
  };

  return (
    <div className="lg:ml-16 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/clients"
            className={`inline-flex items-center gap-2 ${isDark
                ? "text-gray-300 hover:text-white"
                : "text-gray-600 hover:text-gray-900"
              } transition-colors duration-200 mb-3`}
          >
            <FiArrowLeft />
            <span className="font-medium">Back to Clients</span>
          </Link>
          <h1
            className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"
              }`}
          >
            {id ? "Edit Client" : "Add New Client"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <PersonalInfoSection form={form} setForm={setForm} isDark={isDark} />
        <VehicleInfoSection form={form} setForm={setForm} isDark={isDark} />
        <ImageUploader
          form={form}
          setForm={setForm}
          isDark={isDark}
          isImageUploaded={isImageUploaded}
          setIsImageUploaded={setIsImageUploaded}
          isLoadingImage={isLoadingImage}
          setIsLoadingImage={setIsLoadingImage}
        />
        <Vehicle3DViewer form={form} isDark={isDark} />

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-8 py-4 font-bold text-lg transition-all duration-200 shadow-xl hover:shadow-2xl"
          >
            <FiSave size={20} />
            {id ? "Update Client" : "Save Client"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl ${isDark
                ? "bg-gray-700 hover:bg-gray-600 text-white border-2 border-gray-600"
                : "bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300"
              }`}
          >
            <FiX size={20} />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
