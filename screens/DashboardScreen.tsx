
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobData } from '../contexts/JobDataContext';
import ScreenWrapper from '../components/ScreenWrapper';
import StatCard from '../components/StatCard';
import JobCard from '../components/JobCard';
import { ApplicationStatus } from '../types';
import { BriefcaseIcon, FileTextIcon, MailIcon, ClipboardDocumentCheckIcon, SparklesIcon, TrophyIcon, RouteIcon, LinkIcon } from '../components/icons';

const GoalProgress: React.FC<{ label: string; current: number; goal: number; }> = ({ label, current, goal }) => {
  const progress = Math.min((current / goal) * 100, 100);
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <span className="text-sm font-semibold text-primary">{current} / {goal}</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5">
        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};


const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, trackedJobs, allJobs } = useJobData();
  
  const stats = {
    applied: trackedJobs.filter(j => j.status === ApplicationStatus.APPLIED).length,
    interviewing: trackedJobs.filter(j => j.status === ApplicationStatus.INTERVIEWING).length,
    saved: trackedJobs.filter(j => j.status === ApplicationStatus.SAVED).length,
  };

  const recentJobs = allJobs.slice(0, 2);

  return (
    <ScreenWrapper>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-text-primary">Welcome back, {userProfile.name.split(' ')[0]}!</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Applied" value={stats.applied} icon={<MailIcon />} color="bg-blue-500" />
          <StatCard title="Interviewing" value={stats.interviewing} icon={<BriefcaseIcon />} color="bg-green-500" />
          <StatCard title="Saved Jobs" value={stats.saved} icon={<FileTextIcon />} color="bg-yellow-500" />
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
            <div className="flex items-center">
                <TrophyIcon className="w-6 h-6 text-yellow-500" />
                <h3 className="text-xl font-bold text-text-primary ml-2">Weekly Goals</h3>
            </div>
            <GoalProgress label="Jobs Applied" current={stats.applied} goal={5} />
            <GoalProgress label="Interviews Scheduled" current={stats.interviewing} goal={2} />
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-text-primary">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
             <button onClick={() => navigate('/search')} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center flex flex-col items-center justify-center">
              <SparklesIcon className="w-8 h-8 text-primary" />
              <p className="mt-2 font-semibold">Find New Jobs</p>
            </button>
            <button onClick={() => navigate('/career-planner')} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center flex flex-col items-center justify-center">
              <RouteIcon className="w-8 h-8 text-secondary" />
              <p className="mt-2 font-semibold">Plan Your Career</p>
            </button>
            <button onClick={() => navigate('/autofill-resume')} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center flex flex-col items-center justify-center">
              <LinkIcon className="w-8 h-8 text-green-500" />
              <p className="mt-2 font-semibold">Smart Autofill</p>
              <p className="text-xs text-text-secondary mt-1">Paste URL to autofill resume</p>
            </button>
            <button onClick={() => navigate('/analyze-job')} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center flex flex-col items-center justify-center">
              <ClipboardDocumentCheckIcon className="w-8 h-8 text-indigo-500" />
              <p className="mt-2 font-semibold">Analyze Job Posting</p>
              <p className="text-xs text-text-secondary mt-1">Paste text or upload image</p>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-text-primary">Recently Added Jobs</h3>
          {recentJobs.length > 0 ? (
            <div className="space-y-4">
              {recentJobs.map(job => (
                <JobCard key={job.id} job={job} onSelect={(j) => navigate(`/job/${j.id}`)} />
              ))}
            </div>
          ) : (
            <p className="text-text-secondary">No new jobs found.</p>
          )}
        </div>
      </div>
    </ScreenWrapper>
  );
};

export default DashboardScreen;
