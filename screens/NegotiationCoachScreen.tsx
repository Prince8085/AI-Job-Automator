
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useJobData } from '../contexts/JobDataContext';
import { analyzeOfferAndGenerateScript } from '../services/geminiService';
import ScreenWrapper from '../components/ScreenWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import { Job, OfferDetails, NegotiationAnalysis } from '../types';
import { SparklesIcon } from '../components/icons';

const NegotiationCoachScreen: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const { getJobById, userProfile, showToast } = useJobData();
    
    const [job, setJob] = useState<Job | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState<NegotiationAnalysis | null>(null);
    const [offerDetails, setOfferDetails] = useState<OfferDetails>({ salary: '', bonus: '', equity: '' });

    useEffect(() => {
        if (location.state?.jobData) {
            setJob(location.state.jobData);
        } else if (id) {
            const foundJob = getJobById(id);
            if (foundJob) setJob(foundJob);
        }
    }, [id, getJobById, location.state]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setOfferDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerate = async () => {
        if (!job) return;
        if (!offerDetails.salary) {
            showToast('Please enter the base salary.', 'error');
            return;
        }
        setIsLoading(true);
        setAnalysis(null);
        try {
            const result = await analyzeOfferAndGenerateScript(job, offerDetails, userProfile.baseResume);
            setAnalysis(result);
            showToast('Negotiation analysis complete!', 'success');
        } catch (err: any) {
            showToast(err.message || 'Error analyzing offer.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!job) return <ScreenWrapper><LoadingSpinner text="Loading..." /></ScreenWrapper>;

    return (
        <ScreenWrapper>
            <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
                <h2 className="text-2xl font-bold text-text-primary">AI Negotiation Coach</h2>
                <p className="text-text-secondary">Get data-driven advice for your offer from <span className="font-semibold text-primary">{job.company}</span>.</p>
                
                <div className="space-y-4 pt-4 border-t">
                    <div>
                        <label htmlFor="salary" className="block text-sm font-medium text-text-secondary">Offered Base Salary (Annual)</label>
                        <input type="text" name="salary" id="salary" value={offerDetails.salary} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" placeholder="e.g., 150000"/>
                    </div>
                     <div>
                        <label htmlFor="bonus" className="block text-sm font-medium text-text-secondary">Signing Bonus (if any)</label>
                        <input type="text" name="bonus" id="bonus" value={offerDetails.bonus} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" placeholder="e.g., 10000"/>
                    </div>
                     <div>
                        <label htmlFor="equity" className="block text-sm font-medium text-text-secondary">Equity / Other Perks</label>
                        <textarea name="equity" id="equity" value={offerDetails.equity} onChange={handleInputChange} rows={2} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" placeholder="e.g., 1,000 RSUs over 4 years, WFH stipend"></textarea>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full py-3 px-6 text-white font-bold bg-primary rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-300 disabled:cursor-wait"
                >
                    {isLoading ? 'Analyzing...' : '✨ Analyze My Offer'}
                </button>
            </div>

            {isLoading && <LoadingSpinner text="AI is analyzing market data..." />}

            {analysis && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold text-primary mb-3">Offer Analysis</h3>
                        <p className="text-text-secondary leading-relaxed">{analysis.competitiveness}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold text-primary mb-3">Recommended Counter Offer Range</h3>
                        <p className="text-2xl font-bold text-secondary">{analysis.recommendedRange}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold text-primary mb-3 flex items-center">
                           <SparklesIcon className="w-5 h-5 mr-2"/>
                           Generated Negotiation Script
                        </h3>
                         <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-md whitespace-pre-wrap leading-relaxed">
                            <p className="text-indigo-800">{analysis.script}</p>
                        </div>
                    </div>
                </div>
            )}
        </ScreenWrapper>
    );
};

export default NegotiationCoachScreen;
