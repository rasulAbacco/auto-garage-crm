import React, { useState, useEffect } from 'react';
import { useTheme } from "../contexts/ThemeContext";
import { Link } from "react-router-dom";

const Footer = () => {
    const { isDark } = useTheme();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <>
            <style jsx>{`
                @keyframes spin-fast {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-5px); }
                    60% { transform: translateY(-3px); }
                }
                @keyframes glow {
                    0%, 100% { 
                        filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.6));
                    }
                    50% { 
                        filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.9));
                    }
                }
                @keyframes shine {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .animate-spin-fast {
                    animation: spin-fast 3s linear infinite;
                }
                .animate-slide-up {
                    animation: slideUp 0.5s ease-out forwards;
                }
                .animate-bounce-soft {
                    animation: bounce 2s infinite;
                }
                .animate-glow {
                    animation: glow 2s ease-in-out infinite;
                }
                .animate-shine {
                    animation: shine 3s ease-in-out infinite;
                }
                .footer-shiny-dark {
                    background: linear-gradient(
                        135deg,
                        #000000 0%,
                        #0a0a0a 25%,
                        #111111 50%,
                        #0a0a0a 75%,
                        #000000 100%
                    );
                    background-size: 200% 200%;
                    position: relative;
                }
                .footer-shiny-dark::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(
                        45deg,
                        transparent 0%,
                        rgba(59, 130, 246, 0.05) 50%,
                        transparent 100%
                    );
                    animation: shine 4s ease-in-out infinite;
                }
                .footer-gradient-light {
                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%);
                }
                .glass-dark {
                    background: rgba(15, 23, 42, 0.7);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .glass-light {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(0, 0, 0, 0.1);
                }
                .link-hover {
                    position: relative;
                    transition: all 0.3s ease;
                }
                .link-hover::after {
                    content: '';
                    position: absolute;
                    width: 0;
                    height: 2px;
                    bottom: -2px;
                    left: 0;
                    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
                    transition: width 0.3s ease;
                }
                .link-hover:hover::after {
                    width: 100%;
                }
                .social-icon {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .social-icon:hover {
                    transform: translateY(-3px) scale(1.1);
                }
                .policy-link {
                    transition: all 0.3s ease;
                }
                .policy-link:hover {
                    animation: bounce 0.6s ease;
                }
                .shiny-card {
                    background: linear-gradient(
                        145deg,
                        rgba(30, 41, 59, 0.8) 0%,
                        rgba(15, 23, 42, 0.9) 50%,
                        rgba(30, 41, 59, 0.8) 100%
                    );
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    position: relative;
                    overflow: hidden;
                }
                .shiny-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        transparent,
                        rgba(59, 130, 246, 0.1),
                        transparent
                    );
                    transition: left 0.6s ease;
                }
                .shiny-card:hover::before {
                    left: 100%;
                }
                .logo-container-light {
                   
                }
                .logo-container-dark {
                    
                }
            `}</style>

            <footer
                className={`relative overflow-hidden ${isDark ? 'footer-shiny-dark text-gray-100' : 'footer-gradient-light text-gray-700'
                    } border-t ${isDark ? "border-gray-900" : "border-gray-200"}`}
            >
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className={`absolute -top-8 -right-8 w-20 h-20 rounded-full ${isDark ? 'bg-blue-900/10' : 'bg-blue-200/30'
                        } animate-pulse`}></div>
                    <div className={`absolute -bottom-4 -left-4 w-16 h-16 rounded-full ${isDark ? 'bg-purple-900/10' : 'bg-purple-200/30'
                        } animate-pulse`} style={{ animationDelay: '1s' }}></div>
                    {/* Shiny particles */}
                    <div className={`absolute top-1/4 left-1/4 w-2 h-2 rounded-full ${isDark ? 'bg-blue-400/20' : 'bg-blue-400/30'
                        } animate-pulse`} style={{ animationDelay: '0.5s' }}></div>
                    <div className={`absolute top-3/4 right-1/4 w-1 h-1 rounded-full ${isDark ? 'bg-purple-400/20' : 'bg-purple-400/30'
                        } animate-pulse`} style={{ animationDelay: '1.5s' }}></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
                    {/* Main Content - Compact Grid */}
                    <div className={`grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 ${isVisible ? 'animate-slide-up' : 'opacity-0'
                        }`}>
                        {/* Brand Section */}
                        <div className="md:col-span-2">
                            <div className="flex items-center mb-4">
                                <div className={`relative mr-3 ${isDark ? 'logo-container-dark animate-glow' : 'logo-container-light'}`}>
                                    <img
                                        src="https://www.abaccotech.com/Logo/icon.png"
                                        alt="Abacco Technology Logo"
                                        className="w-12 h-12 animate-spin-fast b-none"
                                    />
                                </div>
                                <div className='ml-2' >
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                                        Auto Garage Desk
                                    </h2>
                                    <p className={`text-sm font-bold mt-1 ${isDark ? 'text-blue-00' : 'text-purple-600'} `}>
                                        by ABACCO TECHNOLOGY
                                    </p>
                                </div>
                            </div>
                            <p className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-300' : 'text-gray-800'
                                } max-w-md leading-relaxed`}>
                                Your comprehensive solution for garage management, automotive services,
                                car washing, and quality spare parts.
                            </p>
                            <div className="flex space-x-3">
                                {/* Facebook */}
                                <a
                                    href="#"
                                    className={`social-icon p-2 rounded-lg ${isDark
                                        ? 'glass-dark hover:bg-blue-600/30 text-gray-300 hover:text-white'
                                        : 'bg-white hover:bg-blue-500 text-gray-600 hover:text-white'
                                        } border ${isDark ? 'border-gray-700' : 'border-gray-200'
                                        } shadow-sm`}
                                >
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                                    </svg>
                                </a>
                                {/* Instagram */}
                                <a
                                    href="#"
                                    className={`social-icon p-2 rounded-lg ${isDark
                                        ? 'glass-dark hover:bg-pink-600/30 text-gray-300 hover:text-white'
                                        : 'bg-white hover:bg-pink-500 text-gray-600 hover:text-white'
                                        } border ${isDark ? 'border-gray-700' : 'border-gray-200'
                                        } shadow-sm`}
                                >
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                                    </svg>
                                </a>
                                {/* Twitter */}
                                <a
                                    href="#"
                                    className={`social-icon p-2 rounded-lg ${isDark
                                        ? 'glass-dark hover:bg-blue-400/30 text-gray-300 hover:text-white'
                                        : 'bg-white hover:bg-blue-400 text-gray-600 hover:text-white'
                                        } border ${isDark ? 'border-gray-700' : 'border-gray-200'
                                        } shadow-sm`}
                                >
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                                    </svg>
                                </a>
                                {/* LinkedIn */}
                                <a
                                    href="#"
                                    className={`social-icon p-2 rounded-lg ${isDark
                                        ? 'glass-dark hover:bg-blue-700/30 text-gray-300 hover:text-white'
                                        : 'bg-white hover:bg-blue-600 text-gray-600 hover:text-white'
                                        } border ${isDark ? 'border-gray-700' : 'border-gray-200'
                                        } shadow-sm`}
                                >
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className={`text-md font-bold mb-4 pb-2 border-b ${isDark ? 'border-gray-700 text-white' : 'border-gray-300 text-gray-900'
                                }`}>
                                Quick Links
                            </h3>
                            <ul className="space-y-2">
                                {['Home', 'About Us', 'Our Services', 'Contact Us'].map((item) => (
                                    <li key={item}>
                                        <Link
                                            to={`/${item.toLowerCase().replace(' ', '-')}`}
                                            className={`link-hover text-sm font-semibold ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-800 hover:text-gray-900'
                                                }`}
                                        >
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Services */}
                        <div>
                            <h3 className={`text-md font-bold mb-4 pb-2 border-b ${isDark ? 'border-gray-700 text-white' : 'border-gray-300 text-gray-900'
                                }`}>
                                Our Services
                            </h3>
                            <ul className="space-y-2">
                                {['Garage Management', 'Car Washing', 'Spare Parts', 'Car Maintenance'].map((service) => (
                                    <li key={service}>
                                        <Link
                                            to={`/${service.toLowerCase().replace(' ', '-')}`}
                                            className={`link-hover text-sm font-semibold ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-800 hover:text-gray-900'
                                                }`}
                                        >
                                            {service}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Contact Info - Compact with Full Address */}
                    <div className={`mb-6 p-4 rounded-lg ${isDark ? 'shiny-card' : 'glass-light'
                        }`}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-start">
                                <div className={`p-2 rounded-md mr-3 ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                                    }`}>
                                    <svg className={`h-4 w-4 ${isDark ? 'text-blue-300' : 'text-blue-600'
                                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Email</p>
                                    <p className="text-sm">info@abaccotech.com</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className={`p-2 rounded-md mr-3 ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                                    }`}>
                                    <svg className={`h-4 w-4 ${isDark ? 'text-blue-300' : 'text-blue-600'
                                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Phone</p>
                                    <p className="text-sm">+91 9972452044</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className={`p-2 rounded-md mr-3 ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                                    }`}>
                                    <svg className={`h-4 w-4 ${isDark ? 'text-blue-300' : 'text-blue-600'
                                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Address</p>
                                    <p className="text-sm">No 12,13 & 12/A, Kirthan Arcade, 3rd Floor, Aditya Nagar, Sandeep Unnikrishnan Road, Bangalore - 560097</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section with Bouncing Links - Fixed Position */}
                    <div className={`pt-6 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'
                        } flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0`}>
                        <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'} text-center md:text-left`}>
                            © {new Date().getFullYear()} Auto Garage Desk by Abacco Technology. All rights reserved.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                            {/* <Link
                                to="/terms"
                                className={`policy-link text-sm font-medium px-2 py-1 rounded ${isDark ? 'text-blue-300 hover:text-blue-200 hover:bg-blue-900/30' : 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'
                                    } transition-all duration-300`}
                            >
                                Terms & Conditions
                            </Link> */}
                            <Link
                                to="/referencet&c"
                                className={`policy-link text-sm font-medium px-2 py-1 rounded ${isDark ? 'text-blue-300 hover:text-blue-200 hover:bg-blue-900/30' : 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'
                                    } transition-all duration-300`}
                            >
                                Reference Bounce T&C
                            </Link>
                            <Link
                                to="/refundt&c"
                                className={`policy-link text-sm font-medium px-2 py-1 rounded ${isDark ? 'text-blue-300 hover:text-blue-200 hover:bg-blue-900/30' : 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'
                                    } transition-all duration-300`}
                            >
                                Terms & Conditions
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    )
}

export default Footer