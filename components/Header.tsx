
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, BarChartIcon, UserIcon, HeartIcon } from './icons';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/job/')) return 'Job Details';
    if (path.startsWith('/resume/')) return 'AI Resume Builder';
    if (path.startsWith('/cover-letter/')) return 'AI Cover Letter Generator';
    if (path.startsWith('/interview-prep/')) return 'AI Interview Prep';
    if (path.startsWith('/skills-gap/')) return 'Skills Gap Analysis';
    if (path.startsWith('/follow-up/')) return 'Follow-Up Email Generator';
    if (path.startsWith('/company-briefing/')) return 'AI Company Briefing';
    if (path.startsWith('/mock-interview/')) return 'Mock Voice Interview';
    if (path.startsWith('/negotiate/')) return 'AI Negotiation Coach';
    if (path.startsWith('/networking/')) return 'AI Networking Assistant';
    if (path.startsWith('/video-mock-interview/')) return 'AI Video Mock Interview';
    if (path.startsWith('/easy-apply/')) return 'AI Easy Apply';
    switch (path) {
      case '/dashboard': return 'Dashboard';
      case '/search': return 'Job Search';
      case '/tracker': return 'Application Tracker';
      case '/profile': return 'My Profile';
      case '/analytics': return 'My Analytics';
      case '/analyze-job': return 'Analyze Job Posting';
      case '/career-planner': return 'AI Career Path Planner';
      case '/feedback': return 'Resume Feedback';
      case '/wishlist': return 'My Wishlist';
      default: return 'AI Job Automator';
    }
  };

  const showBackButton = ![
    '/dashboard',
    '/search',
    '/tracker',
    '/profile',
  ].includes(location.pathname);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-sm z-10 h-16 flex items-center px-4">
      <div className="w-full flex items-center justify-between">
        <div className="flex-1">
          {showBackButton && (
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-text-secondary hover:text-primary">
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
          )}
        </div>
        <h1 className="text-lg font-bold text-text-primary text-center">{getTitle()}</h1>
        <div className="flex-1 flex justify-end items-center space-x-2">
            <button onClick={() => navigate('/wishlist')} className="p-2 text-text-secondary hover:text-primary">
                <HeartIcon className="w-6 h-6" />
            </button>
            <button onClick={() => navigate('/analytics')} className="p-2 text-text-secondary hover:text-primary">
                <BarChartIcon className="w-6 h-6" />
            </button>
            <button onClick={() => navigate('/profile')} className="p-2 text-text-secondary hover:text-primary">
                <UserIcon className="w-6 h-6" />
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
