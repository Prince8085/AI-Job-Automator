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
      // Basic URL validation
      if (!url || !url.startsWith('http')) {
        throw new Error('Invalid URL provided');
      }
      
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
        jobTitle = pageTitle.replace(/\s*-\s*.*$/, '').trim();
      }

      if (jobTitle) {
        results.push({
          field: 'Job Title',
          value: jobTitle,
          confidence: h1Element ? 'high' : 'medium',
          suggestion: 'Extracted from page content'
        });
      }

      return results.length > 0 ? results : this.getFallbackData(url, 'Greenhouse');
    } catch (error) {
      console.error('Error parsing Greenhouse job:', error);
      return this.getFallbackData(url, 'Greenhouse');
    }
  }

  private async parseLinkedInJob(url: string): Promise<ParsedJobData[]> {
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
      // Import proxy service
      const { proxyService } = await import('./proxyService');
      
      const html = await proxyService.fetchWithProxy(url);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const results: ParsedJobData[] = [];
      
      // Try to extract basic information
      const title = doc.querySelector('title')?.textContent || '';
      const h1 = doc.querySelector('h1')?.textContent || '';
      const h2 = doc.querySelector('h2')?.textContent || '';
      
      // Extract potential job title
      const jobTitle = h1 || h2 || title.split('|')[0]?.split('-')[0]?.trim();
      if (jobTitle) {
        results.push({
          field: 'Job Title',
          value: jobTitle,
          confidence: h1 ? 'high' : 'medium',
          suggestion: 'Extracted from page headers'
        });
      }
      
      // Try to extract company name from domain or content
      const domain = new URL(url).hostname.replace('www.', '');
      const companyName = this.formatCompanyName(domain.split('.')[0]);
      
      if (companyName) {
        results.push({
          field: 'Company Name',
          value: companyName,
          confidence: 'medium',
          suggestion: 'Extracted from domain name'
        });
      }
      
      return results.length > 0 ? results : this.getFallbackData(url);
    } catch (error) {
      console.error('Error parsing generic job:', error);
      return this.getFallbackData(url);
    }
  }

  private formatCompanyName(slug: string): string {
    return slug
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .replace(/\b(Inc|Corp|Ltd|Llc|Co)\b/gi, match => match.toUpperCase());
  }



  private getFallbackData(url: string, source?: string): ParsedJobData[] {
    const domain = new URL(url).hostname.replace('www.', '');
    const companyName = this.formatCompanyName(domain.split('.')[0]);
    
    const results: ParsedJobData[] = [
      {
        field: 'Source URL',
        value: url,
        confidence: 'high',
        suggestion: 'Original job posting URL'
      }
    ];
    
    if (companyName) {
      results.push({
        field: 'Company Name',
        value: companyName,
        confidence: 'low',
        suggestion: `Extracted from domain (${source || 'Generic'})`
      });
    }
    
    return results;
  }
}

export const urlParsingService = URLParsingService.getInstance();