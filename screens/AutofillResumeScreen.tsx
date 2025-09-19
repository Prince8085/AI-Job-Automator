import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScreenWrapper from '../components/ScreenWrapper';
import { LinkIcon, SparklesIcon, ClipboardDocumentCheckIcon, ExclamationTriangleIcon } from '../components/icons';
import { urlParsingService } from '../services/urlParsingService';
import { proxyService } from '../services/proxyService';

interface FieldSuggestion {
  field: string;
  value: string;
  confidence: 'high' | 'medium' | 'low';
  suggestion: string;
}

const AutofillResumeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<FieldSuggestion[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    
    setIsAnalyzing(true);
    setSuggestions([]);
    setError(null);
    setShowResults(false);
    
    try {
      // Validate URL format
      new URL(url);
      
      // Parse the job URL using our service
      const parsedData = await urlParsingService.parseJobURL(url);
      
      // Convert parsed data to our FieldSuggestion format
      const suggestions: FieldSuggestion[] = parsedData.map(item => ({
        field: item.field,
        value: item.value,
        confidence: item.confidence,
        suggestion: item.suggestion
      }));
      
      // Add some intelligent defaults if certain fields are missing
      if (!suggestions.find(s => s.field === 'Salary Range')) {
        suggestions.push({
          field: 'Salary Range',
          value: 'Not specified in posting',
          confidence: 'low',
          suggestion: 'Consider researching market rates for this position'
        });
      }
      
      setSuggestions(suggestions);
      
    } catch (error) {
      console.error('Error analyzing URL:', error);
      
      // Check if it's a URL validation error
      if (error instanceof TypeError && error.message.includes('Invalid URL')) {
        setError('Please enter a valid URL (e.g., https://example.com/job-posting)');
        return;
      }
      
      // Fallback: try to extract basic info from URL structure
      try {
        const fallbackData = await proxyService.extractFromURL(url);
        const fallbackSuggestions: FieldSuggestion[] = [
          {
            field: 'Platform',
            value: fallbackData.platform || 'Unknown',
            confidence: 'high',
            suggestion: 'Detected from URL structure'
          }
        ];
        
        if (fallbackData.company) {
          fallbackSuggestions.push({
            field: 'Company Name',
            value: fallbackData.company,
            confidence: 'medium',
            suggestion: 'Extracted from website domain'
          });
        }
        
        fallbackSuggestions.push({
          field: 'Note',
          value: 'Limited data extraction',
          confidence: 'high',
          suggestion: 'This site may have anti-scraping protection. Some job details may need to be entered manually.'
        });
        
        setSuggestions(fallbackSuggestions);
        
      } catch (fallbackError) {
        // Ultimate fallback
        setError('Unable to access the job posting. This could be due to:\n• CORS restrictions\n• Anti-scraping protection\n• Network issues\n\nPlease try copying the job details manually.');
        return;
      }
    } finally {
      setIsAnalyzing(false);
      setShowResults(true);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high': return <ClipboardDocumentCheckIcon className="w-4 h-4" />;
      case 'medium': return <SparklesIcon className="w-4 h-4" />;
      case 'low': return <ExclamationTriangleIcon className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <ScreenWrapper>
      <div className="space-y-6">
        <div className="text-center">
          <LinkIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-text-primary mb-2">Smart Resume Autofill</h2>
          <p className="text-text-secondary">
            Paste any job posting URL and we'll automatically extract relevant information to help you tailor your resume
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Job Posting URL
          </label>
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://careers.google.com/jobs/results/..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isAnalyzing}
            />
            <button
              onClick={handleAnalyze}
              disabled={!url.trim() || isAnalyzing}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4" />
                  Analyze
                </>
              )}
            </button>
          </div>
        </div>

        {isAnalyzing && (
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div>
                <h3 className="font-semibold text-blue-900">Analyzing Job Posting...</h3>
                <p className="text-blue-700 text-sm">
                  Extracting company info, job requirements, and relevant details
                </p>
                <p className="text-sm text-blue-600 mt-2">This may take a few seconds...</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {showResults && suggestions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-text-primary">Extracted Information</h3>
              <span className="text-sm text-text-secondary">
                {suggestions.length} fields detected
              </span>
            </div>

            <div className="grid gap-4">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-text-primary">{suggestion.field}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getConfidenceColor(suggestion.confidence)}`}>
                        {getConfidenceIcon(suggestion.confidence)}
                        {suggestion.confidence} confidence
                      </span>
                    </div>
                  </div>
                  <p className="text-text-primary font-medium mb-1">{suggestion.value}</p>
                  <p className="text-text-secondary text-sm">{suggestion.suggestion}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => navigate('/easy-apply')}
                className="flex-1 bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary-dark transition-colors font-semibold"
              >
                Apply with Autofilled Data
              </button>
              <button
                onClick={() => navigate('/resume-builder')}
                className="flex-1 bg-secondary text-white py-3 px-6 rounded-lg hover:bg-secondary-dark transition-colors font-semibold"
              >
                Update Resume
              </button>
            </div>
          </div>
        )}

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="font-semibold text-text-primary mb-3">How it works:</h3>
          <div className="space-y-2 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>Paste any job posting URL from popular job sites</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>AI analyzes the page and extracts relevant information</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>Get smart suggestions for each resume field</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <span>Apply directly or update your resume with one click</span>
            </div>
          </div>
        </div>
      </div>
    </ScreenWrapper>
  );
};

export default AutofillResumeScreen;