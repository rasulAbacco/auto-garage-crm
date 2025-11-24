import React, { useState } from 'react';
import { ArrowLeft, FileText, Shield, Users, AlertCircle, CheckCircle, XCircle, CreditCard, Award, Moon, Sun } from 'lucide-react';
import { useTheme } from "../../src/contexts/ThemeContext";   // ✅ use global theme
export default function TermsPage() {
    const { isDark } = useTheme();

    const sections = [
        {
            icon: Users,
            title: "1. Eligibility",
            content: [
                "1.1. The Program is open to all active, paying customers of the Company.",
                "1.2. The referrer must have an active subscription (Standard or Premium)."
            ]
        },
        {
            icon: FileText,
            title: "2. Unique Referral ID",
            content: [
                "2.1. Each customer receives a Unique Referral ID.",
                "2.2. The referred customer must enter this ID during sign-up/purchase.",
                "2.3. Referral ID cannot be applied after the purchase."
            ]
        },
        {
            icon: CheckCircle,
            title: "3. Valid Referral Criteria",
            content: [
                "A referral is valid only if:",
                "• The referred customer is new",
                "• Makes a successful purchase of Standard (₹2,000/month) or Premium (₹3,000/month)",
                "• Keeps the subscription active",
                "• Referrer also maintains an active subscription"
            ]
        },
        {
            icon: Award,
            title: "4. Referral Rewards",
            subsections: [
                {
                    subtitle: "4.1 Monthly Plan Purchases",
                    content: [
                        "• Standard Plan (₹2,000/month): Referrer earns ₹100/month",
                        "• Premium Plan (₹3,000/month): Referrer earns ₹200/month",
                        "",
                        "Rewards continue every month as long as the referred customer renews."
                    ]
                },
                {
                    subtitle: "4.2 Annual Plan Purchases",
                    content: [
                        "If the referred customer purchases a full-year plan upfront, the referrer will receive the entire year's cashback at once:",
                        "",
                        "• Standard Annual Plan: ₹100 × 12 months = ₹1,200",
                        "• Premium Annual Plan: ₹200 × 12 months = ₹2,400",
                        "",
                        "The yearly referral reward is credited one time after the referred customer completes the annual payment."
                    ]
                }
            ]
        },
        {
            icon: CreditCard,
            title: "5. Reward Payout",
            content: [
                "5.1. Monthly referral payouts are issued once per month.",
                "5.2. Annual referral rewards (₹1,200 or ₹2,400) are credited after verification of the annual purchase.",
                "5.3. Payments are made via UPI/wallet/bank transfer.",
                "5.4. Minimum payout: ₹100."
            ]
        },
        {
            icon: Users,
            title: "6. Unlimited Referrals",
            content: [
                "6.1. There is no limit to the number of referrals a customer can make.",
                "6.2. Rewards increase with each active referred customer.",
                "",
                "Example:",
                "• 10 monthly Standard referrals = ₹1,000/month",
                "• 10 monthly Premium referrals = ₹2,000/month",
                "• Annual referrals are added separately"
            ]
        },
        {
            icon: XCircle,
            title: "7. Fraud & Misuse Prevention",
            content: [
                "Rewards will be cancelled in cases of:",
                "• Self-referring",
                "• Fake or duplicate customer accounts",
                "• Manipulated referrals",
                "• Misuse of referral codes",
                "• Violation of company policies",
                "",
                "The company may suspend or terminate referral rights if misuse is detected."
            ]
        },
        {
            icon: AlertCircle,
            title: "8. Program Modification",
            content: [
                "The Company may modify, pause, or discontinue the referral program at any time.",
                "Approved and active referrals will continue unless fraudulent activity is found."
            ]
        },
        {
            icon: Shield,
            title: "9. No Agency Relationship",
            content: [
                "Participation does not create partnership, employment, or agency rights."
            ]
        },
        {
            icon: FileText,
            title: "10. Final Decision",
            content: [
                "All decisions on eligibility, payouts, and disputes are made by the Company and are final."
            ]
        }
    ];

    return (

        // <div className={`min-h-screen ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className={`min-h-screen ${isDark ? 'text-white' : 'text-gray-900'} pt-[5%]`}>
           
            {/* Header */}
            <section className="relative px-6 py-16">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 max-w-4xl mx-auto">

                    <div className="text-center space-y-4 mb-12 mt-[100px]">
                        {/* <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm font-medium">Referral Program</span>
                        </div> */}

                        <h1 className="text-4xl lg:text-5xl font-bold">
                            <span className={`  ${isDark ? 'text-gray-400' : 'text-gray-900'}`}>Terms & </span>
                            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                                Conditions
                            </span>
                        </h1>

                        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Effective Date: November 18, 2025
                        </p>
                    </div>

                    <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200 shadow-lg'
                        }`}>
                        <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                            These Terms & Conditions apply to the referral reward program offered by{' '}
                            <span className="font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                                Abacco Technology DBA The Motor Desk
                            </span>{' '}
                            By participating, you agree to the following terms.
                        </p>
                    </div>
                </div>
            </section>

            {/* Terms Sections */}
            <section className="px-6 pb-20">
                <div className="max-w-4xl mx-auto space-y-6">
                    {sections.map((section, index) => {
                        const Icon = section.icon;
                        return (
                            <div
                                key={index}
                                className={`p-8 rounded-2xl transition-all ${isDark
                                        ? 'bg-gray-900 border border-gray-800 hover:border-gray-700'
                                        : 'bg-white border border-gray-200 shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {section.title}
                                        </h2>

                                        {section.content && (
                                            <div className={`space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {section.content.map((line, i) => (
                                                    <p key={i} className={line === '' ? 'h-2' : ''}>
                                                        {line}
                                                    </p>
                                                ))}
                                            </div>
                                        )}

                                        {section.subsections && section.subsections.map((subsection, subIndex) => (
                                            <div key={subIndex} className="space-y-2 mt-4">
                                                <h3 className={`text-lg font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'
                                                    }`}>
                                                    {subsection.subtitle}
                                                </h3>
                                                <div className={`space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    {subsection.content.map((line, i) => (
                                                        <p key={i} className={line === '' ? 'h-2' : ''}>
                                                            {line}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>




            
        </div>
    );
}