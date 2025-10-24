import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Basic",
    price: "₹600",
    period: "per month",
    features: [
      "Upload RC images (up to 10 per day)",
      "Basic OCR extraction",
      "Save history locally",
      "CSV/JSON export",
    ],
    button: "Pay Now",
    highlight: false,
    numericPrice: 600, // Fixed to match displayed price
  },
  {
    name: "Standard",
    price: "₹1000",
    period: "per month",
    features: [
      "Unlimited uploads",
      "High-accuracy OCR",
      "Advanced preprocessing",
      "Priority support",
      "Save & manage history",
      "Export in CSV, JSON, PDF",
    ],
    button: "Pay Now",
    highlight: true,
    numericPrice: 1000, // Fixed to match displayed price
  },
  {
    name: "Premium",
    price: "₹1500",
    period: "per month",
    features: [
      "Everything in Standard",
      "Team accounts (up to 5 users)",
      "API access",
      "Custom integrations",
      "Bulk processing",
    ],
    button: "Pay Now",
    highlight: false,
    numericPrice: 1500, // Fixed to match displayed price
  },
];

const PricingPage = () => {
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentStep, setPaymentStep] = useState(1); // 1: form, 2: payment options
  
  // Form state
  const [formData, setFormData] = useState({
    upiId: '',
    name: '',
    companyName: '',
    phone: '',
    email: ''
  });
  
  const [errors, setErrors] = useState({});

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setShowQR(true);
    setPaymentStep(1);
    // Reset form when selecting a new plan
    setFormData({
      upiId: '',
      name: '',
      companyName: '',
      phone: '',
      email: ''
    });
    setErrors({});
  };

  const generateUpiLink = (plan) => {
    const upiId = "merchant@upi"; // Replace with your actual UPI ID
    const payeeName = "Your Company Name"; // Replace with your company name
    const transactionNote = `Payment for ${plan.name} Plan`;
    
    // Create UPI payment URL
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${plan.numericPrice}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    
    return upiUrl;
  };

  const openUpiApp = (plan) => {
    const upiLink = generateUpiLink(plan);
    window.open(upiLink, '_blank');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.upiId.trim()) {
      newErrors.upiId = 'UPI ID is required';
    } else if (!formData.upiId.includes('@')) {
      newErrors.upiId = 'Enter a valid UPI ID (e.g., user@upi)';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToPayment = () => {
    if (validateForm()) {
      setPaymentStep(2);
    }
  };

  const completePayment = () => {
    // Mark pricing as done
    localStorage.setItem("pricingDone", "true");
    localStorage.setItem("selectedPlan", selectedPlan.name);
    localStorage.setItem("userDetails", JSON.stringify(formData));
    
    // Close QR modal
    setShowQR(false);
    
    // Navigate to dashboard
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-12 flex flex-col items-center">
      <div className="max-w-6xl w-full text-center mb-8 md:mb-12">
        <h1 className="text-2xl md:text-5xl font-bold text-indigo-800 mb-2 md:mb-4">
          Choose Your Plan
        </h1>
        <p className="text-gray-600 text-base md:text-xl">
          Flexible pricing for individuals and businesses. Upgrade anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className={`rounded-2xl shadow-lg p-4 md:p-6 flex flex-col items-center border transform transition-transform duration-300 ${
              plan.highlight
                ? "bg-indigo-600 text-white border-indigo-700 scale-105"
                : "bg-white border-gray-200 hover:scale-105"
            }`}
          >
            <h2
              className={`text-xl md:text-2xl font-semibold mb-3 md:mb-4 ${
                plan.highlight ? "text-white" : "text-gray-800"
              }`}
            >
              {plan.name}
            </h2>
            <p className="text-3xl md:text-4xl font-bold mb-2">
              {plan.price}
              <span className="text-xs md:text-sm font-medium ml-1">{plan.period}</span>
            </p>
            <ul className="text-xs md:text-sm space-y-2 md:space-y-3 mb-4 md:mb-6 text-left w-full px-2 md:px-4">
              {plan.features.map((feature, i) => (
                <li
                  key={i}
                  className={`flex items-start ${
                    plan.highlight ? "text-indigo-100" : "text-gray-700"
                  }`}
                >
                  <svg
                    className={`w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0 ${
                      plan.highlight ? "text-white" : "text-indigo-600"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handlePlanSelect(plan)}
              className={`px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium transition-colors w-full focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                plan.highlight
                  ? "bg-white text-indigo-600 hover:bg-gray-100 focus:ring-white"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-600"
              }`}
            >
              {plan.button}
            </button>
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      {showQR && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 md:p-6 max-w-md w-full max-h-[70vh] overflow-y-auto">
            {paymentStep === 1 ? (
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-center mb-3 md:mb-4">Enter Your Details</h2>
                <p className="text-gray-600 text-sm md:text-base text-center mb-4 md:mb-6">
                  Please fill in all required fields to proceed with payment for the {selectedPlan.name} plan.
                </p>
                
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      UPI ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="upiId"
                      value={formData.upiId}
                      onChange={handleInputChange}
                      placeholder="your@upi"
                      className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.upiId ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'
                      }`}
                    />
                    {errors.upiId && <p className="text-red-500 text-xs mt-1">{errors.upiId}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'
                      }`}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="Your Company"
                      className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.companyName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'
                      }`}
                    />
                    {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="9876543210"
                      className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.phone ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'
                      }`}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'
                      }`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row justify-between mt-6 space-y-2 md:space-y-0 md:space-x-2">
                  <button
                    onClick={() => setShowQR(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 w-full md:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProceedToPayment}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors w-full md:w-auto"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl md:text-xl font-bold text-center mb-3 md:mb-4">Complete Your Payment</h2>
                
                <div className="text-center mb-4 md:mb-6">
                  <p className="text-lg md:text-xl font-semibold mb-1 md:mb-2">{selectedPlan.name} Plan</p>
                  <p className="text-2xl md:text-3xl font-bold text-indigo-600">{selectedPlan.price}</p>
                </div>
                
                <div className="bg-indigo-50 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
                  <h3 className="font-medium text-indigo-800 mb-2 text-sm md:text-base">Payment Details</h3>
                  <div className="text-xs md:text-sm text-gray-700 space-y-1">
                    <p><span className="font-medium">Name:</span> {formData.name}</p>
                    <p><span className="font-medium">Company:</span> {formData.companyName}</p>
                    <p><span className="font-medium">Email:</span> {formData.email}</p>
                    <p><span className="font-medium">Phone:</span> {formData.phone}</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-center mb-4 md:mb-6">
                  <div className="bg-gray-100 p-3 md:p-4 rounded-lg mb-3 md:mb-4">
                    {/* QR Code Placeholder */}
                    <div className="w-32 h-32 md:w-48 md:h-48 bg-white flex items-center justify-center border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
                        </svg>
                        <p className="text-gray-500 mt-1 md:mt-2 text-xs">QR Code</p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-xs md:text-sm text-center mb-3 md:mb-4">
                    Scan this QR code with any UPI app to complete your payment
                  </p>
                  
                  <button
                    onClick={() => openUpiApp(selectedPlan)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg mb-3 md:mb-4 hover:bg-indigo-700 transition-colors w-full max-w-xs"
                  >
                    Open UPI App
                  </button>
                </div>
                
                <div className="flex flex-col md:flex-row justify-between space-y-2 md:space-y-0 md:space-x-2">
                  <button
                    onClick={() => setPaymentStep(1)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 w-full md:w-auto"
                  >
                    Back
                  </button>
                  <button
                    onClick={completePayment}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors w-full md:w-auto"
                  >
                    I've Paid
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="mt-6 md:mt-8 text-center text-gray-600 text-xs md:text-sm">
        <p>All plans include secure payment processing via UPI</p>
        <p className="mt-1">After payment, you'll be redirected to your dashboard</p>
      </div>
    </div>
  );
};

export default PricingPage;