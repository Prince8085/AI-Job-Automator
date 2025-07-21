
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { StructuredResume } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { jsPDF } from 'jspdf'; // Using jsPDF for text measurement consistency

const ResumeFeedbackScreen: React.FC = () => {
  const [resume, setResume] = useState<StructuredResume | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const location = useLocation();

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const data = params.get('data');
      if (!data) {
        throw new Error('No resume data found in link.');
      }
      const decodedData = atob(data);
      const parsedData = JSON.parse(decodedData);
      setResume(parsedData);
    } catch (e: any) {
      setError('Could not load resume. The link may be invalid or expired.');
      console.error('Feedback link error:', e);
    }
  }, [location.search]);
  
  const renderResume = (r: StructuredResume) => {
    const doc = new jsPDF(); // For text measurement
    const pageWidth = 595; // A4 width in points
    const margin = 40;

    const Section: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
        <div
            className={`p-4 border-l-4 transition-all duration-300 ${activeSection === title ? 'border-primary bg-indigo-50' : 'border-transparent'}`}
            onMouseEnter={() => setActiveSection(title)}
        >
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">{title}</h2>
            {children}
        </div>
    );
    
    return (
        <div className="bg-white shadow-xl rounded-lg max-w-4xl mx-auto my-8 font-[Times] text-gray-800">
            {/* Header */}
            <div className="text-center p-8 border-b">
                <h1 className="text-4xl font-bold">{r.contact.name}</h1>
                <p className="text-sm mt-2 text-gray-600">
                  {[r.contact.phone, r.contact.location, r.contact.email, r.contact.linkedin, r.contact.github, r.contact.portfolio].filter(Boolean).join('  \u25CA  ')}
                </p>
            </div>
            <div className="p-4">
                <Section title="Summary">{r.summary}</Section>
                <Section title="Experience">
                    <div className="space-y-4">
                    {r.experience.map((exp, i) => (
                        <div key={i}>
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-bold">{exp.title}</h3>
                                <p className="text-sm text-gray-500">{exp.dates}</p>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <p className="italic">{exp.company}</p>
                                <p className="text-sm text-gray-500">{exp.location}</p>
                            </div>
                            <ul className="list-disc list-inside mt-1 space-y-1 text-sm">
                                {exp.points.map((p, j) => <li key={j}>{p}</li>)}
                            </ul>
                        </div>
                    ))}
                    </div>
                </Section>
                 <Section title="Projects">
                    <div className="space-y-4">
                    {r.projects.map((proj, i) => (
                        <div key={i}>
                            <h3 className="font-bold">{proj.name}</h3>
                            <ul className="list-disc list-inside mt-1 space-y-1 text-sm">
                                {proj.points.map((p, j) => <li key={j}>{p}</li>)}
                            </ul>
                        </div>
                    ))}
                    </div>
                </Section>
                <Section title="Skills">
                    <div className="space-y-1 text-sm">
                    {r.skills.map((skill, i) => (
                        <p key={i}><span className="font-bold">{skill.category}:</span> {skill.list}</p>
                    ))}
                    </div>
                </Section>
                <Section title="Education">
                     {r.education.map((edu, i) => (
                        <div key={i}>
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-bold">{edu.degree}</h3>
                                <p className="text-sm text-gray-500">{edu.dates}</p>
                            </div>
                            <p className="italic">{edu.university}</p>
                        </div>
                    ))}
                </Section>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      {error && <div className="text-center text-red-600 bg-red-100 p-4 rounded-lg">{error}</div>}
      {!resume && !error && <LoadingSpinner text="Loading resume for feedback..." />}
      {resume && (
          <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-grow">
                 {renderResume(resume)}
              </div>
              <div className="lg:w-80 flex-shrink-0">
                  <div className="sticky top-8 bg-white p-4 rounded-lg shadow-lg">
                      <h3 className="text-lg font-bold">Feedback Panel</h3>
                      <p className="text-sm text-gray-600 mt-1">
                          Hover over a section on the left to leave a comment.
                      </p>
                      <div className="mt-4">
                          <label htmlFor="comment" className="text-sm font-semibold text-gray-700">
                              Comment on "{activeSection || '...'}"
                          </label>
                          <textarea
                              id="comment"
                              rows={5}
                              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                              placeholder={activeSection ? `Add your feedback for the ${activeSection} section...` : 'Select a section to comment.'}
                              disabled={!activeSection}
                          />
                          <button
                            disabled={!activeSection}
                            className="w-full mt-2 px-4 py-2 bg-primary text-white font-semibold rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                              Submit Feedback
                          </button>
                           <p className="text-xs text-gray-500 mt-2 text-center">Note: Comment submission is a demo feature.</p>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ResumeFeedbackScreen;
