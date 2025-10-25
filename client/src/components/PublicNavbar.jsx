// src/components/PublicNavbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon, Sparkles, Home, DollarSign, LogIn, Car } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

export default function PublicNavbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDark, toggleTheme } = useTheme();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { path: '/', label: 'Home', icon: Home },
        { path: '/pricing', label: 'Pricing', icon: DollarSign },
    ];

    return (
        <header className={`w-full fixed top-0 left-0 z-50 transition-all duration-300 ${scrolled
                ? isDark
                    ? 'bg-gray-900 shadow-lg shadow-indigo-500/10'
                    : 'bg-white shadow-lg'
                : 'bg-transparent'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/50 group-hover:shadow-xl group-hover:shadow-indigo-500/60 transition-all duration-300">
                                <Car className="w-6 h-6 text-white" />
                            </div>
                            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Motor <span className="text-indigo-500">Desk</span>
                            </span>
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Garage Management
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${isActive
                                            ? isDark
                                                ? 'bg-gray-800 text-white'
                                                : 'bg-gray-900 text-white'
                                            : isDark
                                                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon size={18} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}

                        <div className={`w-px h-8 mx-2 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2.5 rounded-lg transition-all ${isDark
                                    ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {/* CTA Button */}
                        <button
                            onClick={() => navigate("/login")}
                            className="ml-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                        >
                            <LogIn size={18} />
                            <span>Get Started</span>
                        </button>
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-3">
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-lg ${isDark
                                    ? 'bg-gray-800 text-yellow-400'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button
                            className={`p-2 rounded-lg ${isDark ? 'text-white bg-gray-800' : 'text-gray-900 bg-gray-100'
                                }`}
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            {menuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown Menu */}
                <div className={`md:hidden overflow-hidden transition-all duration-500 ${menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                    <div className={`mt-2 mb-4 rounded-2xl p-4 space-y-2 ${isDark
                            ? 'bg-gray-800 border border-gray-700'
                            : 'bg-white border border-gray-200 shadow-lg'
                        }`}>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isDark
                                            ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                        <button
                            onClick={() => {
                                setMenuOpen(false);
                                navigate("/login");
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold flex items-center justify-center gap-2"
                        >
                            <LogIn size={20} />
                            <span>Get Started</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}