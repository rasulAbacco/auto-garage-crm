// src/pages/Landing.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
    const navigate = useNavigate();

    return (
        <div className="w-full">
            {/* Hero */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-12">
                <div className="space-y-6">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                        Auto Garage CRM — run your garage with clarity & speed
                    </h1>
                    <p className="text-lg text-slate-600 max-w-xl">
                        Manage customers, jobs, invoices and reminders in one lightweight application built for garages and
                        workshops. Fast onboarding, OCR for RC/cart documents, and intuitive dashboards to keep your business moving.
                    </p>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => navigate("/pricing")}
                            className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                        >
                            View Pricing
                        </button>

                        <button
                            onClick={() => navigate("/login")}
                            className="px-6 py-3 rounded-lg border border-slate-300 text-slate-800 font-medium hover:bg-slate-50"
                        >
                            Sign In (demo)
                        </button>
                    </div>

                    <div className="mt-6 text-sm text-slate-500">
                        <strong>Demo credentials:</strong> <span className="font-mono">admin / admin</span> — will redirect to pricing then dashboard.
                    </div>
                </div>

                {/* Visual / feature column */}
                <div className="bg-white rounded-2xl shadow-md p-6">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center">🔧</div>
                            <div>
                                <h3 className="font-semibold text-slate-800">Job & Service Tracking</h3>
                                <p className="text-sm text-slate-500">Assign jobs, set statuses, track parts and labor.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center">📂</div>
                            <div>
                                <h3 className="font-semibold text-slate-800">Customer Database</h3>
                                <p className="text-sm text-slate-500">Keep client history, invoices and contact info in one place.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center">📈</div>
                            <div>
                                <h3 className="font-semibold text-slate-800">Reports & Billing</h3>
                                <p className="text-sm text-slate-500">Generate invoices and get business insights.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Small CTA band */}
            <section className="mt-12 py-8 bg-gradient-to-r from-indigo-50 to-white rounded-xl px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h4 className="text-xl font-semibold text-slate-800">Ready to try Motor Desk?</h4>
                    <p className="text-slate-600 mt-2">
                        Start with the free plan or pick a paid plan for team features & priority support.
                    </p>
                    <div className="mt-5">
                        <button
                            onClick={() => navigate("/pricing")}
                            className="px-5 py-2 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700"
                        >
                            See Plans
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
