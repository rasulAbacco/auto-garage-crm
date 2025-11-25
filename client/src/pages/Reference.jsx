import React, { useEffect, useState } from "react";
import { Copy, CheckCircle, Users, Tag } from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const Reference = () => {
    const [referralCode, setReferralCode] = useState("");
    const [copied, setCopied] = useState(false);
    const [referrals, setReferrals] = useState([]);

    useEffect(() => {
        fetchReferralData();
    }, []);

    const fetchReferralData = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await axios.get(`${API_URL}/api/referral/my-referrals`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setReferralCode(res.data.referralCode);
            setReferrals(res.data.referrals);
        } catch (err) {
            console.log("Referral fetch error:", err);
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="pl-[5%]">

            {/* Referral Code Card */}
            <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-3xl p-8 shadow-xl mb-10">
                <div className="flex items-center gap-4 mb-6">
                    <Tag className="w-10 h-10 text-white opacity-90" />
                    <h1 className="text-3xl font-bold">Your Referral Code</h1>
                </div>

                <div
                    className="relative flex items-center justify-between bg-white/20 p-5 rounded-2xl backdrop-blur-lg shadow-lg cursor-pointer"
                    onClick={copyCode}
                >
                    <span className="text-4xl font-extrabold tracking-wider">
                        {referralCode || "LOADING..."}
                    </span>

                    <button className="bg-white/30 p-3 rounded-xl hover:bg-white/40 transition">
                        {copied ? (
                            <CheckCircle className="w-6 h-6 text-green-300" />
                        ) : (
                            <Copy className="w-6 h-6 text-white" />
                        )}
                    </button>
                </div>

                {copied && (
                    <p className="text-green-300 text-sm mt-3 animate-fadeIn">
                        Copied to clipboard!
                    </p>
                )}
            </div>

            {/* Title */}
            <div className="flex items-center gap-3 mb-4">
                <Users className="w-7 h-7 text-indigo-600" />
                <h2 className="text-2xl font-bold">Users Referred by You</h2>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl shadow-lg border border-gray-200 bg-white">
                <table className="w-full min-w-[900px]">
                    <thead>
                        <tr className="bg-gray-100 text-left">
                            <th className="py-3 px-5 font-semibold text-gray-700">Name</th>
                            <th className="py-3 px-5 font-semibold text-gray-700">Email</th>
                            <th className="py-3 px-5 font-semibold text-gray-700">Plan</th>
                            <th className="py-3 px-5 font-semibold text-gray-700">Billing</th>
                            <th className="py-3 px-5 font-semibold text-gray-700">Amount</th>
                            <th className="py-3 px-5 font-semibold text-gray-700">Joining Date</th>
                            <th className="py-3 px-5 font-semibold text-gray-700">Payment Date</th>
                        </tr>
                    </thead>

                    <tbody>
                        {referrals.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="py-6 text-center text-gray-500">
                                    No one has used your referral yet.
                                </td>
                            </tr>
                        ) : (
                            referrals.map((user, idx) => (
                                <tr key={idx} className="border-b hover:bg-gray-50 transition">
                                    <td className="py-4 px-5">{user.name}</td>
                                    <td className="py-4 px-5">{user.email}</td>
                                    <td className="py-4 px-5 font-semibold text-indigo-600">
                                        {user.plan}
                                    </td>
                                    <td className="py-4 px-5">{user.billing}</td>
                                    <td className="py-4 px-5 font-bold text-green-600">
                                        ₹{user.amount}
                                    </td>
                                    <td className="py-4 px-5">
                                        {new Date(user.joiningDate).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 px-5">
                                        {user.paidAt
                                            ? new Date(user.paidAt).toLocaleDateString()
                                            : "N/A"}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Reference;
