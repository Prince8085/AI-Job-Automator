
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, BarChartIcon, HeartIcon } from './icons';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/job/')) return 'Job Details';
    if (path.startsWith('/resume/')) return 'AI Resume Builder';
    if (path.startsWith('/cover-letter/')) return 'Cover Letter';
    if (path.startsWith('/interview-prep/')) return 'Interview Prep';
    if (path.startsWith('/skills-gap/')) return 'Skills Gap';
    if (path.startsWith('/follow-up/')) return 'Follow-Up Email';
    if (path.startsWith('/company-briefing/')) return 'Company Briefing';
    if (path.startsWith('/mock-interview/')) return 'Mock Interview';
    if (path.startsWith('/negotiate/')) return 'Negotiation Coach';
    if (path.startsWith('/networking/')) return 'Networking';
    if (path.startsWith('/video-mock-interview/')) return 'Video Interview';
    if (path.startsWith('/easy-apply/')) return 'Easy Apply';
    switch (path) {
      case '/dashboard': return 'Dashboard';
      case '/search': return 'Job Search';
      case '/tracker': return 'Tracker';
      case '/profile': return 'Profile';
      case '/analytics': return 'Analytics';
      case '/analyze-job': return 'Analyze Job';
      case '/career-planner': return 'Career Planner';
      case '/feedback': return 'Resume Feedback';
      case '/wishlist': return 'Wishlist';
      case '/calendar': return 'Calendar';
      case '/autofill-resume': return 'Auto-fill Resume';
      default: return 'AI Job Automator';
    }
  };

  const showBackButton = ![
    '/dashboard',
    '/search',
    '/tracker',
    '/profile',
    '/wishlist',
  ].includes(location.pathname);

  return (
    <header className="fixed top-0 left-0 right-0 z-40">
      {/* Floating Header Container */}
      <div className="mx-4 mt-3">
        <div className="
          bg-white/80 backdrop-blur-xl
          rounded-2xl
          shadow-[0_4px_20px_rgba(0,0,0,0.08)]
          border border-white/50
          h-14
          flex items-center
          px-4
          transition-all duration-300
        ">
          {/* Left Side */}
          <div className="flex-1 flex items-center">
            {showBackButton ? (
              <button
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
              </div>
            )}
          </div>

          {/* Center - Title */}
          <h1 className="text-base font-bold text-gray-800 text-center">
            {getTitle()}
          </h1>

          {/* Right Side */}
          <div className="flex-1 flex justify-end items-center gap-1">
            <button
              onClick={() => navigate('/wishlist')}
              className="p-2 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <HeartIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/analytics')}
              className="p-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
            >
              <BarChartIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="p-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                P
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
