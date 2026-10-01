// Razorpay Payment Service
// For India-based payments (UPI, Cards, Wallets)

import { CREDIT_PLANS } from '../contexts/CreditContext';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export interface PaymentOrder {
    orderId: string;
    amount: number;
    currency: string;
    planId: string;
    credits: number;
}

export interface PaymentResult {
    success: boolean;
    paymentId?: string;
    orderId?: string;
    error?: string;
}

// Razorpay Test Key (replace with live key in production)
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_DEMO_KEY';

// Load Razorpay script
export const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Create order via backend (falls back to a mock order when the
// backend / Razorpay keys are unavailable so demo mode keeps working)
export const createOrder = async (planId: string): Promise<PaymentOrder | null> => {
    const plan = CREDIT_PLANS.find(p => p.id === planId);
    if (!plan || plan.price === 0) return null;

    try {
        const res = await fetch(`${API_BASE}/payments/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planId }),
        });
        if (res.ok) {
            const data = await res.json();
            if (data?.success && data?.data?.orderId) {
                return data.data as PaymentOrder;
            }
        }
        console.warn('Backend order creation failed, using mock order');
    } catch (error) {
        console.warn('Backend unreachable, using mock order:', error);
    }

    // Mock order fallback
    return {
        orderId: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: plan.price * 100, // Razorpay uses paise
        currency: 'INR',
        planId: plan.id,
        credits: plan.credits,
    };
};

// Process payment with Razorpay
export const processPayment = async (
    order: PaymentOrder,
    userDetails: {
        name: string;
        email: string;
        phone?: string;
        userId?: string;
    },
    onSuccess: (credits: number) => void,
    onFailure: (error: string) => void
): Promise<void> => {
    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
        onFailure('Failed to load payment gateway');
        return;
    }

    const options = {
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        name: 'AI Job Automator',
        description: `${order.credits} Credits`,
        order_id: order.orderId, // In production, use actual Razorpay order ID
        handler: async function (response: any) {
            // Payment successful — verify on backend (best effort, records
            // the transaction server-side; credits are granted locally either way)
            console.log('Payment successful:', response);

            try {
                await fetch(`${API_BASE}/payments/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: order.orderId,
                        paymentId: response.razorpay_payment_id,
                        signature: response.razorpay_signature,
                        userId: userDetails.userId || 'local-user',
                        credits: order.credits,
                    }),
                });
            } catch (error) {
                console.warn('Payment verification call failed:', error);
            }

            onSuccess(order.credits);
        },
        prefill: {
            name: userDetails.name,
            email: userDetails.email,
            contact: userDetails.phone || '',
        },
        notes: {
            planId: order.planId,
            credits: order.credits.toString(),
        },
        theme: {
            color: '#6366f1', // Indigo
        },
        modal: {
            ondismiss: function () {
                onFailure('Payment cancelled');
            },
        },
    };

    try {
        const razorpay = new window.Razorpay(options);
        razorpay.open();
    } catch (error: any) {
        onFailure(error.message || 'Payment failed');
    }
};

// Demo payment (for testing without actual Razorpay)
export const processDemoPayment = async (
    planId: string,
    onSuccess: (credits: number) => void,
    onFailure: (error: string) => void
): Promise<void> => {
    const plan = CREDIT_PLANS.find(p => p.id === planId);
    if (!plan) {
        onFailure('Invalid plan');
        return;
    }

    // Simulate payment processing
    return new Promise((resolve) => {
        setTimeout(() => {
            // 90% success rate for demo
            if (Math.random() > 0.1) {
                onSuccess(plan.credits);
            } else {
                onFailure('Demo payment failed - try again');
            }
            resolve();
        }, 2000);
    });
};
