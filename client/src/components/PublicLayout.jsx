// src/layouts/PublicLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar.jsx";
import { useTheme } from "../contexts/ThemeContext";

export default function PublicLayout() {
    const { isDark } = useTheme();

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark
                ? 'bg-gray-950'
                : 'bg-gray-50'
            }`}>
            {/* Navbar */}
            <PublicNavbar />

            {/* Main Content */}
            <main className="relative">
                <Outlet />
            </main>

            {/* Scroll to Top Button */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className={`fixed bottom-10 right-10 z-50 p-3 rounded-full shadow-2xl transition-all hover:scale-110 ${isDark
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                        : 'bg-white text-indigo-600 hover:bg-gray-50 border border-gray-200'
                    }`}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
            </button>
        </div>
    );
}