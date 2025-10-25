// src/components/PublicNavbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon, Sparkles, Home, DollarSign, LogIn, ChevronRight } from "lucide-react";
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
        <header className={`w-full fixed top-0 left-0 z-50 transition-all duration-500 ${
            scrolled 
                ? isDark 
                    ? 'bg-gray-900/95 backdrop-blur-2xl shadow-2xl shadow-purple-500/10' 
                    : 'bg-white/90 backdrop-blur-2xl shadow-xl'
                : isDark
                    ? 'bg-transparent'
                    : 'bg-transparent'
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo with animation */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity"></div>
                            <img
                                src="/Motor desk.png"
                                alt="Motor Desk"
                                className="relative w-12 h-12 rounded-xl ring-2 ring-white/20 group-hover:scale-110 transition-transform duration-300"
                            />
                            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-2xl font-bold tracking-tight ${
                                isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                                Motor <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Desk</span>
                            </span>
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Garage Management System
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
                                    className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 ${
                                        isActive
                                            ? isDark 
                                                ? 'bg-white/10 text-white' 
                                                : 'bg-gray-900/10 text-gray-900'
                                            : isDark
                                                ? 'text-gray-300 hover:text-white hover:bg-white/5'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                >
                                    <Icon size={18} />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}

                        <div className="w-px h-8 bg-gray-300/30 mx-2"></div>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={`p-2.5 rounded-xl transition-all duration-300 ${
                                isDark 
                                    ? 'bg-white/10 text-yellow-400 hover:bg-white/20' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {/* CTA Button */}
                        <button
                            onClick={() => navigate("/login")}
                            className="group ml-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
                        >
                            <LogIn size={18} />
                            <span>Get Started</span>
                            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-3">
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-lg ${
                                isDark 
                                    ? 'bg-white/10 text-yellow-400' 
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button
                            className={`p-2 rounded-lg ${
                                isDark ? 'text-white bg-white/10' : 'text-gray-900 bg-gray-100'
                            }`}
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            {menuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown Menu */}
                <div className={`md:hidden overflow-hidden transition-all duration-500 ${
                    menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                    <div className={`mt-2 rounded-2xl p-4 space-y-2 ${
                        isDark 
                            ? 'bg-gray-800/95 backdrop-blur-xl border border-white/10' 
                            : 'bg-white/95 backdrop-blur-xl border border-gray-200'
                    }`}>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                        isDark 
                                            ? 'text-gray-300 hover:bg-white/10 hover:text-white' 
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