
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useJobData } from '../contexts/JobDataContext';
import { generateInterviewQuestions, getInterviewFeedback } from '../services/geminiService';
import ScreenWrapper from '../components/ScreenWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import { Job, CategorizedQuestions, InterviewFeedback, InterviewQuestion } from '../types';
import { MicrophoneIcon, SpeakerWaveIcon, SparklesIcon } from '../components/icons';

type InterviewState = 'IDLE' | 'GENERATING_QUESTIONS' | 'READY' | 'ASKING' | 'LISTENING' | 'PROCESSING_ANSWER' | 'SHOWING_FEEDBACK' | 'FINISHED';

const MockInterviewScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { getJobById, showToast } = useJobData();

  const [job, setJob] = useState<Job | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewState, setInterviewState] = useState<InterviewState>('IDLE');
  
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize job and questions from location state if available
    const jobData = location.state?.jobData;
    const passedQuestions = location.state?.questions as CategorizedQuestions[];
    
    if (jobData) setJob(jobData);
    else if (id) {
      const foundJob = getJobById(id);
      if (foundJob) setJob(foundJob);
    }
    
    if (passedQuestions?.length > 0) {
      setQuestions(passedQuestions.flatMap(cat => cat.questions));
      setInterviewState('READY');
    }
  }, [id, getJobById, location.state]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Speech recognition not supported in this browser.", 'error');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(prev => prev + finalTranscript);
    };
    
    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [showToast]);

  const speak = (text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) {
        showToast("Text-to-speech not supported in this browser.", 'error');
        if(onEnd) onEnd();
        return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = onEnd || null;
    window.speechSynthesis.speak(utterance);
  };
  
  const handleStartInterview = async () => {
    if (!job) return;
    if (questions.length === 0) {
      setInterviewState('GENERATING_QUESTIONS');
      try {
        const generated = await generateInterviewQuestions(job);
        const flatQuestions = generated.flatMap(cat => cat.questions);
        setQuestions(flatQuestions);
        setInterviewState('READY');
        showToast('Questions generated. Starting interview...', 'success');
        askQuestion(flatQuestions, 0);
      } catch (e: any) {
        showToast(e.message || "Failed to generate questions", 'error');
        setInterviewState('IDLE');
      }
    } else {
        askQuestion(questions, 0);
    }
  };

  const askQuestion = (qList: InterviewQuestion[], index: number) => {
    if (index >= qList.length) {
      setInterviewState('FINISHED');
      speak("Great job! You've completed the interview.", () => navigate(-1));
      return;
    }
    setInterviewState('ASKING');
    setCurrentQuestionIndex(index);
    setTranscript('');
    setFeedback(null);
    speak(qList[index].question, () => {
      setInterviewState('LISTENING');
      recognitionRef.current?.start();
    });
  };

  const handleStopListening = () => {
    if (interviewState === 'LISTENING') {
      recognitionRef.current?.stop();
      setInterviewState('PROCESSING_ANSWER');
      handleSubmitAnswer();
    }
  };
  
  const handleSubmitAnswer = async () => {
    if (!transcript) {
        showToast("No answer detected.", "info");
        setInterviewState('SHOWING_FEEDBACK'); // Move to feedback state even if no answer
        return;
    };
    try {
        const result = await getInterviewFeedback(questions[currentQuestionIndex].question, transcript);
        setFeedback(result);
    } catch (e: any) {
        showToast(e.message || "Error getting feedback", 'error');
    } finally {
        setInterviewState('SHOWING_FEEDBACK');
    }
  };
  
  const handleNextQuestion = () => {
      askQuestion(questions, currentQuestionIndex + 1);
  };


  const renderContent = () => {
    switch(interviewState) {
      case 'IDLE':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold">Mock Interview Practice</h2>
            <p className="mt-2 text-text-secondary">Practice your interview skills with an AI interviewer.</p>
            <button onClick={handleStartInterview} className="mt-8 px-8 py-4 bg-primary text-white font-bold rounded-full shadow-lg hover:bg-indigo-700 transition">
              Start Interview
            </button>
          </div>
        );
      case 'GENERATING_QUESTIONS':
        return <LoadingSpinner text="AI is preparing your interview..."/>;
      case 'READY':
        return (
             <div className="text-center">
                <h2 className="text-2xl font-bold">Interview Ready!</h2>
                <p className="mt-2 text-text-secondary">Click below when you're ready to start.</p>
                <button onClick={() => askQuestion(questions, 0)} className="mt-8 px-8 py-4 bg-primary text-white font-bold rounded-full shadow-lg hover:bg-indigo-700 transition">
                 Begin
                </button>
            </div>
        );
      case 'ASKING':
      case 'LISTENING':
      case 'PROCESSING_ANSWER':
      case 'SHOWING_FEEDBACK':
        const currentQuestion = questions[currentQuestionIndex];
        return (
            <div className="space-y-6">
                <div className="p-6 bg-indigo-50 rounded-lg text-center">
                    <p className="text-sm font-semibold text-primary">Question {currentQuestionIndex + 1} of {questions.length}</p>
                    <p className="text-xl font-bold text-text-primary mt-2">{currentQuestion.question}</p>
                </div>
                
                {interviewState === 'ASKING' && (
                    <div className="flex items-center justify-center p-6 bg-white rounded-lg shadow-md">
                        <SpeakerWaveIcon className="w-8 h-8 text-primary animate-pulse"/>
                        <p className="ml-4 text-lg font-semibold text-text-primary">AI is speaking...</p>
                    </div>
                )}
                
                {interviewState === 'LISTENING' && (
                     <div className="text-center space-y-4">
                        <div className="flex items-center justify-center p-6 bg-white rounded-lg shadow-md">
                           <MicrophoneIcon className="w-8 h-8 text-red-500 animate-pulse"/>
                           <p className="ml-4 text-lg font-semibold text-text-primary">Listening for your answer...</p>
                        </div>
                        <button onClick={handleStopListening} className="px-6 py-3 bg-red-600 text-white font-bold rounded-full shadow-lg hover:bg-red-700 transition">
                            I'm done answering
                        </button>
                     </div>
                )}

                {(interviewState === 'PROCESSING_ANSWER' || interviewState === 'SHOWING_FEEDBACK') && transcript && (
                    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                        <h3 className="font-bold text-lg">Your Answer:</h3>
                        <p className="p-4 bg-slate-100 rounded-md text-text-secondary italic">"{transcript}"</p>
                    </div>
                )}

                {interviewState === 'PROCESSING_ANSWER' && <LoadingSpinner text="AI is analyzing your answer..."/>}

                {interviewState === 'SHOWING_FEEDBACK' && (
                    <div className="space-y-4">
                        {feedback ? (
                           <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                                <h3 className="font-bold text-lg flex items-center"><SparklesIcon className="w-5 h-5 mr-2 text-secondary"/>AI Feedback</h3>
                                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                                    <p>{feedback.feedback}</p>
                                </div>
                                <h4 className="font-semibold">Suggestions:</h4>
                                <ul className="list-disc list-inside space-y-1 text-text-secondary">
                                    {feedback.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                </ul>
                           </div>
                        ) : <p className="text-center text-text-secondary">Ready for the next question.</p>}
                        
                        {currentQuestionIndex < questions.length - 1 ? (
                            <button onClick={handleNextQuestion} className="w-full mt-4 px-6 py-3 bg-primary text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition">
                                Next Question
                            </button>
                        ) : (
                             <button onClick={() => setInterviewState('FINISHED')} className="w-full mt-4 px-6 py-3 bg-secondary text-white font-bold rounded-lg shadow-lg hover:bg-emerald-600 transition">
                                Finish Interview
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
      case 'FINISHED':
        return (
            <div className="text-center">
                <h2 className="text-2xl font-bold">Interview Complete!</h2>
                <p className="mt-2 text-text-secondary">Great work! You can review your performance or try again.</p>
                <button onClick={() => navigate(-1)} className="mt-8 px-8 py-4 bg-primary text-white font-bold rounded-full shadow-lg hover:bg-indigo-700 transition">
                 Back to Prep
                </button>
            </div>
        );
      default:
        return <p>An unexpected error occurred.</p>
    }
  };

  return (
    <ScreenWrapper>
        <div className="max-w-2xl mx-auto">
            {renderContent()}
        </div>
    </ScreenWrapper>
  );
};

export default MockInterviewScreen;
