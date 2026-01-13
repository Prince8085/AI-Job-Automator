
import React, { useState } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import { useJobData } from '../contexts/JobDataContext';
import { SparklesIcon, SearchIcon } from '../components/icons';

interface HiringPost {
    id: string;
    company: string;
    title: string;
    postContent: string;
    postUrl: string;
    postedTime: string;
    engagement: {
        likes: number;
        comments: number;
    };
    isHiring: boolean;
    jobTitles: string[];
}

const LinkedInScraperScreen: React.FC = () => {
    const { showToast } = useJobData();
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hiringPosts, setHiringPosts] = useState<HiringPost[]>([]);
    const [searchMode, setSearchMode] = useState<'profile' | 'hashtag' | 'company'>('hashtag');
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    const handleScrape = async () => {
        if (!linkedinUrl.trim()) {
            showToast('Please enter a LinkedIn URL or hashtag', 'error');
            return;
        }

        setIsLoading(true);
        setHiringPosts([]);
        setLogs([]);

        try {
            addLog('🔍 Starting LinkedIn scrape...');
            addLog(`Mode: ${searchMode}`);
            addLog(`Target: ${linkedinUrl}`);

            // Simulate API call to backend
            addLog('📡 Connecting to scraper service...');
            await new Promise(r => setTimeout(r, 1500));

            addLog('🌐 Fetching recent posts...');
            await new Promise(r => setTimeout(r, 2000));

            // Generate sample hiring posts
            const samplePosts = generateSampleHiringPosts(searchMode);

            addLog(`✅ Found ${samplePosts.length} hiring-related posts`);
            setHiringPosts(samplePosts);

            showToast(`Found ${samplePosts.length} hiring posts!`, 'success');

        } catch (error: any) {
            addLog(`❌ Error: ${error.message}`);
            showToast('Scraping failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const generateSampleHiringPosts = (mode: string): HiringPost[] => {
        const companies = [
            { name: 'Google India', jobs: ['SDE Intern', 'ML Engineer', 'Product Manager'] },
            { name: 'Microsoft', jobs: ['Software Engineer', 'Azure DevOps', 'Data Scientist'] },
            { name: 'Amazon', jobs: ['SDE-1', 'Operations Manager', 'Business Analyst'] },
            { name: 'Flipkart', jobs: ['Backend Developer', 'iOS Developer', 'QA Engineer'] },
            { name: 'Razorpay', jobs: ['Full Stack Developer', 'DevOps Engineer', 'Security Analyst'] },
            { name: 'CRED', jobs: ['React Developer', 'Android Developer', 'Product Designer'] },
            { name: 'Zomato', jobs: ['Python Developer', 'Data Engineer', 'Content Writer'] },
            { name: 'Swiggy', jobs: ['Node.js Developer', 'Delivery Operations', 'Growth Manager'] },
        ];

        return companies.map((company, idx) => ({
            id: `post-${Date.now()}-${idx}`,
            company: company.name,
            title: `🚀 We're Hiring!`,
            postContent: `Exciting opportunity at ${company.name}! We're looking for talented individuals to join our team. Roles: ${company.jobs.join(', ')}. Fresh graduates welcome! Apply now.`,
            postUrl: `https://linkedin.com/posts/${company.name.toLowerCase().replace(' ', '-')}-hiring`,
            postedTime: idx === 0 ? '1 hour ago' : idx < 3 ? `${idx + 1} hours ago` : `${idx} hours ago`,
            engagement: {
                likes: Math.floor(Math.random() * 500) + 50,
                comments: Math.floor(Math.random() * 100) + 10,
            },
            isHiring: true,
            jobTitles: company.jobs,
        }));
    };

    return (
        <ScreenWrapper>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <SparklesIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">🔗 LinkedIn Hiring Scraper</h1>
                            <p className="opacity-90 mt-1">Find companies actively hiring on LinkedIn</p>
                        </div>
                    </div>
                </div>

                {/* Search Mode Tabs */}
                <div className="bg-white rounded-xl shadow-lg p-2">
                    <div className="flex gap-2">
                        {[
                            { id: 'hashtag', label: '#Hashtag', icon: '#' },
                            { id: 'company', label: 'Company Page', icon: '🏢' },
                            { id: 'profile', label: 'Profile Posts', icon: '👤' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setSearchMode(tab.id as any)}
                                className={`
                  flex-1 py-3 px-4 rounded-xl font-medium transition-all
                  ${searchMode === tab.id
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }
                `}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Input */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {searchMode === 'hashtag' && 'Enter Hashtag (e.g., #hiring #wearehiring)'}
                        {searchMode === 'company' && 'Enter Company LinkedIn URL'}
                        {searchMode === 'profile' && 'Enter LinkedIn Profile URL'}
                    </label>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={linkedinUrl}
                            onChange={(e) => setLinkedinUrl(e.target.value)}
                            placeholder={
                                searchMode === 'hashtag'
                                    ? '#hiring OR #wearehiring'
                                    : 'https://linkedin.com/company/...'
                            }
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleScrape}
                            disabled={isLoading}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-70"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Scraping...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <SearchIcon className="w-5 h-5" />
                                    Find Jobs
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={() => setLinkedinUrl('#hiring')}
                            className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200"
                        >
                            #hiring
                        </button>
                        <button
                            onClick={() => setLinkedinUrl('#wearehiring')}
                            className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200"
                        >
                            #wearehiring
                        </button>
                        <button
                            onClick={() => setLinkedinUrl('#freshers')}
                            className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200"
                        >
                            #freshers
                        </button>
                        <button
                            onClick={() => setLinkedinUrl('#internship')}
                            className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200"
                        >
                            #internship
                        </button>
                    </div>
                </div>

                {/* Logs */}
                {logs.length > 0 && (
                    <div className="bg-gray-900 rounded-xl p-4 max-h-32 overflow-y-auto">
                        {logs.map((log, idx) => (
                            <div key={idx} className="text-green-400 font-mono text-sm">{log}</div>
                        ))}
                    </div>
                )}

                {/* Results */}
                {hiringPosts.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                🔥 {hiringPosts.length} Companies Hiring
                            </h2>
                            <span className="text-sm text-gray-500">Last 1 hour</span>
                        </div>

                        <div className="grid gap-4">
                            {hiringPosts.map((post) => (
                                <div
                                    key={post.id}
                                    className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-all border border-gray-100"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                                    {post.company.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800">{post.company}</h3>
                                                    <p className="text-sm text-gray-500">{post.postedTime}</p>
                                                </div>
                                            </div>

                                            <p className="mt-3 text-gray-600 text-sm line-clamp-2">
                                                {post.postContent}
                                            </p>

                                            {/* Job Titles */}
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {post.jobTitles.map((job, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-lg"
                                                    >
                                                        {job}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Engagement */}
                                            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                                                <span>👍 {post.engagement.likes} likes</span>
                                                <span>💬 {post.engagement.comments} comments</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        <a
                                            href={post.postUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 py-2 text-center bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all"
                                        >
                                            View on LinkedIn
                                        </a>
                                        <button
                                            className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all"
                                        >
                                            ❤️ Save
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && hiringPosts.length === 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                        <span className="text-6xl">🔍</span>
                        <h3 className="mt-4 text-xl font-bold text-gray-800">Find Hiring Posts</h3>
                        <p className="mt-2 text-gray-500 max-w-md mx-auto">
                            Enter a hashtag like #hiring or a company LinkedIn URL to find recent hiring announcements
                        </p>
                    </div>
                )}

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h3 className="font-bold text-blue-800 mb-2">💡 Pro Tips</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Use #wearehiring for most hiring posts</li>
                        <li>• #freshers and #internship for entry-level roles</li>
                        <li>• Company pages show all their job announcements</li>
                        <li>• Results are sorted by most recent</li>
                    </ul>
                </div>
            </div>
        </ScreenWrapper>
    );
};

export default LinkedInScraperScreen;
