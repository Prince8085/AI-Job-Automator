import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useJobData, JobProvider } from '../../../contexts/JobDataContext';
import { ApplicationStatus } from '../../../types';

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ isSignedIn: false, userId: null, isLoaded: true }),
  useUser: () => ({ user: null }),
  useClerk: () => ({ signOut: vi.fn() }),
  SignInButton: ({ children }: any) => children,
  ClerkProvider: ({ children }: any) => children,
}));

describe('JobDataContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <JobProvider>{children}</JobProvider>
  );

  describe('useJobData hook', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useJobData(), { wrapper });
      
      expect(result.current.trackedJobs).toEqual([]);
      expect(result.current.wishlistedJobs).toEqual([]);
      expect(result.current.toasts).toEqual([]);
    });

    it('should track a job', () => {
      const { result } = renderHook(() => useJobData(), { wrapper });
      
      const mockJob = {
        id: 'job-1',
        title: 'Developer',
        company: 'TechCorp',
        location: 'Remote',
        description: 'Great job',
        tags: ['React'],
        salary: '100k',
        postedDate: 'Today'
      };

      act(() => {
        result.current.trackJob(mockJob);
      });

      expect(result.current.trackedJobs).toHaveLength(1);
      expect(result.current.trackedJobs[0].id).toBe('job-1');
    });

    it('should update job status', () => {
      const { result } = renderHook(() => useJobData(), { wrapper });
      
      const mockJob = {
        id: 'job-1',
        title: 'Developer',
        company: 'TechCorp',
        location: 'Remote',
        description: 'Great job',
        tags: ['React'],
        salary: '100k',
        postedDate: 'Today'
      };

      act(() => {
        result.current.trackJob(mockJob);
      });

      act(() => {
        result.current.updateJobStatus('job-1', ApplicationStatus.APPLIED);
      });

      expect(result.current.trackedJobs[0].status).toBe(ApplicationStatus.APPLIED);
    });

    it('should untrack a job', () => {
      const { result } = renderHook(() => useJobData(), { wrapper });
      
      const mockJob = {
        id: 'job-1',
        title: 'Developer',
        company: 'TechCorp',
        location: 'Remote',
        description: 'Great job',
        tags: ['React'],
        salary: '100k',
        postedDate: 'Today'
      };

      act(() => {
        result.current.trackJob(mockJob);
      });

      expect(result.current.trackedJobs).toHaveLength(1);

      act(() => {
        result.current.untrackJob('job-1');
      });

      expect(result.current.trackedJobs).toHaveLength(0);
    });

    it('should toggle wishlist', () => {
      const { result } = renderHook(() => useJobData(), { wrapper });
      
      const mockJob = {
        id: 'job-1',
        title: 'Developer',
        company: 'TechCorp',
        location: 'Remote',
        description: 'Great job',
        tags: ['React'],
        salary: '100k',
        postedDate: 'Today'
      };

      act(() => {
        result.current.toggleWishlist(mockJob);
      });

      expect(result.current.wishlistedJobs).toHaveLength(1);

      act(() => {
        result.current.toggleWishlist(mockJob);
      });

      expect(result.current.wishlistedJobs).toHaveLength(0);
    });

    it('should show toast notifications', () => {
      const { result } = renderHook(() => useJobData(), { wrapper });
      
      act(() => {
        result.current.showToast('Test message', 'success');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].message).toBe('Test message');
    });
  });
});
