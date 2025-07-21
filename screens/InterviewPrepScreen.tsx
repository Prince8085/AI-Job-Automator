
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useJobData } from '../contexts/JobDataContext';
import { generateInterviewQuestions, getInterviewFeedback } from '../services/geminiService';
import ScreenWrapper from '../components/ScreenWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import { Job, CategorizedQuestions, InterviewFeedback, InterviewQuestion } from '../types';
import { LightbulbIcon, MicrophoneIcon, VideoCameraIcon } from '../components/icons';

const InterviewPrepScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { getJobById, showToast } = useJobData();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<CategorizedQuestions[]>([]);
  
  // State for practice feature
  const [practicingQuestion, setPracticingQuestion] = useState<InterviewQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  
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
    setQuestions([]);
    setPracticingQuestion(null);
    try {
      const result = await generateInterviewQuestions(job);
      setQuestions(result);
      showToast('Interview questions generated!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error generating questions.', 'error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePracticeClick = (question: InterviewQuestion) => {
      setPracticingQuestion(question);
      setUserAnswer('');
      setFeedback(null);
  };
  
  const handleGetFeedback = async () => {
      if (!practicingQuestion || !userAnswer) return;
      setIsSubmittingFeedback(true);
      setFeedback(null);
      try {
          const result = await getInterviewFeedback(practicingQuestion.question, userAnswer);
          setFeedback(result);
          showToast('Feedback received!', 'success');
      } catch (err: any) {
          showToast(err.message || 'Could not get feedback.', 'error');
          console.error(err);
      } finally {
          setIsSubmittingFeedback(false);
      }
  };

  const startMockInterview = (isVideo: boolean) => {
    if (!job) return;
    const path = isVideo ? `/video-mock-interview/${job.id}` : `/mock-interview/${job.id}`;
    navigate(path, { state: { questions, jobData: job } });
  };

  if (!job) return <ScreenWrapper><LoadingSpinner text="Loading..." /></ScreenWrapper>;

  return (
    <ScreenWrapper>
      <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
        <h2 className="text-2xl font-bold text-text-primary">AI Interview Prep</h2>
        <p className="text-text-secondary">Getting you ready for the <span className="font-semibold text-primary">{job.title}</span> interview.</p>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full py-3 px-6 text-white font-bold bg-gradient-primary rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
          {isLoading ? 'Generating Questions...' : '✨ Get Interview Questions'}
        </button>
        {questions.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
                <button
                    onClick={() => startMockInterview(false)}
                    className="w-full py-3 px-6 text-white font-bold bg-primary rounded-lg hover:bg-indigo-700 transition flex items-center justify-center"
                >
                    <MicrophoneIcon className="w-5 h-5 mr-2" />
                    Start Voice Practice
                </button>
                <button
                    onClick={() => startMockInterview(true)}
                    className="w-full py-3 px-6 text-white font-bold bg-gradient-secondary rounded-lg hover:opacity-90 transition flex items-center justify-center"
                >
                    <VideoCameraIcon className="w-5 h-5 mr-2" />
                    Start Video Practice
                </button>
            </div>
        )}
      </div>

      {isLoading && <LoadingSpinner text="AI is preparing your questions..." />}

      {questions.length > 0 && (
        <div className="space-y-6">
          {questions.map((category, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold text-primary mb-4">{category.category} Questions</h3>
              <div className="space-y-4">
                {category.questions.map((q, qIndex) => (
                  <div key={qIndex} className="p-4 border border-slate-200 rounded-md">
                    <p className="font-semibold text-text-primary">{q.question}</p>
                    <p className="mt-2 text-sm text-text-secondary italic">
                      <strong>Tip:</strong> {q.tip}
                    </p>
                    <button
                        onClick={() => handlePracticeClick(q)}
                        className="mt-3 px-3 py-1 text-sm font-semibold text-primary bg-indigo-100 rounded-md hover:bg-indigo-200 transition"
                    >
                        Practice this question
                    </button>
                    {practicingQuestion?.question === q.question && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                           <h4 className="font-semibold text-text-primary">Your Answer</h4>
                           <p className="text-sm text-text-secondary mb-2">Type your answer below, then get AI feedback.</p>
                           <textarea
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                rows={5}
                                className="w-full p-2 border border-slate-300 rounded-md"
                                placeholder="e.g., At my previous role at Tech Solutions..."
                            />
                            <button
                                onClick={handleGetFeedback}
                                disabled={isSubmittingFeedback || !userAnswer}
                                className="w-full mt-2 py-2 px-4 text-white font-bold bg-secondary rounded-lg hover:bg-emerald-600 transition disabled:bg-emerald-300"
                            >
                                {isSubmittingFeedback ? 'Analyzing...' : 'Get Feedback'}
                            </button>
                            {isSubmittingFeedback && <LoadingSpinner text="Analyzing your answer..." />}
                            {feedback && (
                                <div className="mt-4 space-y-3">
                                    <h5 className="font-bold text-lg text-text-primary">AI Feedback:</h5>
                                    <div className="p-3 bg-white rounded-md border">
                                        <p className="text-text-primary">{feedback.feedback}</p>
                                    </div>
                                    <h6 className="font-semibold text-text-primary">Suggestions for improvement:</h6>
                                    <ul className="list-disc list-inside space-y-1 text-text-secondary">
                                        {feedback.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </ScreenWrapper>
  );
};

export default InterviewPrepScreen;
