import { describe, it, expect, beforeEach, vi } from 'vitest';
import { searchLiveJobs, generateCoverLetter, parseJsonResponse } from '../../../services/geminiService';

const sampleJob = {
  id: 'job-1',
  title: 'React Developer',
  company: 'TechCorp',
  location: 'Remote',
  description: 'Build great products with React',
  tags: ['React'],
  salary: '100k',
  postedDate: 'Today',
};

const jsonResponse = (body: any, ok = true) => ({
  ok,
  status: ok ? 200 : 500,
  statusText: ok ? 'OK' : 'Error',
  json: () => Promise.resolve(body),
  text: () => Promise.resolve(JSON.stringify(body)),
} as any);

const mockFetch = vi.fn(async (url: string) => {
  if (url.includes('/jobs/search')) {
    return jsonResponse({
      success: true,
      data: {
        source: 'test',
        totalResults: 1,
        displayedResults: 1,
        results: [sampleJob],
      },
    });
  }
  if (url.includes('/ai/chat')) {
    return jsonResponse({
      success: true,
      data: { content: 'Dear Hiring Manager, I am excited to apply for this role. With five years of experience building React applications and a proven record of shipping high-impact features, I am confident I would be a great addition to your engineering team. I look forward to discussing how my background aligns with your goals.' },
    });
  }
  throw new Error(`Unexpected fetch: ${url}`);
});

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('parseJsonResponse', () => {
    it('should parse JSON from code block', () => {
      const response = '```json\n{"id": "123", "title": "Developer"}\n```';
      const result = parseJsonResponse(response);
      expect(result.id).toBe('123');
      expect(result.title).toBe('Developer');
    });

    it('should parse raw JSON string', () => {
      const response = '{"id": "456", "name": "John"}';
      const result = parseJsonResponse(response);
      expect(result.id).toBe('456');
      expect(result.name).toBe('John');
    });

    it('should throw on invalid JSON', () => {
      const response = 'not valid json';
      expect(() => parseJsonResponse(response)).toThrow();
    });

    it('should throw on empty response', () => {
      expect(() => parseJsonResponse('')).toThrow();
    });
  });

  describe('searchLiveJobs', () => {
    it('should return array of jobs', async () => {
      const jobs = await searchLiveJobs('React Developer', 'Remote');
      expect(Array.isArray(jobs)).toBe(true);
      if (jobs.length > 0) {
        expect(jobs[0]).toHaveProperty('id');
        expect(jobs[0]).toHaveProperty('title');
        expect(jobs[0]).toHaveProperty('company');
        expect(jobs[0]).toHaveProperty('location');
      }
    });

    it('should handle location parameter', async () => {
      const jobs = await searchLiveJobs('Developer', 'New York');
      expect(Array.isArray(jobs)).toBe(true);
    });

    it('should handle timeFilter parameter', async () => {
      const jobs = await searchLiveJobs('Developer', 'Remote', 'last_week');
      expect(Array.isArray(jobs)).toBe(true);
    });
  });

  describe('generateCoverLetter', () => {
    it('should generate a cover letter string', async () => {
      const mockProfile = {
        id: '1',
        clerkUserId: 'clerk-1',
        name: 'John Doe',
        email: 'john@example.com',
        baseResume: 'Senior Developer with 5 years experience'
      };

      const mockJob = {
        id: 'job-1',
        title: 'Senior React Developer',
        company: 'Tech Company',
        location: 'Remote',
        description: 'Looking for experienced React developer',
        tags: ['React', 'TypeScript'],
        salary: '$100k - $120k',
        postedDate: 'Today'
      };

      const letter = await generateCoverLetter(mockProfile as any, mockJob as any);
      expect(typeof letter).toBe('string');
      expect(letter.length).toBeGreaterThan(100);
    });
  });
});
