import { eq, and, desc, ilike } from 'drizzle-orm';
import { db } from '../connection';
import { jobs, trackedJobs, insertJobSchema, insertTrackedJobSchema } from '../schema';
import type { Job } from '../../types';
import { ApplicationStatus } from '../../types';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const isValidUuid = (id?: string): boolean => typeof id === 'string' && UUID_REGEX.test(id);

export class JobService {
  // Create a new job
  static async createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const validatedData = insertJobSchema.parse(jobData);
      const [newJob] = await db.insert(jobs).values(validatedData).returning();
      return newJob;
    } catch (error) {
      console.error('Error creating job:', error);
      throw new Error('Failed to create job');
    }
  }

  // Get job by ID
  static async getJobById(id: string) {
    try {
      if (!isValidUuid(id)) {
        return null;
      }
      const [job] = await db
        .select()
        .from(jobs)
        .where(eq(jobs.id, id))
        .limit(1);
      return job || null;
    } catch (error) {
      console.error('Error fetching job by ID:', error);
      return null;
    }
  }

  // Search jobs with filters and pagination
  static async searchJobs(filters: {
    title?: string;
    company?: string;
    location?: string;
    jobType?: string;
    experienceLevel?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      // Set default pagination limits for performance
      const limit = Math.min(filters.limit || 20, 100); // Max 100 per request
      const offset = filters.offset || 0;
      
      let query = db.select().from(jobs);
      
      // Apply filters
      const conditions = [];
      if (filters.title) {
        conditions.push(ilike(jobs.title, `%${filters.title}%`));
      }
      if (filters.company) {
        conditions.push(ilike(jobs.company, `%${filters.company}%`));
      }
      if (filters.location) {
        conditions.push(ilike(jobs.location, `%${filters.location}%`));
      }
      if (filters.jobType) {
        conditions.push(eq(jobs.jobType, filters.jobType));
      }
      if (filters.experienceLevel) {
        conditions.push(eq(jobs.experienceLevel, filters.experienceLevel));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting and pagination
      query = query.orderBy(desc(jobs.createdAt));
      query = query.limit(limit).offset(offset);

      const jobResults = await query;
      return jobResults;
    } catch (error) {
      console.error('Error searching jobs:', error);
      throw new Error('Failed to search jobs');
    }
  }

  // Update job
  static async updateJob(id: string, updates: Partial<Omit<Job, 'id' | 'createdAt'>>) {
    try {
      const updateData = { ...updates, updatedAt: new Date() };
      const [updatedJob] = await db
        .update(jobs)
        .set(updateData)
        .where(eq(jobs.id, id))
        .returning();
      return updatedJob;
    } catch (error) {
      console.error('Error updating job:', error);
      throw new Error('Failed to update job');
    }
  }

  // Delete job
  static async deleteJob(id: string) {
    try {
      await db.delete(jobs).where(eq(jobs.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting job:', error);
      throw new Error('Failed to delete job');
    }
  }

  // Track a job for a user
  static async trackJob(
    userId: string,
    jobId: string,
    status: ApplicationStatus = ApplicationStatus.SAVED
  ) {
    try {
      const trackedJobData = {
        userId,
        jobId,
        status,
      };

      const validatedData = insertTrackedJobSchema.parse(trackedJobData);
      const [trackedJob] = await db.insert(trackedJobs).values(validatedData).returning();
      return trackedJob;
    } catch (error) {
      console.error('Error tracking job:', error);
      throw new Error('Failed to track job');
    }
  }

  // Get tracked jobs for a user with pagination
  static async getTrackedJobs(userId: string, status?: ApplicationStatus, limit: number = 50, offset: number = 0) {
    try {
      // Enforce reasonable limits to prevent performance issues
      const safeLimit = Math.min(limit, 100);
      
      let query = db
        .select({
          trackedJob: trackedJobs,
          job: jobs,
        })
        .from(trackedJobs)
        .innerJoin(jobs, eq(trackedJobs.jobId, jobs.id));

      if (status) {
        query = query.where(and(
          eq(trackedJobs.userId, userId),
          eq(trackedJobs.status, status)
        ));
      } else {
        query = query.where(eq(trackedJobs.userId, userId));
      }

      query = query.orderBy(desc(trackedJobs.createdAt))
        .limit(safeLimit)
        .offset(offset);

      const results = await query;
      return results;
    } catch (error) {
      console.error('Error fetching tracked jobs:', error);
      throw new Error('Failed to fetch tracked jobs');
    }
  }

  // Update tracked job status
  static async updateTrackedJobStatus(userId: string, jobId: string, status: ApplicationStatus, notes?: string) {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };
      
      if (notes) {
        updateData.notes = notes;
      }

      const [updatedTrackedJob] = await db
        .update(trackedJobs)
        .set(updateData)
        .where(and(
          eq(trackedJobs.userId, userId),
          eq(trackedJobs.jobId, jobId)
        ))
        .returning();
      
      return updatedTrackedJob;
    } catch (error) {
      console.error('Error updating tracked job status:', error);
      throw new Error('Failed to update tracked job status');
    }
  }

  // Remove tracked job
  static async untrackJob(userId: string, jobId: string) {
    try {
      await db
        .delete(trackedJobs)
        .where(and(
          eq(trackedJobs.userId, userId),
          eq(trackedJobs.jobId, jobId)
        ));
      return true;
    } catch (error) {
      console.error('Error untracking job:', error);
      throw new Error('Failed to untrack job');
    }
  }
}