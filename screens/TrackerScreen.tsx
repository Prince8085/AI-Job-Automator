
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobData } from '../contexts/JobDataContext';
import { ApplicationStatus, TrackedJob } from '../types';
import { APPLICATION_STATUS_ORDER } from '../constants';
import ScreenWrapper from '../components/ScreenWrapper';
import { BriefcaseIcon } from '../components/icons';
import TrackerModal from '../components/TrackerModal';

const statusColors: { [key in ApplicationStatus]: string } = {
  [ApplicationStatus.SAVED]: 'bg-slate-200 text-slate-800',
  [ApplicationStatus.APPLIED]: 'bg-blue-200 text-blue-800',
  [ApplicationStatus.INTERVIEWING]: 'bg-yellow-200 text-yellow-800',
  [ApplicationStatus.OFFER]: 'bg-green-200 text-green-800',
  [ApplicationStatus.REJECTED]: 'bg-red-200 text-red-800',
};

const JobTrackerCard: React.FC<{ job: TrackedJob; onSelect: (job: TrackedJob) => void }> = ({ job, onSelect }) => (
  <div
    onClick={() => onSelect(job)}
    className="bg-white p-3 rounded-md shadow-sm cursor-pointer hover:shadow-md transition-shadow"
  >
    <h4 className="font-bold text-text-primary truncate">{job.title}</h4>
    <p className="text-sm text-text-secondary">{job.company}</p>
  </div>
);

const StatusColumn: React.FC<{ status: ApplicationStatus; jobs: TrackedJob[]; onSelectJob: (job: TrackedJob) => void }> = ({ status, jobs, onSelectJob }) => (
  <div className="flex-shrink-0 w-80 bg-slate-50 rounded-lg p-3">
    <div className="flex items-center mb-4">
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[status]}`}>
        {status}
      </span>
      <span className="ml-2 text-sm font-bold text-text-secondary">{jobs.length}</span>
    </div>
    <div className="space-y-3 h-[calc(100vh-15rem)] overflow-y-auto pr-1">
      {jobs.length > 0 ? (
        jobs.map(job => (
          <JobTrackerCard key={job.id} job={job} onSelect={onSelectJob} />
        ))
      ) : (
        <div className="text-center py-10 text-sm text-text-secondary">
          No jobs in this stage.
        </div>
      )}
    </div>
  </div>
);

const TrackerScreen: React.FC = () => {
  const { trackedJobs } = useJobData();
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState<TrackedJob | null>(null);

  const handleSelectJob = (job: TrackedJob) => {
    setSelectedJob(job);
  };
  
  const handleCloseModal = () => {
    setSelectedJob(null);
  };

  if (trackedJobs.length === 0) {
    return (
      <ScreenWrapper>
        <div className="text-center py-20">
          <BriefcaseIcon className="mx-auto w-16 h-16 text-text-secondary" />
          <h3 className="mt-4 text-xl font-bold text-text-primary">Your Tracker is Empty</h3>
          <p className="mt-2 text-text-secondary">Start by finding jobs and tracking them to see them here.</p>
          <button
            onClick={() => navigate('/search')}
            className="mt-6 px-6 py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition"
          >
            Find Jobs
          </button>
        </div>
      </ScreenWrapper>
    );
  }

  const jobsByStatus = APPLICATION_STATUS_ORDER.reduce((acc, status) => {
    acc[status] = trackedJobs.filter(job => job.status === status);
    return acc;
  }, {} as Record<ApplicationStatus, TrackedJob[]>);

  return (
    <>
      <div className="px-4 pt-4">
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {APPLICATION_STATUS_ORDER.map(status => (
            <StatusColumn
              key={status}
              status={status}
              jobs={jobsByStatus[status]}
              onSelectJob={handleSelectJob}
            />
          ))}
        </div>
      </div>
      {selectedJob && (
        <TrackerModal 
          job={selectedJob}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default TrackerScreen;
