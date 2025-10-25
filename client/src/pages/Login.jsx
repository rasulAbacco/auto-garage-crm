import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
    Car, User, Lock, Eye, EyeOff, ArrowRight,
    Sparkles, Shield, Zap, ChevronRight,
    Mail, Phone, Globe, AlertCircle,
    KeyRound, Fingerprint, Loader2, Star, TrendingUp,
    Award, Users, Clock
} from "lucide-react";

import PublicLayout from "../components/PublicLayout";
import { useTheme } from "../contexts/ThemeContext";

const API_URL = import.meta.env.VITE_API_BASE_URL;
export default function Login() {

    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });
    const navigate = useNavigate();

    const { isDark } = useTheme();
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [focusedInput, setFocusedInput] = useState("");
    const [loginMethod, setLoginMethod] = useState("credentials");
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            setIsLoading(false);

            if (response.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                alert(`Welcome ${data.user.username}!`);
                navigate("/dashboard"); // 🚀 navigate instead of reload
            } else {
                setError(data.message || "Invalid credentials");
            }
        } catch (err) {
            setIsLoading(false);
            setError("Server error. Please try again later.");
        }
    };

    const socialLogins = [
        { name: "Google", gradient: "from-red-500 to-yellow-500" },
        { name: "GitHub", gradient: "from-gray-700 to-gray-900" },
        { name: "Apple", gradient: "from-gray-600 to-black" }
    ];

    const features = [
        { icon: Shield, text: "Enterprise Security", color: "blue" },
        { icon: Zap, text: "Lightning Fast", color: "purple" },
        { icon: Globe, text: "Global Access", color: "blue" },
        { icon: Award, text: "Industry Leading", color: "purple" }
    ];

    const stats = [
        { icon: Users, value: "50K+", label: "Active Users" },
        { icon: Star, value: "4.9", label: "Rating" },
        { icon: Clock, value: "99.9%", label: "Uptime" },
        { icon: TrendingUp, value: "2x", label: "Growth" }
    ];

    return (
        <PublicLayout>
            <div className={` mt-[8%] pt-[5%] min-h-screen relative overflow-hidden transition-all duration-700 ${isDark
                ? 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950'
                : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
                }`}>

                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Gradient Orbs */}
                    <div className={`absolute top-1/4 -left-48 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse ${isDark ? 'bg-indigo-600' : 'bg-indigo-400'
                        }`} style={{ animationDuration: '8s' }}></div>
                    <div className={`absolute bottom-1/4 -right-48 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse ${isDark ? 'bg-purple-600' : 'bg-purple-400'
                        }`} style={{ animationDuration: '10s', animationDelay: '1s' }}></div>
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse ${isDark ? 'bg-pink-600' : 'bg-pink-400'
                        }`} style={{ animationDuration: '12s', animationDelay: '2s' }}></div>

                    {/* Floating Particles */}
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className={`absolute w-1 h-1 rounded-full ${isDark ? 'bg-white' : 'bg-indigo-500'}`}
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                opacity: Math.random() * 0.5,
                                animation: `float ${5 + Math.random() * 10}s infinite ease-in-out`,
                                animationDelay: `${Math.random() * 5}s`
                            }}
                        ></div>
                    ))}

                    {/* Grid Pattern */}
                    <div className={`absolute inset-0 ${isDark ? 'opacity-10' : 'opacity-5'}`}
                        style={{
                            backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(99,102,241,0.15)'} 1px, transparent 0)`,
                            backgroundSize: '40px 40px'
                        }}
                    ></div>
                </div>

                {/* Mouse Follow Gradient */}
                <div
                    className="fixed inset-0 pointer-events-none transition-opacity duration-300 z-0"
                    style={{
                        background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, 
                    ${isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)'}, 
                    transparent 50%)`
                    }}
                />

                {/* Main Content */}
                <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
                    <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

                        {/* Left Side - Hero Section */}
                        <div className="hidden lg:block space-y-8">
                            {/* Logo & Brand */}
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-4 group cursor-pointer">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-all duration-300"></div>
                                        <div className={`relative p-4 rounded-2xl backdrop-blur-xl border ${isDark
                                            ? 'bg-white/10 border-white/20'
                                            : 'bg-white/80 border-white/40'
                                            } shadow-2xl transform group-hover:scale-110 transition-all duration-300`}>
                                            <Car className={`w-10 h-10 ${isDark ? 'text-white' : 'text-[#5247e6]'}`} strokeWidth={2.5} />
                                        </div>
                                    </div>
                                    <div>
                                        <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            Motor<span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Desk</span>
                                        </h1>
                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            Next-Gen Garage Management
                                        </p>
                                    </div>
                                </div>

                                {/* Hero Text */}
                                <div className="space-y-4">
                                    <h2 className={`text-5xl font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'
                                        }`}>
                                        Transform Your
                                        <span className="block mt-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                                            Garage Operations
                                        </span>
                                    </h2>
                                    <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        Experience the future of automotive management with our cutting-edge platform designed for modern garages.
                                    </p>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    {stats.map((stat, index) => {
                                        const Icon = stat.icon;
                                        return (
                                            <div
                                                key={index}
                                                className={`group p-6 rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:scale-105 cursor-pointer ${isDark
                                                    ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                                    : 'bg-white/60 border-white/60 hover:bg-white/80'
                                                    }`}
                                            >
                                                <Icon className={`w-6 h-6 mb-3 ${isDark ? 'text-indigo-400' : 'text-indigo-600'
                                                    } group-hover:scale-110 transition-transform`} />
                                                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                                                    {stat.value}
                                                </div>
                                                <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>
                                                    {stat.label}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Features List */}
                                <div className="space-y-3">
                                    {features.map((feature, index) => {
                                        const Icon = feature.icon;
                                        return (
                                            <div
                                                key={index}
                                                className={`flex items-center gap-4 p-4 rounded-xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 cursor-pointer ${isDark
                                                    ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                                    : 'bg-white/40 border-white/60 hover:bg-white/70'
                                                    }`}
                                            >
                                                <div className={`p-2 rounded-lg bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600`}>
                                                    <Icon className="w-5 h-5 text-white" />
                                                </div>
                                                <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'
                                                    }`}>
                                                    {feature.text}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Login Card */}
                        <div className="w-full max-w-md mx-auto lg:mx-0">
                            <div className={`relative rounded-3xl backdrop-blur-2xl border shadow-2xl transition-all duration-500 ${isDark
                                ? 'bg-white/10 border-white/20'
                                : 'bg-white/80 border-white/40'
                                }`}>
                                {/* Decorative Top Element */}
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-2xl opacity-60 animate-pulse"></div>
                                        <div className={`relative w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-xl border-4 shadow-2xl ${isDark
                                            ? 'bg-slate-300 border-white/20'
                                            : 'bg-white border-white/60'
                                            }`}>
                                            <Fingerprint className={`w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text`} strokeWidth={2.5} />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 sm:p-10 mt-8 space-y-8">
                                    {/* Header */}
                                    <div className="text-center space-y-2">
                                        <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'
                                            }`}>
                                            Welcome Back
                                        </h3>
                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                            Sign in to access your dashboard
                                        </p>
                                    </div>

                                    {/* Login Method Selector */}
                                    <div className={`flex gap-2 p-2 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-100'
                                        }`}>
                                        {[
                                            { id: 'credentials', icon: KeyRound, label: 'Password' },
                                            { id: 'phone', icon: Phone, label: 'Phone' },
                                            { id: 'email', icon: Mail, label: 'Email' }
                                        ].map((method) => {
                                            const Icon = method.icon;
                                            return (
                                                <button
                                                    key={method.id}
                                                    onClick={() => setLoginMethod(method.id)}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 ${loginMethod === method.id
                                                        ? isDark
                                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                                            : 'bg-white text-gray-900 shadow-md'
                                                        : isDark
                                                            ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                                            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                                        }`}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                    <span className="hidden sm:inline">{method.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Form */}
                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        {loginMethod === 'credentials' && (
                                            <>
                                                {/* Username */}
                                                <div className="space-y-2">
                                                    <label className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'
                                                        }`}>
                                                        Username
                                                    </label>
                                                    <div className="relative group">
                                                        <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 ${focusedInput === 'username'
                                                            ? 'text-indigo-500 scale-110'
                                                            : isDark ? 'text-gray-100' : 'text-gray-400'
                                                            }`} />
                                                        <input
                                                            type="text"
                                                            name="username"
                                                            value={formData.username}
                                                            onChange={handleInputChange}
                                                            onFocus={() => setFocusedInput('username')}
                                                            onBlur={() => setFocusedInput('')}
                                                            placeholder="Enter your username"
                                                            required
                                                            className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 transition-all duration-300 ${focusedInput === 'username'
                                                                    ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 scale-[1.01]'
                                                                    : error
                                                                        ? 'border-red-400'
                                                                        : isDark
                                                                            ? 'bg-white/5 border-white/10 focus:border-indigo-500 focus:bg-white/5'
                                                                            : 'bg-white/50 border-gray-200 focus:border-indigo-500 focus:bg-white/50'
                                                                } focus:outline-none ${isDark ? 'text-white placeholder-gray-100' : 'text-gray-900 placeholder-gray-400'
                                                                }`}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Password */}
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <label className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'
                                                            }`}>
                                                            Password
                                                        </label>
                                                        <button
                                                            type="button"
                                                            className="text-sm font-medium text-indigo-500 hover:text-indigo-400 transition-colors"
                                                        >
                                                            Forgot?
                                                        </button>
                                                    </div>
                                                    <div className="relative group">
                                                        <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 ${focusedInput === 'password'
                                                            ? 'text-indigo-500 scale-110'
                                                            : isDark ? 'text-gray-100' : 'text-gray-400'
                                                            }`} />
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            name="password"
                                                            value={formData.password}
                                                            onChange={handleInputChange}
                                                            onFocus={() => setFocusedInput('password')}
                                                            onBlur={() => setFocusedInput('')}
                                                            placeholder="Enter your password"
                                                            required
                                                            className={`w-full pl-12 pr-12 py-4 rounded-xl border-2 transition-all duration-300 ${focusedInput === 'password'
                                                                ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 scale-[1.01]'
                                                                : error
                                                                    ? 'border-red-400'
                                                                    : isDark
                                                                        ? 'bg-white/5 border-white/10 focus:border-indigo-500'
                                                                        : 'bg-white/50 border-gray-200 focus:border-indigo-500'
                                                                } focus:outline-none ${isDark ? 'text-white placeholder-gray-100' : 'text-gray-900 placeholder-gray-400'
                                                                }`}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className={`absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${isDark
                                                                ? 'hover:bg-white/10 text-gray-400 hover:text-gray-200'
                                                                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                                                                }`}
                                                        >
                                                            {showPassword ? (
                                                                <EyeOff className="w-5 h-5" />
                                                            ) : (
                                                                <Eye className="w-5 h-5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Remember Me */}
                                                <div className="flex items-center justify-between">
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            checked={rememberMe}
                                                            onChange={(e) => setRememberMe(e.target.checked)}
                                                            className="w-5 h-5 rounded-lg border-2 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 transition-all"
                                                        />
                                                        <span className={`text-sm font-medium ${isDark ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'
                                                            } transition-colors`}>
                                                            Remember me
                                                        </span>
                                                    </label>
                                                </div>

                                                {/* Error Message */}
                                                {error && (
                                                    <div className={`flex items-start gap-3 p-4 rounded-xl border-2 ${isDark
                                                        ? 'bg-red-500/10 border-red-500/30'
                                                        : 'bg-red-50 border-red-200'
                                                        }`}>
                                                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                                        <p className={`text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-600'
                                                            }`}>
                                                            {error}
                                                        </p>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {loginMethod === 'phone' && (
                                            <div className="space-y-2">
                                                <label className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>
                                                    Phone Number
                                                </label>
                                                <div className="relative">
                                                    <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'
                                                        }`} />
                                                    <input
                                                        type="tel"
                                                        placeholder="+91 98765 43210"
                                                        className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 transition-all ${isDark
                                                            ? 'bg-white/5 border-white/10 focus:border-indigo-500 text-white placeholder-gray-500'
                                                            : 'bg-white/50 border-gray-200 focus:border-indigo-500 text-gray-900 placeholder-gray-400'
                                                            } focus:outline-none`}
                                                    />
                                                </div>
                                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    We'll send you a verification code
                                                </p>
                                            </div>
                                        )}

                                        {loginMethod === 'email' && (
                                            <div className="space-y-2">
                                                <label className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>
                                                    Email Address
                                                </label>
                                                <div className="relative">
                                                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'
                                                        }`} />
                                                    <input
                                                        type="email"
                                                        placeholder="your@email.com"
                                                        className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 transition-all ${isDark
                                                            ? 'bg-white/5 border-white/10 focus:border-indigo-500 text-white placeholder-gray-500'
                                                            : 'bg-white/50 border-gray-200 focus:border-indigo-500 text-gray-900 placeholder-gray-400'
                                                            } focus:outline-none`}
                                                    />
                                                </div>
                                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    We'll send you a magic link
                                                </p>
                                            </div>
                                        )}

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="group relative w-full py-4 rounded-xl font-bold text-white shadow-2xl transform transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transition-transform duration-300 group-hover:scale-110"></div>
                                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"></div>
                                            <div className="relative flex items-center justify-center gap-2">
                                                {isLoading ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        <span>Signing in...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>
                                                            {loginMethod === 'credentials'
                                                                ? 'Sign In'
                                                                : loginMethod === 'phone'
                                                                    ? 'Send Code'
                                                                    : 'Send Magic Link'}
                                                        </span>
                                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    </form>

                                    {/* Divider */}
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className={`w-full border-t ${isDark ? 'border-white/10' : 'border-gray-200'
                                                }`}></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className={`px-4 ${isDark ? 'bg-slate-900/50 text-gray-400' : 'bg-white/80 text-gray-600'
                                                }`}>
                                                Or continue with
                                            </span>
                                        </div>
                                    </div>

                                    {/* Social Login */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {socialLogins.map((social, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                className={`relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 overflow-hidden group ${isDark
                                                    ? 'border-white/10 hover:border-white/20'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className={`absolute inset-0 bg-gradient-to-r ${social.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                                                <span className="relative text-2xl">{social.name[0]}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Sign Up Link */}
                                    <div className="text-center">
                                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            Don't have an account?{' '}
                                            <button className="font-bold text-indigo-500 hover:text-indigo-400 transition-colors">
                                                Sign up for free
                                            </button>
                                        </p>
                                    </div>

                                    {/* Demo Credentials */}
                                    <div className={`p-4 rounded-xl border-2 ${isDark
                                        ? 'bg-indigo-500/10 border-indigo-500/30'
                                        : 'bg-indigo-50 border-indigo-200'
                                        }`}>
                                        <div className="flex items-start gap-2">
                                            <Sparkles className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-indigo-400' : 'text-indigo-600'
                                                    }`}>
                                                    Demo Credentials
                                                </p>
                                                <p className={`text-xs ${isDark ? 'text-indigo-300' : 'text-indigo-700'
                                                    }`}>
                                                    Username: <code className="font-mono font-bold">admin</code> • Password: <code className="font-mono font-bold">admin</code>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Logo - Shown only on mobile */}
                            <div className="lg:hidden mt-8 text-center">
                                <div className="inline-flex items-center gap-3">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur-lg opacity-60"></div>
                                        <div className={`relative p-3 rounded-xl backdrop-blur-xl border ${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-white/40'
                                            }`}>
                                            <Car className="w-6 h-6 text-indigo-500" />
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            Motor<span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Desk</span>
                                        </h1>
                                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            Garage Management System
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0) translateX(0);
                    }
                    25% {
                        transform: translateY(-20px) translateX(10px);
                    }
                    50% {
                        transform: translateY(-10px) translateX(-10px);
                    }
                    75% {
                        transform: translateY(-30px) translateX(5px);
                    }
                }
            `}</style>
            </div>
        </PublicLayout>
    );
}