
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useJobData } from '../contexts/JobDataContext';
import { generateInterviewQuestions, getInterviewVideoFeedback } from '../services/geminiService';
import ScreenWrapper from '../components/ScreenWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import { Job, CategorizedQuestions, InterviewFeedback, InterviewQuestion } from '../types';
import { MicrophoneIcon, SpeakerWaveIcon, SparklesIcon, VideoCameraIcon, CheckIcon } from '../components/icons';

type InterviewState = 'IDLE' | 'GENERATING_QUESTIONS' | 'READY' | 'ASKING' | 'LISTENING' | 'PROCESSING_ANSWER' | 'SHOWING_FEEDBACK' | 'FINISHED';

const VideoMockInterviewScreen: React.FC = () => {
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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Initialize job and questions
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

    // Setup camera
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        showToast("Camera/Mic access denied. Video practice requires permissions.", "error");
        navigate(-1);
      }
    };
    setupCamera();

    // Cleanup stream on component unmount
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [id, getJobById, location.state, navigate, showToast]);

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

    return () => recognitionRef.current?.stop();
  }, [showToast]);

  const speak = (text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) {
        showToast("Text-to-speech not supported.", 'error');
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
      speak("Great job! You've completed the video practice session.", () => navigate(-1));
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
        setInterviewState('SHOWING_FEEDBACK');
        return;
    };
    try {
        const result = await getInterviewVideoFeedback(questions[currentQuestionIndex].question, transcript);
        setFeedback(result);
    } catch (e: any) {
        showToast(e.message || "Error getting feedback", 'error');
    } finally {
        setInterviewState('SHOWING_FEEDBACK');
    }
  };
  
  const handleNextQuestion = () => askQuestion(questions, currentQuestionIndex + 1);

  const renderContent = () => {
    const currentQuestion = questions[currentQuestionIndex];
    
    switch(interviewState) {
      case 'IDLE': return (
        <div className="text-center">
            <h2 className="text-2xl font-bold">Video Interview Practice</h2>
            <p className="mt-2 text-text-secondary">Practice answering questions on camera.</p>
            <button onClick={handleStartInterview} className="mt-8 px-8 py-4 bg-primary text-white font-bold rounded-full shadow-lg hover:bg-indigo-700 transition">
              Start Practice
            </button>
        </div>
      );
      case 'GENERATING_QUESTIONS': return <LoadingSpinner text="AI is preparing your interview..."/>;
      case 'READY': return (
        <div className="text-center">
          <h2 className="text-2xl font-bold">Interview Ready!</h2>
          <p className="mt-2 text-text-secondary">Click below to start.</p>
          <button onClick={() => askQuestion(questions, 0)} className="mt-8 px-8 py-4 bg-primary text-white font-bold rounded-full shadow-lg hover:bg-indigo-700 transition">
            Begin
          </button>
        </div>
      );
      case 'ASKING':
      case 'LISTENING':
      case 'PROCESSING_ANSWER':
      case 'SHOWING_FEEDBACK': return (
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
                       <p className="ml-4 text-lg font-semibold text-text-primary">Listening...</p>
                    </div>
                    <button onClick={handleStopListening} className="px-6 py-3 bg-red-600 text-white font-bold rounded-full shadow-lg hover:bg-red-700 transition">
                        I'm done answering
                    </button>
                 </div>
            )}
            {(interviewState === 'PROCESSING_ANSWER' || interviewState === 'SHOWING_FEEDBACK') && transcript && (
                <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                    <h3 className="font-bold text-lg">Your Answer (Transcript):</h3>
                    <p className="p-4 bg-slate-100 rounded-md text-text-secondary italic">"{transcript}"</p>
                </div>
            )}
            {interviewState === 'PROCESSING_ANSWER' && <LoadingSpinner text="AI is analyzing your answer..."/>}
            {interviewState === 'SHOWING_FEEDBACK' && (
                <div className="space-y-4">
                    {feedback ? (
                       <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                            <h3 className="font-bold text-lg flex items-center"><SparklesIcon className="w-5 h-5 mr-2 text-secondary"/>AI Feedback</h3>
                            {feedback.feedback && <div className="p-3 bg-green-50 rounded-md"><strong>Content:</strong> {feedback.feedback}</div>}
                            {feedback.bodyLanguageFeedback && <div className="p-3 bg-blue-50 rounded-md"><strong>Body Language:</strong> {feedback.bodyLanguageFeedback}</div>}
                            {feedback.pacingFeedback && <div className="p-3 bg-yellow-50 rounded-md"><strong>Pacing:</strong> {feedback.pacingFeedback}</div>}
                            <h4 className="font-semibold">Suggestions:</h4>
                            <ul className="list-disc list-inside space-y-1 text-text-secondary">
                                {feedback.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                       </div>
                    ) : <p className="text-center text-text-secondary">Ready for the next question.</p>}
                    <button onClick={handleNextQuestion} disabled={currentQuestionIndex >= questions.length - 1} className="w-full mt-4 px-6 py-3 bg-primary text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition disabled:opacity-50">
                        {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Interview"}
                    </button>
                </div>
            )}
        </div>
      );
      case 'FINISHED': return (
        <div className="text-center">
            <h2 className="text-2xl font-bold">Practice Complete!</h2>
            <p className="mt-2 text-text-secondary">Great work! You can review your performance or try again.</p>
            <button onClick={() => navigate(-1)} className="mt-8 px-8 py-4 bg-primary text-white font-bold rounded-full shadow-lg hover:bg-indigo-700 transition">
             Back to Prep
            </button>
        </div>
      );
      default: return <p>An unexpected error occurred.</p>
    }
  };

  return (
    <ScreenWrapper>
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="aspect-video bg-black rounded-lg shadow-lg overflow-hidden relative">
                <video ref={videoRef} autoPlay muted className="w-full h-full object-cover transform -scale-x-100"></video>
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center">
                    <VideoCameraIcon className="w-4 h-4 mr-1"/> LIVE
                </div>
            </div>
            {renderContent()}
        </div>
    </ScreenWrapper>
  );
};

export default VideoMockInterviewScreen;
