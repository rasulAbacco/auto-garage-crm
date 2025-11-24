import React from "react";
import {
    Bike, Gauge, Users, Settings, Star,
    Wrench, Hammer, Zap, Circle, Truck,
    Calendar, Shield, Clock, Droplet
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import PublicLayout from "../../components/PublicLayout";
import Footer from "../../components/Footer";

export default function BikeGarage() {
    const { isDark } = useTheme();

    // Software features
    const features = [
        { icon: Gauge, title: "Speed Optimization", desc: "Track and manage service time efficiently." },
        { icon: Users, title: "Customer Management", desc: "Easily handle repeat clients and appointments." },
        { icon: Settings, title: "Maintenance Tools", desc: "Access detailed job and part configurations." },
        { icon: Star, title: "Feedback System", desc: "Collect and track customer satisfaction ratings." },
    ];

    // Bike service categories
    const mainServices = [
        {
            icon: Calendar,
            title: "Periodic Maintenance",
            desc: "Essential maintenance services to keep your bike running smoothly and safely.",
            items: ["Engine Oil & Filter", "Air Filter", "Brake Fluid", "Battery Check"]
        },
        {
            icon: Wrench,
            title: "Engine & Performance",
            desc: "Expert engine services to optimize power, efficiency and reliability.",
            items: ["Engine Repair", "Clutch Overhaul", "Spark Plug", "Fuel System"]
        },
        {
            icon: Hammer,
            title: "Brake & Suspension",
            desc: "Critical safety systems maintenance for confident riding.",
            items: ["Brake System", "Suspension Check", "Brake Pad", "Clutch Adjustment"]
        },
        {
            icon: Zap,
            title: "Electrical & Diagnostics",
            desc: "Advanced diagnostics and electrical repairs for all bike systems.",
            items: ["Battery Replacement", "Lights & Electrical", "Wiring Harness", "Sensor Diagnosis"]
        }
    ];

    // Specialized bike services
    const specializedServices = [
        {
            icon: Circle,
            title: "Tyre & Wheel Services",
            desc: "Complete tyre care for safety, performance and longevity.",
            features: ["Tyre Replacement", "Puncture Repair", "Wheel Balancing", "Nitrogen Filling"]
        },
        {
            icon: Shield,
            title: "Safety Inspections",
            desc: "Thorough inspections to ensure your bike meets safety standards.",
            features: ["General Health Check", "Road Test", "Brake Inspection", "Emission Check"]
        },
        {
            icon: Droplet,
            title: "Cooling & Fluid Systems",
            desc: "Maintain optimal operating temperatures and fluid levels.",
            features: ["Coolant Check", "Brake Fluid", "Oil Top-Up", "Fluid Replacement"]
        },
        {
            icon: Settings,
            title: "Performance Upgrades",
            desc: "Enhance your bike's performance with professional modifications.",
            features: ["Air Filter Upgrade", "Exhaust Tuning", "ECU Remapping", "Performance Parts"]
        },
        {
            icon: Truck,
            title: "Emergency Services",
            desc: "Reliable assistance when you need it most.",
            features: ["Breakdown Towing", "Roadside Repair", "Pick-Up Service", "Emergency Delivery"]
        }
    ];

    return (
        <PublicLayout>
            <div className={`min-h-screen py-20 transition-all duration-500 mt-[7%] ${isDark ? "bg-gray-950 text-gray-200" : "bg-gray-50 text-gray-900"}`}>
                <div className="max-w-6xl mx-auto px-6 text-center">
                    {/* Hero Section */}
                    <div className="inline-flex items-center justify-center gap-3 mb-8">
                        <div className={`p-4 rounded-2xl shadow-lg ${isDark ? "bg-indigo-900/30" : "bg-indigo-100"}`}>
                            <Bike className="w-10 h-10 text-indigo-500" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">
                            Bike Garage Solutions
                        </h1>
                    </div>

                    <p className="max-w-3xl mx-auto text-lg text-gray-500">
                        Simplify your two-wheeler garage operations — manage service jobs, customers, and inventory effortlessly.
                    </p>

                    {/* Software Features */}
                    <div className="mt-16">
                        <h2 className={`text-3xl font-bold mb-8 ${isDark ? "text-white" : "text-gray-900"}`}>Software Features</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {features.map((f, i) => (
                                <div key={i}
                                    className={`p-6 rounded-2xl shadow-lg transition-all hover:scale-[1.03] ${isDark ? "bg-white/10" : "bg-white"}`}>
                                    <f.icon className="w-8 h-8 mb-4 text-indigo-500 mx-auto" />
                                    <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                                    <p className="text-sm text-gray-500">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Bike Services */}
                    <div className="mt-20">
                        <h2 className={`text-3xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>Our Bike Services</h2>
                        <p className={`text-lg max-w-3xl mx-auto mb-8 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            Comprehensive maintenance and repair services tailored for all types of two-wheelers.
                        </p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {mainServices.map((service, i) => (
                                <div key={i}
                                    className={`p-6 rounded-2xl shadow-lg transition-all hover:scale-[1.03] ${isDark ? "bg-white/10" : "bg-white"}`}>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`p-3 rounded-xl ${isDark ? "bg-indigo-900/30" : "bg-indigo-100"}`}>
                                            <service.icon className="w-6 h-6 text-indigo-500" />
                                        </div>
                                        <h3 className="text-xl font-semibold">{service.title}</h3>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-4">{service.desc}</p>
                                    <div className="space-y-2">
                                        {service.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center text-sm">
                                                <div className={`w-2 h-2 rounded-full mr-2 ${isDark ? "bg-indigo-400" : "bg-indigo-500"}`}></div>
                                                <span>{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Specialized Bike Services */}
                    <div className="mt-20">
                        <h2 className={`text-3xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>Specialized Bike Services</h2>
                        <p className={`text-lg max-w-3xl mx-auto mb-8 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            Expert services for specific bike components and emergency situations.
                        </p>
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
                        <h2 className="text-3xl font-bold mb-4">Ready to transform your bike garage?</h2>
                        <p className={`text-lg max-w-2xl mx-auto mb-6 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                            Join hundreds of bike garages that have streamlined their operations with our management platform.
                        </p>
                        <button className={`px-6 py-3 rounded-full font-semibold transition-all ${isDark ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}>
                            Get Started Today
                        </button>
                    </div>
                </div>
            </div>
            <Footer/>
        </PublicLayout>
    );
}