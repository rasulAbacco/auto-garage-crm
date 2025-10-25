import React from "react";
import { Wrench, Layers, Package, ShoppingCart } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import PublicLayout from "../../components/PublicLayout";

export default function BikeSpareParts() {
    const { isDark } = useTheme();

    return (
        <PublicLayout>
            <div className={`min-h-screen py-20 mt-[7%] ${isDark ? "bg-gray-950 text-gray-200" : "bg-gray-50 text-gray-900"}`}>
                <div className="max-w-6xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center justify-center gap-3 mb-8">
                        <div className={`p-4 rounded-2xl shadow-lg ${isDark ? "bg-indigo-900/30" : "bg-indigo-100"}`}>
                            <Wrench className="w-10 h-10 text-indigo-500" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">
                            Bike Spare Parts
                        </h1>
                    </div>

                    <p className="max-w-3xl mx-auto text-lg text-gray-500">
                        Browse and manage your bike spare parts inventory — from brakes and chains to full service kits.
                    </p>

                    <div className="grid md:grid-cols-3 gap-8 mt-16">
                        {[
                            { icon: Layers, title: "Quality Components", desc: "Genuine OEM and aftermarket parts." },
                            { icon: Package, title: "Inventory Management", desc: "Track part availability and stock levels." },
                            { icon: ShoppingCart, title: "Easy Procurement", desc: "Order and restock with one click." },
                        ].map((f, i) => (
                            <div key={i} className={`p-6 rounded-2xl shadow-lg ${isDark ? "bg-white/10" : "bg-white"} hover:scale-[1.03] transition-all`}>
                                <f.icon className="w-8 h-8 mb-4 text-indigo-500 mx-auto" />
                                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                                <p className="text-sm text-gray-500">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
