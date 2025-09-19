import { eq } from 'drizzle-orm';
import { db } from '../connection';
import { userProfiles, insertUserProfileSchema, selectUserProfileSchema } from '../schema';
import type { UserProfile } from '../../types';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

export class UserService {
  // Create a new user profile
  static async createUserProfile(userData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) {
    if (isBrowser) {
      // Mock implementation for browser context
      const mockUser: UserProfile = {
        ...userData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      console.log('Mock user created:', mockUser);
      return mockUser;
    }

    try {
      const validatedData = insertUserProfileSchema.parse(userData);
      const [newUser] = await db.insert(userProfiles).values(validatedData).returning();
      return newUser;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw new Error('Failed to create user profile');
    }
  }

  // Get user profile by clerk user ID
  static async getUserByClerkId(clerkUserId: string) {
    if (isBrowser) {
      console.log('Mock getUserByClerkId called with:', clerkUserId);
      return null; // Mock: no user found
    }

    try {
      const [user] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.clerkUserId, clerkUserId))
        .limit(1);
      return user || null;
    } catch (error) {
      console.error('Error fetching user by clerk ID:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  // Get user profile by ID
  static async getUserById(id: string) {
    if (isBrowser) {
      console.log('Mock getUserById called with:', id);
      return null; // Mock: no user found
    }

    try {
      const [user] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.id, id))
        .limit(1);
      return user || null;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  // Update user profile
  static async updateUserProfile(id: string, updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) {
    if (isBrowser) {
      const mockUpdatedUser = { id, ...updates, updatedAt: new Date() };
      console.log('Mock updateUserProfile called:', mockUpdatedUser);
      return mockUpdatedUser as UserProfile;
    }

    try {
      const updateData = { ...updates, updatedAt: new Date() };
      const [updatedUser] = await db
        .update(userProfiles)
        .set(updateData)
        .where(eq(userProfiles.id, id))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  // Delete user profile
  static async deleteUserProfile(id: string) {
    if (isBrowser) {
      console.log('Mock deleteUserProfile called with:', id);
      return true; // Mock: deletion successful
    }

    try {
      await db.delete(userProfiles).where(eq(userProfiles.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting user profile:', error);
      throw new Error('Failed to delete user profile');
    }
  }

  // Get or create user profile (useful for authentication flow)
  static async getOrCreateUser(clerkUserId: string, userData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      let user = await this.getUserByClerkId(clerkUserId);
      
      if (!user) {
        user = await this.createUserProfile({ ...userData, clerkUserId });
      }
      
      return user;
    } catch (error) {
      console.error('Error in getOrCreateUser:', error);
      throw new Error('Failed to get or create user profile');
    }
  }
}