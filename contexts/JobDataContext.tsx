
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { UserProfile, Job, TrackedJob, ApplicationStatus, ToastMessage } from '../types';
import {
  getInitialUserProfile,
  STORAGE_KEYS,
  saveToStorage,
  loadFromStorage,
  DEMO_USER_PROFILE
} from '../constants';
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
  untrackJob: (jobId: string) => void;
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
  performLiveSearch: (searchTerm: string, location: string, timeFilter?: string) => Promise<void>;
  clearLiveSearch: () => void;
  // Data Management
  resetAllData: () => void;
  isLoading: boolean;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const demoMode = (import.meta.env.VITE_DEMO_MODE ?? 'true') === 'true';

  // Initialize state from localStorage or defaults
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const stored = loadFromStorage<UserProfile | null>(STORAGE_KEYS.USER_PROFILE, null);
    return stored || getInitialUserProfile();
  });

  const [allJobs, setAllJobs] = useState<Job[]>([]);

  const [trackedJobs, setTrackedJobs] = useState<TrackedJob[]>(() => {
    return loadFromStorage<TrackedJob[]>(STORAGE_KEYS.TRACKED_JOBS, []);
  });

  const [wishlistedJobs, setWishlistedJobs] = useState<Job[]>(() => {
    return loadFromStorage<Job[]>(STORAGE_KEYS.WISHLISTED_JOBS, []);
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // State for live search results
  const [liveSearchResults, setLiveSearchResults] = useState<Job[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Persist tracked jobs to localStorage whenever they change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TRACKED_JOBS, trackedJobs);
  }, [trackedJobs]);

  // Persist wishlisted jobs to localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.WISHLISTED_JOBS, wishlistedJobs);
  }, [wishlistedJobs]);

  // Persist user profile to localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.USER_PROFILE, userProfile);
  }, [userProfile]);

  // Load user data when authenticated with Clerk
  useEffect(() => {
    const loadUserData = async () => {
      if (!isSignedIn || !userId || !user) {
        // If not signed in but in demo mode, use demo profile
        if (demoMode && !userProfile.name) {
          setUserProfile(DEMO_USER_PROFILE);
        }
        return;
      }

      setIsLoading(true);
      try {
        // Update profile with Clerk user data
        const updatedProfile: UserProfile = {
          ...userProfile,
          id: userProfile.id || crypto.randomUUID(),
          clerkUserId: userId,
          name: user.fullName || user.firstName || userProfile.name || 'User',
          email: user.primaryEmailAddress?.emailAddress || userProfile.email,
          phone: user.primaryPhoneNumber?.phoneNumber || userProfile.phone,
          profilePictureUrl: user.imageUrl || userProfile.profilePictureUrl,
          updatedAt: new Date()
        };

        setUserProfile(updatedProfile);
        console.log('User profile synced with Clerk');

      } catch (error) {
        console.error('Error loading user data:', error);
        showToast('Failed to sync with account', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [isSignedIn, userId, user]);

  const resetAllData = useCallback(() => {
    setUserProfile(getInitialUserProfile());
    setAllJobs([]);
    setTrackedJobs([]);
    setWishlistedJobs([]);
    setLiveSearchResults([]);
    setSearchError('');
    setIsSearching(false);
    // Clear localStorage
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    showToast('All data has been reset', 'info');
  }, []);

  const updateUserProfile = useCallback((profile: UserProfile) => {
    const updatedProfile = {
      ...profile,
      updatedAt: new Date()
    };
    setUserProfile(updatedProfile);
    showToast('Profile updated successfully!', 'success');
  }, []);

  const getJobById = useCallback((id: string): Job | TrackedJob | undefined => {
    // Search in tracked jobs first (has most data)
    const tracked = trackedJobs.find(j => j.id === id);
    if (tracked) return tracked;

    // Search in live search results
    const live = liveSearchResults.find(j => j.id === id);
    if (live) return live;

    // Search in wishlisted jobs
    const wishlisted = wishlistedJobs.find(j => j.id === id);
    if (wishlisted) return wishlisted;

    // Search in all jobs
    return allJobs.find(j => j.id === id);
  }, [allJobs, trackedJobs, wishlistedJobs, liveSearchResults]);

  const trackJob = useCallback((job: Job) => {
    if (trackedJobs.some(t => t.id === job.id)) {
      showToast('Job is already tracked!', 'info');
      return;
    }

    const newTrackedJob: TrackedJob = {
      ...job,
      status: ApplicationStatus.SAVED,
      notes: ''
    };

    setTrackedJobs(prev => [newTrackedJob, ...prev]);
    showToast('Job saved to tracker!', 'success');
  }, [trackedJobs]);

  const untrackJob = useCallback((jobId: string) => {
    setTrackedJobs(prev => prev.filter(job => job.id !== jobId));
    showToast('Job removed from tracker', 'info');
  }, []);

  const updateJobStatus = useCallback((jobId: string, status: ApplicationStatus) => {
    setTrackedJobs(prev =>
      prev.map(job =>
        job.id === jobId ? { ...job, status } : job
      )
    );
  }, []);

  const saveTrackedJobData = useCallback((jobId: string, data: Partial<Omit<TrackedJob, 'id'>>) => {
    setTrackedJobs(prev =>
      prev.map(job =>
        job.id === jobId ? { ...job, ...data } : job
      )
    );
  }, []);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const isJobWishlisted = useCallback((jobId: string) => {
    return wishlistedJobs.some(job => job.id === jobId);
  }, [wishlistedJobs]);

  const toggleWishlist = useCallback((job: Job) => {
    const isCurrentlyWishlisted = isJobWishlisted(job.id);

    if (isCurrentlyWishlisted) {
      setWishlistedJobs(prev => prev.filter(wJob => wJob.id !== job.id));
      showToast('Removed from wishlist', 'info');
    } else {
      setWishlistedJobs(prev => [...prev, { ...job, isWishlisted: true }]);
      showToast('Added to wishlist!', 'success');
    }

    // Update in live search results too
    setLiveSearchResults(prev => prev.map(liveJob =>
      liveJob.id === job.id ? { ...liveJob, isWishlisted: !isCurrentlyWishlisted } : liveJob
    ));
  }, [isJobWishlisted, showToast]);

  const addAllToWishlist = useCallback((jobs: Job[]) => {
    const newWishlistedJobs = jobs.filter(job => !isJobWishlisted(job.id));

    if (newWishlistedJobs.length === 0) {
      showToast('All jobs are already in wishlist', 'info');
      return;
    }

    setWishlistedJobs(prev => [
      ...prev,
      ...newWishlistedJobs.map(job => ({ ...job, isWishlisted: true }))
    ]);

    showToast(`Added ${newWishlistedJobs.length} jobs to wishlist!`, 'success');

    // Update in live search results
    setLiveSearchResults(prev => prev.map(liveJob => ({ ...liveJob, isWishlisted: true })));
  }, [isJobWishlisted, showToast]);

  // Live search using FREE Job APIs
  const performLiveSearch = useCallback(async (searchTerm: string, location: string, timeFilter: string = 'any_time') => {
    if (!searchTerm && !location) {
      setSearchError("Please enter a search term or location.");
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setLiveSearchResults([]);

    try {
      const results = await searchLiveJobs(searchTerm, location, timeFilter);

      // Sync wishlist status with results
      const syncedResults = results.map(job => ({
        ...job,
        isWishlisted: isJobWishlisted(job.id)
      }));

      setLiveSearchResults(syncedResults);

      if (syncedResults.length === 0) {
        setSearchError('No jobs found. Try different keywords or location.');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setSearchError(error.message || 'An unexpected error occurred.');
    } finally {
      setIsSearching(false);
    }
  }, [isJobWishlisted]);

  const clearLiveSearch = useCallback(() => {
    setLiveSearchResults([]);
    setSearchError('');
  }, []);

  const value: JobContextType = {
    userProfile,
    updateUserProfile,
    allJobs,
    trackedJobs,
    getJobById,
    trackJob,
    untrackJob,
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
    resetAllData,
    isLoading,
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
