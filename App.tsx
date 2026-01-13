
import React from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { JobProvider } from './contexts/JobDataContext';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import ToastContainer from './components/Toast';
import WelcomeScreen from './screens/WelcomeScreen';
import DashboardScreen from './screens/DashboardScreen';
import SearchScreen from './screens/SearchScreen';
import JobDetailsScreen from './screens/JobDetailsScreen';
import TrackerScreen from './screens/TrackerScreen';
import ProfileScreen from './screens/ProfileScreen';
import ResumeBuilderScreen from './screens/ResumeBuilderScreen';
import CoverLetterScreen from './screens/CoverLetterScreen';
import InterviewPrepScreen from './screens/InterviewPrepScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import SkillsGapScreen from './screens/SkillsGapScreen';
import FollowUpEmailScreen from './screens/FollowUpEmailScreen';
import CompanyBriefingScreen from './screens/CompanyBriefingScreen';
import MockInterviewScreen from './screens/MockInterviewScreen';
import NegotiationCoachScreen from './screens/NegotiationCoachScreen';
import NetworkingAssistantScreen from './screens/NetworkingAssistantScreen';
import AnalyzeJobScreen from './screens/AnalyzeJobScreen';
import CareerPlannerScreen from './screens/CareerPlannerScreen';
import VideoMockInterviewScreen from './screens/VideoMockInterviewScreen';
import ResumeFeedbackScreen from './screens/ResumeFeedbackScreen';
import EasyApplyScreen from './screens/EasyApplyScreen';
import WishlistScreen from './screens/WishlistScreen';
import AutofillResumeScreen from './screens/AutofillResumeScreen';
import InternshipCalendarScreen from './screens/InternshipCalendarScreen';
import LandingPage from './screens/LandingPage';
import PricingScreen from './screens/PricingScreen';
import AutoApplyAgentScreen from './screens/AutoApplyAgentScreen';
import LinkedInScraperScreen from './screens/LinkedInScraperScreen';
import SalaryCalculatorScreen from './screens/SalaryCalculatorScreen';
import JobAlertsScreen from './screens/JobAlertsScreen';
import { CreditProvider } from './contexts/CreditContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const demoMode = (import.meta.env.VITE_DEMO_MODE ?? 'true') === 'true';

  if (!isLoaded && !demoMode) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const allow = isSignedIn || demoMode;
  if (!allow) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const { isSignedIn, isLoaded } = useAuth();
  const demoMode = (import.meta.env.VITE_DEMO_MODE ?? 'true') === 'true';
  const showHeaderAndNav = (isSignedIn || demoMode) && location.pathname !== '/feedback';

  if (!isLoaded && !demoMode) {
    return <div className="flex items-center justify-center min-h-screen bg-indigo-600 text-white">Loading...</div>;
  }

  return (
    <div className="bg-background min-h-screen font-sans">
      {showHeaderAndNav && <Header />}
      <ToastContainer />
      <main className={`pb-4 ${showHeaderAndNav ? 'pt-20' : ''}`}>
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardScreen /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SearchScreen /></ProtectedRoute>} />
          <Route path="/job/:id" element={<ProtectedRoute><JobDetailsScreen /></ProtectedRoute>} />
          <Route path="/tracker" element={<ProtectedRoute><TrackerScreen /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsScreen /></ProtectedRoute>} />
          <Route path="/analyze-job" element={<ProtectedRoute><AnalyzeJobScreen /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><WishlistScreen /></ProtectedRoute>} />
          <Route path="/resume/:id" element={<ProtectedRoute><ResumeBuilderScreen /></ProtectedRoute>} />
          <Route path="/cover-letter/:id" element={<ProtectedRoute><CoverLetterScreen /></ProtectedRoute>} />
          <Route path="/interview-prep/:id" element={<ProtectedRoute><InterviewPrepScreen /></ProtectedRoute>} />
          <Route path="/skills-gap/:id" element={<ProtectedRoute><SkillsGapScreen /></ProtectedRoute>} />
          <Route path="/follow-up/:id" element={<ProtectedRoute><FollowUpEmailScreen /></ProtectedRoute>} />
          <Route path="/company-briefing/:id" element={<ProtectedRoute><CompanyBriefingScreen /></ProtectedRoute>} />
          <Route path="/mock-interview/:id" element={<ProtectedRoute><MockInterviewScreen /></ProtectedRoute>} />
          <Route path="/negotiate/:id" element={<ProtectedRoute><NegotiationCoachScreen /></ProtectedRoute>} />
          <Route path="/networking/:id" element={<ProtectedRoute><NetworkingAssistantScreen /></ProtectedRoute>} />
          <Route path="/career-planner" element={<ProtectedRoute><CareerPlannerScreen /></ProtectedRoute>} />
          <Route path="/video-mock-interview/:id" element={<ProtectedRoute><VideoMockInterviewScreen /></ProtectedRoute>} />
          <Route path="/feedback" element={<ResumeFeedbackScreen />} />
          <Route path="/easy-apply/:id" element={<ProtectedRoute><EasyApplyScreen /></ProtectedRoute>} />
          <Route path="/autofill-resume" element={<ProtectedRoute><AutofillResumeScreen /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><InternshipCalendarScreen /></ProtectedRoute>} />
          <Route path="/interview-coach" element={<ProtectedRoute><InterviewPrepScreen /></ProtectedRoute>} />
          <Route path="/resume-builder" element={<ProtectedRoute><ResumeBuilderScreen /></ProtectedRoute>} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/pricing" element={<ProtectedRoute><PricingScreen /></ProtectedRoute>} />
          <Route path="/auto-apply" element={<ProtectedRoute><AutoApplyAgentScreen /></ProtectedRoute>} />
          <Route path="/linkedin-scraper" element={<ProtectedRoute><LinkedInScraperScreen /></ProtectedRoute>} />
          <Route path="/salary-calculator" element={<ProtectedRoute><SalaryCalculatorScreen /></ProtectedRoute>} />
          <Route path="/job-alerts" element={<ProtectedRoute><JobAlertsScreen /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
      {showHeaderAndNav && <BottomNav />}
    </div>
  );
};

const App: React.FC = () => {
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const demoMode = (import.meta.env.VITE_DEMO_MODE ?? 'true') === 'true';

  if (!clerkPubKey && !demoMode) {
    throw new Error('Missing Clerk Publishable Key');
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey || 'demo_key'}>
      <JobProvider>
        <CreditProvider>
          <HashRouter>
            <AppContent />
          </HashRouter>
        </CreditProvider>
      </JobProvider>
    </ClerkProvider>
  );
};

export default App;
