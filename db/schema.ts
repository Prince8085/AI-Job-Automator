import { pgTable, text, varchar, timestamp, json, boolean, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Enums
export const applicationStatusEnum = pgEnum('application_status', [
  'Saved',
  'Applied', 
  'Interviewing',
  'Offer',
  'Rejected'
]);

// User Profiles Table
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  bio: text('bio'),
  baseResume: text('base_resume'),
  profilePictureUrl: text('profile_picture_url'),
  coverPhotoUrl: text('cover_photo_url'),
  linkedinUrl: text('linkedin_url'),
  githubUrl: text('github_url'),
  portfolioUrl: text('portfolio_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Jobs Table
export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  description: text('description').notNull(),
  tags: json('tags').$type<string[]>().notNull(),
  salary: varchar('salary', { length: 100 }),
  postedDate: varchar('posted_date', { length: 50 }),
  sourceUrl: text('source_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tracked Jobs Table (User's job applications)
export const trackedJobs = pgTable('tracked_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  jobId: uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  status: applicationStatusEnum('status').notNull().default('Saved'),
  notes: text('notes'),
  tailoredResume: text('tailored_resume'),
  tailoredCoverLetter: text('tailored_cover_letter'),
  isWishlisted: boolean('is_wishlisted').default(false),
  
  // JSON fields for complex data
  offerDetails: json('offer_details').$type<{
    salary: string;
    bonus: string;
    equity: string;
  }>(),
  
  applicationInsights: json('application_insights').$type<{
    strengths: string[];
    talkingPoints: string[];
    redFlags: string[];
  }>(),
  
  structuredResume: json('structured_resume').$type<{
    contact: {
      name: string;
      email: string;
      phone: string;
      linkedin: string;
      github: string;
      portfolio: string;
      location: string;
    };
    summary: string;
    experience: Array<{
      title: string;
      company: string;
      dates: string;
      location: string;
      points: string[];
    }>;
    education: Array<{
      degree: string;
      university: string;
      dates: string;
    }>;
    projects: Array<{
      name: string;
      points: string[];
    }>;
    skills: Array<{
      category: string;
      list: string;
    }>;
  }>(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Interview Questions Table
export const interviewQuestions = pgTable('interview_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 100 }).notNull(),
  question: text('question').notNull(),
  tip: text('tip'),
  userAnswer: text('user_answer'),
  feedback: json('feedback').$type<{
    feedback: string;
    suggestions: string[];
    bodyLanguageFeedback?: string;
    pacingFeedback?: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Company Briefings Table
export const companyBriefings = pgTable('company_briefings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  mission: text('mission'),
  recentNews: text('recent_news'),
  culture: text('culture'),
  interviewQuestions: json('interview_questions').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Career Path Plans Table
export const careerPathPlans = pgTable('career_path_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  currentRole: varchar('current_role', { length: 255 }).notNull(),
  goalRole: varchar('goal_role', { length: 255 }).notNull(),
  keySkillsToDevelop: json('key_skills_to_develop').$type<string[]>(),
  projectIdeas: json('project_ideas').$type<string[]>(),
  bridgeRoles: json('bridge_roles').$type<string[]>(),
  timeline: text('timeline'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Potential Contacts Table
export const potentialContacts = pgTable('potential_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => userProfiles.id, { onDelete: 'cascade' }),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }),
  linkedinUrl: text('linkedin_url'),
  email: varchar('email', { length: 255 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserProfileSchema = createInsertSchema(userProfiles);
export const selectUserProfileSchema = createSelectSchema(userProfiles);

export const insertJobSchema = createInsertSchema(jobs);
export const selectJobSchema = createSelectSchema(jobs);

export const insertTrackedJobSchema = createInsertSchema(trackedJobs);
export const selectTrackedJobSchema = createSelectSchema(trackedJobs);

export const insertInterviewQuestionSchema = createInsertSchema(interviewQuestions);
export const selectInterviewQuestionSchema = createSelectSchema(interviewQuestions);

export const insertCompanyBriefingSchema = createInsertSchema(companyBriefings);
export const selectCompanyBriefingSchema = createSelectSchema(companyBriefings);

export const insertCareerPathPlanSchema = createInsertSchema(careerPathPlans);
export const selectCareerPathPlanSchema = createSelectSchema(careerPathPlans);

export const insertPotentialContactSchema = createInsertSchema(potentialContacts);
export const selectPotentialContactSchema = createSelectSchema(potentialContacts);

// Type exports
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

export type TrackedJob = typeof trackedJobs.$inferSelect;
export type NewTrackedJob = typeof trackedJobs.$inferInsert;

export type InterviewQuestion = typeof interviewQuestions.$inferSelect;
export type NewInterviewQuestion = typeof interviewQuestions.$inferInsert;

export type CompanyBriefing = typeof companyBriefings.$inferSelect;
export type NewCompanyBriefing = typeof companyBriefings.$inferInsert;

export type CareerPathPlan = typeof careerPathPlans.$inferSelect;
export type NewCareerPathPlan = typeof careerPathPlans.$inferInsert;

export type PotentialContact = typeof potentialContacts.$inferSelect;
export type NewPotentialContact = typeof potentialContacts.$inferInsert;