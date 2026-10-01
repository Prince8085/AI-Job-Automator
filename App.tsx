import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { JobProvider } from './contexts/JobDataContext';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import ToastContainer from './components/Toast';
import LoadingSpinner from './components/LoadingSpinner';
import { CreditProvider } from './contexts/CreditContext';
import { FEATURE_FLAGS } from './constants';

// Lazy loaded screens for fast initial load & route code-splitting
const LandingPage = lazy(() => import('./screens/LandingPage'));
const WelcomeScreen = lazy(() => import('./screens/WelcomeScreen'));
const DashboardScreen = lazy(() => import('./screens/DashboardScreen'));
const SearchScreen = lazy(() => import('./screens/SearchScreen'));
const JobDetailsScreen = lazy(() => import('./screens/JobDetailsScreen'));
const TrackerScreen = lazy(() => import('./screens/TrackerScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));
const ResumeBuilderScreen = lazy(() => import('./screens/ResumeBuilderScreen'));
const CoverLetterScreen = lazy(() => import('./screens/CoverLetterScreen'));
const InterviewPrepScreen = lazy(() => import('./screens/InterviewPrepScreen'));
const AnalyticsScreen = lazy(() => import('./screens/AnalyticsScreen'));
const SkillsGapScreen = lazy(() => import('./screens/SkillsGapScreen'));
const FollowUpEmailScreen = lazy(() => import('./screens/FollowUpEmailScreen'));
const CompanyBriefingScreen = lazy(() => import('./screens/CompanyBriefingScreen'));
const MockInterviewScreen = lazy(() => import('./screens/MockInterviewScreen'));
const NegotiationCoachScreen = lazy(() => import('./screens/NegotiationCoachScreen'));
const NetworkingAssistantScreen = lazy(() => import('./screens/NetworkingAssistantScreen'));
const AnalyzeJobScreen = lazy(() => import('./screens/AnalyzeJobScreen'));
const CareerPlannerScreen = lazy(() => import('./screens/CareerPlannerScreen'));
const VideoMockInterviewScreen = lazy(() => import('./screens/VideoMockInterviewScreen'));
const ResumeFeedbackScreen = lazy(() => import('./screens/ResumeFeedbackScreen'));
const EasyApplyScreen = lazy(() => import('./screens/EasyApplyScreen'));
const WishlistScreen = lazy(() => import('./screens/WishlistScreen'));
const AutofillResumeScreen = lazy(() => import('./screens/AutofillResumeScreen'));
const InternshipCalendarScreen = lazy(() => import('./screens/InternshipCalendarScreen'));
const PricingScreen = lazy(() => import('./screens/PricingScreen'));
const AutoApplyAgentScreen = lazy(() => import('./screens/AutoApplyAgentScreen'));
const LinkedInScraperScreen = lazy(() => import('./screens/LinkedInScraperScreen'));
const SalaryCalculatorScreen = lazy(() => import('./screens/SalaryCalculatorScreen'));
const JobAlertsScreen = lazy(() => import('./screens/JobAlertsScreen'));

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

const PageFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <LoadingSpinner text="Loading screen..." />
  </div>
);

const AppContent: React.FC = () => {
  const location = useLocation();
  const { isSignedIn, isLoaded } = useAuth();
  const demoMode = (import.meta.env.VITE_DEMO_MODE ?? 'true') === 'true';
  const isLanding = location.pathname === '/';
  const showHeaderAndNav = (isSignedIn || demoMode) && !isLanding && location.pathname !== '/feedback';

  if (!isLoaded && !demoMode) {
    return <div className="flex items-center justify-center min-h-screen bg-indigo-600 text-white">Loading...</div>;
  }

  return (
    <div className="bg-background min-h-screen font-sans">
      {showHeaderAndNav && <Header />}
      <ToastContainer />
      <main className={`pb-4 ${showHeaderAndNav ? 'pt-20' : ''}`}>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/welcome" element={<WelcomeScreen />} />
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
            <Route
              path="/autofill-resume"
              element={
                FEATURE_FLAGS.AUTOFILL_RESUME
                  ? <ProtectedRoute><AutofillResumeScreen /></ProtectedRoute>
                  : <Navigate to="/dashboard" replace />
              }
            />
            <Route path="/calendar" element={<ProtectedRoute><InternshipCalendarScreen /></ProtectedRoute>} />
            <Route path="/interview-coach" element={<ProtectedRoute><InterviewPrepScreen /></ProtectedRoute>} />
            <Route path="/resume-builder" element={<ProtectedRoute><ResumeBuilderScreen /></ProtectedRoute>} />
            <Route path="/pricing" element={<ProtectedRoute><PricingScreen /></ProtectedRoute>} />
            <Route
              path="/auto-apply"
              element={
                FEATURE_FLAGS.AUTO_APPLY_AGENT
                  ? <ProtectedRoute><AutoApplyAgentScreen /></ProtectedRoute>
                  : <Navigate to="/dashboard" replace />
              }
            />
            <Route
              path="/linkedin-scraper"
              element={
                FEATURE_FLAGS.LINKEDIN_SCRAPER
                  ? <ProtectedRoute><LinkedInScraperScreen /></ProtectedRoute>
                  : <Navigate to="/dashboard" replace />
              }
            />
            <Route path="/salary-calculator" element={<ProtectedRoute><SalaryCalculatorScreen /></ProtectedRoute>} />
            <Route
              path="/job-alerts"
              element={
                FEATURE_FLAGS.JOB_ALERTS
                  ? <ProtectedRoute><JobAlertsScreen /></ProtectedRoute>
                  : <Navigate to="/dashboard" replace />
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Suspense>
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
