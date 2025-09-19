
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
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
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  
  const [userProfile, setUserProfile] = useState<UserProfile>(MOCK_USER_PROFILE);
  const [allJobs, setAllJobs] = useState<Job[]>(MOCK_JOBS);
  const [trackedJobs, setTrackedJobs] = useState<TrackedJob[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [wishlistedJobs, setWishlistedJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // State for preserving live search results
  const [liveSearchResults, setLiveSearchResults] = useState<Job[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Load user data when authenticated
  useEffect(() => {
    const loadUserData = async () => {
      if (!isSignedIn || !userId || !user) return;
      
      setIsLoading(true);
      try {
        // Mock user profile creation (replace with actual database calls when backend is ready)
        const mockUserProfile = {
          ...MOCK_USER_PROFILE,
          clerkUserId: userId,
          name: user.fullName || user.firstName || 'User',
          email: user.primaryEmailAddress?.emailAddress || '',
          phone: user.primaryPhoneNumber?.phoneNumber || '',
          profilePictureUrl: user.imageUrl || '',
        };
        
        setUserProfile(mockUserProfile);
        
        // Load mock tracked jobs for the user
        setTrackedJobs(MOCK_TRACKED_JOBS);
        
        // Load mock wishlisted jobs
        const mockWishlistedJobs = MOCK_JOBS.slice(0, 3); // First 3 jobs as wishlisted
        setWishlistedJobs(mockWishlistedJobs);
        
        console.log('Mock user data loaded successfully');
        
      } catch (error) {
        console.error('Error loading user data:', error);
        showToast('Failed to load user data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [isSignedIn, userId, user]);

  const resetData = () => {
    setUserProfile(MOCK_USER_PROFILE);
    setAllJobs(MOCK_JOBS);
    setTrackedJobs([]);
    setWishlistedJobs([]);
    setLiveSearchResults([]);
    setSearchError('');
    setIsSearching(false);
  };
  
  const logout = () => {
    resetData();
  };

  const updateUserProfile = async (profile: UserProfile) => {
    if (!isSignedIn || !userId) {
      setUserProfile(profile);
      return;
    }

    try {
      // Mock update user profile (replace with actual database calls when backend is ready)
      setUserProfile(profile);
      console.log('Mock user profile updated:', profile);
      showToast('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating user profile:', error);
      showToast('Failed to update profile', 'error');
    }
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

  const trackJob = async (job: Job) => {
    if (!isSignedIn || !userId) {
      // Fallback to local state for non-authenticated users
      if (!trackedJobs.some(t => t.id === job.id)) {
        const newTrackedJob: TrackedJob = { ...job, status: ApplicationStatus.SAVED, notes: '' };
        setTrackedJobs(prev => [newTrackedJob, ...prev]);
        showToast('Job saved to tracker!', 'success');
      }
      return;
    }

    if (trackedJobs.some(t => t.id === job.id)) {
      showToast('Job is already tracked!', 'info');
      return;
    }

    try {
      // Mock job tracking (replace with actual database calls when backend is ready)
      const newTrackedJob: TrackedJob = { ...job, status: ApplicationStatus.SAVED, notes: '' };
      setTrackedJobs(prev => [newTrackedJob, ...prev]);
      console.log('Mock job tracked:', newTrackedJob);
      showToast('Job saved to tracker!', 'success');
    } catch (error) {
      console.error('Error tracking job:', error);
      showToast('Failed to save job', 'error');
    }
  };

  const updateJobStatus = async (jobId: string, status: ApplicationStatus) => {
    if (!isSignedIn || !userId) {
      // Fallback to local state for non-authenticated users
      setTrackedJobs(prev =>
        prev.map(job =>
          job.id === jobId ? { ...job, status } : job
        )
      );
      return;
    }

    try {
      // Mock update job status (replace with actual database calls when backend is ready)
      setTrackedJobs(prev =>
        prev.map(job =>
          job.id === jobId ? { ...job, status } : job
        )
      );
      console.log('Mock job status updated:', { jobId, status });
    } catch (error) {
      console.error('Error updating job status:', error);
      showToast('Failed to update job status', 'error');
    }
  };

  const saveTrackedJobData = async (jobId: string, data: Partial<Omit<TrackedJob, 'id'>>) => {
    if (!isSignedIn || !userId) {
      // Fallback to local state for non-authenticated users
      setTrackedJobs(prev =>
        prev.map(job =>
          job.id === jobId ? { ...job, ...data } : job
        )
      );
      return;
    }

    try {
      // Mock save tracked job data (replace with actual database calls when backend is ready)
      setTrackedJobs(prev =>
        prev.map(job =>
          job.id === jobId ? { ...job, ...data } : job
        )
      );
      console.log('Mock tracked job data saved:', { jobId, data });
    } catch (error) {
      console.error('Error saving tracked job data:', error);
      showToast('Failed to save job data', 'error');
    }
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

  const toggleWishlist = useCallback(async (job: Job) => {
    const isCurrentlyWishlisted = isJobWishlisted(job.id);
    
    if (!isSignedIn || !userId) {
      // Fallback to local state for non-authenticated users
      setWishlistedJobs(prev => {
          if (isCurrentlyWishlisted) {
              showToast('Removed from wishlist', 'info');
              return prev.filter(wJob => wJob.id !== job.id);
          } else {
              showToast('Added to wishlist!', 'success');
              return [...prev, { ...job, isWishlisted: true }];
          }
      });
      
      // Also update the job in liveSearchResults if it exists there
      setLiveSearchResults(prev => prev.map(liveJob => 
        liveJob.id === job.id ? { ...liveJob, isWishlisted: !isCurrentlyWishlisted } : liveJob
      ));
      return;
    }

    try {
      // Mock wishlist toggle (replace with actual database calls when backend is ready)
      if (isCurrentlyWishlisted) {
        setWishlistedJobs(prev => prev.filter(w => w.id !== job.id));
        showToast('Removed from wishlist', 'info');
        console.log('Mock job removed from wishlist:', job.id);
      } else {
        setWishlistedJobs(prev => [...prev, { ...job, isWishlisted: true }]);
        showToast('Added to wishlist!', 'success');
        console.log('Mock job added to wishlist:', job.id);
      }
      
      // Also update the job in liveSearchResults if it exists there
      setLiveSearchResults(prev => prev.map(liveJob => 
        liveJob.id === job.id ? { ...liveJob, isWishlisted: !isCurrentlyWishlisted } : liveJob
      ));
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      showToast('Failed to update wishlist', 'error');
    }
  }, [showToast, isJobWishlisted, isSignedIn, userId, userProfile.id]);

  const addAllToWishlist = useCallback(async (jobs: Job[]) => {
    const newWishlistedJobs = jobs.filter(job => !isJobWishlisted(job.id));
    
    if (newWishlistedJobs.length === 0) {
      showToast('All jobs are already in wishlist', 'info');
      return;
    }

    if (!isSignedIn || !userId) {
      // Fallback to local state for non-authenticated users
      setWishlistedJobs(prev => [
        ...prev,
        ...newWishlistedJobs.map(job => ({ ...job, isWishlisted: true }))
      ]);
      showToast(`Added ${newWishlistedJobs.length} jobs to wishlist!`, 'success');
      return;
    }

    try {
      // Mock add all to wishlist (replace with actual database calls when backend is ready)
      setWishlistedJobs(prev => [
        ...prev,
        ...newWishlistedJobs.map(job => ({ ...job, isWishlisted: true }))
      ]);

      console.log('Mock jobs added to wishlist:', newWishlistedJobs.map(j => j.id));
      showToast(`Added ${newWishlistedJobs.length} jobs to wishlist!`, 'success');
    } catch (error) {
      console.error('Error adding jobs to wishlist:', error);
      showToast('Failed to add jobs to wishlist', 'error');
    }

    setLiveSearchResults(prev => prev.map(liveJob => ({...liveJob, isWishlisted: true})));
  }, [isJobWishlisted, showToast, isSignedIn, userId, userProfile.id]);

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
