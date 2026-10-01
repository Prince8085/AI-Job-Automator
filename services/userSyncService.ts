/**
 * User Data Sync Service
 * Bridges the client's localStorage-first state with the backend
 * (user_profiles.sync_data) so data persists across devices.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface UserSyncPayload {
  profile?: Record<string, unknown>;
  trackedJobs?: unknown[];
  wishlistedJobs?: unknown[];
}

export interface UserSyncData {
  profile: Record<string, unknown>;
  trackedJobs: unknown[];
  wishlistedJobs: unknown[];
}

/**
 * Pull the user's synced data from the backend.
 */
export const fetchUserSync = async (clerkId: string): Promise<UserSyncData | null> => {
  try {
    const res = await fetch(
      `${API_BASE}/user/${encodeURIComponent(clerkId)}/sync`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data || null;
  } catch (error) {
    console.warn('User sync fetch failed (offline or backend down):', error);
    return null;
  }
};

/**
 * Push the user's data to the backend (profile + tracked jobs + wishlist).
 */
export const pushUserSync = async (
  clerkId: string,
  payload: UserSyncPayload
): Promise<boolean> => {
  try {
    const res = await fetch(
      `${API_BASE}/user/${encodeURIComponent(clerkId)}/sync`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    return res.ok;
  } catch (error) {
    console.warn('User sync push failed (offline or backend down):', error);
    return false;
  }
};
