export class ProxyService {
  private static instance: ProxyService;
  
  public static getInstance(): ProxyService {
    if (!ProxyService.instance) {
      ProxyService.instance = new ProxyService();
    }
    return ProxyService.instance;
  }

  async fetchWithProxy(url: string): Promise<string> {
    try {
      // Try direct fetch first
      const response = await fetch(url, {
        mode: 'cors',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (response.ok) {
        return await response.text();
      }
      
      throw new Error('Direct fetch failed');
    } catch (error) {
      // If direct fetch fails, try with CORS proxy
      return await this.fetchWithCORSProxy(url);
    }
  }

  private async fetchWithCORSProxy(url: string): Promise<string> {
    const proxyUrls = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://cors-anywhere.herokuapp.com/${url}`
    ];

    for (const proxyUrl of proxyUrls) {
      try {
        const response = await fetch(proxyUrl);
        
        if (response.ok) {
          const data = await response.json();
          // Different proxies return data in different formats
          return data.contents || data.data || data;
        }
      } catch (error) {
        console.warn(`Proxy ${proxyUrl} failed:`, error);
        continue;
      }
    }
    
    throw new Error('All proxy attempts failed. Unable to fetch job posting content.');
  }

  // Fallback method for when all proxies fail
  async extractFromURL(url: string): Promise<any> {
    // Extract what we can from the URL structure itself
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    const result: any = {
      domain: urlObj.hostname,
      path: urlObj.pathname,
      params: Object.fromEntries(urlObj.searchParams)
    };

    // Greenhouse-specific URL parsing
    if (url.includes('greenhouse.io')) {
      const companySlug = urlObj.hostname.split('.')[0];
      result.company = this.formatCompanyName(companySlug);
      result.platform = 'Greenhouse';
      
      // Try to extract job ID from URL
      const jobIdMatch = url.match(/jobs\/(\d+)/);
      if (jobIdMatch) {
        result.jobId = jobIdMatch[1];
      }
    }
    
    // LinkedIn-specific URL parsing
    else if (url.includes('linkedin.com')) {
      result.platform = 'LinkedIn';
      const jobIdMatch = url.match(/jobs\/view\/(\d+)/);
      if (jobIdMatch) {
        result.jobId = jobIdMatch[1];
      }
    }
    
    // Indeed-specific URL parsing
    else if (url.includes('indeed.com')) {
      result.platform = 'Indeed';
      const jobKeyMatch = url.match(/jk=([^&]+)/);
      if (jobKeyMatch) {
        result.jobKey = jobKeyMatch[1];
      }
    }

    return result;
  }

  private formatCompanyName(slug: string): string {
    const companyMap: { [key: string]: string } = {
      'qualio': 'Qualio',
      'google': 'Google',
      'microsoft': 'Microsoft',
      'amazon': 'Amazon',
      'meta': 'Meta',
      'netflix': 'Netflix',
      'uber': 'Uber',
      'airbnb': 'Airbnb',
      'stripe': 'Stripe',
      'shopify': 'Shopify'
    };
    
    return companyMap[slug.toLowerCase()] || 
           slug.split('-').map(word => 
             word.charAt(0).toUpperCase() + word.slice(1)
           ).join(' ');
  }
}

export const proxyService = ProxyService.getInstance();