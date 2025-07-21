
import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useJobData } from '../contexts/JobDataContext';
import { ApplicationStatus } from '../types';
import ScreenWrapper from '../components/ScreenWrapper';
import { BarChartIcon } from '../components/icons';
import { useNavigate } from 'react-router-dom';

const AnalyticsScreen: React.FC = () => {
  const { trackedJobs } = useJobData();
  const navigate = useNavigate();

  const statusCounts = trackedJobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const COLORS = {
    [ApplicationStatus.SAVED]: '#a8a29e', // stone
    [ApplicationStatus.APPLIED]: '#60a5fa', // blue
    [ApplicationStatus.INTERVIEWING]: '#facc15', // yellow
    [ApplicationStatus.OFFER]: '#4ade80', // green
    [ApplicationStatus.REJECTED]: '#f87171', // red
  };
  
  const barData = [
    { name: 'Saved', count: statusCounts[ApplicationStatus.SAVED] || 0 },
    { name: 'Applied', count: statusCounts[ApplicationStatus.APPLIED] || 0 },
    { name: 'Interviewing', count: statusCounts[ApplicationStatus.INTERVIEWING] || 0 },
    { name: 'Offer', count: statusCounts[ApplicationStatus.OFFER] || 0 },
    { name: 'Rejected', count: statusCounts[ApplicationStatus.REJECTED] || 0 },
  ];
  
  const EmptyState = () => (
     <div className="text-center py-10">
        <BarChartIcon className="mx-auto w-16 h-16 text-text-secondary" />
        <h3 className="mt-4 text-xl font-bold text-text-primary">No Analytics Yet</h3>
        <p className="mt-2 text-text-secondary">Track job applications to see your progress visualized here.</p>
        <button
          onClick={() => navigate('/tracker')}
          className="mt-6 px-6 py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition"
        >
          Go to Tracker
        </button>
      </div>
  );

  return (
    <ScreenWrapper>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold text-text-primary mb-4">Application Status Overview</h3>
        {trackedJobs.length > 0 ? (
           <div style={{ width: '100%', height: 300 }}>
             <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as ApplicationStatus]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
           </div>
        ) : (
          <EmptyState />
        )}
      </div>

       <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
        <h3 className="text-xl font-bold text-text-primary mb-4">Applications by Stage</h3>
         {trackedJobs.length > 0 ? (
             <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={barData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count">
                       {barData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[entry.name as ApplicationStatus]} />
                       ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             </div>
          ) : (
           <p className="text-text-secondary text-center py-4">Track jobs to see bar chart data.</p>
        )}
      </div>
    </ScreenWrapper>
  );
};

export default AnalyticsScreen;
