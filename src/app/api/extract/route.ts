import { NextResponse } from 'next/server';
import { parse } from 'node-html-parser';
import * as xml2js from 'xml2js';

interface ProductData {
  url: string;
  title: string;
  price: string;
  description: string;
  images: string[];
  category?: string;
}

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

async function extractProductDetails(url: string): Promise<ProductData | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const html = await response.text();
    const root = parse(html);

    let title = '';
    let price = '';
    let description = '';
    let images: string[] = [];
    let category = '';

    if (url.includes('toptanturkiye.com')) {
      // Product details
      title = root.querySelector('h1.product-name, .product-title, [itemprop="name"]')?.text?.trim() || '';
      price = root.querySelector('.product-price, .price, [itemprop="price"], .current-price')?.text?.trim() || '';
      description = root.querySelector('.product-description, [itemprop="description"], .description-content')?.text?.trim() || '';
      
      // Category breadcrumb
      const categoryElement = root.querySelector('.breadcrumb .category-name, .breadcrumb [itemprop="category"]');
      category = categoryElement?.text?.trim() || '';
      
      // Product images
      const imageElements = root.querySelectorAll('.product-images img, .product-gallery img');
      images = imageElements
        .map(img => img.getAttribute('src'))
        .filter((src): src is string => src !== null)
        .map(src => src.startsWith('http') ? src : `https://toptanturkiye.com${src}`);
    }

    // Clean up the data
    title = title.replace(/\s+/g, ' ').trim();
    price = price.replace(/[^\d.,]/g, '').trim();
    if (price) price = `₺${price}`;
    description = description.replace(/\s+/g, ' ').trim();
    
    return {
      url,
      title: title || 'No title available',
      price: price || 'Price not available',
      description: description || 'No description available',
      images: images.length > 0 ? images : [],
      category: category || 'Uncategorized'
    };
  } catch (error) {
    console.error(`Error extracting product details from ${url}:`, error);
    return null;
  }
}

async function parseSitemapXml(xmlContent: string): Promise<SitemapUrl[]> {
  const parser = new xml2js.Parser({
    explicitArray: false,
    trim: true,
    normalizeTags: true,
    normalize: true
  });
  
  try {
    const result = await parser.parseStringPromise(xmlContent);
    const urlset = result.urlset;
    if (!urlset || !urlset.url) {
      return [];
    }

    // Handle both single URL and array of URLs
    const urls = Array.isArray(urlset.url) ? urlset.url : [urlset.url];
    return urls.map((url: any) => ({
      loc: url.loc,
      lastmod: url.lastmod || '',
      changefreq: url.changefreq || '',
      priority: url.priority || ''
    }));
  } catch (error) {
    console.error('Error parsing sitemap XML:', error);
    return [];
  }
}

async function fetchProductDetails(url: string) {
  try {
    const response = await fetch('/api/parse-product', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch product details');
    }

    const data = await response.json();
    return data.success ? data.product : null;
  } catch (error) {
    console.error('Error fetching product details:', error);
    return null;
  }
}

async function fetchSitemapContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
  }

  return response.text();
}

async function processSitemapUrl(url: string): Promise<string[]> {
  try {
    const response = await fetch(url);
    const xmlContent = await response.text();
    const parser = new xml2js.Parser({ 
      explicitArray: false,
      trim: true,
      normalizeTags: true,
      normalize: true
    });
    const result = await parser.parseStringPromise(xmlContent);
    return extractUrls(result);
  } catch (error) {
    console.error('Error processing sitemap URL:', error);
    return [];
  }
}

function normalizeUrl(url: string) {
  try {
    const normalized = new URL(url).toString();
    return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
  } catch {
    return url;
  }
}

function extractUrls(result: any): string[] {
  const urls: string[] = [];

  // Handle standard sitemap
  if (result.urlset?.url) {
    const urlEntries = Array.isArray(result.urlset.url) ? result.urlset.url : [result.urlset.url];
    urlEntries.forEach(entry => {
      if (entry.loc) {
        urls.push(normalizeUrl(typeof entry.loc === 'string' ? entry.loc : entry.loc._));
      }
    });
  }

  // Handle sitemap index
  if (result.sitemapindex?.sitemap) {
    const sitemaps = Array.isArray(result.sitemapindex.sitemap) 
      ? result.sitemapindex.sitemap 
      : [result.sitemapindex.sitemap];
    sitemaps.forEach(sitemap => {
      if (sitemap.loc) {
        urls.push(normalizeUrl(typeof sitemap.loc === 'string' ? sitemap.loc : sitemap.loc._));
      }
    });
  }

  return urls;
}

function categorizeUrl(url: string): string {
  const lowercaseUrl = url.toLowerCase();
  
  // Check if it's a sitemap URL first
  if (lowercaseUrl.includes('sitemap_product') && lowercaseUrl.endsWith('.xml')) {
    return 'product';
  }

  // Common patterns for different URL types
  const patterns = {
    product: [
      '/urun/',
      '/product/',
      '/p/',
      'product.aspx',
      /pr-\d+\.html$/i,
      /,pr-\d+\.html$/i,
      /\/p-[a-z0-9-]+$/i,
      'sitemap_product'
    ],
    category: [
      '/kategori/',
      '/category/',
      /cat-\d+\.html$/i,
      'sitemap_category'
    ],
    blog: [
      '/blog/',
      '/makale/',
      '/article/',
      '/post/',
      /blog-\d+\.html$/i,
      /\/article\/[\w-]+$/,
      /post-\d+\.html$/i,
      'sitemap_blog'
    ]
  };

  // Check each pattern type
  for (const [type, typePatterns] of Object.entries(patterns)) {
    for (const pattern of typePatterns) {
      if (typeof pattern === 'string' && lowercaseUrl.includes(pattern)) {
        return type;
      } else if (pattern instanceof RegExp && pattern.test(lowercaseUrl)) {
        return type;
      }
    }
  }

  return 'page';
}

const cleanXML = (xmlString: string): string => {
  // Remove invalid characters and fix common XML issues
  return xmlString
    // Remove any null characters
    .replace(/\0/g, '')
    // Fix unclosed tags
    .replace(/<([a-zA-Z]+)([^>]*)\/>/g, '<$1$2></$1>')
    // Remove invalid XML characters
    .replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g, '')
    // Fix attributes without values
    .replace(/(\s+[a-zA-Z-]+)([\s>])/g, '$1=""$2')
    // Remove duplicate xmlns declarations
    .replace(/(xmlns=["'][^"']*["'])\s+\1/g, '$1');
};

const parseSitemapXML = async (xmlString: string) => {
  const parser = new xml2js.Parser({
    trim: true,
    explicitArray: false,
    normalizeTags: true,
    normalize: true,
    attrkey: 'attributes',
    tagNameProcessors: [
      (name) => name.toLowerCase(),
    ],
    attrNameProcessors: [
      (name) => name.toLowerCase(),
    ],
    valueProcessors: [
      (value) => value?.trim(),
    ],
    strict: false,
  });

  try {
    // Clean the XML before parsing
    const cleanedXML = cleanXML(xmlString);
    const result = await parser.parseStringPromise(cleanedXML);
    return result;
  } catch (error) {
    console.error('XML Parsing Error:', error);
    throw new Error(`Failed to parse sitemap: ${error.message}`);
  }
};

const extractUrlsFromSitemap = (sitemapData: any): any[] => {
  if (!sitemapData) return [];

  // Handle sitemap index files
  if (sitemapData.sitemapindex) {
    const sitemaps = Array.isArray(sitemapData.sitemapindex.sitemap)
      ? sitemapData.sitemapindex.sitemap
      : [sitemapData.sitemapindex.sitemap];

    return sitemaps.map((sitemap: any) => ({
      loc: sitemap.loc,
      lastmod: sitemap.lastmod,
      type: 'sitemap'
    }));
  }

  // Handle regular sitemap files
  if (sitemapData.urlset) {
    const urls = Array.isArray(sitemapData.urlset.url)
      ? sitemapData.urlset.url
      : [sitemapData.urlset.url];

    return urls.map((url: any) => ({
      loc: url.loc,
      lastmod: url.lastmod,
      changefreq: url.changefreq,
      priority: url.priority,
    }));
  }

  return [];
};

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SitemapScanner/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    let content = await response.text();

    // Handle gzipped content
    if (contentType.includes('gzip')) {
      const buffer = Buffer.from(content);
      content = buffer.toString();
    }

    try {
      const sitemapData = await parseSitemapXML(content);
      const urls = extractUrlsFromSitemap(sitemapData);

      if (!urls || urls.length === 0) {
        return NextResponse.json({
          error: 'No URLs found in sitemap',
          urls: [],
          isSitemapIndex: false
        });
      }

      return NextResponse.json({
        urls,
        isSitemapIndex: !!sitemapData.sitemapindex,
        currentUrl: url
      });
    } catch (parseError) {
      console.error('Sitemap parsing error:', parseError);
      
      // Try alternate parsing method for malformed XML
      try {
        const root = parse(content);
        const urls = root.querySelectorAll('url, sitemap').map(urlNode => {
          const loc = urlNode.querySelector('loc')?.textContent?.trim();
          const lastmod = urlNode.querySelector('lastmod')?.textContent?.trim();
          const changefreq = urlNode.querySelector('changefreq')?.textContent?.trim();
          const priority = urlNode.querySelector('priority')?.textContent?.trim();
          
          return {
            loc,
            lastmod,
            changefreq,
            priority,
          };
        }).filter(url => url.loc);

        if (urls.length > 0) {
          return NextResponse.json({
            urls,
            isSitemapIndex: content.toLowerCase().includes('sitemapindex'),
            currentUrl: url,
            parsingMethod: 'fallback'
          });
        }
      } catch (fallbackError) {
        console.error('Fallback parsing error:', fallbackError);
      }

      return NextResponse.json({
        error: `Failed to parse sitemap: ${parseError.message}`,
        urls: [],
        isSitemapIndex: false
      }, { status: 422 });
    }
  } catch (error) {
    console.error('Request error:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error',
      urls: [],
      isSitemapIndex: false
    }, { status: 500 });
  }
}

export async function POST_parseSitemap(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Fetch sitemap XML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sitemap');
    }

    const xmlContent = await response.text();
    const sitemapUrls = await parseSitemapXml(xmlContent);

    // For product sitemaps, we'll return all URLs with their metadata
    const isSitemapProduct = url.toLowerCase().includes('sitemap_product');

    return NextResponse.json({
      success: true,
      isSitemapProduct,
      urls: sitemapUrls,
      stats: {
        total: sitemapUrls.length
      }
    });

  } catch (error) {
    console.error('Error processing sitemap:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process sitemap'
      },
      { status: 500 }
    );
  }
}
