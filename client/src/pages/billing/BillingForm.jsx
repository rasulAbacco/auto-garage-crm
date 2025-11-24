// client/src/pages/billing/BillingForm.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import {
  FiFileText, FiCalendar, FiUser, FiTool, FiDollarSign, FiSave, FiX,
  FiArrowLeft, FiHash, FiPercent, FiTag, FiAlertCircle,
  FiCreditCard, FiCheckCircle
} from "react-icons/fi";
import { useTheme } from "../../contexts/ThemeContext";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Auth helpers
const getAuthToken = () => localStorage.getItem("token") || localStorage.getItem("authToken");
const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    window.location.href = "/login";
  }
  return response;
};

// Generate a temporary invoice number
const generateTempInvoiceNumber = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${dateStr}-${random}`;
};

// Get initial form state
const getInitialFormState = (isEditMode, preSelectedClientId, serviceData) => {
  const today = new Date().toISOString().split('T')[0];

  if (isEditMode) {
    return {
      invoiceNumber: "",
      date: "",
      customerId: "",
      vehicle: "",
      mechanic: "",
      description: "",
      partsCost: 0,
      partsGst: 0,
      laborCost: 0,
      laborGst: 0,
      taxes: 0,
      discounts: 0,
      total: 0,
      paymentMode: "",
      status: "Pending",
      dueDate: "",
      notes: "",
      serviceType: "",
      serviceCategory: "",
      serviceSubCategory: "",
      serviceNotes: "",
    };
  } else {
    return {
      invoiceNumber: generateTempInvoiceNumber(),
      date: today,
      customerId: preSelectedClientId || (serviceData?.clientId || ""),
      vehicle: serviceData?.vehicle || "",
      mechanic: serviceData?.mechanic || "",
      description: serviceData?.description || "",
      partsCost: serviceData?.partsCost || 0,
      partsGst: serviceData?.partsGst || 0,
      laborCost: serviceData?.laborCost || 0,
      laborGst: serviceData?.laborGst || 0,
      taxes: serviceData?.taxes || 0,
      discounts: serviceData?.discounts || 0,
      total: 0, // Will be calculated automatically
      paymentMode: serviceData?.paymentMode || "",
      status: serviceData?.status || "Pending",
      dueDate: serviceData?.dueDate || "",
      notes: serviceData?.notes || "",
      // Add service type and category fields
      // serviceType: serviceData?.serviceType || "",
      serviceCategory: serviceData?.serviceCategory || "",
      serviceSubCategory: serviceData?.serviceSubCategory || "",
      serviceNotes: serviceData?.serviceNotes || "",
    };
  }
};

export default function BillingForm() {
  const { id } = useParams();                        // ✅ EDIT MODE if id exists
  const isEditMode = Boolean(id);
  const location = useLocation();
  const preSelectedClientId = location.state?.clientId || "";
  const serviceData = location.state?.serviceData || null;

  const [form, setForm] = useState(() => getInitialFormState(isEditMode, preSelectedClientId, serviceData));
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // 1️⃣ Fetch clients
  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/api/clients?page=1&limit=200`);
        const data = await res.json();
        setClients(data.data || data || []);
      } catch (err) {
        console.error("Failed to load clients:", err);
        setError("Failed to load clients");
      }
    };
    loadClients();
  }, []);

  // 2️⃣ Fetch invoice when editing
  useEffect(() => {
    if (!isEditMode) return;

    const loadInvoice = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(`${API_URL}/api/invoices/${id}`);
        const data = await res.json();

        setForm({
          invoiceNumber: data.invoiceNumber,
          date: data.createdAt?.split("T")[0] || "",
          customerId: data.clientId,
          vehicle: data.vehicle || "",
          mechanic: data.mechanic || "",
          description: data.notes || "",
          partsCost: data.partsCost,
          partsGst: data.partsGst,
          laborCost: data.laborCost,
          laborGst: data.laborGst,
          taxes: data.tax,
          discounts: data.discount,
          total: data.grandTotal,
          paymentMode: data.paymentMode,
          status: data.status,
          dueDate: data.dueDate ? data.dueDate.split("T")[0] : "",
          notes: data.notes,
          serviceType: data.serviceType || "",
          serviceCategory: data.serviceCategory || "",
          serviceSubCategory: data.serviceSubCategory || "",
          serviceNotes: data.serviceNotes || "",
        });
      } catch (err) {
        setError("Failed to load invoice");
      }
      setLoading(false);
    };

    loadInvoice();
  }, [id]);

  // 3️⃣ Auto total calculation
  useEffect(() => {
    const partsTotal = Number(form.partsCost) + (Number(form.partsCost) * Number(form.partsGst) / 100);
    const laborTotal = Number(form.laborCost) + (Number(form.laborCost) * Number(form.laborGst) / 100);
    const total = partsTotal + laborTotal + Number(form.taxes) - Number(form.discounts);
    setForm((f) => ({ ...f, total }));
  }, [
    form.partsCost,
    form.partsGst,
    form.laborCost,
    form.laborGst,
    form.taxes,
    form.discounts,
  ]);

  // 4️⃣ Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      partsCost: Number(form.partsCost),
      partsGst: Number(form.partsGst),
      laborCost: Number(form.laborCost),
      laborGst: Number(form.laborGst),
      totalAmount: Number(form.partsCost) + Number(form.laborCost),
      tax: Number(form.taxes),
      discount: Number(form.discounts),
      grandTotal: Number(form.total),
      paymentMode: form.paymentMode,
      status: form.status,
      dueDate: form.dueDate ? new Date(form.dueDate) : null,
      notes: form.description,
      // Include service type and category
      serviceType: form.serviceType,
      serviceCategory: form.serviceCategory,
      serviceSubCategory: form.serviceSubCategory,
      serviceNotes: form.serviceNotes,
    };

    try {
      let res;
      if (isEditMode) {
        // ✅ EDIT MODE
        res = await fetchWithAuth(`${API_URL}/api/invoices/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        // ✅ CREATE MODE
        payload.clientId = Number(form.customerId);

        res = await fetchWithAuth(`${API_URL}/api/invoices`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("Failed to save invoice");

      const data = await res.json();
      navigate(`/billing/${isEditMode ? id : data.invoice.id}`);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  if (loading && isEditMode)
    return <div className="p-6 text-center">Loading invoice…</div>;

  return (
    <div className="lg:ml-16 p-6 space-y-6">

      <Link to="/billing" className="flex items-center gap-2 mb-4">
        <FiArrowLeft /> Back to Billing
      </Link>

      <h1 className="text-3xl font-bold">
        {isEditMode ? "Edit Invoice" : "Create Invoice"}
      </h1>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 rounded-xl">
          <FiAlertCircle /> {error}
        </div>
      )}

      {/* Notification for pre-populated data */}
      {serviceData && (
        <div className="p-4 bg-blue-100 border border-blue-400 rounded-xl">
          <FiAlertCircle className="text-blue-600" />
          <span className="ml-2">Invoice pre-populated with service details. You can modify any values before saving.</span>
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Invoice Header */}
        <div className="rounded-3xl shadow-xl border p-6">
          <div className="grid md:grid-cols-2 gap-6">

            <Input label="Invoice Number" icon={<FiHash />} value={form.invoiceNumber} readOnly />

            <Input
              label="Invoice Date"
              type="date"
              icon={<FiCalendar />}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />

            {!isEditMode && (
              <div>
                <label className="block font-semibold mb-2 flex items-center gap-2">
                  <FiUser /> Customer
                </label>

                <select
                  value={form.customerId}
                  onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                  required
                  className="border p-3 w-full rounded-xl"
                >
                  <option value="">Select Customer</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.regNumber})
                    </option>
                  ))}
                </select>

                {preSelectedClientId && (
                  <div className="mt-2 text-sm text-blue-600 flex items-center">
                    <FiUser className="mr-1" /> Pre-selected customer from previous page
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Service Details */}
        <div className="rounded-3xl shadow-xl border p-6">
          <h2 className="font-bold text-xl mb-4">Service Details</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* <Input label="Service Type" icon={<FiTool />}
              value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} /> */}

            <Input label="Service Category" icon={<FiTag />}
              value={form.serviceCategory} onChange={(e) => setForm({ ...form, serviceCategory: e.target.value })} />

            <Input label="Service Sub-Category" icon={<FiTag />}
              value={form.serviceSubCategory} onChange={(e) => setForm({ ...form, serviceSubCategory: e.target.value })} />

            <Input label="Vehicle" icon={<FiTool />}
              value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} />

            <Input label="Mechanic" icon={<FiUser />}
              value={form.mechanic} onChange={(e) => setForm({ ...form, mechanic: e.target.value })} />
          </div>

          <div className="mt-6">
            <label className="block font-semibold mb-2 flex items-center gap-2">
              <FiFileText /> Service Notes
            </label>
            <textarea
              value={form.serviceNotes}
              onChange={(e) => setForm({ ...form, serviceNotes: e.target.value })}
              className="w-full rounded-xl border p-3 h-24"
            />
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="rounded-3xl shadow-xl border p-6">
          <h2 className="font-bold text-xl mb-4">Cost Breakdown</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Input label="Parts Cost" type="number" icon={<FiTool />}
              value={form.partsCost} onChange={(e) => setForm({ ...form, partsCost: e.target.value })} />

            <Input label="Parts GST (%)" type="number" icon={<FiPercent />}
              value={form.partsGst} onChange={(e) => setForm({ ...form, partsGst: e.target.value })} />

            <Input label="Labor Cost" type="number" icon={<FiUser />}
              value={form.laborCost} onChange={(e) => setForm({ ...form, laborCost: e.target.value })} />

            <Input label="Labor GST (%)" type="number" icon={<FiPercent />}
              value={form.laborGst} onChange={(e) => setForm({ ...form, laborGst: e.target.value })} />

            <Input label="Additional Taxes" type="number" icon={<FiTag />}
              value={form.taxes} onChange={(e) => setForm({ ...form, taxes: e.target.value })} />

            <Input label="Discounts" type="number" icon={<FiTag />}
              value={form.discounts} onChange={(e) => setForm({ ...form, discounts: e.target.value })} />
          </div>

          {/* Payment & status */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="font-semibold mb-2 flex items-center gap-2">
                <FiCreditCard /> Payment Mode
              </label>
              <select
                value={form.paymentMode}
                onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                className="w-full p-3 rounded-xl border"
              >
                <option value="">Select Payment Mode</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>
            </div>

            <div>
              <label className="font-semibold mb-2 flex items-center gap-2">
                <FiCheckCircle /> Payment Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full p-3 rounded-xl border"
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between mt-6 border-t pt-4">
            <p className="font-semibold text-lg">Grand Total:</p>
            <p className="font-bold text-green-600 text-2xl">₹ {form.total.toFixed(2)}</p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold"
          >
            <FiSave /> {isEditMode ? "Save Changes" : "Create Invoice"}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-white border px-8 py-4 rounded-xl"
          >
            <FiX /> Cancel
          </button>
        </div>

      </form>
    </div>
  );
}

function Input({ label, icon, type = "text", value, onChange, readOnly }) {
  return (
    <div>
      <label className="block font-semibold mb-2 flex items-center gap-2">
        {icon} {label}
      </label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={onChange}
        className="w-full rounded-xl border p-3"
      />
    </div>
  );
}