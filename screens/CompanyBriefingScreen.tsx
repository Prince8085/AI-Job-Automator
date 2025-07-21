
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useJobData } from '../contexts/JobDataContext';
import { generateCompanyBriefing } from '../services/geminiService';
import ScreenWrapper from '../components/ScreenWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import { Job, CompanyBriefing } from '../types';
import { BuildingIcon, LightbulbIcon } from '../components/icons';

const CompanyBriefingScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { getJobById, showToast } = useJobData();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [briefing, setBriefing] = useState<CompanyBriefing | null>(null);

  useEffect(() => {
    if (location.state?.jobData) {
      setJob(location.state.jobData);
    } else if (id) {
      const foundJob = getJobById(id);
      if (foundJob) setJob(foundJob);
    }
  }, [id, getJobById, location.state]);

  const handleGenerate = async () => {
    if (!job) return;
    setIsLoading(true);
    setBriefing(null);
    try {
      const result = await generateCompanyBriefing(job.company);
      setBriefing(result);
      showToast('Company briefing generated!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error generating briefing.', 'error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!job) return <ScreenWrapper><LoadingSpinner text="Loading..." /></ScreenWrapper>;

  return (
    <ScreenWrapper>
      <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
        <h2 className="text-2xl font-bold text-text-primary">AI Company Briefing</h2>
        <p className="text-text-secondary">Generating a research briefing for <span className="font-semibold text-primary">{job.company}</span>.</p>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full py-3 px-6 text-white font-bold bg-primary rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-300 disabled:cursor-wait"
        >
          {isLoading ? 'Researching...' : '✨ Generate Briefing'}
        </button>
      </div>

      {isLoading && <LoadingSpinner text="AI is researching the company..." />}

      {briefing && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-primary mb-3">Mission &amp; Core Business</h3>
            <p className="text-text-secondary leading-relaxed">{briefing.mission}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-primary mb-3">Recent News</h3>
            <p className="text-text-secondary leading-relaxed">{briefing.recentNews}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-primary mb-3">Company Culture</h3>
            <p className="text-text-secondary leading-relaxed">{briefing.culture}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-primary mb-3">Potential Interview Questions</h3>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              {briefing.interviewQuestions.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          </div>
        </div>
      )}
    </ScreenWrapper>
  );
};

export default CompanyBriefingScreen;
