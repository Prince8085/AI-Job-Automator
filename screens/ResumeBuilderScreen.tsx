
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

const ResumeBuilderScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { getJobById, userProfile, showToast, trackedJobs, saveTrackedJobData } = useJobData();
  const [job, setJob] = useState<Job | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<StructuredResume | null>(null);

  useEffect(() => {
    if (location.state?.jobData) {
      setJob(location.state.jobData);
    } else if (id) {
      const foundJob = getJobById(id);
      if (foundJob) setJob(foundJob);
    }
  }, [id, getJobById, location.state]);

  const handleGeneratePdf = async () => {
    if (!job) return;
    setIsGeneratingPdf(true);
    setGeneratedResume(null);
    try {
      const structuredResume = await generateStructuredATSResume(userProfile, job.description);
      setGeneratedResume(structuredResume);
      
      const doc = new jsPDF('p', 'pt', 'a4');
      const margin = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = margin;

      // --- RENDER HEADER ---
      doc.setFont('times', 'bold');
      doc.setFontSize(26);
      doc.setTextColor('#000000');
      doc.text(structuredResume.contact.name, pageWidth / 2, y, { align: 'center' });
      
      y += 20;
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      
      const contactParts = [
        structuredResume.contact.phone,
        structuredResume.contact.location,
        structuredResume.contact.email,
        structuredResume.contact.linkedin,
        structuredResume.contact.github,
        structuredResume.contact.portfolio,
      ].filter(p => p && p !== 'Not provided');

      const contactLine = contactParts.join('  \u25CA  ');
      const contactWidth = doc.getTextWidth(contactLine);
      doc.text(contactLine, (pageWidth - contactWidth) / 2, y);

      let currentX = (pageWidth - contactWidth) / 2;
      contactParts.forEach(part => {
        const partWidth = doc.getTextWidth(part);
        let url = '';
        if (part === structuredResume.contact.email) url = `mailto:${part}`;
        else if (part.includes('linkedin.com') || part === 'LinkedIn') url = userProfile.linkedinUrl;
        else if (part.includes('github.com') || part === 'GitHub') url = userProfile.githubUrl;
        else if (part === 'Portfolio') url = userProfile.portfolioUrl;

        if (url) {
            doc.setTextColor('#0000EE');
            doc.textWithLink(part, currentX, y, { url });
            doc.setTextColor('#000000');
        }
        currentX += partWidth + doc.getTextWidth('  \u25CA  ');
      });

      y += 25;

      const drawSection = (title: string, content: () => void) => {
        if (y > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
        doc.setFont('times', 'bold');
        doc.setFontSize(12);
        doc.text(title.toUpperCase(), margin, y);
        y += 5;
        doc.setLineWidth(1);
        doc.setDrawColor('#000000');
        doc.line(margin, y, pageWidth - margin, y);
        y += 15;
        content();
      };
      
      drawSection('Summary', () => {
        doc.setFont('times', 'normal');
        doc.setFontSize(11);
        const summaryLines = doc.splitTextToSize(structuredResume.summary, pageWidth - margin * 2);
        doc.text(summaryLines, margin, y);
        y += summaryLines.length * 12 + 5;
      });

      drawSection('Experience', () => {
        structuredResume.experience.forEach(exp => {
          doc.setFont('times', 'bold');
          doc.setFontSize(11);
          doc.text(exp.title, margin, y);

          const dateWidth = doc.getTextWidth(exp.dates);
          doc.text(exp.dates, pageWidth - margin - dateWidth, y);
          
          y += 14;
          doc.setFont('times', 'italic');
          doc.text(exp.company, margin, y);
          
          const locationWidth = doc.getTextWidth(exp.location);
          doc.text(exp.location, pageWidth - margin - locationWidth, y);
          
          y += 14;
          doc.setFont('times', 'normal');
          exp.points.forEach(point => {
            const pointLines = doc.splitTextToSize(`\u2022 ${point}`, pageWidth - margin * 2 - 15);
            doc.text(pointLines, margin + 15, y);
            y += pointLines.length * 11 + 3;
          });
          y += 8;
        });
      });

      drawSection('Projects', () => {
        structuredResume.projects.forEach(proj => {
            doc.setFont('times', 'bold');
            doc.setFontSize(11);
            doc.text(proj.name, margin, y);
            y += 14;
            doc.setFont('times', 'normal');
             proj.points.forEach(point => {
                const pointLines = doc.splitTextToSize(`\u2022 ${point}`, pageWidth - margin * 2 - 15);
                doc.text(pointLines, margin + 15, y);
                y += pointLines.length * 11 + 3;
             });
             y += 8;
        });
      });

      drawSection('Skills', () => {
        doc.setFont('times', 'normal');
        doc.setFontSize(11);
        structuredResume.skills.forEach(skillCat => {
            doc.setFont('times', 'bold');
            const categoryText = `${skillCat.category}: `;
            const categoryWidth = doc.getTextWidth(categoryText);
            doc.text(categoryText, margin, y);
            
            doc.setFont('times', 'normal');
            const listLines = doc.splitTextToSize(skillCat.list, pageWidth - margin * 2 - categoryWidth);
            doc.text(listLines, margin + categoryWidth, y);
            y += listLines.length * 12 + 2;
        });
        y += 8;
      });

      drawSection('Education', () => {
         structuredResume.education.forEach(edu => {
            doc.setFont('times', 'bold');
            doc.setFontSize(11);
            doc.text(edu.degree, margin, y);
            
            const dateWidth = doc.getTextWidth(edu.dates);
            doc.text(edu.dates, pageWidth - margin - dateWidth, y);
            
            y += 14;
            doc.setFont('times', 'italic');
            doc.text(edu.university, margin, y);
            y += 20;
        });
      });

      doc.save(`${userProfile.name.replace(' ', '_')}_Resume_for_${job.company}.pdf`);
      showToast('PDF resume downloaded!', 'success');
      
      if (trackedJobs.some(trackedJob => trackedJob.id === job.id)) {
        saveTrackedJobData(job.id, { structuredResume });
        showToast('Saved structured resume to tracker!', 'info');
      }

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
      <div className="bg-white p-6 rounded-lg shadow-lg space-y-4">
        <h2 className="text-2xl font-bold text-text-primary">AI Resume Builder</h2>
        <p className="text-text-secondary">Tailoring your resume for <span className="font-semibold text-primary">{job.title}</span> at <span className="font-semibold text-primary">{job.company}</span>.</p>
        <div className="grid sm:grid-cols-1 gap-4">
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
