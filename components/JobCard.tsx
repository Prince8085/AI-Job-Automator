
import React from 'react';
import { Job } from '../types';
import { BriefcaseIcon, HeartIcon } from './icons';
import { useJobData } from '../contexts/JobDataContext';

interface JobCardProps {
  job: Job;
  onSelect: (job: Job) => void;
  showWishlistButton?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ job, onSelect, showWishlistButton = false }) => {
  const { toggleWishlist, isJobWishlisted } = useJobData();
  const isWishlisted = isJobWishlisted(job.id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event from firing
    toggleWishlist(job);
  };

  return (
    <div 
      onClick={() => onSelect(job)}
      className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border border-slate-200 hover:-translate-y-1"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg text-primary">{job.title}</h3>
          <p className="text-text-primary font-semibold">{job.company}</p>
          <p className="text-sm text-text-secondary">{job.location}</p>
        </div>
        <div className="flex items-center space-x-2">
            {showWishlistButton && (
                <button 
                    onClick={handleWishlistClick} 
                    className={`p-2 rounded-full transition-colors duration-200 ${isWishlisted ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                    <HeartIcon fill={isWishlisted ? 'currentColor' : 'none'} className="w-6 h-6" />
                </button>
            )}
            <div className="p-2 bg-indigo-100 rounded-full">
                <BriefcaseIcon className="w-6 h-6 text-primary" />
            </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {job.tags.map((tag) => (
          <span key={tag} className="bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>
        ))}
      </div>
       <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm text-text-secondary">
          <span>{job.postedDate}</span>
          <span>{job.salary}</span>
      </div>
    </div>
  );
};

export default JobCard;
