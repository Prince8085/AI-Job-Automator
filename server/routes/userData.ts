/**
 * User Data Sync Routes
 * Cross-device persistence for profiles, tracked jobs and wishlists.
 * The client stores complex job payloads (arbitrary string IDs) in the
 * user_profiles.sync_data JSON column, avoiding string-id ↔ UUID mapping.
 */

import express, { Request, Response } from 'express';
import { UserService } from '../../db/services/userService';
import { ResponseFormatter } from '../utils/errors';

const PROFILE_FIELDS = [
  'name',
  'email',
  'phone',
  'bio',
  'baseResume',
  'profilePictureUrl',
  'coverPhotoUrl',
  'linkedinUrl',
  'githubUrl',
  'portfolioUrl',
  'location',
  'skills',
  'experience',
] as const;

export const createUserDataRoutes = (app: express.Application) => {
  /**
   * GET /api/user/:clerkId/sync
   * Returns the user profile plus tracked jobs / wishlist.
   * Creates a profile row on first sync.
   */
  app.get('/api/user/:clerkId/sync', async (req: Request, res: Response) => {
    const { clerkId } = req.params;

    if (!clerkId || typeof clerkId !== 'string' || clerkId.trim().length < 3) {
      return res.status(400).json(
        ResponseFormatter.error(new Error('Valid clerk user ID is required'))
      );
    }

    try {
      let user = await UserService.getUserByClerkId(clerkId);

      if (!user) {
        user = await UserService.createUserProfile({
          clerkUserId: clerkId,
          name: 'New User',
          email: `${clerkId.slice(0, 40)}@placeholder.local`,
        } as any);
      }

      const syncData = (user as any).syncData || {};

      return res.status(200).json(
        ResponseFormatter.success(
          {
            profile: user,
            trackedJobs: syncData.trackedJobs || [],
            wishlistedJobs: syncData.wishlistedJobs || [],
          },
          'User data synced'
        )
      );
    } catch (error) {
      console.error('❌ User sync fetch error:', error);
      return res.status(500).json(
        ResponseFormatter.error(
          error instanceof Error ? error : new Error('Failed to sync user data')
        )
      );
    }
  });

  /**
   * PUT /api/user/:clerkId/sync
   * Upserts the profile and replaces tracked jobs / wishlist payloads.
   */
  app.put('/api/user/:clerkId/sync', async (req: Request, res: Response) => {
    const { clerkId } = req.params;
    const { profile, trackedJobs, wishlistedJobs } = req.body || {};

    if (!clerkId || typeof clerkId !== 'string' || clerkId.trim().length < 3) {
      return res.status(400).json(
        ResponseFormatter.error(new Error('Valid clerk user ID is required'))
      );
    }

    try {
      let user = await UserService.getUserByClerkId(clerkId);

      if (!user) {
        user = await UserService.createUserProfile({
          clerkUserId: clerkId,
          name: profile?.name || 'New User',
          email: profile?.email || `${clerkId.slice(0, 40)}@placeholder.local`,
        } as any);
      }

      const currentSync = (user as any).syncData || {};

      const updates: Record<string, unknown> = { updatedAt: new Date() };

      if (profile && typeof profile === 'object') {
        for (const field of PROFILE_FIELDS) {
          if (profile[field] !== undefined && profile[field] !== null) {
            updates[field] = profile[field];
          }
        }
      }

      updates.syncData = {
        trackedJobs:
          trackedJobs !== undefined ? trackedJobs : currentSync.trackedJobs || [],
        wishlistedJobs:
          wishlistedJobs !== undefined ? wishlistedJobs : currentSync.wishlistedJobs || [],
      };

      const updated = await UserService.updateUserProfile(user.id, updates as any);

      return res.status(200).json(
        ResponseFormatter.success(updated, 'User data saved')
      );
    } catch (error) {
      console.error('❌ User sync save error:', error);
      return res.status(500).json(
        ResponseFormatter.error(
          error instanceof Error ? error : new Error('Failed to save user data')
        )
      );
    }
  });
};
