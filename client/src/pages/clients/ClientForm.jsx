import React, { useEffect, useState } from "react";
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
  receiverName: "",
  damageImages: [],
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

export default function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [form, setForm] = useState(empty);
  const [isImageUploaded, setIsImageUploaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingClient, setLoadingClient] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchClient = async () => {
      try {
        setLoadingClient(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/clients/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Failed to fetch client");
        }

        const data = await res.json();
        setForm({
          ...empty,
          ...data,
          receiverName: data.receiverName ?? data.staffPerson ?? "",
          damageImages: Array.isArray(data.damageImages) ? data.damageImages : [],
        });
        setIsImageUploaded(!!data.carImage);
      } catch (err) {
        console.error("Error fetching client:", err);
        alert(err.message || "Failed to load client");
      } finally {
        setLoadingClient(false);
      }
    };
    fetchClient();
  }, [id]);

  useEffect(() => {
    if (!form.vehicleMake || !form.vehicleModel || isImageUploaded) return;

    const fetchCarImage = async () => {
      const baseQuery = `${form.vehicleMake} ${form.vehicleModel}`;
      const queryVariants = [`${baseQuery} car`];

      try {
        let bestImage = null;
        for (const query of queryVariants) {
          const res = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${UNSPLASH_KEY}&orientation=landscape&per_page=5`
          );
          if (!res.ok) {
            console.warn(`Unsplash API error for query "${query}"`);
            continue;
          }
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            bestImage = data.results[0];
            console.log(`✅ Found image for query "${query}"`);
            break;
          }
        }

        if (bestImage) {
          const imgUrl = bestImage.urls.small;
          setForm((prev) => ({
            ...prev,
            carImage: imgUrl,
            adImage: imgUrl,
          }));
          setIsImageUploaded(true);
          console.log(`✅ Auto image set: ${imgUrl}`);
        } else {
          console.warn("⚠️ No suitable image found");
        }
      } catch (err) {
        console.error("Error fetching images from Unsplash:", err);
      }
    };

    const debounce = setTimeout(fetchCarImage, 800);
    return () => clearTimeout(debounce);
  }, [form.vehicleMake, form.vehicleModel, isImageUploaded]);

  const validate = () => {
    if (!form.fullName || form.fullName.trim().length < 2) {
      alert("Please enter a valid full name");
      return false;
    }
    if (!form.phone || form.phone.trim().length < 6) {
      alert("Please enter a valid phone number");
      return false;
    }
    if (!form.vehicleMake || !form.vehicleModel) {
      alert("Please provide vehicle make & model");
      return false;
    }
    if (!form.vehicleYear || isNaN(Number(form.vehicleYear))) {
      alert("Please enter a valid vehicle year");
      return false;
    }
    if (!form.regNumber) {
      alert("Please provide registration number");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      const method = id ? "PUT" : "POST";
      const url = id
        ? `${API_BASE}/api/clients/${id}`
        : `${API_BASE}/api/clients`;

      const payload = {
        ...form,
        vehicleYear: Number(form.vehicleYear) || null,
        receiverName: form.receiverName || null,
        damageImages: form.damageImages || [],
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        const clientId = data?.client?.id || data?.id || data?.clientId;
        navigate(`/clients/${clientId}`);
      } else {
        alert(`Error: ${data.message || "Failed to save client"}`);
      }
    } catch (err) {
      console.error("Error saving client:", err);
      alert("Error saving client.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} lg:ml-16`}>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/clients"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg mb-4 transition-colors ${isDark
                ? "text-gray-300 hover:text-white hover:bg-gray-800"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
          >
            <FiArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Clients</span>
          </Link>

          <div className={`p-6 sm:p-8 rounded-2xl shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-900/50 to-purple-900/50' : 'bg-gradient-to-r from-blue-600 to-purple-600'
            }`}>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              {id ? "Edit Client" : "Add New Client"}
            </h1>
            <p className="text-blue-100 mt-2">
              {id ? "Update client and vehicle information" : "Enter client and vehicle details"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div className={`rounded-2xl p-6 sm:p-8 shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <PersonalInfoSection form={form} setForm={setForm} isDark={isDark} />
          </div>

          {/* Vehicle Info */}
          <div className={`rounded-2xl p-6 sm:p-8 shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <VehicleInfoSection form={form} setForm={setForm} isDark={isDark} />
          </div>

          {/* Image Uploader */}
          <div className={`rounded-2xl p-6 sm:p-8 shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <ImageUploader
              form={form}
              setForm={setForm}
              isDark={isDark}
              isImageUploaded={isImageUploaded}
              setIsImageUploaded={setIsImageUploaded}
            />
          </div>

          {/* 3D Vehicle Viewer */}
          {(form.carImage || form.adImage) && (
            <div className={`rounded-2xl p-6 sm:p-8 shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <Vehicle3DViewer
                adImage={form.adImage}
                carImage={form.carImage}
                damageImages={form.damageImages}
                vehicleMake={form.vehicleMake}
                vehicleModel={form.vehicleModel}
                isDark={isDark}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={isSubmitting || loadingClient}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-8 py-4 font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FiSave size={20} />
              {isSubmitting
                ? id
                  ? "Updating..."
                  : "Saving..."
                : id
                  ? "Update Client"
                  : "Save Client"}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl ${isDark
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300"
                }`}
            >
              <FiX size={20} />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}