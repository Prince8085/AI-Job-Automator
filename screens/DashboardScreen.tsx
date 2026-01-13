
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobData } from '../contexts/JobDataContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { ApplicationStatus } from '../types';
import {
  BriefcaseIcon,
  MailIcon,
  TrophyIcon,
  BuildingIcon,
  BarChartIcon,
  HeartIcon
} from '../components/icons';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  [ApplicationStatus.SAVED]: '#64748b',
  [ApplicationStatus.APPLIED]: '#3b82f6',
  [ApplicationStatus.INTERVIEWING]: '#f59e0b',
  [ApplicationStatus.OFFER]: '#22c55e',
  [ApplicationStatus.REJECTED]: '#ef4444',
};

const GoalProgress: React.FC<{ label: string; current: number; goal: number; }> = ({ label, current, goal }) => {
  const progress = Math.min((current / goal) * 100, 100);
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <span className="text-sm font-semibold text-primary">{current} / {goal}</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5">
        <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}> = ({ title, value, icon, color, onClick }) => (
  <div
    className={`bg-white rounded-xl shadow-lg p-4 ${onClick ? 'cursor-pointer hover:shadow-xl transition' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
      <div className={`${color} text-white p-3 rounded-xl`}>
        {icon}
      </div>
    </div>
  </div>
);

const QuickAction: React.FC<{
  title: string;
  emoji: string;
  onClick: () => void;
  subtitle?: string;
}> = ({ title, emoji, onClick, subtitle }) => (
  <button
    onClick={onClick}
    className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition text-center flex flex-col items-center justify-center"
  >
    <span className="text-3xl block mb-2">{emoji}</span>
    <span className="text-sm font-semibold text-gray-700">{title}</span>
    {subtitle && <span className="text-xs text-gray-500 mt-1">{subtitle}</span>}
  </button>
);

const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, trackedJobs, wishlistedJobs } = useJobData();

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    const total = trackedJobs.length;
    const byStatus = Object.values(ApplicationStatus).reduce((acc, status) => {
      acc[status] = trackedJobs.filter(j => j.status === status).length;
      return acc;
    }, {} as Record<string, number>);

    const applied = byStatus[ApplicationStatus.APPLIED] || 0;
    const interviewing = byStatus[ApplicationStatus.INTERVIEWING] || 0;
    const offers = byStatus[ApplicationStatus.OFFER] || 0;
    const rejected = byStatus[ApplicationStatus.REJECTED] || 0;

    const responseRate = (applied + interviewing + offers + rejected) > 0
      ? Math.round(((interviewing + offers) / Math.max(applied + interviewing + offers + rejected, 1)) * 100)
      : 0;

    const successRate = (applied + interviewing + offers + rejected) > 0
      ? Math.round((offers / Math.max(applied + interviewing + offers + rejected, 1)) * 100)
      : 0;

    // Top companies
    const companyCounts = trackedJobs.reduce((acc, job) => {
      acc[job.company] = (acc[job.company] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCompanies = Object.entries(companyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total,
      byStatus,
      responseRate,
      successRate,
      wishlistCount: wishlistedJobs.length,
      topCompanies,
      applied,
      interviewing,
      offers,
      saved: byStatus[ApplicationStatus.SAVED] || 0,
    };
  }, [trackedJobs, wishlistedJobs]);

  // Prepare chart data
  const pieChartData = useMemo(() => {
    return Object.entries(stats.byStatus)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status,
        value: count,
        color: STATUS_COLORS[status] || '#64748b',
      }));
  }, [stats.byStatus]);

  const barChartData = useMemo(() => {
    return Object.entries(stats.byStatus).map(([status, count]) => ({
      name: status.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' '),
      count,
      fill: STATUS_COLORS[status] || '#64748b',
    }));
  }, [stats.byStatus]);

  return (
    <ScreenWrapper>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold">📊 Analytics Dashboard</h1>
          <p className="opacity-90 mt-1">
            Welcome back, {userProfile.name?.split(' ')[0] || 'Job Seeker'}! Here's your application overview.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Tracked"
            value={stats.total}
            icon={<BriefcaseIcon className="w-6 h-6" />}
            color="bg-indigo-500"
          />
          <StatCard
            title="Applied"
            value={stats.applied + stats.interviewing}
            icon={<MailIcon className="w-6 h-6" />}
            color="bg-blue-500"
          />
          <StatCard
            title="Offers 🎉"
            value={stats.offers}
            icon={<TrophyIcon className="w-6 h-6" />}
            color="bg-green-500"
          />
          <StatCard
            title="Wishlist"
            value={stats.wishlistCount}
            icon={<HeartIcon className="w-6 h-6" />}
            color="bg-pink-500"
            onClick={() => navigate('/wishlist')}
          />
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <BarChartIcon className="w-5 h-5 mr-2 text-indigo-600" />
              Status Distribution
            </h2>
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center text-gray-400">
                <p>No applications tracked yet</p>
              </div>
            )}
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {pieChartData.map((entry) => (
                <div key={entry.name} className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: entry.color }} />
                  <span>{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Applications by Status</h2>
            {barChartData.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barChartData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <p>Start tracking jobs to see charts!</p>
              </div>
            )}
          </div>
        </div>

        {/* Goals and Top Companies */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Weekly Goals */}
          <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
            <div className="flex items-center">
              <TrophyIcon className="w-6 h-6 text-yellow-500" />
              <h3 className="text-lg font-bold text-text-primary ml-2">Weekly Goals</h3>
            </div>
            <GoalProgress label="Jobs Applied" current={stats.applied} goal={10} />
            <GoalProgress label="Interviews" current={stats.interviewing} goal={3} />
            <GoalProgress label="Offers" current={stats.offers} goal={1} />
          </div>

          {/* Top Companies */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <BuildingIcon className="w-5 h-5 mr-2 text-indigo-600" />
              Top Companies Applied
            </h3>
            {stats.topCompanies.length > 0 ? (
              <ul className="space-y-3">
                {stats.topCompanies.map(([company, count], index) => (
                  <li key={company} className="flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold mr-3">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 truncate">{company}</span>
                    </span>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600">
                      {count} app{count > 1 ? 's' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-center py-4">No applications yet</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">⚡ Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <QuickAction title="Search Jobs" emoji="🔍" onClick={() => navigate('/search')} />
            <QuickAction title="Tracker" emoji="📋" onClick={() => navigate('/tracker')} />
            <QuickAction title="Calendar" emoji="📅" onClick={() => navigate('/calendar')} />
            <QuickAction title="Resume" emoji="📄" onClick={() => navigate('/resume-builder')} />
            <QuickAction title="Interview" emoji="🎤" onClick={() => navigate('/interview-coach')} />
            <QuickAction title="Career Path" emoji="🛤️" onClick={() => navigate('/career-planner')} />
          </div>
        </div>
      </div>
    </ScreenWrapper>
  );
};

export default DashboardScreen;
