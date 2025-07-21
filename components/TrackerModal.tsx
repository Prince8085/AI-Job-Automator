import React, { useState } from 'react';
import { useJobData } from '../contexts/JobDataContext';
import { TrackedJob, ApplicationStatus, ApplicationInsights } from '../types';
import { APPLICATION_STATUS_ORDER } from '../constants';
import { XMarkIcon, FileTextIcon, MailIcon, DocumentCheckIcon, SparklesIcon, LightbulbIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';
import { getApplicationInsights } from '../services/geminiService';


interface TrackerModalProps {
  job: TrackedJob;
  onClose: () => void;
}

type ActiveTab = 'Details' | 'Notes' | 'Resume' | 'Cover Letter' | 'Insights';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors whitespace-nowrap ${
            active ? 'bg-white text-primary border-b-2 border-primary' : 'text-text-secondary hover:bg-slate-100'
        }`}
    >
        {children}
    </button>
);

const InsightsDisplay: React.FC<{ insights: ApplicationInsights }> = ({ insights }) => (
    <div className="space-y-6">
        <div>
            <h5 className="font-bold text-lg text-green-600 mb-2">Your Strengths</h5>
            <ul className="list-disc list-inside space-y-1 text-text-secondary">
                {insights.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
        </div>
        <div>
            <h5 className="font-bold text-lg text-blue-600 mb-2">Key Talking Points</h5>
            <ul className="list-disc list-inside space-y-1 text-text-secondary">
                {insights.talkingPoints.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
        </div>
         <div>
            <h5 className="font-bold text-lg text-yellow-600 mb-2">Potential Red Flags to Prepare For</h5>
            <ul className="list-disc list-inside space-y-1 text-text-secondary">
                {insights.redFlags.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
        </div>
    </div>
);

const TrackerModal: React.FC<TrackerModalProps> = ({ job, onClose }) => {
    const { updateJobStatus, saveTrackedJobData, showToast, getJobById, userProfile } = useJobData();
    const [activeTab, setActiveTab] = useState<ActiveTab>('Details');
    const [notes, setNotes] = useState(job.notes || '');
    const [isLoadingInsights, setIsLoadingInsights] = useState(false);

    // Always get the latest job data from context to ensure UI is up-to-date
    const jobData = (getJobById(job.id) as TrackedJob) || job;

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        updateJobStatus(jobData.id, e.target.value as ApplicationStatus);
    };

    const handleSaveNotes = () => {
        saveTrackedJobData(jobData.id, { notes });
        showToast('Notes saved successfully!', 'success');
    };

    const handleGenerateInsights = async () => {
        setIsLoadingInsights(true);
        try {
            const result = await getApplicationInsights(jobData, userProfile.baseResume);
            saveTrackedJobData(jobData.id, { applicationInsights: result });
            showToast("Insights generated!", "success");
        } catch (err: any) {
            showToast(err.message || 'Failed to generate insights.', 'error');
        } finally {
            setIsLoadingInsights(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-40 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b bg-white rounded-t-xl">
                    <div>
                        <h3 className="text-xl font-bold text-primary">{jobData.title}</h3>
                        <p className="text-text-secondary">{jobData.company}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                        <XMarkIcon className="w-6 h-6 text-text-secondary" />
                    </button>
                </div>

                <div className="border-b px-4 bg-white overflow-x-auto">
                    <div className="flex -mb-px">
                        <TabButton active={activeTab === 'Details'} onClick={() => setActiveTab('Details')}>Details</TabButton>
                        <TabButton active={activeTab === 'Notes'} onClick={() => setActiveTab('Notes')}>Notes</TabButton>
                        <TabButton active={activeTab === 'Resume'} onClick={() => setActiveTab('Resume')}>Resume</TabButton>
                        <TabButton active={activeTab === 'Cover Letter'} onClick={() => setActiveTab('Cover Letter')}>Cover Letter</TabButton>
                        <TabButton active={activeTab === 'Insights'} onClick={() => setActiveTab('Insights')}>
                            <span className="flex items-center"><SparklesIcon className="w-4 h-4 mr-1.5 text-primary"/>Insights</span>
                        </TabButton>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto">
                    {activeTab === 'Details' && (
                        <div className="space-y-4">
                            <h4 className="font-bold text-lg text-text-primary">Application Status</h4>
                            <select
                                value={jobData.status}
                                onChange={handleStatusChange}
                                className="w-full p-3 border border-slate-300 rounded-lg bg-white"
                            >
                                {APPLICATION_STATUS_ORDER.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                            <p className="text-sm text-text-secondary">Update the current stage of your application process for this job.</p>
                        </div>
                    )}
                    {activeTab === 'Notes' && (
                        <div className="space-y-4">
                            <h4 className="font-bold text-lg text-text-primary">My Notes</h4>
                             <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={8}
                                className="w-full p-3 border border-slate-300 rounded-lg bg-white"
                                placeholder="Add notes about interviews, contacts, or next steps..."
                            />
                            <button
                                onClick={handleSaveNotes}
                                className="px-6 py-2 bg-gradient-secondary text-white font-bold rounded-lg shadow-md hover:opacity-90 transition"
                            >
                                Save Notes
                            </button>
                        </div>
                    )}
                    {activeTab === 'Resume' && (
                        <div>
                             <h4 className="font-bold text-lg text-text-primary mb-4 flex items-center">
                                <DocumentCheckIcon className="w-5 h-5 mr-2 text-primary"/>
                                Sent Resume
                            </h4>
                            {jobData.tailoredResume ? (
                                <div className="p-4 bg-white border border-slate-200 rounded-md whitespace-pre-wrap font-mono text-sm leading-relaxed">
                                    {jobData.tailoredResume}
                                </div>
                            ) : (
                                <div className="text-center p-8 bg-white rounded-lg border border-dashed">
                                    <FileTextIcon className="mx-auto w-12 h-12 text-text-secondary opacity-50"/>
                                    <p className="mt-2 text-text-secondary">No tailored resume saved for this application.</p>
                                    <p className="text-sm text-text-secondary">Generate one from the job details page.</p>
                                </div>
                            )}
                        </div>
                    )}
                     {activeTab === 'Cover Letter' && (
                        <div>
                             <h4 className="font-bold text-lg text-text-primary mb-4 flex items-center">
                                <DocumentCheckIcon className="w-5 h-5 mr-2 text-primary"/>
                                Sent Cover Letter
                            </h4>
                            {jobData.tailoredCoverLetter ? (
                                <div className="p-4 bg-white border border-slate-200 rounded-md whitespace-pre-wrap leading-relaxed">
                                    {jobData.tailoredCoverLetter}
                                </div>
                            ) : (
                                <div className="text-center p-8 bg-white rounded-lg border border-dashed">
                                    <MailIcon className="mx-auto w-12 h-12 text-text-secondary opacity-50"/>
                                    <p className="mt-2 text-text-secondary">No cover letter saved for this application.</p>
                                     <p className="text-sm text-text-secondary">Generate one from the job details page.</p>
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'Insights' && (
                        <div>
                            <h4 className="font-bold text-lg text-text-primary mb-4 flex items-center">
                                <LightbulbIcon className="w-5 h-5 mr-2 text-primary"/>
                                AI Application Insights
                            </h4>
                            {isLoadingInsights ? (
                                <LoadingSpinner text="Generating strategic insights..." />
                            ) : jobData.applicationInsights ? (
                                <InsightsDisplay insights={jobData.applicationInsights} />
                            ) : (
                                <div className="text-center p-8 bg-white rounded-lg border border-dashed">
                                    <p className="text-text-secondary">Get a strategic advantage for your interview.</p>
                                    <button
                                        onClick={handleGenerateInsights}
                                        className="mt-4 px-6 py-2 bg-gradient-primary text-white font-bold rounded-lg shadow-md hover:opacity-90 transition"
                                    >
                                        ✨ Generate Insights
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrackerModal;