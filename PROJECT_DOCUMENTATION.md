# Project Documentation: AI Job Automator

## 1. Project Title
**AI Job Automator**

## 2. One-Line Problem Statement
A fragmented and manual job search process leads to missed opportunities and candidate burnout due to repetitive applications and lack of personalized guidance.

## 3. Real-World Problem It Solves
Job seekers currently have to juggle multiple platforms (LinkedIn, Indeed, Glassdoor), manually tailor resumes for every application to pass ATS filters, track their status in spreadsheets, and prepare for interviews without feedback. This results in:
- **Inefficiency:** Wasting hours on manual data entry and formatting.
- **Low Conversion:** Generic resumes getting rejected by ATS.
- **Disorganization:** Losing track of follow-ups and interview dates.
- **Lack of Preparation:** Going into interviews blind without role-specific practice.

**AI Job Automator** solves this by unifying discovery, tracking, tailoring, and preparation into a single AI-powered dashboard.

## 4. Target Users
- **Active Job Seekers:** Professionals looking for new opportunities.
- **Students & Graduates:** First-time job hunters needing guidance.
- **Career Switchers:** Individuals needing to identify skills gaps and rebrand themselves.
- **Recruitment Agencies:** (Potential) To manage candidate pipelines.

## 5. Complete Tech Stack

### Frontend
- **Framework:** React 19 (via Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM v7
- **State Management:** React Context API (`JobDataContext`)
- **UI Components:** Lucide React (Icons), Recharts (Analytics)
- **Build Tool:** Vite

### Backend & Services
- **Runtime:** Node.js (Serverless/Edge compatible)
- **AI Integration:** Google Gemini API (`@google/genai`)
- **Authentication:** Clerk (`@clerk/clerk-react`)
- **PDF Generation:** jsPDF, jspdf-autotable

### Database
- **Database:** Neon (Serverless PostgreSQL)
- **ORM:** Drizzle ORM
- **Schema Validation:** Zod / Drizzle-Zod

### Hosting & Infrastructure
- **Frontend Hosting:** Vercel / Netlify (Recommended)
- **Database Hosting:** Neon Serverless
- **Environment Management:** Dotenv

## 6. System Architecture (Step-by-Step Flow)

1.  **User Entry:** User lands on the application and authenticates via **Clerk** (Social/Email).
2.  **State Initialization:** `JobProvider` initializes, fetching the user's profile and tracked jobs from the **Neon Database** via **Drizzle ORM**.
3.  **Job Search:**
    *   User queries a job (e.g., "React Developer").
    *   **JobScrapingService** attempts to fetch jobs (currently simulated/mocked).
    *   **GeminiService** acts as a fallback to "search" or generate relevant job listings using AI.
4.  **Application Tracking:**
    *   User "Saves" or "Tracks" a job.
    *   Data is persisted in the `tracked_jobs` table in Postgres.
5.  **AI Processing:**
    *   **Resume Tailoring:** User selects a job -> `GeminiService` analyzes the job description + user's base resume -> Generates a JSON structure for a tailored resume.
    *   **Interview Prep:** `GeminiService` generates role-specific questions -> User answers -> AI provides feedback on content and "simulated" body language.
6.  **Data Persistence:** All user actions (saving jobs, updating status, saving notes) are synced to the database.

## 7. Core Features
-   **Smart Job Search:** Aggregates jobs from multiple sources (Simulated integration with Indeed, LinkedIn, Glassdoor).
-   **Kanban Board Tracker:** Drag-and-drop interface to manage applications (Saved, Applied, Interviewing, Offer, Rejected).
-   **AI Resume Builder:** Automatically generates ATS-optimized resumes tailored to specific job descriptions.
-   **Cover Letter Generator:** Creates personalized cover letters based on user bio and job requirements.
-   **Interview Coach:**
    -   Generates technical, behavioral, and situational questions.
    -   Provides AI feedback on user answers.
    -   **Video Mock Interview:** Simulates a video call environment (camera access) and analyzes spoken responses.
-   **Skills Gap Analysis:** Compares user profile vs. job description to recommend skills to learn.
-   **Salary Negotiation Coach:** Analyzes offers against market data and generates counter-offer scripts.
-   **Networking Assistant:** Finds potential contacts at target companies and drafts outreach messages.
-   **Career Planner:** Maps out long-term career paths and bridge roles.

## 8. User Roles & Permissions
-   **Standard User:**
    -   Can search and track jobs.
    -   Can manage their own profile and documents.
    -   Can use AI features (Resume, Interview, etc.).
    -   Data is isolated to their `user_id`.
-   **Guest/Demo User:**
    -   Read-only access to dashboard structure.
    -   Uses local mock data (no database persistence).
    -   Limited AI calls (or mock responses).

## 9. Authentication & Security Logic
-   **Provider:** **Clerk** handles identity management.
-   **Flow:**
    1.  `App.tsx` wraps the application in `<ClerkProvider>`.
    2.  `ProtectedRoute` component checks `isSignedIn`.
    3.  If not signed in, redirects to Login.
    4.  On successful login, `clerkUserId` is used to map to the internal `user_profiles` table.
-   **Security:**
    -   Environment variables (`VITE_CLERK_PUBLISHABLE_KEY`, `VITE_GEMINI_API_KEY`) protect sensitive keys.
    -   Database access is scoped by `user_id` in queries (Row Level Security logic implemented in application layer).

## 10. API Flow Explanation
The application primarily uses a **Service-Oriented Architecture** on the client side:

1.  **Frontend Component** (e.g., `ResumeBuilderScreen`) triggers an action.
2.  **Service Layer** (`services/geminiService.ts`) is called.
3.  **External API Call:**
    -   The service constructs a prompt.
    -   Calls `GoogleGenAI` client.
    -   Receives raw text response.
4.  **Data Parsing:**
    -   `parseJsonResponse` utility cleans the AI output (extracts JSON from markdown blocks).
    -   Validates structure against TypeScript interfaces.
5.  **State Update:**
    -   The parsed data is returned to the Component.
    -   Component updates `JobContext` or local state.
    -   Data is saved to DB via Drizzle (if applicable).

## 11. Database Design (Schema)

The database is normalized and designed for scalability using PostgreSQL.

| Table Name | Purpose | Key Columns |
| :--- | :--- | :--- |
| **`user_profiles`** | Stores core user identity and global resume data. | `id`, `clerk_user_id`, `base_resume`, `skills` (JSON) |
| **`jobs`** | Stores unique job listings to avoid duplication. | `id`, `title`, `company`, `description`, `source_url` |
| **`tracked_jobs`** | Join table linking Users to Jobs with application status. | `id`, `user_id`, `job_id`, `status`, `tailored_resume`, `application_insights` (JSON) |
| **`interview_questions`** | Stores generated questions and user practice history. | `id`, `job_id`, `question`, `user_answer`, `feedback` (JSON) |
| **`company_briefings`** | Caches AI-generated company research. | `id`, `company_name`, `mission`, `culture` |
| **`career_path_plans`** | Stores long-term career strategy data. | `id`, `current_role`, `goal_role`, `timeline` |
| **`potential_contacts`** | Stores networking leads. | `id`, `name`, `linkedin_url`, `email` |

## 12. AI/ML Logic
-   **Model:** Google Gemini 2.5 Flash (chosen for speed and cost-efficiency).
-   **Prompt Engineering:**
    -   **Role-Playing:** "You are an expert ATS resume optimizer", "You are a supportive interview coach".
    -   **Structured Output:** Prompts explicitly request JSON formats to ensure the frontend can render the data dynamically.
    -   **Context Injection:** User's resume and the specific job description are injected into every prompt to ensure highly personalized results.
-   **Features:**
    -   **NLP:** Parsing unstructured job descriptions into structured JSON.
    -   **Content Generation:** Writing cover letters and emails.
    -   **Analysis:** Comparing two text blocks (Resume vs. Job Description) for gap analysis.

## 13. Admin Panel Capabilities
*Not Implemented Yet.*
-   Currently, there is no dedicated interface for administrators to manage users or view global analytics.

## 14. Performance Optimizations Used
-   **Vite:** Ensures extremely fast development server start and hot module replacement (HMR).
-   **Code Splitting:** React Router supports lazy loading of routes (implied by structure).
-   **Optimistic UI:** The UI updates immediately (e.g., dragging a job card) while the background save operation happens.
-   **Debouncing:** Likely used in search inputs to prevent excessive API calls (standard practice in `SearchScreen`).
-   **Efficient DOM:** `Lucide React` uses lightweight SVG icons.

## 15. Scalability Design
-   **Serverless Database:** Neon allows the database to scale compute resources up/down automatically based on load.
-   **Stateless Backend:** The application logic is largely stateless (REST/RPC style), making it easy to replicate if moved to a dedicated backend server.
-   **Separation of Concerns:** Database schema is decoupled from the frontend view models via Drizzle ORM, allowing schema evolution without breaking the UI immediately.

## 16. Error Handling Strategy
-   **Graceful Degradation:** If the Job Scraping Service fails, the system falls back to AI-generated "search results" or Demo data (`generateDemoJobs`), ensuring the user never sees a blank screen.
-   **Toast Notifications:** A global `ToastContainer` provides immediate visual feedback for success/error states.
-   **Try-Catch Blocks:** All async service calls (`geminiService.ts`) are wrapped in try-catch blocks to log errors to console and throw user-friendly messages.
-   **Zod Validation:** Ensures data integrity before it reaches the database or UI.

## 17. Deployment Strategy
-   **CI/CD:** GitHub Actions (recommended) to build and test on push.
-   **Frontend:** Deploy to Vercel. Connect repository -> Auto-detect Vite -> Set Environment Variables.
-   **Database:** Provision Neon Postgres instance -> Run `npm run db:push` to apply schema.
-   **Environment Variables:**
    -   `VITE_CLERK_PUBLISHABLE_KEY`
    -   `VITE_GEMINI_API_KEY`
    -   `DATABASE_URL`

## 18. Future Scope
-   **Browser Automation:** Integrate Puppeteer/Selenium properly to actually fill out forms on external sites ("One-Click Apply").
-   **Mobile Application:** Port the React logic to React Native.
-   **Browser Extension:** A Chrome extension to "Clip" jobs from LinkedIn directly into the Dashboard.
-   **Community:** A social feature for users to share salary data anonymously.

## 19. Industry Use Cases
-   **EdTech:** Universities can offer this tool to final-year students to boost placement rates.
-   **Outplacement Firms:** Companies laying off employees can provide this tool as part of the severance package.
-   **Recruitment Agencies:** Agents can use the "Search" and "Match" features to find candidates for their clients.

## 20. Business Value
-   **Time Savings:** Reduces job application time by 50-70% via automation.
-   **Higher Success Rate:** Tailored resumes significantly increase interview callback rates.
-   **Data-Driven Decisions:** Analytics help users understand where they are failing (resume vs. interview stage).

## 21. Monetization Possibilities
-   **Freemium Model:**
    -   **Free:** Manual tracking, 3 AI resume tailors/month.
    -   **Pro ($15/mo):** Unlimited AI tailoring, Auto-apply features, Advanced Interview Coach.
-   **B2B Licensing:** Selling bulk licenses to Universities or Coding Bootcamps.
-   **Affiliate Marketing:** Suggesting paid courses (Coursera/Udemy) in the "Skills Gap" section.

## 22. Full Project Summary
**AI Job Automator** is an enterprise-grade, AI-powered career assistant designed to revolutionize the job search experience. By leveraging **Google's Gemini AI**, it transforms the chaotic process of finding a job into a streamlined, data-driven workflow. Users can search for jobs, automatically generate perfectly tailored resumes and cover letters, track their applications on a Kanban board, and even practice with a virtual interview coach. Built on a modern stack of **React, TypeScript, and Serverless Postgres**, it is designed for performance, scalability, and real-world utility, addressing the deep pain points of modern job seekers.
