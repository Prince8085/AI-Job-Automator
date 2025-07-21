
export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  bio: string;
  baseResume: string;
  profilePictureUrl?: string;
  coverPhotoUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description:string;
  tags: string[];
  salary: string;
  postedDate: string;
  sourceUrl?: string;
  isWishlisted?: boolean;
}

export enum ApplicationStatus {
  SAVED = 'Saved',
  APPLIED = 'Applied',
  INTERVIEWING = 'Interviewing',
  OFFER = 'Offer',
  REJECTED = 'Rejected'
}

export interface OfferDetails {
  salary: string;
  bonus: string;
  equity: string;
}

export interface ApplicationInsights {
  strengths: string[];
  talkingPoints: string[];
  redFlags: string[];
}

export interface StructuredResume {
  contact: {
    name: string;
    email: string;
    phone: string;
    linkedin: string;
    github: string;
    portfolio: string;
    location: string;
  };
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    dates: string;
    location: string;
    points: string[];
  }>;
  education: Array<{
    degree: string;
    university: string;
    dates: string;
  }>;
  projects: Array<{
    name: string;
    points: string[];
  }>;
  skills: Array<{
    category: string;
    list: string;
  }>;
}

export interface TrackedJob extends Job {
  status: ApplicationStatus;
  notes?: string;
  tailoredResume?: string;
  tailoredCoverLetter?: string;
  offerDetails?: OfferDetails;
  applicationInsights?: ApplicationInsights;
  structuredResume?: StructuredResume;
}

export interface InterviewQuestion {
  question: string;
  tip: string;
}

export interface CategorizedQuestions {
  category: string;
  questions: InterviewQuestion[];
}

export interface SkillAnalysis {
  matchingSkills: string[];
  missingSkills: string[];
  suggestions: string;
}

export interface InterviewFeedback {
    feedback: string;
    suggestions: string[];
    bodyLanguageFeedback?: string;
    pacingFeedback?: string;
}

export interface CompanyBriefing {
    mission: string;
    recentNews: string;
    culture: string;
    interviewQuestions: string[];
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface NegotiationAnalysis {
    competitiveness: string;
    recommendedRange: string;
    script: string;
}

export interface PotentialContact {
    name: string;
    title: string;
    linkedinUrl?: string;
    email?: string;
}

export interface CareerPathPlan {
  currentRole: string;
  goalRole: string;
  keySkillsToDevelop: string[];
  projectIdeas: string[];
  bridgeRoles: string[];
  timeline: string;
}

export interface ApplicationFormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'file' | 'custom';
  value: string;
}

export interface ParsedApplicationForm {
  basicInfo: ApplicationFormField[];
  customQuestions: ApplicationFormField[];
}
