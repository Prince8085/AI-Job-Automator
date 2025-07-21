
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SparklesIcon } from '../components/icons';
import { useJobData } from '../contexts/JobDataContext';

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useJobData();

  const handleLogin = () => {
    login();
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-600 text-white p-6 text-center">
      <div className="max-w-md">
        <SparklesIcon className="w-24 h-24 mx-auto text-yellow-300 animate-spin-slow" />
        <h1 className="text-4xl md:text-5xl font-extrabold mt-6">AI Job Automator</h1>
        <p className="mt-4 text-lg text-indigo-200">
          Sign in to supercharge your job search. Let AI tailor your resume, write cover letters, and prepare you for interviews.
        </p>
        <button
          onClick={handleLogin}
          className="mt-10 px-8 py-4 bg-white text-primary font-bold text-lg rounded-full shadow-lg hover:bg-slate-100 transform hover:scale-105 transition-all duration-300 ease-in-out"
        >
          Sign In
        </button>
        <p className="text-xs text-indigo-300 mt-4">This is a simulated login for demo purposes.</p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
