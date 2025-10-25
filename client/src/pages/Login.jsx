// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { 
    Car, User, Lock, Eye, EyeOff, ArrowRight, 
    Sparkles, Shield, Zap, ChevronRight, 
    Mail, Phone, Globe, CheckCircle, AlertCircle,
    Fingerprint, KeyRound, LogIn, Loader2
} from "lucide-react";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDark } = useTheme();
    
    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [focusedInput, setFocusedInput] = useState("");
    const [loginMethod, setLoginMethod] = useState("credentials"); // credentials, phone, email
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const from = location.state?.from?.pathname || "/pricing";

    // Mouse tracking for gradient effect
    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Auto-fill for demo
    useEffect(() => {
        const savedAuth = localStorage.getItem('rememberedAuth');
        if (savedAuth) {
            const { username } = JSON.parse(savedAuth);
            setFormData(prev => ({ ...prev, username }));
            setRememberMe(true);
        }
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

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (formData.username === "admin" && formData.password === "admin") {
            // Success animation
            const loginBox = document.querySelector('.login-card');
            loginBox?.classList.add('login-success');

            // Store authentication
            localStorage.setItem(
                "auth",
                JSON.stringify({ isAuthenticated: true, user: formData.username })
            );

            if (rememberMe) {
                localStorage.setItem(
                    "rememberedAuth",
                    JSON.stringify({ username: formData.username })
                );
            } else {
                localStorage.removeItem("rememberedAuth");
            }

            // Navigate after animation
            setTimeout(() => {
                navigate(from, { replace: true });
            }, 500);
        } else {
            setIsLoading(false);
            setError("Invalid credentials. Try: admin / admin");
            // Shake animation
            const loginBox = document.querySelector('.login-card');
            loginBox?.classList.add('shake-animation');
            setTimeout(() => {
                loginBox?.classList.remove('shake-animation');
            }, 500);
        }
    };

    const socialLogins = [
        { name: "Google", icon: "🔵", color: "from-blue-500 to-blue-600" },
        { name: "Microsoft", icon: "🟦", color: "from-cyan-500 to-blue-500" },
        { name: "Apple", icon: "⚫", color: "from-gray-700 to-gray-900" }
    ];

    const features = [
        { icon: Shield, text: "Bank-level Security", color: "text-green-500" },
        { icon: Zap, text: "Instant Access", color: "text-yellow-500" },
        { icon: Globe, text: "Available 24/7", color: "text-blue-500" }
    ];

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${
            isDark 
                ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900' 
                : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
        }`}>
            {/* Dynamic gradient that follows cursor */}
            <div 
                className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
                style={{
                    background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, 
                        ${isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)'}, 
                        transparent 40%)`
                }}
            />

            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float animation-delay-4000"></div>
            </div>

            {/* Grid pattern overlay */}
            <div className={`fixed inset-0 z-0 ${isDark ? 'opacity-20' : 'opacity-10'}`}>
                <div className="absolute inset-0" 
                    style={{
                        backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.05)'} 1px, transparent 1px),
                                         linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.05)'} 1px, transparent 1px)`,
                        backgroundSize: '50px 50px'
                    }}
                />
            </div>

            {/* Main Container */}
            <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
                {/* Left Side - Branding */}
                <div className="hidden lg:block space-y-8 animate-fadeInLeft">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-3 group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity"></div>
                                <div className={`relative p-3 rounded-xl ${
                                    isDark ? 'bg-gray-800' : 'bg-white'
                                } shadow-xl`}>
                                    <Car className="w-8 h-8 text-indigo-500" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">
                                    Motor <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Desk</span>
                                </h1>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Garage Management System
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className={`text-4xl font-bold leading-tight ${
                                isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                                Welcome back to your
                                <span className="block bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
                                    command center
                                </span>
                            </h2>
                            <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                Manage your garage operations with the most advanced CRM platform.
                            </p>
                        </div>

                        {/* Features */}
                        <div className="space-y-4">
                            {features.map((feature, index) => {
                                const Icon = feature.icon;
                                return (
                                    <div
                                        key={index}
                                        className={`flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-105 ${
                                            isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'
                                        }`}
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <Icon className={`w-5 h-5 ${feature.color}`} />
                                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                            {feature.text}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Stats */}
                        <div className={`grid grid-cols-3 gap-4 p-4 rounded-2xl ${
                            isDark ? 'bg-white/5' : 'bg-white/50'
                        } backdrop-blur-xl`}>
                            {[
                                { value: "10K+", label: "Users" },
                                { value: "99.9%", label: "Uptime" },
                                { value: "24/7", label: "Support" }
                            ].map((stat, index) => (
                                <div key={index} className="text-center">
                                    <div className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                                        {stat.value}
                                    </div>
                                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full max-w-md mx-auto lg:mx-0">
                    <div className={`login-card relative rounded-3xl p-8 backdrop-blur-xl border shadow-2xl transition-all duration-500 animate-fadeInRight ${
                        isDark 
                            ? 'bg-gray-800/50 border-gray-700' 
                            : 'bg-white/80 border-gray-200'
                    }`}>
                        {/* Decorative element */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-xl opacity-50"></div>
                                <div className={`relative w-24 h-24 rounded-full flex items-center justify-center ${
                                    isDark ? 'bg-gray-800' : 'bg-white'
                                } shadow-xl`}>
                                    <Fingerprint className="w-10 h-10 text-indigo-500" />
                                </div>
                                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
                            </div>
                        </div>

                        <div className="mt-8 space-y-6">
                            {/* Title */}
                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-bold">Sign In</h3>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Enter your credentials to continue
                                </p>
                            </div>

                            {/* Login Method Tabs */}
                            <div className="flex gap-2 p-1 rounded-xl bg-gray-100 dark:bg-gray-700/50">
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
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all ${
                                                loginMethod === method.id
                                                    ? 'bg-white dark:bg-gray-800 shadow-md'
                                                    : 'hover:bg-white/50 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span className="text-sm font-medium">{method.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {loginMethod === 'credentials' && (
                                    <>
                                        {/* Username Input */}
                                        <div className="space-y-2">
                                            <label className={`text-sm font-medium ${
                                                isDark ? 'text-gray-300' : 'text-gray-700'
                                            }`}>
                                                Username
                                            </label>
                                            <div className="relative">
                                                <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                                                    focusedInput === 'username' 
                                                        ? 'text-indigo-500' 
                                                        : isDark ? 'text-gray-400' : 'text-gray-500'
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
                                                    className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 transition-all ${
                                                        focusedInput === 'username'
                                                            ? 'border-indigo-500 shadow-lg shadow-indigo-500/20'
                                                            : error
                                                                ? 'border-red-400'
                                                                : isDark
                                                                    ? 'bg-gray-700 border-gray-600 focus:border-indigo-500'
                                                                    : 'bg-gray-50 border-gray-300 focus:border-indigo-500'
                                                    } focus:outline-none`}
                                                />
                                            </div>
                                        </div>

                                        {/* Password Input */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className={`text-sm font-medium ${
                                                    isDark ? 'text-gray-300' : 'text-gray-700'
                                                }`}>
                                                    Password
                                                </label>
                                                <Link 
                                                    to="/forgot-password"
                                                    className="text-sm text-indigo-500 hover:text-indigo-600 transition-colors"
                                                >
                                                    Forgot?
                                                </Link>
                                            </div>
                                            <div className="relative">
                                                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                                                    focusedInput === 'password' 
                                                        ? 'text-indigo-500' 
                                                        : isDark ? 'text-gray-400' : 'text-gray-500'
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
                                                    className={`w-full pl-11 pr-12 py-3 rounded-xl border-2 transition-all ${
                                                        focusedInput === 'password'
                                                            ? 'border-indigo-500 shadow-lg shadow-indigo-500/20'
                                                            : error
                                                                ? 'border-red-400'
                                                                : isDark
                                                                    ? 'bg-gray-700 border-gray-600 focus:border-indigo-500'
                                                                    : 'bg-gray-50 border-gray-300 focus:border-indigo-500'
                                                    } focus:outline-none`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${
                                                        isDark 
                                                            ? 'hover:bg-gray-600' 
                                                            : 'hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="w-5 h-5 text-gray-500" />
                                                    ) : (
                                                        <Eye className="w-5 h-5 text-gray-500" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {loginMethod === 'phone' && (
                                    <div className="space-y-2">
                                        <label className={`text-sm font-medium ${
                                            isDark ? 'text-gray-300' : 'text-gray-700'
                                        }`}>
                                            Phone Number
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input
                                                type="tel"
                                                placeholder="+91 98765 43210"
                                                className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 ${
                                                    isDark
                                                        ? 'bg-gray-700 border-gray-600'
                                                        : 'bg-gray-50 border-gray-300'
                                                } focus:outline-none focus:border-indigo-500`}
                                            />
                                        </div>
                                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            We'll send you a verification code
                                        </p>
                                    </div>
                                )}

                                {loginMethod === 'email' && (
                                    <div className="space-y-2">
                                        <label className={`text-sm font-medium ${
                                            isDark ? 'text-gray-300' : 'text-gray-700'
                                        }`}>
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input
                                                type="email"
                                                placeholder="your@email.com"
                                                className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 ${
                                                    isDark
                                                        ? 'bg-gray-700 border-gray-600'
                                                        : 'bg-gray-50 border-gray-300'
                                                } focus:outline-none focus:border-indigo-500`}
                                            />
                                        </div>
                                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            We'll send you a magic link
                                        </p>
                                    </div>
                                )}

                                {/* Remember Me & Error */}
                                {loginMethod === 'credentials' && (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={rememberMe}
                                                    onChange={(e) => setRememberMe(e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className={`text-sm ${
                                                    isDark ? 'text-gray-300' : 'text-gray-700'
                                                }`}>
                                                    Remember me
                                                </span>
                                            </label>
                                        </div>

                                        {error && (
                                            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-fadeIn">
                                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                                <p className="text-sm text-red-600 dark:text-red-400">
                                                    {error}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Signing in...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="w-5 h-5" />
                                            <span>
                                                {loginMethod === 'credentials' 
                                                    ? 'Sign In' 
                                                    : loginMethod === 'phone'
                                                        ? 'Send Code'
                                                        : 'Send Magic Link'}
                                            </span>
                                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className={`w-full border-t ${
                                        isDark ? 'border-gray-700' : 'border-gray-300'
                                    }`}></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className={`px-2 ${
                                        isDark ? 'bg-gray-800/50 text-gray-400' : 'bg-white/80 text-gray-500'
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
                                        className={`p-3 rounded-xl border-2 transition-all hover:scale-105 ${
                                            isDark
                                                ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-700'
                                                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                        }`}
                                    >
                                        <span className="text-xl">{social.icon}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Sign Up Link */}
                            <div className="text-center">
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Don't have an account?{' '}
                                    <Link 
                                        to="/signup"
                                        className="text-indigo-500 hover:text-indigo-600 font-semibold transition-colors"
                                    >
                                        Sign up for free
                                    </Link>
                                </p>
                            </div>

                            {/* Demo Credentials */}
                            <div className={`text-center p-3 rounded-xl ${
                                isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'
                            } border border-indigo-500/20`}>
                                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                                    <strong>Demo:</strong> username: <code className="font-mono">admin</code> | password: <code className="font-mono">admin</code>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}