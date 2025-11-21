import React, { useState, useEffect } from 'react';
import {
    Gift, TrendingUp, Award, Users, FileText, CheckCircle,
    XCircle, CreditCard, Shield, AlertCircle, Zap, Star,
    Sparkles, ArrowRight, DollarSign, Calendar, Repeat,
    Target, Rocket, Crown, BadgeCheck
} from 'lucide-react';
import { useTheme } from "../contexts/ThemeContext";
import Footer from '../components/Footer.jsx';

const ReferralProgram = () => {
    const { isDark } = useTheme();
    const [activeTab, setActiveTab] = useState('monthly');
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const plans = [
        {
            name: "Standard Plan",
            monthly: "₹2,000",
            annual: "₹1,200",
            reward: "₹100",
            color: "from-blue-500 to-cyan-500",
            icon: Star,
            features: ["Basic Features", "Monthly Rewards", "Standard Support"]
        },
        {
            name: "Premium Plan",
            monthly: "₹3,000",
            annual: "₹2,400",
            reward: "₹200",
            color: "from-purple-500 to-pink-500",
            icon: Crown,
            features: ["All Features", "Higher Rewards", "Priority Support"],
            popular: true
        }
    ];

    const stats = [
        {
            icon: DollarSign,
            value: "₹100-200",
            label: "Per Referral Monthly",
            color: "from-emerald-500 to-teal-500"
        },
        {
            icon: Repeat,
            value: "Unlimited",
            label: "Referrals Allowed",
            color: "from-purple-500 to-pink-500"
        },
        {
            icon: Zap,
            value: "₹1,200-2,400",
            label: "Annual Bonus",
            color: "from-orange-500 to-red-500"
        }
    ];

    const sections = [
        {
            icon: Users,
            title: "Eligibility",
            color: "from-blue-500 to-cyan-500",
            points: [
                "Open to all active, paying customers",
                "Must have an active subscription (Standard or Premium)",
                "Maintain good standing with the platform"
            ]
        },
        {
            icon: FileText,
            title: "Unique Referral ID",
            color: "from-purple-500 to-pink-500",
            points: [
                "Each customer receives a unique referral ID",
                "ID must be entered during sign-up/purchase",
                "Cannot be applied after purchase completion"
            ]
        },
        {
            icon: CheckCircle,
            title: "Valid Referral Criteria",
            color: "from-emerald-500 to-teal-500",
            points: [
                "Referred customer must be new to the platform",
                "Successful purchase of Standard or Premium plan",
                "Both referrer and referee maintain active subscriptions",
                "No self-referrals or fraudulent accounts"
            ]
        },
        {
            icon: Award,
            title: "Referral Rewards",
            color: "from-amber-500 to-orange-500",
            complex: true,
            subsections: [
                {
                    title: "Monthly Plans",
                    points: [
                        "Standard Plan: Earn ₹100/month",
                        "Premium Plan: Earn ₹200/month",
                        "Rewards continue every month with renewals"
                    ]
                },
                {
                    title: "Annual Plans",
                    points: [
                        "Standard Annual: ₹1,200 upfront",
                        "Premium Annual: ₹2,400 upfront",
                        "One-time payment after annual purchase verification"
                    ]
                }
            ]
        },
        {
            icon: CreditCard,
            title: "Reward Payout",
            color: "from-pink-500 to-rose-500",
            points: [
                "Monthly payouts issued once per month",
                "Annual rewards credited after verification",
                "Payment via UPI/wallet/bank transfer",
                "Minimum payout threshold: ₹100"
            ]
        },
        {
            icon: TrendingUp,
            title: "Unlimited Referrals",
            color: "from-indigo-500 to-purple-500",
            points: [
                "No limit on number of referrals",
                "Rewards multiply with each active referee",
                "Example: 10 Standard referrals = ₹1,000/month",
                "Example: 10 Premium referrals = ₹2,000/month"
            ]
        },
        {
            icon: XCircle,
            title: "Fraud Prevention",
            color: "from-red-500 to-rose-500",
            warning: true,
            points: [
                "No self-referrals allowed",
                "No fake or duplicate accounts",
                "No manipulated referrals or misuse of codes",
                "Violation results in account suspension"
            ]
        },
        {
            icon: AlertCircle,
            title: "Program Modifications",
            color: "from-yellow-500 to-amber-500",
            points: [
                "Company may modify program terms anytime",
                "Active referrals continue unless fraud detected",
                "Notification provided for major changes"
            ]
        }
    ];

    return (
        <div className={`min-h-screen transition-colors duration-300 mt-[5%] ${isDark ? 'bg-gray-950' : 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30'
            }`}>
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className={`absolute w-[800px] h-[800px] rounded-full blur-3xl opacity-20 transition-transform duration-1000 ${isDark ? 'bg-gradient-to-br from-emerald-600 to-teal-600' : 'bg-gradient-to-br from-emerald-400 to-teal-400'
                        }`}
                    style={{
                        top: '10%',
                        right: '10%',
                        transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.15}px)`
                    }}
                ></div>
                <div
                    className={`absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-20 transition-transform duration-1000 ${isDark ? 'bg-gradient-to-br from-purple-600 to-pink-600' : 'bg-gradient-to-br from-purple-400 to-pink-400'
                        }`}
                    style={{
                        bottom: '20%',
                        left: '5%',
                        transform: `translate(${-scrollY * 0.08}px, ${scrollY * 0.12}px)`
                    }}
                ></div>
            </div>

            {/* Theme Toggle */}


            <div className="relative">
                {/* Hero Section */}
                <section className="relative px-6 pt-32 pb-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center space-y-8 mb-16">
                            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-2xl shadow-emerald-500/30 animate-pulse">
                                <Sparkles className="w-5 h-5" />
                                <span className="font-bold">Referral Program</span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-black leading-tight">
                                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Earn Money </span>
                                <br />
                                <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                                    Sharing Success
                                </span>
                            </h1>

                            <p className={`text-2xl max-w-3xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Get paid every month your friends stay subscribed. Unlimited referrals, unlimited earnings!
                            </p>

                            <div className="flex items-center justify-center gap-4 flex-wrap">
                                <button className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-110 flex items-center gap-2">
                                    Get Started
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button className={`px-8 py-4 rounded-2xl backdrop-blur-xl font-bold text-lg transition-all duration-300 hover:scale-105 ${isDark
                                    ? 'bg-gray-800/50 text-white hover:bg-gray-700/50'
                                    : 'bg-white/50 text-gray-900 hover:bg-white/80'
                                    } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                    Learn More
                                </button>
                            </div>

                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                Effective Date: November 18, 2025
                            </p>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                            {stats.map((stat, index) => {
                                const Icon = stat.icon;
                                return (
                                    <div
                                        key={index}
                                        className={`group relative overflow-hidden rounded-3xl backdrop-blur-xl transition-all duration-500 hover:scale-105 ${isDark
                                            ? 'bg-gray-900/50 border border-gray-800'
                                            : 'bg-white/50 border border-gray-200 shadow-xl'
                                            }`}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                                        <div className="relative p-8">
                                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg`}>
                                                <Icon className="w-8 h-8 text-white" strokeWidth={2} />
                                            </div>
                                            <div className={`text-4xl font-black mb-2 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>
                                                {stat.value}
                                            </div>
                                            <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {stat.label}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Introduction */}
                        <div className={`rounded-3xl backdrop-blur-xl p-10 text-center border ${isDark
                            ? 'bg-gray-900/50 border-gray-800'
                            : 'bg-white/50 border-gray-200 shadow-xl'
                            }`}>
                            <p className={`text-xl leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                Welcome to the <span className="font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Abacco Technology DBA The Motor Desk</span> referral program.
                                Share the love, earn rewards, and grow together! 🚀
                            </p>
                        </div>
                    </div>
                </section>

                {/* Earning Potential Section */}
                <section className="px-6 py-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-6">
                                <Target className="w-4 h-4" />
                                <span className="font-medium">Your Potential</span>
                            </div>
                            <h2 className="text-5xl font-black mb-4">
                                <span className="bg-gradient-to-r from-emerald-500 to-purple-500 bg-clip-text text-transparent">
                                    Earning Possibilities
                                </span>
                            </h2>
                            <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Choose your path and maximize your rewards
                            </p>
                        </div>

                        {/* Tab Selector */}
                        <div className="flex justify-center mb-12">
                            <div className={`inline-flex rounded-2xl p-2 backdrop-blur-xl ${isDark ? 'bg-gray-900/50' : 'bg-white/50'
                                } border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                                <button
                                    onClick={() => setActiveTab('monthly')}
                                    className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'monthly'
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                                        : isDark ? 'text-gray-400' : 'text-gray-600'
                                        }`}
                                >
                                    <Repeat className="w-4 h-4" />
                                    Monthly Plans
                                </button>
                                <button
                                    onClick={() => setActiveTab('annual')}
                                    className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'annual'
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                                        : isDark ? 'text-gray-400' : 'text-gray-600'
                                        }`}
                                >
                                    <Calendar className="w-4 h-4" />
                                    Annual Plans
                                </button>
                            </div>
                        </div>

                        {/* Monthly Plans */}
                        {activeTab === 'monthly' && (
                            <div className="space-y-8 animate-fadeIn">
                                <div className={`rounded-3xl backdrop-blur-xl p-8 border text-center ${isDark
                                    ? 'bg-emerald-900/20 border-emerald-500/30'
                                    : 'bg-emerald-50/50 border-emerald-200'
                                    }`}>
                                    <Repeat className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-emerald-500 mb-2">Recurring Monthly Rewards</h3>
                                    <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Earn every month as long as your referrals stay subscribed
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {plans.map((plan, index) => {
                                        const Icon = plan.icon;
                                        return (
                                            <div
                                                key={index}
                                                className={`group relative overflow-hidden rounded-3xl backdrop-blur-xl transition-all duration-500 hover:scale-105 ${isDark
                                                    ? 'bg-gray-900/50 border-2 border-gray-800 hover:border-gray-700'
                                                    : 'bg-white/50 border-2 border-gray-200 hover:border-gray-300 shadow-2xl'
                                                    } ${plan.popular ? 'ring-4 ring-purple-500/50' : ''}`}
                                            >
                                                <div className={`absolute inset-0 bg-gradient-to-br ${plan.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                                                {plan.popular && (
                                                    <div className="absolute top-4 right-4 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold uppercase">
                                                        Popular
                                                    </div>
                                                )}
                                                <div className="relative p-8">
                                                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6 shadow-xl`}>
                                                        <Icon className="w-10 h-10 text-white" strokeWidth={2} />
                                                    </div>
                                                    <h4 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {plan.name}
                                                    </h4>
                                                    <p className={`text-lg mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {plan.monthly}/month
                                                    </p>
                                                    <div className={`rounded-2xl p-6 mb-6 ${isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'
                                                        }`}>
                                                        <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            You Earn Per Month
                                                        </p>
                                                        <p className={`text-4xl font-black bg-gradient-to-br ${plan.color} bg-clip-text text-transparent`}>
                                                            {plan.reward}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {plan.features.map((feature, i) => (
                                                            <div key={i} className="flex items-center gap-3">
                                                                <BadgeCheck className={`w-5 h-5 flex-shrink-0 bg-gradient-to-br ${plan.color} bg-clip-text text-transparent`} />
                                                                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{feature}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Annual Plans */}
                        {activeTab === 'annual' && (
                            <div className="space-y-8 animate-fadeIn">
                                <div className={`rounded-3xl backdrop-blur-xl p-8 border text-center ${isDark
                                    ? 'bg-purple-900/20 border-purple-500/30'
                                    : 'bg-purple-50/50 border-purple-200'
                                    }`}>
                                    <Zap className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-purple-500 mb-2">Upfront Annual Rewards</h3>
                                    <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Get the entire year's cashback in one payment
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {plans.map((plan, index) => {
                                        const Icon = plan.icon;
                                        return (
                                            <div
                                                key={index}
                                                className={`group relative overflow-hidden rounded-3xl backdrop-blur-xl transition-all duration-500 hover:scale-105 ${isDark
                                                    ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-purple-500/30'
                                                    : 'bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-2xl'
                                                    }`}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                                                <div className="relative p-8">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-xl`}>
                                                            <Icon className="w-8 h-8 text-white" strokeWidth={2} />
                                                        </div>
                                                        <div className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold">
                                                            Annual
                                                        </div>
                                                    </div>
                                                    <h4 className={`text-3xl font-black mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {plan.name}
                                                    </h4>
                                                    <div className="flex items-end justify-between">
                                                        <div>
                                                            <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                One-Time Payout
                                                            </p>
                                                            <p className="text-5xl font-black bg-gradient-to-br from-purple-500 to-pink-500 bg-clip-text text-transparent">
                                                                ₹{plan.annual}
                                                            </p>
                                                        </div>
                                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                                            <Rocket className="w-8 h-8 text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Terms Section */}
                <section className="px-6 py-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-5xl font-black mb-4">
                                <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                                    Program Guidelines
                                </span>
                            </h2>
                            <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Everything you need to know
                            </p>
                        </div>

                        <div className="grid gap-6">
                            {sections.map((section, index) => {
                                const Icon = section.icon;
                                return (
                                    <div
                                        key={index}
                                        className={`group rounded-3xl backdrop-blur-xl transition-all duration-500 hover:scale-[1.01] ${isDark
                                            ? 'bg-gray-900/50 border border-gray-800 hover:border-gray-700'
                                            : 'bg-white/50 border border-gray-200 hover:border-gray-300 shadow-xl'
                                            } ${section.warning ? 'ring-2 ring-red-500/50' : ''}`}
                                    >
                                        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                                        <div className="relative p-8">
                                            <div className="flex items-start gap-6">
                                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${section.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                                    <Icon className="w-8 h-8 text-white" strokeWidth={2} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                            {index + 1}. {section.title}
                                                        </h3>
                                                        {section.warning && (
                                                            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold uppercase">
                                                                Important
                                                            </span>
                                                        )}
                                                    </div>

                                                    {section.complex ? (
                                                        <div className="space-y-6">
                                                            {section.subsections.map((sub, subIndex) => (
                                                                <div key={subIndex}>
                                                                    <h4 className={`text-lg font-bold mb-3 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                                                                        {sub.title}
                                                                    </h4>
                                                                    <ul className="space-y-2">
                                                                        {sub.points.map((point, i) => (
                                                                            <li key={i} className="flex items-start gap-3">
                                                                                <ArrowRight className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
                                                                                <span className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{point}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <ul className="space-y-3">
                                                            {section.points.map((point, i) => (
                                                                <li key={i} className="flex items-start gap-3">
                                                                    <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 bg-gradient-to-br ${section.color} bg-clip-text text-transparent`} />
                                                                    <span className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{point}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="px-6 py-20">
                    <div className="max-w-4xl mx-auto">
                        <div className={`relative overflow-hidden rounded-3xl backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] ${isDark
                            ? 'bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-2 border-emerald-500/30'
                            : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 shadow-2xl'
                            }`}>
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-10"></div>
                            <div className="relative p-12 text-center">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                                    <Gift className="w-10 h-10 text-white" strokeWidth={2} />
                                </div>
                                <h3 className="text-4xl font-black mb-4 bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                                    Ready to Start Earning?
                                </h3>
                                <p className={`text-xl mb-8 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Get your unique referral code and start sharing today!
                                </p>
                                <button className="group px-10 py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xl shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-110 flex items-center gap-3 mx-auto">
                                    Get Your Referral Code
                                    <Rocket className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
            <Footer />
        </div>
    );
};

export default ReferralProgram;