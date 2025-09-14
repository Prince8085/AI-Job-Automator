
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { UserProfile, Job, TrackedJob, ApplicationStatus, ToastMessage } from '../types';
import { MOCK_USER_PROFILE, MOCK_JOBS, MOCK_TRACKED_JOBS } from '../constants';
import { searchLiveJobs } from '../services/geminiService';

interface JobContextType {
  // User Profile
  userProfile: UserProfile;
  updateUserProfile: (profile: UserProfile) => void;
  // Jobs
  allJobs: Job[];
  trackedJobs: TrackedJob[];
  getJobById: (id: string) => Job | TrackedJob | undefined;
  trackJob: (job: Job) => void;
  updateJobStatus: (jobId: string, status: ApplicationStatus) => void;
  saveTrackedJobData: (jobId: string, data: Partial<Omit<TrackedJob, 'id' | 'status'>>) => void;
  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type: ToastMessage['type']) => void;
  removeToast: (id: number) => void;
  // Wishlist
  wishlistedJobs: Job[];
  toggleWishlist: (job: Job) => void;
  addAllToWishlist: (jobs: Job[]) => void;
  isJobWishlisted: (jobId: string) => boolean;
  // Live Search
  liveSearchResults: Job[];
  isSearching: boolean;
  searchError: string;
  performLiveSearch: (searchTerm: string, location: string) => Promise<void>;
  clearLiveSearch: () => void;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(MOCK_USER_PROFILE);
  const [allJobs, setAllJobs] = useState<Job[]>(MOCK_JOBS);
  const [trackedJobs, setTrackedJobs] = useState<TrackedJob[]>(MOCK_TRACKED_JOBS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [wishlistedJobs, setWishlistedJobs] = useState<Job[]>(() => MOCK_TRACKED_JOBS.filter(j => j.isWishlisted));
  
  // State for preserving live search results
  const [liveSearchResults, setLiveSearchResults] = useState<Job[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const resetData = () => {
    setUserProfile(MOCK_USER_PROFILE);
    setAllJobs(MOCK_JOBS);
    setTrackedJobs(MOCK_TRACKED_JOBS);
    setWishlistedJobs(MOCK_TRACKED_JOBS.filter(j => j.isWishlisted));
    setLiveSearchResults([]);
    setSearchError('');
    setIsSearching(false);
  };
  
  const logout = () => {
    resetData();
  };

  const updateUserProfile = (profile: UserProfile) => {
    setUserProfile(profile);
  };

  const getJobById = useCallback((id: string): Job | TrackedJob | undefined => {
    // Search order is important for correct data retrieval
    const tracked = trackedJobs.find(j => j.id === id);
    if (tracked) return tracked;
    const live = liveSearchResults.find(j => j.id === id);
    if (live) return live;
    const wishlisted = wishlistedJobs.find(j => j.id === id);
    if (wishlisted) return wishlisted;
    return allJobs.find(j => j.id === id);
  }, [allJobs, trackedJobs, wishlistedJobs, liveSearchResults]);

  const trackJob = (job: Job) => {
    if (!trackedJobs.some(t => t.id === job.id)) {
      const newTrackedJob: TrackedJob = { ...job, status: ApplicationStatus.SAVED, notes: '' };
      setTrackedJobs(prev => [newTrackedJob, ...prev]);
      showToast('Job saved to tracker!', 'success');
    }
  };

  const updateJobStatus = (jobId: string, status: ApplicationStatus) => {
    setTrackedJobs(prev =>
      prev.map(job =>
        job.id === jobId ? { ...job, status } : job
      )
    );
  };

  const saveTrackedJobData = (jobId: string, data: Partial<Omit<TrackedJob, 'id'>>) => {
    setTrackedJobs(prev =>
      prev.map(job =>
        job.id === jobId ? { ...job, ...data } : job
      )
    );
  };

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);
  
  const removeToast = (id: number) => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  const isJobWishlisted = useCallback((jobId: string) => {
    return wishlistedJobs.some(job => job.id === jobId);
  }, [wishlistedJobs]);

  const toggleWishlist = useCallback((job: Job) => {
    const isCurrentlyWishlisted = isJobWishlisted(job.id);

    // Update wishlistedJobs state
    setWishlistedJobs(prev => {
        if (isCurrentlyWishlisted) {
            showToast('Removed from wishlist', 'info');
            return prev.filter(wJob => wJob.id !== job.id);
        } else {
            showToast('Added to wishlist', 'success');
            return [...prev, { ...job, isWishlisted: true }];
        }
    });

    // Also update the job in liveSearchResults if it exists there
    setLiveSearchResults(prev => prev.map(liveJob => 
      liveJob.id === job.id ? { ...liveJob, isWishlisted: !isCurrentlyWishlisted } : liveJob
    ));
    
  }, [showToast, isJobWishlisted]);

  const addAllToWishlist = useCallback((jobs: Job[]) => {
    setWishlistedJobs(prev => {
      const newJobs = jobs.filter(job => !prev.some(wJob => wJob.id === job.id));
      if (newJobs.length > 0) {
        showToast(`Added ${newJobs.length} jobs to wishlist!`, 'success');
        return [...prev, ...newJobs.map(j => ({...j, isWishlisted: true}))];
      }
      showToast('All jobs are already in your wishlist.', 'info');
      return prev;
    });

    setLiveSearchResults(prev => prev.map(liveJob => ({...liveJob, isWishlisted: true})));
  }, [showToast]);

  // Live search logic moved to context
  const performLiveSearch = async (searchTerm: string, location: string) => {
    if (!searchTerm && !location) {
        setSearchError("Please enter a search term or location.");
        return;
    }
    setIsSearching(true);
    setSearchError('');
    setLiveSearchResults([]);
    try {
        const results = await searchLiveJobs(searchTerm, location);
        // Sync wishlist status
        const syncedResults = results.map(job => ({
            ...job,
            isWishlisted: isJobWishlisted(job.id)
        }));
        setLiveSearchResults(syncedResults);
    } catch (error: any) {
        setSearchError(error.message || 'An unexpected error occurred.');
    } finally {
        setIsSearching(false);
    }
  };

  const clearLiveSearch = () => {
      setLiveSearchResults([]);
      setSearchError('');
  };


  const value = {
    logout,
    userProfile,
    updateUserProfile,
    allJobs,
    trackedJobs,
    getJobById,
    trackJob,
    updateJobStatus,
    saveTrackedJobData,
    toasts,
    showToast,
    removeToast,
    wishlistedJobs,
    toggleWishlist,
    addAllToWishlist,
    isJobWishlisted,
    liveSearchResults,
    isSearching,
    searchError,
    performLiveSearch,
    clearLiveSearch,
  };

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};

export const useJobData = () => {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error('useJobData must be used within a JobProvider');
  }
  return context;
};
