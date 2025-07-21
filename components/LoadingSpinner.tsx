
import React from 'react';
import { SparklesIcon } from './icons';

interface LoadingSpinnerProps {
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text = "AI is thinking..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-lg">
      <SparklesIcon className="w-12 h-12 text-primary animate-pulse-fast" />
      <p className="mt-4 text-lg font-semibold text-text-primary">{text}</p>
      <p className="text-text-secondary">Please wait a moment.</p>
    </div>
  );
};

export default LoadingSpinner;
