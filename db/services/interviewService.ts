import { eq, and, desc } from 'drizzle-orm';
import { db } from '../connection';
import { interviewQuestions, insertInterviewQuestionSchema } from '../schema';
import type { InterviewQuestion } from '../../types';

export class InterviewService {
  // Create interview questions for a job
  static async createInterviewQuestions(questionsData: Omit<InterviewQuestion, 'id' | 'createdAt' | 'updatedAt'>[]) {
    try {
      const validatedQuestions = questionsData.map(q => insertInterviewQuestionSchema.parse(q));
      const newQuestions = await db.insert(interviewQuestions).values(validatedQuestions).returning();
      return newQuestions;
    } catch (error) {
      console.error('Error creating interview questions:', error);
      throw new Error('Failed to create interview questions');
    }
  }

  // Get interview questions for a specific job and user
  static async getInterviewQuestions(userId: string, jobId: string, category?: string) {
    try {
      let query = db
        .select()
        .from(interviewQuestions)
        .where(and(
          eq(interviewQuestions.userId, userId),
          eq(interviewQuestions.jobId, jobId)
        ));

      if (category) {
        query = query.where(and(
          eq(interviewQuestions.userId, userId),
          eq(interviewQuestions.jobId, jobId),
          eq(interviewQuestions.category, category)
        ));
      }

      query = query.orderBy(desc(interviewQuestions.createdAt));

      const questions = await query;
      return questions;
    } catch (error) {
      console.error('Error fetching interview questions:', error);
      throw new Error('Failed to fetch interview questions');
    }
  }

  // Get all interview questions for a user (across all jobs)
  static async getUserInterviewQuestions(userId: string, limit?: number) {
    try {
      let query = db
        .select()
        .from(interviewQuestions)
        .where(eq(interviewQuestions.userId, userId))
        .orderBy(desc(interviewQuestions.createdAt));

      if (limit) {
        query = query.limit(limit);
      }

      const questions = await query;
      return questions;
    } catch (error) {
      console.error('Error fetching user interview questions:', error);
      throw new Error('Failed to fetch user interview questions');
    }
  }

  // Update interview question
  static async updateInterviewQuestion(id: string, updates: Partial<Omit<InterviewQuestion, 'id' | 'createdAt'>>) {
    try {
      const updateData = { ...updates, updatedAt: new Date() };
      const [updatedQuestion] = await db
        .update(interviewQuestions)
        .set(updateData)
        .where(eq(interviewQuestions.id, id))
        .returning();
      return updatedQuestion;
    } catch (error) {
      console.error('Error updating interview question:', error);
      throw new Error('Failed to update interview question');
    }
  }

  // Delete interview question
  static async deleteInterviewQuestion(id: string) {
    try {
      await db.delete(interviewQuestions).where(eq(interviewQuestions.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting interview question:', error);
      throw new Error('Failed to delete interview question');
    }
  }

  // Delete all interview questions for a job
  static async deleteJobInterviewQuestions(userId: string, jobId: string) {
    try {
      await db
        .delete(interviewQuestions)
        .where(and(
          eq(interviewQuestions.userId, userId),
          eq(interviewQuestions.jobId, jobId)
        ));
      return true;
    } catch (error) {
      console.error('Error deleting job interview questions:', error);
      throw new Error('Failed to delete job interview questions');
    }
  }

  // Get questions by category for a specific job
  static async getQuestionsByCategory(userId: string, jobId: string) {
    try {
      const questions = await this.getInterviewQuestions(userId, jobId);
      
      // Group questions by category
      const categorizedQuestions = questions.reduce((acc, question) => {
        const category = question.category || 'general';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(question);
        return acc;
      }, {} as Record<string, typeof questions>);

      return categorizedQuestions;
    } catch (error) {
      console.error('Error getting questions by category:', error);
      throw new Error('Failed to get questions by category');
    }
  }
}