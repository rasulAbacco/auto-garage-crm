import React, { useState } from "react";
import axios from "axios";
import { Droplets, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
const API_URL = import.meta.env.VITE_API_BASE_URL;


const WashRegister = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        phone: "",
        password: "",
        crmType: "WASH"
    });

    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            await axios.post(`${API_URL}/api/auth/register`, formData);
            setMessage("Registration successful");
        } catch (error) {
            setMessage(error.response?.data?.message || "Error registering");
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-900 to-fuchsia-900 p-4">

            <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-3xl shadow-2xl space-y-6">

                <div className="text-center">
                    <Droplets className="w-14 h-14 mx-auto text-fuchsia-300 mb-2" />
                    <h1 className="text-3xl font-bold text-white">Car Wash CRM</h1>
                </div>

                {message && (
                    <div className="p-3 text-center bg-white/20 rounded-xl text-white">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">

                    <Field icon={User} placeholder="Full Name" onChange={(v) => setFormData({ ...formData, username: v })} />
                    <Field icon={Mail} placeholder="Email" onChange={(v) => setFormData({ ...formData, email: v })} />
                    <Field icon={Mail} placeholder="Phone" onChange={(v) => setFormData({ ...formData, phone: v })} />

                    {/* Password */}
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input
                            type={show ? "text" : "password"}
                            className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/10 text-white border border-white/20"
                            placeholder="Password"
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <button
                            type="button"
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white"
                            onClick={() => setShow(!show)}
                        >
                            {show ? <EyeOff /> : <Eye />}
                        </button>
                    </div>

                    <button
                        className="w-full bg-fuchsia-500 text-white py-3 rounded-xl"
                        disabled={loading}
                    >
                        {loading ? "Creating..." : "Create Account"}
                    </button>

                </form>

            </div>
        </div>
    );
};

const Field = ({ icon: Icon, placeholder, onChange }) => (
    <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        <input
            className="w-full pl-10 py-3 rounded-xl bg-white/10 text-white border border-white/20"
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

export default WashRegister;
