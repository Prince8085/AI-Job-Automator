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

// Create order (in production, this should call your backend)
export const createOrder = async (planId: string): Promise<PaymentOrder | null> => {
    const plan = CREDIT_PLANS.find(p => p.id === planId);
    if (!plan || plan.price === 0) return null;

    // In production, call your backend to create a Razorpay order
    // For demo, we create a mock order
    const order: PaymentOrder = {
        orderId: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: plan.price * 100, // Razorpay uses paise
        currency: 'INR',
        planId: plan.id,
        credits: plan.credits,
    };

    return order;
};

// Process payment with Razorpay
export const processPayment = async (
    order: PaymentOrder,
    userDetails: {
        name: string;
        email: string;
        phone?: string;
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
        handler: function (response: any) {
            // Payment successful
            console.log('Payment successful:', response);

            // In production, verify payment on backend before adding credits
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
