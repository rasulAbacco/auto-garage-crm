import React, { useState } from 'react';
import {
  Check, X, Zap, Star, Crown, ChevronRight, CreditCard,
  Smartphone, ArrowRight, CheckCircle, Gift, Timer,
  HeartHandshake, BadgeCheck, Shield, Award, Sparkles,
  Users, Rocket, TrendingUp, Lock, MessageCircle
} from 'lucide-react';

// Theme Hook
import { useTheme } from "../contexts/ThemeContext";

// Hero Section Component
const Hero = ({ isDark, billingPeriod, setBillingPeriod }) => (
  <section className="relative z-10 px-4 sm:px-6 py-12 sm:py-20">
    <div className="max-w-7xl mx-auto text-center space-y-6">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 backdrop-blur-sm">
        <Sparkles className="w-4 h-4 text-violet-400" />
        <span className={`text-sm font-medium ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
          Limited time offer - Save up to 25%
        </span>
      </div>

      {/* Main Heading */}
      <div className="space-y-4">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
          <span className={`block mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Pricing that scales
          </span>
          <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            with your business
          </span>
        </h1>

        <p className={`text-lg sm:text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Start free, upgrade when you need to. No hidden fees, no surprises.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <span className={`text-sm font-medium transition-colors ${billingPeriod === 'monthly'
            ? isDark ? 'text-white' : 'text-gray-900'
            : isDark ? 'text-gray-500' : 'text-gray-500'
          }`}>
          Monthly
        </span>

        <button
          onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
          className={`relative w-16 h-8 rounded-full transition-all duration-300 ${billingPeriod === 'yearly'
              ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25'
              : isDark ? 'bg-gray-700' : 'bg-gray-300'
            }`}
        >
          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${billingPeriod === 'yearly' ? 'translate-x-9' : 'translate-x-1'
            }`} />
        </button>

        <span className={`text-sm font-medium transition-colors ${billingPeriod === 'yearly'
            ? isDark ? 'text-white' : 'text-gray-900'
            : isDark ? 'text-gray-500' : 'text-gray-500'
          }`}>
          Yearly
        </span>

        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold shadow-lg">
          Save 20%
        </span>
      </div>
    </div>
  </section>
);

// Pricing Card Component
const PricingCard = ({ plan, billingPeriod, isDark, onSelect, isPopular }) => {
  const Icon = plan.icon;
  const yearlyDiscount = 0.2;
  const finalPrice = billingPeriod === 'yearly'
    ? Math.round(plan.numericPrice * 12 * (1 - yearlyDiscount))
    : plan.numericPrice;
  const monthlyEquivalent = billingPeriod === 'yearly'
    ? Math.round(finalPrice / 12)
    : plan.numericPrice;

  return (
    <div className={`relative ${isPopular ? 'lg:scale-105 lg:-mt-4' : ''}`}>
      {/* Popular Badge */}
      {plan.badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-bold shadow-lg shadow-violet-500/25 flex items-center gap-1.5">
            <Star className="w-3 h-3 fill-current" />
            {plan.badge}
          </div>
        </div>
      )}

      <div className={`h-full rounded-3xl p-8 transition-all duration-300 hover:scale-[1.02] ${isPopular
          ? `bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-2xl shadow-violet-500/25 border-2 border-violet-400/50`
          : isDark
            ? 'bg-gray-800/50 backdrop-blur-xl border-2 border-gray-700/50 hover:border-violet-500/50'
            : 'bg-white border-2 border-gray-200 hover:border-violet-500/50 shadow-xl'
        }`}>
        {/* Icon */}
        <div className={`inline-flex p-3 rounded-2xl mb-6 ${isPopular
            ? 'bg-white/20 backdrop-blur-sm'
            : 'bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10'
          }`}>
          <Icon className={`w-7 h-7 ${isPopular ? 'text-white' : 'text-violet-500'}`} />
        </div>

        {/* Plan Name */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
          <p className={`text-sm ${isPopular ? 'text-white/80' : isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
            {plan.tagline}
          </p>
        </div>

        {/* Price */}
        <div className="mb-8">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-5xl font-bold">₹{monthlyEquivalent}</span>
            <span className={`text-lg ${isPopular ? 'text-white/70' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              /mo
            </span>
          </div>
          {billingPeriod === 'yearly' && (
            <p className={`text-sm ${isPopular ? 'text-white/70' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              ₹{finalPrice} billed annually
            </p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-4 mb-8">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${isPopular ? 'bg-white/20' : 'bg-green-500/10'
                }`}>
                <Check className={`w-3 h-3 ${isPopular ? 'text-white' : 'text-green-500'}`} />
              </div>
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <button
          onClick={() => onSelect(plan)}
          className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${isPopular
              ? 'bg-white text-violet-600 hover:bg-gray-50 shadow-lg'
              : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-violet-500/25'
            }`}
        >
          <span>Get Started</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// Trust Section Component
const TrustSection = ({ isDark }) => {
  const features = [
    { icon: Shield, label: 'Bank-level Security', desc: 'Your data is safe' },
    { icon: HeartHandshake, label: '24/7 Support', desc: 'Always here to help' },
    { icon: BadgeCheck, label: '30-Day Guarantee', desc: 'Risk-free trial' },
    { icon: Timer, label: 'Instant Setup', desc: 'Start in minutes' }
  ];

  return (
    <section className={`relative z-10 px-4 sm:px-6 py-16 ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'
      }`}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="text-center space-y-3">
                <div className={`inline-flex p-4 rounded-2xl ${isDark ? 'bg-violet-500/10' : 'bg-violet-50'
                  }`}>
                  <Icon className="w-8 h-8 text-violet-500" />
                </div>
                <div>
                  <p className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {item.label}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// Payment Modal Component
const PaymentModal = ({
  show,
  plan,
  billingPeriod,
  isDark,
  onClose,
  onComplete
}) => {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '', companyName: '', email: '', phone: '', upiId: ''
  });
  const [errors, setErrors] = useState({});

  if (!show || !plan) return null;

  const finalPrice = billingPeriod === 'yearly'
    ? Math.round(plan.numericPrice * 12 * 0.8)
    : plan.numericPrice;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Required';
    if (!formData.companyName.trim()) newErrors.companyName = 'Required';
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Invalid email';
    if (!formData.phone.match(/^[0-9]{10}$/)) newErrors.phone = 'Invalid phone';
    if (paymentMethod === 'upi' && !formData.upiId.match(/^[\w\.\-]+@[\w]+$/)) {
      newErrors.upiId = 'Invalid UPI ID';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      setStep(2);
      setTimeout(() => setIsProcessing(true), 500);
      setTimeout(() => setIsProcessing(false), 2500);
    }
  };

  const handleComplete = () => {
    setShowSuccess(true);
    setTimeout(() => onComplete(plan, formData), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className={`relative rounded-3xl shadow-2xl p-8 w-full max-w-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
        }`}>
        {showSuccess ? (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center animate-bounce">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Redirecting to your dashboard...
              </p>
            </div>
          </div>
        ) : step === 1 ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10">
                <Award className="w-8 h-8 text-violet-500" />
              </div>
              <h2 className="text-2xl font-bold">Complete Your Order</h2>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Subscribe to <span className="font-semibold text-violet-500">{plan.name}</span> plan
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {[
                { key: 'name', label: 'Full Name', type: 'text', icon: '👤' },
                { key: 'companyName', label: 'Company Name', type: 'text', icon: '🏢' },
                { key: 'email', label: 'Email Address', type: 'email', icon: '📧' },
                { key: 'phone', label: 'Phone Number', type: 'tel', icon: '📱' }
              ].map((field) => (
                <div key={field.key}>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    {field.label}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                      {field.icon}
                    </span>
                    <input
                      type={field.type}
                      value={formData[field.key]}
                      onChange={(e) => {
                        setFormData({ ...formData, [field.key]: e.target.value });
                        setErrors({ ...errors, [field.key]: '' });
                      }}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all ${errors[field.key]
                          ? 'border-red-500 focus:border-red-500'
                          : isDark
                            ? 'bg-gray-700/50 border-gray-600 focus:border-violet-500'
                            : 'bg-gray-50 border-gray-200 focus:border-violet-500'
                        } focus:outline-none`}
                      placeholder={field.label}
                    />
                    {errors[field.key] && (
                      <p className="text-red-500 text-xs mt-1">{errors[field.key]}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Payment Method */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'upi', icon: Smartphone, label: 'UPI Payment' },
                    { value: 'card', icon: CreditCard, label: 'Credit Card' }
                  ].map((method) => {
                    const MethodIcon = method.icon;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setPaymentMethod(method.value)}
                        className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === method.value
                            ? 'border-violet-500 bg-violet-500/10'
                            : isDark
                              ? 'border-gray-600 hover:border-gray-500'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <MethodIcon className="w-6 h-6 mx-auto mb-2" />
                        <span className="text-sm font-medium">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {paymentMethod === 'upi' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    UPI ID
                  </label>
                  <input
                    type="text"
                    value={formData.upiId}
                    onChange={(e) => {
                      setFormData({ ...formData, upiId: e.target.value });
                      setErrors({ ...errors, upiId: '' });
                    }}
                    placeholder="yourname@upi"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${errors.upiId
                        ? 'border-red-500'
                        : isDark
                          ? 'bg-gray-700/50 border-gray-600 focus:border-violet-500'
                          : 'bg-gray-50 border-gray-200 focus:border-violet-500'
                      } focus:outline-none`}
                  />
                  {errors.upiId && (
                    <p className="text-red-500 text-xs mt-1">{errors.upiId}</p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Payment Step */}
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold">Complete Payment</h2>
              <div className="text-4xl font-bold text-violet-500">₹{finalPrice}</div>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Scan QR code or use UPI app
              </p>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-4">
              {isProcessing ? (
                <div className="w-64 h-64 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-medium">Processing payment...</p>
                </div>
              ) : (
                <div className="w-64 h-64 rounded-2xl bg-white p-4 shadow-xl">
                  <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
                    <span className="text-gray-400">QR Code</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => window.open('upi://pay', '_blank')}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="w-5 h-5" />
                Open UPI App
              </button>

              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                UPI ID: <span className="font-mono font-semibold">motordesk@upi</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                I've Paid
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

// Stats Component
const StatsSection = ({ isDark }) => {
  const stats = [
    { value: '50K+', label: 'Active Users', icon: Users },
    { value: '99.9%', label: 'Uptime', icon: Rocket },
    { value: '4.9/5', label: 'User Rating', icon: Star },
    { value: '24/7', label: 'Support', icon: HeartHandshake }
  ];

  return (
    <section className="relative z-10 px-4 sm:px-6 py-12">
      <div className="max-w-7xl mx-auto">
        <div className={`rounded-3xl p-8 sm:p-12 ${isDark
            ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700'
            : 'bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100'
          }`}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center space-y-2">
                  <Icon className="w-8 h-8 mx-auto text-violet-500 mb-3" />
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

// Testimonial Component
const TestimonialSection = ({ isDark }) => {
  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Garage Owner',
      image: '👨‍💼',
      text: 'This platform has transformed our workflow. OCR accuracy is impressive!'
    },
    {
      name: 'Priya Sharma',
      role: 'Fleet Manager',
      image: '👩‍💼',
      text: 'Best investment for our business. Support team is incredibly responsive.'
    },
    {
      name: 'Amit Patel',
      role: 'Auto Service',
      image: '👨‍🔧',
      text: 'The API integration saved us countless hours. Highly recommended!'
    }
  ];

  return (
    <section className="relative z-10 px-4 sm:px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Trusted by <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              thousands
            </span>
          </h2>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            See what our customers have to say
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`p-6 rounded-2xl transition-all hover:scale-105 ${isDark
                  ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700'
                  : 'bg-white border border-gray-200 shadow-lg'
                }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">{testimonial.image}</div>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {testimonial.role}
                  </p>
                </div>
              </div>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                "{testimonial.text}"
              </p>
              <div className="flex gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// FAQ Component
const FAQSection = ({ isDark }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'Can I change my plan later?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept UPI, credit cards, debit cards, and net banking for your convenience.'
    },
    {
      question: 'Is there a free trial available?',
      answer: 'All plans come with a 14-day money-back guarantee. Try risk-free!'
    },
    {
      question: 'How does the API access work?',
      answer: 'API access is included in Standard and Premium plans. Full documentation provided upon signup.'
    }
  ];

  return (
    <section className="relative z-10 px-4 sm:px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`rounded-2xl overflow-hidden transition-all ${isDark
                  ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700'
                  : 'bg-white border border-gray-200 shadow-lg'
                }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-violet-500/5 transition-colors"
              >
                <span className="font-semibold">{faq.question}</span>
                <ChevronRight
                  className={`w-5 h-5 transition-transform ${openIndex === index ? 'rotate-90' : ''
                    }`}
                />
              </button>
              {openIndex === index && (
                <div className={`px-6 pb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Main Component
export default function ModernPricingPage() {
  const { isDark, toggleTheme } = useTheme();
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      tagline: 'For small garages',
      numericPrice: 600,
      icon: Zap,
      features: [
        'Upload RC images (up to 10/day)',
        'Basic OCR extraction',
        'Save history locally',
        'CSV/JSON export',
        'Email support'
      ]
    },
    {
      id: 'standard',
      name: 'Standard',
      tagline: 'Most popular choice',
      numericPrice: 1000,
      icon: Star,
      badge: 'POPULAR',
      features: [
        'Unlimited uploads',
        'High-accuracy OCR',
        'Priority support',
        'Export CSV, JSON, PDF',
        'API access (Limited)',
        'Team accounts (up to 3)'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      tagline: 'For growing businesses',
      numericPrice: 1500,
      icon: Crown,
      badge: 'BEST VALUE',
      features: [
        'Everything in Standard',
        'Team accounts (up to 10)',
        'Unlimited API access',
        'Custom integrations',
        'Bulk processing',
        'Dedicated manager'
      ]
    }
  ];

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const handlePaymentComplete = (plan, formData) => {
    console.log('Payment completed for', plan.name, formData);
    setShowModal(false);
    // Navigate to dashboard or show success
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark
        ? 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white'
        : 'bg-gradient-to-b from-white via-gray-50 to-white text-gray-900'
      }`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000" />
      </div>

     
      {/* Hero Section */}
      <Hero
        isDark={isDark}
        billingPeriod={billingPeriod}
        setBillingPeriod={setBillingPeriod}
      />

      {/* Pricing Cards */}
      <section className="relative z-10 px-4 sm:px-6 pb-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billingPeriod={billingPeriod}
              isDark={isDark}
              onSelect={handlePlanSelect}
              isPopular={plan.badge === 'POPULAR'}
            />
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection isDark={isDark} />

      {/* Trust Section */}
      <TrustSection isDark={isDark} />

      {/* Testimonials */}
      <TestimonialSection isDark={isDark} />

      {/* FAQ Section */}
      <FAQSection isDark={isDark} />

      {/* CTA Section */}
      <section className="relative z-10 px-4 sm:px-6 py-20">
        <div className={`max-w-4xl mx-auto text-center rounded-3xl p-12 ${isDark
            ? 'bg-gradient-to-br from-violet-900/50 to-fuchsia-900/50 backdrop-blur-xl border border-violet-700'
            : 'bg-gradient-to-br from-violet-100 to-fuchsia-100 border border-violet-200'
          }`}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className={`text-lg mb-8 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Join thousands of satisfied customers today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handlePlanSelect(plans[1])}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className={`px-8 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${isDark
                ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                : 'bg-white hover:bg-gray-50 border border-gray-300'
              }`}>
              <MessageCircle className="w-5 h-5" />
              Talk to Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative z-10 px-4 sm:px-6 py-8 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'
        }`}>
        <div className="max-w-7xl mx-auto text-center">
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            © 2025 MotorDesk. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Payment Modal */}
      <PaymentModal
        show={showModal}
        plan={selectedPlan}
        billingPeriod={billingPeriod}
        isDark={isDark}
        onClose={() => setShowModal(false)}
        onComplete={handlePaymentComplete}
      />
    </div>
  );
}