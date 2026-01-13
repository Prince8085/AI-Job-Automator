
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScreenWrapper from '../components/ScreenWrapper';
import { useCredits, CREDIT_PLANS, CREDIT_COSTS, CreditDisplay } from '../contexts/CreditContext';
import { processPayment, processDemoPayment, createOrder } from '../services/paymentService';
import { useJobData } from '../contexts/JobDataContext';
import { CheckIcon } from '../components/icons';

const PricingScreen: React.FC = () => {
    const navigate = useNavigate();
    const { addCredits, credits, transactionHistory } = useCredits();
    const { userProfile, showToast } = useJobData();
    const [loading, setLoading] = useState<string | null>(null);
    const demoMode = (import.meta.env.VITE_DEMO_MODE ?? 'true') === 'true';

    const handlePurchase = async (planId: string) => {
        const plan = CREDIT_PLANS.find(p => p.id === planId);
        if (!plan || plan.price === 0) {
            showToast('Free credits already added!', 'info');
            return;
        }

        setLoading(planId);

        try {
            if (demoMode) {
                // Demo mode - simulate payment
                await processDemoPayment(
                    planId,
                    (creditAmount) => {
                        addCredits(creditAmount);
                        showToast(`🎉 ${creditAmount} credits added!`, 'success');
                        setLoading(null);
                    },
                    (error) => {
                        showToast(error, 'error');
                        setLoading(null);
                    }
                );
            } else {
                // Real Razorpay payment
                const order = await createOrder(planId);
                if (!order) {
                    showToast('Failed to create order', 'error');
                    setLoading(null);
                    return;
                }

                await processPayment(
                    order,
                    {
                        name: userProfile.name || 'User',
                        email: userProfile.email || 'user@example.com',
                    },
                    (creditAmount) => {
                        addCredits(creditAmount);
                        showToast(`🎉 ${creditAmount} credits added!`, 'success');
                        setLoading(null);
                    },
                    (error) => {
                        showToast(error, 'error');
                        setLoading(null);
                    }
                );
            }
        } catch (error: any) {
            showToast(error.message || 'Payment failed', 'error');
            setLoading(null);
        }
    };

    return (
        <ScreenWrapper>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold">💳 Buy Credits</h1>
                            <p className="opacity-90 mt-1">One-time purchase • Never expires</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                            <p className="text-sm opacity-80">Your Balance</p>
                            <p className="text-2xl font-bold">{credits} credits</p>
                        </div>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {CREDIT_PLANS.map((plan) => {
                        const isPopular = plan.id === 'pro';
                        const isFree = plan.price === 0;

                        return (
                            <div
                                key={plan.id}
                                className={`
                  relative bg-white rounded-2xl p-5 shadow-lg border-2 transition-all
                  ${isPopular ? 'border-purple-500 scale-[1.02]' : 'border-gray-100'}
                  hover:shadow-xl hover:scale-[1.02]
                `}
                            >
                                {isPopular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-bold text-white">
                                        BEST VALUE
                                    </div>
                                )}

                                <div className="text-center mb-4">
                                    <h3 className="text-lg font-bold text-gray-800">{plan.name}</h3>
                                    <div className="mt-2">
                                        <span className="text-3xl font-black text-gray-900">₹{plan.price}</span>
                                        {!isFree && <span className="text-gray-500 text-sm"> one-time</span>}
                                    </div>
                                    <div className="mt-1 text-purple-600 font-semibold">
                                        {plan.credits} credits
                                    </div>
                                </div>

                                <button
                                    onClick={() => handlePurchase(plan.id)}
                                    disabled={loading === plan.id || isFree}
                                    className={`
                    w-full py-3 rounded-xl font-bold transition-all
                    ${isFree
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : isPopular
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                        }
                    ${loading === plan.id ? 'opacity-70' : ''}
                  `}
                                >
                                    {loading === plan.id ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </span>
                                    ) : isFree ? (
                                        'Already Included'
                                    ) : (
                                        `Buy Now`
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Credit Usage Guide */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">📊 Credit Usage</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(CREDIT_COSTS).map(([action, cost]) => (
                            <div key={action} className="bg-gray-50 rounded-xl p-3 text-center">
                                <p className="text-sm text-gray-600">{action.replace(/_/g, ' ')}</p>
                                <p className="text-xl font-bold text-indigo-600">{cost}</p>
                                <p className="text-xs text-gray-400">credits</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Transaction History */}
                {transactionHistory.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">📜 Recent Transactions</h2>
                        <div className="space-y-2">
                            {transactionHistory.slice(0, 10).map((txn) => (
                                <div key={txn.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <div>
                                        <p className="font-medium text-gray-700">{txn.action.replace(/_/g, ' ')}</p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(txn.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className={`font-bold ${txn.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                                        {txn.type === 'credit' ? '+' : '-'}{txn.amount}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Demo Mode Notice */}
                {demoMode && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                        <p className="text-yellow-800 text-sm">
                            🔔 <strong>Demo Mode:</strong> Payments are simulated. No real charges.
                        </p>
                    </div>
                )}
            </div>
        </ScreenWrapper>
    );
};

export default PricingScreen;
