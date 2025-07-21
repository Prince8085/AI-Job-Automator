
import React from 'react';

interface ScreenWrapperProps {
  children: React.ReactNode;
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children }) => {
  return <div className="p-4 space-y-6 max-w-4xl mx-auto">{children}</div>;
};

export default ScreenWrapper;
