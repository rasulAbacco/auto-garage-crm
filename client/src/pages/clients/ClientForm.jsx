import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const { isDark } = useTheme();

  const [form, setForm] = useState(empty);
  const [isImageUploaded, setIsImageUploaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingClient, setLoadingClient] = useState(false);

  /** Fetch client for edit mode */
  useEffect(() => {
    // If we have client data passed via state, use it directly
    if (location.state?.clientData) {
      const clientData = location.state.clientData;
      setForm({
        ...empty,
        ...clientData,
        receiverName: clientData.receiverName ?? clientData.staffPerson ?? "",
        damageImages: Array.isArray(clientData.damageImages) ? clientData.damageImages : [],
      });
      setIsImageUploaded(!!clientData.carImage);
      return;
    }

    // Otherwise, fetch from API if we have an ID
    if (!id) return;

    const fetchClient = async () => {
      try {
        setLoadingClient(true);
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found. Please log in again.");
        }

        const res = await fetch(`${API_BASE}/api/clients/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 400) {
          if (data.duplicate) {
            alert(data.message);
            navigate(`/clients/${data.clientId}`);
            return;
          }
        }

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
            return;
          }
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Failed to fetch client");
        }

        const data = await res.json();

        // Ensure defaults if fields missing (for backward compatibility)
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
        if (err.message.includes("401") || err.message.includes("Unauthorized")) {
          navigate("/login");
        }
      } finally {
        setLoadingClient(false);
      }
    };
    fetchClient();
  }, [id, location.state, navigate]);

  /** ✅ Auto-fetch car image from Unsplash when make + model entered */
  useEffect(() => {
    if (!form.vehicleMake || !form.vehicleModel || isImageUploaded) return;

    const fetchCarImage = async () => {
      const query = `${form.vehicleMake} ${form.vehicleModel} car`;
      try {
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
            query
          )}&client_id=${UNSPLASH_KEY}&orientation=landscape&per_page=1`
        );
        const data = await res.json();

        if (data.results && data.results.length > 0) {
          const imgUrl = data.results[0].urls.small;
          setForm((prev) => ({
            ...prev,
            carImage: imgUrl,
            adImage: imgUrl,
          }));
          setIsImageUploaded(true);
          console.log(`✅ Auto image found for ${query}: ${imgUrl}`);
        } else {
          console.warn(`⚠️ No Unsplash image found for ${query}`);
        }
      } catch (err) {
        console.error("Unsplash fetch error:", err);
      }
    };

    const debounce = setTimeout(fetchCarImage, 800);
    return () => clearTimeout(debounce);
  }, [form.vehicleMake, form.vehicleModel, isImageUploaded]);

  /** Basic validation */
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

  /** Submit form */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

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
        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        alert(`Error: ${data.message || "Failed to save client"}`);
      }
    } catch (err) {
      console.error("Error saving client:", err);
      alert("Error saving client.");
      if (err.message.includes("401") || err.message.includes("Unauthorized")) {
        navigate("/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Render */
  return (
    <div className="lg:ml-16 p-6 space-y-6">
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
        {/* Personal Info */}
        <PersonalInfoSection form={form} setForm={setForm} isDark={isDark} />

        {/* Vehicle Info */}
        <VehicleInfoSection form={form} setForm={setForm} isDark={isDark} />

        {/* Image Uploader */}
        <ImageUploader
          form={form}
          setForm={setForm}
          isDark={isDark}
          isImageUploaded={isImageUploaded}
          setIsImageUploaded={setIsImageUploaded}
        />

        {/* 3D Vehicle Viewer */}
        <Vehicle3DViewer
          adImage={form.adImage}
          carImage={form.carImage}
          damageImages={form.damageImages}
          vehicleMake={form.vehicleMake}
          vehicleModel={form.vehicleModel}
          isDark={isDark}
        />

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting || loadingClient}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-8 py-4 font-bold text-lg transition-all duration-200 shadow-xl hover:shadow-2xl disabled:opacity-60"
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
            onClick={() => navigate("/clients")} // Changed from navigate(-1) to navigate("/clients")
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