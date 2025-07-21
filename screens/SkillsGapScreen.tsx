
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useJobData } from '../contexts/JobDataContext';
import { getSkillsGapAnalysis } from '../services/geminiService';
import ScreenWrapper from '../components/ScreenWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import { Job, SkillAnalysis } from '../types';
import { CheckIcon } from '../components/icons';

const SkillsGapScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { getJobById, userProfile, showToast } = useJobData();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SkillAnalysis | null>(null);

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
    setAnalysis(null);
    try {
      const result = await getSkillsGapAnalysis(userProfile.baseResume, job.description);
      setAnalysis(result);
      showToast('Analysis complete!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error analyzing skills.', 'error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!job) return <ScreenWrapper><LoadingSpinner text="Loading..." /></ScreenWrapper>;

  return (
    <ScreenWrapper>
      <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
        <h2 className="text-2xl font-bold text-text-primary">Skills Gap Analysis</h2>
        <p className="text-text-secondary">Analyzing your resume against the <span className="font-semibold text-primary">{job.title}</span> role.</p>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full py-3 px-6 text-white font-bold bg-primary rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-300 disabled:cursor-wait"
        >
          {isLoading ? 'Analyzing...' : '✨ Run AI Analysis'}
        </button>
      </div>

      {isLoading && <LoadingSpinner text="AI is analyzing your profile..." />}

      {analysis && (
        <div className="space-y-6">
            {/* Matching Skills */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-green-600 mb-3">Matching Skills</h3>
                <p className="text-text-secondary mb-4">Skills from your resume that are a great fit for this role.</p>
                <div className="flex flex-wrap gap-3">
                    {analysis.matchingSkills.map((skill, i) => (
                        <span key={i} className="flex items-center bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                            <CheckIcon className="w-4 h-4 mr-1.5" />
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            {/* Missing Skills */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-yellow-600 mb-3">Skills to Highlight</h3>
                <p className="text-text-secondary mb-4">Key skills from the job description to emphasize or develop.</p>
                 <div className="flex flex-wrap gap-3">
                    {analysis.missingSkills.map((skill, i) => (
                        <span key={i} className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            {/* Suggestions */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-primary mb-3">AI Suggestions</h3>
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-md whitespace-pre-wrap leading-relaxed">
                    <p className="text-indigo-800">{analysis.suggestions}</p>
                </div>
            </div>
        </div>
      )}
    </ScreenWrapper>
  );
};

export default SkillsGapScreen;
