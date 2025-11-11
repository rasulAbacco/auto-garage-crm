import React from "react";
import {
    Droplets, Calendar, Users, Gauge,
    Sparkles, Shield, Clock, Car, Bike,
    Zap, Star, Truck, CheckCircle
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import PublicLayout from "../../components/PublicLayout";

export default function WashingCenter() {
    const { isDark } = useTheme();

    // Software features
    const features = [
        { icon: Calendar, title: "Booking Scheduler", desc: "Automate customer wash appointments easily." },
        { icon: Gauge, title: "Real-time Queue", desc: "Monitor washing bay availability and status." },
        { icon: Users, title: "Customer Database", desc: "Maintain loyalty programs and reward points." },
    ];

    // Washing service categories with enhanced details
    const washingServices = [
        {
            icon: Droplets,
            title: "Exterior Washing",
            desc: "Comprehensive exterior cleaning services for all vehicle types.",
            items: ["Foam Wash", "Pre-Wash Rinse", "Wheel Cleaning", "Underbody Wash"],
            duration: "30-45 min",
            popular: true
        },
        {
            icon: Sparkles,
            title: "Interior Cleaning",
            desc: "Deep interior cleaning to restore freshness and hygiene.",
            items: ["Vacuum Cleaning", "Dashboard Polish", "Seat Shampoo", "Carpet Cleaning"],
            duration: "45-60 min",
            popular: true
        },
        {
            icon: Shield,
            title: "Protective Coatings",
            desc: "Advanced protection treatments to preserve your vehicle's finish.",
            items: ["Wax Coating", "Sealant Application", "Ceramic Coating", "Paint Protection Film"],
            duration: "60-90 min",
            popular: false
        },
        {
            icon: Car,
            title: "Detailing Packages",
            desc: "Complete detailing solutions for showroom-like appearance.",
            items: ["Basic Detail", "Premium Detail", "Showroom Detail", "Seasonal Protection"],
            duration: "90-120 min",
            popular: false
        }
    ];

    // Specialized washing services
    const specializedServices = [
        {
            icon: Bike,
            title: "Bike Washing",
            desc: "Specialized two-wheeler cleaning services.",
            features: ["Bike Foam Wash", "Chain Cleaning", "Engine Detailing", "Wheel Polish"]
        },
        {
            icon: Zap,
            title: "Express Services",
            desc: "Quick cleaning solutions for busy customers.",
            features: ["15-Minute Wash", "Exterior Quick Clean", "Interior Refresh", "Express Detail"]
        },
        {
            icon: Star,
            title: "Premium Treatments",
            desc: "Luxury services for discerning customers.",
            features: ["Ceramic Coating", "Paint Correction", "Leather Conditioning", "Headlight Restoration"]
        },
        {
            icon: Truck,
            title: "Commercial Fleet",
            desc: "Bulk washing solutions for commercial vehicles.",
            features: ["Fleet Washing", "Company Car Programs", "Regular Maintenance", "Discounted Packages"]
        },
        {
            icon: Clock,
            title: "Membership Plans",
            desc: "Subscription-based washing services for regular customers.",
            features: ["Monthly Washes", "Unlimited Washes", "Priority Booking", "Member Discounts"]
        }
    ];

    return (
        <PublicLayout>
            <div className={`min-h-screen py-20 transition-all duration-500 mt-[7%] ${isDark ? "bg-gray-950 text-gray-200" : "bg-gray-50 text-gray-900"}`}>
                <div className="max-w-6xl mx-auto px-6 text-center">
                    {/* Hero Section */}
                    <div className="inline-flex items-center justify-center gap-3 mb-8">
                        <div className={`p-4 rounded-2xl shadow-lg ${isDark ? "bg-indigo-900/30" : "bg-indigo-100"}`}>
                            <Droplets className="w-10 h-10 text-indigo-500" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            Washing Center CRM
                        </h1>
                    </div>

                    <p className="max-w-3xl mx-auto text-lg text-gray-500">
                        Manage bookings, customer queues, and billing in your car or bike washing center with our intuitive CRM solution.
                    </p>

                    {/* Software Features */}
                    <div className="mt-16">
                        <h2 className={`text-3xl font-bold mb-8 ${isDark ? "text-white" : "text-gray-900"}`}>Software Features</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {features.map((f, i) => (
                                <div key={i}
                                    className={`p-6 rounded-2xl shadow-lg hover:scale-[1.03] transition-all ${isDark ? "bg-white/10" : "bg-white"}`}>
                                    <f.icon className="w-8 h-8 mb-4 text-indigo-500 mx-auto" />
                                    <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                                    <p className="text-sm text-gray-500">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Redesigned Washing Services Section */}
                    <div className="mt-20">
                        <div className="flex flex-col items-center mb-12">
                            <h2 className={`text-3xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>Our Washing Services</h2>
                            <div className={`w-24 h-1 rounded-full ${isDark ? "bg-indigo-500" : "bg-indigo-400"} mb-4`}></div>
                            <p className={`text-lg max-w-3xl mx-auto ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                Professional washing and detailing services for all vehicle types.
                            </p>
                        </div>

                        {/* Service Cards with Enhanced Design */}
                        <div className="grid md:grid-cols-2 gap-10">
                            {washingServices.map((service, i) => (
                                <div
                                    key={i}
                                    className={`group relative overflow-hidden rounded-2xl shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${isDark ? "bg-gradient-to-br from-gray-800 to-gray-900" : "bg-gradient-to-br from-white to-gray-50"}`}
                                >
                                    {/* Service Header */}
                                    <div className={`p-6 pb-4 ${isDark ? "bg-gray-800/50" : "bg-gray-100/50"}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 rounded-xl ${isDark ? "bg-indigo-900/30" : "bg-indigo-100"}`}>
                                                <service.icon className="w-8 h-8 text-indigo-500" />
                                            </div>
                                            {service.popular && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isDark ? "bg-amber-900/50 text-amber-300" : "bg-amber-100 text-amber-700"}`}>
                                                    Popular
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">{service.title}</h3>
                                        <p className="text-gray-500">{service.desc}</p>
                                    </div>

                                    {/* Service Details */}
                                    <div className="p-6 pt-4">
                                        <div className="flex items-center mb-4">
                                            <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                                            <span className="text-sm text-gray-500">Duration: {service.duration}</span>
                                        </div>

                                        <div className="space-y-3 mb-6">
                                            {service.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center">
                                                    <CheckCircle className="w-4 h-4 mr-3 text-green-500" />
                                                    <span className="text-gray-600">{item}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <button className={`w-full py-3 rounded-xl font-medium transition-all ${isDark ? "bg-indigo-700 hover:bg-indigo-600" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}>
                                            Book This Service
                                        </button>
                                    </div>

                                    {/* Decorative Element */}
                                    <div className={`absolute bottom-0 right-0 w-32 h-32 rounded-tl-full opacity-10 ${isDark ? "bg-indigo-500" : "bg-indigo-400"} -z-10`}></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Specialized Washing Services */}
                    <div className="mt-20">
                        <div className="flex flex-col items-center mb-12">
                            <h2 className={`text-3xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>Specialized Services</h2>
                            <div className={`w-24 h-1 rounded-full ${isDark ? "bg-purple-500" : "bg-purple-400"} mb-4`}></div>
                            <p className={`text-lg max-w-3xl mx-auto ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                Tailored washing solutions for specific needs and customer preferences.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {specializedServices.map((service, i) => (
                                <div key={i}
                                    className={`p-6 rounded-2xl shadow-lg transition-all hover:scale-[1.03] ${isDark ? "bg-white/10" : "bg-white"}`}>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`p-3 rounded-xl ${isDark ? "bg-purple-900/30" : "bg-purple-100"}`}>
                                            <service.icon className="w-6 h-6 text-purple-500" />
                                        </div>
                                        <h3 className="text-xl font-semibold">{service.title}</h3>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-4">{service.desc}</p>
                                    <div className="space-y-2">
                                        {service.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-center text-sm">
                                                <div className={`w-2 h-2 rounded-full mr-2 ${isDark ? "bg-purple-400" : "bg-purple-500"}`}></div>
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Call to Action */}
                    <div className={`mt-20 p-8 rounded-3xl ${isDark ? "bg-gradient-to-r from-indigo-900/30 to-purple-900/30" : "bg-gradient-to-r from-indigo-50 to-purple-50"}`}>
                        <h2 className="text-3xl font-bold mb-4">Ready to streamline your washing center?</h2>
                        <p className={`text-lg max-w-2xl mx-auto mb-6 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                            Join hundreds of washing centers that have transformed their operations with our management platform.
                        </p>
                        <button className={`px-6 py-3 rounded-full font-semibold transition-all ${isDark ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}>
                            Get Started Today
                        </button>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}