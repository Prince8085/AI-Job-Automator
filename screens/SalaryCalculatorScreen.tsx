
import React, { useState } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import { useJobData } from '../contexts/JobDataContext';

interface SalaryData {
    role: string;
    location: string;
    experience: string;
    minSalary: number;
    maxSalary: number;
    avgSalary: number;
    currency: string;
    marketTrend: 'up' | 'down' | 'stable';
    percentile: {
        p25: number;
        p50: number;
        p75: number;
        p90: number;
    };
    companies: { name: string; range: string }[];
}

const SalaryCalculatorScreen: React.FC = () => {
    const { showToast } = useJobData();
    const [role, setRole] = useState('');
    const [location, setLocation] = useState('India');
    const [experience, setExperience] = useState('0-2');
    const [isLoading, setIsLoading] = useState(false);
    const [salaryData, setSalaryData] = useState<SalaryData | null>(null);

    const roles = [
        'Software Engineer',
        'Frontend Developer',
        'Backend Developer',
        'Full Stack Developer',
        'Data Scientist',
        'ML Engineer',
        'DevOps Engineer',
        'Product Manager',
        'UI/UX Designer',
        'Business Analyst',
        'QA Engineer',
        'Mobile Developer',
    ];

    const locations = [
        'India',
        'Bangalore',
        'Mumbai',
        'Delhi NCR',
        'Hyderabad',
        'Pune',
        'Chennai',
        'Remote - India',
        'USA',
        'Remote - Global',
    ];

    const experienceLevels = [
        { value: '0-2', label: 'Fresher (0-2 years)' },
        { value: '2-5', label: 'Junior (2-5 years)' },
        { value: '5-8', label: 'Mid-Level (5-8 years)' },
        { value: '8-12', label: 'Senior (8-12 years)' },
        { value: '12+', label: 'Lead/Principal (12+ years)' },
    ];

    const handleCalculate = async () => {
        if (!role) {
            showToast('Please select a role', 'error');
            return;
        }

        setIsLoading(true);

        // Simulate API call
        await new Promise(r => setTimeout(r, 1500));

        // Generate salary data based on inputs
        const baseSalary = getBaseSalary(role, experience, location);

        const data: SalaryData = {
            role,
            location,
            experience: experienceLevels.find(e => e.value === experience)?.label || experience,
            minSalary: Math.round(baseSalary * 0.7),
            maxSalary: Math.round(baseSalary * 1.4),
            avgSalary: baseSalary,
            currency: location.includes('USA') || location.includes('Global') ? '$' : '₹',
            marketTrend: Math.random() > 0.3 ? 'up' : Math.random() > 0.5 ? 'stable' : 'down',
            percentile: {
                p25: Math.round(baseSalary * 0.75),
                p50: baseSalary,
                p75: Math.round(baseSalary * 1.25),
                p90: Math.round(baseSalary * 1.5),
            },
            companies: generateCompanySalaries(role, baseSalary, location),
        };

        setSalaryData(data);
        setIsLoading(false);
    };

    const getBaseSalary = (role: string, exp: string, loc: string): number => {
        const baseRates: Record<string, number> = {
            'Software Engineer': 1200000,
            'Frontend Developer': 1000000,
            'Backend Developer': 1100000,
            'Full Stack Developer': 1300000,
            'Data Scientist': 1500000,
            'ML Engineer': 1600000,
            'DevOps Engineer': 1400000,
            'Product Manager': 1800000,
            'UI/UX Designer': 900000,
            'Business Analyst': 1000000,
            'QA Engineer': 800000,
            'Mobile Developer': 1200000,
        };

        let base = baseRates[role] || 1000000;

        // Experience multiplier
        const expMultipliers: Record<string, number> = {
            '0-2': 0.6,
            '2-5': 1.0,
            '5-8': 1.5,
            '8-12': 2.2,
            '12+': 3.0,
        };
        base *= expMultipliers[exp] || 1;

        // Location multiplier
        if (loc.includes('Bangalore')) base *= 1.1;
        if (loc.includes('USA')) base *= 6;
        if (loc.includes('Global')) base *= 5;
        if (loc === 'India') base *= 0.95;

        return Math.round(base);
    };

    const generateCompanySalaries = (role: string, base: number, loc: string): { name: string; range: string }[] => {
        const currency = loc.includes('USA') || loc.includes('Global') ? '$' : '₹';
        const format = (n: number) => {
            if (currency === '$') return `$${(n / 100000).toFixed(0)}K`;
            return `₹${(n / 100000).toFixed(1)}L`;
        };

        return [
            { name: 'Google', range: `${format(base * 1.5)} - ${format(base * 2)}` },
            { name: 'Microsoft', range: `${format(base * 1.4)} - ${format(base * 1.8)}` },
            { name: 'Amazon', range: `${format(base * 1.3)} - ${format(base * 1.7)}` },
            { name: 'Flipkart', range: `${format(base * 1.2)} - ${format(base * 1.5)}` },
            { name: 'Razorpay', range: `${format(base * 1.1)} - ${format(base * 1.4)}` },
            { name: 'Startup (Funded)', range: `${format(base * 0.9)} - ${format(base * 1.2)}` },
        ];
    };

    const formatSalary = (amount: number, currency: string) => {
        if (currency === '$') return `$${(amount / 1000).toFixed(0)}K`;
        return `₹${(amount / 100000).toFixed(1)} LPA`;
    };

    return (
        <ScreenWrapper>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
                    <h1 className="text-2xl font-bold">💰 Salary Calculator</h1>
                    <p className="opacity-90 mt-1">Estimate your market value</p>
                </div>

                {/* Input Form */}
                <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Job Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">Select a role</option>
                            {roles.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                        <select
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                        >
                            {locations.map((l) => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    </div>

                    {/* Experience */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                        <select
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                        >
                            {experienceLevels.map((e) => (
                                <option key={e.value} value={e.value}>{e.label}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleCalculate}
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-70"
                    >
                        {isLoading ? 'Calculating...' : '📊 Calculate Salary'}
                    </button>
                </div>

                {/* Results */}
                {salaryData && (
                    <div className="space-y-6">
                        {/* Main Stats */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">
                                {salaryData.role} in {salaryData.location}
                            </h2>

                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-sm text-gray-500">Minimum</p>
                                    <p className="text-xl font-bold text-gray-800">
                                        {formatSalary(salaryData.minSalary, salaryData.currency)}
                                    </p>
                                </div>
                                <div className="bg-green-50 rounded-xl p-4">
                                    <p className="text-sm text-green-600">Average</p>
                                    <p className="text-2xl font-bold text-green-700">
                                        {formatSalary(salaryData.avgSalary, salaryData.currency)}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-sm text-gray-500">Maximum</p>
                                    <p className="text-xl font-bold text-gray-800">
                                        {formatSalary(salaryData.maxSalary, salaryData.currency)}
                                    </p>
                                </div>
                            </div>

                            {/* Market Trend */}
                            <div className="mt-4 flex items-center justify-center">
                                <span className={`
                  px-3 py-1 rounded-full text-sm font-medium
                  ${salaryData.marketTrend === 'up' ? 'bg-green-100 text-green-700' : ''}
                  ${salaryData.marketTrend === 'down' ? 'bg-red-100 text-red-700' : ''}
                  ${salaryData.marketTrend === 'stable' ? 'bg-yellow-100 text-yellow-700' : ''}
                `}>
                                    {salaryData.marketTrend === 'up' && '📈 Market trending up'}
                                    {salaryData.marketTrend === 'down' && '📉 Market trending down'}
                                    {salaryData.marketTrend === 'stable' && '➡️ Market stable'}
                                </span>
                            </div>
                        </div>

                        {/* Percentiles */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="font-bold text-gray-800 mb-4">📊 Salary Percentiles</h3>
                            <div className="space-y-3">
                                {[
                                    { label: '25th Percentile', value: salaryData.percentile.p25, color: 'bg-gray-200' },
                                    { label: '50th Percentile (Median)', value: salaryData.percentile.p50, color: 'bg-green-400' },
                                    { label: '75th Percentile', value: salaryData.percentile.p75, color: 'bg-green-500' },
                                    { label: '90th Percentile (Top)', value: salaryData.percentile.p90, color: 'bg-green-600' },
                                ].map((p) => (
                                    <div key={p.label} className="flex items-center gap-4">
                                        <span className="w-40 text-sm text-gray-600">{p.label}</span>
                                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${p.color} rounded-full transition-all`}
                                                style={{ width: `${(p.value / salaryData.percentile.p90) * 100}%` }}
                                            />
                                        </div>
                                        <span className="w-24 text-right font-medium">
                                            {formatSalary(p.value, salaryData.currency)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Company-wise */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="font-bold text-gray-800 mb-4">🏢 Company-wise Salaries</h3>
                            <div className="space-y-3">
                                {salaryData.companies.map((company) => (
                                    <div
                                        key={company.name}
                                        className="flex justify-between items-center p-3 bg-gray-50 rounded-xl"
                                    >
                                        <span className="font-medium text-gray-700">{company.name}</span>
                                        <span className="text-green-600 font-bold">{company.range}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ScreenWrapper>
    );
};

export default SalaryCalculatorScreen;
