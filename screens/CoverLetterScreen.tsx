
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useJobData } from '../contexts/JobDataContext';
import { generateCoverLetter } from '../services/geminiService';
import ScreenWrapper from '../components/ScreenWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import { Job } from '../types';
import { ClipboardCopyIcon, CheckIcon } from '../components/icons';


const CoverLetterScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { getJobById, userProfile, showToast, trackedJobs, saveTrackedJobData } = useJobData();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
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
    if (!job) return;
    setIsLoading(true);
    setCoverLetter('');
    setIsCopied(false);
    try {
      const result = await generateCoverLetter(userProfile, job);
      setCoverLetter(result);
      showToast('Cover letter generated!', 'success');

       // Save tailored cover letter if the job is being tracked
      if (trackedJobs.some(trackedJob => trackedJob.id === job.id)) {
        saveTrackedJobData(job.id, { tailoredCoverLetter: result });
        showToast('Saved cover letter to tracker!', 'info');
      }

    } catch (err: any) {
      showToast(err.message || 'Error generating cover letter.', 'error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(coverLetter);
    setIsCopied(true);
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  }

  if (!job) return <ScreenWrapper><LoadingSpinner text="Loading..." /></ScreenWrapper>;

  return (
    <ScreenWrapper>
      <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
        <h2 className="text-2xl font-bold text-text-primary">AI Cover Letter Generator</h2>
        <p className="text-text-secondary">Generating a cover letter for <span className="font-semibold text-primary">{job.title}</span>.</p>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full py-3 px-6 text-white font-bold bg-primary rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-300 disabled:cursor-wait"
        >
          {isLoading ? 'Generating...' : '✨ Generate Cover Letter'}
        </button>
      </div>

      {isLoading && <LoadingSpinner text="AI is writing your cover letter..." />}

      {coverLetter && (
        <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-text-primary">Your Generated Cover Letter</h3>
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
            {coverLetter}
          </div>
        </div>
      )}
    </ScreenWrapper>
  );
};

export default CoverLetterScreen;
