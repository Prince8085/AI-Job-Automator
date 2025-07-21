
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useJobData } from '../contexts/JobDataContext';
import { generateFollowUpEmail } from '../services/geminiService';
import ScreenWrapper from '../components/ScreenWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import { Job } from '../types';
import { ClipboardCopyIcon, CheckIcon } from '../components/icons';

const FollowUpEmailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { getJobById, userProfile, showToast } = useJobData();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailBody, setEmailBody] = useState('');

  // Form state
  const [interviewerName, setInterviewerName] = useState('');
  const [interviewDate, setInterviewDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (location.state?.jobData) {
      setJob(location.state.jobData);
    } else if (id) {
      const foundJob = getJobById(id);
      if (foundJob) setJob(foundJob);
    }
  }, [id, getJobById, location.state]);

  const handleGenerate = async () => {
    if (!interviewerName || !interviewDate) {
        showToast("Please fill in interviewer's name and date.", 'error');
        return;
    }
    if (!job) return;
    setIsLoading(true);
    setEmailBody('');
    setIsCopied(false);
    try {
      const result = await generateFollowUpEmail(userProfile, job, interviewerName, interviewDate, notes);
      setEmailBody(result);
      showToast('Follow-up email generated!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error generating email.', 'error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(emailBody);
    setIsCopied(true);
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  }

  if (!job) return <ScreenWrapper><LoadingSpinner text="Loading..." /></ScreenWrapper>;

  return (
    <ScreenWrapper>
      <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
        <h2 className="text-2xl font-bold text-text-primary">AI Follow-up Email Generator</h2>
        <p className="text-text-secondary">Crafting a follow-up for the <span className="font-semibold text-primary">{job.title}</span> interview.</p>
        
        <div className="space-y-4 pt-4 border-t">
            <div>
                <label htmlFor="interviewerName" className="block text-sm font-medium text-text-secondary">Interviewer's Name</label>
                <input type="text" id="interviewerName" value={interviewerName} onChange={(e) => setInterviewerName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" placeholder="e.g., Jane Smith"/>
            </div>
             <div>
                <label htmlFor="interviewDate" className="block text-sm font-medium text-text-secondary">Interview Date</label>
                <input type="date" id="interviewDate" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm"/>
            </div>
             <div>
                <label htmlFor="notes" className="block text-sm font-medium text-text-secondary">Key Notes from the Interview (optional)</label>
                <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" placeholder="e.g., Discussed the upcoming 'Phoenix' project..."></textarea>
            </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full py-3 px-6 text-white font-bold bg-primary rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-300 disabled:cursor-wait"
        >
          {isLoading ? 'Generating...' : '✨ Generate Follow-up Email'}
        </button>
      </div>

      {isLoading && <LoadingSpinner text="AI is writing your email..." />}

      {emailBody && (
        <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-text-primary">Your Generated Email</h3>
             <button
                onClick={handleCopyToClipboard}
                disabled={isCopied}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition ${isCopied ? 'bg-green-500' : 'bg-secondary hover:bg-emerald-600'}`}
            >
                {isCopied ? (
                    <span className="flex items-center"><CheckIcon className="w-5 h-5 mr-2" /> Copied!</span>
                ) : (
                    <span className="flex items-center"><ClipboardCopyIcon className="w-5 h-5 mr-2" /> Copy Text</span>
                )}
            </button>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md whitespace-pre-wrap leading-relaxed">
            {emailBody}
          </div>
        </div>
      )}
    </ScreenWrapper>
  );
};

export default FollowUpEmailScreen;
