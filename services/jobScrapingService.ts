import { Job } from '../types';

// Time filter options for job search
export enum TimeFilter {
  LAST_HOUR = '1h',
  LAST_24_HOURS = '24h',
  LAST_WEEK = '7d',
  LAST_MONTH = '30d',
  ANY_TIME = 'any'
}

// Convert TimeFilter to hours for filtering
const timeFilterToHours: Record<TimeFilter, number> = {
  [TimeFilter.LAST_HOUR]: 1,
  [TimeFilter.LAST_24_HOURS]: 24,
  [TimeFilter.LAST_WEEK]: 168,
  [TimeFilter.LAST_MONTH]: 720,
  [TimeFilter.ANY_TIME]: 8760 // 1 year
};

// ==========================================
// FREE JOB API INTERFACES
// ==========================================

// RemoteOK API Response
interface RemoteOKJob {
  id: string;
  slug: string;
  company: string;
  company_logo?: string;
  position: string;
  tags: string[];
  description: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  date: string;
  url: string;
}

// Arbeitnow API Response
interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: number; // Unix timestamp
}

interface ArbeitnowResponse {
  data: ArbeitnowJob[];
}

// Jobicy API Response
interface JobicyJob {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  jobIndustry: string[];
  jobType: string[];
  jobGeo: string;
  jobLevel: string;
  jobExcerpt: string;
  jobDescription: string;
  pubDate: string;
}

interface JobicyResponse {
  jobs: JobicyJob[];
}

// ==========================================
// JOB SCRAPING SERVICE
// ==========================================

export class JobScrapingService {
  private static instance: JobScrapingService;

  public static getInstance(): JobScrapingService {
    if (!JobScrapingService.instance) {
      JobScrapingService.instance = new JobScrapingService();
    }
    return JobScrapingService.instance;
  }

  // Check if job was posted within the time filter
  private isWithinTimeFilter(postedDate: string | number, timeFilter: TimeFilter): boolean {
    const maxHours = timeFilterToHours[timeFilter];
    const now = Date.now();

    let jobTime: number;
    if (typeof postedDate === 'number') {
      // Unix timestamp (seconds)
      jobTime = postedDate * 1000;
    } else {
      // ISO date string
      jobTime = new Date(postedDate).getTime();
    }

    const hoursDiff = (now - jobTime) / (1000 * 60 * 60);
    return hoursDiff <= maxHours;
  }

  // Format relative time
  private formatPostedDate(postedDate: string | number): string {
    const now = Date.now();
    let jobTime: number;

    if (typeof postedDate === 'number') {
      jobTime = postedDate * 1000;
    } else {
      jobTime = new Date(postedDate).getTime();
    }

    const hoursDiff = Math.floor((now - jobTime) / (1000 * 60 * 60));

    if (hoursDiff < 1) return 'Just now';
    if (hoursDiff === 1) return '1 hour ago';
    if (hoursDiff < 24) return `${hoursDiff} hours ago`;

    const daysDiff = Math.floor(hoursDiff / 24);
    if (daysDiff === 1) return '1 day ago';
    if (daysDiff < 7) return `${daysDiff} days ago`;
    if (daysDiff < 14) return '1 week ago';
    return `${Math.floor(daysDiff / 7)} weeks ago`;
  }

  // ==========================================
  // REMOTEOK API (FREE, NO KEY REQUIRED)
  // ==========================================
  private async fetchRemoteOKJobs(searchTerm: string, timeFilter: TimeFilter): Promise<Job[]> {
    try {
      console.log('Fetching from RemoteOK API...');

      const response = await fetch('https://remoteok.com/api', {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`RemoteOK API error: ${response.status}`);
      }

      const data: RemoteOKJob[] = await response.json();

      // First item is metadata, skip it
      const jobs = data.slice(1);

      // Filter by search term and time
      const searchLower = searchTerm.toLowerCase();
      const filteredJobs = jobs.filter(job => {
        const matchesSearch =
          job.position?.toLowerCase().includes(searchLower) ||
          job.company?.toLowerCase().includes(searchLower) ||
          job.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
          job.description?.toLowerCase().includes(searchLower);

        const withinTime = this.isWithinTimeFilter(job.date, timeFilter);

        return matchesSearch && withinTime;
      });

      return filteredJobs.slice(0, 10).map(job => ({
        id: `remoteok-${job.id || job.slug}`,
        title: job.position || 'Unknown Position',
        company: job.company || 'Unknown Company',
        location: job.location || 'Remote',
        description: this.cleanDescription(job.description),
        tags: [...(job.tags || []).slice(0, 4), 'Remote', 'RemoteOK'],
        salary: this.formatRemoteOKSalary(job.salary_min, job.salary_max),
        postedDate: this.formatPostedDate(job.date),
        sourceUrl: job.url || `https://remoteok.com/remote-jobs/${job.slug}`,
        isWishlisted: false
      }));

    } catch (error) {
      console.error('RemoteOK API error:', error);
      return [];
    }
  }

  private formatRemoteOKSalary(min?: number, max?: number): string {
    if (min && max) {
      return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    }
    if (min) return `$${(min / 1000).toFixed(0)}k+`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}k`;
    return 'Not specified';
  }

  // ==========================================
  // ARBEITNOW API (FREE, NO KEY REQUIRED)
  // ==========================================
  private async fetchArbeitnowJobs(searchTerm: string, timeFilter: TimeFilter): Promise<Job[]> {
    try {
      console.log('Fetching from Arbeitnow API...');

      const response = await fetch('https://www.arbeitnow.com/api/job-board-api', {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Arbeitnow API error: ${response.status}`);
      }

      const data: ArbeitnowResponse = await response.json();

      const searchLower = searchTerm.toLowerCase();
      const filteredJobs = data.data.filter(job => {
        const matchesSearch =
          job.title?.toLowerCase().includes(searchLower) ||
          job.company_name?.toLowerCase().includes(searchLower) ||
          job.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
          job.description?.toLowerCase().includes(searchLower);

        const withinTime = this.isWithinTimeFilter(job.created_at, timeFilter);

        return matchesSearch && withinTime;
      });

      return filteredJobs.slice(0, 10).map(job => ({
        id: `arbeitnow-${job.slug}`,
        title: job.title || 'Unknown Position',
        company: job.company_name || 'Unknown Company',
        location: job.remote ? 'Remote' : (job.location || 'Not specified'),
        description: this.cleanDescription(job.description),
        tags: [...(job.tags || []).slice(0, 3), ...(job.job_types || []), 'Arbeitnow'],
        salary: 'Not specified',
        postedDate: this.formatPostedDate(job.created_at),
        sourceUrl: job.url,
        isWishlisted: false
      }));

    } catch (error) {
      console.error('Arbeitnow API error:', error);
      return [];
    }
  }

  // ==========================================
  // JOBICY API (FREE, NO KEY REQUIRED)
  // ==========================================
  private async fetchJobicyJobs(searchTerm: string, timeFilter: TimeFilter): Promise<Job[]> {
    try {
      console.log('Fetching from Jobicy API...');

      // Jobicy supports search via tag parameter
      const searchParam = encodeURIComponent(searchTerm.toLowerCase().replace(/\s+/g, '-'));
      const response = await fetch(`https://jobicy.com/api/v2/remote-jobs?count=20&tag=${searchParam}`, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        // Try without search param
        const fallbackResponse = await fetch('https://jobicy.com/api/v2/remote-jobs?count=20');
        if (!fallbackResponse.ok) {
          throw new Error(`Jobicy API error: ${response.status}`);
        }
        const fallbackData: JobicyResponse = await fallbackResponse.json();
        return this.processJobicyJobs(fallbackData.jobs, searchTerm, timeFilter);
      }

      const data: JobicyResponse = await response.json();
      return this.processJobicyJobs(data.jobs || [], searchTerm, timeFilter);

    } catch (error) {
      console.error('Jobicy API error:', error);
      return [];
    }
  }

  private processJobicyJobs(jobs: JobicyJob[], searchTerm: string, timeFilter: TimeFilter): Job[] {
    const searchLower = searchTerm.toLowerCase();

    const filteredJobs = jobs.filter(job => {
      const matchesSearch =
        job.jobTitle?.toLowerCase().includes(searchLower) ||
        job.companyName?.toLowerCase().includes(searchLower) ||
        job.jobIndustry?.some(ind => ind.toLowerCase().includes(searchLower)) ||
        job.jobDescription?.toLowerCase().includes(searchLower);

      const withinTime = this.isWithinTimeFilter(job.pubDate, timeFilter);

      return matchesSearch && withinTime;
    });

    return filteredJobs.slice(0, 10).map(job => ({
      id: `jobicy-${job.id}`,
      title: job.jobTitle || 'Unknown Position',
      company: job.companyName || 'Unknown Company',
      location: job.jobGeo || 'Remote',
      description: job.jobExcerpt || this.cleanDescription(job.jobDescription),
      tags: [...(job.jobIndustry || []).slice(0, 2), ...(job.jobType || []), job.jobLevel, 'Jobicy'].filter(Boolean),
      salary: 'Not specified',
      postedDate: this.formatPostedDate(job.pubDate),
      sourceUrl: job.url,
      isWishlisted: false
    }));
  }

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  private cleanDescription(html: string): string {
    if (!html) return 'No description available.';

    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, ' ');
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    // Limit length
    if (text.length > 500) {
      text = text.substring(0, 500) + '...';
    }
    return text;
  }

  // ==========================================
  // MAIN SEARCH METHOD
  // ==========================================
  public async scrapeJobs(
    searchTerm: string,
    location: string,
    timeFilter: TimeFilter = TimeFilter.ANY_TIME
  ): Promise<Job[]> {
    console.log(`🔍 Searching for: "${searchTerm}" | Location: "${location}" | Filter: ${timeFilter}`);
    console.log('📡 Using FREE APIs: RemoteOK, Arbeitnow, Jobicy (No API key required!)');

    try {
      // Fetch from all sources in parallel
      const [remoteOKJobs, arbeitnowJobs, jobicyJobs] = await Promise.allSettled([
        this.fetchRemoteOKJobs(searchTerm, timeFilter),
        this.fetchArbeitnowJobs(searchTerm, timeFilter),
        this.fetchJobicyJobs(searchTerm, timeFilter)
      ]);

      // Collect successful results
      const allJobs: Job[] = [];

      if (remoteOKJobs.status === 'fulfilled') {
        console.log(`✅ RemoteOK: ${remoteOKJobs.value.length} jobs`);
        allJobs.push(...remoteOKJobs.value);
      } else {
        console.log('❌ RemoteOK failed');
      }

      if (arbeitnowJobs.status === 'fulfilled') {
        console.log(`✅ Arbeitnow: ${arbeitnowJobs.value.length} jobs`);
        allJobs.push(...arbeitnowJobs.value);
      } else {
        console.log('❌ Arbeitnow failed');
      }

      if (jobicyJobs.status === 'fulfilled') {
        console.log(`✅ Jobicy: ${jobicyJobs.value.length} jobs`);
        allJobs.push(...jobicyJobs.value);
      } else {
        console.log('❌ Jobicy failed');
      }

      // Filter by location if specified
      let filteredJobs = allJobs;
      if (location && location.toLowerCase() !== 'any' && location.toLowerCase() !== 'remote') {
        const locationLower = location.toLowerCase();
        filteredJobs = allJobs.filter(job =>
          job.location.toLowerCase().includes(locationLower) ||
          job.location.toLowerCase() === 'remote' ||
          job.location.toLowerCase().includes('worldwide')
        );
      }

      // Remove duplicates by title + company
      const seen = new Set<string>();
      const uniqueJobs = filteredJobs.filter(job => {
        const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Sort by most recent
      uniqueJobs.sort((a, b) => {
        const aHours = this.getHoursFromPostedDate(a.postedDate);
        const bHours = this.getHoursFromPostedDate(b.postedDate);
        return aHours - bHours;
      });

      console.log(`📊 Total unique jobs found: ${uniqueJobs.length}`);

      if (uniqueJobs.length === 0) {
        // Return helpful message
        return [{
          id: 'no-results',
          title: `No "${searchTerm}" jobs found`,
          company: 'Try Different Keywords',
          location: 'Remote',
          description: `We searched RemoteOK, Arbeitnow, and Jobicy but found no jobs matching "${searchTerm}" posted within your time filter. Try:\n• Broader keywords like "developer" or "engineer"\n• Different time filter (try "Any Time")\n• These APIs focus on remote tech jobs`,
          tags: ['No Results', 'Try Again'],
          salary: 'N/A',
          postedDate: 'N/A',
          sourceUrl: 'https://remoteok.com',
          isWishlisted: false
        }];
      }

      return uniqueJobs;

    } catch (error) {
      console.error('Error in job scraping service:', error);
      return [];
    }
  }

  private getHoursFromPostedDate(postedDate: string): number {
    if (postedDate.includes('Just now')) return 0;
    if (postedDate.includes('hour')) {
      const match = postedDate.match(/(\d+)/);
      return match ? parseInt(match[1]) : 1;
    }
    if (postedDate.includes('day')) {
      const match = postedDate.match(/(\d+)/);
      return match ? parseInt(match[1]) * 24 : 24;
    }
    if (postedDate.includes('week')) {
      const match = postedDate.match(/(\d+)/);
      return match ? parseInt(match[1]) * 168 : 168;
    }
    return 9999;
  }

  // Search with filters helper
  public async searchWithFilters(options: {
    searchTerm: string;
    location?: string;
    timeFilter?: TimeFilter;
  }): Promise<Job[]> {
    return this.scrapeJobs(
      options.searchTerm,
      options.location || '',
      options.timeFilter || TimeFilter.ANY_TIME
    );
  }
}

// Export singleton instance
export const jobScrapingService = JobScrapingService.getInstance();