
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable'; // Ensure this is imported for table features if needed, though not used in this layout
import { useJobData } from '../contexts/JobDataContext';
import { generateStructuredATSResume } from '../services/geminiService';
import ScreenWrapper from '../components/ScreenWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import { Job, StructuredResume, TrackedJob } from '../types';
import { ClipboardCopyIcon, CheckIcon, DocumentPdfIcon, ChatBubbleLeftRightIcon } from '../components/icons';

interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  color: string;
}

const resumeTemplates: ResumeTemplate[] = [
  {
    id: 'classic',
    name: 'Classic Professional',
    description: 'Clean, traditional layout perfect for corporate roles',
    preview: '📄',
    color: '#000000'
  },
  {
    id: 'modern',
    name: 'Modern Tech',
    description: 'Contemporary design ideal for tech and startup positions',
    preview: '🚀',
    color: '#2563eb'
  },
  {
    id: 'creative',
    name: 'Creative Design',
    description: 'Stylish layout for design and creative industries',
    preview: '🎨',
    color: '#7c3aed'
  },
  {
    id: 'minimal',
    name: 'Minimal Clean',
    description: 'Simple, elegant design that focuses on content',
    preview: '✨',
    color: '#059669'
  }
];

const ResumeBuilderScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { getJobById, userProfile, showToast, trackedJobs, saveTrackedJobData } = useJobData();
  const [job, setJob] = useState<Job | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<StructuredResume | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('classic');
  const [showPreview, setShowPreview] = useState(false);
  const [customizations, setCustomizations] = useState({
    primaryColor: '#2563eb',
    accentColor: '#1f2937',
    fontSize: 'medium',
    fontFamily: 'helvetica',
    includeSections: {
      summary: true,
      experience: true,
      projects: true,
      skills: true,
      education: true
    }
  });
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [atsAnalysis, setAtsAnalysis] = useState<any>(null);

  useEffect(() => {
    if (location.state?.jobData) {
      setJob(location.state.jobData);
    } else if (id) {
      const foundJob = getJobById(id);
      if (foundJob) setJob(foundJob);
    }
  }, [id, getJobById, location.state]);

  const calculateATSScore = (resume: StructuredResume, jobDescription: string) => {
    let score = 0;
    const feedback = [];
    const keywords = jobDescription.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const resumeText = JSON.stringify(resume).toLowerCase();

    // Keyword matching (40 points)
    const matchedKeywords = keywords.filter(keyword => resumeText.includes(keyword));
    const keywordScore = Math.min(40, (matchedKeywords.length / keywords.length) * 40);
    score += keywordScore;
    
    if (keywordScore < 20) {
      feedback.push("Add more relevant keywords from the job description");
    }

    // Section completeness (30 points)
    const sections = ['summary', 'experience', 'skills', 'education'];
    const completedSections = sections.filter(section => 
      resume[section as keyof StructuredResume] && 
      (Array.isArray(resume[section as keyof StructuredResume]) ? 
        (resume[section as keyof StructuredResume] as any[]).length > 0 : 
        resume[section as keyof StructuredResume])
    );
    const sectionScore = (completedSections.length / sections.length) * 30;
    score += sectionScore;

    if (sectionScore < 20) {
      feedback.push("Complete all resume sections for better ATS compatibility");
    }

    // Experience relevance (20 points)
    const experienceScore = resume.experience.length > 0 ? 20 : 0;
    score += experienceScore;

    if (experienceScore === 0) {
      feedback.push("Add relevant work experience");
    }

    // Skills alignment (10 points)
    const skillsScore = resume.skills.length > 0 ? 10 : 0;
    score += skillsScore;

    if (skillsScore === 0) {
      feedback.push("Add technical and soft skills");
    }

    return {
      score: Math.round(score),
      feedback,
      keywordMatch: Math.round((matchedKeywords.length / keywords.length) * 100),
      matchedKeywords: matchedKeywords.slice(0, 10)
    };
  };

  const generatePdfWithTemplate = (doc: jsPDF, structuredResume: StructuredResume, template: ResumeTemplate) => {
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = margin;

    // Template-specific styling
    const templateConfig = {
      classic: {
        primaryFont: 'times',
        headerSize: 24,
        sectionSize: 12,
        bodySize: 11,
        color: '#000000',
        accentColor: '#333333'
      },
      modern: {
        primaryFont: 'helvetica',
        headerSize: 26,
        sectionSize: 13,
        bodySize: 11,
        color: '#1f2937',
        accentColor: '#2563eb'
      },
      creative: {
        primaryFont: 'helvetica',
        headerSize: 28,
        sectionSize: 14,
        bodySize: 11,
        color: '#374151',
        accentColor: '#7c3aed'
      },
      minimal: {
        primaryFont: 'helvetica',
        headerSize: 22,
        sectionSize: 11,
        bodySize: 10,
        color: '#111827',
        accentColor: '#059669'
      }
    };

    const config = templateConfig[template.id as keyof typeof templateConfig] || templateConfig.classic;
     
     // Apply user customizations
     const fontSizeMultiplier = customizations.fontSize === 'small' ? 0.9 : customizations.fontSize === 'large' ? 1.1 : 1;
     config.headerSize *= fontSizeMultiplier;
     config.sectionSize *= fontSizeMultiplier;
     config.bodySize *= fontSizeMultiplier;
     config.primaryFont = customizations.fontFamily;
     config.color = customizations.primaryColor;
     config.accentColor = customizations.accentColor;

    // --- RENDER HEADER ---
      doc.setFont(config.primaryFont, 'bold');
      doc.setFontSize(config.headerSize);
      doc.setTextColor(config.color);
      doc.text(structuredResume.contact.name, pageWidth / 2, y, { align: 'center' });
      
      y += 30;
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      
      // Prepare contact information with proper formatting
      const contactInfo = [
        { text: structuredResume.contact.phone, url: null },
        { text: structuredResume.contact.email, url: `mailto:${structuredResume.contact.email}` },
        { text: structuredResume.contact.location, url: null }
      ].filter(item => item.text && item.text !== 'Not provided');

      const socialLinks = [
        { text: 'LinkedIn', url: userProfile.linkedinUrl },
        { text: 'GitHub', url: userProfile.githubUrl },
        { text: 'Portfolio', url: userProfile.portfolioUrl }
      ].filter(item => item.url && item.url !== 'Not provided');

      // Render contact info on first line
      if (contactInfo.length > 0) {
        const contactLine = contactInfo.map(item => item.text).join('  •  ');
        const contactWidth = doc.getTextWidth(contactLine);
        let currentX = (pageWidth - contactWidth) / 2;
        
        contactInfo.forEach((item, index) => {
          if (item.url) {
            doc.setTextColor('#0000EE');
            doc.textWithLink(item.text, currentX, y, { url: item.url });
            doc.setTextColor('#000000');
          } else {
            doc.text(item.text, currentX, y);
          }
          
          currentX += doc.getTextWidth(item.text);
          if (index < contactInfo.length - 1) {
            doc.text('  •  ', currentX, y);
            currentX += doc.getTextWidth('  •  ');
          }
        });
        y += 15;
      }

      // Render social links on second line
      if (socialLinks.length > 0) {
        const socialLine = socialLinks.map(item => item.text).join('  •  ');
        const socialWidth = doc.getTextWidth(socialLine);
        let currentX = (pageWidth - socialWidth) / 2;
        
        socialLinks.forEach((item, index) => {
          doc.setTextColor('#0000EE');
          doc.textWithLink(item.text, currentX, y, { url: item.url });
          doc.setTextColor('#000000');
          
          currentX += doc.getTextWidth(item.text);
          if (index < socialLinks.length - 1) {
            doc.text('  •  ', currentX, y);
            currentX += doc.getTextWidth('  •  ');
          }
        });
        y += 15;
      }

      y += 25;

      const drawSection = (title: string, content: () => void) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.setFont(config.primaryFont, 'bold');
        doc.setFontSize(config.sectionSize);
        doc.setTextColor(config.accentColor);
        doc.text(title.toUpperCase(), margin, y);
        y += 5;
        doc.setLineWidth(1);
        doc.setDrawColor(config.accentColor);
        doc.line(margin, y, pageWidth - margin, y);
        y += 15;
        content();
      };
      
      if (customizations.includeSections.summary) {
      drawSection('Summary', () => {
        doc.setFont(config.primaryFont, 'normal');
        doc.setFontSize(config.bodySize);
        doc.setTextColor(config.color);
        const summaryLines = doc.splitTextToSize(structuredResume.summary, pageWidth - margin * 2);
        doc.text(summaryLines, margin, y);
        y += summaryLines.length * 12 + 5;
      });
    }

    if (customizations.includeSections.experience) {
      drawSection('Experience', () => {
        structuredResume.experience.forEach(exp => {
          doc.setFont(config.primaryFont, 'bold');
          doc.setFontSize(config.bodySize);
          doc.setTextColor(config.color);
          doc.text(exp.title, margin, y);

          const dateWidth = doc.getTextWidth(exp.dates);
          doc.text(exp.dates, pageWidth - margin - dateWidth, y);
          
          y += 14;
          doc.setFont(config.primaryFont, 'italic');
          doc.text(exp.company, margin, y);
          
          const locationWidth = doc.getTextWidth(exp.location);
          doc.text(exp.location, pageWidth - margin - locationWidth, y);
          
          y += 14;
          doc.setFont(config.primaryFont, 'normal');
          exp.points.forEach(point => {
            const pointLines = doc.splitTextToSize(`\u2022 ${point}`, pageWidth - margin * 2 - 15);
            doc.text(pointLines, margin + 15, y);
            y += pointLines.length * 11 + 3;
          });
          y += 8;
        });
      });
    }

    if (customizations.includeSections.projects) {
      drawSection('Projects', () => {
        structuredResume.projects.forEach(proj => {
          doc.setFont(config.primaryFont, 'bold');
          doc.setFontSize(config.bodySize);
          doc.setTextColor(config.color);
          doc.text(proj.name, margin, y);
          y += 14;
          doc.setFont(config.primaryFont, 'normal');
          proj.points.forEach(point => {
            const pointLines = doc.splitTextToSize(`\u2022 ${point}`, pageWidth - margin * 2 - 15);
            doc.text(pointLines, margin + 15, y);
            y += pointLines.length * 11 + 3;
          });
          y += 8;
        });
      });
    }

    if (customizations.includeSections.skills) {
      drawSection('Skills', () => {
        doc.setFont(config.primaryFont, 'normal');
        doc.setFontSize(config.bodySize);
        doc.setTextColor(config.color);
        structuredResume.skills.forEach(skillCat => {
          doc.setFont(config.primaryFont, 'bold');
          const categoryText = `${skillCat.category}: `;
          const categoryWidth = doc.getTextWidth(categoryText);
          doc.text(categoryText, margin, y);
          
          doc.setFont(config.primaryFont, 'normal');
          const listLines = doc.splitTextToSize(skillCat.list, pageWidth - margin * 2 - categoryWidth);
          doc.text(listLines, margin + categoryWidth, y);
          y += listLines.length * 12 + 2;
        });
        y += 8;
      });
    }

    if (customizations.includeSections.education) {
      drawSection('Education', () => {
        structuredResume.education.forEach(edu => {
          doc.setFont(config.primaryFont, 'bold');
          doc.setFontSize(config.bodySize);
          doc.setTextColor(config.color);
          doc.text(edu.degree, margin, y);
          
          const dateWidth = doc.getTextWidth(edu.dates);
          doc.text(edu.dates, pageWidth - margin - dateWidth, y);
          
          y += 14;
          doc.setFont(config.primaryFont, 'italic');
          doc.text(edu.university, margin, y);
          y += 20;
        });
      });
    }

    doc.save(`${userProfile.name.replace(' ', '_')}_Resume_for_${job.company}.pdf`);
    showToast('PDF resume downloaded!', 'success');
    
    if (trackedJobs.some(trackedJob => trackedJob.id === job.id)) {
      saveTrackedJobData(job.id, { structuredResume });
      showToast('Saved structured resume to tracker!', 'info');
    }
  };

  const handleGeneratePdf = async () => {
    if (!job) return;
    setIsGeneratingPdf(true);
    setGeneratedResume(null);
    try {
      const structuredResume = await generateStructuredATSResume(userProfile, job.description);
      setGeneratedResume(structuredResume);
      
      const doc = new jsPDF('p', 'pt', 'a4');
      const selectedTemplateObj = resumeTemplates.find(t => t.id === selectedTemplate) || resumeTemplates[0];
      generatePdfWithTemplate(doc, structuredResume, selectedTemplateObj);
      
    } catch (err: any) {
      showToast(err.message || 'Error generating PDF.', 'error');
      console.error(err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  const handleCopyFeedbackLink = () => {
    if (!generatedResume) {
        showToast('Please generate a resume first.', 'error');
        return;
    }
    const data = btoa(JSON.stringify(generatedResume));
    const url = `${window.location.origin}${window.location.pathname}#/feedback?data=${data}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    showToast('Feedback link copied to clipboard!', 'success');
    setTimeout(() => setIsCopied(false), 3000);
  };

  if (!job) return <ScreenWrapper><LoadingSpinner text="Loading..." /></ScreenWrapper>;

  return (
    <ScreenWrapper>
      <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">AI Resume Builder</h2>
          <p className="text-text-secondary">Tailoring your resume for <span className="font-semibold text-primary">{job.title}</span> at <span className="font-semibold text-primary">{job.company}</span>.</p>
        </div>

        {/* Template Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Choose Resume Template</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {resumeTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === template.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center space-y-2">
                  <div className="text-3xl">{template.preview}</div>
                  <h4 className="font-medium text-sm text-text-primary">{template.name}</h4>
                  <p className="text-xs text-text-secondary">{template.description}</p>
                  <div 
                    className="w-4 h-4 rounded-full mx-auto border-2 border-gray-300"
                    style={{ backgroundColor: template.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

         {/* Customization Options */}
         <div className="space-y-4">
           <h3 className="text-lg font-semibold text-text-primary">Customize Your Resume</h3>
           
           <div className="grid md:grid-cols-2 gap-6">
             {/* Color Customization */}
             <div className="space-y-3">
               <h4 className="font-medium text-text-primary">Colors</h4>
               <div className="space-y-2">
                 <div>
                   <label className="block text-sm text-text-secondary mb-1">Primary Color</label>
                   <div className="flex items-center space-x-2">
                     <input
                       type="color"
                       value={customizations.primaryColor}
                       onChange={(e) => setCustomizations(prev => ({ ...prev, primaryColor: e.target.value }))}
                       className="w-8 h-8 rounded border"
                     />
                     <span className="text-sm text-text-secondary">{customizations.primaryColor}</span>
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm text-text-secondary mb-1">Accent Color</label>
                   <div className="flex items-center space-x-2">
                     <input
                       type="color"
                       value={customizations.accentColor}
                       onChange={(e) => setCustomizations(prev => ({ ...prev, accentColor: e.target.value }))}
                       className="w-8 h-8 rounded border"
                     />
                     <span className="text-sm text-text-secondary">{customizations.accentColor}</span>
                   </div>
                 </div>
               </div>
             </div>

             {/* Font Customization */}
             <div className="space-y-3">
               <h4 className="font-medium text-text-primary">Typography</h4>
               <div className="space-y-2">
                 <div>
                   <label className="block text-sm text-text-secondary mb-1">Font Family</label>
                   <select
                     value={customizations.fontFamily}
                     onChange={(e) => setCustomizations(prev => ({ ...prev, fontFamily: e.target.value }))}
                     className="w-full p-2 border rounded-md text-sm"
                   >
                     <option value="helvetica">Helvetica (Modern)</option>
                     <option value="times">Times (Classic)</option>
                     <option value="courier">Courier (Monospace)</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm text-text-secondary mb-1">Font Size</label>
                   <select
                     value={customizations.fontSize}
                     onChange={(e) => setCustomizations(prev => ({ ...prev, fontSize: e.target.value }))}
                     className="w-full p-2 border rounded-md text-sm"
                   >
                     <option value="small">Small</option>
                     <option value="medium">Medium</option>
                     <option value="large">Large</option>
                   </select>
                 </div>
               </div>
             </div>
           </div>

           {/* Section Selection */}
           <div className="space-y-3">
             <h4 className="font-medium text-text-primary">Include Sections</h4>
             <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
               {Object.entries(customizations.includeSections).map(([section, included]) => (
                 <label key={section} className="flex items-center space-x-2 cursor-pointer">
                   <input
                     type="checkbox"
                     checked={included}
                     onChange={(e) => setCustomizations(prev => ({
                       ...prev,
                       includeSections: { ...prev.includeSections, [section]: e.target.checked }
                     }))}
                     className="rounded"
                   />
                   <span className="text-sm capitalize">{section}</span>
                 </label>
               ))}
             </div>
           </div>
         </div>

        {/* ATS Analysis */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">ATS Analysis</h3>
          
          <button
            onClick={() => {
              if (job && structuredResume) {
                const analysis = calculateATSScore(structuredResume, job.description);
                setAtsScore(analysis.score);
                setAtsAnalysis(analysis);
              }
            }}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors mb-4"
          >
            Analyze Resume
          </button>

          {atsScore !== null && atsAnalysis && (
            <div className="mt-4">
              <div className="flex items-center mb-4">
                <div className="text-2xl font-bold mr-4">
                  <span className={`${atsScore >= 80 ? 'text-green-600' : atsScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {atsScore}/100
                  </span>
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${atsScore >= 80 ? 'bg-green-600' : atsScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'}`}
                    style={{ width: `${atsScore}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-blue-800">Keyword Match</h4>
                  <p className="text-blue-600">{atsAnalysis.keywordMatch}%</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-green-800">Matched Keywords</h4>
                  <p className="text-green-600 text-sm">{atsAnalysis.matchedKeywords.join(', ')}</p>
                </div>
              </div>

              {atsAnalysis.feedback.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">Improvement Suggestions</h4>
                  <ul className="list-disc list-inside text-yellow-700">
                    {atsAnalysis.feedback.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="w-full flex items-center justify-center py-3 px-6 text-primary font-bold bg-primary/10 rounded-lg hover:bg-primary/20 transition"
          >
            <DocumentPdfIcon className="w-5 h-5 mr-2" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            className="w-full flex items-center justify-center py-3 px-6 text-white font-bold bg-gradient-secondary rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-wait"
          >
            <DocumentPdfIcon className="w-5 h-5 mr-2" />
            {isGeneratingPdf ? 'Generating PDF...' : 'Generate ATS-Optimized PDF'}
          </button>
        </div>
      </div>

      {/* Preview Section */}
      {showPreview && (
        <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
          <h3 className="text-xl font-bold text-text-primary">Resume Preview</h3>
          <div className="border rounded-lg p-6 bg-gray-50 max-h-96 overflow-y-auto">
            <div className="space-y-4 text-sm">
              <div className="text-center border-b pb-4">
                <h2 className="text-lg font-bold">{userProfile.name}</h2>
                <p className="text-gray-600">{userProfile.email} | {userProfile.phone}</p>
                <p className="text-gray-600">{userProfile.location}</p>
                {userProfile.linkedinUrl && (
                  <p className="text-blue-600">LinkedIn | GitHub | Portfolio</p>
                )}
              </div>
              
              <div>
                <h3 className="font-bold text-gray-800 border-b">SUMMARY</h3>
                <p className="mt-2 text-gray-700">Professional summary will be generated based on the job requirements...</p>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-800 border-b">EXPERIENCE</h3>
                <div className="mt-2 space-y-2">
                  {userProfile.experience?.slice(0, 2).map((exp, index) => (
                    <div key={index}>
                      <div className="flex justify-between">
                        <span className="font-medium">{exp.title}</span>
                        <span className="text-gray-600">{exp.duration}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{exp.company}</span>
                        <span>{exp.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-800 border-b">SKILLS</h3>
                <p className="mt-2 text-gray-700">{userProfile.skills?.slice(0, 10).join(', ')}...</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 italic">
            * This is a basic preview. The actual PDF will be fully customized and ATS-optimized based on the job requirements.
          </p>
        </div>
      )}

      {isGeneratingPdf && <LoadingSpinner text="AI is crafting your professional resume..." />}

      {generatedResume && (
        <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
            <h3 className="text-xl font-bold text-text-primary">Your Resume is Ready!</h3>
            <p className="text-text-secondary">Your PDF has been downloaded. You can also share a link with mentors or friends to get feedback.</p>
            <button
                onClick={handleCopyFeedbackLink}
                disabled={isCopied}
                className={`w-full flex items-center justify-center py-3 px-6 font-bold rounded-lg transition ${
                    isCopied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-indigo-100 text-primary hover:bg-indigo-200'
                }`}
            >
                {isCopied ? (
                    <><CheckIcon className="w-5 h-5 mr-2" /> Link Copied!</>
                ) : (
                    <><ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" /> Get Sharable Link for Feedback</>
                )}
            </button>
        </div>
      )}
    </ScreenWrapper>
  );
};

export default ResumeBuilderScreen;
