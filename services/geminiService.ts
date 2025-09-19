
import { GoogleGenAI, GenerateContentResponse, Type, Part } from "@google/genai";
import { UserProfile, Job, CategorizedQuestions, SkillAnalysis, InterviewFeedback, CompanyBriefing, OfferDetails, NegotiationAnalysis, PotentialContact, StructuredResume, ApplicationInsights, TrackedJob, CareerPathPlan, ParsedApplicationForm } from '../types';
import { jobScrapingService } from './jobScrapingService';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
  // This is a fallback for development environments where the key might not be set.
  // In a real production deployment, this check might be more robust.
  console.warn("VITE_GEMINI_API_KEY environment variable not set. Using a placeholder. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || " " });
const model = "gemini-2.5-flash";

const parseJsonResponse = (text: string): any => {
    if (typeof text !== 'string' || !text) {
        console.error("AI response was not a string or was empty:", text);
        throw new Error("AI response was empty or not in a parsable format.");
    }
    const jsonMatch = text.match(/```(json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[2]) {
        try {
            return JSON.parse(jsonMatch[2]);
        } catch (e) {
             console.error("Failed to parse JSON from code block:", jsonMatch[2]);
        }
    }
    // Fallback if no code block is found, assume the whole text is JSON.
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse JSON string:", text);
        throw new Error("AI response was not in a parsable JSON format.");
    }
}

export const searchLiveJobs = async (searchTerm: string, location: string): Promise<Job[]> => {
    // First, try to get jobs using job scraping service (more reliable)
    try {
        console.log(`Searching for jobs: ${searchTerm} in ${location}`);
        
        // Use job scraping service as primary method
        const scrapedJobs = await jobScrapingService.scrapeJobs(searchTerm, location);
        
        if (scrapedJobs && scrapedJobs.length > 0) {
            console.log(`Found ${scrapedJobs.length} jobs from scraping service`);
            return scrapedJobs;
        }
        
        console.log("No jobs found from scraping service, trying AI search...");
        
    } catch (scrapingError) {
        console.warn("Job scraping service failed:", scrapingError);
    }

    // Fallback to AI search if scraping fails or returns no results
    try {
        if (!API_KEY || API_KEY.trim() === "" || API_KEY === " ") {
            throw new Error("Gemini API key is not configured properly");
        }

        const prompt = `
            You are an expert job search aggregator. Your task is to act as a powerful job board API.
            Use your search capabilities to find 5 REAL, currently open job postings based on the user's query.

            The user is searching for "${searchTerm}" in "${location}".

            Instructions:
            1.  Perform a search to find actual job listings from various sources (like company career pages, job boards, etc.).
            2.  For each job found, extract the required information and the direct URL to the original posting. This is the most important step.
            3.  Provide a detailed description. If the source has a short description, try to find and use a more detailed one.
            4.  If a salary is not explicitly mentioned, state "Not specified". Do not invent a salary.
            5.  Generate a unique ID for each job (e.g., "ai-1", "ai-2").
            6.  Return ONLY a JSON array of these job objects. Do not add any introductory text, explanations, or markdown formatting.

            The JSON format for each job object must be:
            {
              "id": "string",
              "title": "string",
              "company": "string",
              "location": "string",
              "description": "string",
              "tags": ["string"],
              "salary": "string",
              "postedDate": "string",
              "sourceUrl": "string"
            }
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });

        if (!response.text) {
            console.warn("AI response text is empty for searchLiveJobs.");
            throw new Error("AI returned empty response");
        }
        
        const jobs = parseJsonResponse(response.text);
        
        if (!Array.isArray(jobs)) {
            throw new Error("AI returned an unexpected format for job listings.");
        }

        const processedJobs = jobs.map((job: any, index: number) => ({
            id: job.id || `ai-${index}-${Date.now()}`,
            title: job.title || "No title provided",
            company: job.company || "No company provided",
            location: job.location || "No location provided",
            description: job.description || "No description provided.",
            tags: job.tags || [],
            salary: job.salary || "Not specified",
            postedDate: job.postedDate || "Recently",
            sourceUrl: job.sourceUrl || undefined,
        }));

        console.log(`Found ${processedJobs.length} jobs from AI search`);
        return processedJobs;

    } catch (aiError) {
        console.error("Error searching live jobs with AI:", aiError);
        
        // Final fallback: return demo jobs with clear indication
        console.log("Both scraping and AI search failed, returning demo jobs");
        return generateDemoJobs(searchTerm, location);
    }
};

// Generate demo jobs when all other methods fail
const generateDemoJobs = (searchTerm: string, location: string): Job[] => {
    return [
        {
            id: `demo-1-${Date.now()}`,
            title: `${searchTerm} - Demo Position`,
            company: "Demo Company",
            location: location || "Remote",
            description: `This is a demo job listing for ${searchTerm}. In a real scenario, this would be fetched from actual job boards. The job scraping service and AI search are currently unavailable.`,
            tags: ["Demo", "Example", "Not Real"],
            salary: "Demo Salary",
            postedDate: "Demo Date",
            sourceUrl: "https://example.com/demo-job"
        },
        {
            id: `demo-2-${Date.now()}`,
            title: `Senior ${searchTerm} - Demo`,
            company: "Example Corp",
            location: location || "Remote",
            description: `Another demo job listing. This demonstrates the fallback functionality when real job data cannot be retrieved.`,
            tags: ["Demo", "Senior Level", "Example"],
            salary: "Demo Range",
            postedDate: "Demo Date",
            sourceUrl: "https://example.com/demo-job-2"
        }
    ];
};

export const parseJobFromTextAndImage = async (text?: string, image?: {mimeType: string, data: string}): Promise<Job> => {
    try {
        const prompt = `
            You are an intelligent job description parser. Your task is to analyze the provided text and/or image of a job posting and extract the key details.
            Return a single, clean JSON object with the extracted information.
            
            Instructions:
            1.  Identify the job title, company name, location, and the full job description.
            2.  If a salary is mentioned, extract it. Otherwise, set it to "Not specified".
            3.  Suggest 3-5 relevant skill tags based on the description.
            4.  For the 'postedDate', use "Today".
            5.  Generate a unique ID for the job using the format "imported-[timestamp]".

            The JSON format for the job object must be:
            {
              "id": "string",
              "title": "string",
              "company": "string",
              "location": "string",
              "description": "string",
              "tags": ["string"],
              "salary": "string",
              "postedDate": "string"
            }

            Analyze the following content and provide the JSON object now. Do not add any extra text or markdown formatting.
        `;

        const contentParts: Part[] = [{ text: prompt }];

        if (text) {
            contentParts.push({ text: `Job Text: \n${text}` });
        }
        if (image) {
            contentParts.push({
                inlineData: {
                    mimeType: image.mimeType,
                    data: image.data
                }
            });
        }
        
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: contentParts },
        });

        if (!response.text) {
            if (response.promptFeedback?.blockReason) {
                throw new Error(`AI request was blocked due to ${response.promptFeedback.blockReason}.`);
            }
            throw new Error("AI returned an empty response when parsing job data.");
        }
        const jobData = parseJsonResponse(response.text);

        return {
            id: jobData.id || `imported-${Date.now()}`,
            title: jobData.title || "Untitled Job",
            company: jobData.company || "Unknown Company",
            location: jobData.location || "Unknown Location",
            description: jobData.description || "No description found.",
            tags: jobData.tags || [],
            salary: jobData.salary || "Not specified",
            postedDate: jobData.postedDate || "Today"
        };

    } catch (error) {
        console.error("Error parsing job data from input:", error);
        throw new Error("Could not analyze the provided job content. The AI might have had trouble understanding the format.");
    }
};

export const parseResumeForProfile = async (resumeFile: Part): Promise<Partial<UserProfile>> => {
    try {
        const prompt = `
            You are an expert HR data parser. Your task is to analyze the provided resume file and extract key information to auto-fill a user's profile.

            Instructions:
            1.  Extract the user's full name.
            2.  Extract the full text content of the resume to be used as the 'baseResume'.
            3.  From the 'Summary' or 'Objective' section, extract a concise professional bio. If no summary exists, create a one-sentence bio based on their most recent role.
            4.  Return ONLY a JSON object with the extracted information. Do not add any introductory text, explanations, or markdown formatting.

            The JSON format must be:
            {
              "name": "string",
              "bio": "string",
              "baseResume": "string"
            }
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [{ text: prompt }, resumeFile] },
        });

        if (!response.text) {
            if (response.promptFeedback?.blockReason) {
                throw new Error(`AI request was blocked due to ${response.promptFeedback.blockReason}.`);
            }
            throw new Error("AI returned an empty response when parsing resume.");
        }
        return parseJsonResponse(response.text);
    } catch (error) {
        console.error("Error parsing resume file:", error);
        throw new Error("Could not parse the resume file. Please ensure it's a valid text-based PDF or TXT file.");
    }
};

export const generateStructuredATSResume = async (userProfile: UserProfile, jobDescription: string): Promise<StructuredResume> => {
    try {
        const prompt = `
            You are an expert ATS (Applicant Tracking System) resume optimizer and professional resume writer.
            Your task is to tailor the user's base resume to perfectly match the job description, structuring the output as a clean, complete JSON object.
            The final resume should be concise and fit on a single page. Emulate the professional, clean format of top-tier tech resumes.

            User Profile:
            - Name: ${userProfile.name}
            - Email: ${userProfile.email}
            - Phone: ${userProfile.phone}
            - Location: Shahdol, MP (from user's resume)
            - LinkedIn: ${userProfile.linkedinUrl || 'Not provided'}
            - GitHub: ${userProfile.githubUrl || 'Not provided'}
            - Portfolio: ${userProfile.portfolioUrl || 'Not provided'}
            - Base Resume Content:
            ---
            ${userProfile.baseResume}
            ---

            Job Description to Target:
            ---
            ${jobDescription}
            ---

            Instructions:
            1.  **Parse & Tailor:** Analyze the base resume and job description. Rewrite the summary and experience bullet points to heavily feature keywords and required skills from the job description. Quantify achievements where possible.
            2.  **Structure Skills:** Group skills into logical categories (e.g., "Languages", "Frameworks & Libraries", "Databases", "Tools & Platforms").
            3.  **Format Projects:** For projects, list the name and then 2-3 bullet points highlighting key achievements and technologies used.
            4.  **Format Output:** Return a single, valid JSON object following the provided schema. Do not add any text before or after the JSON.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        contact: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                email: { type: Type.STRING },
                                phone: { type: Type.STRING },
                                location: { type: Type.STRING },
                                linkedin: { type: Type.STRING },
                                github: { type: Type.STRING },
                                portfolio: { type: Type.STRING },
                            }
                        },
                        summary: { type: Type.STRING },
                        experience: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    company: { type: Type.STRING },
                                    dates: { type: Type.STRING },
                                    location: { type: Type.STRING },
                                    points: { type: Type.ARRAY, items: { type: Type.STRING } }
                                }
                            }
                        },
                        education: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    degree: { type: Type.STRING },
                                    university: { type: Type.STRING },
                                    dates: { type: Type.STRING },
                                }
                            }
                        },
                        projects: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    points: { type: Type.ARRAY, items: { type: Type.STRING } },
                                }
                            }
                        },
                        skills: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    category: { type: Type.STRING },
                                    list: { type: Type.STRING, description: "A comma-separated string of skills." }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!response.text) {
            if (response.promptFeedback?.blockReason) {
                throw new Error(`AI request was blocked due to ${response.promptFeedback.blockReason}.`);
            }
            throw new Error("AI returned an empty response when generating the resume.");
        }
        return parseJsonResponse(response.text);
    } catch (error) {
        console.error("Error generating structured resume:", error);
        throw new Error("Could not generate the structured PDF resume content.");
    }
};

export const generateCoverLetter = async (userProfile: UserProfile, job: Job): Promise<string> => {
  try {
    const prompt = `
      You are a professional career writer crafting a compelling cover letter.
      Write a personalized cover letter for ${userProfile.name} applying for the ${job.title} position at ${job.company}.
      - Use the user's profile information and bio to create a genuine and personal tone.
      - Refer to the specific requirements in the job description.
      - Structure it as a professional cover letter with an introduction, body, and conclusion.
      - Do not include placeholders like "[Your Name]" or "[Date]". Fill them in with the provided details.
      - The output should be only the cover letter text itself.

      User Profile:
      - Name: ${userProfile.name}
      - Email: ${userProfile.email}
      - Phone: ${userProfile.phone}
      - Bio/Summary: ${userProfile.bio}

      Job Details:
      - Title: ${job.title}
      - Company: ${job.company}
      - Description: ${job.description}

      Generate the cover letter now:
    `;
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: prompt,
    });
    if (!response.text) {
        if (response.promptFeedback?.blockReason) {
            throw new Error(`AI request was blocked due to ${response.promptFeedback.blockReason}.`);
        }
        throw new Error("AI returned an empty response when generating the cover letter.");
    }
    return response.text;
  } catch (error) {
    console.error("Error generating cover letter:", error);
    throw new Error("Could not generate cover letter. Please check your API key and try again.");
  }
};

export const generateInterviewQuestions = async (job: Job): Promise<CategorizedQuestions[]> => {
  try {
    const prompt = `
      You are an experienced hiring manager for a top tech company.
      Based on the following job description for a "${job.title}" at "${job.company}", generate a list of 10-12 common interview questions.
      - Categorize the questions into "Behavioral", "Technical", and "Situational".
      - For each question, provide a brief, actionable tip on what the interviewer is looking for in a good answer.
      
      Job Description:
      ---
      ${job.description}
      ---

      Respond with a valid JSON array of objects.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    tip: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!response.text) {
        console.warn("AI response text is empty for generateInterviewQuestions. Returning empty array.");
        return [];
    }
    return parseJsonResponse(response.text);
  } catch (error) {
    console.error("Error generating interview questions:", error);
    throw new Error("Could not generate interview questions. Please check the API response and your key.");
  }
};

export const getSkillsGapAnalysis = async (baseResume: string, jobDescription: string): Promise<SkillAnalysis> => {
  try {
    const prompt = `
      As a career analyst, compare the provided resume against the job description. 
      Identify skills present in the resume that match the job requirements, and identify key skills from the job description that are missing from the resume. 
      Provide actionable suggestions on how to bridge these gaps.
      
      Resume:
      ---
      ${baseResume}
      ---
      
      Job Description:
      ---
      ${jobDescription}
      ---

      Respond with a valid JSON object.
    `;
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: { type: Type.STRING }
          }
        }
      }
    });
    if (!response.text) {
        if (response.promptFeedback?.blockReason) {
            throw new Error(`AI request was blocked due to ${response.promptFeedback.blockReason}.`);
        }
        throw new Error("AI returned an empty response for skills gap analysis.");
    }
    return parseJsonResponse(response.text);
  } catch (error)
 {
    console.error("Error getting skills gap analysis:", error);
    throw new Error("Could not generate skills gap analysis.");
  }
};

export const getInterviewFeedback = async (question: string, userAnswer: string): Promise<InterviewFeedback> => {
  try {
    const prompt = `
      You are a supportive and constructive interview coach.
      The user is practicing for an interview.
      The interview question was: "${question}"
      The user's answer was: "${userAnswer}"

      Please provide feedback on the user's answer. Analyze its structure (e.g., STAR method), clarity, and relevance.
      Offer specific suggestions for improvement.
      Respond with a valid JSON object.
    `;
     const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback: { type: Type.STRING, description: "Overall constructive feedback on the answer." },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of actionable suggestions for improvement." }
          }
        }
      }
    });
    if (!response.text) {
        if (response.promptFeedback?.blockReason) {
            throw new Error(`AI request was blocked due to ${response.promptFeedback.blockReason}.`);
        }
        throw new Error("AI returned an empty response for interview feedback.");
    }
    return parseJsonResponse(response.text);
  } catch (error) {
    console.error("Error getting interview feedback:", error);
    throw new Error("Could not generate interview feedback.");
  }
};

export const getInterviewVideoFeedback = async (question: string, userAnswer: string): Promise<InterviewFeedback> => {
  try {
    const prompt = `
      You are an expert communication coach analyzing a user's video interview performance.
      The interview question was: "${question}"
      The user's transcribed answer was: "${userAnswer}"

      Provide feedback on the answer AND the delivery. 
      Respond with a valid JSON object.

      Instructions:
      1.  Analyze the answer's structure, clarity, and relevance (e.g., STAR method).
      2.  **Simulate** feedback on non-verbal cues. Even though you can't see the video, provide generic but helpful advice about body language and speaking pace based on common best practices.
      3.  Give actionable suggestions for all areas.
    `;
     const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback: { type: Type.STRING, description: "Overall constructive feedback on the answer's content." },
            bodyLanguageFeedback: { type: Type.STRING, description: "Feedback on posture, eye contact, and gestures." },
            pacingFeedback: { type: Type.STRING, description: "Feedback on speaking speed and use of filler words." },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of actionable suggestions for improvement." }
          }
        }
      }
    });
    if (!response.text) {
        if (response.promptFeedback?.blockReason) {
            throw new Error(`AI request was blocked due to ${response.promptFeedback.blockReason}.`);
        }
        throw new Error("AI returned an empty response for video interview feedback.");
    }
    return parseJsonResponse(response.text);
  } catch (error) {
    console.error("Error getting interview video feedback:", error);
    throw new Error("Could not generate interview video feedback.");
  }
};

export const generateFollowUpEmail = async (userProfile: UserProfile, job: Job, interviewerName: string, interviewDate: string, notes: string): Promise<string> => {
    try {
        const prompt = `
            You are a professional communication assistant.
            Write a polite and professional follow-up email for ${userProfile.name} after their interview for the ${job.title} position at ${job.company}.
            
            Key Details:
            - User Name: ${userProfile.name}
            - Job Title: ${job.title}
            - Company: ${job.company}
            - Interviewer's Name: ${interviewerName}
            - Interview Date: ${interviewDate}
            - User's Notes from interview: ${notes}
            
            Instructions:
            1. Keep the tone professional, enthusiastic, and concise.
            2. Express gratitude for the interviewer's time.
            3. Briefly reiterate interest in the role.
            4. If the user provided notes, subtly incorporate one key point to show they were engaged.
            5. The output should be only the email body text, ready to be sent. Do not include a subject line or signature placeholders like "[Your Name]".
        `;
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        if (!response.text) {
            if (response.promptFeedback?.blockReason) {
                throw new Error(`AI request was blocked due to ${response.promptFeedback.blockReason}.`);
            }
            throw new Error("AI returned an empty response when generating the follow-up email.");
        }
        return response.text;
    } catch (error) {
        console.error("Error generating follow-up email:", error);
        throw new Error("Could not generate the follow-up email.");
    }
};

export const generateCompanyBriefing = async (companyName: string): Promise<CompanyBriefing> => {
    try {
        const prompt = `
            As a research analyst, generate a concise briefing for a job candidate about the company "${companyName}".
            Use your search capabilities to find the most recent and relevant information.
            Your response MUST be a single JSON object with the following structure:
            {
              "mission": "A one or two-sentence summary of the company's mission or core business.",
              "recentNews": "A brief paragraph about a recent significant news item, product launch, or announcement.",
              "culture": "A summary of the company's perceived culture, based on employee reviews, their career page, etc.",
              "interviewQuestions": ["A list of potential questions an interviewer might ask about the company."]
            }
            Do not include any text, explanations, or markdown formatting before or after the JSON object.
        `;
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        if (!response.text) {
            if (response.promptFeedback?.blockReason) {
                throw new Error(`AI request was blocked due to ${response.promptFeedback.blockReason}.`);
            }
            throw new Error("AI returned an empty response for company briefing.");
        }
        return parseJsonResponse(response.text);
    } catch (error) {
        console.error("Error generating company briefing:", error);
        throw new Error("Could not generate company briefing. The AI response may not be valid JSON.");
    }
};

export const analyzeOfferAndGenerateScript = async (job: Job, offer: OfferDetails, userResume: string): Promise<NegotiationAnalysis> => {
    try {
        const prompt = `
            You are an expert salary negotiation coach. A user has received a job offer and needs help evaluating it and preparing a counter-offer.
            Use your search capabilities to get real-time market data for this role and location.

            User & Offer Context:
            - Job Title: ${job.title}
            - Company: ${job.company}
            - Location: ${job.location}
            - User's Resume Summary: ${userResume.substring(0, 500)}...
            - Offer Details:
              - Base Salary: ${offer.salary}
              - Bonus: ${offer.bonus}
              - Equity/Other: ${offer.equity}

            Your Task:
            Analyze the offer's competitiveness and generate a script for a counter-offer.
            Return ONLY a JSON object with the following structure:
            {
              "competitiveness": "A brief analysis of the offer (e.g., 'Slightly below market', 'Competitive', 'Strong offer') based on real-time data for this role and location.",
              "recommendedRange": "A data-backed, realistic salary range to propose as a counter-offer (e.g., '$165,000 - $172,000').",
              "script": "A professionally worded script the user can adapt to make their counter-offer, referencing their excitement and market value."
            }
            Do not add any text, explanations, or markdown formatting before or after the JSON object.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });
        if (!response.text) {
            if (response.promptFeedback?.blockReason) {
                throw new Error(`AI request was blocked due to ${response.promptFeedback.blockReason}.`);
            }
            throw new Error("AI returned an empty response when analyzing the offer.");
        }
        return parseJsonResponse(response.text);
    } catch (error) {
        console.error("Error analyzing offer:", error);
        throw new Error("Could not analyze the job offer.");
    }
};

export const findPotentialContacts = async (companyName: string): Promise<PotentialContact[]> => {
    try {
        const prompt = `
            You are a networking assistant. The user wants to find potential contacts at "${companyName}".
            Use your search capabilities to find 3-5 relevant public profiles on professional networking sites (like LinkedIn) for people at this company.
            Prioritize roles like "Hiring Manager", "Recruiter", "Talent Acquisition", or senior roles in relevant departments.
            
            For each contact, find their name, title, public LinkedIn profile URL, and a public email address if available.
            
            Return ONLY a JSON array with objects using the following structure. If a piece of information cannot be found, set the value to an empty string or null.
            [
                {
                    "name": "Jane Doe",
                    "title": "Senior Recruiter",
                    "linkedinUrl": "https://www.linkedin.com/in/janedoe",
                    "email": "jane.doe@example.com"
                }
            ]
            Do not add any text, explanations, or markdown formatting before or after the JSON array.
        `;
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });
        if (!response.text) {
            console.warn("AI response text is empty for findPotentialContacts. Returning empty array.");
            return [];
        }
        return parseJsonResponse(response.text);
    } catch (error) {
        console.error("Error finding contacts:", error);
        throw new Error("Could not find potential contacts at the company.");
    }
};

export const generateOutreachMessage = async (userName: string, contact: PotentialContact, jobTitle: string): Promise<string> => {
    try {
        const prompt = `
            You are a professional communication writer.
            Draft a short, polite, and professional outreach message from "${userName}" to "${contact.name} (${contact.title})".
            The user is interested in the "${jobTitle}" role at their company.
            The goal is to make a connection and express interest, not to demand a job.
            The output should be only the message text itself.
        `;
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        if (!response.text) {
            if (response.promptFeedback?.blockReason) {
                throw new Error(`AI request was blocked due to ${response.promptFeedback.blockReason}.`);
            }
            throw new Error("AI returned an empty response when generating the outreach message.");
        }
        return response.text;
    } catch (error) {
        console.error("Error generating outreach message:", error);
        throw new Error("Could not generate the outreach message.");
    }
};

export const getApplicationInsights = async (job: TrackedJob, userResume: string): Promise<ApplicationInsights> => {
    try {
        const prompt = `
            You are a strategic career advisor. Analyze the provided job application details to generate actionable insights for the user's interview preparation.

            Job Details:
            - Title: ${job.title}
            - Company: ${job.company}
            - Description: ${job.description}

            User's Resume:
            ---
            ${userResume}
            ---

            User's Personal Notes for this Application:
            ---
            ${job.notes || "No notes provided."}
            ---

            Task:
            Based on ALL the information above, provide strategic insights.
            Return a single, valid JSON object with the following structure. Do not add any text or markdown formatting before or after the JSON.
            {
              "strengths": ["A bulleted list of the user's top 3-4 strengths for THIS specific role."],
              "talkingPoints": ["A bulleted list of 3-4 key points the user should proactively mention in the interview to align with the job description."],
              "redFlags": ["A bulleted list of 2-3 potential 'red flags' or weaknesses to prepare for (e.g., a missing skill, a potential culture mismatch to ask about)."]
            }
        `;
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                        talkingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                        redFlags: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
        if (!response.text) {
            if (response.promptFeedback?.blockReason) {
                throw new Error(`AI request was blocked due to ${response.promptFeedback.blockReason}.`);
            }
            throw new Error("AI returned an empty response when generating application insights.");
        }
        return parseJsonResponse(response.text);
    } catch (error) {
        console.error("Error generating application insights:", error);
        throw new Error("Could not generate insights for this application.");
    }
};

export const generateCareerPathPlan = async (currentRole: string, goalRole: string): Promise<CareerPathPlan> => {
  try {
    const prompt = `
      You are a seasoned career strategist and mentor. A user wants a strategic plan to get from their current role to their goal role.

      User's Current Role: ${currentRole}
      User's Goal Role: ${goalRole}

      Task:
      Generate a comprehensive, actionable career path plan.
      Use your search capabilities to understand the typical skills and experience needed for the goal role.
      Return ONLY a JSON object with the following structure:
      {
        "currentRole": "string",
        "goalRole": "string",
        "keySkillsToDevelop": ["A bulleted list of the most critical technical and soft skills the user needs to acquire."],
        "projectIdeas": ["A bulleted list of 2-3 specific project ideas for a portfolio that would demonstrate competence for the goal role."],
        "bridgeRoles": ["A list of 1-2 intermediate job titles the user could target to step towards their ultimate goal."],
        "timeline": "A brief, realistic timeline (e.g., '2-4 years') with a short explanation of the milestones."
      }
      Do not add any text, explanations, or markdown formatting before or after the JSON object.
    `;
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });
    if (!response.text) {
        if (response.promptFeedback?.blockReason) {
            throw new Error(`AI request was blocked due to ${response.promptFeedback.blockReason}.`);
        }
        throw new Error("AI returned an empty response for career path plan.");
    }
    return parseJsonResponse(response.text);
  } catch (error) {
    console.error("Error generating career path plan:", error);
    throw new Error("Could not generate the career path plan.");
  }
};

export const analyzeApplicationForm = async (job: Job, userProfile: UserProfile): Promise<ParsedApplicationForm> => {
    try {
        const prompt = `
            You are an intelligent job application form assistant.
            Your task is to analyze the live job application page at the provided URL and pre-fill the form based on the user's profile.

            URL to Analyze: ${job.sourceUrl}

            User Profile Data:
            - Full Name: ${userProfile.name}
            - Email: ${userProfile.email}
            - Phone: ${userProfile.phone}
            - LinkedIn: ${userProfile.linkedinUrl}
            - GitHub: ${userProfile.githubUrl}
            - Portfolio: ${userProfile.portfolioUrl}
            - Resume Summary: ${userProfile.bio}

            Job Context: Applying for ${job.title} at ${job.company}.

            Instructions:
            1.  Use search to access the URL and identify all input fields in the application form.
            2.  **Basic Info:** Map the user's profile data to standard fields (Name, Email, Phone, LinkedIn, etc.). For a resume upload field, indicate the user's resume should be attached.
            3.  **Custom Questions:** Identify any open-ended or custom questions (e.g., "Why do you want to work here?", "Describe your experience with X", "What are your salary expectations?").
            4.  **Generate Answers:** For each custom question, generate a concise, professional answer tailored to the job and user profile.
            5.  **Format Output:** Return ONLY a single, valid JSON object with two keys: "basicInfo" and "customQuestions". Each key should contain an array of field objects. Do not add any text or markdown formatting before or after the JSON.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });
        
        if (!response.text) {
            if (response.promptFeedback?.blockReason) {
                throw new Error(`AI request was blocked due to ${response.promptFeedback.blockReason}.`);
            }
            throw new Error("AI returned an empty response when analyzing the application form.");
        }
        
        const parsedData = parseJsonResponse(response.text);
        
        // Ensure the response has the correct shape
        if (!parsedData || !Array.isArray(parsedData.basicInfo) || !Array.isArray(parsedData.customQuestions)) {
          throw new Error("AI returned data in an unexpected format.");
        }

        return parsedData;

    } catch (error) {
        console.error("Error analyzing application form:", error);
        throw new Error("Could not analyze the application form. The AI may be unable to access the URL or parse its content.");
    }
};
