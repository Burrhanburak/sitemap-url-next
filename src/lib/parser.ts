import { parse } from 'node-html-parser';
import xml2js from 'xml2js';

// Rate limiting queue
class RequestQueue {
  private queue: Map<string, Promise<any>>;
  private processing: Set<string>;
  private lastRequestTime: number;
  private minDelay: number;
  private retryDelay: number;
  private maxRetries: number;

  constructor() {
    this.queue = new Map();
    this.processing = new Set();
    this.lastRequestTime = 0;
    this.minDelay = 2000; // 2 seconds between requests
    this.retryDelay = 5000; // 5 seconds initial retry delay
    this.maxRetries = 5;
  }

  async enqueue<T>(url: string, fn: () => Promise<T>): Promise<T> {
    while (this.processing.has(url)) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processing.add(url);
    let lastError;
    let delay = this.retryDelay;

    try {
      for (let attempt = 0; attempt < this.maxRetries; attempt++) {
        try {
          // Ensure minimum delay between requests
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          if (timeSinceLastRequest < this.minDelay) {
            await new Promise(resolve => setTimeout(resolve, this.minDelay - timeSinceLastRequest));
          }

          this.lastRequestTime = Date.now();
          const result = await fn();
          return result;
        } catch (error) {
          lastError = error;
          console.error(`Attempt ${attempt + 1} failed for ${url}:`, error);

          if (error instanceof Error && error.message.includes('429')) {
            // Rate limited - use exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * 2, 30000); // Max delay of 30 seconds
          } else if (attempt < this.maxRetries - 1) {
            // Other error - use shorter delay
            await new Promise(resolve => setTimeout(resolve, this.minDelay));
          }
        }
      }
      throw lastError;
    } finally {
      this.processing.delete(url);
    }
  }
}

const requestQueue = new RequestQueue();

export interface ParsedUrl {
  loc: string;
  lastmod?: string;
  type: 'product' | 'category' | 'blog' | 'page';
  data?: {
    title?: string;
    price?: string;
    description?: string;
    images?: string[];
    categories?: string[];
    author?: string;
    publishDate?: string;
    productId?: string;
    sku?: string;
    inStock?: boolean;
  };
}

interface SitemapData {
  urls: Record<string, ParsedUrl[]>;
  stats: {
    total: number;
    byType: Record<string, number>;
  };
}

async function fetchWithTimeout(url: string, timeout = 30000) {
  return requestQueue.enqueue(url, async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  });
}

async function extractProductDetails(url: string): Promise<Partial<ParsedUrl['data']>> {
  try {
    const response = await fetchWithTimeout(url);
    const html = await response.text();
    const root = parse(html);

    const data: Partial<ParsedUrl['data']> = {};
    
    data.title = root.querySelector('h1')?.text.trim() ||
                 root.querySelector('[itemprop="name"]')?.text.trim() ||
                 root.querySelector('title')?.text.trim();

    const priceElement = root.querySelector('[itemprop="price"]') ||
                        root.querySelector('.price') ||
                        root.querySelector('[data-price]');
    if (priceElement) {
      data.price = priceElement.text.trim().replace(/[^\d.,]/g, '');
    }

    data.description = root.querySelector('[itemprop="description"]')?.text.trim() ||
                      root.querySelector('.product-description')?.text.trim() ||
                      root.querySelector('meta[name="description"]')?.getAttribute('content');

    const images = new Set<string>();
    root.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src') || img.getAttribute('data-src');
      if (src && (src.includes('product') || src.includes('images'))) {
        images.add(src.startsWith('http') ? src : new URL(src, url).href);
      }
    });
    data.images = Array.from(images);

    data.productId = root.querySelector('[itemprop="productID"]')?.getAttribute('content') ||
                    root.querySelector('[data-product-id]')?.getAttribute('data-product-id');
    
    data.sku = root.querySelector('[itemprop="sku"]')?.text.trim();
    
    const stockElement = root.querySelector('[itemprop="availability"]');
    if (stockElement) {
      data.inStock = stockElement.getAttribute('href')?.includes('InStock') || 
                    stockElement.text.toLowerCase().includes('in stock');
    }

    return data;
  } catch (error) {
    console.error(`Error extracting product details from ${url}:`, error);
    return {};
  }
}

async function extractCategoryDetails(url: string): Promise<Partial<ParsedUrl['data']>> {
  try {
    const response = await fetchWithTimeout(url);
    const html = await response.text();
    const root = parse(html);

    return {
      title: root.querySelector('h1')?.text.trim() ||
             root.querySelector('title')?.text.trim(),
      description: root.querySelector('meta[name="description"]')?.getAttribute('content') ||
                  root.querySelector('.category-description')?.text.trim()
    };
  } catch (error) {
    console.error(`Error extracting category details from ${url}:`, error);
    return {};
  }
}

async function extractBlogDetails(url: string): Promise<Partial<ParsedUrl['data']>> {
  try {
    const response = await fetchWithTimeout(url);
    const html = await response.text();
    const root = parse(html);

    return {
      title: root.querySelector('h1')?.text.trim() ||
             root.querySelector('title')?.text.trim(),
      description: root.querySelector('meta[name="description"]')?.getAttribute('content') ||
                  root.querySelector('article p')?.text.trim(),
      author: root.querySelector('[itemprop="author"]')?.text.trim() ||
              root.querySelector('.author')?.text.trim(),
      publishDate: root.querySelector('[itemprop="datePublished"]')?.getAttribute('content') ||
                  root.querySelector('.published-date')?.text.trim()
    };
  } catch (error) {
    console.error(`Error extracting blog details from ${url}:`, error);
    return {};
  }
}

function detectUrlType(url: string): ParsedUrl['type'] {
  const lowercaseUrl = url.toLowerCase();
  
  if (lowercaseUrl.includes('product') || 
      lowercaseUrl.includes('/p/') || 
      lowercaseUrl.match(/\/[pd]\d+/)) {
    return 'product';
  }
  
  if (lowercaseUrl.includes('category') || 
      lowercaseUrl.includes('/c/') || 
      lowercaseUrl.includes('collection')) {
    return 'category';
  }
  
  if (lowercaseUrl.includes('blog') || 
      lowercaseUrl.includes('article') || 
      lowercaseUrl.includes('post')) {
    return 'blog';
  }
  
  return 'page';
}

function extractUrlsFromXml(xmlData: any): { loc: string; lastmod?: string }[] {
  const urls: { loc: string; lastmod?: string }[] = [];

  if (xmlData.urlset?.url) {
    xmlData.urlset.url.forEach((entry: any) => {
      if (entry.loc) {
        urls.push({
          loc: Array.isArray(entry.loc) ? entry.loc[0] : entry.loc,
          lastmod: entry.lastmod ? (Array.isArray(entry.lastmod) ? entry.lastmod[0] : entry.lastmod) : undefined
        });
      }
    });
  }

  if (xmlData.sitemapindex?.sitemap) {
    xmlData.sitemapindex.sitemap.forEach((entry: any) => {
      if (entry.loc) {
        urls.push({
          loc: Array.isArray(entry.loc) ? entry.loc[0] : entry.loc,
          lastmod: entry.lastmod ? (Array.isArray(entry.lastmod) ? entry.lastmod[0] : entry.lastmod) : undefined
        });
      }
    });
  }

  return urls;
}

export async function parseSitemap(url: string, scanType: 'basic' | 'advanced' = 'basic'): Promise<SitemapData> {
  const urls: Record<string, ParsedUrl[]> = {
    product: [],
    category: [],
    blog: [],
    page: []
  };

  try {
    // Normalize the URL
    const sitemapUrl = url.endsWith('sitemap.xml') ? url : `${url}/sitemap.xml`;
    
    // Fetch the sitemap with a shorter timeout
    const response = await fetchWithTimeout(sitemapUrl, 15000);
    const content = await response.text();
    
    let sitemapUrls: { loc: string; lastmod?: string }[] = [];

    if (content.trim().startsWith('<?xml')) {
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(content);
      sitemapUrls = extractUrlsFromXml(result);
      
      if (sitemapUrls.length === 0) {
        throw new Error('No URLs found in sitemap');
      }

      // Limit the number of URLs to process
      if (sitemapUrls.length > 100) {
        console.log(`Limiting sitemap to first 100 URLs out of ${sitemapUrls.length}`);
        sitemapUrls = sitemapUrls.slice(0, 100);
      }
    } else {
      try {
        const jsonData = JSON.parse(content);
        sitemapUrls = Array.isArray(jsonData) ? jsonData : jsonData.urls || [];
        
        // Limit JSON URLs too
        if (sitemapUrls.length > 100) {
          sitemapUrls = sitemapUrls.slice(0, 100);
        }
      } catch (e) {
        throw new Error('Invalid sitemap format. Must be XML or JSON.');
      }
    }

    // Process URLs in parallel batches
    const batchSize = 5;
    for (let i = 0; i < sitemapUrls.length; i += batchSize) {
      const batch = sitemapUrls.slice(i, i + batchSize);
      const batchPromises = batch.map(async (entry) => {
        try {
          const type = detectUrlType(entry.loc);
          let data = {};

          if (scanType === 'advanced') {
            try {
              switch (type) {
                case 'product':
                  data = await extractProductDetails(entry.loc);
                  break;
                case 'category':
                  data = await extractCategoryDetails(entry.loc);
                  break;
                case 'blog':
                  data = await extractBlogDetails(entry.loc);
                  break;
              }
            } catch (error) {
              console.error(`Failed to extract details for ${entry.loc}:`, error);
              // Continue with empty data on error
            }
          }

          return {
            loc: entry.loc,
            lastmod: entry.lastmod,
            type,
            data
          };
        } catch (error) {
          console.error(`Failed to process URL ${entry.loc}:`, error);
          return null;
        }
      });

      const results = await Promise.all(batchPromises);
      
      // Filter out failed URLs and add to appropriate category
      results.forEach(result => {
        if (result) {
          urls[result.type].push(result);
        }
      });

      // Add a small delay between batches
      if (i + batchSize < sitemapUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const stats = {
      total: Object.values(urls).reduce((sum, arr) => sum + arr.length, 0),
      byType: Object.fromEntries(
        Object.entries(urls).map(([type, arr]) => [type, arr.length])
      )
    };

    return { urls, stats };
  } catch (error) {
    console.error('Sitemap parsing error:', error);
    throw new Error(`Failed to parse sitemap: ${error.message}`);
  }
}
