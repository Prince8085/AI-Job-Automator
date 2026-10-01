
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useJobData } from '../contexts/JobDataContext';
import ScreenWrapper from '../components/ScreenWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import { Job, ApplicationStatus, TrackedJob } from '../types';
import { CheckIcon, CopyIcon, FileTextIcon, SparklesIcon, AlertTriangleIcon, ExternalLinkIcon } from '../components/icons';
import { generateCoverLetter } from '../services/geminiService';

const EasyApplyScreen: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { getJobById, userProfile, showToast, updateJobStatus, trackJob } = useJobData();

    const [job, setJob] = useState<Job | TrackedJob | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [coverLetter, setCoverLetter] = useState('');
    const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    useEffect(() => {
        const jobData = location.state?.jobData || (id ? getJobById(id) : null);
        if (!jobData) {
            setError('Job data is required for this feature.');
            setIsLoading(false);
            return;
        }
        setJob(jobData);
        setIsLoading(false);
    }, [id, location.state, getJobById]);

    const handleGenerateCoverLetter = async () => {
        if (!job) {
            setError('Job data is required to generate a cover letter');
            return;
        }

        setIsGeneratingCoverLetter(true);
        setError('');
        try {
            if (!userProfile || !userProfile.baseResume) {
                throw new Error('Resume data is missing. Please update your profile.');
            }
            const letter = await generateCoverLetter(userProfile, job);
            if (!letter || letter.trim().length === 0) {
                throw new Error('Generated cover letter is empty');
            }
            setCoverLetter(letter);
            showToast('Cover letter generated successfully!', 'success');
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to generate cover letter';
            setError(errorMsg);
            showToast(errorMsg, 'error');
            console.error('Cover letter generation error:', err);
        } finally {
            setIsGeneratingCoverLetter(false);
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        showToast(`${field} copied to clipboard!`, 'success');
        setTimeout(() => setCopied(null), 2000);
    };

    const handleOpenApplication = () => {
        if (job?.sourceUrl && !job.sourceUrl.includes('example.com') && !job.sourceUrl.includes('rapidapi.com')) {
            window.open(job.sourceUrl, '_blank');
        } else {
            showToast('No application URL available for this job', 'info');
        }
    };

    const handleTrackAndApply = () => {
        try {
            if (!job) {
                setError('Job data is missing');
                return;
            }
            // First track the job if not already tracked
            const existingJob = getJobById(job.id);
            if (!existingJob || !('status' in existingJob)) {
                trackJob(job);
            }
            // Then update status to Applied
            updateJobStatus(job.id, ApplicationStatus.APPLIED);
            showToast('Job marked as applied!', 'success');
            navigate('/tracker');
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to mark job as applied';
            setError(errorMsg);
            showToast(errorMsg, 'error');
            console.error('Track and apply error:', err);
        }
    };

    const hasValidUrl = job?.sourceUrl &&
        !job.sourceUrl.includes('example.com') &&
        !job.sourceUrl.includes('rapidapi.com');

    if (isLoading) {
        return <ScreenWrapper><LoadingSpinner text="Loading job details..." /></ScreenWrapper>;
    }

    if (error) {
        return (
            <ScreenWrapper>
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <AlertTriangleIcon className="w-12 h-12 text-red-500" />
                    <div className="bg-red-50 border border-red-300 text-red-700 p-6 rounded-lg text-center max-w-md">
                        <h3 className="font-bold text-lg mb-2">Error Loading Job</h3>
                        <p className="mb-4">{error}</p>
                        <button
                            onClick={() => navigate('/search')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                            Go Back to Search
                        </button>
                    </div>
                </div>
            </ScreenWrapper>
        );
    }

    if (!job) {
        return <ScreenWrapper><p>Could not load job data.</p></ScreenWrapper>;
    }

    return (
        <ScreenWrapper>
            {/* Job Summary Card */}
            <div className="bg-white p-6 rounded-lg shadow-lg space-y-3">
                <h2 className="text-2xl font-bold text-text-primary">{job.title}</h2>
                <p className="text-lg text-primary font-semibold">{job.company}</p>
                <p className="text-text-secondary">{job.location}</p>
                {job.salary && job.salary !== 'Not specified' && (
                    <p className="text-green-600 font-medium">{job.salary}</p>
                )}
            </div>

            {/* Quick Apply Checklist */}
            <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
                <h3 className="text-xl font-bold text-text-primary flex items-center">
                    <CheckIcon className="w-6 h-6 mr-2 text-green-500" />
                    Application Checklist
                </h3>

                <div className="space-y-3">
                    {/* Profile Info */}
                    <div className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                            <p className="font-medium text-text-primary">Your Info</p>
                            <p className="text-sm text-text-secondary">{userProfile.name || 'Not set'}</p>
                            <p className="text-sm text-text-secondary">{userProfile.email || 'Not set'}</p>
                            <p className="text-sm text-text-secondary">{userProfile.phone || 'Not set'}</p>
                        </div>
                        <button
                            onClick={() => copyToClipboard(`${userProfile.name}\n${userProfile.email}\n${userProfile.phone}`, 'Contact Info')}
                            className="p-2 hover:bg-slate-200 rounded-lg transition"
                        >
                            <CopyIcon className={`w-5 h-5 ${copied === 'Contact Info' ? 'text-green-500' : 'text-slate-500'}`} />
                        </button>
                    </div>

                    {/* LinkedIn */}
                    {userProfile.linkedinUrl && (
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-medium text-text-primary">LinkedIn</p>
                                <p className="text-sm text-text-secondary truncate max-w-xs">{userProfile.linkedinUrl}</p>
                            </div>
                            <button
                                onClick={() => copyToClipboard(userProfile.linkedinUrl || '', 'LinkedIn')}
                                className="p-2 hover:bg-slate-200 rounded-lg transition"
                            >
                                <CopyIcon className={`w-5 h-5 ${copied === 'LinkedIn' ? 'text-green-500' : 'text-slate-500'}`} />
                            </button>
                        </div>
                    )}

                    {/* Resume Status */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center">
                            <FileTextIcon className="w-5 h-5 mr-3 text-primary" />
                            <div>
                                <p className="font-medium text-text-primary">Resume</p>
                                <p className="text-sm text-text-secondary">
                                    {userProfile.baseResume ? 'Ready to upload' : 'Not uploaded - add in Profile'}
                                </p>
                            </div>
                        </div>
                        {userProfile.baseResume && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Ready</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Cover Letter Generator */}
            <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
                <h3 className="text-xl font-bold text-text-primary flex items-center">
                    <SparklesIcon className="w-6 h-6 mr-2 text-amber-500" />
                    AI Cover Letter
                </h3>

                {!coverLetter ? (
                    <button
                        onClick={handleGenerateCoverLetter}
                        disabled={isGeneratingCoverLetter}
                        className="w-full py-3 px-6 text-white font-bold bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg hover:opacity-90 transition disabled:opacity-50"
                    >
                        {isGeneratingCoverLetter ? 'Generating...' : 'Generate Cover Letter for This Job'}
                    </button>
                ) : (
                    <div className="space-y-3">
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg max-h-60 overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-sm text-text-primary font-sans">{coverLetter}</pre>
                        </div>
                        <button
                            onClick={() => copyToClipboard(coverLetter, 'Cover Letter')}
                            className="w-full py-2 px-4 text-amber-700 font-medium bg-amber-100 rounded-lg hover:bg-amber-200 transition flex items-center justify-center"
                        >
                            <CopyIcon className="w-4 h-4 mr-2" />
                            {copied === 'Cover Letter' ? 'Copied!' : 'Copy Cover Letter'}
                        </button>
                    </div>
                )}
            </div>

            {/* Apply Actions */}
            <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
                <h3 className="text-xl font-bold text-text-primary">Apply Now</h3>

                {!hasValidUrl && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start">
                        <AlertTriangleIcon className="w-5 h-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-amber-800">No Direct Application Link</p>
                            <p className="text-sm text-amber-700">
                                This job doesn't have a direct application URL. Search for "{job.company} {job.title} careers" to find the application page.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                    <button
                        onClick={handleOpenApplication}
                        disabled={!hasValidUrl}
                        className={`w-full flex items-center justify-center py-3 px-6 font-bold rounded-lg transition ${hasValidUrl
                            ? 'text-white bg-gradient-primary hover:opacity-90'
                            : 'text-slate-400 bg-slate-200 cursor-not-allowed'
                            }`}
                    >
                        <ExternalLinkIcon className="w-5 h-5 mr-2" />
                        Open Application Page
                    </button>

                    <button
                        onClick={handleTrackAndApply}
                        className="w-full flex items-center justify-center py-3 px-6 text-white font-bold bg-gradient-secondary rounded-lg hover:opacity-90 transition"
                    >
                        <CheckIcon className="w-5 h-5 mr-2" />
                        Mark as Applied
                    </button>
                </div>

                <p className="text-center text-sm text-text-secondary">
                    After applying on the company's website, click "Mark as Applied" to track your application.
                </p>
            </div>
        </ScreenWrapper>
    );
};

export default EasyApplyScreen;
