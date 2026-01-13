
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Credit pricing plans (one-time purchase)
export const CREDIT_PLANS = [
    { id: 'free', name: 'Free', price: 0, credits: 10 },
    { id: 'starter', name: 'Starter Pack', price: 199, credits: 100 },
    { id: 'pro', name: 'Pro Pack', price: 499, credits: 500 },
    { id: 'mega', name: 'Mega Pack', price: 999, credits: 1500 },
];

// Credit costs for each feature
export const CREDIT_COSTS = {
    JOB_SEARCH: 1,
    AI_RESUME: 5,
    COVER_LETTER: 3,
    INTERVIEW_PREP: 2,
    SKILLS_ANALYSIS: 2,
    COMPANY_BRIEFING: 2,
    NEGOTIATION: 3,
    NETWORKING: 2,
    CAREER_PLANNING: 3,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

interface CreditContextType {
    credits: number;
    addCredits: (amount: number) => void;
    useCredits: (action: CreditAction, customAmount?: number) => boolean;
    hasEnoughCredits: (action: CreditAction) => boolean;
    getCreditCost: (action: CreditAction) => number;
    totalSpent: number;
    transactionHistory: Transaction[];
}

interface Transaction {
    id: string;
    type: 'credit' | 'debit';
    amount: number;
    action: string;
    timestamp: Date;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

const STORAGE_KEY = 'ai_job_automator_credits';
const HISTORY_KEY = 'ai_job_automator_credit_history';

export const CreditProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [credits, setCredits] = useState<number>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? parseInt(saved, 10) : 10; // Start with 10 free credits
    });

    const [transactionHistory, setTransactionHistory] = useState<Transaction[]>(() => {
        const saved = localStorage.getItem(HISTORY_KEY);
        return saved ? JSON.parse(saved) : [];
    });

    const [totalSpent, setTotalSpent] = useState<number>(0);

    // Persist credits to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, credits.toString());
    }, [credits]);

    // Persist history to localStorage
    useEffect(() => {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(transactionHistory));
    }, [transactionHistory]);

    // Add credits (after purchase)
    const addCredits = (amount: number) => {
        setCredits(prev => prev + amount);
        addTransaction('credit', amount, 'Credit Purchase');
    };

    // Check if user has enough credits
    const hasEnoughCredits = (action: CreditAction): boolean => {
        return credits >= CREDIT_COSTS[action];
    };

    // Get cost for an action
    const getCreditCost = (action: CreditAction): number => {
        return CREDIT_COSTS[action];
    };

    // Use credits for an action
    const useCredits = (action: CreditAction, customAmount?: number): boolean => {
        const cost = customAmount || CREDIT_COSTS[action];

        if (credits < cost) {
            return false; // Not enough credits
        }

        setCredits(prev => prev - cost);
        setTotalSpent(prev => prev + cost);
        addTransaction('debit', cost, action);
        return true;
    };

    // Add transaction to history
    const addTransaction = (type: 'credit' | 'debit', amount: number, action: string) => {
        const transaction: Transaction = {
            id: `txn-${Date.now()}`,
            type,
            amount,
            action,
            timestamp: new Date(),
        };
        setTransactionHistory(prev => [transaction, ...prev].slice(0, 50)); // Keep last 50
    };

    return (
        <CreditContext.Provider
            value={{
                credits,
                addCredits,
                useCredits,
                hasEnoughCredits,
                getCreditCost,
                totalSpent,
                transactionHistory,
            }}
        >
            {children}
        </CreditContext.Provider>
    );
};

export const useCredits = () => {
    const context = useContext(CreditContext);
    if (!context) {
        throw new Error('useCredits must be used within a CreditProvider');
    }
    return context;
};

// Credit Display Component
export const CreditDisplay: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { credits } = useCredits();

    const isLow = credits <= 5;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className={`
        px-3 py-1.5 rounded-xl font-bold text-sm
        ${isLow
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-600'
                }
      `}>
                💳 {credits} credits
            </div>
            {isLow && (
                <span className="text-xs text-red-500 animate-pulse">Low credits!</span>
            )}
        </div>
    );
};

// Credit Check Button Wrapper
export const CreditButton: React.FC<{
    action: CreditAction;
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
}> = ({ action, onClick, children, className = '', disabled = false }) => {
    const { hasEnoughCredits, getCreditCost, useCredits } = useCredits();

    const cost = getCreditCost(action);
    const canAfford = hasEnoughCredits(action);

    const handleClick = () => {
        if (canAfford && useCredits(action)) {
            onClick();
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled || !canAfford}
            className={`
        ${className}
        ${!canAfford ? 'opacity-50 cursor-not-allowed' : ''}
      `}
            title={!canAfford ? `Need ${cost} credits` : `Uses ${cost} credits`}
        >
            {children}
            <span className="ml-2 text-xs opacity-75">({cost} 💳)</span>
        </button>
    );
};
