
import React, { useState } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import { useJobData } from '../contexts/JobDataContext';

interface JobAlert {
    id: string;
    name: string;
    keywords: string[];
    location: string;
    frequency: 'instant' | 'daily' | 'weekly';
    enabled: boolean;
    lastTriggered: string | null;
    matchCount: number;
}

const JobAlertsScreen: React.FC = () => {
    const { showToast } = useJobData();
    const [alerts, setAlerts] = useState<JobAlert[]>([
        {
            id: '1',
            name: 'Frontend Jobs',
            keywords: ['React', 'Frontend', 'JavaScript'],
            location: 'Remote',
            frequency: 'daily',
            enabled: true,
            lastTriggered: '2 hours ago',
            matchCount: 12,
        },
        {
            id: '2',
            name: 'Internships India',
            keywords: ['Intern', 'Fresher', 'Entry Level'],
            location: 'India',
            frequency: 'instant',
            enabled: true,
            lastTriggered: '30 mins ago',
            matchCount: 8,
        },
    ]);

    const [showAddForm, setShowAddForm] = useState(false);
    const [newAlert, setNewAlert] = useState({
        name: '',
        keywords: '',
        location: 'Remote',
        frequency: 'daily' as 'instant' | 'daily' | 'weekly',
    });

    const handleAddAlert = () => {
        if (!newAlert.name || !newAlert.keywords) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        const alert: JobAlert = {
            id: Date.now().toString(),
            name: newAlert.name,
            keywords: newAlert.keywords.split(',').map(k => k.trim()),
            location: newAlert.location,
            frequency: newAlert.frequency,
            enabled: true,
            lastTriggered: null,
            matchCount: 0,
        };

        setAlerts([...alerts, alert]);
        setNewAlert({ name: '', keywords: '', location: 'Remote', frequency: 'daily' });
        setShowAddForm(false);
        showToast('Alert created!', 'success');
    };

    const toggleAlert = (id: string) => {
        setAlerts(alerts.map(a =>
            a.id === id ? { ...a, enabled: !a.enabled } : a
        ));
    };

    const deleteAlert = (id: string) => {
        setAlerts(alerts.filter(a => a.id !== id));
        showToast('Alert deleted', 'info');
    };

    return (
        <ScreenWrapper>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold">🔔 Job Alerts</h1>
                            <p className="opacity-90 mt-1">Get notified when matching jobs are posted</p>
                        </div>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl font-medium hover:bg-white/30 transition-all"
                        >
                            + New Alert
                        </button>
                    </div>
                </div>

                {/* Add Alert Form */}
                {showAddForm && (
                    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-200">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Create New Alert</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Alert Name</label>
                                <input
                                    type="text"
                                    value={newAlert.name}
                                    onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                                    placeholder="e.g., React Developer Jobs"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (comma separated)</label>
                                <input
                                    type="text"
                                    value={newAlert.keywords}
                                    onChange={(e) => setNewAlert({ ...newAlert, keywords: e.target.value })}
                                    placeholder="React, Frontend, JavaScript"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <select
                                        value={newAlert.location}
                                        onChange={(e) => setNewAlert({ ...newAlert, location: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="Remote">Remote</option>
                                        <option value="India">India</option>
                                        <option value="USA">USA</option>
                                        <option value="Worldwide">Worldwide</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                                    <select
                                        value={newAlert.frequency}
                                        onChange={(e) => setNewAlert({ ...newAlert, frequency: e.target.value as any })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="instant">Instant</option>
                                        <option value="daily">Daily Digest</option>
                                        <option value="weekly">Weekly Summary</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleAddAlert}
                                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
                                >
                                    Create Alert
                                </button>
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Alerts List */}
                <div className="space-y-4">
                    {alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`bg-white rounded-xl shadow-lg p-5 border-2 transition-all ${alert.enabled ? 'border-green-200' : 'border-gray-200 opacity-60'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold text-gray-800">{alert.name}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${alert.frequency === 'instant' ? 'bg-red-100 text-red-700' :
                                                alert.frequency === 'daily' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-purple-100 text-purple-700'
                                            }`}>
                                            {alert.frequency}
                                        </span>
                                    </div>

                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {alert.keywords.map((kw, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-lg"
                                            >
                                                {kw}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                                        <span>📍 {alert.location}</span>
                                        {alert.lastTriggered && (
                                            <span>🕐 Last: {alert.lastTriggered}</span>
                                        )}
                                        <span className="text-orange-600 font-medium">
                                            🔥 {alert.matchCount} matches
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleAlert(alert.id)}
                                        className={`relative w-12 h-6 rounded-full transition-all ${alert.enabled ? 'bg-green-500' : 'bg-gray-300'
                                            }`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${alert.enabled ? 'left-7' : 'left-1'
                                            }`} />
                                    </button>
                                    <button
                                        onClick={() => deleteAlert(alert.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-all"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {alerts.length === 0 && !showAddForm && (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                        <span className="text-6xl">🔔</span>
                        <h3 className="mt-4 text-xl font-bold text-gray-800">No Alerts Yet</h3>
                        <p className="mt-2 text-gray-500">Create your first alert to get notified about matching jobs</p>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="mt-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
                        >
                            Create Alert
                        </button>
                    </div>
                )}

                {/* Info */}
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <h3 className="font-bold text-orange-800 mb-2">💡 How Alerts Work</h3>
                    <ul className="text-sm text-orange-700 space-y-1">
                        <li>• <strong>Instant:</strong> Get notified immediately when a job matches</li>
                        <li>• <strong>Daily:</strong> Receive a daily email with all matches</li>
                        <li>• <strong>Weekly:</strong> Get a weekly summary every Monday</li>
                    </ul>
                </div>
            </div>
        </ScreenWrapper>
    );
};

export default JobAlertsScreen;
