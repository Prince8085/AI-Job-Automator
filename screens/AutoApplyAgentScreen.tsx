
import React, { useState } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import { useJobData } from '../contexts/JobDataContext';
import { SparklesIcon } from '../components/icons';

interface FormField {
    name: string;
    value: string;
    type: string;
    filled: boolean;
}

const AutoApplyAgentScreen: React.FC = () => {
    const { userProfile, showToast } = useJobData();
    const [jobUrl, setJobUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentStep, setCurrentStep] = useState<string>('');
    const [progress, setProgress] = useState(0);
    const [detectedFields, setDetectedFields] = useState<FormField[]>([]);
    const [status, setStatus] = useState<'idle' | 'scanning' | 'filling' | 'done' | 'error'>('idle');
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (message: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    const handleStartAgent = async () => {
        if (!jobUrl) {
            showToast('Please enter a job application URL', 'error');
            return;
        }

        setIsProcessing(true);
        setStatus('scanning');
        setProgress(0);
        setLogs([]);
        setDetectedFields([]);

        try {
            // Step 1: Scanning the page
            addLog('🔍 Scanning job application page...');
            setCurrentStep('Scanning application form...');
            setProgress(10);
            await simulateDelay(1500);

            // Step 2: Detect form fields
            addLog('📋 Detecting form fields...');
            setCurrentStep('Detecting input fields...');
            setProgress(25);
            await simulateDelay(1000);

            // Simulate detected fields
            const mockFields: FormField[] = [
                { name: 'Full Name', value: userProfile.name || '', type: 'text', filled: false },
                { name: 'Email', value: userProfile.email || '', type: 'email', filled: false },
                { name: 'Phone', value: userProfile.phone || '', type: 'tel', filled: false },
                { name: 'LinkedIn URL', value: '', type: 'url', filled: false },
                { name: 'Resume', value: 'resume.pdf', type: 'file', filled: false },
                { name: 'Cover Letter', value: 'Auto-generated', type: 'textarea', filled: false },
                { name: 'Experience Years', value: userProfile.experience?.length?.toString() || '2', type: 'number', filled: false },
                { name: 'Current Company', value: userProfile.experience?.[0]?.company || '', type: 'text', filled: false },
            ];

            setDetectedFields(mockFields);
            addLog(`✅ Found ${mockFields.length} form fields`);
            setProgress(40);

            // Step 3: Fill fields one by one
            setStatus('filling');
            setCurrentStep('Filling form fields...');

            for (let i = 0; i < mockFields.length; i++) {
                const field = mockFields[i];
                addLog(`✏️ Filling: ${field.name} = "${field.value.substring(0, 30)}${field.value.length > 30 ? '...' : ''}"`);
                setCurrentStep(`Filling: ${field.name}...`);
                setProgress(40 + ((i + 1) / mockFields.length) * 50);

                await simulateDelay(800);

                setDetectedFields(prev =>
                    prev.map((f, idx) => idx === i ? { ...f, filled: true } : f)
                );
            }

            // Step 4: Complete
            setProgress(100);
            setStatus('done');
            setCurrentStep('Application ready to submit!');
            addLog('🎉 All fields filled successfully!');
            addLog('📤 Click the submit button on the job page to complete application');

            showToast('Form filled successfully!', 'success');

        } catch (error: any) {
            setStatus('error');
            addLog(`❌ Error: ${error.message}`);
            showToast('Failed to process form', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const handleReset = () => {
        setJobUrl('');
        setStatus('idle');
        setProgress(0);
        setDetectedFields([]);
        setLogs([]);
        setCurrentStep('');
    };

    return (
        <ScreenWrapper>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <SparklesIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">🤖 Auto-Apply Agent</h1>
                            <p className="opacity-90 mt-1">AI fills job application forms for you</p>
                        </div>
                    </div>
                </div>

                {/* How it works */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">📋 How it Works</h2>
                    <div className="grid grid-cols-4 gap-4 text-center text-sm">
                        <div className="space-y-2">
                            <div className="w-10 h-10 mx-auto rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">1</div>
                            <p>Paste job URL</p>
                        </div>
                        <div className="space-y-2">
                            <div className="w-10 h-10 mx-auto rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">2</div>
                            <p>Agent scans form</p>
                        </div>
                        <div className="space-y-2">
                            <div className="w-10 h-10 mx-auto rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">3</div>
                            <p>Auto-fills fields</p>
                        </div>
                        <div className="space-y-2">
                            <div className="w-10 h-10 mx-auto rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">4</div>
                            <p>You click Submit</p>
                        </div>
                    </div>
                </div>

                {/* URL Input */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Application URL
                    </label>
                    <div className="flex gap-3">
                        <input
                            type="url"
                            value={jobUrl}
                            onChange={(e) => setJobUrl(e.target.value)}
                            placeholder="https://company.com/careers/apply/..."
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            disabled={isProcessing}
                        />
                        <button
                            onClick={status === 'done' ? handleReset : handleStartAgent}
                            disabled={isProcessing && status !== 'done'}
                            className={`
                px-6 py-3 rounded-xl font-bold transition-all
                ${status === 'done'
                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg'
                                }
                ${isProcessing ? 'opacity-70 cursor-wait' : ''}
              `}
                        >
                            {status === 'done' ? 'Reset' : isProcessing ? 'Processing...' : '🚀 Start Agent'}
                        </button>
                    </div>
                </div>

                {/* Progress */}
                {status !== 'idle' && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="font-bold text-gray-800">Progress</h2>
                            <span className={`
                px-3 py-1 rounded-full text-sm font-medium
                ${status === 'scanning' ? 'bg-blue-100 text-blue-700' : ''}
                ${status === 'filling' ? 'bg-yellow-100 text-yellow-700' : ''}
                ${status === 'done' ? 'bg-green-100 text-green-700' : ''}
                ${status === 'error' ? 'bg-red-100 text-red-700' : ''}
              `}>
                                {status === 'scanning' && '🔍 Scanning'}
                                {status === 'filling' && '✏️ Filling'}
                                {status === 'done' && '✅ Complete'}
                                {status === 'error' && '❌ Error'}
                            </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                            <div
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-sm text-gray-600">{currentStep}</p>
                    </div>
                )}

                {/* Detected Fields */}
                {detectedFields.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="font-bold text-gray-800 mb-4">📝 Form Fields ({detectedFields.filter(f => f.filled).length}/{detectedFields.length} filled)</h2>
                        <div className="space-y-2">
                            {detectedFields.map((field, idx) => (
                                <div
                                    key={idx}
                                    className={`
                    flex items-center justify-between p-3 rounded-xl
                    ${field.filled ? 'bg-green-50' : 'bg-gray-50'}
                  `}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm
                      ${field.filled ? 'bg-green-500 text-white' : 'bg-gray-300 text-white'}
                    `}>
                                            {field.filled ? '✓' : idx + 1}
                                        </span>
                                        <div>
                                            <p className="font-medium text-gray-700">{field.name}</p>
                                            <p className="text-sm text-gray-500 truncate max-w-xs">{field.value || '(empty)'}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400">{field.type}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Logs */}
                {logs.length > 0 && (
                    <div className="bg-gray-900 rounded-xl p-6">
                        <h2 className="font-bold text-green-400 mb-3">📜 Agent Logs</h2>
                        <div className="font-mono text-sm space-y-1 max-h-48 overflow-y-auto">
                            {logs.map((log, idx) => (
                                <div key={idx} className="text-green-300">{log}</div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Info Box */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <h3 className="font-bold text-amber-800 mb-2">⚠️ Important Notes</h3>
                    <ul className="text-sm text-amber-700 space-y-1">
                        <li>• This is a demo - real form filling requires browser extension</li>
                        <li>• Your resume data from profile will be used</li>
                        <li>• Always review before submitting</li>
                        <li>• Works best with standard application forms</li>
                    </ul>
                </div>
            </div>
        </ScreenWrapper>
    );
};

export default AutoApplyAgentScreen;
