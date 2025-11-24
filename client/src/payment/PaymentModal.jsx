import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Award, ChevronRight, CheckCircle, Lock } from "lucide-react";

const PaymentModal = ({
  show,
  plan,
  billingPeriod,
  isDark,
  onClose,
  onComplete,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentResponse, setPaymentResponse] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const navigate = useNavigate();

  // Load Razorpay script when component mounts
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
  }, []);

  // Handle navigation when payment is successful
  useEffect(() => {
    if (showSuccess && paymentResponse) {
      const timer = setTimeout(() => {
        // First call onComplete to let parent know payment is complete
        onComplete(plan, formData);

        // Create a clean, serializable version of the plan object
        const cleanPlan = {
          name: plan.name,
          numericPrice: plan.numericPrice,
        };

        // Then navigate to register page with only serializable data
        navigate("/car-register", {
          state: {
            paymentData: {
              plan: cleanPlan,
              billingPeriod,
              finalPrice:
                billingPeriod === "yearly"
                  ? Math.round(plan.numericPrice * 12 * 0.9)
                  : plan.numericPrice,
              formData,
              paymentId: paymentResponse.razorpay_payment_id,
            },
          },
        });

        setIsProcessing(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [
    showSuccess,
    paymentResponse,
    plan,
    formData,
    billingPeriod,
    navigate,
    onComplete,
  ]);

  if (!show || !plan) return null;

  const finalPrice =
    billingPeriod === "yearly"
      ? Math.round(plan.numericPrice * 12 * 0.9)
      : plan.numericPrice;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Required";
    if (!formData.companyName.trim()) newErrors.companyName = "Required";
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      newErrors.email = "Invalid email";
    if (!formData.phone.match(/^[0-9]{10}$/)) newErrors.phone = "Invalid phone";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    const API = import.meta.env.VITE_API_BASE_URL;

    try {
      // 1️⃣ Create Order
      const orderRes = await fetch(`${API}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalPrice }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) {
        alert("Failed to create order");
        setIsProcessing(false);
        return;
      }

      // 2️⃣ Save Form Data BEFORE payment
      await fetch(`${API}/api/payments/save-form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.name,
          companyName: formData.companyName,
          email: formData.email,
          phone: formData.phone,
          plan: plan.name,
          billingPeriod,
          amount: finalPrice,
          orderId: orderData.order.id,
        }),
      });

      const options = {
        key: "rzp_test_ReqQSmLnQ60S7l",
        order_id: orderData.order.id,
        amount: finalPrice * 100,
        currency: "INR",
        name: "Abacco Technology",
        description: `${plan.name} Plan Subscription`,

        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },

        notes: {
          companyName: formData.companyName,
          plan: plan.name,
          billingPeriod,
        },

        // ⭐ CRITICAL FIX - Await the verify call
        handler: async function (response) {
          console.log("🔥 Payment Success:", response);

          try {
            // ⭐ CALL VERIFY API AND WAIT FOR RESPONSE
            const verifyRes = await fetch(`${API}/api/payments/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyData.success) {
              throw new Error("Payment verification failed");
            }

            console.log("✅ Payment verified successfully:", verifyData);

            // Show success animation only after verification
            setPaymentResponse(response);
            setShowSuccess(true);
          } catch (error) {
            console.error("❌ Verification error:", error);
            alert("Payment verification failed. Please contact support.");
            setIsProcessing(false);
          }
        },

        modal: {
          ondismiss: function () {
            console.log("Payment modal closed");
            setIsProcessing(false);
          },
        },

        theme: { color: isDark ? "#8B5CF6" : "#7C3AED" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment initialization error:", error);
      alert("Failed to initialize payment");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div
        className={`relative rounded-3xl shadow-2xl p-4 sm:p-6 w-full max-w-[70%] ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white"
          }`}
      >
        {showSuccess ? (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center animate-bounce">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
              <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                Redirecting to registration...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10">
                <Award className="w-8 h-8 text-violet-500" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">
                Complete Your Order
              </h2>
              <p
                className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"
                  }`}
              >
                Subscribe to{" "}
                <span className="font-semibold text-violet-500">
                  {plan.name}
                </span>{" "}
                plan
              </p>
            </div>

            {/* Form Fields - 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "name", label: "Full Name", type: "text", icon: "👤" },
                {
                  key: "companyName",
                  label: "Company Name",
                  type: "text",
                  icon: "🏢",
                },
                {
                  key: "email",
                  label: "Email Address",
                  type: "email",
                  icon: "📧",
                },
                {
                  key: "phone",
                  label: "Phone Number",
                  type: "tel",
                  icon: "📱",
                },
              ].map((field) => (
                <div key={field.key}>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                  >
                    {field.label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                      {field.icon}
                    </span>
                    <input
                      type={field.type}
                      value={formData[field.key]}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          [field.key]: e.target.value,
                        });
                        setErrors({ ...errors, [field.key]: "" });
                      }}
                      className={`w-full pl-10 pr-3 py-2.5 rounded-lg border-2 transition-all ${errors[field.key]
                          ? "border-red-500 focus:border-red-500"
                          : isDark
                            ? "bg-gray-700/50 border-gray-600 focus:border-violet-500"
                            : "bg-gray-50 border-gray-200 focus:border-violet-500"
                        } focus:outline-none text-sm`}
                      placeholder={field.label}
                    />
                    {errors[field.key] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[field.key]}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Summary */}
            <div
              className={`p-4 rounded-xl ${isDark ? "bg-gray-700/50" : "bg-gray-50"
                }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                  Plan
                </span>
                <span className="font-medium">{plan.name}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                  Billing
                </span>
                <span className="font-medium">
                  {billingPeriod === "yearly" ? "Yearly" : "Monthly"}
                </span>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-600/30">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-violet-500">
                  ₹{finalPrice}
                </span>
              </div>
            </div>

            {/* Razorpay Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Secure Payment</p>
                <p className="text-xs">Powered by Razorpay</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={onClose}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${isDark
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-gray-100 hover:bg-gray-200"
                  } text-sm`}
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Pay ₹{finalPrice}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2">
              <Lock className="w-3 h-3" />
              <span>Secured by 256-bit encryption</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;