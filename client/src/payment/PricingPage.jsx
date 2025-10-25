// src/pages/PricingPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import {
  Check, X, Zap, Star, Shield,
  Crown, Award, ChevronRight,
  CreditCard, Smartphone, ArrowRight, CheckCircle,
  Gift, Timer, HeartHandshake, BadgeCheck
} from "lucide-react";

const plans = [
  {
    id: "basic",
    name: "Basic",
    tagline: "For small garages",
    price: "₹600",
    period: "per month",
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
    features: [
      "Upload RC images (up to 10/day)",
      "Basic OCR extraction",
      "Save history locally",
      "CSV/JSON export",
      "Email support",
    ],
    highlight: false,
    numericPrice: 600,
  },
  {
    id: "standard",
    name: "Standard",
    tagline: "Most popular",
    price: "₹1000",
    period: "per month",
    icon: Star,
    color: "from-purple-500 to-pink-500",
    features: [
      "Unlimited uploads",
      "High-accuracy OCR",
      "Priority support",
      "Export CSV, JSON, PDF",
      "API access (Limited)",
      "Team accounts (up to 3)",
    ],
    highlight: true,
    numericPrice: 1000,
    badge: "POPULAR",
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "For businesses",
    price: "₹1500",
    period: "per month",
    icon: Crown,
    color: "from-orange-500 to-red-500",
    features: [
      "Everything in Standard",
      "Team accounts (up to 10)",
      "Unlimited API access",
      "Custom integrations",
      "Bulk processing",
      "Dedicated manager",
    ],
    highlight: false,
    numericPrice: 1500,
    badge: "BEST VALUE",
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [showQR, setShowQR] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentStep, setPaymentStep] = useState(1);
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    upiId: "",
    name: "",
    companyName: "",
    phone: "",
    email: "",
  });
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setShowQR(true);
    setPaymentStep(1);
    setFormData({ upiId: "", name: "", companyName: "", phone: "", email: "" });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const upiRegex = /^[\w\.\-]+@[\w]+$/;

    if (!formData.name.trim()) newErrors.name = "Name required";
    if (!formData.companyName.trim()) newErrors.companyName = "Company required";
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone required";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Invalid phone";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email";
    }
    if (paymentMethod === 'upi' && !formData.upiId.trim()) {
      newErrors.upiId = "UPI ID required";
    } else if (paymentMethod === 'upi' && !upiRegex.test(formData.upiId)) {
      newErrors.upiId = "Invalid UPI ID";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToPayment = () => {
    if (validateForm()) {
      setPaymentStep(2);
      setTimeout(() => {
        setIsProcessing(true);
        setTimeout(() => setIsProcessing(false), 2000);
      }, 1000);
    }
  };

  const completePayment = () => {
    setShowSuccess(true);
    setTimeout(() => {
      localStorage.setItem("pricingDone", "true");
      localStorage.setItem("selectedPlan", selectedPlan.name);
      localStorage.setItem("userDetails", JSON.stringify(formData));
      setShowQR(false);
      navigate("/dashboard");
    }, 2000);
  };

  const yearlyDiscount = 0.2;

  return (
    <div className={`min-h-screen pt-16 pb-12 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      {/* Simplified Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-20 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      {/* Compact Hero */}
      <section className="relative z-10 px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100/50 border border-indigo-500/20 text-xs sm:text-sm">
            <Gift className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-900" />
            <span className="bg-gradient-to-r from-indigo-900 to-purple-700 bg-clip-text text-transparent font-medium">
              Save up to 25% on all plans
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            <span className="block">Simple Pricing</span>
            <span className="block bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent dark:text-[#7F27FF]">
              Choose Your Plan
            </span>
          </h1>

          <p className={`text-sm sm:text-base max-w-2xl mx-auto ${isDark ? 'text-white' : 'text-gray-600'}`}>
            All plans include 14-day money-back guarantee
          </p>

          {/* Compact Billing Toggle */}
          <div className="flex items-center justify-center gap-3 text-sm">
            <span className={billingPeriod === 'monthly' ? 'text-indigo-500 font-medium' : ''}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                billingPeriod === 'yearly'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                  : isDark ? 'bg-gray-700' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${
                billingPeriod === 'yearly' ? 'translate-x-7' : 'translate-x-0.5'
              }`}></div>
            </button>
            <span className={billingPeriod === 'yearly' ? 'text-indigo-500 font-medium' : ''}>
              Yearly
            </span>
            <span className="px-2 py-0.5 rounded-full bg-green-500 text-white text-xs font-semibold">
              -20%
            </span>
          </div>
        </div>
      </section>

      {/* Compact Pricing Cards */}
      <section className="relative z-10 px-4 sm:px-6 pb-12">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const finalPrice = billingPeriod === 'yearly'
              ? Math.round(plan.numericPrice * 12 * (1 - yearlyDiscount))
              : plan.numericPrice;

            return (
              <div
                key={plan.id}
                className={`relative ${plan.highlight ? 'sm:scale-105' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold shadow-lg">
                      {plan.badge}
                    </div>
                  </div>
                )}

                <div className={`h-full rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:scale-105 ${
                  plan.highlight
                    ? `bg-gradient-to-br ${plan.color} text-white shadow-xl`
                    : isDark
                      ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700 hover:border-indigo-500/50'
                      : 'bg-white border border-gray-200 hover:border-indigo-500/50 shadow-lg'
                }`}>
                  {/* Compact Icon */}
                  <div className={`inline-flex p-2 rounded-xl mb-4 ${
                    plan.highlight ? 'bg-white/20' : `bg-gradient-to-r ${plan.color} bg-opacity-10`
                  }`}>
                    <Icon className={`w-6 h-6 ${plan.highlight ? 'text-white' : 'text-indigo-500'}`} />
                  </div>

                  {/* Title */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    <p className={`text-xs ${plan.highlight ? 'text-white/90' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">₹{finalPrice}</span>
                    </div>
                    <p className={`text-xs ${plan.highlight ? 'text-white/80' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {billingPeriod === 'yearly' ? 'per year' : 'per month'}
                    </p>
                  </div>

                  {/* Compact Features */}
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          plan.highlight ? 'text-white' : 'text-green-500'
                        }`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handlePlanSelect(plan)}
                    className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      plan.highlight
                        ? 'bg-white text-indigo-600 hover:shadow-lg'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
                    }`}
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Compact Trust Section */}
      <section className={`relative z-10 px-4 sm:px-6 py-8 ${isDark ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-center">
          {[
            { icon: BadgeCheck, label: "30-Day Guarantee" },
            { icon: HeartHandshake, label: "24/7 Support" },
            { icon: Shield, label: "Secure Payment" },
            { icon: Timer, label: "Instant Setup" }
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="space-y-2">
                <Icon className="w-8 h-8 mx-auto text-indigo-500" />
                <p className={`text-xs sm:text-sm ${isDark ? 'text-white' : 'text-gray-600'}`}>
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Responsive Payment Modal */}
      {showQR && selectedPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn overflow-y-auto">
          <div className={`relative rounded-2xl mt-[45%] shadow-2xl p-4 sm:p-6 w-full max-w-md my-8 ${
            isDark ? 'bg-gray-800 border border-gray-800' : 'bg-white'
          }`}>
            {showSuccess ? (
              <div className="text-center space-y-4 py-4 ">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center animate-bounce">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold">Payment Successful!</h2>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Redirecting to dashboard...
                </p>
              </div>
            ) : paymentStep === 1 ? (
              <>
                {/* Step 1: User Details */}
                <div className="space-y-4 ">
                  <div className="text-center space-y-2">
                    <h2 className="text-xl sm:text-2xl font-bold">Complete Order</h2>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Subscribing to <span className="font-semibold text-indigo-500">{selectedPlan.name}</span>
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-xs">
                      <Award className="w-3 h-3 text-indigo-500" />
                      <span className="text-indigo-500 font-medium">
                        {billingPeriod === 'yearly' ? '20% Discount Applied' : 'Monthly Billing'}
                      </span>
                    </div>
                  </div>

                  {/* Compact Form */}
                  <div className="space-y-3 ">
                    {[
                      { key: 'name', label: 'Full Name', type: 'text', icon: '👤' },
                      { key: 'companyName', label: 'Company', type: 'text', icon: '🏢' },
                      { key: 'email', label: 'Email', type: 'email', icon: '📧' },
                      { key: 'phone', label: 'Phone', type: 'tel', icon: '📱' },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className={`block text-xs font-medium mb-1 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {field.label}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2">
                            {field.icon}
                          </span>
                          <input
                            type={field.type}
                            name={field.key}
                            value={formData[field.key]}
                            onChange={(e) => {
                              setFormData({ ...formData, [e.target.name]: e.target.value });
                              if (errors[field.key]) {
                                setErrors({ ...errors, [field.key]: '' });
                              }
                            }}
                            className={`w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border transition-all ${
                              errors[field.key]
                                ? 'border-red-400 focus:border-red-500'
                                : isDark
                                  ? 'bg-gray-700 border-gray-600 focus:border-indigo-500'
                                  : 'bg-gray-50 border-gray-300 focus:border-indigo-500'
                            } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                            placeholder={field.label}
                          />
                          {errors[field.key] && (
                            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                              <X className="w-3 h-3" />
                              {errors[field.key]}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Payment Method */}
                    <div className="space-y-2">
                      <label className={`block text-xs font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Payment Method
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'upi', icon: Smartphone, label: 'UPI' },
                          { value: 'card', icon: CreditCard, label: 'Card' }
                        ].map((method) => {
                          const MethodIcon = method.icon;
                          return (
                            <button
                              key={method.value}
                              type="button"
                              onClick={() => setPaymentMethod(method.value)}
                              className={`p-2.5 rounded-lg border-2 transition-all ${
                                paymentMethod === method.value
                                  ? 'border-indigo-500 bg-indigo-500/10'
                                  : isDark
                                    ? 'border-gray-600 hover:border-gray-500'
                                    : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <MethodIcon className="w-5 h-5 mx-auto mb-1" />
                              <span className="text-xs">{method.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* UPI ID */}
                    {paymentMethod === 'upi' && (
                      <div>
                        <label className={`block text-xs font-medium mb-1 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          UPI ID
                        </label>
                        <input
                          type="text"
                          name="upiId"
                          value={formData.upiId}
                          onChange={(e) => {
                            setFormData({ ...formData, upiId: e.target.value });
                            if (errors.upiId) {
                              setErrors({ ...errors, upiId: '' });
                            }
                          }}
                          placeholder="yourname@upi"
                          className={`w-full px-3 py-2.5 text-sm rounded-lg border transition-all ${
                            errors.upiId
                              ? 'border-red-400'
                              : isDark
                                ? 'bg-gray-700 border-gray-600 focus:border-indigo-500'
                                : 'bg-gray-50 border-gray-300 focus:border-indigo-500'
                          } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                        />
                        {errors.upiId && (
                          <p className="text-red-400 text-xs mt-1">{errors.upiId}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowQR(false)}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                        isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleProceedToPayment}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span>Continue</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Step 2: Payment */}
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <h2 className="text-xl sm:text-2xl font-bold">Complete Payment</h2>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Scan to pay for {selectedPlan.name}
                    </p>
                    <div className="text-2xl sm:text-3xl font-bold text-indigo-500">
                      ₹{billingPeriod === 'yearly'
                        ? Math.round(selectedPlan.numericPrice * 12 * 0.8)
                        : selectedPlan.numericPrice}
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center gap-4">
                    {isProcessing ? (
                      <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm">Processing...</p>
                      </div>
                    ) : (
                      <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl bg-white p-3">
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-sm">QR Code</span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => window.open("upi://pay", "_blank")}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Open UPI App</span>
                    </button>

                    <p className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Or send to UPI ID: <span className="font-mono font-semibold">motordesk@upi</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setPaymentStep(1)}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                        isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Back
                    </button>
                    <button
                      onClick={completePayment}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Completed</span>
                    </button>
                  </div>

                  {/* Security */}
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2">
                    <Shield className="w-3 h-3" />
                    <span>256-bit encryption</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Compact FAQ */}
      <section className="relative z-10 px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Questions?</h2>
          <p className={`text-sm mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Our support team is here to help
          </p>
          <button
            onClick={() => navigate('/contact')}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:shadow-lg transition-all"
          >
            Contact Support
          </button>
        </div>
      </section>
    </div>
  );
}