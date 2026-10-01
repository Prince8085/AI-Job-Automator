/**
 * NVIDIA API Service - Replaces Google Gemini
 * Uses Qwen 3.5 397B model via NVIDIA API
 * Supports both streaming and simple responses
 */

import { UserProfile, Job, CategorizedQuestions, SkillAnalysis, InterviewFeedback, CompanyBriefing, OfferDetails, NegotiationAnalysis, PotentialContact, StructuredResume, ApplicationInsights, TrackedJob, CareerPathPlan, ParsedApplicationForm } from '../types';
import { jobScrapingService } from './jobScrapingService';
import { searchJobsFromAPI } from './jobSearchAPIService';

const readEnv = (key: string): string | undefined => {
  try {
    const viteEnv = (import.meta as any)?.env?.[key];
    if (viteEnv) return String(viteEnv);
  } catch {}
  try {
    const nodeEnv = (process as any)?.env?.[key];
    if (nodeEnv) return String(nodeEnv);
  } catch {}
  return undefined;
};

const NVIDIA_API_KEY = readEnv('VITE_NVIDIA_API_KEY') || readEnv('NVIDIA_API_KEY');
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL = 'deepseek-ai/deepseek-v4-flash-0731';
const API_BASE_CANDIDATES = [
  readEnv('VITE_API_URL'),
  typeof window !== 'undefined' ? `${window.location.origin}/api` : undefined,
  'http://localhost:5000/api',
  'http://localhost:3001/api',
  'http://localhost:3000/api',
].filter(Boolean) as string[];

if (!NVIDIA_API_KEY) {
  console.warn('⚠️ NVIDIA API key missing. Set VITE_NVIDIA_API_KEY in frontend environment.');
}

/**
 * Parse JSON response from NVIDIA API
 */
export const parseJsonResponse = (text: string): any => {
  if (typeof text !== 'string' || !text) {
    console.error('AI response was not a string or was empty:', text);
    throw new Error('AI response was empty or not in a parsable format.');
  }

  // Try to extract JSON from code blocks
  const jsonMatch = text.match(/```(json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[2]) {
    try {
      return JSON.parse(jsonMatch[2]);
    } catch (e) {
      console.error('Failed to parse JSON from code block:', jsonMatch[2]);
    }
  }

  // Try to parse as direct JSON
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse JSON string:', text);
    throw new Error('AI response was not in a parsable JSON format.');
  }
};

const callBackendAIProxy = async (prompt: string): Promise<string | null> => {
  for (const base of API_BASE_CANDIDATES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(`${base}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({
          prompt,
          model: MODEL,
          maxTokens: 512,
          temperature: 0.7,
          topP: 0.95,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const data: any = await response.json();
      const content = data?.data?.content || data?.content;
      if (typeof content === 'string' && content.trim().length > 0) {
        return content;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
};

/**
 * Make simple API call to NVIDIA (non-streaming)
 */
const callNvidiaSimple = async (prompt: string): Promise<string> => {
  const proxied = await callBackendAIProxy(prompt);
  if (proxied) return proxied;

  if (!NVIDIA_API_KEY) {
    throw new Error('NVIDIA API key not configured');
  }

  const headers = {
    Authorization: `Bearer ${NVIDIA_API_KEY}`,
    'Content-Type': 'application/json',
  };

  const payload = {
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024,
    temperature: 0.7,
    top_p: 0.95,
    stream: false,
  };

  try {
    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`NVIDIA API error: ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('❌ NVIDIA API call failed:', error);
    throw error;
  }
};

/**
 * Make streaming API call to NVIDIA
 * Returns content as it's generated (useful for UX)
 */
const callNvidiaStreaming = async (
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<string> => {
  const proxied = await callBackendAIProxy(prompt);
  if (proxied) {
    onChunk(proxied);
    return proxied;
  }

  if (!NVIDIA_API_KEY) {
    throw new Error('NVIDIA API key not configured');
  }

  const headers = {
    Authorization: `Bearer ${NVIDIA_API_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  };

  const payload = {
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024,
    temperature: 0.7,
    top_p: 0.95,
    stream: true,
  };

  try {
    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`NVIDIA API error: ${error}`);
    }

    let fullContent = '';
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Response body not readable');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.choices?.[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              onChunk(content);
            }
          } catch (e) {
            // Skip lines that aren't valid JSON
          }
        }
      }
    }

    return fullContent;
  } catch (error) {
    console.error('❌ NVIDIA streaming call failed:', error);
    throw error;
  }
};

// ============================================
// EXPORTED FUNCTIONS - Same signatures as Gemini
// ============================================

export const searchLiveJobs = async (
  searchTerm: string,
  location: string,
  timeFilter: string = 'any'
): Promise<Job[]> => {
  // Try backend API search first (enhanced aggregation)
  try {
    console.log(`🔍 Searching for jobs via backend API: ${searchTerm} in ${location}`);
    const apiJobs = await searchJobsFromAPI(searchTerm, location, 100, 0, timeFilter);

    if (apiJobs && apiJobs.length > 0) {
      console.log(`✅ Found ${apiJobs.length} jobs from backend aggregation`);
      return apiJobs;
    }
  } catch (apiError) {
    console.warn('Backend API search failed, trying fallback:', apiError);
  }

  // Fallback to direct job scraping service
  try {
    console.log(`🔍 Searching with direct job scraping service: ${searchTerm}`);
    const timeFilterMap: Record<string, string> = {
      any_time: 'any',
      last_hour: '1h',
      last_24_hours: '24h',
      last_week: '7d',
      last_month: '30d',
      any: 'any',
    };
    const mappedTimeFilter = timeFilterMap[timeFilter] || 'any';

    const scrapedJobs = await jobScrapingService.scrapeJobs(
      searchTerm,
      location,
      mappedTimeFilter as any
    );

    if (scrapedJobs && scrapedJobs.length > 0) {
      console.log(`✅ Found ${scrapedJobs.length} jobs from direct scraping`);
      return scrapedJobs;
    }
  } catch (scrapingError) {
    console.warn('Job scraping failed:', scrapingError);
  }

  // Final fallback to NVIDIA AI search
  try {
    const prompt = `
      You are an expert job search aggregator. Find 5 REAL, currently open job postings for:
      - Position: "${searchTerm}"
      - Location: "${location}"
      
      For each job, provide:
      1. Title, Company, Location
      2. Detailed description
      3. Salary (or "Not specified" if unknown)
      4. 3-5 relevant tags
      5. Posted date
      6. Direct URL to the job posting
      
      Return ONLY a JSON array. Do not add any text before or after.
      [{
        "id": "string",
        "title": "string",
        "company": "string",
        "location": "string",
        "description": "string",
        "tags": ["string"],
        "salary": "string",
        "postedDate": "string",
        "sourceUrl": "string"
      }]
    `;

    const response = await callNvidiaSimple(prompt);
    const jobs = parseJsonResponse(response);
    return jobs || [];
  } catch (error) {
    console.error('❌ AI job search failed:', error);
    return [];
  }
};

export const parseJobFromTextAndImage = async (
  text?: string,
  image?: { mimeType: string; data: string }
): Promise<Job> => {
  try {
    let prompt = 'Extract job information from the following job posting:\n\n';
    if (text) prompt += text;
    if (image) {
      prompt +=
        '\n\nThere is also an image of the job posting (base64 encoded).';
    }

    prompt += `
      Extract and return ONLY a JSON object with these fields:
      - id: unique identifier
      - title: job title
      - company: company name
      - location: job location
      - description: full job description
      - tags: array of 3-5 relevant tags
      - salary: salary or "Not specified"
      - postedDate: when posted
      - sourceUrl: url if available
    `;

    const response = await callNvidiaSimple(prompt);
    return parseJsonResponse(response);
  } catch (error) {
    console.error('❌ Error parsing job:', error);
    throw error;
  }
};

export const parseResumeForProfile = async (
  resumeText: string
): Promise<Partial<UserProfile>> => {
  try {
    const prompt = `
      Parse this resume and extract professional information:\n\n${resumeText}
      
      Return a JSON object with:
      - name: full name
      - email: email address
      - phone: phone number
      - bio: professional summary
      - linkedinUrl: LinkedIn profile URL
      - githubUrl: GitHub profile URL
      - portfolioUrl: portfolio URL
      - location: current location
      - experience: array of work experiences
      - skills: array of technical skills
    `;

    const response = await callNvidiaSimple(prompt);
    return parseJsonResponse(response);
  } catch (error) {
    console.error('❌ Error parsing resume:', error);
    throw error;
  }
};

export const generateStructuredATSResume = async (
  userProfile: UserProfile,
  jobDescription: string
): Promise<StructuredResume> => {
  try {
    const prompt = `
      Create an ATS-optimized resume tailored for this job:\n\n${jobDescription}
      
      Based on this profile:\n${JSON.stringify(userProfile, null, 2)}
      
      Return a JSON object with:
      - headline: professional headline
      - summary: tailored professional summary
      - experience: array of optimized work experiences
      - skills: array of matched skills
      - certifications: array of relevant certifications
      - keywords: array of ATS keywords
    `;

    const response = await callNvidiaSimple(prompt);
    return parseJsonResponse(response);
  } catch (error) {
    console.error('❌ Error generating ATS resume:', error);
    throw error;
  }
};

export const generateCoverLetter = async (
  userProfile: UserProfile,
  job: Job
): Promise<string> => {
  try {
    const prompt = `
      Write a professional cover letter for:
      Position: ${job.title}
      Company: ${job.company}
      
      Job Description:\n${job.description}
      
      Candidate Profile: ${JSON.stringify(userProfile, null, 2)}
      
      Write a compelling, personalized cover letter. Be professional and specific.
    `;

    // Use streaming for better UX
    let fullContent = '';
    await callNvidiaStreaming(prompt, (chunk) => {
      fullContent += chunk;
    });
    return fullContent;
  } catch (error) {
    console.error('❌ Error generating cover letter:', error);
    throw error;
  }
};

export const generateInterviewQuestions = async (
  job: Job
): Promise<CategorizedQuestions[]> => {
  try {
    const prompt = `
      Generate interview questions for this job posting:\n\n${job.description}
      
      Create a JSON array with these categories:
      - behavioral: 3 behavioral questions about the company and role
      - technical: 3 technical questions related to the job
      - scenario: 2 scenario-based questions
      - culture_fit: 2 culture fit questions
      
      Each question should have "question" and "tip" fields.
      
      [{
        "category": "string",
        "questions": [
          {"question": "string", "tip": "string"}
        ]
      }]
    `;

    // Use streaming for better interactive experience
    let fullContent = '';
    await callNvidiaStreaming(prompt, (chunk) => {
      fullContent += chunk;
    });
    return parseJsonResponse(fullContent);
  } catch (error) {
    console.error('❌ Error generating interview questions:', error);
    throw error;
  }
};

export const getSkillsGapAnalysis = async (
  baseResume: string,
  jobDescription: string
): Promise<SkillAnalysis> => {
  try {
    const prompt = `
      Analyze the skills gap between this resume and job description.
      
      Resume:\n${baseResume}
      
      Job Description:\n${jobDescription}
      
      Return a JSON object with:
      - matched_skills: array of skills the candidate has that match the job
      - missing_skills: array of required skills the candidate lacks
      - recommendations: array of learning recommendations
      - learning_time: estimated time to bridge the gap
      - priority_skills: array of high-priority skills to learn
    `;

    const response = await callNvidiaSimple(prompt);
    return parseJsonResponse(response);
  } catch (error) {
    console.error('❌ Error analyzing skills gap:', error);
    throw error;
  }
};

export const getInterviewFeedback = async (
  question: string,
  userAnswer: string
): Promise<InterviewFeedback> => {
  try {
    const prompt = `
      Evaluate this interview answer:
      
      Question: ${question}
      Answer: ${userAnswer}
      
      Return a JSON object with:
      - score: score out of 10
      - strengths: array of what went well
      - improvements: array of improvements needed
      - better_answer: example of a better answer
      - tips: array of tips for similar questions
    `;

    const response = await callNvidiaSimple(prompt);
    return parseJsonResponse(response);
  } catch (error) {
    console.error('❌ Error getting interview feedback:', error);
    throw error;
  }
};

export const getInterviewVideoFeedback = async (
  question: string,
  userAnswer: string
): Promise<InterviewFeedback> => {
  try {
    const prompt = `
      Evaluate this video interview answer (analyzing spoken content):
      
      Question: ${question}
      Transcribed Answer: ${userAnswer}
      
      Also consider:
      - Clarity of speech
      - Pacing and confidence
      - Completeness of answer
      
      Return a JSON object with:
      - score: score out of 10
      - strengths: array of strengths
      - improvements: array of improvements
      - body_language_notes: notes on delivery
      - tips: array of tips
    `;

    const response = await callNvidiaSimple(prompt);
    return parseJsonResponse(response);
  } catch (error) {
    console.error('❌ Error getting video feedback:', error);
    throw error;
  }
};

export const generateFollowUpEmail = async (
  userProfile: UserProfile,
  job: Job,
  interviewerName: string,
  interviewDate: string,
  notes: string
): Promise<string> => {
  try {
    const prompt = `
      Write a professional follow-up email after an interview:
      
      Candidate: ${userProfile.name}
      Position: ${job.title} at ${job.company}
      Interviewer: ${interviewerName}
      Interview Date: ${interviewDate}
      Interview Notes: ${notes}
      
      The email should be:
      - Brief (3-4 paragraphs)
      - Professional yet personalized
      - Reference specific topics discussed
      - Reaffirm interest in the role
    `;

    // Use streaming for interactive writing
    let fullContent = '';
    await callNvidiaStreaming(prompt, (chunk) => {
      fullContent += chunk;
    });
    return fullContent;
  } catch (error) {
    console.error('❌ Error generating follow-up email:', error);
    throw error;
  }
};

export const generateCompanyBriefing = async (
  companyName: string
): Promise<CompanyBriefing> => {
  try {
    const prompt = `
      Research and provide a briefing for: ${companyName}
      
      Return a JSON object with:
      - overview: company overview (2-3 sentences)
      - mission: company mission
      - culture: company culture description
      - products_services: main products/services
      - recent_news: 2-3 recent news items
      - competitors: main competitors
      - interview_talking_points: array of 5 key talking points
    `;

    const response = await callNvidiaSimple(prompt);
    return parseJsonResponse(response);
  } catch (error) {
    console.error('❌ Error generating company briefing:', error);
    throw error;
  }
};

export const analyzeOfferAndGenerateScript = async (
  job: Job,
  offer: OfferDetails,
  userResume: string
): Promise<NegotiationAnalysis> => {
  try {
    const prompt = `
      Analyze this job offer and help with salary negotiation:
      
      Job: ${job.title} at ${job.company} in ${job.location}
      Offer Details: ${JSON.stringify(offer, null, 2)}
      Candidate Resume:\n${userResume}
      
      Return a JSON object with:
      - market_analysis: how the offer compares to market rates
      - negotiation_points: array of points to negotiate
      - counter_offer_suggestion: suggested counter-offer
      - negotiation_script: suggested email/script for negotiation
      - non_monetary_benefits: other benefits to negotiate for
      - decision_recommendation: recommendation on accepting
    `;

    const response = await callNvidiaSimple(prompt);
    return parseJsonResponse(response);
  } catch (error) {
    console.error('❌ Error analyzing offer:', error);
    throw error;
  }
};

export const findPotentialContacts = async (
  companyName: string
): Promise<PotentialContact[]> => {
  try {
    const prompt = `
      Find 5 key contacts at ${companyName} who might be able to help with job opportunities.
      
      Return a JSON array with:
      [{
        "name": "person's name",
        "title": "job title",
        "department": "department",
        "connection_reason": "why they're a good contact",
        "linkedin_search_term": "search term to find them on LinkedIn",
        "message_suggestion": "suggested initial message"
      }]
    `;

    const response = await callNvidiaSimple(prompt);
    return parseJsonResponse(response);
  } catch (error) {
    console.error('❌ Error finding contacts:', error);
    throw error;
  }
};

export const generateOutreachMessage = async (
  userName: string,
  contact: PotentialContact,
  jobTitle: string
): Promise<string> => {
  try {
    const prompt = `
      Write a professional LinkedIn outreach message:
      
      Your name: ${userName}
      Target: ${contact.name} - ${contact.title} at ${contact.department}
      Desired role: ${jobTitle}
      Reason for reaching out: ${contact.connection_reason}
      
      The message should be:
      - 3-4 sentences
      - Personalized
      - Professional
      - Include call to action
    `;

    // Use streaming for interactive message crafting
    let fullContent = '';
    await callNvidiaStreaming(prompt, (chunk) => {
      fullContent += chunk;
    });
    return fullContent;
  } catch (error) {
    console.error('❌ Error generating outreach message:', error);
    throw error;
  }
};

export const getApplicationInsights = async (
  job: TrackedJob,
  userResume: string
): Promise<ApplicationInsights> => {
  try {
    const prompt = `
      Analyze this job application and provide insights:
      
      Job: ${job.title} at ${job.company}
      Status: ${job.status}
      Job Description:\n${job.description}
      Resume:\n${userResume}
      
      Return a JSON object with:
      - fit_analysis: how well the candidate fits the role
      - likelihood_of_interview: percentage likelihood
      - strengths: array of candidate strengths for this role
      - weaknesses: array of potential weaknesses
      - next_steps: recommended next steps
      - follow_up_timing: when to follow up
    `;

    const response = await callNvidiaSimple(prompt);
    return parseJsonResponse(response);
  } catch (error) {
    console.error('❌ Error getting application insights:', error);
    throw error;
  }
};

export const generateCareerPathPlan = async (
  currentRole: string,
  goalRole: string
): Promise<CareerPathPlan> => {
  try {
    const prompt = `
      Create a detailed career path plan:
      
      Current Role: ${currentRole}
      Goal Role: ${goalRole}
      
      Return a JSON object with:
      - overview: career path overview
      - timeline: estimated timeline to reach goal
      - skills_to_develop: array of skills needed
      - certifications: recommended certifications
      - experience_needed: types of experience needed
      - milestone_roles: intermediate roles to target
      - learning_resources: array of resources for learning
      - networking_strategies: networking recommendations
    `;

    // Use streaming for detailed plan generation
    let fullContent = '';
    await callNvidiaStreaming(prompt, (chunk) => {
      fullContent += chunk;
    });
    return parseJsonResponse(fullContent);
  } catch (error) {
    console.error('❌ Error generating career path:', error);
    throw error;
  }
};

export const analyzeApplicationForm = async (
  job: Job,
  userProfile: UserProfile
): Promise<ParsedApplicationForm> => {
  try {
    const prompt = `
      Analyze how to fill out an application form for this job:
      
      Job: ${job.title} at ${job.company}
      Job Description:\n${job.description}
      Candidate Profile: ${JSON.stringify(userProfile, null, 2)}
      
      Return a JSON object with:
      - cover_letter_advice: specific advice for application
      - key_qualifications_to_highlight: array of key points
      - common_questions_answers: suggestions for common questions
      - red_flags_to_avoid: things to avoid in application
      - personalization_tips: how to personalize the application
    `;

    const response = await callNvidiaSimple(prompt);
    return parseJsonResponse(response);
  } catch (error) {
    console.error('❌ Error analyzing application form:', error);
    throw error;
  }
};

export default {
  parseJsonResponse,
  searchLiveJobs,
  parseJobFromTextAndImage,
  parseResumeForProfile,
  generateStructuredATSResume,
  generateCoverLetter,
  generateInterviewQuestions,
  getSkillsGapAnalysis,
  getInterviewFeedback,
  getInterviewVideoFeedback,
  generateFollowUpEmail,
  generateCompanyBriefing,
  analyzeOfferAndGenerateScript,
  findPotentialContacts,
  generateOutreachMessage,
  getApplicationInsights,
  generateCareerPathPlan,
  analyzeApplicationForm,
};
