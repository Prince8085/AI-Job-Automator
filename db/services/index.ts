// Database Services
export { UserService } from './userService';
export { JobService } from './jobService';
export { InterviewService } from './interviewService';

// Database connection and schema
export { db } from '../connection';
export {
  userProfiles,
  jobs,
  trackedJobs,
  interviewQuestions,
  companyBriefings,
  careerPathPlans,
  potentialContacts,
  applicationStatusEnum,
  insertUserProfileSchema,
  selectUserProfileSchema,
  insertJobSchema,
  selectJobSchema,
  insertTrackedJobSchema,
  selectTrackedJobSchema,
  insertInterviewQuestionSchema,
  selectInterviewQuestionSchema,
  insertCompanyBriefingSchema,
  selectCompanyBriefingSchema,
  insertCareerPathPlanSchema,
  selectCareerPathPlanSchema,
  insertPotentialContactSchema,
  selectPotentialContactSchema
} from '../schema';

// Database types (from schema)
export type {
  UserProfile as DbUserProfile,
  NewUserProfile as DbNewUserProfile,
  Job as DbJob,
  NewJob as DbNewJob,
  TrackedJob as DbTrackedJob,
  NewTrackedJob as DbNewTrackedJob,
  InterviewQuestion as DbInterviewQuestion,
  NewInterviewQuestion as DbNewInterviewQuestion,
  CompanyBriefing as DbCompanyBriefing,
  NewCompanyBriefing as DbNewCompanyBriefing,
  CareerPathPlan as DbCareerPathPlan,
  NewCareerPathPlan as DbNewCareerPathPlan,
  PotentialContact as DbPotentialContact,
  NewPotentialContact as DbNewPotentialContact
} from '../schema';

// Application types
export type * from '../../types';