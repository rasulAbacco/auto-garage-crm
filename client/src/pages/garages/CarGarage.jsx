import React from "react";
import {
    Car, Shield, Wrench, Users, Clock,
    Calendar, Hammer, AlertTriangle, Sparkles, Circle,
    Droplet, Zap, Settings, Gauge, Truck,
    ClipboardList, FileText, Package, MessageSquare, BarChart, Smartphone
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import PublicLayout from "../../components/PublicLayout";
import Footer from "../../components/Footer";

export default function CarGarage() {
    const { isDark } = useTheme();

    // Software features
    const features = [
        { icon: Users, title: "Customer & Vehicle Management", desc: "Store complete customer records, track vehicle history, view past jobs, and instantly access service recommendations." },
        { icon: ClipboardList, title: "Job Cards & Workflow Tracking", desc: "Create job cards in seconds, assign technicians, track progress in real time, and ensure every job stays on schedule." },
        { icon: FileText, title: "Estimates & Invoices", desc: "Send professional estimates and invoices with one click, auto-calculate taxes, and accept online payments." },
        { icon: Package, title: "Parts & Inventory", desc: "Monitor stock levels, set low-inventory alerts, and track part usage across all jobs." },
        { icon: MessageSquare, title: "SMS & Email Reminders", desc: "Reduce missed appointments with automated service reminders, follow-ups, and marketing campaigns." },
        { icon: BarChart, title: "Reports & Analytics", desc: "View revenue trends, technician productivity, job profitability, and customer insights." },
        { icon: Smartphone, title: "Mobile App Access", desc: "Technicians can update job status, upload photos, and add notes directly from their phones." }
    ];

    // Garage service categories
    const services = [
        {
            icon: Calendar,
            title: "Periodic Maintenance",
            desc: "Comprehensive maintenance services including oil changes, filter replacements, and fluid checks.",
            items: ["Engine Oil & Filter", "Air Filter", "Brake Fluid", "Battery Check"]
        },
        {
            icon: Hammer,
            title: "Running Repairs",
            desc: "Expert repairs for all mechanical and electrical issues to get you back on the road.",
            items: ["Engine Repair", "Brake System", "Clutch Overhaul", "Electrical Repairs"]
        },
        {
            icon: AlertTriangle,
            title: "Accidental Repair",
            desc: "Professional bodywork and collision repair services to restore your vehicle's appearance.",
            items: ["Dent & Paint Work", "Panel Replacement", "Chassis Alignment", "Windshield Replacement"]
        },
        {
            icon: Sparkles,
            title: "Detailing & Care",
            desc: "Premium cleaning and appearance enhancement services to make your vehicle shine.",
            items: ["Exterior Foam Wash", "Interior Cleaning", "Polishing & Waxing", "Ceramic Coating"]
        },
        {
            icon: Circle,
            title: "Tyre & Wheel",
            desc: "Complete tyre and wheel services for safety, performance, and longevity.",
            items: ["Tyre Replacement", "Puncture Repair", "Wheel Alignment", "Nitrogen Filling"]
        }
    ];

    // Additional service sections
    const additionalServices = [
        {
            icon: Droplet,
            title: "AC & Cooling System",
            desc: "Keep your vehicle cool with our AC repair and cooling system maintenance services.",
            features: ["AC Gas Refill", "Compressor Repair", "Radiator Replacement", "Cooling Coil Service"]
        },
        {
            icon: Zap,
            title: "Electrical & Diagnostics",
            desc: "Advanced diagnostics and electrical repairs for all modern vehicle systems.",
            features: ["OBD-II Scanning", "Battery Replacement", "Sensor Replacement", "Wiring Repair"]
        },
        {
            icon: Settings,
            title: "Custom Modifications",
            desc: "Personalize your vehicle with our professional customization and upgrade services.",
            features: ["Alloy Wheels", "Music System", "Headlight Upgrades", "Performance Tuning"]
        },
        {
            icon: Gauge,
            title: "Inspection Services",
            desc: "Thorough vehicle inspections for safety, compliance, and peace of mind.",
            features: ["Pre-Purchase Inspection", "Roadworthy Certificate", "Emission Check", "PDI"]
        },
        {
            icon: Truck,
            title: "Towing & Recovery",
            desc: "Reliable towing and vehicle transport services whenever you need assistance.",
            features: ["Breakdown Towing", "Vehicle Pickup", "Emergency Recovery", "Long Distance Transport"]
        }
    ];

    return (
        <PublicLayout>
            <div className={`min-h-screen py-20 transition-colors duration-500 mt-[7%] ${isDark ? "bg-gray-950 text-gray-200" : "bg-gray-50 text-gray-900"}`}>
                <div className="max-w-6xl mx-auto px-6 text-center">
                    {/* Hero Section */}
                    <div className="inline-flex items-center justify-center gap-3 mb-8">
                        <div className={`p-4 rounded-2xl shadow-lg ${isDark ? "bg-indigo-900/30" : "bg-indigo-100"}`}>
                            <Car className="w-10 h-10 text-indigo-500" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            Car Garage Management
                        </h1>
                    </div>

                    <p className={`text-lg max-w-3xl mx-auto ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        Streamline your car garage operations with MotorDesk. Manage customers, jobs, billing, and reports all in one place — built for modern automotive businesses.
                    </p>

                    {/* Software Features */}
                    <div className="mt-16">
                        <h2 className={`text-3xl font-bold mb-8 ${isDark ? "text-white" : "text-gray-900"}`}>Software Features</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {features.map((f, i) => (
                                <div key={i}
                                    className={`p-6 rounded-2xl shadow-lg transition-all hover:scale-[1.03] ${isDark ? "bg-white/10" : "bg-white"}`}>
                                    <f.icon className="w-8 h-8 mb-4 text-indigo-500 mx-auto" />
                                    <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                                    <p className="text-sm text-gray-500">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Service Categories */}
                    <div className="mt-20">
                        <h2 className={`text-3xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>Our Garage Services</h2>
                        <p className={`text-lg max-w-3xl mx-auto mb-8 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            We offer a comprehensive range of automotive services to keep your vehicle in top condition.
                        </p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {services.map((service, i) => (
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

                    {/* Additional Service Sections */}
                    <div className="mt-20">
                        <h2 className={`text-3xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>Specialized Services</h2>
                        <p className={`text-lg max-w-3xl mx-auto mb-8 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            Our specialized services cover every aspect of vehicle maintenance and repair.
                        </p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {additionalServices.map((service, i) => (
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
                        <h2 className="text-3xl font-bold mb-4">Ready to streamline your garage operations?</h2>
                        <p className={`text-lg max-w-2xl mx-auto mb-6 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                            Join hundreds of garages that have transformed their business with our management platform.
                        </p>
                        <button className={`px-6 py-3 rounded-full font-semibold transition-all ${isDark ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}>
                            Get Started Today
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
        </PublicLayout>
    );
}