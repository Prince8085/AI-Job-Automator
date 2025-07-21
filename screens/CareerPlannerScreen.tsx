
import React, { useState } from 'react';
import { useJobData } from '../contexts/JobDataContext';
import { generateCareerPathPlan } from '../services/geminiService';
import ScreenWrapper from '../components/ScreenWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import { CareerPathPlan } from '../types';
import { SparklesIcon, BriefcaseIcon, LightbulbIcon, RouteIcon, TrophyIcon } from '../components/icons';

const CareerPlannerScreen: React.FC = () => {
  const { showToast } = useJobData();
  const [currentRole, setCurrentRole] = useState('');
  const [goalRole, setGoalRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<CareerPathPlan | null>(null);

  const handleGenerate = async () => {
    if (!currentRole || !goalRole) {
      showToast('Please enter both your current and goal roles.', 'error');
      return;
    }
    setIsLoading(true);
    setPlan(null);
    try {
      const result = await generateCareerPathPlan(currentRole, goalRole);
      setPlan(result);
      showToast('Your career path has been generated!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error generating career plan.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
        <h2 className="text-2xl font-bold text-text-primary">AI Career Path Planner</h2>
        <p className="text-text-secondary">Map your journey from where you are to where you want to be.</p>
        
        <div className="space-y-4 pt-4 border-t">
          <div>
            <label htmlFor="currentRole" className="block text-sm font-medium text-text-secondary">Your Current Role</label>
            <input type="text" id="currentRole" value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" placeholder="e.g., Junior Frontend Developer" />
          </div>
          <div>
            <label htmlFor="goalRole" className="block text-sm font-medium text-text-secondary">Your Goal Role</label>
            <input type="text" id="goalRole" value={goalRole} onChange={(e) => setGoalRole(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm" placeholder="e.g., Principal Engineer" />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full flex items-center justify-center py-3 px-6 text-white font-bold bg-primary rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-300 disabled:cursor-wait"
        >
          <SparklesIcon className="w-5 h-5 mr-2" />
          {isLoading ? 'Generating Plan...' : 'Generate My Career Plan'}
        </button>
      </div>

      {isLoading && <LoadingSpinner text="AI is strategizing your career path..." />}

      {plan && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-xl font-bold text-text-primary">Your Path from <span className="text-primary">{plan.currentRole}</span> to <span className="text-secondary">{plan.goalRole}</span></h3>
            <p className="text-text-secondary mt-2">Estimated Timeline: <span className="font-semibold">{plan.timeline}</span></p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h4 className="text-lg font-bold text-primary mb-3 flex items-center"><LightbulbIcon className="w-5 h-5 mr-2"/>Key Skills to Develop</h4>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              {plan.keySkillsToDevelop.map((skill, i) => <li key={i}>{skill}</li>)}
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h4 className="text-lg font-bold text-primary mb-3 flex items-center"><BriefcaseIcon className="w-5 h-5 mr-2"/>Portfolio Project Ideas</h4>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              {plan.projectIdeas.map((idea, i) => <li key={i}>{idea}</li>)}
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h4 className="text-lg font-bold text-primary mb-3 flex items-center"><RouteIcon className="w-5 h-5 mr-2"/>Intermediate "Bridge" Roles</h4>
            <div className="flex flex-wrap gap-3">
                {plan.bridgeRoles.map((role, i) => (
                    <span key={i} className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">
                        {role}
                    </span>
                ))}
            </div>
          </div>
        </div>
      )}
    </ScreenWrapper>
  );
};

export default CareerPlannerScreen;
