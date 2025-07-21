
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobData } from '../contexts/JobDataContext';
import ScreenWrapper from '../components/ScreenWrapper';
import JobCard from '../components/JobCard';
import { Job } from '../types';
import { SearchIcon, SparklesIcon, HeartIcon } from '../components/icons';
import JobCardSkeleton from '../components/JobCardSkeleton';

const SearchScreen: React.FC = () => {
  const navigate = useNavigate();
  const { 
    allJobs, 
    addAllToWishlist,
    liveSearchResults,
    isSearching,
    searchError,
    performLiveSearch,
    clearLiveSearch,
  } = useJobData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    // This effect ensures that if the component unmounts,
    // we don't clear the search unless the user explicitly wants to.
    // The state is now managed globally.
  }, []);

  const filteredMockJobs = useMemo(() => {
    return allJobs.filter(job => {
      const termMatch = searchTerm.toLowerCase() === '' || 
                        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        job.company.toLowerCase().includes(searchTerm.toLowerCase());
      const locationMatch = location.toLowerCase() === '' ||
                            job.location.toLowerCase().includes(location.toLowerCase());
      return termMatch && locationMatch;
    });
  }, [allJobs, searchTerm, location]);
  
  const handleJobSelect = (job: Job) => {
    navigate(`/job/${job.id}`, { state: { jobData: job } });
  };

  const handleLiveSearch = () => {
    performLiveSearch(searchTerm, location);
  };

  return (
    <ScreenWrapper>
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Job title or company"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              aria-label="Search by job title or company"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          </div>
          <div className="relative mt-3">
            <input
              type="text"
              placeholder="Location (e.g., city, remote)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              aria-label="Search by location"
            />
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <button
            onClick={handleLiveSearch}
            disabled={isSearching}
            className="mt-4 w-full flex items-center justify-center py-3 px-6 text-white font-bold bg-gradient-primary rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-wait"
          >
            <SparklesIcon className="w-5 h-5 mr-2" />
            {isSearching ? 'Searching...' : 'Search Live Jobs with AI'}
          </button>
        </div>

        {isSearching && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-primary mb-4">
              Finding Live Jobs...
            </h3>
            {[...Array(3)].map((_, i) => <JobCardSkeleton key={i} />)}
          </div>
        )}
        {searchError && <div className="bg-red-100 text-red-700 p-4 rounded-lg">{searchError}</div>}

        {liveSearchResults.length > 0 && (
           <div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-xl font-bold text-text-primary">
                        AI-Powered Job Results
                    </h3>
                    <button onClick={clearLiveSearch} className="text-sm text-primary hover:underline">
                        Clear Search
                    </button>
                </div>
              <button
                onClick={() => addAllToWishlist(liveSearchResults)}
                className="flex-shrink-0 flex items-center px-4 py-2 text-sm font-semibold text-primary bg-indigo-100 rounded-lg hover:bg-indigo-200 transition"
              >
                <HeartIcon className="w-4 h-4 mr-2" />
                Add All to Wishlist
              </button>
            </div>
            <div className="space-y-4">
              {liveSearchResults.map(job => (
                <JobCard key={job.id} job={job} onSelect={handleJobSelect} showWishlistButton />
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-xl font-bold text-text-primary mb-4">
            Browse Demo Jobs
          </h3>
          {filteredMockJobs.length > 0 ? (
            <div className="space-y-4">
              {filteredMockJobs.map(job => (
                <JobCard key={job.id} job={job} onSelect={handleJobSelect} />
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
              <h4 className="text-lg font-semibold">No demo jobs match your criteria</h4>
              <p className="text-text-secondary mt-2">Try adjusting your search terms or use the live search.</p>
            </div>
          )}
        </div>
      </div>
    </ScreenWrapper>
  );
};

export default SearchScreen;
