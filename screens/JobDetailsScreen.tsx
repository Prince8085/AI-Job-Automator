
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useJobData } from '../contexts/JobDataContext';
import ScreenWrapper from '../components/ScreenWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import { Job, TrackedJob } from '../types';
import { FileTextIcon, MailIcon, LightbulbIcon, BarChartIcon, SendIcon, BuildingIcon, CurrencyDollarIcon, UsersIcon, ArrowUpRightIcon, PaperAirplaneIcon, BriefcaseIcon } from '../components/icons';

const ActionButton: React.FC<{ icon: React.ReactElement<{ className?: string }>, text: string, onClick: () => void, disabled?: boolean }> = ({ icon, text, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex items-center justify-center w-full bg-white p-4 rounded-lg shadow-md hover:shadow-lg hover:bg-slate-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-left"
  >
    {React.cloneElement(icon, { className: "w-6 h-6 text-primary flex-shrink-0"})}
    <span className="ml-3 font-semibold text-text-primary">{text}</span>
  </button>
);

const JobDetailsScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { getJobById, trackJob, trackedJobs } = useJobData();
  const [job, setJob] = useState<Job | TrackedJob | undefined | null>(undefined); // Start as undefined

  useEffect(() => {
    // If job data is passed via navigation state, use it directly.
    // This is for newly generated "live" or "imported" jobs.
    if (location.state?.jobData) {
      const jobFromState = location.state.jobData as Job;
      // Check if this job is already tracked to show the correct status
      const trackedVersion = trackedJobs.find(j => j.id === jobFromState.id);
      setJob(trackedVersion || jobFromState);
    } else if (id) {
      // Otherwise, fetch from context. This is for tracked or mock jobs.
      const foundJob = getJobById(id);
      setJob(foundJob || null); // Set to null if not found
    }
  }, [id, getJobById, location.state, trackedJobs]);

  if (job === undefined) {
    return (
      <ScreenWrapper>
        <LoadingSpinner text="Loading job details..." />
      </ScreenWrapper>
    );
  }
  
  if (job === null) {
      return (
        <ScreenWrapper>
            <div className="text-center py-20 bg-white rounded-lg shadow-md">
                <BriefcaseIcon className="mx-auto w-16 h-16 text-slate-400" />
                <h3 className="mt-4 text-xl font-bold text-text-primary">Job Not Found</h3>
                <p className="mt-2 text-text-secondary">The job you are looking for does not exist or has been removed.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-6 px-6 py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition"
                >
                    Go Back
                </button>
            </div>
        </ScreenWrapper>
      )
  }
  
  const isTracked = 'status' in job;

  const handleTrackJob = () => {
    if (!isTracked) {
      trackJob(job);
    } else {
      // If already tracked, navigate to the tracker as a shortcut
      navigate('/tracker');
    }
  };

  return (
    <ScreenWrapper>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-primary">{job.title}</h2>
        <p className="text-lg font-semibold text-text-primary mt-1">{job.company}</p>
        <p className="text-text-secondary">{job.location}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {job.tags.map((tag) => (
            <span key={tag} className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>
          ))}
        </div>
        
        <div className="mt-4 flex flex-wrap gap-4 items-center">
            {job.sourceUrl && (
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-semibold text-primary hover:text-indigo-700"
              >
                View Original Posting
                <ArrowUpRightIcon className="w-4 h-4 ml-1" />
              </a>
            )}
            <button
              onClick={handleTrackJob}
              title={isTracked ? "Go to Tracker" : "Save to Tracker"}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                isTracked
                  ? 'bg-secondary text-white hover:bg-emerald-600'
                  : 'bg-slate-200 text-text-secondary hover:bg-slate-300'
              }`}
            >
              {isTracked ? '✓ Saved to Tracker' : 'Save to Tracker'}
            </button>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-text-primary mb-2">Job Description</h3>
          <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">{job.description}</p>
        </div>
      </div>
      
       <div className="mt-6">
         <ActionButton 
            icon={<PaperAirplaneIcon />} 
            text="Easy Apply with AI" 
            onClick={() => navigate(`/easy-apply/${job.id}`, { state: { jobData: job } })}
            disabled={!job.sourceUrl}
         />
         {!job.sourceUrl && <p className="text-xs text-center mt-1 text-text-secondary">This feature requires a direct link to the job posting.</p>}
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-bold text-text-primary mb-4">AI Power-Ups ✨</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ActionButton icon={<FileTextIcon />} text="Tailor Resume for this Job" onClick={() => navigate(`/resume/${job.id}`, { state: { jobData: job } })} />
            <ActionButton icon={<MailIcon />} text="Generate Cover Letter" onClick={() => navigate(`/cover-letter/${job.id}`, { state: { jobData: job } })} />
            <ActionButton icon={<LightbulbIcon />} text="Prepare for Interview" onClick={() => navigate(`/interview-prep/${job.id}`, { state: { jobData: job } })} />
            <ActionButton icon={<BarChartIcon />} text="Run Skills Gap Analysis" onClick={() => navigate(`/skills-gap/${job.id}`, { state: { jobData: job } })} />
            <ActionButton icon={<BuildingIcon />} text="Generate Company Briefing" onClick={() => navigate(`/company-briefing/${job.id}`, { state: { jobData: job } })} />
            <ActionButton icon={<SendIcon />} text="Generate Follow-up Email" onClick={() => navigate(`/follow-up/${job.id}`, { state: { jobData: job } })} />
            <ActionButton icon={<UsersIcon />} text="Find Potential Contacts" onClick={() => navigate(`/networking/${job.id}`, { state: { jobData: job } })} />
            <ActionButton icon={<CurrencyDollarIcon />} text="AI Negotiation Coach" onClick={() => navigate(`/negotiate/${job.id}`, { state: { jobData: job } })} />
        </div>
      </div>
    </ScreenWrapper>
  );
};

export default JobDetailsScreen;
