
import React from 'react';
import { Job } from '../types';
import { HeartIcon, MapPinIcon } from './icons';
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
    e.stopPropagation();
    toggleWishlist(job);
  };

  // Get company initial for avatar
  const companyInitial = job.company.charAt(0).toUpperCase();

  // Generate a consistent color based on company name
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-rose-500 to-pink-600',
  ];
  const colorIndex = job.company.charCodeAt(0) % colors.length;
  const avatarGradient = colors[colorIndex];

  // Check if job is recent (posted within 24 hours)
  const isRecent = job.postedDate.includes('hour') || job.postedDate.includes('Just now') || job.postedDate === '1 day ago';

  return (
    <div
      onClick={() => onSelect(job)}
      className="
        group relative
        bg-white/80 backdrop-blur-sm
        p-5 rounded-2xl
        shadow-[0_4px_20px_rgba(0,0,0,0.08)]
        hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)]
        transition-all duration-300 ease-out
        cursor-pointer
        border border-gray-100/80
        hover:border-indigo-200
        hover:-translate-y-1
        overflow-hidden
      "
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-purple-50/0 group-hover:from-indigo-50/50 group-hover:to-purple-50/30 transition-all duration-300 rounded-2xl" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header Row */}
        <div className="flex justify-between items-start gap-4">
          {/* Company Avatar + Info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className={`
              flex-shrink-0 w-12 h-12 rounded-xl
              bg-gradient-to-br ${avatarGradient}
              flex items-center justify-center
              text-white font-bold text-lg
              shadow-lg shadow-indigo-500/20
              group-hover:scale-110 transition-transform duration-300
            `}>
              {companyInitial}
            </div>

            {/* Job Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-lg leading-tight truncate group-hover:text-indigo-600 transition-colors">
                {job.title}
              </h3>
              <p className="text-gray-700 font-medium text-sm mt-0.5 truncate">{job.company}</p>
              <div className="flex items-center text-gray-500 text-sm mt-1">
                <MapPinIcon className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                <span className="truncate">{job.location}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {showWishlistButton && (
              <button
                onClick={handleWishlistClick}
                className={`
                  p-2.5 rounded-xl transition-all duration-200
                  ${isWishlisted
                    ? 'bg-red-50 text-red-500 shadow-sm'
                    : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-400'
                  }
                `}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <HeartIcon fill={isWishlisted ? 'currentColor' : 'none'} className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="mt-4 flex flex-wrap gap-2">
          {isRecent && (
            <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
              🔥 New
            </span>
          )}
          {job.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
            >
              {tag}
            </span>
          ))}
          {job.tags.length > 3 && (
            <span className="text-gray-400 text-xs font-medium px-1 py-1">
              +{job.tags.length - 3}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="inline-flex items-center">
              ⏰ {job.postedDate}
            </span>
          </div>
          <div className="flex items-center">
            {job.salary && job.salary !== 'Not specified' ? (
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                💰 {job.salary}
              </span>
            ) : (
              <span className="text-gray-400 text-xs">Salary not disclosed</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
