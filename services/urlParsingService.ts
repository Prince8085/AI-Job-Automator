interface JobData {
  company: string;
  title: string;
  location: string;
  skills: string[];
  experience: string;
  salary: string;
  description: string;
  requirements: string[];
}

interface ParsedJobData {
  field: string;
  value: string;
  confidence: 'high' | 'medium' | 'low';
  suggestion: string;
}

export class URLParsingService {
  private static instance: URLParsingService;

  public static getInstance(): URLParsingService {
    if (!URLParsingService.instance) {
      URLParsingService.instance = new URLParsingService();
    }
    return URLParsingService.instance;
  }

  async parseJobURL(url: string): Promise<ParsedJobData[]> {
    try {
      // Validate URL
      const urlObj = new URL(url);
      
      // Determine the job site and use appropriate parsing strategy
      if (url.includes('greenhouse.io')) {
        return await this.parseGreenhouseJob(url);
      } else if (url.includes('linkedin.com')) {
        return await this.parseLinkedInJob(url);
      } else if (url.includes('indeed.com')) {
        return await this.parseIndeedJob(url);
      } else if (url.includes('glassdoor.com')) {
        return await this.parseGlassdoorJob(url);
      } else if (url.includes('angel.co') || url.includes('wellfound.com')) {
        return await this.parseAngelJob(url);
      } else {
        return await this.parseGenericJob(url);
      }
    } catch (error) {
      console.error('Error parsing URL:', error);
      throw new Error('Invalid URL or unable to parse job posting');
    }
  }

  private async parseGreenhouseJob(url: string): Promise<ParsedJobData[]> {
    try {
      // Import proxy service
      const { proxyService } = await import('./proxyService');
      
      // For Greenhouse jobs, we can often extract info from the URL structure
      const html = await proxyService.fetchWithProxy(url);
      
      // Create a temporary DOM element to parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const results: ParsedJobData[] = [];
      
      // Extract company name from URL or page title
      const urlParts = url.split('/');
      const companySlug = urlParts[2]?.split('.')[0] || '';
      const companyName = this.formatCompanyName(companySlug);
      
      if (companyName) {
        results.push({
          field: 'Company Name',
          value: companyName,
          confidence: 'high',
          suggestion: 'Extracted from Greenhouse URL domain'
        });
      }

      // Try to extract job title from page title or h1
      const pageTitle = doc.querySelector('title')?.textContent || '';
      const h1Element = doc.querySelector('h1')?.textContent || '';
      
      let jobTitle = '';
      if (h1Element) {
        jobTitle = h1Element.trim();
      } else if (pageTitle) {
        // Remove company name and common suffixes from title
        jobTitle = pageTitle.replace(/\s*-\s*.*$/, '').replace(/Job Application for\s*/i, '').trim();
      }
      
      if (jobTitle) {
        results.push({
          field: 'Job Title',
          value: jobTitle,
          confidence: 'high',
          suggestion: 'Found in job posting header'
        });
      }

      // Extract location
      const locationElement = doc.querySelector('[data-qa="location"], .location, .job-location');
      if (locationElement) {
        results.push({
          field: 'Location',
          value: locationElement.textContent?.trim() || '',
          confidence: 'high',
          suggestion: 'Found in job details section'
        });
      }

      // Extract job description and requirements
      const descriptionElement = doc.querySelector('.job-description, .content, .description');
      if (descriptionElement) {
        const description = descriptionElement.textContent || '';
        
        // Extract skills from description
        const skills = this.extractSkills(description);
        if (skills.length > 0) {
          results.push({
            field: 'Required Skills',
            value: skills.join(', '),
            confidence: 'high',
            suggestion: 'Parsed from job description'
          });
        }

        // Extract experience requirements
        const experience = this.extractExperience(description);
        if (experience) {
          results.push({
            field: 'Experience Level',
            value: experience,
            confidence: 'medium',
            suggestion: 'Inferred from job requirements'
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error parsing Greenhouse job:', error);
      return this.getFallbackData(url);
    }
  }

  private async parseLinkedInJob(url: string): Promise<ParsedJobData[]> {
    // LinkedIn has anti-scraping measures, so we'll provide basic parsing
    return this.getFallbackData(url, 'LinkedIn');
  }

  private async parseIndeedJob(url: string): Promise<ParsedJobData[]> {
    return this.getFallbackData(url, 'Indeed');
  }

  private async parseGlassdoorJob(url: string): Promise<ParsedJobData[]> {
    return this.getFallbackData(url, 'Glassdoor');
  }

  private async parseAngelJob(url: string): Promise<ParsedJobData[]> {
    return this.getFallbackData(url, 'AngelList/Wellfound');
  }

  private async parseGenericJob(url: string): Promise<ParsedJobData[]> {
    try {
      const { proxyService } = await import('./proxyService');
      const html = await proxyService.fetchWithProxy(url);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const results: ParsedJobData[] = [];
      
      // Try to extract basic info from meta tags and common selectors
      const title = doc.querySelector('title')?.textContent || 
                   doc.querySelector('h1')?.textContent || '';
      
      if (title) {
        results.push({
          field: 'Job Title',
          value: title.trim(),
          confidence: 'medium',
          suggestion: 'Extracted from page title'
        });
      }

      // Try to find company name in common locations
      const companySelectors = [
        '[data-company]',
        '.company-name',
        '.employer',
        '.company'
      ];
      
      for (const selector of companySelectors) {
        const element = doc.querySelector(selector);
        if (element?.textContent) {
          results.push({
            field: 'Company Name',
            value: element.textContent.trim(),
            confidence: 'medium',
            suggestion: 'Found in page content'
          });
          break;
        }
      }

      return results;
    } catch (error) {
      return this.getFallbackData(url);
    }
  }

  private formatCompanyName(slug: string): string {
    // Convert URL slug to proper company name
    const companyMap: { [key: string]: string } = {
      'qualio': 'Qualio',
      'google': 'Google',
      'microsoft': 'Microsoft',
      'amazon': 'Amazon',
      'meta': 'Meta',
      'netflix': 'Netflix',
      'uber': 'Uber',
      'airbnb': 'Airbnb'
    };
    
    return companyMap[slug.toLowerCase()] || 
           slug.split('-').map(word => 
             word.charAt(0).toUpperCase() + word.slice(1)
           ).join(' ');
  }

  private extractSkills(text: string): string[] {
    const commonSkills = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'C#',
      'Angular', 'Vue.js', 'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'MySQL',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'REST', 'GraphQL',
      'Machine Learning', 'AI', 'Data Science', 'DevOps', 'CI/CD', 'Agile', 'Scrum'
    ];
    
    const foundSkills: string[] = [];
    const lowerText = text.toLowerCase();
    
    commonSkills.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });
    
    return foundSkills.slice(0, 8); // Limit to 8 skills
  }

  private extractExperience(text: string): string | null {
    const experiencePatterns = [
      /(\d+)\+?\s*years?\s*of\s*experience/i,
      /(\d+)\+?\s*years?\s*experience/i,
      /(\d+)-(\d+)\s*years/i,
      /(entry|junior|senior|lead|principal)/i
    ];
    
    for (const pattern of experiencePatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[1] && match[2]) {
          return `${match[1]}-${match[2]} years`;
        } else if (match[1]) {
          return `${match[1]}+ years`;
        } else if (match[0]) {
          return match[0];
        }
      }
    }
    
    return null;
  }

  private getFallbackData(url: string, source?: string): ParsedJobData[] {
    const domain = new URL(url).hostname;
    const companyName = domain.split('.')[0];
    
    return [
      {
        field: 'Source URL',
        value: url,
        confidence: 'high',
        suggestion: `Job posting from ${source || domain}`
      },
      {
        field: 'Company Name',
        value: this.formatCompanyName(companyName),
        confidence: 'low',
        suggestion: 'Estimated from website domain'
      },
      {
        field: 'Note',
        value: 'Limited data extraction available',
        confidence: 'high',
        suggestion: 'This site may have anti-scraping protection. Please copy job details manually.'
      }
    ];
  }
}

export const urlParsingService = URLParsingService.getInstance();