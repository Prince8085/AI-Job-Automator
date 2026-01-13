
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SignInButton, useAuth } from '@clerk/clerk-react';
import { SparklesIcon } from '../components/icons';

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const demoMode = (import.meta.env.VITE_DEMO_MODE ?? 'true') === 'true';

  React.useEffect(() => {
    if (isSignedIn) {
      navigate('/dashboard');
    }
  }, [isSignedIn, navigate]);

  const features = [
    { icon: '🔍', title: 'Smart Job Search', desc: 'AI-powered job matching from 1000+ sources' },
    { icon: '📄', title: 'Resume Builder', desc: 'ATS-optimized resumes in seconds' },
    { icon: '🎯', title: 'Auto Apply', desc: 'One-click applications with AI' },
    { icon: '🎤', title: 'Interview Prep', desc: 'Practice with AI mock interviews' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 overflow-hidden relative">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-indigo-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-pink-500/30 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        {/* Logo & Hero */}
        <div className="text-center max-w-2xl mx-auto">
          {/* Animated Icon */}
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 p-5 rounded-3xl shadow-2xl">
              <SparklesIcon className="w-16 h-16 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 leading-tight">
            AI Job
            <span className="block bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 bg-clip-text text-transparent">
              Automator
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-indigo-200 mb-10 max-w-lg mx-auto leading-relaxed">
            Supercharge your job search with AI. Get hired 3x faster.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {demoMode ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="group relative px-10 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  🚀 Try Demo Free
                </span>
                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ) : (
              <SignInButton mode="modal">
                <button className="group relative px-10 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <span className="flex items-center gap-2">
                    ✨ Get Started Free
                  </span>
                </button>
              </SignInButton>
            )}

            <button
              onClick={() => navigate('/search')}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold text-lg rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              Browse Jobs →
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto w-full">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105 cursor-pointer"
            >
              <span className="text-3xl block mb-3">{feature.icon}</span>
              <h3 className="text-white font-bold text-sm mb-1">{feature.title}</h3>
              <p className="text-indigo-300 text-xs">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-center">
          <div>
            <p className="text-3xl md:text-4xl font-black text-white">10K+</p>
            <p className="text-indigo-300 text-sm">Jobs Daily</p>
          </div>
          <div className="w-px bg-indigo-500/30 hidden md:block" />
          <div>
            <p className="text-3xl md:text-4xl font-black text-white">FREE</p>
            <p className="text-indigo-300 text-sm">No API Key Needed</p>
          </div>
          <div className="w-px bg-indigo-500/30 hidden md:block" />
          <div>
            <p className="text-3xl md:text-4xl font-black text-white">3x</p>
            <p className="text-indigo-300 text-sm">Faster Hiring</p>
          </div>
        </div>

        {/* Footer text */}
        <p className="mt-12 text-indigo-400 text-sm">
          🔒 Secure authentication powered by Clerk
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
