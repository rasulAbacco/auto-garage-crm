import React from "react";
import { Car, Shield, Wrench, Users, Clock } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import PublicLayout from "../../components/PublicLayout";

export default function CarGarage() {
    const { isDark } = useTheme();

    return (
        <PublicLayout>
            <div className={`min-h-screen py-20 transition-colors duration-500 mt-[7%] ${isDark ? "bg-gray-950 text-gray-200" : "bg-gray-50 text-gray-900"
                }`}>
                <div className="max-w-6xl mx-auto px-6 text-center">
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

                    {/* Features */}
                    <div className="grid md:grid-cols-3 gap-8 mt-16">
                        {[
                            { icon: Shield, title: "Service Records", desc: "Track and manage vehicle history securely." },
                            { icon: Users, title: "Customer Profiles", desc: "Keep customer info and preferences in one dashboard." },
                            { icon: Wrench, title: "Job Management", desc: "Assign and monitor tasks to your mechanics easily." },
                            { icon: Clock, title: "Quick Turnaround", desc: "Improve workshop efficiency with real-time updates." },
                        ].map((f, i) => (
                            <div key={i}
                                className={`p-6 rounded-2xl shadow-lg transition-all hover:scale-[1.03] ${isDark ? "bg-white/10" : "bg-white"}`}>
                                <f.icon className="w-8 h-8 mb-4 text-indigo-500 mx-auto" />
                                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                                <p className="text-sm text-gray-500">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
