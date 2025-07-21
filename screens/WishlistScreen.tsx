
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobData } from '../contexts/JobDataContext';
import ScreenWrapper from '../components/ScreenWrapper';
import JobCard from '../components/JobCard';
import { Job } from '../types';
import { HeartIcon } from '../components/icons';

const WishlistScreen: React.FC = () => {
  const navigate = useNavigate();
  const { wishlistedJobs } = useJobData();

  const handleJobSelect = (job: Job) => {
    navigate(`/job/${job.id}`, { state: { jobData: job } });
  };

  return (
    <ScreenWrapper>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-text-primary">My Job Wishlist</h2>

        {wishlistedJobs.length > 0 ? (
          <div className="space-y-4">
            {wishlistedJobs.map(job => (
              <JobCard 
                key={job.id} 
                job={job} 
                onSelect={handleJobSelect} 
                showWishlistButton={true} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-lg shadow-md">
            <HeartIcon className="mx-auto w-16 h-16 text-slate-400" />
            <h3 className="mt-4 text-xl font-bold text-text-primary">Your Wishlist is Empty</h3>
            <p className="mt-2 text-text-secondary">Click the heart icon on job listings to save them here.</p>
            <button
              onClick={() => navigate('/search')}
              className="mt-6 px-6 py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition"
            >
              Find Jobs
            </button>
          </div>
        )}
      </div>
    </ScreenWrapper>
  );
};

export default WishlistScreen;
