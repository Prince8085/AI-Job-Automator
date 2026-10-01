/**
 * Job Search API Service
 * Calls enhanced backend job search endpoints
 */

import { Job } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface SourceDiagnostic {
  source: string;
  status: 'success' | 'failed';
  count: number;
  error?: string;
}

export interface SearchResponse {
  success: boolean;
  data: {
    source: string;
    keyword: string;
    location?: string;
    timeFilter?: string;
    totalResults: number;
    displayedResults: number;
    results: Job[];
    cached?: boolean;
    diagnostics?: SourceDiagnostic[];
    pagination?: {
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
  message: string;
  requestId?: string;
}

/**
 * Search jobs from enhanced backend API
 */
export const searchJobsFromAPI = async (
  keyword: string,
  location?: string,
  limit: number = 50,
  offset: number = 0,
  timeFilter: string = 'any_time'
): Promise<Job[]> => {
  try {
    if (!keyword || keyword.trim().length < 2) {
      throw new Error('Search term must be at least 2 characters');
    }

    const params = new URLSearchParams({
      keyword: keyword.trim(),
      limit: Math.min(limit, 100).toString(),
      offset: offset.toString(),
      timeFilter,
    });

    if (location && location.trim()) {
      params.append('location', location.trim());
    }

    console.log(`🔍 Calling backend job search API for: "${keyword}" in "${location || 'any'}"`);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${API_BASE}/jobs/search?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      signal: controller.signal,
    });

    window.clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || 
        `Search failed: ${response.status} ${response.statusText}`
      );
    }

    const data: SearchResponse = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Search failed');
    }

    console.log(`✅ Found ${data.data.totalResults} jobs (${data.data.displayedResults} displayed)`);

    return (data.data.results || []).map((job) => ({
      ...job,
      tags: job.tags || [],
      source: job.source || 'Aggregated',
      relevanceScore: job.relevanceScore || 0,
    }));
  } catch (error) {
    console.error('Job API search error:', error);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Search request timed out. Please try again.');
    }
    throw error instanceof Error ? error : new Error(String(error));
  }
};

/**
 * Get job details by ID
 */
export const getJobDetailsFromAPI = async (jobId: string): Promise<Job> => {
  try {
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    const response = await fetch(`${API_BASE}/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Job not found');
      }
      throw new Error(`Failed to fetch job: ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Failed to get job details:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
};

/**
 * Search jobs in database (saved/cached jobs)
 */
export const searchDatabaseJobs = async (filters: {
  title?: string;
  company?: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  limit?: number;
  offset?: number;
}): Promise<Job[]> => {
  try {
    const params = new URLSearchParams();

    if (filters.title) params.append('title', filters.title);
    if (filters.company) params.append('company', filters.company);
    if (filters.location) params.append('location', filters.location);
    if (filters.jobType) params.append('jobType', filters.jobType);
    if (filters.experienceLevel) params.append('experienceLevel', filters.experienceLevel);

    params.append('limit', (filters.limit || 20).toString());
    params.append('offset', (filters.offset || 0).toString());

    const response = await fetch(`${API_BASE}/jobs/database?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.data?.results || [];
  } catch (error) {
    console.error('Database search error:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
};

/**
 * Search multiple sources (live + database)
 */
export const searchJobsMultiSource = async (
  keyword: string,
  location?: string,
  limit: number = 50
): Promise<Job[]> => {
  try {
    // First try the enhanced API search
    const liveJobs = await searchJobsFromAPI(keyword, location, limit, 0, 'any_time');

    if (liveJobs.length >= limit) {
      return liveJobs;
    }

    // If we need more results, also search database
    const dbJobs = await searchDatabaseJobs({
      title: keyword,
      location,
      limit: limit - liveJobs.length,
    });

    // Combine and deduplicate
    const allJobs = [...liveJobs, ...dbJobs];
    const seen = new Set<string>();

    return allJobs.filter(job => {
      const key = `${job.title}-${job.company}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch (error) {
    console.error('Multi-source search error:', error);
    // Fallback to just live API search
    return searchJobsFromAPI(keyword, location, limit, 0, 'any_time').catch(() => []);
  }
};
