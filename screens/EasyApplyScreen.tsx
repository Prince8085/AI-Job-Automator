
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useJobData } from '../contexts/JobDataContext';
import { analyzeApplicationForm } from '../services/geminiService';
import ScreenWrapper from '../components/ScreenWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import { Job, ParsedApplicationForm, ApplicationStatus, TrackedJob } from '../types';
import { ArrowUpRightIcon, CheckIcon, UserIcon, FileTextIcon, SparklesIcon } from '../components/icons';

const FormField: React.FC<{ label: string, value: string, type: string }> = ({ label, value, type }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-text-secondary">{label}</label>
            {type === 'textarea' ? (
                <p className="mt-1 block w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md shadow-sm whitespace-pre-wrap">{value}</p>
            ) : (
                <p className="mt-1 block w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md shadow-sm">{value}</p>
            )}
        </div>
    );
};

const EasyApplyScreen: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { getJobById, userProfile, showToast, updateJobStatus } = useJobData();

    const [job, setJob] = useState<Job | TrackedJob | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<ParsedApplicationForm | null>(null);

    useEffect(() => {
        const jobData = location.state?.jobData || (id ? getJobById(id) : null);
        if (!jobData) {
            setError('Job data is required for this feature.');
            setIsLoading(false);
            return;
        }
        setJob(jobData);

        const fetchFormData = async () => {
            try {
                const result = await analyzeApplicationForm(jobData, userProfile);
                setFormData(result);
            } catch (err: any) {
                console.warn('AI service failed, using mock data:', err.message);
                // Fallback to mock data when AI service fails
                const mockFormData: ParsedApplicationForm = {
                    basicInfo: [
                        { id: 'name', label: 'Full Name', type: 'text', value: userProfile.name },
                        { id: 'email', label: 'Email Address', type: 'text', value: userProfile.email },
                        { id: 'phone', label: 'Phone Number', type: 'text', value: userProfile.phone },
                        { id: 'linkedin', label: 'LinkedIn Profile', type: 'text', value: userProfile.linkedinUrl || 'Not provided' },
                        { id: 'resume', label: 'Resume Upload', type: 'file', value: 'Your tailored resume will be uploaded' }
                    ],
                    customQuestions: [
                        {
                            id: 'why-company',
                            label: 'Why do you want to work at this company?',
                            type: 'textarea',
                            value: `I am excited about the opportunity to work at ${jobData.company} because of your reputation for innovation and excellence in the industry. The ${jobData.title} position aligns perfectly with my skills and career goals, and I believe I can contribute meaningfully to your team's success.`
                        },
                        {
                            id: 'experience',
                            label: 'Tell us about your relevant experience',
                            type: 'textarea',
                            value: `Based on my background and experience outlined in my resume, I have developed strong skills that directly apply to this ${jobData.title} role. I am passionate about leveraging my expertise to drive results and contribute to ${jobData.company}'s continued growth.`
                        },
                        {
                            id: 'salary',
                            label: 'Salary Expectations',
                            type: 'text',
                            value: 'Competitive salary based on market standards and experience level'
                        }
                    ]
                };
                setFormData(mockFormData);
                showToast('Using sample application data. AI analysis unavailable.', 'info');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFormData();
    }, [id, location.state, getJobById, userProfile, showToast]);

    const handleGoToApplication = () => {
        if (job?.sourceUrl && !job.sourceUrl.includes('example.com')) {
            window.open(job.sourceUrl, '_blank');
        } else {
            showToast('This is a demo job. In a real scenario, this would open the actual job posting.', 'info');
        }
    };

    const handleMarkAsApplied = () => {
        if (job) {
            updateJobStatus(job.id, ApplicationStatus.APPLIED);
            showToast('Job marked as applied!', 'success');
            navigate('/tracker');
        }
    };

    if (isLoading) {
        return <ScreenWrapper><LoadingSpinner text="AI is analyzing the application form..." /></ScreenWrapper>;
    }

    if (error) {
        return (
            <ScreenWrapper>
                <div className="bg-red-100 text-red-700 p-4 rounded-lg text-center">
                    <h3 className="font-bold">Error</h3>
                    <p>{error}</p>
                </div>
            </ScreenWrapper>
        );
    }
    
    if (!job || !formData) {
        return <ScreenWrapper><p>Could not load application data.</p></ScreenWrapper>;
    }

    return (
        <ScreenWrapper>
            <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
                <h2 className="text-2xl font-bold text-text-primary">AI Easy Apply Preview</h2>
                <p className="text-text-secondary">AI has prepared the following information for your application to <span className="font-semibold text-primary">{job.title}</span> at <span className="font-semibold text-primary">{job.company}</span>. Review the details, then go to the site to submit.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-primary flex items-center"><UserIcon className="w-5 h-5 mr-2"/>Basic Information</h3>
                    {formData.basicInfo.map(field => (
                        <FormField key={field.id} {...field} />
                    ))}
                </div>

                {/* Resume Upload */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                    <FileTextIcon className="w-8 h-8 text-green-600 mr-4 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-green-800">Resume Ready</h4>
                        <p className="text-sm text-green-700">The app will use your tailored resume for the upload field.</p>
                    </div>
                </div>

                {/* Custom Questions */}
                {formData.customQuestions.length > 0 && (
                     <div className="space-y-4">
                        <h3 className="text-xl font-bold text-primary flex items-center"><SparklesIcon className="w-5 h-5 mr-2"/>AI-Generated Answers</h3>
                        {formData.customQuestions.map(field => (
                            <FormField key={field.id} {...field} />
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
                 <h3 className="text-xl font-bold text-text-primary">Next Steps</h3>
                 <div className="grid sm:grid-cols-2 gap-4">
                    <button
                        onClick={handleGoToApplication}
                        className="w-full flex items-center justify-center py-3 px-6 text-white font-bold bg-gradient-primary rounded-lg hover:opacity-90 transition"
                    >
                        <ArrowUpRightIcon className="w-5 h-5 mr-2" />
                        {job?.sourceUrl && !job.sourceUrl.includes('example.com') 
                            ? 'Go to Application to Submit' 
                            : 'View Demo (No Real URL)'}
                    </button>
                    <button
                        onClick={handleMarkAsApplied}
                        className="w-full flex items-center justify-center py-3 px-6 text-white font-bold bg-gradient-secondary rounded-lg hover:opacity-90 transition"
                    >
                        <CheckIcon className="w-5 h-5 mr-2" />
                        Mark as Applied
                    </button>
                 </div>
            </div>

        </ScreenWrapper>
    );
};

export default EasyApplyScreen;
