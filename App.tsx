
import React from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { JobProvider, useJobData } from './contexts/JobDataContext';
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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useJobData();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useJobData();
  const showHeaderAndNav = isAuthenticated && location.pathname !== '/feedback';

  return (
    <div className="bg-background min-h-screen font-sans">
      {showHeaderAndNav && <Header />}
      <ToastContainer />
      <main className={`pb-20 ${showHeaderAndNav ? 'pt-16' : ''}`}>
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
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
      {showHeaderAndNav && <BottomNav />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <JobProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </JobProvider>
  );
};

export default App;
