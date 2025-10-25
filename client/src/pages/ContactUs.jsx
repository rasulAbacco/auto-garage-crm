import React, { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import PublicLayout from "../components/PublicLayout";
import { Mail, Phone, MapPin, Send, User, MessageSquare, Loader2 } from "lucide-react";

export default function ContactUs() {
    const { isDark } = useTheme();
    const [formData, setFormData] = useState({ name: "", email: "", message: "" });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setSubmitted(true);
            setFormData({ name: "", email: "", message: "" });
        }, 1500);
    };

    return (
        <PublicLayout>
            <div
                className={`min-h-screen py-20 mt-[7%] px-4 sm:px-6 lg:px-8 transition-colors duration-500 ${isDark ? "bg-gray-950 text-gray-200" : "bg-gray-50 text-gray-900"
                    }`}
            >
                <div className="max-w-6xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-16">
                        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            Get in Touch
                        </h1>
                        <p className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            We’d love to hear from you! Whether you have a question, feedback, or partnership inquiry — feel free to reach out.
                        </p>
                    </div>

                    {/* Contact Info & Form */}
                    <div className="grid lg:grid-cols-2 gap-10 items-start">
                        {/* Contact Information */}
                        <div
                            className={`p-8 rounded-3xl shadow-xl backdrop-blur-xl transition-all ${isDark
                                    ? "bg-white/10 border border-white/10"
                                    : "bg-white border border-gray-200"
                                }`}
                        >
                            <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`p-3 rounded-lg ${isDark ? "bg-indigo-500/20" : "bg-indigo-100"
                                            }`}
                                    >
                                        <Phone className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">Phone</h4>
                                        <p className="text-sm text-gray-500">+91 98765 43210</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div
                                        className={`p-3 rounded-lg ${isDark ? "bg-purple-500/20" : "bg-purple-100"
                                            }`}
                                    >
                                        <Mail className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">Email</h4>
                                        <p className="text-sm text-gray-500">support@motordesk.com</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div
                                        className={`p-3 rounded-lg ${isDark ? "bg-pink-500/20" : "bg-pink-100"
                                            }`}
                                    >
                                        <MapPin className="w-5 h-5 text-pink-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">Address</h4>
                                        <p className="text-sm text-gray-500">
                                            123 Garage Street, AutoCity, India 560001
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Map Placeholder */}
                            <div
                                className={`mt-10 h-48 rounded-2xl flex items-center justify-center text-sm font-medium ${isDark ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-600"
                                    }`}
                            >
                                🗺️ Google Map Integration Coming Soon
                            </div>
                        </div>

                        {/* Contact Form */}
                        <form
                            onSubmit={handleSubmit}
                            className={`p-8 rounded-3xl shadow-xl backdrop-blur-xl transition-all ${isDark
                                    ? "bg-white/10 border border-white/10"
                                    : "bg-white border border-gray-200"
                                }`}
                        >
                            <h2 className="text-2xl font-semibold mb-6">Send Us a Message</h2>

                            {submitted ? (
                                <div
                                    className={`p-6 text-center rounded-xl ${isDark
                                            ? "bg-green-500/10 border border-green-400/20 text-green-300"
                                            : "bg-green-50 border border-green-200 text-green-700"
                                        }`}
                                >
                                    <p>🎉 Thank you! Your message has been received.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Name */}
                                    <div className="mb-5">
                                        <label className="flex items-center gap-2 font-medium mb-2">
                                            <User className="w-4 h-4 text-indigo-500" />
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${isDark
                                                    ? "bg-white/5 border-white/10 focus:border-indigo-500 text-white placeholder-gray-400"
                                                    : "bg-white border-gray-200 focus:border-indigo-500 text-gray-900 placeholder-gray-500"
                                                }`}
                                            placeholder="Enter your full name"
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="mb-5">
                                        <label className="flex items-center gap-2 font-medium mb-2">
                                            <Mail className="w-4 h-4 text-indigo-500" />
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${isDark
                                                    ? "bg-white/5 border-white/10 focus:border-indigo-500 text-white placeholder-gray-400"
                                                    : "bg-white border-gray-200 focus:border-indigo-500 text-gray-900 placeholder-gray-500"
                                                }`}
                                            placeholder="your@email.com"
                                        />
                                    </div>

                                    {/* Message */}
                                    <div className="mb-6">
                                        <label className="flex items-center gap-2 font-medium mb-2">
                                            <MessageSquare className="w-4 h-4 text-indigo-500" />
                                            Message
                                        </label>
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            rows={5}
                                            className={`w-full px-4 py-3 rounded-xl border-2 outline-none resize-none transition-all ${isDark
                                                    ? "bg-white/5 border-white/10 focus:border-indigo-500 text-white placeholder-gray-400"
                                                    : "bg-white border-gray-200 focus:border-indigo-500 text-gray-900 placeholder-gray-500"
                                                }`}
                                            placeholder="Write your message..."
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:scale-[1.02] flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
