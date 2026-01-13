
import { Job, UserProfile, TrackedJob, ApplicationStatus, PotentialContact } from './types';

// Default empty user profile template - will be populated from Clerk auth or user input
export const DEFAULT_USER_PROFILE: UserProfile = {
  id: '',
  clerkUserId: '',
  name: '',
  email: '',
  phone: '',
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  profilePictureUrl: '',
  coverPhotoUrl: '',
  bio: '',
  baseResume: '',
  location: '',
  skills: [],
  experience: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

// Demo user profile - only used when VITE_DEMO_MODE=true
export const DEMO_USER_PROFILE: UserProfile = {
  id: 'demo-user-001',
  clerkUserId: 'demo_clerk_id',
  name: 'Demo User',
  email: 'demo@example.com',
  phone: '+1 234 567 8900',
  linkedinUrl: 'https://linkedin.com/in/demo-user',
  githubUrl: 'https://github.com/demo-user',
  portfolioUrl: 'https://demo-portfolio.com',
  profilePictureUrl: '',
  coverPhotoUrl: '',
  bio: 'This is a demo profile. Update your profile in the Profile section to personalize your experience.',
  baseResume: `DEMO USER
+1 234 567 8900 | demo@example.com | LinkedIn | GitHub

SUMMARY
Experienced professional looking for new opportunities. Update this resume in your Profile section.

EXPERIENCE
Your Experience Here | Company Name | Dates
- Add your work experience bullet points
- Highlight your achievements

PROJECTS
Your Projects | Technologies Used
- Describe your personal or professional projects
- Include the impact and technologies used

SKILLS
Languages: Add your programming languages
Frameworks: Add frameworks you know
Tools: Add tools and platforms you use

EDUCATION
Your Degree | University Name | Graduation Year`,
  location: 'Your Location',
  skills: ['Add', 'Your', 'Skills'],
  experience: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

// Application status order for Kanban board
export const APPLICATION_STATUS_ORDER = [
  ApplicationStatus.SAVED,
  ApplicationStatus.APPLIED,
  ApplicationStatus.INTERVIEWING,
  ApplicationStatus.OFFER,
  ApplicationStatus.REJECTED,
];

// Status colors for UI
export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, { bg: string; text: string; border: string }> = {
  [ApplicationStatus.SAVED]: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  [ApplicationStatus.APPLIED]: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  [ApplicationStatus.INTERVIEWING]: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  [ApplicationStatus.OFFER]: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  [ApplicationStatus.REJECTED]: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
};

// Helper function to get user profile (demo or default)
export const getInitialUserProfile = (): UserProfile => {
  const demoMode = (import.meta.env.VITE_DEMO_MODE ?? 'true') === 'true';
  return demoMode ? { ...DEMO_USER_PROFILE } : { ...DEFAULT_USER_PROFILE };
};

// LocalStorage keys for data persistence
export const STORAGE_KEYS = {
  USER_PROFILE: 'ai_job_automator_user_profile',
  TRACKED_JOBS: 'ai_job_automator_tracked_jobs',
  WISHLISTED_JOBS: 'ai_job_automator_wishlisted_jobs',
} as const;

// Save data to localStorage
export const saveToStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
};

// Load data from localStorage
export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error);
  }
  return defaultValue;
};

// Clear all stored data
export const clearStorage = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};
