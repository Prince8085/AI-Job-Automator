import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobData } from '../contexts/JobDataContext';
import { parseJobFromTextAndImage } from '../services/geminiService';
import ScreenWrapper from '../components/ScreenWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import { SparklesIcon } from '../components/icons';

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    mimeType: file.type,
    data: await base64EncodedDataPromise,
  };
};

const AnalyzeJobScreen: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useJobData();

    const [jobText, setJobText] = useState('');
    const [jobImage, setJobImage] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                showToast("Image size should not exceed 4MB.", 'error');
                return;
            }
            setJobImage(file);
        }
    };

    const handleAnalyze = async () => {
        if (!jobText && !jobImage) {
            setError("Please paste a job description or upload an image.");
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            let imagePart;
            if (jobImage) {
                imagePart = await fileToGenerativePart(jobImage);
            }

            const parsedJob = await parseJobFromTextAndImage(jobText, imagePart);
            
            showToast("Job analyzed successfully!", 'success');
            navigate(`/job/${parsedJob.id}`, { state: { jobData: parsedJob } });

        } catch (err: any) {
            setError(err.message || "An unexpected error occurred during analysis.");
            showToast(err.message || "Error analyzing job.", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">Universal Job Analyzer</h2>
                    <p className="text-text-secondary mt-1">Found a job elsewhere? Paste its description or upload a screenshot to leverage the full power of our AI suite.</p>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="job-text" className="block text-sm font-medium text-text-secondary mb-1">Paste Job Description</label>
                        <textarea
                            id="job-text"
                            rows={10}
                            value={jobText}
                            onChange={(e) => setJobText(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Paste the full job description here..."
                        />
                    </div>

                    <div className="text-center text-sm font-semibold text-text-secondary">OR</div>

                    <div>
                        <label htmlFor="job-image" className="block text-sm font-medium text-text-secondary mb-1">Upload Screenshot</label>
                        <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-text-secondary" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-gray-600">
                                <label htmlFor="job-image-input" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                    <span>Upload a file</span>
                                    <input id="job-image-input" name="job-image" type="file" className="sr-only" onChange={handleImageChange} accept="image/png, image/jpeg, image/webp" />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 4MB</p>
                                {jobImage && <p className="text-sm text-secondary font-semibold mt-2">{jobImage.name}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</div>}

                <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center py-3 px-6 text-white font-bold bg-primary rounded-lg hover:bg-indigo-700 transition disabled:bg-indigo-300 disabled:cursor-wait"
                >
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    {isLoading ? 'Analyzing...' : 'Analyze Job with AI'}
                </button>
            </div>

            {isLoading && (
              <div className="mt-6">
                <LoadingSpinner text="AI is analyzing your input..." />
              </div>
            )}
        </ScreenWrapper>
    );
};

export default AnalyzeJobScreen;