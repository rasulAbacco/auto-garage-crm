// src/components/PublicNavbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    Sun, Moon, Sparkles, Home, LogIn, Car, Phone,
    Building2, Wrench, Store, ChevronDown, IndianRupee
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export default function PublicNavbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDark, toggleTheme } = useTheme();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownTimeout = useRef(null);
    const dropdownRef = useRef(null);

    // Dropdown hover open delay
    const handleMouseEnter = () => {
        clearTimeout(dropdownTimeout.current);
        setDropdownOpen(true);
    };

    const handleMouseLeave = () => {
        dropdownTimeout.current = setTimeout(() => setDropdownOpen(false), 2500); // 2.5s delay
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            clearTimeout(dropdownTimeout.current);
        };
    }, []);

    const navItems = [
        { path: "/", label: "Home", icon: Home },
        { path: "/car-garage", label: "Car Garage", icon: Car },
        { path: "/bike-garage", label: "Bike Garage", icon: Wrench },
        { path: "/washing-center", label: "Washing Center CRM", icon: Building2 },
        { path: "/pricing", label: "Pricing", icon: IndianRupee },
    ];

    return (
        <header className="w-full fixed top-0 left-0 z-50 ">
            {/* ---------- Top Section ---------- */}
            <div
                className={`w-full py-3 transition-all duration-300 ${isDark ? "bg-gray-950" : "bg-white shadow-md"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/60 transition-all">
                                <Car className="w-6 h-6 text-white" />
                            </div>
                            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <span
                                className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"
                                    }`}
                            >
                                Motor <span className="text-indigo-500">Desk</span>
                            </span>
                            <span
                                className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"
                                    }`}
                            >
                                Garage Management
                            </span>
                        </div>
                    </Link>

                    {/* Right Side Buttons */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className={`p-2.5 rounded-lg transition-all ${isDark
                                    ? "bg-gray-800 text-yellow-400 hover:bg-gray-700"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <Link
                            to="/contactus"
                            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${isDark
                                    ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                                    : "text-gray-700 hover:bg-gray-100"
                                }`}
                        >
                            <Phone size={18} />
                            <span>Contact Us</span>
                        </Link>

                        <button
                            onClick={() => navigate("/login")}
                            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                        >
                            <LogIn size={18} />
                            <span>Get Started</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ---------- Sticky Bottom Section ---------- */}
            <div
                className={`sticky top-0 w-full transition-all duration-300 ${isDark ? "bg-gray-900/95 backdrop-blur-lg" : "bg-white/90 backdrop-blur-lg shadow-md"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between space-x-5 py-3">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${isActive
                                        ? isDark
                                            ? "bg-gray-800 text-white"
                                            : "bg-gray-900 text-white"
                                        : isDark
                                            ? "text-gray-300 hover:text-white hover:bg-gray-800/80"
                                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                    }`}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}

                    {/* Spare Parts Dropdown */}
                    <div
                        className="relative"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        ref={dropdownRef}
                    >
                        <button
                            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${isDark
                                    ? "text-gray-300 hover:text-white hover:bg-gray-800/80"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                }`}
                        >
                            <Store size={18} />
                            <span>Spare Parts Shops</span>
                            <ChevronDown
                                size={16}
                                className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""
                                    }`}
                            />
                        </button>

                        {dropdownOpen && (
                            <div
                                className={`absolute left-0 mt-2 w-56 rounded-xl border shadow-lg z-50 ${isDark
                                        ? "bg-gray-900 border-gray-700"
                                        : "bg-white border-gray-200"
                                    }`}
                            >
                                <Link
                                    to="/spare-parts/bike"
                                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${isDark
                                            ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                                            : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                >
                                    <Wrench size={18} />
                                    <span>Bike Spare Parts</span>
                                </Link>
                                <Link
                                    to="/spare-parts/car"
                                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${isDark
                                            ? "text-gray-300 hover:bg-gray-800 hover:text-white"
                                            : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                >
                                    <Car size={18} />
                                    <span>Car Spare Parts</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
