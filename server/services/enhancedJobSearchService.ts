/**
 * Enhanced Job Search Service
 * Aggregates jobs from multiple free APIs with ranking and deduplication
 */

import { Job } from '../../types';

// Job search configuration
export interface SearchConfig {
  keyword: string;
  location?: string;
  limit?: number;
  offset?: number;
  timeFilter?: string;
  jobType?: string;
  experienceLevel?: string;
  minSalary?: number;
  maxSalary?: number;
}

interface SourceDiagnostic {
  source: string;
  status: 'success' | 'failed';
  count: number;
  error?: string;
}

// Job source tracking
enum JobSource {
  REMOTEOK = 'RemoteOK',
  ARBEITNOW = 'Arbeitnow',
  JOBICY = 'Jobicy',
  GITHUB = 'GitHub Jobs',
  HACKERNEWS = 'HackerNews',
  JSREMOTE = 'JSRemote',
  AUTHENTICJOBS = 'AuthenticJobs',
}

interface RawJobData {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  postedDate?: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  tags?: string[];
  source: JobSource;
  relevanceScore?: number;
}

export class EnhancedJobSearchService {
  private static instance: EnhancedJobSearchService;
  private readonly API_TIMEOUT = 8000; // 8 seconds per API
  private lastDiagnostics: SourceDiagnostic[] = [];

  static getInstance(): EnhancedJobSearchService {
    if (!EnhancedJobSearchService.instance) {
      EnhancedJobSearchService.instance = new EnhancedJobSearchService();
    }
    return EnhancedJobSearchService.instance;
  }

  /**
   * Main search method - aggregates from trusted sources
   */
  async search(config: SearchConfig): Promise<Job[]> {
    const startTime = Date.now();
    this.lastDiagnostics = [];
    console.log(`🔍 Enhanced job search: "${config.keyword}" in "${config.location || 'any'}"`);

    try {
      // Keep only reliable job feeds
      const sourceEntries: Array<{ source: string; promise: Promise<RawJobData[]> }> = [
        { source: JobSource.REMOTEOK, promise: this.withTimeout(this.fetchRemoteOKJobs(config), 'RemoteOK') },
        { source: JobSource.ARBEITNOW, promise: this.withTimeout(this.fetchArbeitnowJobs(config), 'Arbeitnow') },
        { source: JobSource.JOBICY, promise: this.withTimeout(this.fetchJobicyJobs(config), 'Jobicy') },
        { source: JobSource.HACKERNEWS, promise: this.withTimeout(this.fetchHackerNewsJobs(config), 'HackerNews') },
        { source: JobSource.JSREMOTE, promise: this.withTimeout(this.fetchJSRemoteJobs(config), 'JSRemote') },
      ];

      const settledResults = await Promise.allSettled(sourceEntries.map((entry) => entry.promise));
      const allJobs: RawJobData[] = [];

      settledResults.forEach((result, index) => {
        const source = sourceEntries[index].source;
        if (result.status === 'fulfilled') {
          const count = result.value.length;
          this.lastDiagnostics.push({ source, status: 'success', count });
          console.log(`✅ ${source}: ${count} jobs`);
          allJobs.push(...result.value);
        } else {
          const error = result.reason?.message || 'Unknown error';
          this.lastDiagnostics.push({ source, status: 'failed', count: 0, error });
          console.log(`⚠️ ${source}: Failed - ${error}`);
        }
      });

      // Apply time filter at raw data level before formatting
      const timeFilteredJobs = this.filterByTime(allJobs, config.timeFilter);

      // Process and rank jobs
      let processedJobs = this.processJobs(timeFilteredJobs);

      // Apply location filter
      if (config.location && config.location.toLowerCase() !== 'any') {
        processedJobs = this.filterByLocation(processedJobs, config.location);
      }

      // Apply salary filter
      if (config.minSalary || config.maxSalary) {
        processedJobs = this.filterBySalary(processedJobs, config.minSalary, config.maxSalary);
      }

      // Deduplicate
      processedJobs = this.deduplicateJobs(processedJobs);

      // Rank by relevance and recency
      processedJobs = this.rankJobs(processedJobs, config.keyword);

      // Relevance quality gate
      processedJobs = processedJobs.filter((job) => (job.relevanceScore || 0) >= 25);

      // Apply pagination
      const limit = Math.min(config.limit || 50, 100);
      const offset = config.offset || 0;
      processedJobs = processedJobs.slice(offset, offset + limit);

      const elapsed = Date.now() - startTime;
      console.log(`📊 Found ${processedJobs.length} relevant jobs in ${elapsed}ms`);

      return processedJobs;
    } catch (error) {
      console.error('Enhanced job search error:', error);
      return [];
    }
  }

  getDiagnostics(): SourceDiagnostic[] {
    return [...this.lastDiagnostics];
  }

  /**
   * Timeout wrapper for API calls
   */
  private withTimeout<T>(promise: Promise<T>, source: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`${source} timeout`)), this.API_TIMEOUT)
      )
    ]);
  }

  /**
   * Fetch from RemoteOK API
   */
  private async fetchRemoteOKJobs(config: SearchConfig): Promise<RawJobData[]> {
    try {
      const response = await fetch('https://remoteok.com/api', {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`Status ${response.status}`);

      const data: any[] = await response.json();
      const jobs = data.slice(1); // Skip metadata

      return jobs
        .filter(job => this.matchesKeyword(job, config.keyword, ['position', 'company', 'tags', 'description']))
        .slice(0, 15)
        .map(job => ({
          id: `remoteok-${job.id || job.slug}`,
          title: job.position || 'Unknown',
          company: job.company || 'Unknown',
          location: job.location || 'Remote',
          description: this.cleanHTML(job.description || ''),
          url: job.url || '',
          postedDate: job.date,
          salary: this.formatSalary(job.salary_min, job.salary_max),
          salaryMin: job.salary_min,
          salaryMax: job.salary_max,
          tags: [...(job.tags || []).slice(0, 3), 'Remote'],
          source: JobSource.REMOTEOK,
        }));
    } catch (error) {
      console.error('RemoteOK error:', error);
      return [];
    }
  }

  /**
   * Fetch from Arbeitnow API
   */
  private async fetchArbeitnowJobs(config: SearchConfig): Promise<RawJobData[]> {
    try {
      const response = await fetch('https://www.arbeitnow.com/api/job-board-api', {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`Status ${response.status}`);

      const data: any = await response.json();

      return (data.data || [])
        .filter((job: any) => this.matchesKeyword(job, config.keyword, ['title', 'company_name', 'tags', 'description']))
        .slice(0, 15)
        .map((job: any) => ({
          id: `arbeitnow-${job.slug}`,
          title: job.title || 'Unknown',
          company: job.company_name || 'Unknown',
          location: job.remote ? 'Remote' : (job.location || 'Not specified'),
          description: this.cleanHTML(job.description || ''),
          url: job.url || '',
          postedDate: new Date(job.created_at * 1000).toISOString(),
          salary: 'Not specified',
          tags: [...(job.tags || []).slice(0, 2), ...(job.job_types || [])],
          source: JobSource.ARBEITNOW,
        }));
    } catch (error) {
      console.error('Arbeitnow error:', error);
      return [];
    }
  }

  /**
   * Fetch from Jobicy API
   */
  private async fetchJobicyJobs(config: SearchConfig): Promise<RawJobData[]> {
    try {
      const searchParam = encodeURIComponent(config.keyword.toLowerCase().replace(/\s+/g, '-'));
      const url = `https://jobicy.com/api/v2/remote-jobs?count=25&tag=${searchParam}`;

      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        // Fallback to general jobs
        const fallback = await fetch('https://jobicy.com/api/v2/remote-jobs?count=25');
        if (!fallback.ok) throw new Error(`Status ${response.status}`);
        const data = await fallback.json();
        return this.processJobicyJobs(data.jobs || [], config);
      }

      const data = await response.json();
      return this.processJobicyJobs(data.jobs || [], config);
    } catch (error) {
      console.error('Jobicy error:', error);
      return [];
    }
  }

  private processJobicyJobs(jobs: any[], config: SearchConfig): RawJobData[] {
    return jobs
      .filter(job => this.matchesKeyword(job, config.keyword, ['jobTitle', 'companyName', 'jobIndustry', 'jobDescription']))
      .slice(0, 15)
      .map(job => ({
        id: `jobicy-${job.id}`,
        title: job.jobTitle || 'Unknown',
        company: job.companyName || 'Unknown',
        location: job.jobGeo || 'Remote',
        description: this.cleanHTML(job.jobExcerpt || job.jobDescription || ''),
        url: job.url || '',
        postedDate: job.pubDate,
        tags: [
          ...(job.jobIndustry || []).slice(0, 2),
          ...(job.jobType || []),
          job.jobLevel
        ].filter(Boolean),
        source: JobSource.JOBICY,
      }));
  }

  /**
   * Fetch from HackerNews Jobs
   */
  private async fetchHackerNewsJobs(config: SearchConfig): Promise<RawJobData[]> {
    try {
      // HackerNews API for job listings
      const response = await fetch('https://hacker-news.firebaseio.com/v0/jobstories.json');

      if (!response.ok) throw new Error(`Status ${response.status}`);

      const jobIds: number[] = await response.json();

      // Fetch first 20 job items
      const jobPromises = jobIds.slice(0, 20).map(id =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
          .then(r => r.json())
          .catch(() => null)
      );

      const jobs = await Promise.all(jobPromises);

      return jobs
        .filter((job: any) => job && this.matchesKeyword(job, config.keyword, ['title', 'url']))
        .slice(0, 10)
        .map((job: any) => ({
          id: `hn-${job.id}`,
          title: job.title || 'Unknown',
          company: this.extractCompanyFromUrl(job.url) || 'HackerNews',
          location: 'Remote',
          description: `Posted by ${job.by}`,
          url: job.url || `https://news.ycombinator.com/item?id=${job.id}`,
          postedDate: new Date(job.time * 1000).toISOString(),
          tags: ['HackerNews', 'Tech', 'Startup'],
          source: JobSource.HACKERNEWS,
        }));
    } catch (error) {
      console.error('HackerNews error:', error);
      return [];
    }
  }

  /**
   * Fetch from JSRemote (JavaScript jobs)
   */
  private async fetchJSRemoteJobs(config: SearchConfig): Promise<RawJobData[]> {
    try {
      const response = await fetch('https://jsremote.hiring.zone/api/jobs.json');

      if (!response.ok) throw new Error(`Status ${response.status}`);

      const jobs = await response.json();

      return jobs
        .filter((job: any) => this.matchesKeyword(job, config.keyword, ['title', 'company', 'role', 'description']))
        .slice(0, 15)
        .map((job: any) => ({
          id: `jsremote-${job.id || job.slug}`,
          title: job.title || job.role || 'Unknown',
          company: job.company || 'Unknown',
          location: job.location || 'Remote',
          description: this.cleanHTML(job.description || ''),
          url: job.url || job.link || '',
          postedDate: job.published_at || job.date,
          salary: job.salary || 'Not specified',
          tags: ['JavaScript', 'Remote', ...(job.type ? [job.type] : [])].filter(Boolean),
          source: JobSource.JSREMOTE,
        }));
    } catch (error) {
      console.error('JSRemote error:', error);
      return [];
    }
  }

  /**
   * Process jobs - convert to Job type with relevance scoring
   */
  private processJobs(rawJobs: RawJobData[]): Job[] {
    return rawJobs.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      tags: job.tags || [],
      salary: job.salary || 'Not specified',
      postedDate: this.formatPostedDate(job.postedDate),
      sourceUrl: job.url,
      isWishlisted: false,
      source: job.source,
      relevanceScore: job.relevanceScore || 0,
    })) as Job[];
  }

  /**
   * Filter by location
   */
  private filterByLocation(jobs: any[], location: string): any[] {
    const locationLower = location.toLowerCase();
    return jobs.filter(job =>
      job.location.toLowerCase().includes(locationLower) ||
      job.location.toLowerCase() === 'remote' ||
      job.description.toLowerCase().includes(locationLower)
    );
  }

  /**
   * Filter by salary range
   */
  private filterBySalary(jobs: any[], min?: number, max?: number): any[] {
    if (!min && !max) return jobs;

    return jobs.filter(job => {
      if (!job.salaryMin) return true;
      if (min && job.salaryMax && job.salaryMax < min) return false;
      if (max && job.salaryMin && job.salaryMin > max) return false;
      return true;
    });
  }

  /**
   * Deduplicate jobs by canonical URL + normalized title/company
   */
  private deduplicateJobs(jobs: any[]): any[] {
    const seenUrl = new Set<string>();
    const seenIdentity = new Set<string>();

    return jobs.filter((job) => {
      const canonicalUrl = this.normalizeUrl(job.sourceUrl || job.url || '');
      if (canonicalUrl) {
        if (seenUrl.has(canonicalUrl)) return false;
        seenUrl.add(canonicalUrl);
      }

      const identity = `${this.normalizeText(job.title)}-${this.normalizeText(job.company)}`;
      if (seenIdentity.has(identity)) return false;
      seenIdentity.add(identity);

      return true;
    });
  }

  /**
   * Rank jobs by relevance and recency
   */
  private rankJobs(jobs: any[], keyword: string): any[] {
    return jobs
      .map((job) => ({
        ...job,
        relevanceScore: this.calculateRelevance(job, keyword),
      }))
      .sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        return this.getRecencyScore(b.postedDate) - this.getRecencyScore(a.postedDate);
      });
  }

  /**
   * Calculate relevance score for a job
   */
  private calculateRelevance(job: any, keyword: string): number {
    const normalizedKeyword = this.normalizeText(keyword);
    const keywordTokens = normalizedKeyword.split(' ').filter(Boolean);

    const title = this.normalizeText(job.title);
    const company = this.normalizeText(job.company);
    const tags = (job.tags || []).map((tag: string) => this.normalizeText(tag)).join(' ');
    const description = this.normalizeText(job.description);
    const location = this.normalizeText(job.location);

    let score = 0;

    if (title.includes(normalizedKeyword)) score += 80;
    if (title.startsWith(normalizedKeyword)) score += 40;

    keywordTokens.forEach((token) => {
      if (title.includes(token)) score += 20;
      if (tags.includes(token)) score += 12;
      if (description.includes(token)) score += 6;
      if (company.includes(token)) score += 8;
    });

    const matchedTokens = keywordTokens.filter(
      (token) =>
        title.includes(token) ||
        company.includes(token) ||
        tags.includes(token) ||
        description.includes(token)
    ).length;

    score += matchedTokens * 5;

    if (location.includes('remote')) score += 8;
    score += this.getRecencyScore(job.postedDate);

    return score;
  }

  /**
   * Utility: Check if job matches keyword
   */
  private matchesKeyword(item: any, keyword: string, fields: string[]): boolean {
    const normalizedKeyword = this.normalizeText(keyword);
    const keywordTokens = normalizedKeyword.split(' ').filter(Boolean);

    const haystack = fields
      .map((field) => this.getNestedProperty(item, field))
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter(Boolean)
      .map((value) => this.normalizeText(String(value)))
      .join(' ');

    if (!haystack) return false;
    return keywordTokens.some((token) => haystack.includes(token));
  }

  /**
   * Get nested property from object
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Clean HTML from descriptions
   */
  private cleanHTML(html: string): string {
    if (!html) return 'No description available.';

    let text = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    if (text.length > 500) {
      text = text.substring(0, 500) + '...';
    }

    return text;
  }

  /**
   * Format salary
   */
  private formatSalary(min?: number, max?: number): string {
    if (!min && !max) return 'Not specified';
    
    const format = (num: number) => {
      if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`;
      return `$${num}`;
    };

    if (min && max) return `${format(min)} - ${format(max)}`;
    if (min) return `${format(min)}+`;
    return `Up to ${format(max!)}`;
  }

  /**
   * Format posted date
   */
  private formatPostedDate(dateStr?: string | number): string {
    if (!dateStr) return 'Date unknown';

    try {
      let date: Date;

      if (typeof dateStr === 'number') {
        // Unix timestamp
        date = new Date(dateStr * 1000);
      } else {
        date = new Date(dateStr);
      }

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      const diffWeeks = Math.floor(diffDays / 7);

      if (diffHours < 1) return 'Just now';
      if (diffHours === 1) return '1 hour ago';
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffWeeks === 1) return '1 week ago';
      if (diffWeeks < 4) return `${diffWeeks} weeks ago`;

      return date.toLocaleDateString();
    } catch {
      return 'Date unknown';
    }
  }

  private filterByTime(jobs: RawJobData[], timeFilter?: string): RawJobData[] {
    if (!timeFilter || timeFilter === 'any' || timeFilter === 'any_time') return jobs;

    const now = Date.now();
    const maxAgeMsMap: Record<string, number> = {
      last_hour: 60 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      last_24_hours: 24 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      last_week: 7 * 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      last_month: 30 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    const maxAge = maxAgeMsMap[timeFilter];
    if (!maxAge) return jobs;

    return jobs.filter((job) => {
      const postedTime = this.toTimestamp(job.postedDate);
      if (!postedTime) return true;
      return now - postedTime <= maxAge;
    });
  }

  private toTimestamp(dateStr?: string | number): number | null {
    if (!dateStr) return null;
    const date = typeof dateStr === 'number' ? new Date(dateStr * 1000) : new Date(dateStr);
    const timestamp = date.getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  private getRecencyScore(postedDate?: string): number {
    if (!postedDate) return 0;
    const lowered = postedDate.toLowerCase();
    if (lowered.includes('just now')) return 25;
    if (lowered.includes('hour')) return 20;
    if (lowered.includes('day')) return 10;
    if (lowered.includes('week')) return 5;
    return 0;
  }

  private normalizeText(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private normalizeUrl(value: string): string {
    if (!value) return '';
    try {
      const url = new URL(value);
      url.hash = '';
      url.search = '';
      return url.toString().replace(/\/$/, '');
    } catch {
      return '';
    }
  }

  /**
   * Extract company name from URL
   */
  private extractCompanyFromUrl(url?: string): string | null {
    if (!url) return null;

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');
      const company = hostname.split('.')[0];
      return company.charAt(0).toUpperCase() + company.slice(1);
    } catch {
      return null;
    }
  }
}

export const enhancedJobSearchService = EnhancedJobSearchService.getInstance();
