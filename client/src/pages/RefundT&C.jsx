import React, { useState, useEffect } from 'react';
import {
    Shield, FileText, Clock, CreditCard, AlertTriangle,
    Ban, User, Lock, Copyright, AlertCircle, RefreshCw,
    Mail, Globe, Phone, CheckCircle, Sparkles, ArrowRight
} from 'lucide-react';
import { useTheme } from "../contexts/ThemeContext";
import Footer from '../components/Footer';

const TermsAndConditions = () => {
    const [activeSection, setActiveSection] = useState(0);
    const [scrollProgress, setScrollProgress] = useState(0);
    const { isDark } = useTheme();

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const progress = (scrollPosition / (documentHeight - windowHeight)) * 100;
            setScrollProgress(progress);

            const sections = document.querySelectorAll('section[id]');
            sections.forEach((section, index) => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (scrollPosition >= sectionTop - 150 && scrollPosition < sectionTop + sectionHeight - 150) {
                    setActiveSection(index);
                }
            });
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (index) => {
        const section = document.querySelectorAll('section[id]')[index];
        if (section) {
            window.scrollTo({
                top: section.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    };

    const sections = [
        { id: "acceptance", title: "Acceptance", icon: CheckCircle, color: "from-blue-500 to-cyan-500" },
        { id: "service", title: "Service", icon: FileText, color: "from-emerald-500 to-teal-500" },
        { id: "trial", title: "Trial Period", icon: Clock, color: "from-amber-500 to-orange-500" },
        { id: "subscription", title: "Billing", icon: CreditCard, color: "from-purple-500 to-pink-500" },
        { id: "refund", title: "Refunds", icon: AlertTriangle, color: "from-red-500 to-rose-500", important: true },
        { id: "cancellation", title: "Cancellation", icon: Ban, color: "from-indigo-500 to-blue-500" },
        { id: "responsibilities", title: "Responsibilities", icon: User, color: "from-fuchsia-500 to-purple-500" },
        { id: "data", title: "Privacy", icon: Lock, color: "from-teal-500 to-cyan-500" },
        { id: "intellectual", title: "IP Rights", icon: Copyright, color: "from-orange-500 to-red-500" },
        { id: "liability", title: "Liability", icon: AlertCircle, color: "from-yellow-500 to-amber-500" },
        { id: "modifications", title: "Updates", icon: RefreshCw, color: "from-cyan-500 to-blue-500" },
        { id: "contact", title: "Contact", icon: Phone, color: "from-blue-500 to-indigo-500" }
    ];

    const SectionCard = ({ section, children, index }) => {
        const Icon = section.icon;
        return (
            <section
                id={section.id}
                className={`group relative overflow-hidden rounded-3xl backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] ${isDark
                    ? 'bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gray-700/50'
                    : 'bg-white/90 border border-gray-200 shadow-xl'
                    } ${section.important ? 'ring-2 ring-red-500/50 shadow-2xl shadow-red-500/20' : ''}`}
            >
                <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                <div className="relative p-8">
                    <div className="flex items-start gap-6">
                        <div className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-lg shadow-black/20`}>
                            <Icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {index + 1}. {section.title}
                                </h2>
                                {section.important && (
                                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold uppercase tracking-wider animate-pulse">
                                        Important
                                    </span>
                                )}
                            </div>
                            <div className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark
            ? 'bg-gray-950'
            : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30'
            }`}>
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-1/2 -right-1/2 w-full h-full rounded-full blur-3xl opacity-20 ${isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-blue-400 to-purple-400'
                    }`}></div>
                <div className={`absolute -bottom-1/2 -left-1/2 w-full h-full rounded-full blur-3xl opacity-20 ${isDark ? 'bg-gradient-to-br from-cyan-600 to-pink-600' : 'bg-gradient-to-br from-cyan-400 to-pink-400'
                    }`}></div>
            </div>

            {/* Progress Bar */}
            <div className="fixed top-0 left-0 w-full h-1 bg-gray-200/20 dark:bg-gray-800/20 z-50 backdrop-blur-sm">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 shadow-lg shadow-purple-500/50"
                    style={{ width: `${scrollProgress}%` }}
                ></div>
            </div>

            {/* Sticky Navigation */}
            <div className={`sticky top-0 z-40 backdrop-blur-xl transition-all duration-300 ${isDark ? 'bg-gray-900/80' : 'bg-white/80'
                } border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} shadow-lg`}>
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex overflow-x-auto gap-2 scrollbar-hide pb-2">
                        {sections.map((section, index) => {
                            const Icon = section.icon;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(index)}
                                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${activeSection === index
                                        ? `bg-gradient-to-r ${section.color} text-white shadow-lg scale-105`
                                        : isDark
                                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" strokeWidth={2} />
                                    <span className="text-sm">{section.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-20">
                {/* Hero Header */}
                <div className="text-center mb-20">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-0.5 mb-8 shadow-2xl shadow-purple-500/30 animate-pulse">
                        <div className={`w-full h-full rounded-3xl ${isDark ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center`}>
                            <Shield className="w-12 h-12 text-purple-500" strokeWidth={2} />
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
                        <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            Terms & Conditions
                        </h1>
                        <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
                    </div>
                    <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Last updated: November 21, 2025
                    </p>
                </div>

                {/* Welcome Card */}
                <div className={`rounded-3xl backdrop-blur-xl p-10 mb-16 border transition-all duration-500 hover:scale-[1.01] ${isDark
                    ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/30'
                    : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'
                    } shadow-2xl`}>
                    <div className="flex items-start gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <AlertCircle className="w-8 h-8 text-white" strokeWidth={2} />
                        </div>
                        <div>
                            <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Welcome to <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">TheMotorDesk</span>
                            </h2>
                            <p className={`text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                By accessing or using our platform, you agree to these Terms and Conditions. Please read them carefully before proceeding.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Terms Sections */}
                <div className="space-y-8">
                    <SectionCard section={sections[0]} index={0}>
                        <p className="mb-4 text-lg">By creating an account or using TheMotorDesk.com, you confirm that you:</p>
                        <ul className="space-y-3 ml-6">
                            {['Have read and understood these Terms', 'Agree to be bound by them', 'Are authorized to use the service'].map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <ArrowRight className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4 text-lg">If you do not agree, please discontinue use immediately.</p>
                    </SectionCard>

                    <SectionCard section={sections[1]} index={1}>
                        <p className="text-lg">
                            TheMotorDesk provides an online platform offering automotive tools, data services, and software features.
                            We may update or modify the Services at any time without prior notice.
                        </p>
                    </SectionCard>

                    <SectionCard section={sections[2]} index={2}>
                        <div className={`rounded-2xl p-6 mb-4 ${isDark ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'}`}>
                            <p className="text-2xl font-bold text-transparent bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text mb-2">
                                7-Day Free Trial
                            </p>
                            <p className="text-lg">Experience full platform access with zero commitment!</p>
                        </div>
                        <ul className="space-y-3 ml-6">
                            {['Full access to all features', 'Cancel anytime during trial', 'No payment required unless you continue'].map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
                                    <span className="text-lg">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </SectionCard>

                    <SectionCard section={sections[3]} index={3}>
                        <p className="mb-4 text-lg">After your 7-day trial:</p>
                        <ul className="space-y-3 ml-6">
                            {[
                                'Your selected subscription plan activates automatically',
                                'Payment method is charged according to your plan',
                                'All fees are billed in advance'
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <CreditCard className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
                                    <span className="text-lg">{item}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4 text-lg">
                            By subscribing, you authorize automatic charges until cancellation.
                        </p>
                    </SectionCard>

                    <SectionCard section={sections[4]} index={4}>
                        <div className={`rounded-2xl p-6 mb-6 ${isDark ? 'bg-red-500/10 border-2 border-red-500/50' : 'bg-red-50 border-2 border-red-300'}`}>
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" strokeWidth={2.5} />
                                <p className="text-2xl font-black text-transparent bg-gradient-to-r from-red-500 to-rose-500 bg-clip-text uppercase tracking-wide">
                                    No Refunds After Trial Period
                                </p>
                            </div>
                        </div>
                        <p className="text-lg mb-4 font-medium">
                            Cancel before your trial ends to avoid charges.
                        </p>
                        <p className="text-lg mb-4">Once the trial ends and subscription is charged:</p>
                        <ul className="space-y-3 ml-6">
                            {[
                                'Payments are non-refundable',
                                'No partial refunds for unused time',
                                'Refund requests after 7 days will not be accepted'
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <Ban className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                                    <span className="text-lg font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                        <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <p className="text-lg">
                                <strong>Error charges?</strong> Contact support within <span className="text-red-500 font-bold">48 hours</span> of the charge.
                            </p>
                        </div>
                    </SectionCard>

                    <SectionCard section={sections[5]} index={5}>
                        <p className="mb-4 text-lg">You can cancel anytime from your dashboard.</p>
                        <p className="text-lg mb-4">Upon cancellation:</p>
                        <ul className="space-y-3 ml-6">
                            {[
                                'Subscription remains active until billing cycle ends',
                                'No refunds for remaining days'
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                                    <span className="text-lg">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </SectionCard>

                    <SectionCard section={sections[6]} index={6}>
                        <p className="text-lg mb-4">You agree NOT to:</p>
                        <ul className="space-y-3 ml-6">
                            {[
                                'Share your login credentials',
                                'Misuse platform data',
                                'Use the service for illegal purposes'
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <Ban className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDark ? 'text-fuchsia-400' : 'text-fuchsia-500'}`} />
                                    <span className="text-lg">{item}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4 text-lg">Violating accounts may be suspended.</p>
                    </SectionCard>

                    <SectionCard section={sections[7]} index={7}>
                        <p className="text-lg">
                            Your personal information is handled according to our Privacy Policy, which explains how we collect, use, and protect your data.
                        </p>
                    </SectionCard>

                    <SectionCard section={sections[8]} index={8}>
                        <p className="text-lg">
                            All content, tools, software, designs, and data on TheMotorDesk are our exclusive property. Unauthorized copying is strictly prohibited.
                        </p>
                    </SectionCard>

                    <SectionCard section={sections[9]} index={9}>
                        <p className="text-lg">
                            TheMotorDesk is provided 'as-is' without warranties. We are not liable for data losses, service interruptions, errors, or damages arising from platform use.
                        </p>
                    </SectionCard>

                    <SectionCard section={sections[10]} index={10}>
                        <p className="text-lg">
                            We may update these Terms at any time. Continued use of the service means you accept the updated Terms.
                        </p>
                    </SectionCard>

                    <SectionCard section={sections[11]} index={11}>
                        <p className="mb-6 text-lg">For questions or support, please reach out:</p>
                        <div className="space-y-4">
                            {[
                                { icon: Mail, label: 'Email', value: 'support@themotordesk.com', color: 'from-blue-500 to-cyan-500' },
                                { icon: Globe, label: 'Website', value: 'themotordesk.com', link: 'https://themotordesk.com/', color: 'from-purple-500 to-pink-500' }
                            ].map((contact, i) => {
                                const Icon = contact.icon;
                                return (
                                    <div key={i} className={`p-5 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                                        }`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${contact.color} flex items-center justify-center shadow-lg`}>
                                                <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{contact.label}</p>
                                                {contact.link ? (
                                                    <a href={contact.link} target="_blank" rel="noopener noreferrer" className={`text-lg font-semibold bg-gradient-to-r ${contact.color} bg-clip-text text-transparent hover:underline`}>
                                                        {contact.value}
                                                    </a>
                                                ) : (
                                                    <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{contact.value}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </SectionCard>
                </div>

                {/* Footer */}
                <div className={`mt-16 p-8 rounded-3xl backdrop-blur-xl text-center transition-all duration-500 hover:scale-[1.01] ${isDark
                    ? 'bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gray-700/50'
                    : 'bg-white/90 border border-gray-200'
                    } shadow-2xl`}>
                    <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        By using TheMotorDesk, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                    </p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default TermsAndConditions;