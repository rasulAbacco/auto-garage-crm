import React, { useState } from 'react';
import { useTheme } from "../contexts/ThemeContext";
import { Hero, PricingCard, TrustSection, StatsSection, TestimonialSection, FAQSection } from "./PricingComponents";
import PaymentModal from "./PaymentModal";
import { Zap, Star, Crown, ArrowRight, MessageCircle } from 'lucide-react';

export default function ModernPricingPage() {
  const { isDark } = useTheme();
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
        'CSV/EXCEL, PDF export',
        'Email support'
      ]
    },
    {
      id: 'standard',
      name: 'Standard',
      tagline: 'Most popular choice',
      numericPrice: 1500,
      icon: Star,
      badge: 'POPULAR',
      features: [
        'Unlimited uploads',
        'High-accuracy OCR',
        'Priority support',
        'Export CSV, PDF',
        'SMS/WhatsApp Alerts',
        'Team accounts (up to 3)',
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      tagline: 'For growing businesses',
      numericPrice: 2500,
      icon: Crown,
      badge: 'BEST VALUE',
      features: [
        'Everything in Standard',
        'Team accounts (up to 10)',
        'Maintenance Alert SMS',
        'Bulk processing',
        'Dedicated manager',
        'Auto Invoice',
        'Staff Salary Managements',
        'Online Payment Options'
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
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 mt-[5%] ${isDark
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
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
        <div className={`max-w-4xl mx-auto text-center rounded-3xl p-8 sm:p-12 ${isDark
          ? 'bg-gradient-to-br from-violet-900/50 to-fuchsia-900/50 backdrop-blur-xl border border-violet-700'
          : 'bg-gradient-to-br from-violet-100 to-fuchsia-100 border border-violet-200'
          }`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className={`text-base sm:text-lg mb-8 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Join thousands of satisfied customers today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handlePlanSelect(plans[1])}
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className={`px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${isDark
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