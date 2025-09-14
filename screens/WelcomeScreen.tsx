
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SignInButton, useAuth } from '@clerk/clerk-react';
import { SparklesIcon } from '../components/icons';

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  React.useEffect(() => {
    if (isSignedIn) {
      navigate('/dashboard');
    }
  }, [isSignedIn, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-600 text-white p-6 text-center">
      <div className="max-w-md">
        <SparklesIcon className="w-24 h-24 mx-auto text-yellow-300 animate-spin-slow" />
        <h1 className="text-4xl md:text-5xl font-extrabold mt-6">AI Job Automator</h1>
        <p className="mt-4 text-lg text-indigo-200">
          Sign in to supercharge your job search. Let AI tailor your resume, write cover letters, and prepare you for interviews.
        </p>
        <SignInButton mode="modal">
          <button className="mt-10 px-8 py-4 bg-white text-primary font-bold text-lg rounded-full shadow-lg hover:bg-slate-100 transform hover:scale-105 transition-all duration-300 ease-in-out">
            Sign In
          </button>
        </SignInButton>
        <p className="text-xs text-indigo-300 mt-4">Secure authentication powered by Clerk.</p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
