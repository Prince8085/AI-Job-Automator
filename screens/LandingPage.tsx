
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignInButton, useAuth } from '@clerk/clerk-react';
import { SparklesIcon, CheckIcon } from '../components/icons';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { isSignedIn } = useAuth();
    const demoMode = (import.meta.env.VITE_DEMO_MODE ?? 'true') === 'true';
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

    // Don't auto-redirect - let users view landing page

    const features = [
        { icon: '🔍', title: 'Smart Job Search', desc: 'AI-powered job matching from 1000+ sources worldwide' },
        { icon: '📄', title: 'ATS Resume Builder', desc: 'Generate optimized resumes that pass ATS screening' },
        { icon: '✉️', title: 'Cover Letter AI', desc: 'Personalized cover letters in seconds' },
        { icon: '🎤', title: 'Interview Coach', desc: 'Practice with AI mock interviews' },
        { icon: '📊', title: 'Skills Analysis', desc: 'Identify and bridge skill gaps' },
        { icon: '💰', title: 'Salary Negotiation', desc: 'AI-powered negotiation scripts' },
    ];

    const pricingPlans = [
        {
            id: 'free',
            name: 'Free',
            price: 0,
            credits: 10,
            features: ['10 Free Credits', 'Basic Job Search', 'Profile Setup', 'Limited AI Features'],
            popular: false,
            color: 'from-gray-500 to-gray-600'
        },
        {
            id: 'starter',
            name: 'Starter Pack',
            price: 199,
            credits: 100,
            features: ['100 Credits', 'Unlimited Job Search', 'AI Resume Builder', 'Cover Letters', 'Email Support'],
            popular: false,
            color: 'from-blue-500 to-indigo-600'
        },
        {
            id: 'pro',
            name: 'Pro Pack',
            price: 499,
            credits: 500,
            features: ['500 Credits', 'Everything in Starter', 'Interview Prep', 'Skills Analysis', 'Priority Support'],
            popular: true,
            color: 'from-purple-500 to-pink-600'
        },
        {
            id: 'mega',
            name: 'Mega Pack',
            price: 999,
            credits: 1500,
            features: ['1500 Credits', 'Everything in Pro', 'Career Planning', 'Networking AI', 'Lifetime Access'],
            popular: false,
            color: 'from-orange-500 to-red-600'
        },
    ];

    const creditUsage = [
        { feature: 'Job Search', credits: 1 },
        { feature: 'AI Resume', credits: 5 },
        { feature: 'Cover Letter', credits: 3 },
        { feature: 'Interview Prep', credits: 2 },
        { feature: 'Skills Analysis', credits: 2 },
        { feature: 'Company Brief', credits: 2 },
    ];

    const handleGetStarted = () => {
        if (demoMode) {
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/3 -left-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute bottom-20 right-1/4 w-60 h-60 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-500" />
            </div>

            {/* Navigation */}
            <nav className="relative z-50 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-2 rounded-xl">
                            <SparklesIcon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">AI Job Automator</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="#pricing" className="text-white/80 hover:text-white transition">Pricing</a>
                        <a href="#features" className="text-white/80 hover:text-white transition">Features</a>
                        {demoMode ? (
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-6 py-2 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition"
                            >
                                Try Demo
                            </button>
                        ) : (
                            <SignInButton mode="modal">
                                <button className="px-6 py-2 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-100 transition">
                                    Sign In
                                </button>
                            </SignInButton>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 px-6 pt-16 pb-24">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm mb-8">
                        ✨ Free 10 Credits to Start • No Credit Card Required
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
                        Land Your Dream Job
                        <span className="block bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 bg-clip-text text-transparent">
                            3x Faster with AI
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-indigo-200 mb-10 max-w-2xl mx-auto">
                        AI-powered job search, resume building, interview prep, and more.
                        Used by 10,000+ job seekers in India.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                        <button
                            onClick={handleGetStarted}
                            className="group px-10 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
                        >
                            🚀 Start Free - 10 Credits
                        </button>
                        <a
                            href="#download"
                            className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition"
                        >
                            📱 Download APK
                        </a>
                    </div>

                    <p className="text-indigo-300 text-sm">
                        ✓ Works on Mobile & Desktop • ✓ Hindi + English Support • ✓ UPI Payments
                    </p>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative z-10 px-6 py-20 bg-black/20">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
                        Everything You Need to Get Hired
                    </h2>
                    <p className="text-indigo-300 text-center mb-12 max-w-2xl mx-auto">
                        Powered by Google's Gemini AI - the smartest job hunting assistant
                    </p>

                    <div className="grid md:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/20 hover:border-white/30 transition-all hover:scale-105"
                            >
                                <span className="text-4xl block mb-4">{feature.icon}</span>
                                <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
                                <p className="text-indigo-300 text-sm">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Credit Usage */}
            <section className="relative z-10 px-6 py-16">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-white text-center mb-8">
                        💳 Credit Usage Guide
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {creditUsage.map((item) => (
                            <div key={item.feature} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                                <p className="text-white font-medium">{item.feature}</p>
                                <p className="text-2xl font-bold text-yellow-400">{item.credits} credits</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="relative z-10 px-6 py-20">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
                        💰 Buy Credits - One Time Purchase
                    </h2>
                    <p className="text-indigo-300 text-center mb-12 max-w-2xl mx-auto">
                        No monthly fees! Buy credits once, use them anytime. Credits never expire.
                    </p>

                    <div className="grid md:grid-cols-4 gap-6">
                        {pricingPlans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`
                  relative bg-white/10 backdrop-blur-md rounded-3xl p-6 border 
                  ${plan.popular ? 'border-yellow-400 scale-105' : 'border-white/10'}
                  hover:border-white/30 transition-all
                `}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-xs font-bold text-gray-900">
                                        MOST POPULAR
                                    </div>
                                )}

                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white text-xl font-bold mb-4`}>
                                    {plan.credits > 1000 ? '∞' : plan.credits}
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>

                                <div className="mb-4">
                                    <span className="text-3xl font-black text-white">₹{plan.price}</span>
                                    {plan.price > 0 && <span className="text-indigo-300 text-sm"> one-time</span>}
                                </div>

                                <ul className="space-y-2 mb-6">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center text-sm text-indigo-200">
                                            <CheckIcon className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => {
                                        setSelectedPlan(plan.id);
                                        if (plan.price === 0) {
                                            navigate('/dashboard');
                                        } else {
                                            navigate('/pricing');
                                        }
                                    }}
                                    className={`
                    w-full py-3 rounded-xl font-bold transition-all
                    ${plan.popular
                                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 hover:shadow-lg'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        }
                  `}
                                >
                                    {plan.price === 0 ? 'Start Free' : 'Buy Now'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Download Section */}
            <section id="download" className="relative z-10 px-6 py-20 bg-black/20">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        📱 Download Android App
                    </h2>
                    <p className="text-indigo-300 mb-8">
                        Use AI Job Automator on your phone. Same features, mobile experience.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl shadow-xl hover:scale-105 transition-all">
                            📥 Download APK (15 MB)
                        </button>
                        <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/20 transition">
                            🍎 iOS Coming Soon
                        </button>
                    </div>

                    <p className="text-indigo-400 text-sm mt-6">
                        Version 1.0.0 • Requires Android 8.0+
                    </p>
                </div>
            </section>

            {/* FAQ */}
            <section className="relative z-10 px-6 py-20">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-white text-center mb-12">
                        ❓ Frequently Asked Questions
                    </h2>

                    <div className="space-y-4">
                        {[
                            { q: 'Do credits expire?', a: 'No! Your credits never expire. Use them whenever you want.' },
                            { q: 'Can I get a refund?', a: 'Yes, within 7 days if unused credits remain.' },
                            { q: 'Is my data safe?', a: 'Absolutely. We use Clerk authentication and never share your data.' },
                            { q: 'Which payment methods are supported?', a: 'UPI, Credit/Debit Cards, Net Banking, Wallets via Razorpay.' },
                        ].map((faq, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                                <h3 className="text-white font-bold mb-2">{faq.q}</h3>
                                <p className="text-indigo-300 text-sm">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 px-6 py-12 border-t border-white/10">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-2 rounded-xl">
                                <SparklesIcon className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-white font-bold">AI Job Automator</span>
                        </div>

                        <div className="flex gap-6 text-indigo-300 text-sm">
                            <a href="#" className="hover:text-white transition">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition">Terms of Service</a>
                            <a href="#" className="hover:text-white transition">Contact</a>
                        </div>

                        <p className="text-indigo-400 text-sm">
                            Made with ❤️ in India • © 2024
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
