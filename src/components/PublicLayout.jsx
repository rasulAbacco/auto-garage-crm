// src/layouts/PublicLayout.jsx
import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar.jsx";
import { useTheme } from "../contexts/ThemeContext";

export default function PublicLayout() {
    const { isDark } = useTheme();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className={`min-h-screen transition-all duration-500 ${
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

            {/* Animated background patterns */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* Grid pattern overlay */}
            <div className={`fixed inset-0 z-0 ${isDark ? 'opacity-20' : 'opacity-10'}`}>
                <div className="absolute inset-0" 
                    style={{
                        backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.1)'} 1px, transparent 1px),
                                         linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.1)'} 1px, transparent 1px)`,
                        backgroundSize: '50px 50px'
                    }}
                />
            </div>

            {/* Navbar */}
            <PublicNavbar />

            {/* Main Content */}
            <main className="relative z-10">
                <Outlet />
            </main>

            {/* Floating elements */}
            <div className="fixed bottom-10 right-10 z-50 space-y-4">
                <button
                    className={`p-3 rounded-full backdrop-blur-xl border shadow-2xl transition-all duration-300 hover:scale-110 ${
                        isDark 
                            ? 'bg-white/10 border-white/20 hover:bg-white/20' 
                            : 'bg-white/80 border-gray-200 hover:bg-white'
                    }`}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                </button>
            </div>
        </div>
    );
}