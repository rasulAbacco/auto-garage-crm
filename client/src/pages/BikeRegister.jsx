import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Bike, User, Lock, Eye, EyeOff, ArrowRight, Sparkles, Shield,
    Mail, Phone, AlertCircle, Loader2, CheckCircle, UserPlus,
    AlertTriangle, XCircle
} from "lucide-react";
const API_URL = import.meta.env.VITE_API_BASE_URL;


const useTheme = () => ({ isDark: true });

const BikeRegister = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isDark } = useTheme();

    const paymentData = location.state?.paymentData;

    useEffect(() => {
        if (!paymentData) navigate("/");
    }, [paymentData, navigate]);

    // form data including CRM TYPE
    const [formData, setFormData] = useState({
        username: paymentData?.formData.name || "",
        email: paymentData?.formData.email || "",
        phone: paymentData?.formData.phone || "",
        password: "",
        role: "user",
        crmType: "BIKE"
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            await axios.post(`${API_URL}/api/auth/register`, formData);
            setMessage("Registration successful!");
            setTimeout(() => navigate("/login"), 1500);
        } catch (error) {
            setMessage(error.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 to-teal-900 p-4">
            <div className="w-full max-w-lg bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-3xl shadow-2xl space-y-6">

                <div className="text-center">
                    <Bike className="w-12 h-12 mx-auto text-green-400 mb-2" />
                    <h1 className="text-3xl font-bold text-white">Bike Workshop</h1>
                    <p className="text-gray-300 text-sm">Create your BIKE CRM account</p>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl border ${message.includes("successful")
                            ? "bg-green-500/20 border-green-500 text-green-300"
                            : "bg-red-500/20 border-red-500 text-red-300"
                        }`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                    <InputField icon={User} label="Username" value={formData.username} disabled />

                    <InputField icon={Mail} label="Email" value={formData.email} disabled />

                    <InputField icon={Phone} label="Phone" value={formData.phone} disabled />

                    {/* Password */}
                    <div>
                        <label className="text-white text-sm">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full bg-white/10 border border-white/20 text-white rounded-xl pl-10 pr-12 py-3 mt-1"
                                placeholder="Enter a password"
                                required
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-200"
                            >
                                {showPassword ? <EyeOff /> : <Eye />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-green-500 text-white font-bold"
                    >
                        {loading ? "Creating..." : "Create Account"}
                    </button>

                </form>
            </div>
        </div>
    );
};

const InputField = ({ icon: Icon, label, value, disabled }) => (
    <div>
        <label className="text-white text-sm">{label}</label>
        <div className="relative">
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
                type="text"
                value={value}
                disabled={disabled}
                className="w-full bg-white/10 border border-white/20 text-gray-300 rounded-xl pl-10 py-3 mt-1 cursor-not-allowed"
            />
        </div>
    </div>
);

export default BikeRegister;
