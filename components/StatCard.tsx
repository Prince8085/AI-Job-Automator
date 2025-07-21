import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement<{ className?: string }>;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4 transition-transform duration-300 hover:scale-105">
      <div className={`p-3 rounded-full ${color}`}>
        {React.cloneElement(icon, { className: "w-6 h-6 text-white" })}
      </div>
      <div>
        <p className="text-sm text-text-secondary font-medium">{title}</p>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;