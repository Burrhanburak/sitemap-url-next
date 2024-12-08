import { NextResponse } from 'next/server';
import { parseSitemap } from '@/lib/parser';

// Create a request queue to limit concurrent requests
class RequestQueue {
  private queue: Map<string, Promise<any>>;
  private processing: Set<string>;
  private maxConcurrent: number;
  private delay: number;

  constructor(maxConcurrent = 3, delay = 1000) {
    this.queue = new Map();
    this.processing = new Set();
    this.maxConcurrent = maxConcurrent;
    this.delay = delay;
  }

  async add<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Wait if too many requests are processing
    while (this.processing.size >= this.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Add delay between requests
    if (this.processing.size > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    this.processing.add(key);

    try {
      const result = await fn();
      return result;
    } finally {
      this.processing.delete(key);
    }
  }
}

const requestQueue = new RequestQueue(3, 1000); // Max 3 concurrent requests, 1 second delay

async function fetchWithRetry(url: string, maxRetries = 3): Promise<string> {
  let lastError;
  let currentDelay = 2000; // Start with 2 second delay

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/xml,application/xml,application/xhtml+xml,text/html;q=0.9',
    'Accept-Language': 'en-US,en;q=0.5',
  };

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(url, { 
          headers,
          signal: controller.signal
        });
        
        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Rate limited');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        return text;
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      lastError = error;
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay = Math.min(currentDelay * 1.5, 10000); // Max 10 second delay
    }
  }
  throw lastError;
}

async function processSitemap(url: string, processedUrls = new Set<string>()): Promise<string[]> {
  try {
    if (processedUrls.has(url)) {
      console.log('Skipping already processed URL:', url);
      return [];
    }
    processedUrls.add(url);

    console.log('Fetching sitemap:', url);
    const xml = await fetchWithRetry(url);
    const result = await xml2js.parseStringPromise(xml);

    let urls: string[] = [];

    // Handle sitemap index
    if (result.sitemapindex?.sitemap) {
      console.log('Found sitemap index');
      const sitemapUrls = result.sitemapindex.sitemap.map((sitemap: any) => {
        const loc = Array.isArray(sitemap.loc) ? sitemap.loc[0] : sitemap.loc;
        return typeof loc === 'string' ? loc : loc?._;
      });

      // Process nested sitemaps with delay between each
      for (const sitemapUrl of sitemapUrls) {
        if (sitemapUrl) {
          const nestedUrls = await processSitemap(sitemapUrl, processedUrls);
          urls.push(...nestedUrls);
          // Add delay between processing nested sitemaps
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    // Handle regular sitemap
    else if (result.urlset?.url) {
      console.log('Found regular sitemap');
      const pageUrls = result.urlset.url.map((entry: any) => {
        const loc = Array.isArray(entry.loc) ? entry.loc[0] : entry.loc;
        return typeof loc === 'string' ? loc : loc?._;
      });
      urls.push(...pageUrls.filter(Boolean));
    }

    return urls;
  } catch (error) {
    console.error('Error processing sitemap:', error);
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const { url, scanType = 'basic' } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Add overall timeout for the entire operation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const result = await Promise.race([
        parseSitemap(url, scanType),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timed out')), 30000)
        )
      ]);
      
      return NextResponse.json(result);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Error processing sitemap:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process sitemap' },
      { status: 500 }
    );
  }
}
